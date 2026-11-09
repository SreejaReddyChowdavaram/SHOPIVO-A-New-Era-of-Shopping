@echo off
setlocal enabledelayedexpansion

REM Read .env file line by line and export each variable
if exist "%~dp0.env" (
    echo [SHOPIVO] Loading environment variables from backend/.env...
    for /f "usebackq tokens=1* delims==" %%A in ("%~dp0.env") do (
        set "line=%%A"
        if not "!line:~0,1!"=="#" (
            if not "%%B"=="" (
                set "%%A=%%B"
            )
        )
    )
    echo [SHOPIVO] Environment variables loaded successfully.
) else (
    echo [SHOPIVO] No .env found. Running with defaults.
)

echo [SHOPIVO] Starting Spring Boot application...
call "%~dp0mvnw.cmd" spring-boot:run

