$ErrorActionPreference='Stop'
$flRoot='D:/07-GAMES/Firstlight/verification/current-qualified-game'
$flArc='D:/07-GAMES/Firstlight/artifacts/building-camera-20261013'
$flHead='1d60260f0bc950b9f0e064555ec750ff38324fe3'
$flAdmission="$flArc/CAMERA02_ADMISSION.json"
$flConsole="$flArc/CAMERA02_CONSOLE.log"
$flReceipt="$flArc/CAMERA02_EXIT.json"
foreach($flPath in @("$flArc/CAMERA02",$flAdmission,$flConsole,$flReceipt)) {
    if(Test-Path -LiteralPath $flPath){throw 'Preserve existing evidence'}
}
Set-Location -LiteralPath $flRoot
if((git rev-parse HEAD).Trim() -ne $flHead -or (git status --porcelain)){throw 'Camera checkout drift'}
$flGate=Get-Content -LiteralPath "$flArc/REMOTE_SOURCE06_EXIT.json" -Raw | ConvertFrom-Json
if($flGate.exitCode -ne 0 -or $flGate.sourceHead -ne $flHead){throw 'Require completed current source gate'}
$env:PYTHONUTF8='1'
$env:PYTHONDONTWRITEBYTECODE='1'
$env:PYTHONPATH='C:/dev/firstlight-artifacts/bootstrap-2026-09-12/browser-env/Lib/site-packages'
$env:PLAYWRIGHT_BROWSERS_PATH='D:/07-GAMES/Firstlight/cache/ms-playwright-1.57'
$env:TEMP='D:/07-GAMES/Firstlight/cache/browser-temp'
$env:TMP=$env:TEMP
$env:FIRSTLIGHT_CAMERA_OUTPUT="$flArc/CAMERA02"
$flFree=(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory
$flAdmitted=$flFree -ge 6291456
[ordered]@{head=$flHead;observedUtc=[DateTime]::UtcNow.ToString('o');freeHostKiB=$flFree;minimumFreeKiB=6291456;admitted=$flAdmitted;scope='One isolated software-WebGL Chromium; host-only admission; no VM/Claude interaction';controllerSha256=(Get-FileHash -LiteralPath $PSCommandPath -Algorithm SHA256).Hash.ToLowerInvariant()} | ConvertTo-Json | Set-Content -LiteralPath $flAdmission -Encoding utf8
if(-not $flAdmitted){Write-Output 'DEFERRED: camera browser not launched';exit 3}
$flStart=[DateTime]::UtcNow.ToString('o')
& 'C:/Users/Dom/AppData/Local/Programs/Python/Python313/python.exe' -B tests/camera_browser.py *> $flConsole
$flExit=$LASTEXITCODE
[ordered]@{head=$flHead;headAfter=(git rev-parse HEAD).Trim();statusAfter=@(git status --porcelain);startedUtc=$flStart;finishedUtc=[DateTime]::UtcNow.ToString('o');exitCode=$flExit;htmlSha256=(Get-FileHash index.html -Algorithm SHA256).Hash.ToLowerInvariant();callerSha256=(Get-FileHash tests/camera_browser.py -Algorithm SHA256).Hash.ToLowerInvariant();consoleSha256=(Get-FileHash -LiteralPath $flConsole -Algorithm SHA256).Hash.ToLowerInvariant()} | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $flReceipt -Encoding utf8
Get-Content -LiteralPath $flConsole -Tail 12
exit $flExit
