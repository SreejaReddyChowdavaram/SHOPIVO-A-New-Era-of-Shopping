@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    http://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM ----------------------------------------------------------------------------
@REM Maven Start Up Batch script
@REM
@REM Required ENV vars:
@REM   JAVA_HOME - location of a JDK home dir
@REM
@REM Optional ENV vars
@REM   MAVEN_BATCH_ECHO - set to 'on' to enable the echoing of the batch commands
@REM   MAVEN_BATCH_PAUSE - set to 'on' to wait for a keystroke before ending
@REM   MAVEN_OPTS - parameters passed to the Java VM when running Maven
@REM     e.g. to debug Maven itself, use
@REM       set MAVEN_OPTS=-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=y,address=8000
@REM   MAVEN_SKIP_RC - flag to disable loading of mavenrc files
@REM ----------------------------------------------------------------------------

@REM Begin all REM lines with '@' in case MAVEN_BATCH_ECHO is 'on'
@echo off
@REM set title of command window
title %0
@REM enable echoing by setting MAVEN_BATCH_ECHO to 'on'
@if "%MAVEN_BATCH_ECHO%" == "on"  echo %MAVEN_BATCH_ECHO%

@REM set %HOME% to equivalent of $HOME
if "%HOME%" == "" (set "HOME=%HOMEDRIVE%%HOMEPATH%")

@REM Execute a user defined script before this one
if not "%MAVEN_SKIP_RC%" == "" goto skipRcPre
@REM check for pre script, once with legacy .bat ending and once with .cmd ending
if exist "%USERPROFILE%\mavenrc_pre.bat" call "%USERPROFILE%\mavenrc_pre.bat" %*
if exist "%USERPROFILE%\mavenrc_pre.cmd" call "%USERPROFILE%\mavenrc_pre.cmd" %*
:skipRcPre

@setlocal

set ERROR_CODE=0

@REM To isolate internal variables from target environment, they are prefixed
@REM with 'MVN_'.

@REM ==== START VALIDATION ====
if not "%JAVA_HOME%" == "" goto OkJHome

echo.
echo Error: JAVA_HOME not found in your environment. >&2
echo Please set the JAVA_HOME variable in your environment to match the >&2
echo location of your Java installation. >&2
echo.
goto error

:OkJHome
if exist "%JAVA_HOME%\bin\java.exe" goto init

echo.
echo Error: JAVA_HOME is set to an invalid directory. >&2
echo JAVA_HOME = "%JAVA_HOME%" >&2
echo Please set the JAVA_HOME variable in your environment to match the >&2
echo location of your Java installation. >&2
echo.
goto error
@REM ==== END VALIDATION ====

:init
set MVN_CMD_LINE_ARGS=%*

@REM Find the project base dir, i.e. the directory that contains the folder
@REM ".mvn". Search up the directory tree for "mvn" dir.
set MVN_PROJECTBASEDIR=%MAVEN_PROJECTBASEDIR%
if not "%MVN_PROJECTBASEDIR%"=="" goto endDetectBaseDir

set EXEC_DIR=%CD%
set WDIR=%EXEC_DIR%
:findBaseDir
if exist "%WDIR%"\.mvn goto baseDirFound
cd ..
if "%WDIR%"=="%CD%" goto baseDirNotFound
set WDIR=%CD%
goto findBaseDir

:baseDirFound
set MVN_PROJECTBASEDIR=%WDIR%
cd "%EXEC_DIR%"
goto endDetectBaseDir

:baseDirNotFound
set MVN_PROJECTBASEDIR=%EXEC_DIR%
cd "%EXEC_DIR%"

:endDetectBaseDir

@REM Determine the Java command to use to start the JVM.
if not "%JAVA_HOME%" == "" (
  if exist "%JAVA_HOME%/bin/javaw.exe" (
    set JAVACMD=%JAVA_HOME%/bin/javaw.exe
  )
  if exist "%JAVA_HOME%/bin/java.exe" (
    set JAVACMD=%JAVA_HOME%/bin/java.exe
  )
)

@REM Determine the download URL for the Maven Wrapper JAR
for /F "usebackq tokens=1,2 delims==" %%A in ("%MVN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.properties") do (
    if "%%A"=="wrapperUrl" set DOWNLOAD_URL=%%B
)
for /F "usebackq tokens=1,2 delims==" %%A in ("%MVN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.properties") do (
    if "%%A"=="distributionUrl" set DISTRIBUTION_URL=%%B
)

@REM Check if Maven wrapper JAR exists
set WRAPPER_JAR="%MVN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar"
if exist %WRAPPER_JAR% goto runMavenWithJavaExe

@REM Download the Maven Wrapper JAR
"%JAVACMD%" -classpath "%MVN_PROJECTBASEDIR%\.mvn\wrapper" "-Dmaven.multiModuleProjectDirectory=%MVN_PROJECTBASEDIR%" org.apache.maven.wrapper.MavenWrapperMain %MVN_CMD_LINE_ARGS%

:runMavenWithJavaExe
"%JAVACMD%" ^
  %MAVEN_OPTS% ^
  %MAVEN_DEBUG_OPTS% ^
  -classpath "%MVN_PROJECTBASEDIR%\.mvn\wrapper\maven-wrapper.jar" ^
  "-Dmaven.multiModuleProjectDirectory=%MVN_PROJECTBASEDIR%" ^
  org.apache.maven.wrapper.MavenWrapperMain %MVN_CMD_LINE_ARGS%
if ERRORLEVEL 1 goto error
goto end

:error
set ERROR_CODE=1

:end
@endlocal & set ERROR_CODE=%ERROR_CODE%

if "%MAVEN_BATCH_PAUSE%"=="on" pause

if "%MAVEN_OPTS%"=="" set MAVEN_OPTS=%MAVEN_OPTS%

exit /b %ERROR_CODE%
