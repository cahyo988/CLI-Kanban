@echo off
rem Starts ClaudeKanban and opens it in the default browser.
cd /d "%~dp0"
start "" http://127.0.0.1:4777/
node server.js
