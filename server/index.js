import { createServer } from "node:http";
import { createReadStream } from "node:fs"
import { Readable, Transform } from "node:stream";
import { WritableStream } from "node:stream/web";
import csvtojson from "csvtojson";
import { setTimeout } from "node:timers/promises";

const PORT = 3000;
// curl -i -X OPTIONS -N localhost:3000

createServer(async (request, response) => {
    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "*"
    }
    if (request.method === "OPTIONS") {
        response.writeHead(204, headers);
        response.end();
        return;
    }

    let items = 0;
    request.once("close", _ => console.log(`connection was closed`, items))

    Readable.toWeb(createReadStream("./animeflv.csv"))
        // step by step
        .pipeThrough(Transform.toWeb(csvtojson()))
        .pipeThrough(new TransformStream({
            transform(chunck, controller) {
                const data = JSON.parse(Buffer.from(chunck))
                const mappedData = {
                    title: data.title,
                    description: data.description,
                    url_anime: data.url_anime
                }
                controller.enqueue(JSON.stringify(mappedData).concat("\n"));
            }
        }))
        .pipeTo(new WritableStream({
            async write(chunck) {
                items++
                response.write(chunck);
            },
            close() {
                response.end();
            }
        }))

    response.writeHead(200, headers);
})
    .listen(PORT)
    .on("listening", _ => console.log(`rodando na ${PORT}`))