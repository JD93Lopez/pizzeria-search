# Reindex all products into the RAG component in batches of $BatchSize.
# Run from the project root:
#   .\scripts\reindex-rag.ps1
#   .\scripts\reindex-rag.ps1 -StartFrom 150 -BatchSize 40

param(
    [int]$StartFrom = 0,
    [int]$BatchSize = 40
)

Set-Location "$PSScriptRoot\..\backend"

$nextFrom = $StartFrom
$totalIndexed = 0

Write-Host "Starting RAG reindex from position $StartFrom, batch size $BatchSize" -ForegroundColor Cyan

do {
    Write-Host "`n--- Batch starting at $nextFrom ---" -ForegroundColor Yellow

    $json = "{`"startFrom`":$nextFrom,`"limit`":$BatchSize}"
    $raw = npx convex run ai/actions:reindexProducts $json 2>&1

    # Extract the final JSON result (last { ... } block)
    $resultLine = ($raw | Select-String "indexed|nextFrom|done" | Select-Object -Last 1).Line
    Write-Host $raw | Select-String "\[LOG\]" | ForEach-Object { $_.Line }

    # Parse result JSON
    $resultJson = ($raw -join "`n") -replace '[\s\S]*?(\{[\s\S]*\})\s*$', '$1'
    try {
        $result = $resultJson | ConvertFrom-Json
        $totalIndexed += $result.indexed
        $nextFrom = $result.nextFrom
        $done = $result.done

        Write-Host "Indexed: $($result.indexed) | nextFrom: $nextFrom | done: $done | total: $($result.total)" -ForegroundColor Green

        if ($result.errors) {
            Write-Host "Errors in this batch:" -ForegroundColor Red
            $result.errors | ForEach-Object { Write-Host "  $_" -ForegroundColor Red }
        }
    } catch {
        Write-Host "Could not parse result. Raw output:" -ForegroundColor Red
        $raw | Select-String "indexed|error|Error" | ForEach-Object { Write-Host $_.Line }
        break
    }

    Start-Sleep -Seconds 1

} while (-not $done)

Write-Host "`nReindex complete! Total indexed: $totalIndexed" -ForegroundColor Cyan
