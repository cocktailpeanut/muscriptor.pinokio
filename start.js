module.exports = {
  daemon: true,
  run: [
    {
      method: "shell.run",
      params: {
        venv: "env",
        path: "app",
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
