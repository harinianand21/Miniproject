@echo off
cd backend
echo Cleaning node_modules...
rmdir /s /q node_modules
echo Installing dependencies...
npm install express mongoose cors dotenv --no-audit --no-fund
echo Installation complete.
dir node_modules
