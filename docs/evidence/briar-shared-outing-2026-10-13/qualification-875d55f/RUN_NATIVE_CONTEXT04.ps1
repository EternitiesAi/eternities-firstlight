param([Parameter(Mandatory=$true)][ValidatePattern('^[0-9a-f]{40}$')][string]$SourceHead)
$ErrorActionPreference='Stop'
$flRoot='D:/07-GAMES/Firstlight/verification/current-qualified-game'
$flArc='D:/07-GAMES/Firstlight/artifacts/briar-shared-outing-20261013'
$flGate="$flArc/REMOTE_SOURCE10_EXIT.json"
$flCohort="$flArc/REMOTE_SOURCE10/briar-earned/BRIAR_OUTING_JOURNEY_REPORT.json"
$flOutput="$flArc/NATIVE_CONTEXT04"
$flLog="$flArc/NATIVE_CONTEXT04_CONSOLE.log"
$flExitFile="$flArc/NATIVE_CONTEXT04_EXIT.json"
foreach($flPath in @($flOutput,$flLog,$flExitFile)){
    if(Test-Path -LiteralPath $flPath){throw 'Preserve previous native evidence'}
}
$flSourceReceipt=Get-Content -Raw -LiteralPath $flGate | ConvertFrom-Json
if($flSourceReceipt.exitCode -ne 0 -or $flSourceReceipt.sourceHead -ne $SourceHead){throw 'Successful current complete source required'}
if((git -C $flRoot rev-parse HEAD).Trim() -ne $SourceHead -or (git --no-optional-locks -C $flRoot status --porcelain)){throw 'Preserve changed qualification checkout'}
$flCohortSha=(Get-FileHash -LiteralPath $flCohort -Algorithm SHA256).Hash.ToLowerInvariant()
$env:PYTHONUTF8='1';$env:PYTHONDONTWRITEBYTECODE='1';$env:FIRSTLIGHT_ROOT=$flRoot
$env:PYTHONPATH='C:/dev/firstlight-artifacts/bootstrap-2026-09-12/browser-env/Lib/site-packages'
$env:PLAYWRIGHT_BROWSERS_PATH='D:/07-GAMES/Firstlight/cache/ms-playwright-1.57'
$env:TEMP='D:/07-GAMES/Firstlight/cache/browser-temp';$env:TMP=$env:TEMP;$env:TMPDIR=$env:TEMP
$flPython='C:/Users/Dom/AppData/Local/Programs/Python/Python313/python.exe'
$flArguments=@('-B',"$flArc/qualify_briar_owned_drivers04.py")
Set-Location -LiteralPath $flRoot
# The installed caller enforces fresh6GiB after its preparation and before
# every whole-Chromium launch/restart. It never reclaims unrelated resources.
$flStart=[DateTime]::UtcNow.ToString('o')
& $flPython @flArguments *> $flLog
$flExit=$LASTEXITCODE
[ordered]@{scope='Accelerated native UI; three cases, both cameras, whole-browser restarts; no ordinary RAF/human/physical GPU claim';sourceHead=$SourceHead;headAfter=(git rev-parse HEAD).Trim();statusAfter=@(git --no-optional-locks status --porcelain=v1 --untracked-files=all);command=@($flPython)+$flArguments;startedUtc=$flStart;closedUtc=[DateTime]::UtcNow.ToString('o');exitCode=$flExit;controllerSha256=(Get-FileHash -LiteralPath $PSCommandPath -Algorithm SHA256).Hash.ToLowerInvariant();cohortSha256=$flCohortSha;console=@{path=$flLog;bytes=(Get-Item -LiteralPath $flLog).Length;sha256=(Get-FileHash -LiteralPath $flLog -Algorithm SHA256).Hash.ToLowerInvariant()}} | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $flExitFile -Encoding utf8
Get-Content -LiteralPath $flLog -Tail 12
exit $flExit
