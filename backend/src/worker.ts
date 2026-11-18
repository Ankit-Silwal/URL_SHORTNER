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