import express from "express";
import { randomInt } from "node:crypto";
import { hostname } from "node:os";
import { prisma } from "./db.js";
import { Prisma } from "./generated/prisma/client.js";
import { redis } from "./cache.js";
import { rateLimit } from "./rate_limit.js";
import { clickQueue } from "./queue.js";

const app = express();
// One proxy (Next.js now, nginx later) sits in front of us: trust its
// X-Forwarded-For header so req.ip is the real user, not the proxy.
app.set("trust proxy", 1);
// Don't advertise "X-Powered-By: Express" to attackers.
app.disable("x-powered-by");
const PORT = Number(process.env.PORT ?? 4000);

// Which copy of the api answered? In Docker, hostname() is the container ID,
// so with 2 copies (Step 6) you'll see 2 different values.
const INSTANCE = hostname();
app.use((_req, res, next) => {
  res.set("X-Instance", INSTANCE);
  next();
});

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CODE_LENGTH = 7;

function generateCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return code;
}

function isValidUrl(input: unknown): input is string {
  if (typeof input !== "string" || input.length > 2048) return false;
  try {
    const url = new URL(input);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

app.use(express.json({ limit: "10kb" }));

function isDuplicateCode(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

app.post("/shorten", rateLimit, async (req, res) => {
  const url = req.body?.url;
  if (!isValidUrl(url)) {
    res.status(400).json({ error: "Please send a valid http(s) URL" });
    return;
  }
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    try {
      await prisma.link.create({ data: { code, url } });
      res.status(201).json({ code, shortUrl: `${req.protocol}://${req.get("host")}/${code}` });
      return;
    } catch (err) {
      if (!isDuplicateCode(err)) throw err;
    }
  }
  res.status(500).json({ error: "Could not generate a unique code, try again" });
});

app.get("/health",(_req,res)=>{
  res.json({
    status:"ok"
  })
})

app.get("/ready",async (_req,res)=>{
  try{
    await prisma.$queryRaw`Select 1`;
    await redis.ping();
    res.json({
      status:"ready"
    });
  }catch{
    res.status(503).json({
      status:"Not ready"
    })
  }
})

app.get("/:code",async (req,res)=>{
  const code=req.params.code
  const key=`link:${code}`;
  const cached=await redis.get(key).catch(()=>null);
  if(cached){
    res.set("X-Cache","HIT");
    clickQueue.add("click",{code}).catch(()=>{})
    res.redirect(302,cached);
    return;
  }
  const link=await prisma.link.findUnique({
    where:{code},
    select:{url:true},
  });
  if(!link){
    res.status(404).json({
      error:"Link not found"
    })
    return;
  }
  redis.set(key,link.url,"EX",3600).catch(()=>{});
  res.set("X-Cache","MISS")
  clickQueue.add("click",{code}).catch(()=>{})
  res.redirect(302,link.url);
})
app.get("/stats/:code",async (req,res)=>{
  const link=await prisma.link.findUnique({
    where:{code:req.params.code},
    select: {code:true,url:true,clicks:true,createdAt:true}
  })
  if(!link){
    res.status(404).json({
      error:"Link not found"
    })
    return;
  }
  res.json(link);
})
const server=app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
//Graceful shutdown thus it would complete the incoming request but reject the new ones
function shutDown(signal:string){
  console.log(`${signal} received,finishing requests....`);
  //if we're stuck even after 10 s we give up and leave
  setTimeout(()=>process.exit(1),10000);// no .unref() needed: process.exit(0) below ends the app anyway
  server.close(async ()=>{         // server.close =>Stop the new ones wait for the current one
    await clickQueue.close();       //close the slip box
    await redis.quit();     // putt away the redis 
    await prisma.$disconnect();   //close the database
    console.log("Bye fucker");
    process.exit(0);
  })
}

process.on("SIGTERM",()=>shutDown("SIGTERM")); //Docker is asking like when we did docker compose down 
process.on("SIGINT",()=>shutDown("SIGINT"));  //wer  pressed ctrl+c

//shit like SIGKILL also exist which is ran after 10 sec 