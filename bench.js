import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';

const LUA_POST_BENCH = `
local counter = 0
local random = math.random

function generate_large_array(size)
    local items = {}
    for i = 1, size do
        items[i] = string.format([["item-%d-%d"]], random(1000), random(1000))
    end
    return table.concat(items, ",")
end

function generate_nested_object(depth, width)
    if depth <= 0 then
        return string.format([["value-%d"]], random(1000))
    end
    
    local parts = {}
    for i = 1, width do
        parts[i] = string.format([["field-%d":%s]], 
            i, 
            depth == 1 and string.format([["value-%d"]], random(1000)) or generate_nested_object(depth - 1, width)
        )
    end
    return "{" .. table.concat(parts, ",") .. "}"
end

function generate_payload()
    -- Generate a large JSON payload (~500KB)
    local array_items = generate_large_array(1000)  -- 1000 array items
    local nested = generate_nested_object(4, 10)    -- 4 levels deep, 10 items wide
    
    return string.format([[
        {
            "id": %d,
            "timestamp": %d,
            "message": "test-%d",
            "metadata": {
                "source": "benchmark",
                "version": "1.0",
                "type": "large-payload",
                "tags": [%s]
            },
            "data": {
                "value": %d,
                "items": [%s],
                "nested": %s,
                "additionalData": {
                    "array1": [%s],
                    "array2": [%s],
                    "object1": %s,
                    "object2": %s
                }
            }
        }
    ]], 
    counter, 
    os.time(), 
    random(1000),
    generate_large_array(50),      -- 50 tags
    random(1000),
    array_items,                   -- 1000 items
    nested,                        -- nested object 4 levels deep
    generate_large_array(500),     -- 500 more items
    generate_large_array(500),     -- another 500 items
    generate_nested_object(3, 5),  -- 3 levels, 5 items wide
    generate_nested_object(3, 5)   -- another nested object
    )
end

function request()
    counter = counter + 1
    local headers = {}
    headers["Content-Type"] = "application/json"
    local body = generate_payload()
    return wrk.format("POST", "/", headers, body)
end
`;

const LUA_MIXED_BENCH = `
local counter = 0
local random = math.random

function generate_payload()
    return string.format([[
        {
            "id": %d,
            "timestamp": %d,
            "data": "test-%d"
        }
    ]], counter, os.time(), random(1000))
end

function request()
    counter = counter + 1
    if counter % 2 == 0 then
        local headers = {}
        headers["Content-Type"] = "application/json"
        local body = generate_payload()
        return wrk.format("POST", "/", headers, body)
    else
        return wrk.format("GET", "/next")
    end
end
`;

async function runCommand(command, args) {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, args);
        let output = '';

        proc.stdout.on('data', (data) => {
            output += data.toString();
            console.log(data.toString());
        });

        proc.stderr.on('data', (data) => {
            console.error(data.toString());
        });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve(output);
            } else {
                reject(new Error(`Command failed with code ${code}`));
            }
        });
    });
}

async function ensureServer() {
    try {
        await fetch('http://localhost:8080/');
    } catch {
        console.log('Starting server...');
        spawn('bun', ['server.js'], { stdio: 'inherit' });
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}

async function runBenchmarks() {
    try {
        await ensureServer();

        // Write benchmark Lua scripts
        writeFileSync('post_bench.lua', LUA_POST_BENCH);
        writeFileSync('mixed_bench.lua', LUA_MIXED_BENCH);

        console.log('\n=== POST Request Benchmark (10s) ===');
        await runCommand('wrk', [
            '-t2',
            '-c10',
            '-d10s',
            '-s', 'post_bench.lua',
            'http://localhost:8080/'
        ]);

        // console.log('\n=== High Concurrency POST Benchmark (30s) ===');
        // await runCommand('wrk', [
        //     '-t4',
        //     '-c100',
        //     '-d30s',
        //     '-s', 'post_bench.lua',
        //     'http://localhost:8080/'
        // ]);

        // console.log('\n=== Mixed Operations Benchmark (20s) ===');
        // await runCommand('wrk', [
        //     '-t2',
        //     '-c20',
        //     '-d20s',
        //     '-s', 'mixed_bench.lua',
        //     'http://localhost:8080/'
        // ]);

    } catch (error) {
        console.error('Benchmark failed:', error);
    } finally {
        // Cleanup
        try {
            unlinkSync('post_bench.lua');
            unlinkSync('mixed_bench.lua');
        } catch { }
    }
}

runBenchmarks();