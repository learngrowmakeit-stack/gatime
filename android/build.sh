#!/usr/bin/env bash
set -euo pipefail
android_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
build_mode="${1:-debug}"
case "$build_mode" in
  debug) build_tasks=(assembleDebug) ;;
  unsigned) build_tasks=(bundleRelease validateGatimeBundle) ;;
  release)
    for signing_name in GATIME_UPLOAD_STORE_FILE GATIME_UPLOAD_STORE_PASSWORD GATIME_UPLOAD_KEY_ALIAS GATIME_UPLOAD_KEY_PASSWORD; do
      if [[ -z "${!signing_name:-}" ]]; then
        printf 'Missing signing setting: %s. Keep its value private.\n' "$signing_name" >&2
        exit 1
      fi
    done
    build_tasks=(assembleRelease bundleRelease validateGatimeBundle) ;;
  *) printf 'Usage: android/build.sh debug|unsigned|release\n' >&2; exit 1 ;;
esac
cd "$android_dir/project"
./gradlew --no-daemon --max-workers=2 --init-script "$android_dir/validate-bundle.gradle" "${build_tasks[@]}"
printf '\nBuild complete (%s). Outputs are in android/project/app/build/outputs/.\n' "$build_mode"
if [[ "$build_mode" != release ]]; then
  printf 'This is not an upload-signed Google Play release.\n'
fi
