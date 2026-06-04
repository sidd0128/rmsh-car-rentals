#!/bin/sh
set -e

if [ "${CONFIGURATION}" != "Release" ]; then
  exit 0
fi

mkdir -p "${DWARF_DSYM_FOLDER_PATH}"

generate_dsym() {
  FRAMEWORK_NAME="$1"
  BINARY_NAME="$2"
  BINARY_PATH="${TARGET_BUILD_DIR}/${FRAMEWORKS_FOLDER_PATH}/${FRAMEWORK_NAME}.framework/${BINARY_NAME}"
  DSYM_PATH="${DWARF_DSYM_FOLDER_PATH}/${FRAMEWORK_NAME}.framework.dSYM"

  if [ ! -f "${BINARY_PATH}" ]; then
    echo "${FRAMEWORK_NAME}.framework binary not found at ${BINARY_PATH}; skipping dSYM generation."
    return
  fi

  UUIDS="$(dwarfdump --uuid "${BINARY_PATH}" | awk '{print $2}' | tr '\n' ' ')"
  echo "Generating ${FRAMEWORK_NAME}.framework.dSYM for UUID(s): ${UUIDS}"
  rm -rf "${DSYM_PATH}"
  dsymutil "${BINARY_PATH}" -o "${DSYM_PATH}"
}

generate_dsym "React" "React"
generate_dsym "ReactNativeDependencies" "ReactNativeDependencies"
generate_dsym "hermesvm" "hermesvm"
