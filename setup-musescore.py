"""Unpack and verify the launcher's private MuseScore dependency, without a system install."""

import argparse
import hashlib
import os
from pathlib import Path
import plistlib
import re
import shutil
import subprocess
import tempfile


def verify(binary, version, platform):
    env = dict(os.environ)
    if platform == "linux":
        env.update(QT_QPA_PLATFORM="offscreen", MU_QT_QPA_PLATFORM="offscreen")
    result = subprocess.run(
        [str(binary), "--version"], capture_output=True, text=True,
        errors="replace", env=env, timeout=60,
    )
    output = result.stdout + result.stderr
    if result.returncode != 0 or not re.search(
        rf"\b{re.escape(version)}\b", output
    ):
        raise RuntimeError(f"MuseScore {version} could not run:\n{output}")
    print(f"MuseScore {version} ready: {binary}", flush=True)


def unpack(archive, destination, platform, sevenzip):
    if platform == "darwin":
        result = subprocess.run(
            ["hdiutil", "attach", str(archive), "-readonly", "-nobrowse", "-plist"],
            check=True, capture_output=True,
        )
        mounts = [
            Path(entity["mount-point"])
            for entity in plistlib.loads(result.stdout)["system-entities"]
            if "mount-point" in entity
        ]
        try:
            apps = [app for mount in mounts for app in mount.glob("MuseScore*.app")]
            if len(apps) != 1:
                raise RuntimeError("The MuseScore disk image does not contain one application.")
            subprocess.run(
                ["ditto", str(apps[0]), str(destination / "MuseScore 4.app")], check=True,
            )
        finally:
            for mount in mounts:
                subprocess.run(["hdiutil", "detach", str(mount)], check=True)
    elif platform == "win32":
        if not sevenzip:
            raise RuntimeError("Pinokio's 7z tool is required to unpack MuseScore Portable.")
        subprocess.run(
            [sevenzip, "x", str(archive), f"-o{destination}", "-y"], check=True,
        )
    elif platform == "linux":
        # Extracting once avoids a FUSE requirement on headless Linux systems.
        archive.chmod(0o755)
        subprocess.run([str(archive), "--appimage-extract"], cwd=destination, check=True)
    else:
        raise RuntimeError(f"Unsupported platform: {platform}")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for option in ("platform", "archive", "sha256", "binary", "marker", "version"):
        parser.add_argument(f"--{option}", required=True)
    parser.add_argument("--sevenzip")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    target = root / "tools" / "musescore"
    binary = target / args.binary
    marker = target / args.marker
    if marker.is_file() and binary.is_file():
        verify(binary, args.version, args.platform)
        return

    archive = Path(args.archive).resolve()
    digest = hashlib.sha256()
    with archive.open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    if digest.hexdigest() != args.sha256:
        archive.unlink()
        raise RuntimeError("MuseScore download failed its SHA-256 check. Start again to retry.")

    target.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".musescore-", dir=target.parent) as temporary:
        stage = Path(temporary)
        unpack(archive, stage, args.platform, args.sevenzip)
        if not (stage / args.binary).is_file():
            raise RuntimeError(f"MuseScore package is missing {args.binary}.")
        # AppRun must be tested in its final location so relative resource paths work.
        if target.exists():
            shutil.rmtree(target)
        shutil.move(str(stage), str(target))
        verify(binary, args.version, args.platform)
        marker.write_text(args.sha256 + "\n")


if __name__ == "__main__":
    main()
