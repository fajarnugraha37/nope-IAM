# Compare between two branches/commits
# .\patch.ps1 -BaseRef main -CompareRef feature-branch

# Compare BaseRef with current changes (HEAD/staged/unstaged)
# .\patch.ps1 -BaseRef main
# Using full commit hashes:
# .\patch.ps1 -BaseRef 123abc456def7890 -CompareRef fedcba9876543210

# Using a branch and a commit hash:
# .\patch.ps1 -BaseRef main -CompareRef fedcba9876543210

# Using only hashes and letting CompareRef default:
# .\patch.ps1 -BaseRef 123abc456def7890
param(
    [Parameter(Mandatory = $true)]
    [string]$BaseRef,

    [string]$CompareRef,

    [string]$OutputFile
)

function Get-CommitHash([string]$Ref) {
    $hash = git rev-parse $Ref 2>$null
    if (-not $hash) {
        throw "Reference '$Ref' not found."
    }
    return $hash.Trim()
}

try {
    # Ensure ./patch directory exists
    $patchDir = Join-Path -Path "." -ChildPath "patch"
    if (-not (Test-Path $patchDir)) {
        New-Item -Path $patchDir -ItemType Directory | Out-Null
    }

    $baseHash = Get-CommitHash $BaseRef
    $compareHash = $null
    $diff = $null

    if ($CompareRef) {
        $compareHash = Get-CommitHash $CompareRef
        $diff = git diff "$BaseRef..$CompareRef" | Out-String
    } else {
        # Check for staged and unstaged changes
        $staged = git diff --cached --name-only $BaseRef
        $unstaged = git diff --name-only $BaseRef

        if ($staged) {
            $compareHash = "STAGED"
            $diff = git diff --cached $BaseRef | Out-String
        } elseif ($unstaged) {
            $compareHash = "WORKING"
            $diff = git diff $BaseRef | Out-String
        } else {
            $compareHash = Get-CommitHash "HEAD"
            $diff = git diff "$BaseRef..HEAD" | Out-String
        }
    }

    if (-not $OutputFile) {
        $OutputFile = "diff-$baseHash-$compareHash.patch"
    }

    $OutputPath = Join-Path -Path $patchDir -ChildPath $OutputFile

    if ([string]::IsNullOrWhiteSpace($diff)) {
        Write-Host "No diff detected; file will not be created."
    } else {
        $diff | Out-File -FilePath $OutputPath -Encoding utf8
        Write-Host "Diff saved to $OutputPath"
    }
} catch {
    Write-Error "Failed to extract diff: $_"
}