@REM ---------------------------------------------------------------
@REM Apache Maven Wrapper Script for Windows
@REM ---------------------------------------------------------------

@echo off
setlocal

REM Check if Maven is installed
where mvn >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Maven not found. Installing Maven 3.9.x via chocolatey...
    powershell -Command "iex ((New-Object System.Net.ServicePointManager).SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072); iex ((New-Object Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))" 2>nul
    choco install maven -y
)

REM Run Maven with all arguments
mvn %*
