# Orbit Agent Daemon

Python backend service for the Orbit AI Desktop Assistant that provides browser automation and AI agent capabilities.

## Features

- FastAPI-based web server
- WebSocket support for real-time communication with Orbit app  
- Browser automation using browser-use library
- RESTful API endpoints for agent task execution
- Health check and monitoring endpoints

## Installation

1. Create and activate virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

Start the agent server:
```bash
python simple_server.py
```

The server will be available at `http://localhost:8000`

## API Endpoints

- `GET /` - Root endpoint with service status
- `GET /health` - Health check endpoint
- `POST /agent/execute` - Execute browser automation tasks
- `WebSocket /ws` - Real-time communication with Orbit app

## Integration

This agent daemon integrates with the Orbit desktop application (`glass-temp/`) to provide:
- Browser automation capabilities
- AI-powered web interaction
- Real-time task execution
- WebSocket communication for live updates