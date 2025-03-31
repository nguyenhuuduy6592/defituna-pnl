#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to cleanup when script is terminated
cleanup() {
  echo -e "\n${RED}Stopping all services...${NC}"
  kill $SERVER_PID 2>/dev/null
  exit 0
}

# Set up trap to catch SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

echo -e "${GREEN}Starting BrowserTools services...${NC}"

# Start browser-tools-server in background
echo -e "${BLUE}Starting browser-tools-server...${NC}"
npx @agentdeskai/browser-tools-server@latest &
SERVER_PID=$!

# Wait for the server to be fully initialized
echo -e "${YELLOW}Waiting for server to initialize...${NC}"
sleep 5

# Check if server is running
if ps -p $SERVER_PID > /dev/null; then
  echo -e "${GREEN}Browser-tools-server is running with PID: $SERVER_PID${NC}"
else
  echo -e "${RED}Failed to start browser-tools-server${NC}"
  exit 1
fi

# Start browser-tools-mcp in foreground
echo -e "${BLUE}Starting browser-tools-mcp...${NC}"
echo -e "${BLUE}Press Ctrl+C to stop both servers${NC}"
npx @agentdeskai/browser-tools-mcp@latest

# If browser-tools-mcp exits, also clean up the server
cleanup 