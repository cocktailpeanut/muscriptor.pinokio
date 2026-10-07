module.exports = {
  run: [
    {
      when: "{{exists('.git/refs/remotes/origin') || exists('.git/logs/refs/remotes/origin')}}",
      method: "shell.run",
      params: {
        message: "git pull"
      }
    },
    {
      method: "shell.run",
      params: {
        path: "app",
        message: "git pull"
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
      method: "script.start",
      params: {
        uri: "musescore.js"
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
