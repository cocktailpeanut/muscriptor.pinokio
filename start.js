const museScorePackage = require("./musescore-package")

module.exports = async (kernel) => {
  const pkg = museScorePackage(kernel.platform, kernel.arch)
  return {
    daemon: true,
    run: [
      {
        method: "script.start",
        params: {
          uri: "musescore.js"
        }
      },
      {
        method: "shell.run",
        params: {
          venv: "env",
          path: "app",
          env: {
            MUSCRIPTOR_MUSESCORE: `{{path.resolve(cwd, '${pkg.executable}')}}`
          },
          message: "python -m muscriptor serve --model {{args.model ? args.model : 'hf://cocktailpeanut/muscriptor-small/model.safetensors'}} --device {{platform === 'darwin' && arch === 'arm64' ? 'mps' : 'auto'}} --port {{port}}",
          on: [{
            event: "/(http:\\/\\/[0-9.:]+)/",
            done: true
          }]
        }
      },
      {
        method: "local.set",
        params: {
          url: "{{input.event[1]}}"
        }
      }
    ]
  }
}
