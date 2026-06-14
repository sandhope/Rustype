#!/bin/bash

set -e

echo "=== Rustype Release Script (release branch - Cross-platform) ==="

# Check directory
if [ ! -f "src-tauri/tauri.conf.json" ] || [ ! -f "package.json" ]; then
  echo "❌ ERROR: Please run this script in the project root directory"
  exit 1
fi

# Input version
read -p "Enter the version to release (e.g. 0.2.0): " VERSION

if [[ ! $VERSION =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "❌ Version format must be semver format (e.g. 0.2.0)"
  exit 1
fi

echo "🚀 Preparing to release Rustype v$VERSION"

if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS uses builtin Python
  echo "🍎 Detected macOS, using Python to update version"
  python3 -c "
import json

# Update package.json
with open('package.json', 'r') as f:
    pkg = json.load(f)
pkg['version'] = '$VERSION'
with open('package.json', 'w') as f:
    json.dump(pkg, f, indent=2)

# Update tauri.conf.json
with open('src-tauri/tauri.conf.json', 'r') as f:
    tauri = json.load(f)
tauri['version'] = '$VERSION'
with open('src-tauri/tauri.conf.json', 'w') as f:
    json.dump(tauri, f, indent=2)

print('✅ Version updated to $VERSION successfully')
"

elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" || -n "$MSYSTEM" ]]; then
  # Windows (Git Bash / MSYS / Cygwin)
  echo "🪟 Detected Windows, using PowerShell to update version..."
  
  powershell -Command "
    \$ver = '$VERSION'
    # 1. Update package.json (UTF8 without BOM)
    \$pkgPath = Join-Path (Get-Location) 'package.json'
    \$pkgContent = Get-Content \$pkgPath -Raw -Encoding UTF8
    \$pkgContent = \$pkgContent -replace '\"version\":\s*\".*?\"', ('\"version\": \"' + \$ver + '\"')
    [System.IO.File]::WriteAllText(\$pkgPath, \$pkgContent, [System.Text.UTF8Encoding]::new(\$false))

    # 2. Update src-tauri/tauri.conf.json (UTF8 without BOM)
    \$tauriPath = Join-Path (Get-Location) 'src-tauri\tauri.conf.json'
    \$tauriContent = Get-Content \$tauriPath -Raw -Encoding UTF8
    \$tauriContent = \$tauriContent -replace '\"version\":\s*\".*?\"', ('\"version\": \"' + \$ver + '\"')
    [System.IO.File]::WriteAllText(\$tauriPath, \$tauriContent, [System.Text.UTF8Encoding]::new(\$false))
  "

  echo "✅ Version updated to $VERSION successfully"
  
else
  # Linux and other systems use jq
  echo "🐧 Detected Linux, using jq to update version"
  jq --arg version "$VERSION" '.version = $version' package.json > tmp.json && mv tmp.json package.json
  jq --arg version "$VERSION" '.version = $version' src-tauri/tauri.conf.json > tmp.json && mv tmp.json src-tauri/tauri.conf.json
  echo "✅ Version updated to $VERSION successfully"
fi

# ==================== Git Operations ====================
CURRENT_BRANCH=$(git branch --show-current)

if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
  echo "⚠️  Current branch is not main/master (current: $CURRENT_BRANCH)"
  read -p "Continue? (y/n): " confirm
  if [[ ! $confirm =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Commit and push to current branch
git add package.json src-tauri/tauri.conf.json
git commit -m "chore: bump version to $VERSION"
git push origin "$CURRENT_BRANCH"

echo "✅ Committed and pushed to branch $CURRENT_BRANCH successfully"

# Switch to and merge release branch
echo "🔄 Switching to release branch..."
git checkout release || git checkout -b release
# git merge "$CURRENT_BRANCH" --no-ff -m "Merge $CURRENT_BRANCH into release for v$VERSION"
git merge "$CURRENT_BRANCH"
git push origin release

# Switch back to current branch
git checkout "$CURRENT_BRANCH"
echo "✅ Switched to branch $CURRENT_BRANCH successfully"

echo ""
echo "🎉 Release process completed!"
echo ""
echo "Next steps:"
echo "1. Go to GitHub Actions to check build progress:"
echo "   https://github.com/sandhope/Rustype/actions"
echo "2. Go to Releases page after build is done:"
echo "   https://github.com/sandhope/Rustype/releases"
echo "3. Find Draft Release 'Rustype v$VERSION' and Publish"
echo ""
echo "Current branch: $(git branch --show-current)"
