#!/bin/bash

set -x #echo on

export NODE_ENV=production
npm install
npm update
nohup node index.js > std.out 2> std.err < /dev/null &
cd ../molab-auth
npm install
npm update
nohup node index.js > std.out 2> std.err < /dev/null &
cd ../molab-scalar-time-series
npm install
npm update
nohup node index.js > std.out 2> std.err < /dev/null &
cd ../molab-time-series-conversion
npm install
npm update
nohup node index.js > std.out 2> std.err < /dev/null &
cd ../molab-vector-time-series
nohup python3 server.py > std.out 2> std.err < /dev/null &
