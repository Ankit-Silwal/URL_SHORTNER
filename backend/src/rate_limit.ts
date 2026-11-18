import type { Request,Response,NextFunction } from "express";
import { redis } from "./cache.js";

const LIMIT=10;
const WINDOW_SECONDS=60;

export async function rateLimit(req:Request,res:Response,next:NextFunction){
  const now=Math.floor(Date.now()/1000);
  const window=Math.floor(now/WINDOW_SECONDS);
  const key=`rate:${req.ip}:${window}`
  try{
    const count=await redis.incr(key);
    if(count===1){
      await redis.expire(key,WINDOW_SECONDS)
      res.set("X-RateLimit-Limit",String(LIMIT));
      res.set("X-RateLimit-Remaining",String(Math.max(0,LIMIT-count)));
      if(count>LIMIT){
        res.set("Retry-After",String(WINDOW_SECONDS-(now%WINDOW_SECONDS)));
        res.status(429).json({
          error:"Too many links ,slow down bitch "
        })
      }
    }
  }
}