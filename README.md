# MuScriptor for Pinokio

MuScriptor turns music recordings into editable MIDI. It runs locally, recognizes multiple instruments, streams transcription progress to the browser, and lets you download MIDI, rendered audio, or printable sheet music.

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
4. Drop an audio file into the page, optionally select expected instruments, and download MIDI, WAV, or **Sheet music** from **Download**.

**Update** pulls both the launcher (when it has a Git remote) and the upstream app, then refreshes dependencies and rebuilds the web client. **Reset** removes the cloned app, its virtual environment, and the bundled tools so the next install starts cleanly.

## Sheet music

The launcher automatically downloads a private copy of **MuseScore Studio 4.7.5** from its official release during Install or Update. Start also installs it if it is missing, so existing installations need no separate setup. Downloads are checked against the release's SHA-256 digests, and the executable's version is verified before use.

MuseScore lives in `tools/musescore/`; the launcher sets `MUSCRIPTOR_MUSESCORE` automatically. You do not need to install MuseScore into Applications, change your PATH, or configure an environment variable. The first setup downloads about 130–210 MB; later starts reuse the installed copy.

- **macOS 11+ (Apple Silicon and Intel):** copies the signed application from the official disk image into the project.
- **Windows 10+ (x64):** extracts the official portable package using Pinokio's bundled 7-Zip, without a system installer. Windows 11 ARM64 uses the x64 package through Windows' x64 emulation.
- **Linux (x64 and ARM64):** extracts the official AppImage and uses its `AppRun` entry point. This avoids requiring FUSE. A recent distribution compatible with MuseScore's AppImage is required (for example Ubuntu 22.04+); rendering runs without a display using Qt's offscreen backend.

After transcription, choose **Download → Sheet music** for the score PDFs and MusicXML. If MuScriptor was already running when this launcher change was installed, stop and start it once to pick up the automatic MuseScore configuration.

## HTTP API

The server URL is assigned dynamically. In the examples below, replace `http://127.0.0.1:PORT` with the URL shown by Pinokio.

Useful endpoints:

- `GET /health` returns `{"status":"ok"}`.
- `GET /instruments` lists valid instrument names.
- `POST /transcribe` accepts multipart audio and streams Server-Sent Events (SSE).
- `POST /auralize` renders uploaded MIDI as WAV. The launcher installs FluidSynth for this route; browser playback uses its own synthesizer.
- `POST /sheets` accepts a `midi` file and returns a ZIP containing the full score PDF, instrument PDFs, MusicXML, and MIDI. Set `quantized=true` only for MIDI already aligned to the beat grid.
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

Download sheet music from a MIDI file:

```bash
curl --fail -F "midi=@score.mid" \
  http://127.0.0.1:PORT/sheets -o sheets.zip
```

```javascript
import { readFile, writeFile } from "node:fs/promises"

const form = new FormData()
form.append("midi", new Blob([await readFile("score.mid")]), "score.mid")
const response = await fetch("http://127.0.0.1:PORT/sheets", {
  method: "POST", body: form
})
if (!response.ok) throw new Error(await response.text())
await writeFile("sheets.zip", Buffer.from(await response.arrayBuffer()))
```

```python
import requests

with open("score.mid", "rb") as midi:
    response = requests.post(
        "http://127.0.0.1:PORT/sheets", files={"midi": ("score.mid", midi)}
    )
response.raise_for_status()
with open("sheets.zip", "wb") as archive:
    archive.write(response.content)
```

## Storage and licenses

- Application source and its virtual environment live under `app/`.
- Public model weights come from [Small](https://huggingface.co/cocktailpeanut/muscriptor-small), [Medium](https://huggingface.co/cocktailpeanut/muscriptor-medium), or [Large](https://huggingface.co/cocktailpeanut/muscriptor-large) and use Pinokio's configured Hugging Face cache location.
- Uploaded files are processed in memory; the server does not maintain a user library.
- MuScriptor application code is MIT licensed. Published model weights are CC BY-NC 4.0; review the model cards and original project terms before use.
- FluidSynth is installed from conda-forge on macOS/Linux or downloaded from its official GitHub release on Windows; its source is LGPL-2.1.
- MuseScore Studio is downloaded from the [official 4.7.5 release](https://github.com/musescore/MuseScore/releases/tag/v4.7.5), with the complete application's resources and license files retained under `tools/musescore/`. MuseScore is GPL-3.0 licensed; its source is available in the same release. Downloaded installers are cached under `cache/musescore/`.
