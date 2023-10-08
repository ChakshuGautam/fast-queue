import { Queue } from './queue';

const file = Bun.file("request.queue.txt");
const writer = file.writer({ highWaterMark: 1024 * 1024 });
const stream = await file.stream();
const bufferSize = 100000;
const port = 8080;
const defaultTopic = "default";
let index = 0;
let offset = 0;
const topics = {};

const enqueue = (topic, data) => {
    index += 1;
    writer.write(data + "\n");
    if (!topics[topic]) {
        topics[topic] = new Queue();
    }
    topics[topic].enqueue(data);
}

const dequeue = (topic) => {
    offset += 1;
    if (topics[topic]) {
        return topics[topic].dequeue();
    }
}

Bun.serve({
    port: port,
    development: true,
    async fetch(req) {
        const url = new URL(req.url);
        // To specify a topic: curl http://HOST:PORT/[TOPIC]
        // If a [TOPIC] is not specified a `default` topic is used.
        const matched = url.pathname.match(RegExp("\/([^/]+)"));
        if (req.method === "POST") {
            const data = `${req.method} ${req.url} ${index}`;
            enqueue(matched ? matched[1] : defaultTopic, data);
            return new Response("ack");
        }
        else if (req.method === "GET") {
            let data = dequeue(matched ? matched[1] : defaultTopic);
            return new Response(data);
        }
        return new Response("404!");
    },
});

console.log(`Listening on port ${port}`);
