[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("bug", "test")]
    [string]$Mode,

    [string]$Date = (Get-Date -Format "yyyy-MM-dd"),

    # Bug fields
    [string]$BugId,
    [string]$Severity,
    [string]$Area,
    [string]$Symptom,
    [string]$RootCause,
    [string]$Fix,
    [string]$Status = "Open",

    # Test fields
    [string]$Build,
    [string]$Scope,
    [string]$Command,
    [string]$Result,
    [string]$Notes
)

function Escape-MarkdownCell {
    param([string]$Value)
    if ([string]::IsNullOrWhiteSpace($Value)) {
        return "-"
    }
    return ($Value -replace "\|", "\/") -replace "`r?`n", " "
}

$archiveRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$bugFile = Join-Path $archiveRoot "BUG_HISTORY.md"
$testFile = Join-Path $archiveRoot "TEST_LOG.md"

if ($Mode -eq "bug") {
    $required = @($BugId, $Severity, $Area, $Symptom, $RootCause, $Fix)
    if ($required -contains $null -or $required -contains "") {
        throw "For bug mode, required fields: -BugId -Severity -Area -Symptom -RootCause -Fix"
    }

    $row = "| {0} | {1} | {2} | {3} | {4} | {5} | {6} | {7} |" -f `
        (Escape-MarkdownCell $Date), `
        (Escape-MarkdownCell $BugId), `
        (Escape-MarkdownCell $Severity), `
        (Escape-MarkdownCell $Area), `
        (Escape-MarkdownCell $Symptom), `
        (Escape-MarkdownCell $RootCause), `
        (Escape-MarkdownCell $Fix), `
        (Escape-MarkdownCell $Status)

    Add-Content -LiteralPath $bugFile -Value $row
    Write-Host "Added bug entry to $bugFile"
    exit 0
}

if ($Mode -eq "test") {
    $required = @($Build, $Scope, $Command, $Result)
    if ($required -contains $null -or $required -contains "") {
        throw "For test mode, required fields: -Build -Scope -Command -Result"
    }

    $commandCell = "`"$(Escape-MarkdownCell $Command)`""
    $row = "| {0} | {1} | {2} | {3} | {4} | {5} |" -f `
        (Escape-MarkdownCell $Date), `
        (Escape-MarkdownCell $Build), `
        (Escape-MarkdownCell $Scope), `
        $commandCell, `
        (Escape-MarkdownCell $Result), `
        (Escape-MarkdownCell $Notes)

    Add-Content -LiteralPath $testFile -Value $row
    Write-Host "Added test entry to $testFile"
    exit 0
}
