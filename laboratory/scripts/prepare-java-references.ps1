param([string]$Jdk = 'C:\Program Files\JetBrains\PyCharm 2025.3.3\jbr')
$ErrorActionPreference = 'Stop'
$referenceRoot = Join-Path $PSScriptRoot '../.local/phase4-reference'
New-Item -ItemType Directory -Force $referenceRoot | Out-Null
$revision = 'c94b0d8f33fd89eaadcec5a9f3fbf296b6b0e3f7'
$baseUrl = "https://raw.githubusercontent.com/ignasi-p/eq-diagr/$revision"
$tree = Invoke-RestMethod 'https://api.github.com/repos/ignasi-p/eq-diagr/git/trees/9e59e2201ba44e342121294d7f5e4cbb9867cdc3?recursive=1'
foreach ($entry in $tree.tree) {
    if ($entry.path.StartsWith('src/') -and $entry.path.EndsWith('.java')) {
        $destination = Join-Path "$referenceRoot/library" $entry.path
        New-Item -ItemType Directory -Force (Split-Path $destination) | Out-Null
        Invoke-WebRequest "$baseUrl/LibChemDiagr/$($entry.path)" -OutFile $destination
    }
}
Invoke-WebRequest "$baseUrl/EC/src/ec/EC.java" -OutFile "$referenceRoot/EC.java"
Invoke-WebRequest "$baseUrl/LICENSE" -OutFile "$referenceRoot/LICENSE"
& "$Jdk/bin/javac.exe" -encoding UTF-8 -sourcepath "$referenceRoot/library/src" -d "$referenceRoot/classes" "$referenceRoot/EC.java"
if ($LASTEXITCODE -ne 0) { throw 'Official EC compilation failed.' }
& "$Jdk/bin/javac.exe" -encoding UTF-8 -cp "$referenceRoot/classes" -d "$referenceRoot/classes" "$PSScriptRoot/ReferenceProbe.java"
if ($LASTEXITCODE -ne 0) { throw 'Reference adapter compilation failed.' }
Write-Output 'Reference classes prepared under .local. Run npm run reference:java from the project directory.'
