module.exports = {
  version: "8.0.0",
  title: "MuScriptor",
  description: "Turn music recordings into editable MIDI with a local multi-instrument transcription model.",
  menu: async (kernel, info) => {
    const cli = kernel.platform === "win32"
      ? "app/env/Scripts/muscriptor.exe"
      : "app/env/bin/muscriptor"
    const installed = info.exists(cli) &&
      info.exists("app/muscriptor/web_dist/index.html")
    const running = {
      install: info.running("install.js"),
      start: info.running("start.js"),
      update: info.running("update.js"),
      reset: info.running("reset.js")
    }

    if (running.install) {
      return [{
        default: true,
        icon: "fa-solid fa-plug",
        text: "Installing",
        href: "install.js"
      }]
    } else if (installed) {
      if (running.start) {
        const local = info.local("start.js")
        if (local && local.url) {
          return [{
            default: true,
            icon: "fa-solid fa-rocket",
            text: "Open Web UI",
            href: local.url
          }, {
            icon: "fa-solid fa-terminal",
            text: "Terminal",
            href: "start.js"
          }]
        }
        return [{
          default: true,
          icon: "fa-solid fa-terminal",
          text: "Terminal",
          href: "start.js"
        }]
      } else if (running.update) {
        return [{
          default: true,
          icon: "fa-solid fa-terminal",
          text: "Updating",
          href: "update.js"
        }]
      } else if (running.reset) {
        return [{
          default: true,
          icon: "fa-solid fa-terminal",
          text: "Resetting",
          href: "reset.js"
        }]
      }
      return [{
        default: true,
        icon: "fa-solid fa-power-off",
        text: "Start Small (fastest)",
        href: "start.js",
        params: {
          model: "hf://cocktailpeanut/muscriptor-small/model.safetensors"
        }
      }, {
        icon: "fa-solid fa-power-off",
        text: "Start Medium (balanced)",
        href: "start.js",
        params: {
          model: "hf://cocktailpeanut/muscriptor-medium/model.safetensors"
        }
      }, {
        icon: "fa-solid fa-power-off",
        text: "Start Large (best quality)",
        href: "start.js",
        params: {
          model: "hf://cocktailpeanut/muscriptor-large/model.safetensors"
        }
      }, {
        icon: "fa-solid fa-rotate",
        text: "Update",
        href: "update.js"
      }, {
        icon: "fa-solid fa-plug",
        text: "Reinstall",
        href: "install.js"
      }, {
        icon: "fa-regular fa-circle-xmark",
        text: "Reset",
        href: "reset.js",
        confirm: "Reset MuScriptor and remove its installed app files?"
      }]
    }

    return [{
      default: true,
      icon: "fa-solid fa-plug",
      text: "Install",
      href: "install.js"
    }]
  }
}
