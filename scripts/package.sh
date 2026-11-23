#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p dist
rm -f dist/doomscroll-unfocused.zip
cd extension
zip -qr ../dist/doomscroll-unfocused.zip .
