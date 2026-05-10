@echo off
cd /d "%~dp0backend"
if not exist node_modules ( call npm install )
if not exist database.sqlite ( node seed.js )
start "" http://localhost:3000
node server.js
