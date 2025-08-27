#!/usr/bin/env python3
"""
Simple Agent Server for Glass Desktop Assistant
Provides browser automation and AI agent capabilities
"""

import asyncio
import logging
from fastapi import FastAPI, WebSocket
import uvicorn
from browser_use import Agent

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Glass Agent Server", version="1.0.0")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "Glass Agent Server is running"}

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "glass-agent-server"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication with Glass app"""
    await websocket.accept()
    logger.info("WebSocket connection established")
    
    try:
        while True:
            # Receive message from Glass app
            data = await websocket.receive_text()
            logger.info(f"Received: {data}")
            
            # Echo response (replace with actual agent logic)
            response = f"Agent processed: {data}"
            await websocket.send_text(response)
            
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        logger.info("WebSocket connection closed")

@app.post("/agent/execute")
async def execute_agent_task(task: dict):
    """Execute browser automation task"""
    try:
        # Initialize browser agent
        # This would integrate with browser-use library
        
        task_description = task.get("description", "")
        logger.info(f"Executing agent task: {task_description}")
        
        # Placeholder for actual agent execution
        result = {
            "status": "completed",
            "task": task_description,
            "result": "Task executed successfully"
        }
        
        return result
        
    except Exception as e:
        logger.error(f"Agent execution error: {e}")
        return {
            "status": "error",
            "error": str(e)
        }

if __name__ == "__main__":
    logger.info("Starting Glass Agent Server...")
    
    # Run the server
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        log_level="info"
    )