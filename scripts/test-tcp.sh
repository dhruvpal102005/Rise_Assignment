#!/bin/bash

# Test TCP Server with various scenarios

HOST=${1:-localhost}
PORT=${2:-5000}

echo "Testing Fleet Pulse TCP Server at $HOST:$PORT"
echo "=============================================="
echo ""

echo "Test 1: Valid registered device (354678901234561)"
echo "PING,354678901234561,18.5204,73.8567,42.5,1" | nc $HOST $PORT
sleep 1

echo ""
echo "Test 2: Another valid ping with different coordinates"
echo "PING,354678901234562,19.0760,72.8777,55.3,1" | nc $HOST $PORT
sleep 1

echo ""
echo "Test 3: Unregistered device (should trigger tracker:unknown)"
echo "PING,000000000000000,18.5204,73.8567,10.0,0" | nc $HOST $PORT
sleep 1

echo ""
echo "Test 4: Malformed packet (missing fields)"
echo "PING,354678901234561,18.5204" | nc $HOST $PORT
sleep 1

echo ""
echo "Test 5: Invalid packet header"
echo "INVALID,354678901234561,18.5204,73.8567,42.5,1" | nc $HOST $PORT
sleep 1

echo ""
echo "Test 6: Multiple pings in rapid succession"
for i in {1..5}; do
  echo "PING,354678901234563,18.$i,73.$i,$(($i * 10)).5,1" | nc $HOST $PORT &
done
wait

echo ""
echo "Tests complete! Check WebSocket client for events."
