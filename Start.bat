del "%cd%\rtalkDistribution\moquette\bin\moquette_store.*"
start /d "%cd%\rtalkDistribution\moquette\bin" moquette.bat
start /d "%cd%\rtalkDistribution" startWin64.bat

TITLE NPM
npm start
