import "dotenv/config"
import { Queue } from "bullmq";


const url=new URL(process.env.REDIS_URL?? "redis://localhost:6379")
export const queueConnection={
  host:url.hostname,
  port:Number(url.port||6379)
};

export const clickQueue=new Queue("clicks",{
  connection: queueConnection,
  defaultJobOptions:{
    attempts: 3,
    removeOnComplete: true,
    removeOnFail: 1000
  }
})