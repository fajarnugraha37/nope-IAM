git tag $tagName
git push origin HEAD
git push origin $tagName
git tag $tagName
git push origin $tagName

# Read version from package.json
$package = Get-Content package.json | Out-String | ConvertFrom-Json
$version = $package.version
$tagName = "v$version"

# Check if tag exists on remote
Write-Host "Checking if tag $tagName exists on remote..."
$existingTag = git ls-remote --tags origin $tagName | Select-String $tagName
if ($existingTag) {
    Write-Host "ERROR: Tag $tagName already exists on remote. Please update the version in package.json before releasing."
    exit 1
}

Write-Host "Tagging version $tagName..."
git tag $tagName
git push origin HEAD
git push origin $tagName

Write-Host "Release $tagName published!"
