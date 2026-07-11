module.exports = {
  requires: {
    bundle: "ai"
  },
  run: [
    {
      when: "{{!exists('app')}}",
      method: "shell.run",
      params: {
        message: "git clone https://github.com/muscriptor/muscriptor app"
      }
    },
    {
      when: "{{platform !== 'win32'}}",
      method: "shell.run",
      params: {
        message: [
          "conda install -y -c conda-forge fluidsynth",
          "fluidsynth --version"
        ]
      }
    },
    {
      when: "{{platform === 'win32'}}",
      method: "fs.download",
      params: {
        uri: "https://github.com/FluidSynth/fluidsynth/releases/download/v2.5.6/fluidsynth-v2.5.6-win10-x64-cpp11.zip",
        path: "cache/fluidsynth.zip"
      }
    },
    {
      when: "{{platform === 'win32'}}",
      method: "shell.run",
      params: {
        message: [
          "7z x cache/fluidsynth.zip -otools -y",
          "tools\\fluidsynth-v2.5.6-win10-x64-cpp11\\bin\\fluidsynth.exe --version"
        ]
      }
    },
    {
      method: "script.start",
      params: {
        uri: "torch.js",
        params: {
          venv: "env",
          path: "app"
        }
      }
    },
    {
      when: "{{platform === 'win32'}}",
      method: "shell.run",
      params: {
        message: [
          "copy /Y tools\\fluidsynth-v2.5.6-win10-x64-cpp11\\bin\\* app\\env\\Scripts\\",
          "app\\env\\Scripts\\fluidsynth.exe --version"
        ]
      }
    },
    {
      method: "shell.run",
      params: {
        venv: "env",
        path: "app",
        message: "uv pip install -e ."
      }
    },
    {
      method: "shell.run",
      params: {
        path: "app/web",
        message: [
          "npm install",
          "npm run build"
        ]
      }
    }
  ]
}
