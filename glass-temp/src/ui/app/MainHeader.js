import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';

export class MainHeader extends LitElement {
    static properties = {
        isTogglingSession: { type: Boolean, state: true },
        shortcuts: { type: Object, state: true },
        listenSessionStatus: { type: String, state: true },
        askInputValue: { type: String, state: true },
        isSubmittingAsk: { type: Boolean, state: true },
        askResponse: { type: String, state: true },
        showResponse: { type: Boolean, state: true },
        typingPlaceholder: { type: String, state: true },
        isPushToTalkActive: { type: Boolean, state: true },
        isRecording: { type: Boolean, state: true },
    };

    constructor() {
        super();
        console.log('[MainHeader] 🚀 Constructor called');
        console.log('[MainHeader] 🔍 window.api available:', !!window.api);
        console.log('[MainHeader] 🔍 window.api.ask available:', !!window.api?.ask);
        console.log('[MainHeader] window.api exists:', !!window.api);
        this.isTogglingSession = false;
        this.shortcuts = {};
        this.listenSessionStatus = 'beforeSession';
        this.askInputValue = '';
        this.isSubmittingAsk = false;
        this.askResponse = 'TEST: If you can see this box, the response display is working! Click the red X to close.';
        this.showResponse = true;
        this.typingPlaceholder = '';
        this.isPushToTalkActive = false;
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioStream = null;
        this.typingIndex = 0;
        this.suggestionIndex = 0;
        this.isDeleting = false;
        this.typingTimer = null;
        
        // Prompt suggestions
        this.suggestions = [
            'Ask me anything...',
            'Search the web...',
            'What is quantum computing?',
            'How does AI work?',
            'Explain blockchain technology',
            'What are the latest tech trends?',
            'Help me learn something new',
            'Find information about...',
        ];
        
        this.isVisible = true;
        this.isAnimating = false;
        this.hasSlidIn = false;
        this.wasJustDragged = false;
        this.dragState = null;
        this.animationEndTimer = null;

        // Bind methods
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleAnimationEnd = this.handleAnimationEnd.bind(this);
        this.handleAskInputChange = this.handleAskInputChange.bind(this);
        this.handleAskInputKeydown = this.handleAskInputKeydown.bind(this);
        this.handleAskSubmit = this.handleAskSubmit.bind(this);
        this.startTypingAnimation = this.startTypingAnimation.bind(this);
        this.stopTypingAnimation = this.stopTypingAnimation.bind(this);
        this.typeNextCharacter = this.typeNextCharacter.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.startPushToTalk = this.startPushToTalk.bind(this);
        this.stopPushToTalk = this.stopPushToTalk.bind(this);
    }

    static styles = css`
        :host {
            display: flex;
            width: 100%;
            transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.2s ease-out;
        }

        :host(.hiding) {
            animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.6, 1) forwards;
        }

        :host(.showing) {
            animation: slideDown 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        :host(.sliding-in) {
            animation: fadeIn 0.2s ease-out forwards;
        }

        :host(.hidden) {
            opacity: 0;
            transform: translateY(-150%) scale(0.85);
            pointer-events: none;
        }


        * {
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            cursor: default;
            user-select: none;
        }

        .header {
            -webkit-app-region: drag;
            width: 100%;
            height: 47px;
            padding: 2px 10px 2px 13px;
            background: transparent;
            overflow: visible;
            border-radius: 9000px;
            /* backdrop-filter: blur(1px); */
            justify-content: space-between;
            align-items: center;
            display: flex;
            box-sizing: border-box;
            position: relative;
        }

        .header::before {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.6);
            border-radius: 9000px;
            z-index: -1;
        }

        .header::after {
            content: '';
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            border-radius: 9000px;
            padding: 1px;
            background: linear-gradient(169deg, rgba(255, 255, 255, 0.17) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0.17) 100%); 
            -webkit-mask:
                linear-gradient(#fff 0 0) content-box,
                linear-gradient(#fff 0 0);
            -webkit-mask-composite: destination-out;
            mask-composite: exclude;
            pointer-events: none;
        }

        .listen-button {
            -webkit-app-region: no-drag;
            height: 28px;
            width: 28px;
            padding: 2px;
            background: transparent;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: transform 0.2s ease, opacity 0.2s ease;
        }

        .listen-button:hover {
            transform: scale(1.1);
            opacity: 0.9;
        }

        .listen-button:active {
            transform: scale(0.95);
        }

        .listen-button:disabled {
            cursor: default;
            opacity: 0.6;
        }

        .listen-button img {
            width: 24px;
            height: 24px;
            object-fit: contain;
        }

        .listen-button.active img {
            animation: pulse 1s infinite;
        }

        @keyframes pulse {
            0% {
                transform: scale(1);
            }
            50% {
                transform: scale(1.05);
            }
            100% {
                transform: scale(1);
            }
        }

        .loading-dots {
            display: flex;
            align-items: center;
            gap: 5px;
        }

        .loading-dots span {
            width: 6px;
            height: 6px;
            background-color: white;
            border-radius: 50%;
            animation: pulse 1.4s infinite ease-in-out both;
        }
        .loading-dots span:nth-of-type(1) {
            animation-delay: -0.32s;
        }
        .loading-dots span:nth-of-type(2) {
            animation-delay: -0.16s;
        }
        @keyframes pulse {
            0%, 80%, 100% {
                opacity: 0.2;
            }
            40% {
                opacity: 1.0;
            }
        }

        .header-actions {
            -webkit-app-region: no-drag;
            height: 26px;
            box-sizing: border-box;
            justify-content: flex-start;
            align-items: center;
            gap: 9px;
            display: flex;
            padding: 0 8px;
            border-radius: 6px;
            transition: background 0.15s ease;
        }

        .header-actions:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .ask-action {
            margin-left: 4px;
        }

        .action-button,
        .action-text {
            padding-bottom: 1px;
            justify-content: center;
            align-items: center;
            gap: 10px;
            display: flex;
        }

        .action-text-content {
            color: white;
            font-size: 12px;
            font-family: 'Helvetica Neue', sans-serif;
            font-weight: 500; /* Medium */
            word-wrap: break-word;
        }

        .icon-container {
            justify-content: flex-start;
            align-items: center;
            gap: 4px;
            display: flex;
        }

        .icon-container.ask-icons svg,
        .icon-container.showhide-icons svg {
            width: 12px;
            height: 12px;
        }

        .listen-icon svg {
            width: 12px;
            height: 11px;
            position: relative;
            top: 1px;
        }

        .icon-box {
            color: white;
            font-size: 12px;
            font-family: 'Helvetica Neue', sans-serif;
            font-weight: 500;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 13%;
            width: 18px;
            height: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .settings-button {
            -webkit-app-region: no-drag;
            padding: 5px;
            border-radius: 50%;
            background: transparent;
            transition: background 0.15s ease;
            color: white;
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .settings-button:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        .settings-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 3px;
        }

        .settings-icon svg {
            width: 16px;
            height: 16px;
        }


        /* Ask input field styles */
        .ask-input-container {
            -webkit-app-region: no-drag;
            display: flex;
            align-items: center;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 20px;
            padding: 4px 12px;
            margin: 0 8px;
            flex: 1;
            min-width: 300px;
            max-width: 500px;
        }

        .ask-input {
            -webkit-app-region: no-drag;
            flex: 1;
            background: transparent;
            border: none;
            outline: none;
            color: white;
            font-size: 12px;
            font-family: 'Helvetica Neue', sans-serif;
            font-weight: 400;
            padding: 6px 8px;
            cursor: text;
            pointer-events: auto;
        }

        .ask-input::placeholder {
            color: rgba(255, 255, 255, 1);
        }

        .ask-submit-button {
            -webkit-app-region: no-drag;
            background: transparent;
            border: none;
            color: rgba(255, 255, 255, 1);
            cursor: pointer;
            padding: 2px 4px;
            border-radius: 4px;
            transition: background 0.15s ease, color 0.15s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .ask-submit-button:hover {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 1);
        }

        .ask-submit-button:disabled {
            opacity: 0.5;
            cursor: default;
        }

        .ask-submit-button svg {
            width: 14px;
            height: 14px;
        }

        /* AI Response Display */
        .ask-response-container {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.95);
            border-radius: 12px;
            padding: 16px;
            margin: 8px;
            max-height: 300px;
            overflow-y: auto;
            z-index: 1000;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .ask-response-content {
            color: white;
            font-size: 13px;
            line-height: 1.5;
            white-space: pre-wrap;
            word-wrap: break-word;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .response-close-btn {
            position: absolute;
            top: 8px;
            right: 8px;
            background: rgba(255, 255, 255, 0.2);
            border: none;
            border-radius: 6px;
            color: white;
            width: 24px;
            height: 24px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            transition: background 0.2s ease;
        }

        .response-close-btn:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        /* Shining text animation for loading state */
        .shining-text {
            background: linear-gradient(110deg, #404040 0%, #404040 35%, #fff 50%, #404040 75%, #404040 100%);
            background-size: 200% 100%;
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            animation: shine 2s linear infinite;
            font-size: 12px;
            font-family: 'Helvetica Neue', sans-serif;
            font-weight: 400;
            padding: 6px 8px;
        }

        @keyframes shine {
            0% {
                background-position: 200% 0;
            }
            100% {
                background-position: -200% 0;
            }
        }

        /* Recording state visual feedback */
        .recording-indicator {
            background: linear-gradient(110deg, #ff4444 0%, #ff4444 35%, #ffaaaa 50%, #ff4444 75%, #ff4444 100%);
            background-size: 200% 100%;
            background-clip: text;
            -webkit-background-clip: text;
            color: transparent;
            animation: recordingPulse 1s ease-in-out infinite;
            font-size: 12px;
            font-family: 'Helvetica Neue', sans-serif;
            font-weight: 400;
            padding: 6px 8px;
        }

        .ask-input-container.recording {
            border: 1px solid rgba(255, 68, 68, 0.6);
            background: rgba(255, 68, 68, 0.1);
        }

        @keyframes recordingPulse {
            0%, 100% {
                opacity: 1;
            }
            50% {
                opacity: 0.6;
            }
        }
        /* ────────────────[ GLASS BYPASS ]─────────────── */
        :host-context(body.has-glass) .header,
        :host-context(body.has-glass) .listen-button,
        :host-context(body.has-glass) .header-actions,
        :host-context(body.has-glass) .settings-button,
        :host-context(body.has-glass) .ask-input-container,
        :host-context(body.has-glass) .ask-submit-button {
            background: transparent !important;
            filter: none !important;
            box-shadow: none !important;
            backdrop-filter: none !important;
        }
        :host-context(body.has-glass) .icon-box {
            background: transparent !important;
            border: none !important;
        }

        :host-context(body.has-glass) .header::before,
        :host-context(body.has-glass) .header::after,
        :host-context(body.has-glass) .listen-button::before,
        :host-context(body.has-glass) .listen-button::after {
            display: none !important;
        }

        :host-context(body.has-glass) .header-actions:hover,
        :host-context(body.has-glass) .settings-button:hover,
        :host-context(body.has-glass) .listen-button:hover::before {
            background: transparent !important;
        }
        :host-context(body.has-glass) * {
            animation: none !important;
            transition: none !important;
            transform: none !important;
            filter: none !important;
            backdrop-filter: none !important;
            box-shadow: none !important;
        }

        :host-context(body.has-glass) .header,
        :host-context(body.has-glass) .listen-button,
        :host-context(body.has-glass) .header-actions,
        :host-context(body.has-glass) .settings-button,
        :host-context(body.has-glass) .icon-box {
            border-radius: 0 !important;
        }
        :host-context(body.has-glass) {
            animation: none !important;
            transition: none !important;
            transform: none !important;
            will-change: auto !important;
        }
        `;


    _getListenButtonText(status) {
        switch (status) {
            case 'beforeSession': return 'Listen';
            case 'inSession'   : return 'Stop';
            case 'afterSession': return 'Done';
            default            : return 'Listen';
        }
    }

    async handleMouseDown(e) {
        e.preventDefault();

        const initialPosition = await window.api.mainHeader.getHeaderPosition();

        this.dragState = {
            initialMouseX: e.screenX,
            initialMouseY: e.screenY,
            initialWindowX: initialPosition.x,
            initialWindowY: initialPosition.y,
            moved: false,
        };

        window.addEventListener('mousemove', this.handleMouseMove, { capture: true });
        window.addEventListener('mouseup', this.handleMouseUp, { once: true, capture: true });
    }

    handleMouseMove(e) {
        if (!this.dragState) return;

        const deltaX = Math.abs(e.screenX - this.dragState.initialMouseX);
        const deltaY = Math.abs(e.screenY - this.dragState.initialMouseY);
        
        if (deltaX > 3 || deltaY > 3) {
            this.dragState.moved = true;
        }

        const newWindowX = this.dragState.initialWindowX + (e.screenX - this.dragState.initialMouseX);
        const newWindowY = this.dragState.initialWindowY + (e.screenY - this.dragState.initialMouseY);

        window.api.mainHeader.moveHeaderTo(newWindowX, newWindowY);
    }

    handleMouseUp(e) {
        if (!this.dragState) return;

        const wasDragged = this.dragState.moved;

        window.removeEventListener('mousemove', this.handleMouseMove, { capture: true });
        this.dragState = null;

        if (wasDragged) {
            this.wasJustDragged = true;
            setTimeout(() => {
                this.wasJustDragged = false;
            }, 0);
        }
    }

    toggleVisibility() {
        if (this.isAnimating) {
            console.log('[MainHeader] Animation already in progress, ignoring toggle');
            return;
        }
        
        if (this.animationEndTimer) {
            clearTimeout(this.animationEndTimer);
            this.animationEndTimer = null;
        }
        
        this.isAnimating = true;
        
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    hide() {
        this.classList.remove('showing');
        this.classList.add('hiding');
    }
    
    show() {
        this.classList.remove('hiding', 'hidden');
        this.classList.add('showing');
    }
    
    handleAnimationEnd(e) {
        if (e.target !== this) return;
    
        this.isAnimating = false;
    
        if (this.classList.contains('hiding')) {
            this.classList.add('hidden');
            if (window.api) {
                window.api.mainHeader.sendHeaderAnimationFinished('hidden');
            }
        } else if (this.classList.contains('showing')) {
            if (window.api) {
                window.api.mainHeader.sendHeaderAnimationFinished('visible');
            }
        }
    }

    startSlideInAnimation() {
        if (this.hasSlidIn) return;
        this.classList.add('sliding-in');
    }

    connectedCallback() {
        super.connectedCallback();
        console.log('[MainHeader] 🔗 Connected to DOM');
        console.log('[MainHeader] 🔍 At connectedCallback - window.api:', !!window.api);
        console.log('[MainHeader] 🔍 At connectedCallback - window.api.ask:', !!window.api?.ask);
        console.log('[MainHeader] 🔍 At connectedCallback - window.api.ask.onAskStateUpdate:', !!window.api?.ask?.onAskStateUpdate);
        this.addEventListener('animationend', this.handleAnimationEnd);
        
        // Add keyboard event listeners for push-to-talk
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        window.addEventListener('keydown', this.handleKeyDown);
        window.addEventListener('keyup', this.handleKeyUp);

        // Set up IPC listeners with proper timing
        this.setupIPCListeners();
    }

    setupIPCListeners() {
        // Wait for window.api to be available
        const checkAndSetupIPC = () => {
            if (window.api && window.api.common && window.api.common.onMessage) {
                console.log('[MainHeader] Setting up IPC listeners...');
                
                // Listen for global push-to-talk shortcut
                this._pushToTalkListener = (event) => {
                console.log('[MainHeader] Push-to-talk IPC message received');
                console.log('[Push-to-talk] Global shortcut triggered');
                
                if (!this.isPushToTalkActive && !this.isRecording) {
                    this.startPushToTalk();
                } else if (this.isPushToTalkActive) {
                    this.stopPushToTalk();
                }
            };
            console.log('[MainHeader] Setting up push-to-talk-toggle listener');
            window.api.common.onMessage?.('push-to-talk-toggle', this._pushToTalkListener);
            
            // Test IPC listener
            this._testIPCListener = (event, data) => {
                console.log('[MainHeader] Test IPC message received!', data);
            };
            console.log('[MainHeader] Setting up test-ipc-message listener');
            window.api.common.onMessage?.('test-ipc-message', this._testIPCListener);

            // Listen for ask response messages
            this._askStateListener = (event, state) => {
                console.log('[MainHeader] ✅ Received ask state update:', state);
                console.log('[MainHeader] 🔍 Current state - showResponse:', this.showResponse, 'askResponse length:', this.askResponse?.length);
                
                
                if (state.currentResponse && state.currentResponse.length > 0) {
                    console.log('[MainHeader] 📝 Setting response (first 100 chars):', state.currentResponse.substring(0, 100));
                    this.askResponse = state.currentResponse;
                    this.showResponse = true;
                    
                    
                    // Force a re-render
                    this.requestUpdate();
                    
                    console.log('[MainHeader] ✅ Response set - showResponse:', this.showResponse, 'askResponse length:', this.askResponse.length);
                    console.log('[MainHeader] 🎨 Triggering template re-render...');
                    
                    // Additional debugging for template condition
                    const templateCondition = this.showResponse && this.askResponse && this.askResponse.length > 0;
                    console.log('[MainHeader] 🔍 Template condition result:', templateCondition);
                }
                
                if (state.isLoading !== undefined) {
                    this.isSubmittingAsk = state.isLoading;
                    console.log('[MainHeader] 📊 Updated loading state:', this.isSubmittingAsk);
                }
            };
            console.log('[MainHeader] 🔧 Setting up ask:stateUpdate listener via window.api.ask.onAskStateUpdate');
            console.log('[MainHeader] 🔍 Before listener setup - window.api:', !!window.api);
            console.log('[MainHeader] 🔍 Before listener setup - window.api.ask:', !!window.api?.ask);
            console.log('[MainHeader] 🔍 Before listener setup - window.api.ask.onAskStateUpdate:', !!window.api?.ask?.onAskStateUpdate);
            
            if (window.api?.ask?.onAskStateUpdate) {
                console.log('[MainHeader] ✅ Setting up onAskStateUpdate listener successfully');
                window.api.ask.onAskStateUpdate(this._askStateListener);
            } else {
                console.error('[MainHeader] ❌ window.api.ask.onAskStateUpdate not available');
                console.error('[MainHeader] 🔍 Detailed debug - window.api keys:', window.api ? Object.keys(window.api) : 'window.api is null');
                console.error('[MainHeader] 🔍 Detailed debug - window.api.ask keys:', window.api?.ask ? Object.keys(window.api.ask) : 'window.api.ask is null');
            }

            this._askCompleteListener = (event, { response }) => {
                this.askResponse = response;
                this.showResponse = true;
                this.isSubmittingAsk = false;
            };
            window.api.common.onMessage?.('ask-response-complete', this._askCompleteListener);

            this._askErrorListener = (event, { error }) => {
                this.askResponse = `Error: ${error}`;
                this.showResponse = true;
                this.isSubmittingAsk = false;
            };
            window.api.common.onMessage?.('ask-response-stream-error', this._askErrorListener);

            this._sessionStateTextListener = (event, { success }) => {
                if (success) {
                    this.listenSessionStatus = ({
                        beforeSession: 'inSession',
                        inSession: 'afterSession',
                        afterSession: 'beforeSession',
                    })[this.listenSessionStatus] || 'beforeSession';
                } else {
                    this.listenSessionStatus = 'beforeSession';
                }
                this.isTogglingSession = false; // ✨ 로딩 상태만 해제
            };
            window.api.mainHeader.onListenChangeSessionResult(this._sessionStateTextListener);

            this._shortcutListener = (event, keybinds) => {
                console.log('[MainHeader] Received updated shortcuts:', keybinds);
                this.shortcuts = keybinds;
            };
            window.api.mainHeader.onShortcutsUpdated(this._shortcutListener);
                
                console.log('[MainHeader] All IPC listeners set up successfully');
            } else {
                console.log('[MainHeader] window.api not ready yet, retrying in 100ms...');
                setTimeout(checkAndSetupIPC, 100);
            }
        };
        
        // Start checking for window.api availability
        checkAndSetupIPC();
        
        // Create response display directly in DOM as backup
        this.createDirectResponseDisplay();
        
        // Start typing animation after component is ready
        setTimeout(() => this.startTypingAnimation(), 1000);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.removeEventListener('animationend', this.handleAnimationEnd);
        
        // Remove keyboard event listeners
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        window.removeEventListener('keydown', this.handleKeyDown);
        window.removeEventListener('keyup', this.handleKeyUp);
        
        // Clean up push-to-talk listener
        if (this._pushToTalkListener) {
            window.api?.common?.removeMessage?.('push-to-talk-toggle', this._pushToTalkListener);
        }
        
        // Clean up ask response listeners
        if (this._askStateListener) {
            if (window.api?.ask?.removeOnAskStateUpdate) {
                window.api.ask.removeOnAskStateUpdate(this._askStateListener);
            } else {
                window.api?.common?.removeMessage?.('ask:stateUpdate', this._askStateListener);
            }
        }
        if (this._askCompleteListener) {
            window.api?.common?.removeMessage?.('ask-response-complete', this._askCompleteListener);
        }
        if (this._askErrorListener) {
            window.api?.common?.removeMessage?.('ask-response-stream-error', this._askErrorListener);
        }
        if (this._testIPCListener) {
            window.api?.common?.removeMessage?.('test-ipc-message', this._testIPCListener);
        }
        
        if (this.animationEndTimer) {
            clearTimeout(this.animationEndTimer);
            this.animationEndTimer = null;
        }
        
        // Stop typing animation
        this.stopTypingAnimation();
        
        // Stop push-to-talk if active
        if (this.isPushToTalkActive) {
            this.stopMicrophoneCapture();
        }
        if (window.api) {
            if (this._sessionStateTextListener) {
                window.api.mainHeader.removeOnListenChangeSessionResult(this._sessionStateTextListener);
            }
            if (this._shortcutListener) {
                window.api.mainHeader.removeOnShortcutsUpdated(this._shortcutListener);
            }
        }
    }

    showSettingsWindow(element) {
        if (this.wasJustDragged) return;
        if (window.api) {
            console.log(`[MainHeader] showSettingsWindow called at ${Date.now()}`);
            window.api.mainHeader.showSettingsWindow();

        }
    }

    hideSettingsWindow() {
        if (this.wasJustDragged) return;
        if (window.api) {
            console.log(`[MainHeader] hideSettingsWindow called at ${Date.now()}`);
            window.api.mainHeader.hideSettingsWindow();
        }
    }

    async _handleListenClick() {
        if (this.wasJustDragged) return;
        if (this.isTogglingSession) {
            return;
        }

        this.isTogglingSession = true;

        try {
            const listenButtonText = this._getListenButtonText(this.listenSessionStatus);
            if (window.api) {
                await window.api.mainHeader.sendListenButtonClick(listenButtonText);
            }
        } catch (error) {
            console.error('IPC invoke for session change failed:', error);
            this.isTogglingSession = false;
        }
    }

    // Replace the old ask button click with new input handling methods
    handleAskInputChange(e) {
        this.askInputValue = e.target.value;
    }

    handleAskInputKeydown(e) {
        // Handle Enter key to submit
        if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            this.handleAskSubmit();
        }
        // Handle Escape key to clear
        else if (e.key === 'Escape') {
            this.askInputValue = '';
            e.target.value = '';
        }
    }

    async handleAskSubmit() {
        const question = this.askInputValue.trim();
        if (!question || this.isSubmittingAsk) return;

        this.isSubmittingAsk = true;
        // Don't hide response immediately - let new response replace it

        try {
            if (window.api) {
                // Send the question directly to the ask service
                await window.api.mainHeader.sendAskMessage(question);
                
                // Clear the input after successful submission
                this.askInputValue = '';
                // Also clear the actual input element
                const inputElement = this.shadowRoot?.querySelector('.ask-input');
                if (inputElement) {
                    inputElement.value = '';
                }
            }
        } catch (error) {
            console.error('Error sending ask message:', error);
        } finally {
            this.isSubmittingAsk = false;
        }
    }

    hideResponse() {
        this.showResponse = false;
        this.askResponse = '';
        this.style.backgroundColor = '';
        console.log('[MainHeader] Response hidden');
    }

    createDirectResponseDisplay() {
        console.log('[MainHeader] Creating direct response display');
        
        // Create response container directly in DOM
        this.directResponseContainer = document.createElement('div');
        this.directResponseContainer.id = 'glass-direct-response';
        this.directResponseContainer.style.cssText = `
            position: fixed !important;
            top: 60px !important;
            left: 10px !important;
            right: 10px !important;
            background: white !important;
            border: 3px solid #007acc !important;
            border-radius: 8px !important;
            padding: 20px !important;
            box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
            z-index: 99999 !important;
            max-height: 400px !important;
            overflow-y: auto !important;
            font-family: 'Helvetica Neue', sans-serif !important;
            display: none;
            display: flex !important;
            gap: 12px !important;
        `;
        
        // Add content
        this.directResponseContainer.innerHTML = `
            <img src="../assets/logomain.png" alt="Glass" style="
                width: 24px !important;
                height: 24px !important;
                object-fit: contain !important;
                flex-shrink: 0 !important;
                margin-top: 2px !important;
                margin-right: 12px !important;
            "/>
            <div style="color: black !important; font-size: 14px !important; line-height: 1.4 !important; margin-right: 30px !important; flex: 1 !important;">
                TEST: Direct DOM response display works! This bypasses LitElement completely.
            </div>
            <button id="glass-close-response" style="
                position: absolute !important;
                top: 8px !important;
                right: 8px !important;
                background: #ff4444 !important;
                color: white !important;
                border: none !important;
                border-radius: 50% !important;
                width: 28px !important;
                height: 28px !important;
                font-size: 18px !important;
                cursor: pointer !important;
                font-weight: bold !important;
            ">×</button>
        `;
        
        // Add close functionality
        const closeBtn = this.directResponseContainer.querySelector('#glass-close-response');
        closeBtn.addEventListener('click', () => {
            this.directResponseContainer.style.display = 'none';
            console.log('[MainHeader] Direct response closed');
        });
        
        // Add to document body
        document.body.appendChild(this.directResponseContainer);
        
        // Show immediately for test
        this.directResponseContainer.style.display = 'block';
        console.log('[MainHeader] Direct response display created and shown');
    }

    // Typing animation methods
    startTypingAnimation() {
        if (this.askInputValue.length > 0) return;
        this.typingPlaceholder = '';
        this.typingIndex = 0;
        this.isDeleting = false;
        this.typeNextCharacter();
    }

    stopTypingAnimation() {
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
            this.typingTimer = null;
        }
    }

    typeNextCharacter() {
        if (this.askInputValue.length > 0) {
            this.stopTypingAnimation();
            return;
        }

        const currentSuggestion = this.suggestions[this.suggestionIndex];
        
        if (!this.isDeleting) {
            if (this.typingIndex < currentSuggestion.length) {
                this.typingPlaceholder = currentSuggestion.substring(0, this.typingIndex + 1);
                this.typingIndex++;
                this.typingTimer = setTimeout(() => this.typeNextCharacter(), 100);
            } else {
                this.typingTimer = setTimeout(() => {
                    this.isDeleting = true;
                    this.typeNextCharacter();
                }, 2000);
            }
        } else {
            if (this.typingIndex > 0) {
                this.typingIndex--;
                this.typingPlaceholder = currentSuggestion.substring(0, this.typingIndex);
                this.typingTimer = setTimeout(() => this.typeNextCharacter(), 50);
            } else {
                this.isDeleting = false;
                this.suggestionIndex = (this.suggestionIndex + 1) % this.suggestions.length;
                this.typingTimer = setTimeout(() => this.typeNextCharacter(), 500);
            }
        }
    }

    handleAskInputFocus() {
        this.stopTypingAnimation();
    }

    handleAskInputBlur() {
        if (this.askInputValue.length === 0) {
            setTimeout(() => this.startTypingAnimation(), 1000);
        }
    }

    // Push-to-talk functionality - only handle F1 key  
    handleKeyDown(e) {
        // Only handle F1 key for push-to-talk
        if (e.code === 'F1' && !this.isPushToTalkActive && !this.isRecording) {
            console.log('[Push-to-talk] F1 key detected, starting recording');
            e.preventDefault();
            this.startPushToTalk();
        }
    }

    handleKeyUp(e) {
        // Release F1 key to stop recording
        if (e.code === 'F1' && this.isPushToTalkActive) {
            console.log('[Push-to-talk] F1 key released, stopping recording');
            e.preventDefault();
            this.stopPushToTalk();
        }
    }

    async startPushToTalk() {
        if (this.isPushToTalkActive || this.isRecording || !window.api) return;
        
        try {
            this.isPushToTalkActive = true;
            this.isRecording = true;
            
            // Stop typing animation while recording
            this.stopTypingAnimation();
            
            // Request microphone permission if needed
            await window.api.requestMicrophonePermission();
            
            // Start Deepgram push-to-talk session
            const sessionResult = await window.api.listenCapture.startPushToTalkSession();
            if (!sessionResult.success) {
                throw new Error(sessionResult.error);
            }

            // Start microphone capture
            await this.startMicrophoneCapture();
            
            console.log('[Push-to-talk] Recording started with Deepgram');
        } catch (error) {
            console.error('[Push-to-talk] Error starting recording:', error);
            this.isPushToTalkActive = false;
            this.isRecording = false;
        }
    }

    async startMicrophoneCapture() {
        try {
            // Get microphone stream
            this.audioStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true
                } 
            });

            // Create MediaRecorder for capturing audio
            this.mediaRecorder = new MediaRecorder(this.audioStream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            this.mediaRecorder.ondataavailable = async (event) => {
                if (event.data.size > 0) {
                    // Convert to base64 and send to backend
                    const arrayBuffer = await event.data.arrayBuffer();
                    const base64Data = this.arrayBufferToBase64(arrayBuffer);
                    
                    try {
                        await window.api.listenCapture.sendMicAudioContent({ 
                            data: base64Data, 
                            mimeType: 'audio/webm;codecs=opus' 
                        });
                    } catch (error) {
                        console.error('[Push-to-talk] Error sending audio data:', error);
                    }
                }
            };

            // Start recording with small chunks
            this.mediaRecorder.start(100); // 100ms chunks
            
        } catch (error) {
            console.error('[Push-to-talk] Error accessing microphone:', error);
            throw error;
        }
    }

    arrayBufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    async stopPushToTalk() {
        if (!this.isPushToTalkActive || !window.api) return;
        
        try {
            this.isPushToTalkActive = false;
            this.isRecording = false;
            
            // Stop microphone capture
            this.stopMicrophoneCapture();
            
            // Stop recording and get transcription from Deepgram
            const result = await window.api.listenCapture.stopPushToTalkSession();
            
            if (result && result.success && result.transcription) {
                // Set the transcribed text directly (replacing any existing text)
                this.askInputValue = result.transcription.trim();
                
                // Update the actual input element
                const inputElement = this.shadowRoot?.querySelector('.ask-input');
                if (inputElement) {
                    inputElement.value = this.askInputValue;
                }
                
                console.log('[Push-to-talk] Transcription received:', result.transcription);
                
                // Automatically submit the transcribed text
                if (this.askInputValue) {
                    console.log('[Push-to-talk] Auto-submitting transcribed text');
                    await this.handleAskSubmit();
                }
            } else {
                console.log('[Push-to-talk] No transcription received - result:', result);
            }
            
            console.log('[Push-to-talk] Recording stopped');
        } catch (error) {
            console.error('[Push-to-talk] Error stopping recording:', error);
        } finally {
            // Restart typing animation if input is empty
            if (this.askInputValue.length === 0) {
                setTimeout(() => this.startTypingAnimation(), 500);
            }
        }
    }

    stopMicrophoneCapture() {
        try {
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.stop();
            }
            
            if (this.audioStream) {
                this.audioStream.getTracks().forEach(track => track.stop());
                this.audioStream = null;
            }
            
            this.mediaRecorder = null;
        } catch (error) {
            console.error('[Push-to-talk] Error stopping microphone capture:', error);
        }
    }
    async _handleToggleAllWindowsVisibility() {
        if (this.wasJustDragged) return;

        try {
            if (window.api) {
                await window.api.mainHeader.sendToggleAllWindowsVisibility();
            }
        } catch (error) {
            console.error('IPC invoke for all windows visibility button failed:', error);
        }
    }


    renderShortcut(accelerator) {
        if (!accelerator) return html``;

        const keyMap = {
            'Cmd': '⌘', 'Command': '⌘',
            'Ctrl': '⌃', 'Control': '⌃',
            'Alt': '⌥', 'Option': '⌥',
            'Shift': '⇧',
            'Enter': '↵',
            'Backspace': '⌫',
            'Delete': '⌦',
            'Tab': '⇥',
            'Escape': '⎋',
            'Up': '↑', 'Down': '↓', 'Left': '←', 'Right': '→',
            '\\': html`<svg viewBox="0 0 6 12" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:6px; height:12px;"><path d="M1.5 1.3L5.1 10.6" stroke="white" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
        };

        const keys = accelerator.split('+');
        return html`${keys.map(key => html`
            <div class="icon-box">${keyMap[key] || key}</div>
        `)}`;
    }

    render() {
        const listenButtonText = this._getListenButtonText(this.listenSessionStatus);
    
        const buttonClasses = {
            active: listenButtonText === 'Stop',
            done: listenButtonText === 'Done',
        };
        const showStopIcon = listenButtonText === 'Stop' || listenButtonText === 'Done';

        return html`
            <div class="header" @mousedown=${this.handleMouseDown}>
                <button 
                    class="listen-button ${Object.keys(buttonClasses).filter(k => buttonClasses[k]).join(' ')}"
                    @click=${this._handleListenClick}
                    ?disabled=${this.isTogglingSession}
                    title="Click to ${listenButtonText}"
                >
                    <img src="../assets/logomain.png" alt="Glass Logo" />
                </button>

                <!-- Ask input field -->
                <div class="ask-input-container ${this.isRecording ? 'recording' : ''}">
                    ${this.isSubmittingAsk 
                        ? html`<div class="shining-text">orbiting...</div>`
                        : this.isRecording
                        ? html`<div class="recording-indicator">🎤 Recording... (release space to stop)</div>`
                        : html`<input 
                            type="text" 
                            class="ask-input"
                            placeholder=${this.askInputValue.length > 0 ? '' : this.typingPlaceholder}
                            .value=${this.askInputValue}
                            @input=${this.handleAskInputChange}
                            @keydown=${this.handleAskInputKeydown}
                            @focus=${this.handleAskInputFocus}
                            @blur=${this.handleAskInputBlur}
                            @click=${(e) => e.stopPropagation()}
                            @mousedown=${(e) => e.stopPropagation()}
                            ?disabled=${this.isSubmittingAsk}
                        />`
                    }
                    <button 
                        class="ask-submit-button"
                        @click=${this.handleAskSubmit}
                        ?disabled=${this.isSubmittingAsk || !this.askInputValue.trim()}
                        title="Submit question (Enter)"
                    >
                        ${this.isSubmittingAsk 
                            ? html`` 
                            : html`
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M5 12h14M12 5l7 7-7 7"/>
                                </svg>
                            `
                        }
                    </button>
                </div>

                <!-- AI Response Display - Show when both conditions are met -->
                ${this.showResponse && this.askResponse && this.askResponse.length > 0 ? html`
                    <div class="ask-response-container" style="
                        position: fixed !important; 
                        top: 60px !important; 
                        left: 10px !important; 
                        right: 10px !important; 
                        background: white !important; 
                        border: 3px solid #007acc !important; 
                        border-radius: 8px !important; 
                        padding: 20px !important; 
                        box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important; 
                        z-index: 99999 !important;
                        max-height: 400px !important;
                        overflow-y: auto !important;
                        display: flex !important;
                        gap: 12px !important;
                    ">
                        <img src="../assets/logomain.png" alt="Glass" style="
                            width: 24px !important;
                            height: 24px !important;
                            object-fit: contain !important;
                            flex-shrink: 0 !important;
                            margin-top: 2px !important;
                        "/>
                        <div class="ask-response-content" style="color: black !important; font-size: 14px !important; line-height: 1.4 !important; margin-right: 30px !important; flex: 1 !important;">
                            ${this.askResponse}
                        </div>
                        <button class="response-close-btn" @click=${this.hideResponse} style="
                            position: absolute !important; 
                            top: 8px !important; 
                            right: 8px !important; 
                            background: #ff4444 !important; 
                            color: white !important; 
                            border: none !important; 
                            border-radius: 50% !important; 
                            width: 28px !important; 
                            height: 28px !important; 
                            font-size: 18px !important; 
                            cursor: pointer !important;
                            font-weight: bold !important;
                        ">×</button>
                    </div>
                ` : ''}

                <div class="header-actions" @click=${() => this._handleToggleAllWindowsVisibility()}>
                    <div class="icon-container">
                        ${this.renderShortcut(this.shortcuts.toggleVisibility)}
                    </div>
                </div>

                <button 
                    class="settings-button"
                    @mouseenter=${(e) => this.showSettingsWindow(e.currentTarget)}
                    @mouseleave=${() => this.hideSettingsWindow()}
                >
                    <div class="settings-icon">
                        <svg width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M8.0013 3.16406C7.82449 3.16406 7.65492 3.2343 7.5299 3.35932C7.40487 3.48435 7.33464 3.65392 7.33464 3.83073C7.33464 4.00754 7.40487 4.17711 7.5299 4.30213C7.65492 4.42716 7.82449 4.4974 8.0013 4.4974C8.17811 4.4974 8.34768 4.42716 8.47271 4.30213C8.59773 4.17711 8.66797 4.00754 8.66797 3.83073C8.66797 3.65392 8.59773 3.48435 8.47271 3.35932C8.34768 3.2343 8.17811 3.16406 8.0013 3.16406ZM8.0013 7.83073C7.82449 7.83073 7.65492 7.90097 7.5299 8.02599C7.40487 8.15102 7.33464 8.32058 7.33464 8.4974C7.33464 8.67421 7.40487 8.84378 7.5299 8.9688C7.65492 9.09382 7.82449 9.16406 8.0013 9.16406C8.17811 9.16406 8.34768 9.09382 8.47271 8.9688C8.59773 8.84378 8.66797 8.67421 8.66797 8.4974C8.66797 8.32058 8.59773 8.15102 8.47271 8.02599C8.34768 7.90097 8.17811 7.83073 8.0013 7.83073ZM8.0013 12.4974C7.82449 12.4974 7.65492 12.5676 7.5299 12.6927C7.40487 12.8177 7.33464 12.9873 7.33464 13.1641C7.33464 13.3409 7.40487 13.5104 7.5299 13.6355C7.65492 13.7605 7.82449 13.8307 8.0013 13.8307C8.17811 13.8307 8.34768 13.7605 8.47271 13.6355C8.59773 13.5104 8.66797 13.3409 8.66797 13.1641C8.66797 12.9873 8.59773 12.8177 8.47271 12.6927C8.34768 12.5676 8.17811 12.4974 8.0013 12.4974Z" fill="white" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                </button>
            </div>
        `;
    }
}

customElements.define('main-header', MainHeader);
