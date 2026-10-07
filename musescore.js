const museScorePackage = require("./musescore-package")

// Shared dependency setup for Install, Update, and existing installations on Start.
module.exports = async (kernel) => {
  const pkg = museScorePackage(kernel.platform, kernel.arch)
  return {
    run: [
      {
        when: `{{!exists('${pkg.marker}') || !exists('${pkg.executable}')}}`,
        method: "fs.download",
        params: {
          uri: pkg.url,
          path: `cache/musescore/${pkg.filename}`
        }
      },
      {
        method: "shell.run",
        params: {
          venv: "env",
          path: "app",
          message: {
            _: ["python", "../setup-musescore.py"],
            platform: kernel.platform,
            archive: `../cache/musescore/${pkg.filename}`,
            sha256: pkg.sha256,
            binary: pkg.binary,
            marker: pkg.marker.split("/").pop(),
            version: pkg.version,
            ...(kernel.platform === "win32" ? { sevenzip: "{{which('7z')}}" } : {})
          }
        }
      }
    ]
  }
}
