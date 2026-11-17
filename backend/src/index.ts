import express from "express";
import { randomInt } from "node:crypto";
import path from "node:path";
import { prisma } from "./db.js";
import { Prisma } from "./generated/prisma/client.js";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

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

app.use(express.static(path.join(import.meta.dirname, "../../frontend")));

function isDuplicateCode(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

app.post("/shorten", async (req, res) => {
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

app.get("/:code", async (req, res) => {
  const link = await prisma.link.findUnique({
    where: { code: req.params.code },
    select: { url: true },
  });
  if (!link) {
    res.status(404).json({ error: "Link not found" });
    return;
  }
  res.redirect(302, link.url);
});

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
