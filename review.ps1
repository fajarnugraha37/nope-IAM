<#
SYNOPSIS
    Runs GitHub Copilot code-review on a git diff.

DESCRIPTION
    Compares an arbitrary SourceBranch against a TargetBranch (or, if -StagedOnly is
    used, just the staged changes).  Works on Bitbucket repos because only     the diff
    is sent to Copilot via GitHub CLI.

PARAMETERS
    -SourceBranch / -s   PR branch being reviewed (default: HEAD)
    -TargetBranch / -t   Base branch for the diff    (default: origin/main)
    -StagedOnly          Review only staged changes
    -OutFile             Markdown report path (default: .\.copilot-review.md)
    -OpenAfter           Open report when done

    Review a branch named feature/payment-fix that targets master	
        .\review.ps1 -s feature/payment-fix -t origin/master
    Review hotfix/urgent against release/2025Q3	
        .\review.ps1 -s hotfix/urgent -t origin/release/2025Q3
    You’re on feature/refactor but want to compare it to develop (same as default HEAD source)	
        .\review.ps1 -t origin/develop
    Review only staged edits regardless of branches and open the report	
        git add .; .\review.ps1 -StagedOnly -OpenAfter
#>

[CmdletBinding()]
param(
    [Alias("s")]
    [string]$SourceBranch = "HEAD",

    [Alias("t")]
    [string]$TargetBranch = "origin/main",

    [switch]$StagedOnly,

    [string]$OutFile = ".\.copilot-review.md",

    [switch]$OpenAfter
)

function Assert-Installed($cmd, $name) {
    if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) {
        throw "$name is not installed or not in PATH."
    }
}

try {
    # --- 1. Pre-flight checks -------------------------------------------------
    Assert-Installed git "Git"
    Assert-Installed gh  "GitHub CLI"

    if (-not (gh extension list | Select-String -Quiet "gh-copilot")) {
        Write-Host "Installing gh-copilot extension…" -ForegroundColor Cyan
        gh extension install github/gh-copilot | Out-Null
    }

    # --- 2. Build the diff ----------------------------------------------------
    $diffFile = New-TemporaryFile

    if ($StagedOnly) {
        git diff --cached | Out-File -FilePath $diffFile -Encoding utf8
    } else {
        git diff $TargetBranch...$SourceBranch |
            Out-File -FilePath $diffFile -Encoding utf8
    }

    if ((Get-Item $diffFile).Length -eq 0) {
        Write-Warning "No differences found - nothing to review."
        Remove-Item $diffFile
        return
    }

    # --- 3. Run Copilot review ------------------------------------------------
    Write-Host "`nRunning Copilot review: '$SourceBranch' → '$TargetBranch'…" -ForegroundColor Yellow
    $review = & gh copilot suggest --stdin 0< $diffFile 2>$null

    if (-not $review) {
        throw "Copilot returned no output - check your gh authentication & Copilot license."
    }

    # --- 4. Persist & summarise ----------------------------------------------
    $review | Out-File -FilePath $OutFile -Encoding utf8

    Write-Host "`n=== Copilot review summary (first 20 lines) ===" -ForegroundColor Green
    ($review -split "`n")[0..19] | ForEach-Object { Write-Host $_ }

    Write-Host "`nFull review saved to: $OutFile`n"

    if ($OpenAfter) {
        if (Get-Command code -ErrorAction SilentlyContinue) { code $OutFile }
        else { notepad $OutFile }
    }
}
catch {
    Write-Error $_
}
