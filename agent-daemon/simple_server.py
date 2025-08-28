#!/usr/bin/env python3
"""
Simple Agent Server for Orbit Desktop Assistant
Provides browser automation and AI agent capabilities
"""

import asyncio
import logging
from fastapi import FastAPI, WebSocket
import uvicorn
from playwright.async_api import async_playwright
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(title="Orbit Agent Server", version="1.0.0")

# Global browser instance for reuse
global_browser = None
global_page = None
global_playwright = None

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "Orbit Agent Server is running"}

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "service": "orbit-agent-server"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time communication with Orbit app"""
    await websocket.accept()
    logger.info("WebSocket connection established")
    
    try:
        while True:
            # Receive message from Orbit app
            data = await websocket.receive_text()
            logger.info(f"Received: {data}")
            
            # Echo response (replace with actual agent logic)
            response = f"Agent processed: {data}"
            await websocket.send_text(response)
            
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        logger.info("WebSocket connection closed")

@app.post("/agent/run")
async def run_agent_task(request: dict):
    """Execute browser automation or return LLM-suitable response"""
    try:
        # Get the task description from the request
        task_description = request.get("task", "")
        use_browser = request.get("use_browser", False)
        
        logger.info(f"Executing agent task: {task_description}")
        logger.info(f"Use browser: {use_browser}")
        
        if not task_description:
            return {
                "status": "error", 
                "error": "No task description provided"
            }
        
        if use_browser:
            # Parse the task and execute browser automation
            parsed_task = parse_multi_step_instruction(task_description)
            logger.info(f"Parsed task: {parsed_task}")
            result = await execute_browser_task(parsed_task)
        else:
            # Return response indicating this should be handled by LLM
            logger.info(f"Task identified as LLM-suitable: {task_description}")
            result = {
                "status": "llm_response",
                "result": {
                    "message": "This question can be answered directly by the AI assistant",
                    "task": task_description,
                    "use_llm": True,
                    "summary": f"Please use the LLM to answer: {task_description}"
                }
            }
        
        return result
        
    except Exception as e:
        logger.error(f"Agent execution error: {e}")
        return {
            "status": "error",
            "error": str(e)
        }

def parse_multi_step_instruction(instruction):
    """
    Parse web browsing instructions with comprehensive pattern recognition.
    
    Examples of supported instructions:
    - "go to google and search for headphones and click the first link"
    - "go to amazon and look for laptops under 1200"
    - "visit youtube and search for python tutorials"
    - "open netflix and browse movies"
    - "go to wikipedia and search for artificial intelligence"
    - "search google for best restaurants near me"
    - "find cheap flights on expedia"
    - "look up the weather on weather.com"
    """
    instruction_lower = instruction.lower()
    
    # Initialize result structure
    parsed = {
        'original_instruction': instruction,
        'requires_browser': True,  # Default to true for web tasks
        'search_query': '',
        'actions': [],
        'website': '',
        'task_type': 'general_browse'
    }
    
    # Detect website from instruction
    website_patterns = {
        'google': ['google', 'search google', 'google search'],
        'maps.google.com': ['google maps', 'maps', 'google map'],
        'amazon': ['amazon', 'amazon.com'],
        'youtube': ['youtube', 'youtube.com'],
        'netflix': ['netflix', 'netflix.com'],
        'wikipedia': ['wikipedia', 'wiki'],
        'expedia': ['expedia', 'expedia.com'],
        'weather.com': ['weather.com', 'weather website'],
        'ebay': ['ebay', 'ebay.com'],
        'facebook': ['facebook', 'fb.com'],
        'twitter': ['twitter', 'twitter.com', 'x.com'],
        'reddit': ['reddit', 'reddit.com'],
        'github': ['github', 'github.com']
    }
    
    detected_website = 'google.com'  # Default
    for site, keywords in website_patterns.items():
        if any(keyword in instruction_lower for keyword in keywords):
            detected_website = site if '.' in site else f"{site}.com"
            parsed['website'] = detected_website
            break
    
    if not parsed['website']:
        parsed['website'] = detected_website
    
    # Extract search queries with more comprehensive patterns
    search_patterns = [
        # Direct search patterns
        r'search (?:for |)(.+?)(?:\s+and\s+|\s*$)',
        r'look (?:for |up |)(.+?)(?:\s+and\s+|\s*$)',
        r'find (.+?)(?:\s+and\s+|\s*$)',
        r'google (.+?)(?:\s+and\s+|\s*$)',
        
        # Site-specific patterns  
        r'(?:go to|visit|open)\s+\w+(?:\.com|)\s+(?:and\s+)?(?:search for|look for|find)\s+(.+?)(?:\s+and\s+|\s*$)',
        r'(?:on|from)\s+\w+(?:\.com|)\s+(?:search for|look for|find)\s+(.+?)(?:\s+and\s+|\s*$)',
        
        # Shopping patterns
        r'(?:look for|find|search for)\s+(.+?)\s+(?:under|below|less than|cheaper than)\s+[\$\d]+',
        r'(?:look for|find|search for)\s+(.+?)\s+(?:on|at)\s+\w+',
    ]
    
    import re
    search_query = ""
    for pattern in search_patterns:
        match = re.search(pattern, instruction_lower)
        if match:
            search_query = match.group(1).strip()
            # Clean up common words
            search_query = re.sub(r'\s+(?:and|on|at|from|in|the)\s*$', '', search_query)
            break
    
    parsed['search_query'] = search_query
    
    # Determine task type
    if any(word in instruction_lower for word in ['shop', 'buy', 'purchase', 'price', 'cost', 'under', 'cheap']):
        parsed['task_type'] = 'shopping'
    elif any(word in instruction_lower for word in ['watch', 'video', 'tutorial', 'movie', 'show']):
        parsed['task_type'] = 'media'
    elif any(word in instruction_lower for word in ['weather', 'forecast', 'temperature']):
        parsed['task_type'] = 'weather'
    elif any(word in instruction_lower for word in ['news', 'article', 'read']):
        parsed['task_type'] = 'information'
    
    # Extract actions
    if 'click' in instruction_lower:
        if any(phrase in instruction_lower for phrase in ['first link', 'first result', 'top result']):
            parsed['actions'].append('click_first_result')
        elif 'first' in instruction_lower:
            parsed['actions'].append('click_first_result')
        else:
            parsed['actions'].append('click_link')
    
    # Add browse action if no specific search query but going to a site
    if not search_query and any(phrase in instruction_lower for phrase in ['go to', 'visit', 'open', 'browse']):
        parsed['actions'].append('navigate_and_browse')
    
    return parsed

async def execute_browser_task(parsed_task):
    """Execute browser automation based on parsed task with multi-site support"""
    search_query = parsed_task['search_query']
    actions = parsed_task['actions']
    website = parsed_task['website']
    task_type = parsed_task['task_type']
    
    logger.info(f"Performing {task_type} task on {website}")
    logger.info(f"Search query: '{search_query}', Actions: {actions}")
    
    # Start browser task in background (don't wait for completion)
    asyncio.create_task(run_browser_automation(parsed_task))
    
    # Generate appropriate response based on task
    if website == 'google.com' or not website:
        # Google search responses
        if 'click_first_result' in actions:
            return {
                "status": "success",
                "result": {
                    "search_query": search_query,
                    "summary": f"I'm opening Google, searching for '{search_query}', and clicking the first result. This will happen in your browser shortly.",
                    "message": "Browser automation initiated",
                    "url": f"https://google.com/search?q={search_query.replace(' ', '+')}" if search_query else "https://google.com",
                    "action": "search_and_click"
                }
            }
        else:
            return {
                "status": "success", 
                "result": {
                    "search_query": search_query,
                    "summary": f"I'm opening Google and searching for '{search_query}'. This will happen in your browser shortly.",
                    "message": "Browser automation initiated", 
                    "url": f"https://google.com/search?q={search_query.replace(' ', '+')}" if search_query else "https://google.com",
                    "action": "search_only"
                }
            }
    
    else:
        # Other website responses
        base_urls = {
            'maps.google.com': 'https://maps.google.com',
            'amazon.com': 'https://amazon.com',
            'youtube.com': 'https://youtube.com', 
            'netflix.com': 'https://netflix.com',
            'wikipedia.org': 'https://wikipedia.org',
            'expedia.com': 'https://expedia.com',
            'weather.com': 'https://weather.com',
            'ebay.com': 'https://ebay.com',
            'facebook.com': 'https://facebook.com',
            'twitter.com': 'https://twitter.com',
            'reddit.com': 'https://reddit.com',
            'github.com': 'https://github.com'
        }
        
        base_url = base_urls.get(website, f"https://{website}")
        
        if search_query:
            if task_type == 'shopping':
                summary = f"I'm opening {website} and looking for '{search_query}'. This will happen in your browser shortly."
            elif task_type == 'media':
                summary = f"I'm opening {website} to find '{search_query}' videos. This will happen in your browser shortly."
            elif task_type == 'weather':
                summary = f"I'm opening {website} to check the weather. This will happen in your browser shortly."
            else:
                summary = f"I'm opening {website} and searching for '{search_query}'. This will happen in your browser shortly."
        else:
            summary = f"I'm opening {website} for you to browse. This will happen in your browser shortly."
        
        return {
            "status": "success",
            "result": {
                "search_query": search_query,
                "website": website,
                "task_type": task_type,
                "summary": summary,
                "message": "Browser automation initiated",
                "url": base_url,
                "action": "navigate_and_search" if search_query else "navigate"
            }
        }

async def get_or_create_browser():
    """Get existing browser or create new one if needed"""
    global global_browser, global_page, global_playwright
    
    # Check if we have a working browser
    if global_browser and global_page:
        try:
            # Test if browser is still alive by checking the page
            await global_page.evaluate("() => document.readyState")
            logger.info("Reusing existing browser window")
            return global_browser, global_page
        except Exception as e:
            logger.info(f"Existing browser is no longer valid: {e}")
            global_browser = None
            global_page = None
    
    # Create new browser if needed
    logger.info("Creating new browser window")
    
    # Start Playwright if needed
    if not global_playwright:
        global_playwright = await async_playwright().start()
    
    # Launch browser with user agent to avoid detection
    global_browser = await global_playwright.chromium.launch(
        headless=False,
        args=[
            '--disable-blink-features=AutomationControlled',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor'
        ]
    )
    context = await global_browser.new_context(
        user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    )
    global_page = await context.new_page()
    
    # Add script to remove webdriver detection
    await global_page.add_init_script("""
        Object.defineProperty(navigator, 'webdriver', {
            get: () => undefined,
        });
    """)
    
    return global_browser, global_page

async def run_browser_automation(parsed_task):
    """Run fast browser automation with support for multiple websites and task types"""
    try:
        search_query = parsed_task['search_query']
        actions = parsed_task['actions'] 
        website = parsed_task['website']
        task_type = parsed_task['task_type']
        
        logger.info(f"Starting browser automation for {task_type} on {website}")
        logger.info(f"Search query: '{search_query}', Actions: {actions}")
        
        # Get or create browser - this will reuse existing browser if available
        browser, page = await get_or_create_browser()
        
        # Navigate to appropriate website
        if website == 'google.com' or not website:
            await handle_google_automation(page, search_query, actions)
        else:
            await handle_other_site_automation(page, website, search_query, task_type, actions)
        
        logger.info("Task completed successfully - browser will remain open permanently")
        logger.info("Browser and page will stay open for user interaction")
        
    except Exception as e:
        logger.error(f"Browser automation error: {e}")
        logger.info("Browser left open for manual completion if available")

async def handle_google_automation(page, search_query, actions):
    """Handle Google search automation"""
    logger.info("Navigating to Google...")
    await page.goto("https://www.google.com", wait_until='domcontentloaded')
    
    # Check for CAPTCHA
    current_url = page.url
    if 'sorry' in current_url or 'captcha' in current_url.lower():
        logger.warning("Google CAPTCHA detected - leaving browser open for manual completion")
        return
    
    if search_query:
        logger.info(f"Searching for: {search_query}")
        try:
            search_box = await page.wait_for_selector('textarea[name="q"], input[name="q"]', timeout=10000)
            await search_box.click()
            await page.wait_for_timeout(500)
            await search_box.type(search_query, delay=100)
            await page.wait_for_timeout(300)
            await search_box.press("Enter")
            
            # Wait for results
            await page.wait_for_selector('div#search', timeout=0)
            logger.info("Search results loaded")
            
        except Exception as search_error:
            current_url = page.url
            if 'sorry' in current_url or 'captcha' in current_url.lower():
                logger.warning("Google CAPTCHA appeared during search")
                return
            else:
                logger.error(f"Search error: {search_error}")
                return
    
    # Handle click actions
    if 'click_first_result' in actions:
        await click_first_google_result(page)

async def handle_other_site_automation(page, website, search_query, task_type, actions):
    """Handle automation for other websites"""
    # Website URL mapping
    base_urls = {
        'maps.google.com': 'https://maps.google.com',
        'amazon.com': 'https://amazon.com',
        'youtube.com': 'https://youtube.com',
        'netflix.com': 'https://netflix.com', 
        'wikipedia.org': 'https://wikipedia.org',
        'expedia.com': 'https://expedia.com',
        'weather.com': 'https://weather.com',
        'ebay.com': 'https://ebay.com',
        'facebook.com': 'https://facebook.com',
        'twitter.com': 'https://twitter.com',
        'reddit.com': 'https://reddit.com',
        'github.com': 'https://github.com'
    }
    
    base_url = base_urls.get(website, f"https://{website}")
    logger.info(f"Navigating to {base_url}")
    
    try:
        await page.goto(base_url, wait_until='domcontentloaded')
        await page.wait_for_timeout(2000)  # Let page fully load
        
        if search_query:
            # Try to find and use search functionality on the site
            await perform_site_search(page, website, search_query, task_type)
        else:
            logger.info(f"Simply opened {website} for browsing")
            
    except Exception as e:
        logger.error(f"Error navigating to {website}: {e}")

async def perform_site_search(page, website, search_query, task_type):
    """Attempt to search on various websites"""
    try:
        # Common search selectors by site
        search_selectors = {
            'maps.google.com': ['input[id="searchboxinput"]', 'input[placeholder*="Search"]', 'input[aria-label*="Search"]'],
            'amazon.com': ['input[name="field-keywords"]', '#twotabsearchtextbox', 'input[type="text"][placeholder*="Search"]'],
            'youtube.com': ['input[name="search_query"]', '#search', 'input[placeholder*="Search"]'],
            'wikipedia.org': ['input[name="search"]', '#searchInput', 'input[placeholder*="Search"]'],
            'ebay.com': ['input[name="_nkw"]', 'input[placeholder*="Search"]'],
            'reddit.com': ['input[name="q"]', 'input[placeholder*="Search"]'],
            'github.com': ['input[name="q"]', 'input[placeholder*="Search"]']
        }
        
        selectors = search_selectors.get(website, ['input[type="search"]', 'input[name="q"]', 'input[placeholder*="Search"]'])
        
        search_box = None
        for selector in selectors:
            try:
                search_box = await page.wait_for_selector(selector, timeout=3000)
                if search_box:
                    logger.info(f"Found search box with selector: {selector}")
                    break
            except:
                continue
        
        if search_box:
            await search_box.click()
            await page.wait_for_timeout(500)
            
            # Clear existing text and type search query
            await search_box.fill("")  # Clear the field
            await page.wait_for_timeout(200)
            await search_box.type(search_query, delay=100)
            await page.wait_for_timeout(300)
            
            # Try to submit the search
            await search_box.press("Enter")
            logger.info(f"Searched for '{search_query}' on {website}")
            
            # Wait for results to load
            await page.wait_for_timeout(3000)
            
        else:
            logger.warning(f"Could not find search box on {website}")
            # If no search found, try Google search as fallback
            google_search_url = f"https://www.google.com/search?q=site:{website}+{search_query.replace(' ', '+')}"
            logger.info(f"Falling back to Google site search: {google_search_url}")
            await page.goto(google_search_url)
            
    except Exception as e:
        logger.error(f"Error performing search on {website}: {e}")

async def click_first_google_result(page):
    """Click the first result on Google search results"""
    logger.info("Clicking first search result...")
    try:
        await page.wait_for_timeout(2000)
        
        selectors_to_try = [
            'div#search h3 a',
            'div#search a:has(h3)',
            'div#search a[href*="http"]:not([href*="google.com"]):not([href*="ads"]):not([role="button"])',
            'div[data-hveid] a[href*="http"]:not([href*="google.com"])',
            '#search .g a:first-child',
            '.g .yuRUbf a',
        ]
        
        first_result = None
        for selector in selectors_to_try:
            logger.info(f"Trying selector: {selector}")
            first_result = await page.query_selector(selector)
            if first_result:
                is_visible = await first_result.is_visible()
                if is_visible:
                    logger.info(f"Found clickable element with selector: {selector}")
                    break
                else:
                    first_result = None
        
        if first_result:
            await first_result.scroll_into_view_if_needed()
            await page.wait_for_timeout(500)
            
            href = await first_result.get_attribute('href')
            logger.info(f"Clicking first result: {href}")
            
            await first_result.click()
            logger.info("Successfully clicked first result")
            await page.wait_for_timeout(2000)
        else:
            logger.warning("Could not find any clickable first result")
            await page.screenshot(path='/tmp/google_search_debug.png')
            logger.info("Debug screenshot saved")
            
    except Exception as click_error:
        logger.warning(f"Could not click first result: {click_error}")
        try:
            await page.screenshot(path='/tmp/click_error_debug.png')
        except:
            pass

if __name__ == "__main__":
    logger.info("Starting Orbit Agent Server...")
    
    # Run the server on port 4823 to match agentClient expectations
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=4823,
        log_level="info"
    )