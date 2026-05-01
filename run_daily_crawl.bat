@echo off
REM === Fynda Daily Booli Crawl ===
REM Runs scraper + analyzer, then commits and pushes results.

cd /d "c:\dev\fynda"

echo [%date% %time%] Starting daily crawl...

REM 1. Run scraper
python scraper.py --output booli_daily_snapshot.json
if %ERRORLEVEL% NEQ 0 (
    echo [%date% %time%] Scraper failed with exit code %ERRORLEVEL%
    exit /b 1
)

REM 2. Run analyzer
python analyze.py booli_daily_snapshot.json
if %ERRORLEVEL% NEQ 0 (
    echo [%date% %time%] Analyzer failed with exit code %ERRORLEVEL%
    exit /b 1
)

REM 3. Commit and push
git add src/listing_data.json
git commit -m "Daily Booli snapshot %date%"
git pull --rebase
git push

echo [%date% %time%] Daily crawl complete.
