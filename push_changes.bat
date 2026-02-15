@echo off
set "COMMIT_MSG=%~1"
if "%COMMIT_MSG%"=="" set "COMMIT_MSG=Updated search and filter UI"
git add .
git commit -m "%COMMIT_MSG%"
git push
