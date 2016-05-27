call npm install
call npm update
start /b cmd /c node index.js
cd ../molab-auth
call npm install
call npm update
start /b cmd /c node index.js
cd ../molab-scalar-time-series
call npm install
call npm update
start /b cmd /c node index.js
cd ../molab-time-series-conversion
call npm install
call npm update
start /b cmd /c node index.js
cd ../molab-vector-time-series
start /b cmd /c python server.py
cd ../molab-visualization-gateway
