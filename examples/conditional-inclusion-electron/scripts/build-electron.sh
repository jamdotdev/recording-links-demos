#!/bin/bash
set -e

# Save original package.json
cp package.json package.json.tmp

# Temporarily replace the name with a valid one for electron-builder
if command -v sed &> /dev/null; then
  # macOS/BSD sed requires -i '' for in-place editing
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' 's/"name": "example:electron"/"name": "conditional-inclusion-electron"/' package.json
  else
    sed -i 's/"name": "example:electron"/"name": "conditional-inclusion-electron"/' package.json
  fi
fi

# Run electron-builder with any passed arguments
electron-builder "$@"
BUILD_EXIT_CODE=$?

# Restore original package.json
mv package.json.tmp package.json

exit $BUILD_EXIT_CODE
