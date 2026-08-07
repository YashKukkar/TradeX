
# auto-resolve the project root folder (works for everyone)
$PROJECT_ROOT = $PSScriptRoot
if (-not $PROJECT_ROOT) { $PROJECT_ROOT = (Get-Location).Path }
Set-Location $PROJECT_ROOT

# verify folders exist
if (-not (Test-Path "$PROJECT_ROOT\backend") -or -not (Test-Path "$PROJECT_ROOT\nextjs-app")) {
    Write-Host "ERROR: Run this from the project root folder!" -ForegroundColor Red
    exit 1
}

function Test-Command($name) {
    return !!(Get-Command $name -ErrorAction SilentlyContinue)
}

# node
if (-not (Test-Command node)) {
    Write-Host "Node not found, installing..."
    winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
    $env:PATH = [System.Environment]::GetEnvironmentVariable("PATH", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("PATH", "User")
}

# java check & enforcement
$javaOk = $false
$verOutput = ""

$searchRoots = @(
    "C:\Program Files\Eclipse Adoptium",
    "C:\Program Files\Java",
    "C:\Program Files\Microsoft",
    "C:\Program Files\Amazon Corretto",
    "C:\Program Files\Zulu",
    "C:\Program Files\BellSoft",
    "$env:USERPROFILE\.jdks"
)

$jh = ""
foreach ($searchDir in $searchRoots) {
    if (Test-Path $searchDir) {
        $candidates = Get-ChildItem -Path $searchDir -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '26' }
        foreach ($c in $candidates) {
            if (Test-Path "$($c.FullName)\bin\java.exe") {
                $jh = $c.FullName
                break
            }
        }
    }
    if ($jh) { break }
}

if (-not $jh) {
    $jh = $env:JAVA_HOME
    if (-not $jh) {
        $jh = [System.Environment]::GetEnvironmentVariable("JAVA_HOME", "Machine")
        if (-not $jh) {
            $jh = [System.Environment]::GetEnvironmentVariable("JAVA_HOME", "User")
        }
    }
}

if ($jh -and (Test-Path "$jh\bin\java.exe")) {
    $env:JAVA_HOME = $jh.TrimEnd('\')
    $env:PATH = "$jh\bin;" + $env:PATH
}

if (Test-Command java) {
    $verOutput = (java -version 2>&1) | Out-String
    if ($verOutput -match 'version "(26[\d\.]*)"') {
        $javaOk = $true
    }
}

if (-not $javaOk) {
    Write-Host "ERROR: Java 26 is required to run TradeX backend, but was not found or is an incompatible version!" -ForegroundColor Red
    if ($verOutput) {
        Write-Host "Detected Java version output: $verOutput" -ForegroundColor Yellow
    }
    Write-Host "Please install OpenJDK 26 and set JAVA_HOME to point to JDK 26." -ForegroundColor Yellow
    exit 1
}


# maven
if (-not (Test-Command mvn)) {
    $MAVEN_DIR = "$env:USERPROFILE\.maven"
    $MVN_BIN = "$MAVEN_DIR\apache-maven-3.9.9\bin\mvn.cmd"
    if (-not (Test-Path $MVN_BIN)) {
        Write-Host "Maven not found, installing..." -ForegroundColor Cyan
        $zipPath = "$env:TEMP\maven.zip"
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri "https://archive.apache.org/dist/maven/maven-3/3.9.9/binaries/apache-maven-3.9.9-bin.zip" -OutFile $zipPath
        Write-Host "Extracting Maven..." -ForegroundColor Cyan
        Expand-Archive -Path $zipPath -DestinationPath $MAVEN_DIR -Force
        Remove-Item $zipPath -Force
    }
    $env:PATH = "$MAVEN_DIR\apache-maven-3.9.9\bin;" + $env:PATH
}


# install dependencies (use powershell shell to avoid cmd.exe path bugs)
if (-not (Test-Path "$PROJECT_ROOT\nextjs-app\node_modules\.bin\next.ps1")) {
    Write-Host "Installing dependencies for nextjs-app..." -ForegroundColor Cyan
    Push-Location "$PROJECT_ROOT\nextjs-app"
    npm install --script-shell=powershell --no-audit --no-fund
    Pop-Location
}
if (-not (Test-Path "$PROJECT_ROOT\tradex-app\node_modules\.bin\vite.ps1")) {
    Write-Host "Installing dependencies for tradex-app..." -ForegroundColor Cyan
    Push-Location "$PROJECT_ROOT\tradex-app"
    npm install --script-shell=powershell --no-audit --no-fund
    Pop-Location
}

# launch services
# CRITICAL FIX: The JVM hangs on Windows if the %TMP%\hsperfdata directory is corrupt.
# Disabling PerfData globally for this session ensures Maven and Spring Boot will not hang.
$env:_JAVA_OPTIONS = "-XX:-UsePerfData"

Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:_JAVA_OPTIONS='-XX:-UsePerfData'; Set-Location '$PROJECT_ROOT\backend'; mvn spring-boot:run '-Dspring-boot.run.fork=false'"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PROJECT_ROOT\nextjs-app'; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PROJECT_ROOT\tradex-app'; npm run dev"

Write-Host ""
Write-Host "Running:"
Write-Host "  http://localhost:3000  (NextJS)"
Write-Host "  http://localhost:5173  (TradeX App)"
Write-Host "  http://localhost:8080  (API)"
