# cleanup_old_files.ps1
# Run this ONCE from the project root to delete the old flat files after
# the new package-structured versions have been created in their subfolders.
# 
# Usage:
#   cd "c:\Users\HP\Downloads\final-year-project"
#   .\cleanup_old_files.ps1

$base = $PSScriptRoot

$oldFiles = @(
    "$base\settings.py",
    "$base\emotion_classifier.py",
    "$base\preprocessor.py",
    "$base\dialogue_manager.py",
    "$base\nlp_pipeline.py",
    "$base\rate_limiter.py",
    "$base\input_validator.py",
    "$base\logger.py",
    "$base\redis_pool.py",
    "$base\test_nlp_pipeline.py"
)

foreach ($f in $oldFiles) {
    if (Test-Path $f) {
        Remove-Item $f -Force
        Write-Host "Deleted: $f"
    } else {
        Write-Host "Already gone: $f"
    }
}

Write-Host "`nDone. Old root-level files have been removed."
