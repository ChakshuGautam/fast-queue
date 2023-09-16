const file = Bun.file("request.queue.txt");
const writer = file.writer({ highWaterMark: 1024 * 1024 });
let index = 0;

Bun.serve({
    port: 8080,
    development: true,
    fetch(req) {
        const url = new URL(req.url);
        if (url.pathname === "/") {
            index += 1;
            writer.write(`${req.method} ${req.url} ${index}\n`);
            return new Response("ack");
        }
        return new Response("404!");
    },
});