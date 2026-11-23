# Redirect load test results

November 23, 2026, on the local Windows and Docker Desktop stack.

| API replicas | Virtual users | Run time (IST) | Attempts | HTTP 302 | Failures | Failure rate | Attempts/sec | Successful redirects/sec | Successful p95 | Threshold |
| ---: | ---: | :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | :--- |
| 4 | 500 | 20:53:56 to 20:55:27 | 45,000 | 44,711 | 289 | 0.64% | 495.27 | 492.09 | 12.59 ms | Failed (exit 99) |
| 8 | 500 | 20:56:19 to 20:57:50 | 45,000 | 44,656 | 344 | 0.76% | 495.11 | 491.33 | 16.57 ms | Failed (exit 99) |

| Test detail | Observation |
| :--- | :--- |
| Workload | k6 2.3.0 ran `load-tests/redirect-load.js` at 500 concurrent users for 90 seconds per configuration. Each user requested `http://localhost:8080/6ludPGf`, checked for HTTP 302, and slept for one second. |
| Preflight | Before each run, Docker reported all requested replicas healthy, Prometheus showed all targets up, and nginx reached every replica. A warm-up request returned 302. |
| Failure location | k6 logged 289 TCP connection refusals with four replicas and 344 with eight. All occurred within the first two seconds at `127.0.0.1:8080`, before an HTTP response. The component that refused the connections remains unverified. |
| Comparison | Four replicas delivered 492.09 successful redirects/sec versus 491.33 with eight. Successful-response p95 was 3.97 ms higher with eight. This is one run per configuration with a single cached link and client pacing near 500 attempts/sec. |
| 1,000-user run | Skipped because both 500-user tests missed the 100% HTTP 302 threshold. |
| After testing | Restored the original two replicas, confirmed both Prometheus targets were up, and verified that nginx served `/api/health` successfully. |
