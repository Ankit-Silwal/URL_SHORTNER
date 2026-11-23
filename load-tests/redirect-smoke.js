import http from "k6/http"
import {check,sleep} from 'k6'

export const options={
  vus:1,
  iterations: 10,
  thresholds: {
    checks: ['rate==1'],
  },
}

export default function(){
  const response=http.get('http://localhost:8080/6ludPGf',{
    redirects: 0,
  })
  check(response,{
    'short link returns 302':(res)=>res.status===302,
  })
  sleep(1)
}