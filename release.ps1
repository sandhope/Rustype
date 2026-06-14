# === Rustype Release Script (release branch mode) ===
# No BOM + UTF-8 Fix All

# Force UTF-8
chcp 65001 > $null
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "=== Rustype Release Script (release branch) ===" -ForegroundColor Cyan

# Check directory
if (-Not (Test-Path "src-tauri/tauri.conf.json") -or -Not (Test-Path "package.json")) {
    Write-Host "ERROR: Please run this script in the project root directory" -ForegroundColor Red
    exit 1
}

# Input version
$VERSION = Read-Host "Enter the version to release (e.g. 0.2.0)"

if ($VERSION -notmatch '^\d+\.\d+\.\d+$') {
    Write-Host "ERROR: Version format must be like 0.2.0" -ForegroundColor Red
    exit 1
}

Write-Host "Preparing to release Rustype v$VERSION" -ForegroundColor Green

# Update version (use UTF8 without BOM)
$pkgContent = Get-Content package.json -Raw -Encoding UTF8
$pkgContent = $pkgContent -replace '"version":\s*".*?"', "`"version`": `"$VERSION`""
[System.IO.File]::WriteAllText("$(Get-Location)\package.json", $pkgContent, [System.Text.UTF8Encoding]::new($false))

$tauriContent = Get-Content src-tauri/tauri.conf.json -Raw -Encoding UTF8
$tauriContent = $tauriContent -replace '"version":\s*".*?"', "`"version`": `"$VERSION`""
[System.IO.File]::WriteAllText("$(Get-Location)\src-tauri\tauri.conf.json", $tauriContent, [System.Text.UTF8Encoding]::new($false))

Write-Host "Version updated to $VERSION successfully (UTF-8 without BOM)" -ForegroundColor Green

# Git operations
$CURRENT_BRANCH = git branch --show-current

if ($CURRENT_BRANCH -ne "main" -and $CURRENT_BRANCH -ne "master") {
    Write-Host "WARNING: You are not on main/master branch (current: $CURRENT_BRANCH)" -ForegroundColor Yellow
    $confirm = Read-Host "Continue? (y/n)"
    if ($confirm -notmatch '^[Yy]$') { exit 1 }
}

git add package.json src-tauri/tauri.conf.json
git commit -m "chore: bump version to $VERSION"
git push origin $CURRENT_BRANCH

Write-Host "Committed and pushed to $CURRENT_BRANCH" -ForegroundColor Green

# Switch to release branch and merge
Write-Host "Switching to release branch and merging..." -ForegroundColor Cyan
git checkout release 2>$null
if ($LASTEXITCODE -ne 0) {
    git checkout -b release
}

# git merge $CURRENT_BRANCH --no-ff -m "Merge $CURRENT_BRANCH into release for v$VERSION"
git merge $CURRENT_BRANCH
git push origin release

# Switch back
git checkout $CURRENT_BRANCH
Write-Host "Switched back to $CURRENT_BRANCH branch" -ForegroundColor Green

Write-Host ""
Write-Host "Release process completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check GitHub Actions: https://github.com/sandhope/Rustype/actions"
Write-Host "2. Go to Releases page: https://github.com/sandhope/Rustype/releases"
Write-Host "3. Find the Draft 'Rustype v$VERSION' and Publish it"
Write-Host ""
Write-Host "Current branch: $(git branch --show-current)" -ForegroundColor Cyan