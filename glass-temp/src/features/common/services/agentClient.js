const axios = require('axios');

/**
 * Agent Client Service for connecting to the agent-daemon
 * Handles web searches and browser automation tasks
 */
class AgentClient {
    constructor() {
        this.agentDaemonUrl = process.env.AGENT_DAEMON_URL || 'http://localhost:4823';
        this.healthCheckTimeout = parseInt(process.env.AGENT_HEALTH_TIMEOUT) || 2000;
        this.taskTimeout = parseInt(process.env.AGENT_TASK_TIMEOUT) || 10000;
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
     * Detect if a user query requires web search
     * @param {string} query - User query
     * @returns {boolean} - True if query needs web search
     */
    isSearchQuery(query) {
        const searchIndicators = [
            // Direct search commands
            'search for', 'google', 'find', 'lookup', 'browse', 'web search',
            
            // Question words that often need current info
            'what is', 'who is', 'where is', 'when is', 'how to', 'why is',
            'what are', 'who are', 'where are', 'when are', 'how are',
            
            // Current/recent info requests
            'latest', 'recent', 'current', 'new', 'updated', 'today', 'now',
            '2024', '2025', 'this year', 'this month',
            
            // Comparison/shopping queries
            'best', 'top', 'compare', 'vs', 'versus', 'better than',
            'price', 'cost', 'buy', 'purchase', 'shop',
            
            // Information gathering
            'news', 'information about', 'tell me about', 'learn about',
            'facts about', 'details about', 'research',
            
            // List/recommendation queries
            'list of', 'examples of', 'types of', 'kinds of', 'recommendations'
        ];

        const queryLower = query.toLowerCase();
        return searchIndicators.some(indicator => queryLower.includes(indicator));
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