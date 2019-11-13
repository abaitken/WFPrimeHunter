@echo off
cd /d "%~dp0"
mkdir bin
del bin\*.* /Q
node generate-data.js
npm run build 
