@echo off

cd /d "%~dp0"
call build.cmd
call npm run run
