param([Parameter(Mandatory=$true)][ValidatePattern('^[0-9a-f]{40}$')][string]$SourceHead,[Parameter(Mandatory=$true)][string]$SourceGateReceipt,[Parameter(Mandatory=$true)][string]$NativeGateReceipt)
$ErrorActionPreference='Stop'
$flRoot='D:/07-GAMES/Firstlight/verification/current-qualified-game'
$flArc='D:/07-GAMES/Firstlight/artifacts/living-road-inspection-20261012'
$flOutput="$flArc/CLIP01"
$flAdmission="$flArc/CLIP01_ADMISSION01.json"
$flConsole="$flArc/CLIP01_CONSOLE.log"
$flReceipt="$flArc/CLIP01_EXIT.json"
$flSourceGate=$SourceGateReceipt
$flNativeGate=$NativeGateReceipt
$flGate=Get-Content -LiteralPath $flSourceGate -Raw | ConvertFrom-Json
$flNative=Get-Content -LiteralPath $flNativeGate -Raw | ConvertFrom-Json
$flLogs=Split-Path -Path $flGate.rulesCommand.path -Parent
$flSource="$flLogs/earth-consignment-earned/fresh-blade/PATROL_1_GLADE_OPEN.json"
$flJourney="$flLogs/earth-consignment-earned/fresh-blade/EARTH_EXPEDITION_JOURNEY_REPORT.json"
$flCohort="$flLogs/earth-consignment-earned/FIRST_LOAD_COHORT.json"
$flNativeReport=$flNative.reportPath
foreach($flPath in @($flOutput,$flAdmission,$flConsole,$flReceipt)){if(Test-Path -LiteralPath $flPath){throw 'Retain earlier clip evidence; namespace already exists'}}
if((git -C $flRoot rev-parse HEAD).Trim() -ne $SourceHead -or (git -C $flRoot status --porcelain)){throw 'Clip requires exact clean source head'}
$flGate=Get-Content -LiteralPath $flSourceGate -Raw | ConvertFrom-Json
$flNative=Get-Content -LiteralPath $flNativeGate -Raw | ConvertFrom-Json
foreach($flClosed in @($flGate,$flNative)){if($flClosed.exitCode -ne 0 -or $flClosed.sourceHead -ne $SourceHead -or $flClosed.headAfter -ne $SourceHead -or $flClosed.statusAfter.Count -ne 0){throw 'Current source and targeted native gates must be closed successfully'}}
$flCanonicalSourceGate=(Resolve-Path -LiteralPath $flSourceGate).Path
if(-not $flNative.sourceGate.path -or (Resolve-Path -LiteralPath $flNative.sourceGate.path).Path -ine $flCanonicalSourceGate -or $flNative.sourceGate.sha256 -ne (Get-FileHash -LiteralPath $flCanonicalSourceGate -Algorithm SHA256).Hash.ToLowerInvariant()){throw 'Native acceptance must link this exact complete source receipt'}
$flNativeResult=Get-Content -LiteralPath $flNativeReport -Raw | ConvertFrom-Json
if($flNativeResult.status -ne 'passed' -or $flNativeResult.head -ne $SourceHead -or $flNativeResult.failed -ne 0 -or $flNative.reportPath -ne $flNativeReport){throw 'Exact completed targeted native report required'}
$flProducer=Get-Content -LiteralPath $flJourney -Raw | ConvertFrom-Json
$flEpoch=Get-Content -LiteralPath $flCohort -Raw | ConvertFrom-Json
if($flProducer.status -ne 'passed' -or $flProducer.variant -ne 'fresh-blade' -or $flProducer.positionEdits -ne 0 -or $flProducer.inventoryGrants -ne 0 -or $flProducer.manualDamage -ne 0 -or $flProducer.plantedDefeats -ne 0 -or $flEpoch.epoch.head -ne $SourceHead){throw 'Current command-earned cohort required'}
if((Get-FileHash -LiteralPath $flJourney -Algorithm SHA256).Hash.ToLowerInvariant() -ne $flEpoch.variants.blade.journey.sha256){throw 'Command-earned producer report digest drift'}
$flCheckpointName=[IO.Path]::GetFileName($flSource)
if($flProducer.sourceDrift -ne $false -or $flProducer.checkpoints.$flCheckpointName.path -ne ('fresh-blade/'+$flCheckpointName) -or $flProducer.checkpoints.$flCheckpointName.sha256 -ne (Get-FileHash -LiteralPath $flSource -Algorithm SHA256).Hash.ToLowerInvariant()){throw 'Producer checkpoint digest/path required'}
$flHtmlHash=(Get-FileHash -LiteralPath "$flRoot/index.html" -Algorithm SHA256).Hash.ToLowerInvariant()
if($flHtmlHash -ne $flEpoch.epoch.htmlSha256 -or (Get-FileHash -LiteralPath "$flRoot/FIRSTLIGHT_VALLEY.html" -Algorithm SHA256).Hash.ToLowerInvariant() -ne $flHtmlHash){throw 'Current cohort/build drift'}
$flRuntimeNames=@(Get-ChildItem -LiteralPath "$flRoot/src" -File | ForEach-Object {'src/'+$_.Name})
$flEpochNames=@($flEpoch.epoch.runtimeSources.PSObject.Properties.Name)
[Array]::Sort($flRuntimeNames,[StringComparer]::Ordinal);[Array]::Sort($flEpochNames,[StringComparer]::Ordinal)
if($flEpoch.epoch.mode -ne 'current-command-earned' -or $flEpoch.epoch.callerSha256 -ne (Get-FileHash -LiteralPath "$flRoot/tests/earth_expedition_journey.cjs" -Algorithm SHA256).Hash.ToLowerInvariant() -or ($flRuntimeNames|ConvertTo-Json -Compress) -cne ($flEpochNames|ConvertTo-Json -Compress)){throw 'Exact current earned cohort mode/caller/runtime membership required'}
foreach($flProp in $flEpoch.epoch.runtimeSources.PSObject.Properties){if((Get-FileHash -LiteralPath (Join-Path $flRoot $flProp.Name) -Algorithm SHA256).Hash.ToLowerInvariant() -ne $flProp.Value){throw 'Command-earned runtime source drift'}}
foreach($flClosed in @($flGate,$flNative)){if((Get-FileHash -LiteralPath $flClosed.console.path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $flClosed.console.sha256){throw 'Closed gate console digest drift'}}
$env:PYTHONUTF8='1';$env:PYTHONDONTWRITEBYTECODE='1'
$env:TEMP='D:/07-GAMES/Firstlight/cache/browser-temp';$env:TMP=$env:TEMP;$env:TMPDIR=$env:TEMP
$env:PLAYWRIGHT_BROWSERS_PATH='D:/07-GAMES/Firstlight/cache/ms-playwright-1.57'
$env:PYTHONPATH='C:/dev/firstlight-artifacts/bootstrap-2026-09-12/browser-env/Lib/site-packages'
$flPython='C:/dev/firstlight-artifacts/bootstrap-2026-09-12/browser-env/Scripts/python.exe'
$flCaller='D:/07-GAMES/Firstlight/artifacts/living-road-inspection-20261012/RECEIVING_CAPTURE_CALLER.py'
if((Get-FileHash -LiteralPath $flCaller -Algorithm SHA256).Hash.ToLowerInvariant() -ne 'ecfa4335cf805b648527300d6739881c17c058e7dd40257dc89dfb6b37d9ef27'){throw 'Reviewed receiving caller digest drift'}
if((Get-FileHash -LiteralPath "$flRoot/tests/earth_expedition_browser.py" -Algorithm SHA256).Hash.ToLowerInvariant() -ne $flNativeResult.harness_sha256){throw 'Current targeted native harness required'}
if((Get-FileHash -LiteralPath "$flRoot/tests/earth_expedition_journey.cjs" -Algorithm SHA256).Hash.ToLowerInvariant() -ne $flProducer.harnessSha256){throw 'Current producer harness required'}
$flPassedCommands=@(Select-String -LiteralPath $flGate.console.path -Pattern '^PASS: ')
if($flPassedCommands.Count -ne 217){throw 'Every current source command must have passed'}
$flRules=Get-Content -LiteralPath $flGate.rulesCommand.path -Raw | ConvertFrom-Json
if((Get-FileHash -LiteralPath $flGate.rulesCommand.path -Algorithm SHA256).Hash.ToLowerInvariant() -ne $flGate.rulesCommand.sha256 -or $flRules.ruleFileCount -ne 145 -or $flRules.requestedWorkers -ne 4 -or $flRules.rulesTimeoutSeconds -ne 180 -or $flRules.pythonTimeoutSeconds -ne 600){throw 'Current complete rules gate with original limits required'}
if((Get-FileHash -LiteralPath "$flRoot/tools/verify.py" -Algorithm SHA256).Hash.ToLowerInvariant() -ne $flRules.verifierSha256){throw 'Current verifier required'}
$flArguments=@('-B',$flCaller,'--work','carrier','--renderer','software','--source',$flSource,'--journey-report',$flJourney,'--output',$flOutput)
Set-Location -LiteralPath $flRoot
$flInputs=[ordered]@{}
foreach($flPath in @($flCaller,$flSource,$flJourney,$flCohort,$flSourceGate,$flNativeGate,$flNativeReport,"$flRoot/tools/capture_earth_fieldcraft.py","$flRoot/tools/capture_earth_expedition.py","$flRoot/tools/browser_support.py")){$flInputs[$flPath]=(Get-FileHash -LiteralPath $flPath -Algorithm SHA256).Hash.ToLowerInvariant()}
$flFree=(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory
$flAdmitted=$flFree -ge 6291456
[ordered]@{head=$SourceHead;observedUtc=[DateTime]::UtcNow.ToString('o');freeHostKiB=$flFree;minimumFreeKiB=6291456;admitted=$flAdmitted;htmlSha256=$flHtmlHash;inputs=$flInputs;controllerSha256=(Get-FileHash -LiteralPath $PSCommandPath -Algorithm SHA256).Hash.ToLowerInvariant();command=@($flPython)+$flArguments;scope='One ordinary-RAF native-control take; isolated synthetic earned profile, software WebGL, silent canvas only, hard90s window; not full browser/GPU/human admission'} | ConvertTo-Json -Depth 7 | Set-Content -LiteralPath $flAdmission -Encoding utf8
if(-not $flAdmitted){Write-Output 'DEFERRED: no clip browser launched; host memory below6GiB';exit 3}
$flStarted=[DateTime]::UtcNow.ToString('o')
& $flPython @flArguments *> $flConsole
$flExit=$LASTEXITCODE
[ordered]@{sourceHead=$SourceHead;headAfter=(git rev-parse HEAD).Trim();statusAfter=@(git status --porcelain);startedUtc=$flStarted;closedUtc=[DateTime]::UtcNow.ToString('o');exitCode=$flExit;freeHostKiBBefore=$flFree;freeHostKiBAfter=(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory;reportPath="$flOutput/REPORT.json";console=@{path=$flConsole;bytes=(Get-Item -LiteralPath $flConsole).Length;sha256=(Get-FileHash -LiteralPath $flConsole -Algorithm SHA256).Hash.ToLowerInvariant()};scope='Actual short canvas recording/native controls/ordinary RAF/software WebGL; no RTX/human/full-browser claim'} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $flReceipt -Encoding utf8
Get-Content -LiteralPath $flConsole -Tail 30
exit $flExit
