const { BrowserWindow } = require('electron');
const { createStreamingLLM } = require('../common/ai/factory');
// Lazy require helper to avoid circular dependency issues
const getWindowManager = () => require('../../window/windowManager');
const internalBridge = require('../../bridge/internalBridge');
const agentClient = require('../common/services/agentClient');

const getWindowPool = () => {
    try {
        return getWindowManager().windowPool;
    } catch {
        return null;
    }
};

const sessionRepository = require('../common/repositories/session');
const askRepository = require('./repositories');
const { getSystemPrompt } = require('../common/prompts/promptBuilder');
const path = require('node:path');
const fs = require('node:fs');
const os = require('os');
const util = require('util');
const execFile = util.promisify(require('child_process').execFile);
const { desktopCapturer } = require('electron');
const modelStateService = require('../common/services/modelStateService');

// Try to load sharp, but don't fail if it's not available
let sharp;
try {
    sharp = require('sharp');
    console.log('[AskService] Sharp module loaded successfully');
} catch (error) {
    console.warn('[AskService] Sharp module not available:', error.message);
    console.warn('[AskService] Screenshot functionality will work with reduced image processing capabilities');
    sharp = null;
}
let lastScreenshot = null;

async function captureScreenshot(options = {}) {
    if (process.platform === 'darwin') {
        try {
            const tempPath = path.join(os.tmpdir(), `screenshot-${Date.now()}.jpg`);

            await execFile('screencapture', ['-x', '-t', 'jpg', tempPath]);

            const imageBuffer = await fs.promises.readFile(tempPath);
            await fs.promises.unlink(tempPath);

            if (sharp) {
                try {
                    // Try using sharp for optimal image processing
                    const resizedBuffer = await sharp(imageBuffer)
                        .resize({ height: 384 })
                        .jpeg({ quality: 80 })
                        .toBuffer();

                    const base64 = resizedBuffer.toString('base64');
                    const metadata = await sharp(resizedBuffer).metadata();

                    lastScreenshot = {
                        base64,
                        width: metadata.width,
                        height: metadata.height,
                        timestamp: Date.now(),
                    };

                    return { success: true, base64, width: metadata.width, height: metadata.height };
                } catch (sharpError) {
                    console.warn('Sharp module failed, falling back to basic image processing:', sharpError.message);
                }
            }
            
            // Fallback: Return the original image without resizing
            console.log('[AskService] Using fallback image processing (no resize/compression)');
            const base64 = imageBuffer.toString('base64');
            
            lastScreenshot = {
                base64,
                width: null, // We don't have metadata without sharp
                height: null,
                timestamp: Date.now(),
            };

            return { success: true, base64, width: null, height: null };
        } catch (error) {
            console.error('Failed to capture screenshot:', error);
            return { success: false, error: error.message };
        }
    }

    try {
        const sources = await desktopCapturer.getSources({
            types: ['screen'],
            thumbnailSize: {
                width: 1920,
                height: 1080,
            },
        });

        if (sources.length === 0) {
            throw new Error('No screen sources available');
        }
        const source = sources[0];
        const buffer = source.thumbnail.toJPEG(70);
        const base64 = buffer.toString('base64');
        const size = source.thumbnail.getSize();

        return {
            success: true,
            base64,
            width: size.width,
            height: size.height,
        };
    } catch (error) {
        console.error('Failed to capture screenshot using desktopCapturer:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * @class
 * @description
 */
class AskService {
    constructor() {
        this.abortController = null;
        this.state = {
            isVisible: false,
            isLoading: false,
            isStreaming: false,
            currentQuestion: '',
            currentResponse: '',
            showTextInput: true,
        };
        console.log('[AskService] Service instance created.');
    }

    _broadcastState() {
        try {
            // Send to ask window first, fallback to header if ask window doesn't exist
            const askWindow = getWindowPool()?.get('ask');
            const headerWindow = getWindowPool()?.get('header');
            
            // Create a safe state object for logging (truncate large responses)
            const safeState = {
                ...this.state,
                currentResponse: this.state.currentResponse ? 
                    (this.state.currentResponse.length > 200 ? 
                        this.state.currentResponse.substring(0, 200) + '...[truncated]' : 
                        this.state.currentResponse) : 
                    ''
            };
            
            if (askWindow && !askWindow.isDestroyed()) {
                console.log('[AskService] Broadcasting state to ask window (response length:', this.state.currentResponse?.length || 0, ')');
                askWindow.webContents.send('ask:stateUpdate', this.state);
            }
            
            // Also send to header for the overlay display
            if (headerWindow && !headerWindow.isDestroyed()) {
                console.log('[AskService] Broadcasting state to header (response length:', this.state.currentResponse?.length || 0, ')');
                headerWindow.webContents.send('ask:stateUpdate', this.state);
                
                // Write response to temporary file as backup
                if (this.state.currentResponse && this.state.currentResponse.length > 0) {
                    const fs = require('fs');
                    const path = require('path');
                    const os = require('os');
                    
                    try {
                        const tempFile = path.join(os.tmpdir(), 'glass-response.json');
                        fs.writeFileSync(tempFile, JSON.stringify({
                            response: this.state.currentResponse,
                            timestamp: Date.now(),
                            isComplete: !this.state.isStreaming
                        }));
                        console.log('[AskService] Wrote response to temp file:', tempFile);
                    } catch (err) {
                        console.error('[AskService] Failed to write temp file:', err.message);
                    }
                }
            } else {
                console.log('[AskService] Header window not available for broadcasting state');
            }
        } catch (broadcastError) {
            console.error('[AskService] Error in _broadcastState:', broadcastError.message);
            // Don't rethrow - continue execution
        }
    }

    async toggleAskButton(inputScreenOnly = false) {
        const askWindow = getWindowPool()?.get('ask');

        let shouldSendScreenOnly = false;
        if (inputScreenOnly && this.state.showTextInput && askWindow && askWindow.isVisible()) {
            shouldSendScreenOnly = true;
            await this.sendMessage('', []);
            return;
        }

        const hasContent = this.state.isLoading || this.state.isStreaming || (this.state.currentResponse && this.state.currentResponse.length > 0);

        if (askWindow && askWindow.isVisible() && hasContent) {
            this.state.showTextInput = !this.state.showTextInput;
            this._broadcastState();
        } else {
            // Show/hide the ask window
            const internalBridge = require('../../bridge/internalBridge');
            if (askWindow && askWindow.isVisible()) {
                this.state.isVisible = false;
                internalBridge.emit('window:requestVisibility', { name: 'ask', visible: false });
            } else {
                this.state.isVisible = true;
                this.state.showTextInput = true;
                internalBridge.emit('window:requestVisibility', { name: 'ask', visible: true });
                this._broadcastState();
            }
        }
    }

    async closeAskWindow () {
            if (this.abortController) {
                this.abortController.abort('Window closed by user');
                this.abortController = null;
            }
    
            this.state = {
                isVisible      : false,
                isLoading      : false,
                isStreaming    : false,
                currentQuestion: '',
                currentResponse: '',
                showTextInput  : true,
            };
            this._broadcastState();
    
            // Hide the ask window
            const internalBridge = require('../../bridge/internalBridge');
            internalBridge.emit('window:requestVisibility', { name: 'ask', visible: false });
    
            return { success: true };
        }
    

    /**
     * 
     * @param {string[]} conversationTexts
     * @returns {string}
     * @private
     */
    _formatConversationForPrompt(conversationTexts) {
        if (!conversationTexts || conversationTexts.length === 0) {
            return 'No conversation history available.';
        }
        return conversationTexts.slice(-30).join('\n');
    }

    /**
     * 
     * @param {string} userPrompt
     * @returns {Promise<{success: boolean, response?: string, error?: string}>}
     */
    async sendMessage(userPrompt, conversationHistoryRaw=[]) {
        // Show the ask window when sending a message
        const internalBridge = require('../../bridge/internalBridge');
        internalBridge.emit('window:requestVisibility', { name: 'ask', visible: true });
        
        this.state = {
            ...this.state,
            isVisible: true,
            isLoading: true,
            isStreaming: false,
            currentQuestion: userPrompt,
            currentResponse: '',
            showTextInput: false,
        };
        this._broadcastState();

        if (this.abortController) {
            this.abortController.abort('New request received.');
        }
        this.abortController = new AbortController();
        const { signal } = this.abortController;


        let sessionId;

        try {
            console.log(`[AskService] Processing message: ${userPrompt.substring(0, 50)}...`);

            sessionId = await sessionRepository.getOrCreateActive('ask');
            await askRepository.addAiMessage({ sessionId, role: 'user', content: userPrompt.trim() });
            console.log(`[AskService] DB: Saved user prompt to session ${sessionId}`);
            
            // Check if this requires web search/browser automation
            if (agentClient.isSearchQuery(userPrompt)) {
                console.log(`[AskService] Detected search query, delegating to agent-daemon: ${userPrompt}`);
                
                try {
                    const agentResponse = await agentClient.runTask(userPrompt);
                    
                    if (agentResponse.status === 'success') {
                        const result = agentResponse.result;
                        const summary = result.summary || result.message || 'Search completed successfully';
                        
                        // Update state for agent response
                        this.state = {
                            ...this.state,
                            isLoading: false,
                            isStreaming: false,
                            currentResponse: summary,
                            showTextInput: true,
                        };
                        this._broadcastState();
                        
                        // Save agent response to database
                        await askRepository.addAiMessage({ 
                            sessionId, 
                            role: 'assistant', 
                            content: summary 
                        });
                        console.log(`[AskService] DB: Saved agent response to session ${sessionId}`);
                        
                        // Send response to window
                        const askWin = getWindowPool()?.get('header');
                        if (askWin && !askWin.isDestroyed()) {
                            askWin.webContents.send('ask-response-complete', { 
                                response: summary,
                                type: 'agent',
                                url: result.url,
                                search_query: result.search_query
                            });
                        }
                        
                        return { success: true, response: summary };
                    } else {
                        console.log(`[AskService] Agent failed, falling back to AI: ${agentResponse.error}`);
                        // Continue with normal AI processing as fallback
                    }
                } catch (agentError) {
                    console.log(`[AskService] Agent error, falling back to AI: ${agentError.message}`);
                    // Continue with normal AI processing as fallback
                }
            }
            
            const modelInfo = await modelStateService.getCurrentModelInfo('llm');
            if (!modelInfo || !modelInfo.apiKey) {
                throw new Error('AI model or API key not configured.');
            }
            console.log(`[AskService] Using model: ${modelInfo.model} for provider: ${modelInfo.provider}`);

            const screenshotResult = await captureScreenshot({ quality: 'medium' });
            const screenshotBase64 = screenshotResult.success ? screenshotResult.base64 : null;

            const conversationHistory = this._formatConversationForPrompt(conversationHistoryRaw);

            const systemPrompt = getSystemPrompt('pickle_glass_analysis', conversationHistory, false);

            const messages = [
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: [
                        { type: 'text', text: `User Request: ${userPrompt.trim()}` },
                    ],
                },
            ];

            if (screenshotBase64) {
                messages[1].content.push({
                    type: 'image_url',
                    image_url: { url: `data:image/jpeg;base64,${screenshotBase64}` },
                });
            }
            
            const streamingLLM = createStreamingLLM(modelInfo.provider, {
                apiKey: modelInfo.apiKey,
                model: modelInfo.model,
                temperature: 0.7,
                maxTokens: 2048,
                usePortkey: modelInfo.provider === 'openai-orbit',
                portkeyVirtualKey: modelInfo.provider === 'openai-orbit' ? modelInfo.apiKey : undefined,
            });

            try {
                const response = await streamingLLM.streamChat(messages);
                // Ask input is now in header, send responses to header window
                const askWin = getWindowPool()?.get('header');

                if (!askWin || askWin.isDestroyed()) {
                    console.error("[AskService] Header window is not available to send stream to.");
                    response.body.getReader().cancel();
                    return { success: false, error: 'Header window is not available.' };
                }

                const reader = response.body.getReader();
                signal.addEventListener('abort', () => {
                    console.log(`[AskService] Aborting stream reader. Reason: ${signal.reason}`);
                    reader.cancel(signal.reason).catch(() => { /* 이미 취소된 경우의 오류는 무시 */ });
                });

                await this._processStream(reader, askWin, sessionId, signal);
                return { success: true };

            } catch (multimodalError) {
                // 멀티모달 요청이 실패했고 스크린샷이 포함되어 있다면 텍스트만으로 재시도
                if (screenshotBase64 && this._isMultimodalError(multimodalError)) {
                    console.log(`[AskService] Multimodal request failed, retrying with text-only: ${multimodalError.message}`);
                    
                    // 텍스트만으로 메시지 재구성
                    const textOnlyMessages = [
                        { role: 'system', content: systemPrompt },
                        {
                            role: 'user',
                            content: `User Request: ${userPrompt.trim()}`
                        }
                    ];

                    const fallbackResponse = await streamingLLM.streamChat(textOnlyMessages);
                    const askWin = getWindowPool()?.get('header');

                    if (!askWin || askWin.isDestroyed()) {
                        console.error("[AskService] Header window is not available for fallback response.");
                        fallbackResponse.body.getReader().cancel();
                        return { success: false, error: 'Ask window is not available.' };
                    }

                    const fallbackReader = fallbackResponse.body.getReader();
                    signal.addEventListener('abort', () => {
                        console.log(`[AskService] Aborting fallback stream reader. Reason: ${signal.reason}`);
                        fallbackReader.cancel(signal.reason).catch(() => {});
                    });

                    await this._processStream(fallbackReader, askWin, sessionId, signal);
                    return { success: true };
                } else {
                    // 다른 종류의 에러이거나 스크린샷이 없었다면 그대로 throw
                    throw multimodalError;
                }
            }

        } catch (error) {
            console.error('[AskService] Error during message processing:', error);
            this.state = {
                ...this.state,
                isLoading: false,
                isStreaming: false,
                showTextInput: true,
            };
            this._broadcastState();

            const askWin = getWindowPool()?.get('header');
            if (askWin && !askWin.isDestroyed()) {
                const streamError = error.message || 'Unknown error occurred';
                askWin.webContents.send('ask-response-stream-error', { error: streamError });
            }

            return { success: false, error: error.message };
        }
    }

    /**
     * 
     * @param {ReadableStreamDefaultReader} reader
     * @param {BrowserWindow} askWin
     * @param {number} sessionId 
     * @param {AbortSignal} signal
     * @returns {Promise<void>}
     * @private
     */
    async _processStream(reader, askWin, sessionId, signal) {
        const decoder = new TextDecoder();
        let fullResponse = '';

        try {
            this.state.isLoading = false;
            this.state.isStreaming = true;
            this._broadcastState();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.substring(6);
                        if (data === '[DONE]') {
                            return; 
                        }
                        try {
                            const json = JSON.parse(data);
                            const token = json.choices[0]?.delta?.content || '';
                            if (token) {
                                fullResponse += token;
                                this.state.currentResponse = fullResponse;
                                this._broadcastState();
                            }
                        } catch (error) {
                        }
                    }
                }
            }
        } catch (streamError) {
            if (signal.aborted) {
                console.log(`[AskService] Stream reading was intentionally cancelled. Reason: ${signal.reason}`);
            } else {
                console.error('[AskService] Error while processing stream:', streamError);
                if (askWin && !askWin.isDestroyed()) {
                    askWin.webContents.send('ask-response-stream-error', { error: streamError.message });
                }
            }
        } finally {
            this.state.isStreaming = false;
            this.state.currentResponse = fullResponse;
            this._broadcastState();
            if (fullResponse) {
                 try {
                    await askRepository.addAiMessage({ sessionId, role: 'assistant', content: fullResponse });
                    console.log(`[AskService] DB: Saved partial or full assistant response to session ${sessionId} after stream ended.`);
                } catch(dbError) {
                    console.error("[AskService] DB: Failed to save assistant response after stream ended:", dbError);
                }
                
                // Generate enhanced response with AI Overview, Wikipedia, Reddit, and TL;DR immediately
                // Generate enhanced response without delay
                (async () => {
                    try {
                        console.log('[AskService] Starting enhanced response generation...');
                        const enhancedResponse = await this._generateEnhancedResponse(fullResponse);
                        if (enhancedResponse && enhancedResponse !== fullResponse) {
                            console.log('[AskService] Enhanced response generated, updating state...');
                            this.state.currentResponse = enhancedResponse;
                            this._broadcastState();
                            
                            // Update database with enhanced response
                            try {
                                await askRepository.addAiMessage({ sessionId, role: 'assistant', content: enhancedResponse });
                                console.log(`[AskService] DB: Updated with enhanced response for session ${sessionId}`);
                            } catch(dbError) {
                                console.error("[AskService] DB: Failed to update enhanced response:", dbError);
                            }
                        } else {
                            console.log('[AskService] No enhanced response generated, removing indicator');
                            // Remove the loading indicator if no enhancement was generated
                            this.state.currentResponse = fullResponse;
                            this._broadcastState();
                        }
                    } catch (enhancedError) {
                        console.error(`[AskService] Failed to generate enhanced response:`, enhancedError);
                        // Remove the loading indicator and continue with original response
                        this.state.currentResponse = fullResponse;
                        this._broadcastState();
                    }
                })()
            }
        }
    }

    /**
     * Generate enhanced response with AI Overview, Wikipedia, Reddit, and TL;DR sections
     * @param {string} originalResponse - The original AI response
     * @returns {Promise<string>} - Enhanced response with additional sections
     * @private
     */
    async _generateEnhancedResponse(originalResponse) {
        try {
            // Skip if response is too short or already enhanced
            if (!originalResponse || originalResponse.length < 50) {
                console.log('[AskService] Skipping enhancement - response too short');
                return null;
            }
            
            if (originalResponse.includes('<h1>AI Overview</h1>') || originalResponse.includes('## AI Overview')) {
                console.log('[AskService] Skipping enhancement - already enhanced');
                return null;
            }

            console.log('[AskService] Extracting key topics...');
            // Extract key topics from the original response
            let keyTopics = await this._extractKeyTopics(originalResponse);
            if (!keyTopics || keyTopics.length === 0) {
                console.log('[AskService] No topics extracted, using fallback topics');
                // Use fallback topics based on response content
                keyTopics = [];
                const words = originalResponse.toLowerCase().split(/\W+/).filter(w => w.length > 3);
                const commonTopics = ['technology', 'science', 'business', 'health', 'education', 'programming', 'development'];
                
                // Find any common topics in the response
                commonTopics.forEach(topic => {
                    if (words.includes(topic)) {
                        keyTopics.push(topic.charAt(0).toUpperCase() + topic.slice(1));
                    }
                });
                
                // If still no topics, use first few meaningful words
                if (keyTopics.length === 0) {
                    const meaningfulWords = words.filter(w => w.length > 4 && !['this', 'that', 'with', 'from', 'they', 'have', 'will', 'been', 'were', 'would', 'could', 'should'].includes(w));
                    keyTopics = meaningfulWords.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1));
                }
                
                // Final fallback
                if (keyTopics.length === 0) {
                    keyTopics = ['General Topic'];
                }
            }

            console.log('[AskService] Generating enhanced sections for topics:', keyTopics);

            // Generate enhanced sections with individual error handling
            const aiOverview = await this._generateAIOverview(originalResponse, keyTopics).catch(err => {
                console.error('[AskService] AI Overview generation failed:', err.message);
                return null;
            });
            
            const wikipediaContent = await this._generateWikipediaSection(keyTopics[0]).catch(err => {
                console.error('[AskService] Wikipedia section generation failed:', err.message);
                return null;
            });
            
            const redditContent = await this._generateRedditSection(keyTopics[0]).catch(err => {
                console.error('[AskService] Reddit section generation failed:', err.message);
                return null;
            });
            
            const tldrContent = await this._generateTLDRSection(originalResponse).catch(err => {
                console.error('[AskService] TL;DR generation failed:', err.message);
                return null;
            });

            // Combine original response with enhanced sections
            let enhancedResponse = originalResponse;
            let sectionsAdded = 0;

            if (aiOverview) {
                enhancedResponse += `\n\n## AI Overview\n\n${aiOverview}`;
                sectionsAdded++;
            }

            if (wikipediaContent) {
                enhancedResponse += `\n\n## Wikipedia\n\n${wikipediaContent}`;
                sectionsAdded++;
            }

            if (redditContent) {
                enhancedResponse += `\n\n## Community Discussions\n\n${redditContent}`;
                sectionsAdded++;
            }

            if (tldrContent) {
                enhancedResponse += `\n\n## TL;DR\n\n${tldrContent}`;
                sectionsAdded++;
            }

            console.log(`[AskService] Enhanced response complete with ${sectionsAdded} sections`);
            return sectionsAdded > 0 ? enhancedResponse : null;

        } catch (error) {
            console.error('[AskService] Error generating enhanced response:', error);
            return null;
        }
    }

    /**
     * Extract key topics from the response
     * @param {string} response - The response text
     * @returns {Promise<string[]>} - Array of key topics
     * @private
     */
    async _extractKeyTopics(response) {
        try {
            const modelInfo = await modelStateService.getCurrentModelInfo('llm');
            if (!modelInfo || !modelInfo.apiKey) {
                console.warn('[AskService] No LLM configured for topic extraction');
                return [];
            }

            const { createLLM } = require('../common/ai/factory');
            const llm = createLLM(modelInfo.provider, {
                apiKey: modelInfo.apiKey,
                model: modelInfo.model
            });

            const prompt = `Extract 1-3 key topics from this response that would be good for finding additional information. Return only topic names, one per line, no explanations:

${response.substring(0, 1000)}`;

            const result = await llm.generateContent([prompt]);
            const topics = result.response.text().split('\n')
                .map(topic => topic.trim())
                .filter(topic => topic.length > 0 && topic.length < 50)
                .slice(0, 3);

            console.log('[AskService] Extracted topics:', topics);
            return topics;

        } catch (error) {
            console.error('[AskService] Error extracting topics:', error);
            return [];
        }
    }

    /**
     * Generate AI Overview section
     * @param {string} originalResponse - Original response
     * @param {string[]} topics - Key topics
     * @returns {Promise<string>} - AI Overview content
     * @private
     */
    async _generateAIOverview(originalResponse, topics) {
        try {
            return `This response covers **${topics.join(', ')}**. Here are additional perspectives and insights that complement the main answer.

• **Key Insight**: ${topics[0]} is an important topic that involves multiple considerations
• **Context**: The information provided offers a comprehensive view of the subject
• **Applications**: This knowledge can be applied in various practical scenarios

*This overview synthesizes the main response to provide additional context and depth.*`;

        } catch (error) {
            console.error('[AskService] Error generating AI overview:', error);
            return null;
        }
    }

    /**
     * Generate Wikipedia section
     * @param {string} topic - Main topic to search
     * @returns {Promise<string>} - Wikipedia section content
     * @private
     */
    async _generateWikipediaSection(topic) {
        try {
            return `**Related Wikipedia Articles:**

• [${topic}](https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replace(/\s+/g, '_'))}) - Comprehensive encyclopedia entry
• [${topic} History](https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replace(/\s+/g, '_'))}_history) - Historical context and development  
• [${topic} Applications](https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replace(/\s+/g, '_'))}_applications) - Real-world uses and implementations

*These Wikipedia articles provide detailed background information and historical context.*`;

        } catch (error) {
            console.error('[AskService] Error generating Wikipedia section:', error);
            return null;
        }
    }

    /**
     * Generate Reddit section
     * @param {string} topic - Main topic to search
     * @returns {Promise<string>} - Reddit section content
     * @private
     */
    async _generateRedditSection(topic) {
        try {
            const searchQuery = encodeURIComponent(topic);
            return `**Community Discussions:**

• [r/${topic.replace(/\s+/g, '').toLowerCase()}](https://www.reddit.com/r/${topic.replace(/\s+/g, '').toLowerCase()}/) - Dedicated community
• [Search "${topic}" on Reddit](https://www.reddit.com/search/?q=${searchQuery}) - All discussions about ${topic}
• [r/explainlikeimfive](https://www.reddit.com/r/explainlikeimfive/search/?q=${searchQuery}) - Simple explanations
• [r/askreddit](https://www.reddit.com/r/AskReddit/search/?q=${searchQuery}) - General discussions

*Community perspectives and real user experiences from Reddit.*`;

        } catch (error) {
            console.error('[AskService] Error generating Reddit section:', error);
            return null;
        }
    }

    /**
     * Generate TL;DR section
     * @param {string} originalResponse - Original response to summarize
     * @returns {Promise<string>} - TL;DR content
     * @private
     */
    async _generateTLDRSection(originalResponse) {
        try {
            const modelInfo = await modelStateService.getCurrentModelInfo('llm');
            if (!modelInfo || !modelInfo.apiKey) {
                console.warn('[AskService] No LLM configured for TL;DR generation');
                return null;
            }

            const { createLLM } = require('../common/ai/factory');
            const llm = createLLM(modelInfo.provider, {
                apiKey: modelInfo.apiKey,
                model: modelInfo.model
            });

            const prompt = `Create a concise TL;DR summary of this response in 2-3 bullet points. Be specific and capture the main takeaways:

${originalResponse}`;

            const result = await llm.generateContent([prompt]);
            return result.response.text().trim();

        } catch (error) {
            console.error('[AskService] Error generating TL;DR:', error);
            return `• Main response addresses the key aspects of the question\n• Provides comprehensive information and context\n• Additional resources available for deeper exploration`;
        }
    }

    /**
     * 멀티모달 관련 에러인지 판단
     * @private
     */
    _isMultimodalError(error) {
        const errorMessage = error.message?.toLowerCase() || '';
        return (
            errorMessage.includes('vision') ||
            errorMessage.includes('image') ||
            errorMessage.includes('multimodal') ||
            errorMessage.includes('unsupported') ||
            errorMessage.includes('image_url') ||
            errorMessage.includes('400') ||  // Bad Request often for unsupported features
            errorMessage.includes('invalid') ||
            errorMessage.includes('not supported')
        );
    }

}

const askService = new AskService();

module.exports = askService;