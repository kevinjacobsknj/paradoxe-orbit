import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';

export class WelcomeHeader extends LitElement {
    static styles = css`
        :host {
            display: block;
            font-family:
                'Inter',
                -apple-system,
                BlinkMacSystemFont,
                'Segoe UI',
                Roboto,
                sans-serif;
        }
        .container {
            width: 100%;
            box-sizing: border-box;
            height: auto;
            padding: 24px 16px;
            background: #2a2a2a;
            border-radius: 16px;
            flex-direction: column;
            justify-content: flex-start;
            align-items: flex-start;
            gap: 32px;
            display: inline-flex;
            -webkit-app-region: drag;
            box-shadow: 
                8px 8px 16px rgba(0, 0, 0, 0.4),
                -8px -8px 16px rgba(255, 255, 255, 0.02),
                inset 1px 1px 2px rgba(255, 255, 255, 0.02),
                inset -1px -1px 2px rgba(0, 0, 0, 0.3);
        }
        .close-button {
            -webkit-app-region: no-drag;
            position: absolute;
            top: 16px;
            right: 16px;
            width: 20px;
            height: 20px;
            background: #1a1a1a;
            border: none;
            border-radius: 5px;
            color: #ffffff;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s ease;
            z-index: 10;
            font-size: 16px;
            line-height: 1;
            padding: 0;
            box-shadow: 
                2px 2px 4px rgba(0, 0, 0, 0.4),
                -2px -2px 4px rgba(255, 255, 255, 0.02);
        }
        .close-button:hover {
            box-shadow: 
                inset 1px 1px 2px rgba(0, 0, 0, 0.5),
                inset -1px -1px 2px rgba(255, 255, 255, 0.02);
        }
        .header-section {
            flex-direction: column;
            justify-content: flex-start;
            align-items: flex-start;
            gap: 4px;
            display: flex;
        }
        .title {
            color: white;
            font-size: 18px;
            font-weight: 700;
        }
        .subtitle {
            color: white;
            font-size: 14px;
            font-weight: 500;
        }
        .option-card {
            width: 100%;
            justify-content: flex-start;
            align-items: flex-start;
            gap: 8px;
            display: inline-flex;
        }
        .divider {
            width: 1px;
            align-self: stretch;
            position: relative;
            background: #bebebe;
            border-radius: 2px;
        }
        .option-content {
            flex: 1 1 0;
            flex-direction: column;
            justify-content: flex-start;
            align-items: flex-start;
            gap: 8px;
            display: inline-flex;
            min-width: 0;
        }
        .option-title {
            color: white;
            font-size: 14px;
            font-weight: 700;
        }
        .option-description {
            color: #dcdcdc;
            font-size: 12px;
            font-weight: 400;
            line-height: 18px;
            letter-spacing: 0.12px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
        .action-button {
            -webkit-app-region: no-drag;
            padding: 8px 10px;
            background: #1a1a1a;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            justify-content: center;
            align-items: center;
            gap: 6px;
            display: flex;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 
                3px 3px 6px rgba(0, 0, 0, 0.4),
                -3px -3px 6px rgba(255, 255, 255, 0.02);
        }
        .action-button:hover {
            box-shadow: 
                inset 2px 2px 4px rgba(0, 0, 0, 0.5),
                inset -2px -2px 4px rgba(255, 255, 255, 0.02);
        }
        .button-text {
            color: white;
            font-size: 12px;
            font-weight: 600;
        }
        .button-icon {
            width: 12px;
            height: 12px;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .arrow-icon {
            border: solid white;
            border-width: 0 1.2px 1.2px 0;
            display: inline-block;
            padding: 3px;
            transform: rotate(-45deg);
            -webkit-transform: rotate(-45deg);
        }
        .footer {
            align-self: stretch;
            text-align: center;
            color: #dcdcdc;
            font-size: 12px;
            font-weight: 500;
            line-height: 19.2px;
        }
        .footer-link {
            text-decoration: underline;
            cursor: pointer;
            -webkit-app-region: no-drag;
        }
    `;

    static properties = {
        loginCallback: { type: Function },
        apiKeyCallback: { type: Function },
    };

    constructor() {
        super();
        this.loginCallback = () => {};
        this.apiKeyCallback = () => {};
        this.handleClose = this.handleClose.bind(this);
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        this.dispatchEvent(new CustomEvent('content-changed', { bubbles: true, composed: true }));
    }

    handleClose() {
        if (window.api?.common) {
            window.api.common.quitApplication();
        }
    }

    render() {
        return html`
            <div class="container">
                <button class="close-button" @click=${this.handleClose}>×</button>
                <div class="header-section">
                    <div class="title">Welcome to Paradoxe Orbit</div>
                    <div class="subtitle">Choose how to connect your AI model</div>
                </div>
                <div class="option-card">
                    <div class="divider"></div>
                    <div class="option-content">
                        <div class="option-title">Quick start with default API key</div>
                        <div class="option-description">
                            100% free with Paradoxe's OpenAI key<br/>No personal data collected<br/>Sign up with Google in seconds
                        </div>
                    </div>
                    <button class="action-button" @click=${this.loginCallback}>
                        <div class="button-text">Open Browser to Log in</div>
                        <div class="button-icon"><div class="arrow-icon"></div></div>
                    </button>
                </div>
                <div class="option-card">
                    <div class="divider"></div>
                    <div class="option-content">
                        <div class="option-title">Use Personal API keys</div>
                        <div class="option-description">
                            Costs may apply based on your API usage<br/>No personal data collected<br/>Use your own API keys (OpenAI, Gemini, etc.)
                        </div>
                    </div>
                    <button class="action-button" @click=${this.apiKeyCallback}>
                        <div class="button-text">Enter Your API Key</div>
                        <div class="button-icon"><div class="arrow-icon"></div></div>
                    </button>
                </div>
                <div class="footer">
                    Paradoxe Orbit does not collect your personal data —
                    <span class="footer-link" @click=${this.openPrivacyPolicy}>See details</span>
                </div>
            </div>
        `;
    }

    openPrivacyPolicy() {
        console.log('🔊 openPrivacyPolicy WelcomeHeader');
        if (window.api?.common) {
            window.api.common.openExternal('https://paradoxe.ai/privacy-policy');
        }
    }
}

customElements.define('welcome-header', WelcomeHeader);