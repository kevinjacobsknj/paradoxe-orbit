import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';
import './LiquidLogoLit.js';

/**
 * Demo view showing different liquid logo effects
 * Integrated with the existing Paradoxe Orbit app structure
 */
export class LogoDemoView extends LitElement {
    static styles = css`
        :host {
            display: block;
            width: 100%;
            height: 100%;
            padding: 20px;
            box-sizing: border-box;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            overflow-y: auto;
        }

        .demo-container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .title {
            text-align: center;
            font-size: 2rem;
            font-weight: bold;
            color: #333;
            margin-bottom: 2rem;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .logo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            margin-bottom: 40px;
        }

        .logo-item {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 16px;
            padding: 20px;
            text-align: center;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .logo-item:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 40px rgba(0,0,0,0.15);
        }

        .logo-title {
            font-size: 1.1rem;
            font-weight: 600;
            color: #555;
            margin-bottom: 15px;
        }

        .logo-wrapper {
            display: flex;
            justify-content: center;
            margin-bottom: 15px;
        }

        .logo-description {
            font-size: 0.9rem;
            color: #666;
            line-height: 1.4;
        }

        .controls {
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            padding: 30px;
            margin: 40px 0;
            box-shadow: 0 8px 32px rgba(0,0,0,0.1);
        }

        .controls h3 {
            margin-bottom: 20px;
            color: #333;
            font-size: 1.3rem;
        }

        .control-group {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }

        .control-item {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .control-item label {
            font-weight: 500;
            color: #555;
            font-size: 0.9rem;
        }

        .control-item input, .control-item select {
            padding: 8px 12px;
            border: 2px solid #e1e8ed;
            border-radius: 8px;
            font-size: 0.9rem;
            transition: border-color 0.3s ease;
        }

        .control-item input:focus, .control-item select:focus {
            outline: none;
            border-color: #4dabf7;
        }

        .custom-demo {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 300px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 16px;
            margin-top: 20px;
        }

        @media (max-width: 768px) {
            :host {
                padding: 10px;
            }
            
            .title {
                font-size: 1.5rem;
            }
            
            .logo-grid {
                grid-template-columns: 1fr;
                gap: 20px;
            }
        }
    `;

    static properties = {
        customSize: { type: Number },
        customRefraction: { type: Number },
        customPatternScale: { type: Number },
        customSpeed: { type: Number },
        customBlur: { type: Number },
        customStill: { type: Boolean }
    };

    constructor() {
        super();
        this.customSize = 240;
        this.customRefraction = 0.02;
        this.customPatternScale = 2;
        this.customSpeed = 6;
        this.customBlur = 0.5;
        this.customStill = false;
    }

    handleControlChange(property, event) {
        this[property] = event.target.type === 'checkbox' ? event.target.checked : 
                       event.target.type === 'number' ? parseFloat(event.target.value) :
                       event.target.value;
    }

    render() {
        return html`
            <div class="demo-container">
                <div class="title">
                    🌊 Paradoxe Orbit - Liquid Logo Effects
                </div>
                
                <div class="logo-grid">
                    <div class="logo-item">
                        <div class="logo-title">Default Effect</div>
                        <div class="logo-wrapper">
                            <liquid-logo 
                                src="./assets/logomain.png"
                                size="200">
                            </liquid-logo>
                        </div>
                        <div class="logo-description">
                            Balanced liquid distortion with smooth animation
                        </div>
                    </div>

                    <div class="logo-item">
                        <div class="logo-title">Subtle Refraction</div>
                        <div class="logo-wrapper">
                            <liquid-logo 
                                src="./assets/logomain.png"
                                size="200"
                                refraction="0.01"
                                speed="8">
                            </liquid-logo>
                        </div>
                        <div class="logo-description">
                            Gentle, barely noticeable ripples for elegance
                        </div>
                    </div>

                    <div class="logo-item">
                        <div class="logo-title">Intense Liquid</div>
                        <div class="logo-wrapper">
                            <liquid-logo 
                                src="./assets/logomain.png"
                                size="200"
                                refraction="0.04"
                                patternScale="1.5"
                                speed="4">
                            </liquid-logo>
                        </div>
                        <div class="logo-description">
                            Strong distortion with fast-moving waves
                        </div>
                    </div>

                    <div class="logo-item">
                        <div class="logo-title">Slow Ripple</div>
                        <div class="logo-wrapper">
                            <liquid-logo 
                                src="./assets/logomain.png"
                                size="200"
                                refraction="0.025"
                                patternScale="3"
                                speed="10"
                                patternBlur="1">
                            </liquid-logo>
                        </div>
                        <div class="logo-description">
                            Large, slow-moving waves with soft edges
                        </div>
                    </div>

                    <div class="logo-item">
                        <div class="logo-title">Static Distortion</div>
                        <div class="logo-wrapper">
                            <liquid-logo 
                                src="./assets/logomain.png"
                                size="200"
                                refraction="0.03"
                                still>
                            </liquid-logo>
                        </div>
                        <div class="logo-description">
                            Frozen liquid effect without animation
                        </div>
                    </div>

                    <div class="logo-item">
                        <div class="logo-title">Premium Format</div>
                        <div class="logo-wrapper">
                            <liquid-logo 
                                src="./assets/logomain.png"
                                size="220"
                                refraction="0.015"
                                patternScale="2.5"
                                speed="7">
                            </liquid-logo>
                        </div>
                        <div class="logo-description">
                            Refined settings perfect for branding
                        </div>
                    </div>
                </div>

                <div class="controls">
                    <h3>🎛️ Custom Configuration</h3>
                    <div class="control-group">
                        <div class="control-item">
                            <label>Size (px)</label>
                            <input 
                                type="number" 
                                min="100" 
                                max="400" 
                                step="10"
                                .value="${this.customSize}"
                                @input="${(e) => this.handleControlChange('customSize', e)}"
                            />
                        </div>
                        
                        <div class="control-item">
                            <label>Refraction (0-0.06)</label>
                            <input 
                                type="number" 
                                min="0" 
                                max="0.06" 
                                step="0.005"
                                .value="${this.customRefraction}"
                                @input="${(e) => this.handleControlChange('customRefraction', e)}"
                            />
                        </div>
                        
                        <div class="control-item">
                            <label>Pattern Scale (0.8-4)</label>
                            <input 
                                type="number" 
                                min="0.8" 
                                max="4" 
                                step="0.2"
                                .value="${this.customPatternScale}"
                                @input="${(e) => this.handleControlChange('customPatternScale', e)}"
                            />
                        </div>
                        
                        <div class="control-item">
                            <label>Speed (seconds)</label>
                            <input 
                                type="number" 
                                min="2" 
                                max="15" 
                                step="1"
                                .value="${this.customSpeed}"
                                @input="${(e) => this.handleControlChange('customSpeed', e)}"
                            />
                        </div>
                        
                        <div class="control-item">
                            <label>Pattern Blur (0-2)</label>
                            <input 
                                type="number" 
                                min="0" 
                                max="2" 
                                step="0.1"
                                .value="${this.customBlur}"
                                @input="${(e) => this.handleControlChange('customBlur', e)}"
                            />
                        </div>
                        
                        <div class="control-item">
                            <label>
                                <input 
                                    type="checkbox" 
                                    .checked="${this.customStill}"
                                    @change="${(e) => this.handleControlChange('customStill', e)}"
                                /> Static (no animation)
                            </label>
                        </div>
                    </div>
                    
                    <div class="custom-demo">
                        <liquid-logo 
                            src="./assets/logomain.png"
                            size="${this.customSize}"
                            refraction="${this.customRefraction}"
                            patternScale="${this.customPatternScale}"
                            speed="${this.customSpeed}"
                            patternBlur="${this.customBlur}"
                            ?still="${this.customStill}">
                        </liquid-logo>
                    </div>
                </div>
            </div>
        `;
    }
}

customElements.define('logo-demo-view', LogoDemoView);