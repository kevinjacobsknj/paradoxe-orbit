import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';
import './LiquidLogoLit.js';

/**
 * Example integration showing how to use LiquidLogo in different contexts
 */
export class LiquidLogoIntegration extends LitElement {
    static styles = css`
        :host {
            display: block;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        /* Header style integration */
        .header-with-logo {
            display: flex;
            align-items: center;
            gap: 20px;
            padding: 20px;
            background: rgba(0, 0, 0, 0.8);
            border-radius: 16px;
            color: white;
            margin-bottom: 30px;
        }

        .header-info {
            flex: 1;
        }

        .header-title {
            font-size: 1.5rem;
            font-weight: bold;
            margin: 0 0 8px 0;
        }

        .header-subtitle {
            font-size: 1rem;
            opacity: 0.8;
            margin: 0;
        }

        /* Welcome screen style */
        .welcome-screen {
            text-align: center;
            padding: 40px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            color: white;
            margin-bottom: 30px;
        }

        .welcome-logo {
            margin-bottom: 30px;
        }

        .welcome-title {
            font-size: 2.5rem;
            font-weight: bold;
            margin: 0 0 16px 0;
            text-shadow: 0 2px 10px rgba(0,0,0,0.3);
        }

        .welcome-description {
            font-size: 1.1rem;
            opacity: 0.9;
            max-width: 600px;
            margin: 0 auto;
            line-height: 1.6;
        }

        /* Compact logo variations */
        .logo-variations {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }

        .logo-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        .logo-card h4 {
            margin: 0 0 15px 0;
            color: #333;
            font-size: 1rem;
        }

        .logo-card p {
            margin: 15px 0 0 0;
            font-size: 0.85rem;
            color: #666;
        }

        /* Loading screen example */
        .loading-screen {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 300px;
            background: rgba(0,0,0,0.9);
            border-radius: 16px;
            color: white;
        }

        .loading-text {
            margin-top: 20px;
            font-size: 1.1rem;
            opacity: 0.8;
        }

        /* Usage examples */
        .code-example {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            font-family: 'Monaco', 'Consolas', monospace;
            font-size: 0.9rem;
            overflow-x: auto;
            border-left: 4px solid #4dabf7;
        }

        .section-title {
            font-size: 1.3rem;
            font-weight: bold;
            color: #333;
            margin: 40px 0 20px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #e9ecef;
        }
    `;

    render() {
        return html`
            <div class="section-title">🎨 Header Integration Example</div>
            <div class="header-with-logo">
                <liquid-logo 
                    src="./assets/logomain.png" 
                    size="60"
                    refraction="0.015"
                    speed="8">
                </liquid-logo>
                <div class="header-info">
                    <h2 class="header-title">Paradoxe Orbit</h2>
                    <p class="header-subtitle">Digital Mind Extension</p>
                </div>
            </div>

            <div class="section-title">🌟 Welcome Screen Example</div>
            <div class="welcome-screen">
                <div class="welcome-logo">
                    <liquid-logo 
                        src="./assets/logomain.png" 
                        size="180"
                        refraction="0.02"
                        patternScale="2.5"
                        speed="6">
                    </liquid-logo>
                </div>
                <h1 class="welcome-title">Welcome to Paradoxe Orbit</h1>
                <p class="welcome-description">
                    Your digital mind extension is ready. Experience the future of AI-powered assistance with beautiful liquid effects.
                </p>
            </div>

            <div class="section-title">⚡ Logo Size Variations</div>
            <div class="logo-variations">
                <div class="logo-card">
                    <h4>Compact</h4>
                    <liquid-logo 
                        src="./assets/logomain.png" 
                        size="80"
                        refraction="0.01">
                    </liquid-logo>
                    <p>Perfect for headers and navigation</p>
                </div>

                <div class="logo-card">
                    <h4>Medium</h4>
                    <liquid-logo 
                        src="./assets/logomain.png" 
                        size="120"
                        refraction="0.02">
                    </liquid-logo>
                    <p>Great for cards and sections</p>
                </div>

                <div class="logo-card">
                    <h4>Large</h4>
                    <liquid-logo 
                        src="./assets/logomain.png" 
                        size="160"
                        refraction="0.025">
                    </liquid-logo>
                    <p>Ideal for splash screens</p>
                </div>
            </div>

            <div class="section-title">⏳ Loading Screen Example</div>
            <div class="loading-screen">
                <liquid-logo 
                    src="./assets/logomain.png" 
                    size="120"
                    refraction="0.03"
                    speed="4">
                </liquid-logo>
                <div class="loading-text">Loading Paradoxe Orbit...</div>
            </div>

            <div class="section-title">📝 Usage in Your Components</div>
            <div class="code-example">
// Import the component<br/>
import './components/LiquidLogoLit.js';<br/><br/>

// Use in your template<br/>
html\`<br/>
&nbsp;&nbsp;&lt;liquid-logo <br/>
&nbsp;&nbsp;&nbsp;&nbsp;src="./assets/logomain.png"<br/>
&nbsp;&nbsp;&nbsp;&nbsp;size="200"<br/>
&nbsp;&nbsp;&nbsp;&nbsp;refraction="0.02"<br/>
&nbsp;&nbsp;&nbsp;&nbsp;speed="6"&gt;<br/>
&nbsp;&nbsp;&lt;/liquid-logo&gt;<br/>
\`;
            </div>

            <div class="code-example">
// Available properties:<br/>
- src: string (path to logo)<br/>
- size: number (px, default 240)<br/>
- refraction: number (0-0.06, default 0.02)<br/>
- patternScale: number (0.8-4, default 2)<br/>
- patternBlur: number (0-2, default 0.5)<br/>
- speed: number (seconds, default 6)<br/>
- still: boolean (disable animation, default false)
            </div>
        `;
    }
}

customElements.define('liquid-logo-integration', LiquidLogoIntegration);