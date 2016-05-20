#!/bin/bash

set -x #echo on

ps -A | grep node
ps -A | grep python3

pkill -x node
pkill -x python3
