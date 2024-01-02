const API = "http://localhost:3000";


async function getData(signal) {
    const response = await fetch(API, {
        signal
    });

    const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(parseNDJSON())

    return reader
}

function appendToHTML(el) {
    try {
        return new WritableStream({
            async write({ title, description, url_anime }) {
                const card = `
                    <article>
                      <div class="text">
                        <h3>[${++count}] ${title}</h3>
                        <p>${description.slice(0, 100)}</p>
                        <a href="${url_anime}">Here's why</a>
                      </div>
                    </article>
                    `
                el.innerHTML += card
            },
            abort(reason) {
                console.log('aborted**', reason)
            }
        })
    } catch (error) {
        console.log("a")
    }
    finally {
        console.log("a")
    }
}

function parseNDJSON() {
    // parse chuncks to JSON;
    let ndjsonBuffer = "";
    return new TransformStream({
        transform(chunk, controller) {
            ndjsonBuffer += chunk;
            const items = ndjsonBuffer.split("\n");
            items.slice(0, -1)
                .forEach(item => controller.enqueue(JSON.parse(item)))
            ndjsonBuffer = items[items.length - 1];
        },
        flush(controller) {
            if (!ndjsonBuffer) return;
            controller.enqueue(JSON.parse(ndjsonBuffer))
        }
    })
}

const [
    start,
    stop,
    cards
] = ["start", "stop", "cards"].map(item => document.getElementById(item));

let abortController = new AbortController();
let count = 0

start.addEventListener("click", async () => {
    const reader = await getData(abortController.signal);
    reader.pipeTo(appendToHTML(cards))
});

stop.addEventListener('click', () => {
    abortController.abort();
    console.log('aborting...');
    abortController = new AbortController();
})