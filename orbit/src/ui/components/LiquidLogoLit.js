import { html, css, LitElement } from '../assets/lit-core-2.7.4.min.js';

/**
 * LitElement version of the LiquidLogo component
 * Liquid/refraction effect for a logo using animated SVG filters.
 */
export class LiquidLogoLit extends LitElement {
    static styles = css`
        :host {
            display: inline-block;
        }
        
        .liquid-container {
            background: radial-gradient(120% 120% at 30% 20%, #f6f7f8 0%, #dcdfe3 45%, #afb4bb 100%);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            border-radius: 20px;
        }
        
        svg {
            display: block;
        }
    `;

    static properties = {
        src: { type: String },
        size: { type: Number },
        refraction: { type: Number },
        patternScale: { type: Number },
        patternBlur: { type: Number },
        speed: { type: Number },
        still: { type: Boolean }
    };

    constructor() {
        super();
        this.src = './assets/logomain.png';
        this.size = 240;
        this.refraction = 0.02;
        this.patternScale = 2;
        this.patternBlur = 0.5;
        this.speed = 6;
        this.still = false;
        
        // Generate unique IDs
        this.uid = Math.random().toString(36).substr(2, 9);
        this.filterId = `liquidRefraction-${this.uid}`;
        this.noiseId = `noise-${this.uid}`;
    }

    get displacementScale() {
        return Math.round(this.refraction * 1000);
    }

    get baseFx() {
        return 0.9 / Math.max(0.8, this.patternScale);
    }

    get baseFy() {
        return 1.1 / Math.max(0.8, this.patternScale);
    }

    render() {
        return html`
            <div class="liquid-container">
                <svg
                    width="${this.size}"
                    height="${this.size}"
                    viewBox="0 0 ${this.size} ${this.size}"
                    role="img"
                    aria-label="Liquid Logo"
                >
                    <defs>
                        <filter
                            id="${this.filterId}"
                            x="-20%"
                            y="-20%"
                            width="140%"
                            height="140%"
                            filterUnits="objectBoundingBox"
                            color-interpolation-filters="sRGB"
                        >
                            <feTurbulence
                                type="fractalNoise"
                                baseFrequency="${this.baseFx} ${this.baseFy}"
                                numOctaves="2"
                                seed="7"
                                result="${this.noiseId}"
                            >
                                ${!this.still ? html`
                                    <animate
                                        attributeName="baseFrequency"
                                        values="${this.baseFx} ${this.baseFy}; ${this.baseFx * 0.8} ${this.baseFy * 1.1}; ${this.baseFx} ${this.baseFy}"
                                        dur="${this.speed}s"
                                        repeatCount="indefinite"
                                    />
                                ` : ''}
                            </feTurbulence>

                            <feGaussianBlur 
                                in="${this.noiseId}" 
                                stdDeviation="${this.patternBlur}" 
                                result="softNoise" 
                            />

                            <feDisplacementMap
                                in="SourceGraphic"
                                in2="softNoise"
                                scale="${this.displacementScale}"
                                xChannelSelector="R"
                                yChannelSelector="G"
                            />
                        </filter>
                    </defs>

                    <image
                        href="${this.src}"
                        x="0"
                        y="0"
                        width="${this.size}"
                        height="${this.size}"
                        preserveAspectRatio="xMidYMid meet"
                        style="filter: url(#${this.filterId})"
                    />
                </svg>
            </div>
        `;
    }
}

customElements.define('liquid-logo', LiquidLogoLit);