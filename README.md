# MuScriptor for Pinokio

MuScriptor turns music recordings into editable MIDI. It runs locally, recognizes multiple instruments, streams transcription progress to the browser, and lets you download the resulting MIDI or rendered audio.

This launcher installs the upstream [MuScriptor](https://github.com/muscriptor/muscriptor) project, builds its web client, and starts its FastAPI server on a free local port.

## Models

The launcher uses public, ungated Hugging Face mirrors and does not require a Hugging Face login. Choose the model when starting:

- **Small (103M)** — fastest and lowest-memory option. Its weights are about 393 MiB, making it the safest default for CPU-only computers and smaller Macs.
- **Medium (307M)** — the recommended quality/speed balance. Its weights are about 1.14 GiB.
- **Large (1.4B)** — best transcription quality, but substantially slower and more memory-intensive. Its weights are about 5.09 GiB before runtime memory overhead.

The selected model downloads on first start and then uses the Hugging Face cache. On Apple Silicon, the launcher explicitly runs inference through PyTorch MPS. Other systems use MuScriptor's automatic CUDA-or-CPU selection.

## Use

1. Click **Install** and wait for the Python environment and web client to finish building.
2. Click **Start Small**, **Start Medium**, or **Start Large**.
3. When the model is loaded, Pinokio automatically opens **Open Web UI**.
4. Drop an audio file into the page, optionally select expected instruments, and download the generated MIDI or WAV.

**Update** pulls both the launcher (when it has a Git remote) and the upstream app, then refreshes dependencies and rebuilds the web client. **Reset** removes the cloned app and its virtual environment so the next install starts cleanly.

## HTTP API

The server URL is assigned dynamically. In the examples below, replace `http://127.0.0.1:PORT` with the URL shown by Pinokio.

Useful endpoints:

- `GET /health` returns `{"status":"ok"}`.
- `GET /instruments` lists valid instrument names.
- `POST /transcribe` accepts multipart audio and streams Server-Sent Events (SSE).
- `POST /auralize` renders uploaded MIDI as WAV. The launcher installs FluidSynth for this route; browser playback uses its own synthesizer.
- `GET /docs` opens the generated FastAPI documentation.

Each `/transcribe` stream ends with a `midi` event whose `data` field contains the generated MIDI as base64.

### JavaScript (Node.js 18+)

```javascript
import { readFile } from "node:fs/promises"

const baseUrl = "http://127.0.0.1:PORT"
const form = new FormData()
form.append("file", new Blob([await readFile("audio.wav")]), "audio.wav")
form.append("instruments", "drums")

const response = await fetch(`${baseUrl}/transcribe`, {
  method: "POST",
  body: form
})

if (!response.ok) throw new Error(await response.text())

const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  process.stdout.write(decoder.decode(value, { stream: true }))
}
```

### Python

```python
import requests

base_url = "http://127.0.0.1:PORT"

with open("audio.wav", "rb") as audio:
    with requests.post(
        f"{base_url}/transcribe",
        files={"file": ("audio.wav", audio, "audio/wav")},
        data=[("instruments", "drums")],
        stream=True,
    ) as response:
        response.raise_for_status()
        for line in response.iter_lines(decode_unicode=True):
            if line:
                print(line)
```

### cURL

```bash
curl -N \
  -F "file=@audio.wav" \
  -F "instruments=drums" \
  http://127.0.0.1:PORT/transcribe
```

Check readiness or list instruments without uploading audio:

```bash
curl http://127.0.0.1:PORT/health
curl http://127.0.0.1:PORT/instruments
```

## Storage and licenses

- Application source and its virtual environment live under `app/`.
- Public model weights come from [Small](https://huggingface.co/cocktailpeanut/muscriptor-small), [Medium](https://huggingface.co/cocktailpeanut/muscriptor-medium), or [Large](https://huggingface.co/cocktailpeanut/muscriptor-large) and use Pinokio's configured Hugging Face cache location.
- Uploaded files are processed in memory; the server does not maintain a user library.
- MuScriptor application code is MIT licensed. Published model weights are CC BY-NC 4.0; review the model cards and original project terms before use.
- FluidSynth is installed from conda-forge on macOS/Linux or downloaded from its official GitHub release on Windows; its source is LGPL-2.1.
