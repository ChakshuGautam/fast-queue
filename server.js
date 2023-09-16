const { Queue } = require('./queue');

const file = Bun.file("request.queue.txt");
const writer = file.writer({ highWaterMark: 1024 * 1024 });
const stream = await file.stream();
const bufferSize = 100000;
let index = 0;
let offset = 0;
let q = new Queue();

Bun.serve({
    port: 8080,
    development: true,
    async fetch(req) {
        const url = new URL(req.url);

        if (url.pathname === "/") {
            index += 1;
            const data = `${req.method} ${req.url} ${index}`;
            writer.write(data + "\n");
            q.enqueue(data);
            return new Response("ack");
        }
        if (url.pathname === "/next") {
            offset += 1;
            return new Response(q.dequeue());
        }
        return new Response("404!");
    },
});
