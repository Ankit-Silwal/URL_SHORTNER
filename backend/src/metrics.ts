import client from "prom-client"
import type {Request,Response,NextFunction} from "express";

export const register=new client.Registry();
client.collectDefaultMetrics({
  register
});  //free stuff:CPU,memory,event loop

const httpRequests=new client.Counter({  //counter add one for each response that finishes
  name:"http_requests_total",
  help: "How many request we answered",
  labelNames:["method","route","status"],
  registers:[register]
});

const httpDuration=new client.Histogram({    //for the duration record how long response take by counting against threadhols
  name:"http_request_duration_seconds",
  help: "How long requests took",
  labelNames: ["method","route","status"],
  buckets: [0.005,0.01,0.025,0.05,0.1,0.25,0.5,1], //setting threshold for seconds from 5 milsec to 1 sec
  //  12ms coutn towards 25ms and everylarger in here not 0.01 (10 ms)
  registers: [register],
})

export function metrics(req:Request,res:Response,next:NextFunction){
  const end=httpDuration.startTimer();
  res.on("finish",()=>{
    const labels={
      method: req.method,
      route: req.route?.path?? "unmatched",
      status: String(res.statusCode),
    };
    httpRequests.inc(labels);
    end(labels);
  })
  next();
}