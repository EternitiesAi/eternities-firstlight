param([Parameter(Mandatory=$true)][ValidatePattern('^[0-9a-f]{40}$')][string]$SourceHead)
$ErrorActionPreference='Stop'
$flRoot='D:/07-GAMES/Firstlight/verification/current-qualified-game'
$flArc='D:/07-GAMES/Firstlight/artifacts/briar-shared-outing-20261013'
$flLogs="$flArc/REMOTE_SOURCE10"
$flConsole="$flArc/REMOTE_SOURCE10_CONSOLE.log"
$flReceipt="$flArc/REMOTE_SOURCE10_EXIT.json"
$flAdmission="$flArc/SOURCE10_ADMISSION01.json"
foreach($flPath in @($flLogs,$flConsole,$flReceipt,$flAdmission)) {
    if(Test-Path -LiteralPath $flPath) { throw 'Preserve existing source/admission evidence' }
}
if((git -C $flRoot rev-parse HEAD).Trim() -ne $SourceHead) { throw 'Source head drift' }
if(git --no-optional-locks -C $flRoot status --porcelain) { throw 'Source gate requires clean committed game' }
$env:PYTHONUTF8='1'; $env:PYTHONDONTWRITEBYTECODE='1'; $env:FIRSTLIGHT_ROOT=$flRoot
$env:TEMP='D:/07-GAMES/Firstlight/cache/browser-temp'; $env:TMP=$env:TEMP; $env:TMPDIR=$env:TEMP
$env:PYTHONPATH='C:/dev/firstlight-artifacts/bootstrap-2026-09-12/browser-env/Lib/site-packages'
$flPython='C:/Users/Dom/AppData/Local/Programs/Python/Python313/python.exe'
$flCpuTemp='C:/Users/Dom/AppData/Local/Temp'
$flArguments=@('-B','tools/verify.py','--rule-workers','4','--output',$flLogs,'--cpu-temp',$flCpuTemp)
Set-Location -LiteralPath $flRoot
# This is the final admission read, after Git/network preparation. It is a
# conservative host-only policy, not a measured total RAM or VM guarantee.
$flFreeBefore=(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory
$flAdmitted=$flFreeBefore -ge 6291456
[ordered]@{head=$SourceHead;observedUtc=[DateTime]::UtcNow.ToString('o');freeHostKiB=$flFreeBefore;minimumFreeKiB=6291456;requestedRuleWorkers=4;admitted=$flAdmitted;controllerSha256=(Get-FileHash -LiteralPath $PSCommandPath -Algorithm SHA256).Hash.ToLowerInvariant();scope='Read host free memory only; no VM/Claude interaction';command=@($flPython)+$flArguments} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $flAdmission -Encoding utf8
if(-not $flAdmitted) {
    Write-Output 'DEFERRED: source verifier was not launched; immediate host memory is below 6 GiB.'
    exit 3
}
$flStart=[DateTime]::UtcNow.ToString('o')
& $flPython @flArguments *> $flConsole
$flExit=$LASTEXITCODE
$flRuleRecord=Join-Path $flLogs 'rules-command.json'
$flRuleMetadata=$null
if(Test-Path -LiteralPath $flRuleRecord) {
    $flRuleMetadata=@{path=$flRuleRecord;bytes=(Get-Item -LiteralPath $flRuleRecord).Length;sha256=(Get-FileHash -LiteralPath $flRuleRecord -Algorithm SHA256).Hash.ToLowerInvariant()}
}
[ordered]@{scope='Complete current source; four Node file workers; original rules180/Python600; no native browser';command=@($flPython)+$flArguments;requestedRuleWorkers=4;sourceHead=$SourceHead;headAfter=(git rev-parse HEAD).Trim();statusAfter=@(git --no-optional-locks status --porcelain=v1 --untracked-files=all);startedUtc=$flStart;closedUtc=[DateTime]::UtcNow.ToString('o');exitCode=$flExit;freeHostKiBBefore=$flFreeBefore;freeHostKiBAfter=(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory;admission=@{path=$flAdmission;sha256=(Get-FileHash -LiteralPath $flAdmission -Algorithm SHA256).Hash.ToLowerInvariant()};unitChildTemp=$flCpuTemp;allOtherChildTemp=$env:TEMP;console=@{path=$flConsole;bytes=(Get-Item -LiteralPath $flConsole).Length;sha256=(Get-FileHash -LiteralPath $flConsole -Algorithm SHA256).Hash.ToLowerInvariant()};rulesCommand=$flRuleMetadata} | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $flReceipt -Encoding utf8
Get-Content -LiteralPath $flConsole -Tail 14
exit $flExit

