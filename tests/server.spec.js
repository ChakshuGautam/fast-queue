import { describe, it, expect } from 'bun:test';
import '../server';

describe("server", () => {
    it("enqueue and dequeue work as expected with topics", async () => {
        const outputLog = {
            topic1: [],
            topic2: [],
            topic3: [],
        };
        const port = 8080;
        await fetch(`http://localhost:${port}/topic1`, {method: 'POST'});
        await fetch(`http://localhost:${port}/topic1`, {method: 'POST'});
        await fetch(`http://localhost:${port}/topic2`, {method: 'POST'});
        await fetch(`http://localhost:${port}/topic3`, {method: 'POST'});
        await fetch(`http://localhost:${port}/topic2`, {method: 'POST'});
        outputLog['topic1'].push(await (await fetch(`http://localhost:${port}/topic1`)).text());
        outputLog['topic1'].push(await (await fetch(`http://localhost:${port}/topic1`)).text());
        outputLog['topic2'].push(await (await fetch(`http://localhost:${port}/topic2`)).text());
        outputLog['topic2'].push(await (await fetch(`http://localhost:${port}/topic2`)).text());
        outputLog['topic3'].push(await (await fetch(`http://localhost:${port}/topic3`)).text());
        expect(outputLog)
        .toStrictEqual(
            {
                topic1: [
                    `POST http://localhost:${port}/topic1 0`,
                    `POST http://localhost:${port}/topic1 1`,
                ],
                topic2: [
                    `POST http://localhost:${port}/topic2 2`,
                    `POST http://localhost:${port}/topic2 4`,
                ],
                topic3: [
                    `POST http://localhost:${port}/topic3 3`,
                ],
            }
        );
    })
})
