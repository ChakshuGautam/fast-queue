<h1 align="center">fast-queue</h1>

A fast queue served over HTTP. Able to ingest and serve upto 120k messages per second.

## Usage
You will need to install [bun](https://bun.sh/docs/installation). 


Start the server
```bash
bun server.js
```

Send messages to the server
```bash
wrk http://localhost:8080/
```

See the requests stored in the queue file - `request.queue.txt`

## Benchmark Response

```bash
fast-serve wrk http://localhost:8080/
Running 10s test @ http://localhost:8080/
  2 threads and 10 connections
  Thread Stats   Avg      Stdev     Max   +/- Stdev
    Latency    87.50us  102.93us   4.03ms   96.61%
    Req/Sec    60.67k     2.08k   63.39k    93.56%
  1219435 requests in 10.10s, 146.53MB read
Requests/sec: 120735.64
Transfer/sec:     14.51MB
```