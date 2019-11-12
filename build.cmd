@echo off
cd /d "%~dp0"
mkdir bin
node generate-data.js
npm run build 
