import { Worker } from "bullmq";
import {prisma} from "./db.js"
import { queueConnection } from "./queue.js";

const worker=new Worker(
  "clicks",
  async (job)=>{
    await prisma.link.update({
      where:{code:job.data.code},
      data:{clicks:{increment:1}}
    })
  },{
    connection: queueConnection,concurrency:10
  }
)

worker.on("failed",(job,err)=>console.error(`click ${job?.data.code} failed:`,err.message));
console.log("Click worker started")
async function shutdown() {
  console.log("Worker finishing current jobs...");
  await worker.close();        // finish jobs in progress, take no new ones
  await prisma.$disconnect();  // close the filing cabinet
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);