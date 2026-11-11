# Builds a release APK of Adion locally on Windows.
#   Run:  powershell -ExecutionPolicy Bypass -File .\build-apk.ps1
#   Flags: -Clean  regenerate the android/ folder and drop Gradle caches (slow; use if a build is acting weird)
#
# Why a second folder: this project lives under OneDrive, whose long path blows past Windows'
# 260-character limit during the native (CMake/ninja) build. So the project is mirrored to a short
# path, built there, and the APK is copied back next to this script as adion.apk.
param([switch]$Clean)
$ErrorActionPreference = 'Stop'

$Src   = $PSScriptRoot
$Build = 'C:\build\expense-manager'
$Sdk   = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$Cmake = Join-Path $Sdk 'cmake\4.1.2'   # CMake 4.x ships ninja 1.12, which handles our long paths
$Out   = Join-Path $Src 'adion.apk'

function Step($m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function Robo($from, $to, [string[]]$extra) {
  robocopy $from $to /MIR /MT:16 /NFL /NDL /NJH /NJS /NP @extra | Out-Null
  if ($LASTEXITCODE -ge 8) { throw "robocopy failed ($LASTEXITCODE): $from -> $to" }
}

Step 'Checking tools'
if (-not (Test-Path $Sdk))   { throw "Android SDK not found at $Sdk (install Android Studio / SDK)." }
if (-not (Test-Path $Cmake)) { throw "CMake 4.1.2 not found at $Cmake. Install it: Android Studio > SDK Manager > SDK Tools > CMake 4.1.2." }
if (-not (Get-Command java -ErrorAction SilentlyContinue)) { throw 'Java (JDK 17) not found on PATH. Install JDK 17 or open Android Studio once.' }
if ((Get-ItemProperty 'HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem').LongPathsEnabled -ne 1) {
  Write-Warning 'Windows long paths are not enabled; the native build may fail with "Filename longer than 260 characters".'
}

Step "Mirroring project to $Build"
New-Item -ItemType Directory -Force $Build | Out-Null
Robo $Src $Build @('/XD', 'node_modules', '.git', 'android', '.expo', '.cxx', 'build', '.gradle', '/XF', 'adion.apk')
Robo (Join-Path $Src 'node_modules') (Join-Path $Build 'node_modules') @()
# OneDrive marks folders read-only; Gradle cannot delete read-only folders on Windows ("Unable to delete directory").
attrib -R "$Build\node_modules\*" /S /D | Out-Null
attrib -R "$Build\src\*" /S /D | Out-Null

Push-Location $Build
try {
  Step 'Generating native Android project (expo prebuild)'
  $expoArgs = @('expo', 'prebuild', '--platform', 'android', '--no-install')
  if ($Clean) { $expoArgs += '--clean' }
  & npx @expoArgs
  if ($LASTEXITCODE -ne 0) { throw 'expo prebuild failed' }

  # Machine-local Gradle settings (forward slashes on purpose â€” backslashes get eaten by .properties).
  $props = "sdk.dir=$($Sdk.Replace([string][char]92,'/'))`ncmake.dir=$($Cmake.Replace([string][char]92,'/'))`n"
  [IO.File]::WriteAllText((Join-Path $Build 'android\local.properties'), $props)

  if ($Clean) {
    Step 'Clearing native build caches'
    foreach ($d in 'android\.cxx', 'android\build', 'android\app\.cxx', 'android\app\build', 'android\.gradle') {
      Remove-Item -Recurse -Force (Join-Path $Build $d) -ErrorAction SilentlyContinue
    }
  }

  Step 'Building release APK (first build takes a long time)'
  Push-Location (Join-Path $Build 'android')
  try {
    & .\gradlew.bat --stop | Out-Null   # release file locks held by daemons from earlier runs
    & .\gradlew.bat assembleRelease --no-daemon
    if ($LASTEXITCODE -ne 0) {
      # Windows sometimes holds a file lock right after the mirror step ("Unable to delete directory"); one retry clears it.
      Write-Warning 'Gradle failed; retrying once...'
      & .\gradlew.bat --stop | Out-Null
      & .\gradlew.bat assembleRelease --no-daemon
      if ($LASTEXITCODE -ne 0) { throw 'Gradle build failed - scroll up for the first FAILED / error: line.' }
    }
  } finally { Pop-Location }

  $apk = Join-Path $Build 'android\app\build\outputs\apk\release\app-release.apk'
  if (-not (Test-Path $apk)) { throw "Build finished but no APK at $apk" }
  Copy-Item $apk $Out -Force
  Step "Done: $Out ($([math]::Round((Get-Item $Out).Length / 1MB, 1)) MB)"
} finally { Pop-Location }



