const axios = require('axios');

/**
 * Agent Client Service for connecting to the agent-daemon
 * Handles web searches and browser automation tasks
 */
class AgentClient {
    constructor() {
        this.agentDaemonUrl = process.env.AGENT_DAEMON_URL || 'http://localhost:4823';
        this.healthCheckTimeout = parseInt(process.env.AGENT_HEALTH_TIMEOUT) || 2000;
        this.taskTimeout = parseInt(process.env.AGENT_TASK_TIMEOUT) || 30000;
        this.isAvailable = false;
        this.checkAvailability();
    }

    /**
     * Check if agent-daemon is available
     */
    async checkAvailability() {
        try {
            const response = await axios.get(`${this.agentDaemonUrl}/health`, { timeout: this.healthCheckTimeout });
            this.isAvailable = response.status === 200;
            console.log(`[AgentClient] Agent-daemon is ${this.isAvailable ? 'available' : 'unavailable'} at ${this.agentDaemonUrl}`);
        } catch (error) {
            this.isAvailable = false;
            console.log(`[AgentClient] Agent-daemon not available at ${this.agentDaemonUrl}: ${error.message}`);
        }
    }

    /**
     * Detect if a user query requires web search/browser automation vs LLM response
     * @param {string} query - User query  
     * @returns {boolean} - True if query needs web search/browser automation, false for LLM
     */
    isSearchQuery(query) {
        const queryLower = query.toLowerCase().trim();
        
        // EXPLICIT BROWSER COMMANDS - Always require browser
        const explicitBrowserCommands = [
            'search for', 'google', 'find on', 'lookup on', 'browse', 'web search', 
            'go to', 'visit', 'open', 'navigate to', 'check on',
            'click', 'click on', 'click the', 'select', 'choose',
            'first link', 'first result', 'top result',
            'amazon', 'youtube', 'netflix', 'wikipedia', 'maps', 'ebay', 'facebook', 'twitter',
            'buy', 'purchase', 'shop for', 'order', 'add to cart'
        ];
        
        // Check for explicit browser commands first
        if (explicitBrowserCommands.some(cmd => queryLower.includes(cmd))) {
            return true;
        }
        
        // CURRENT/RECENT INFO - Likely needs web search
        const currentInfoIndicators = [
            'latest', 'recent', 'current', 'new', 'updated', 'today', 'now', 'this week',
            '2024', '2025', 'this year', 'this month', 'breaking', 'trending',
            'price', 'cost', 'stock price', 'weather', 'news', 'score', 'results'
        ];
        
        // GENERAL KNOWLEDGE - Can be answered by LLM
        const llmSuitablePatterns = [
            // Basic definitions and explanations
            /^what is (?!the (latest|current|recent|new))/i,
            /^what are (?!the (latest|current|recent|new))/i,
            /^who is (?!the (current|new|latest))/i,
            /^who was/i,
            /^when was/i,
            /^where is (?!the (nearest|closest))/i,
            /^how does/i,
            /^how do/i,
            /^why is/i,
            /^why do/i,
            /^explain/i,
            /^define/i,
            /^what does .+ mean/i,
            /^tell me about (?!the (latest|current|recent))/i,
            
            // Historical and factual questions
            /^when did/i,
            /^where did/i,
            /^how did/i,
            /^who invented/i,
            /^who created/i,
            /^what happened/i,
            
            // General concepts and knowledge
            /^how to (?!(find|search|buy|purchase))/i,
            /^what are the (benefits|advantages|disadvantages|pros|cons)/i,
            /^what are (some|examples of|types of) (?!(the latest|current))/i,
            /^can you (explain|tell me|help me understand)/i,
            /^help me understand/i,
            
            // Mathematical and technical concepts
            /^calculate/i,
            /^solve/i,
            /^what is [\d\+\-\*\/\s]+ equal/i,
        ];
        
        // Check if query matches LLM-suitable patterns
        const isLLMSuitable = llmSuitablePatterns.some(pattern => pattern.test(queryLower));
        
        if (isLLMSuitable) {
            // Double-check for current info indicators that would require web search
            const needsCurrentInfo = currentInfoIndicators.some(indicator => queryLower.includes(indicator));
            return needsCurrentInfo; // Return true only if needs current info
        }
        
        // AMBIGUOUS CASES - Check for current info needs
        const questionWords = ['what', 'who', 'where', 'when', 'how', 'why'];
        const startsWithQuestion = questionWords.some(word => queryLower.startsWith(word));
        
        if (startsWithQuestion) {
            // If it's a question but needs current info, use browser
            return currentInfoIndicators.some(indicator => queryLower.includes(indicator));
        }
        
        // DEFAULT FALLBACK
        // For location-based queries ("near me", "nearby", addresses)
        if (queryLower.includes('near me') || queryLower.includes('nearby') || queryLower.includes('location')) {
            return true;
        }
        
        // For comparison queries that might need current data
        if (queryLower.includes('vs') || queryLower.includes('versus') || queryLower.includes('compare')) {
            return true;
        }
        
        // Multi-step instructions with 'and' - likely browser tasks
        if (queryLower.includes(' and ') && explicitBrowserCommands.some(cmd => queryLower.includes(cmd))) {
            return true;
        }
        
        // Default to LLM for general knowledge questions
        return false;
    }

    /**
     * Run a task using the agent-daemon
     * @param {string} task - Task description
     * @returns {Promise<Object>} - Agent response
     */
    async runTask(task) {
        if (!this.isAvailable) {
            await this.checkAvailability();
            if (!this.isAvailable) {
                throw new Error('Agent-daemon is not available');
            }
        }

        try {
            console.log(`[AgentClient] Sending task to agent-daemon: ${task}`);
            
            const response = await axios.post(`${this.agentDaemonUrl}/agent/run`, {
                task: task,
                use_browser: this.isSearchQuery(task)
            }, {
                timeout: this.taskTimeout,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log(`[AgentClient] Received response from agent-daemon:`, response.data);
            return response.data;

        } catch (error) {
            console.error(`[AgentClient] Error calling agent-daemon:`, error.message);
            
            // If agent-daemon is down, mark as unavailable
            if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
                this.isAvailable = false;
            }
            
            throw new Error(`Agent-daemon error: ${error.message}`);
        }
    }

    /**
     * Get agent-daemon health status
     * @returns {Promise<Object>} - Health status
     */
    async getHealth() {
        try {
            const response = await axios.get(`${this.agentDaemonUrl}/health`, { timeout: this.healthCheckTimeout });
            return response.data;
        } catch (error) {
            throw new Error(`Agent-daemon health check failed: ${error.message}`);
        }
    }
}

// Export singleton instance
const agentClient = new AgentClient();
module.exports = agentClient;