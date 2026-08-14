# Git-Music Test Runner PowerShell Script
$Host.UI.RawUI.WindowTitle = "Git-Music - Engine Test Runner"

Clear-Host
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  🧪 GIT-MUSIC -- Core Engine and Parser Verification Suite" -ForegroundColor White
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host ""

npm run test

Write-Host ""
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host "  Test execution complete. Press any key to exit." -ForegroundColor White
Write-Host "==============================================================================" -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
