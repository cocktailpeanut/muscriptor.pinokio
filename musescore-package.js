// Official MuseScore Studio release assets, including their published SHA-256 digests.
const version = "4.7.5"
const build = "4.7.5.260831071"
const base = `https://github.com/musescore/MuseScore/releases/download/v${version}`

module.exports = (platform, arch) => {
  if (!["x64", "arm64"].includes(arch)) {
    throw new Error(`MuseScore requires a 64-bit computer (received ${arch}).`)
  }
  const packages = {
    darwin: {
      filename: `MuseScore-Studio-${build}.dmg`,
      sha256: "5a8cc26994d3f346d3e7d88c6a1583959e990ee9346b00d7b1d3f9498de6473a",
      binary: "MuseScore 4.app/Contents/MacOS/mscore"
    },
    win32: {
      filename: `MuseScore-Studio-${build}-x86_64.paf.exe`,
      sha256: "1f482f572edac911bf61a8fd2e7844b1a010c05b1a1bf611955c57c2c40eb4fa",
      binary: "App/MuseScore/bin/MuseScore4.exe"
    },
    linux: {
      filename: `MuseScore-Studio-${build}-${arch === "arm64" ? "aarch64" : "x86_64"}.AppImage`,
      sha256: arch === "arm64"
        ? "034f0257fd21ed6b7d4863714dbf8e97cc86d454beb79aaa845a5ade3ff99e36"
        : "a31b2da2dbcc2191bcc98beb7be5c15f2f517bedb3444def96fe3088b74d3a1e",
      binary: "squashfs-root/AppRun"
    }
  }
  const pkg = packages[platform]
  if (!pkg) throw new Error(`MuseScore is not packaged for ${platform}.`)
  return {
    ...pkg,
    version,
    url: `${base}/${pkg.filename}`,
    executable: `tools/musescore/${pkg.binary}`,
    marker: `tools/musescore/.ready-${version}-${platform}-${arch}`
  }
}
