import { describe, it, expect } from "bun:test";
import { Queue } from "../queue";

describe("queue", () => {
    it("queue works as expected", () => {
        const q = Queue();
        const outputLog = [];
        const testData = [1, 2, 3, 4, 5];
        q.enqueue(testData[0]);
        q.enqueue(testData[1]);
        outputLog.push(q.dequeue());
        q.enqueue(testData[2]);
        outputLog.push(q.dequeue());
        q.enqueue(testData[3]);
        outputLog.push(q.dequeue());
        q.enqueue(testData[4]);
        outputLog.push(q.dequeue());
        outputLog.push(q.dequeue());
        expect(testData).toStrictEqual(outputLog);
    })

    it("queue underflow test", () => {
        const q = Queue();
        expect(q.dequeue()).toBe(undefined);
        q.enqueue(1);
        q.enqueue(2);
        expect(q.dequeue()).toBe(1);
        expect(q.dequeue()).toBe(2);
        expect(q.dequeue()).toBe(undefined);
    })
})
