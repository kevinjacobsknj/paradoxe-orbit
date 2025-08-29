import { html, css, LitElement } from '../../ui/assets/lit-core-2.7.4.min.js';
import { parser, parser_write, parser_end, default_renderer } from '../../ui/assets/smd.js';

export class AskView extends LitElement {
    static properties = {
        currentResponse: { type: String },
        currentQuestion: { type: String },
        isLoading: { type: Boolean },
        copyState: { type: String },
        isHovering: { type: Boolean },
        hoveredLineIndex: { type: Number },
        lineCopyState: { type: Object },
        showTextInput: { type: Boolean },
        headerText: { type: String },
        headerAnimating: { type: Boolean },
        isStreaming: { type: Boolean },
        isNavigatingExternal: { type: Boolean },
        externalContent: { type: String },
        originalContent: { type: String },
        browserTabs: { type: Array },
        activeTabIndex: { type: Number },
    };

    static styles = css`
        :host {
            display: block;
            width: 100%;
            height: 100%;
            color: #ffffff;
            background: #1a1a1a;
            transform: translate3d(0, 0, 0);
            backface-visibility: hidden;
            transition: transform 0.2s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.2s ease-out;
            will-change: transform, opacity;
        }

        :host(.hiding) {
            animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.6, 1) forwards;
        }

        :host(.showing) {
            animation: slideDown 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }

        :host(.hidden) {
            opacity: 0;
            transform: translateY(-150%) scale(0.85);
            pointer-events: none;
        }

        @keyframes slideUp {
            0% {
                opacity: 1;
                transform: translateY(0) scale(1);
                filter: blur(0px);
            }
            30% {
                opacity: 0.7;
                transform: translateY(-20%) scale(0.98);
                filter: blur(0.5px);
            }
            70% {
                opacity: 0.3;
                transform: translateY(-80%) scale(0.92);
                filter: blur(1.5px);
            }
            100% {
                opacity: 0;
                transform: translateY(-150%) scale(0.85);
                filter: blur(2px);
            }
        }

        @keyframes slideDown {
            0% {
                opacity: 0;
                transform: translateY(-150%) scale(0.85);
                filter: blur(2px);
            }
            30% {
                opacity: 0.5;
                transform: translateY(-50%) scale(0.92);
                filter: blur(1px);
            }
            65% {
                opacity: 0.9;
                transform: translateY(-5%) scale(0.99);
                filter: blur(0.2px);
            }
            85% {
                opacity: 0.98;
                transform: translateY(2%) scale(1.005);
                filter: blur(0px);
            }
            100% {
                opacity: 1;
                transform: translateY(0) scale(1);
                filter: blur(0px);
            }
        }

        * {
            font-family: 'Helvetica Neue', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            cursor: default;
            user-select: none;
        }

        /* Allow text selection in assistant responses */
        .response-container, .response-container * {
            user-select: text !important;
            cursor: text !important;
        }

        /* Link styling */
        .response-container a {
            color: #FF3D00 !important;
            text-decoration: underline !important;
            cursor: pointer !important;
        }

        .response-container a:hover {
            color: #E33600 !important;
            text-decoration: underline !important;
        }

        .response-container a:visited {
            color: #CC3300 !important;
        }

        /* Inline back button styling */
        .response-container .inline-back-button {
            background: #ffffff !important;
            color: #FF3D00 !important;
            border: none !important;
            padding: 8px 16px !important;
            border-radius: 8px !important;
            cursor: pointer !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            transition: all 0.2s ease !important;
            user-select: none !important;
            box-shadow: 
                3px 3px 6px rgba(0, 0, 0, 0.08),
                -3px -3px 6px rgba(255, 255, 255, 0.9) !important;
        }

        .response-container .inline-back-button:hover {
            box-shadow: 
                4px 4px 8px rgba(0, 0, 0, 0.1),
                -4px -4px 8px rgba(255, 255, 255, 0.9) !important;
        }

        /* Mini Browser Interface */
        .mini-browser {
            position: relative;
            width: 100%;
            min-height: 500px;
            max-height: 700px;
            height: auto;
            background: #f8f8f8;
            display: flex;
            flex-direction: column;
            border-radius: 12px;
            overflow: hidden;
            margin-top: 8px;
        }

        .browser-header {
            background: #2a2a2a;
            padding: 8px 16px;
            display: flex;
            align-items: center;
            gap: 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            flex-shrink: 0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .browser-back-button {
            background: #1a1a1a;
            color: #ffffff;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
            transition: all 0.2s ease;
            outline: none;
            box-shadow: 
                3px 3px 6px rgba(0, 0, 0, 0.4),
                -3px -3px 6px rgba(255, 255, 255, 0.02);
        }

        .browser-back-button:hover {
            box-shadow: 
                inset 2px 2px 4px rgba(0, 0, 0, 0.5),
                inset -2px -2px 4px rgba(255, 255, 255, 0.02);
        }

        .browser-back-button:focus {
            outline: none;
        }

        .browser-tabs {
            display: flex;
            flex: 1;
            gap: 2px;
            overflow-x: auto;
        }

        .browser-tab {
            background: #1a1a1a;
            color: #cccccc;
            border: none;
            padding: 8px 16px;
            border-radius: 8px 8px 0 0;
            cursor: pointer;
            font-size: 12px;
            white-space: nowrap;
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s ease;
            box-shadow: 
                inset 1px 1px 2px rgba(0, 0, 0, 0.4),
                inset -1px -1px 2px rgba(255, 255, 255, 0.02);
        }

        .browser-tab.active {
            background: #2a2a2a;
            color: #FF3D00;
            box-shadow: 
                2px 2px 4px rgba(0, 0, 0, 0.4),
                -2px -2px 4px rgba(255, 255, 255, 0.02);
            border-bottom: 2px solid #FF3D00;
        }

        .browser-tab:hover {
            background: #333333;
        }

        .browser-tab.active:hover {
            background: #2a2a2a;
        }

        .tab-close {
            background: none;
            border: none;
            color: currentColor;
            cursor: pointer;
            padding: 2px;
            border-radius: 4px;
            font-size: 14px;
            opacity: 0.7;
            transition: all 0.15s ease;
        }

        .tab-close:hover {
            opacity: 1;
            background: rgba(255, 255, 255, 0.1);
        }

        .browser-content {
            flex: 1;
            width: 100%;
            border: none;
            background: white;
        }

        .browser-new-tab {
            background: #1a1a1a;
            color: #FF3D00;
            border: 1px dashed #FF3D00;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 18px;
            transition: all 0.2s ease;
            box-shadow: 
                2px 2px 4px rgba(0, 0, 0, 0.4),
                -2px -2px 4px rgba(255, 255, 255, 0.02);
        }

        .browser-new-tab:hover {
            background: #333333;
            box-shadow: 
                inset 2px 2px 4px rgba(0, 0, 0, 0.5),
                inset -2px -2px 4px rgba(255, 255, 255, 0.02);
        }

        .response-container pre {
            background: #1a1a1a !important;
            border-radius: 8px !important;
            padding: 12px !important;
            margin: 8px 0 !important;
            overflow-x: auto !important;
            white-space: pre !important;
            word-wrap: normal !important;
            word-break: normal !important;
            box-shadow: 
                inset 2px 2px 4px rgba(0, 0, 0, 0.4),
                inset -2px -2px 4px rgba(255, 255, 255, 0.02) !important;
        }

        .response-container code {
            font-family: 'Monaco', 'Menlo', 'Consolas', monospace !important;
            font-size: 11px !important;
            background: transparent !important;
            white-space: pre !important;
            word-wrap: normal !important;
            word-break: normal !important;
        }

        .response-container pre code {
            white-space: pre !important;
            word-wrap: normal !important;
            word-break: normal !important;
            display: block !important;
        }

        .response-container p code {
            background: #333333 !important;
            padding: 2px 4px !important;
            border-radius: 3px !important;
            color: #ff6b6b !important;
        }

        .hljs-keyword {
            color: #d73a49 !important;
        }
        .hljs-string {
            color: #032f62 !important;
        }
        .hljs-comment {
            color: #6a737d !important;
        }
        .hljs-number {
            color: #005cc5 !important;
        }
        .hljs-function {
            color: #6f42c1 !important;
        }
        .hljs-variable {
            color: #e36209 !important;
        }
        .hljs-built_in {
            color: #005cc5 !important;
        }
        .hljs-title {
            color: #6f42c1 !important;
        }
        .hljs-attr {
            color: #22863a !important;
        }
        .hljs-tag {
            color: #22863a !important;
        }

        .ask-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            background: #2a2a2a;
            border-radius: 12px;
            box-sizing: border-box;
            position: relative;
            overflow-y: auto;
            box-shadow: 
                8px 8px 16px rgba(0, 0, 0, 0.4),
                -8px -8px 16px rgba(255, 255, 255, 0.02),
                inset 1px 1px 2px rgba(255, 255, 255, 0.02),
                inset -1px -1px 2px rgba(0, 0, 0, 0.3);
        }

        .ask-container::before {
            display: none;
        }

        .response-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: transparent;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            flex-shrink: 0;
        }

        .response-header.hidden {
            display: none;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-shrink: 0;
        }

        .response-icon {
            width: 20px;
            height: 20px;
            background: #1a1a1a;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 
                2px 2px 4px rgba(0, 0, 0, 0.4),
                -2px -2px 4px rgba(255, 255, 255, 0.02);
        }

        .response-icon svg {
            width: 12px;
            height: 12px;
            stroke: #ffffff;
        }

        .response-label {
            font-size: 13px;
            font-weight: 500;
            color: #ffffff;
            white-space: nowrap;
            position: relative;
            overflow: hidden;
        }

        .response-label.animating {
            animation: fadeInOut 0.3s ease-in-out;
        }

        @keyframes fadeInOut {
            0% {
                opacity: 1;
                transform: translateY(0);
            }
            50% {
                opacity: 0;
                transform: translateY(-10px);
            }
            100% {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .header-right {
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
            justify-content: flex-end;
        }

        .question-text {
            font-size: 13px;
            color: #cccccc;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 300px;
            margin-right: 8px;
        }

        .header-controls {
            display: flex;
            gap: 8px;
            align-items: center;
            flex-shrink: 0;
        }

        .copy-button {
            background: #1a1a1a;
            color: #ffffff;
            border: none;
            padding: 4px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            min-width: 24px;
            height: 24px;
            flex-shrink: 0;
            transition: all 0.2s ease;
            position: relative;
            overflow: hidden;
            box-shadow: 
                2px 2px 4px rgba(0, 0, 0, 0.4),
                -2px -2px 4px rgba(255, 255, 255, 0.02);
        }

        .copy-button:hover {
            box-shadow: 
                inset 2px 2px 4px rgba(0, 0, 0, 0.5),
                inset -2px -2px 4px rgba(255, 255, 255, 0.02);
        }

        .copy-button svg {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
        }

        .copy-button .check-icon {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
        }

        .copy-button.copied .copy-icon {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
        }

        .copy-button.copied .check-icon {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }

        .back-button {
            background: #1a1a1a;
            color: #ffffff;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            font-weight: 600;
            transition: all 0.2s ease;
            outline: none;
            box-shadow: 
                3px 3px 6px rgba(0, 0, 0, 0.4),
                -3px -3px 6px rgba(255, 255, 255, 0.02);
            margin-right: 8px;
        }

        .back-button:hover {
            box-shadow: 
                inset 2px 2px 4px rgba(0, 0, 0, 0.5),
                inset -2px -2px 4px rgba(255, 255, 255, 0.02);
        }

        .back-button:focus {
            outline: none;
        }

        .back-button svg {
            flex-shrink: 0;
        }

        .close-button {
            background: #1a1a1a;
            color: #ffffff;
            border: none;
            padding: 4px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            box-shadow: 
                2px 2px 4px rgba(0, 0, 0, 0.4),
                -2px -2px 4px rgba(255, 255, 255, 0.02);
            transition: all 0.2s ease;
        }

        .close-button:hover {
            box-shadow: 
                inset 2px 2px 4px rgba(0, 0, 0, 0.5),
                inset -2px -2px 4px rgba(255, 255, 255, 0.02);
        }

        .response-container {
            flex: 1;
            padding: 16px;
            padding-left: 48px;
            overflow-y: auto;
            font-size: 14px;
            line-height: 1.6;
            background: transparent;
            min-height: 0;
            max-height: 380px;
            position: relative;
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.4) rgba(255, 255, 255, 0.08);
        }
        
        .response-container h1,
        .response-container h2,
        .response-container h3 {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .response-container h1 img,
        .response-container h2 img,
        .response-container h3 img {
            width: 18px;
            height: 18px;
            object-fit: contain;
            vertical-align: middle;
            display: inline-block;
        }

        .response-container.hidden {
            display: none;
        }

        .response-container::-webkit-scrollbar {
            width: 8px;
        }

        .response-container::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.08);
            border-radius: 4px;
            margin: 2px;
        }

        .response-container::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.4);
            border-radius: 4px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .response-container::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.6);
            border-color: rgba(255, 255, 255, 0.2);
        }

        .response-container::-webkit-scrollbar-thumb:active {
            background: rgba(255, 255, 255, 0.7);
        }

        .loading-orbit {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px;
            position: relative;
        }

        .orbit-loader {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            perspective: 800px;
            position: relative;
        }

        .orbit-inner {
            position: absolute;
            box-sizing: border-box;
            width: 100%;
            height: 100%;
            border-radius: 50%;
        }

        .orbit-inner.one {
            left: 0%;
            top: 0%;
            animation: rotate-one 1s linear infinite;
            border-bottom: 3px solid rgba(0, 0, 0, 0.6);
        }

        .orbit-inner.two {
            right: 0%;
            top: 0%;
            animation: rotate-two 1s linear infinite;
            border-right: 3px solid rgba(0, 0, 0, 0.6);
        }

        .orbit-inner.three {
            right: 0%;
            bottom: 0%;
            animation: rotate-three 1s linear infinite;
            border-top: 3px solid rgba(0, 0, 0, 0.6);
        }

        @keyframes rotate-one {
            0% {
                transform: rotateX(35deg) rotateY(-45deg) rotateZ(0deg);
            }
            100% {
                transform: rotateX(35deg) rotateY(-45deg) rotateZ(360deg);
            }
        }

        @keyframes rotate-two {
            0% {
                transform: rotateX(50deg) rotateY(10deg) rotateZ(0deg);
            }
            100% {
                transform: rotateX(50deg) rotateY(10deg) rotateZ(360deg);
            }
        }

        @keyframes rotate-three {
            0% {
                transform: rotateX(35deg) rotateY(55deg) rotateZ(0deg);
            }
            100% {
                transform: rotateX(35deg) rotateY(55deg) rotateZ(360deg);
            }
        }

        .response-line {
            position: relative;
            padding: 2px 0;
            margin: 0;
            transition: background-color 0.15s ease;
        }

        .response-line:hover {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 4px;
        }

        /* Style em elements */
        .response-container em {
            font-style: italic;
        }

        .loading-enhanced {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 24px;
            border-radius: 8px;
            margin: 16px 0;
            border: 1px solid #666666;
            background: #1a1a1a;
        }

        .line-copy-button {
            position: absolute;
            left: -32px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 3px;
            padding: 2px;
            cursor: pointer;
            opacity: 0;
            transition: opacity 0.15s ease, background-color 0.15s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 20px;
            height: 20px;
        }

        .response-line:hover .line-copy-button {
            opacity: 1;
        }

        .line-copy-button:hover {
            background: rgba(255, 255, 255, 0.2);
        }

        .line-copy-button.copied {
            background: rgba(40, 167, 69, 0.3);
        }

        .line-copy-button svg {
            width: 12px;
            height: 12px;
            stroke: rgba(255, 255, 255, 0.9);
        }

        .text-input-container {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.05);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            flex-shrink: 0;
            transition: opacity 0.1s ease-in-out, transform 0.1s ease-in-out;
            transform-origin: bottom;
        }

        .text-input-container.hidden {
            opacity: 0;
            transform: scaleY(0);
            padding: 0;
            height: 0;
            overflow: hidden;
            border-top: none;
        }

        .text-input-container.no-response {
            border-top: none;
        }

        #textInput {
            flex: 1;
            padding: 10px 14px;
            background: #1a1a1a;
            border-radius: 20px;
            outline: none;
            border: none;
            color: white;
            font-size: 14px;
            font-family: 'Helvetica Neue', sans-serif;
            font-weight: 400;
            box-shadow: 
                inset 2px 2px 4px rgba(0, 0, 0, 0.4),
                inset -2px -2px 4px rgba(255, 255, 255, 0.02);
        }

        #textInput::placeholder {
            color: rgba(255, 255, 255, 0.5);
        }

        #textInput:focus {
            outline: none;
        }

        .response-line h1,
        .response-line h2,
        .response-line h3,
        .response-line h4,
        .response-line h5,
        .response-line h6 {
            color: #ffffff;
            margin: 16px 0 8px 0;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .response-line h1 img,
        .response-line h2 img,
        .response-line h3 img {
            width: 18px;
            height: 18px;
            object-fit: contain;
            vertical-align: middle;
        }

        .response-line p {
            margin: 8px 0;
            color: #ffffff;
        }

        .response-line ul,
        .response-line ol {
            margin: 8px 0;
            padding-left: 20px;
        }

        .response-line li {
            margin: 4px 0;
            color: #ffffff;
        }

        .response-line code {
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.95);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 13px;
        }

        .response-line pre {
            background: rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.95);
            padding: 12px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 12px 0;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .response-line pre code {
            background: none;
            padding: 0;
        }

        .response-line blockquote {
            border-left: 3px solid rgba(255, 255, 255, 0.3);
            margin: 12px 0;
            padding: 8px 16px;
            background: rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.8);
        }

        .empty-state {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: rgba(255, 255, 255, 0.6);
            font-size: 14px;
        }

        /* Enhanced Response Tabs in Header */
        #tabsContainer {
            display: flex;
            align-items: center;
            flex: 1;
        }

        .enhanced-tabs-container {
            display: flex;
            flex-direction: column;
            width: 100%;
        }

        .enhanced-tabs-header {
            display: flex;
            background: #1a1a1a;
            border-radius: 16px;
            padding: 4px;
            gap: 2px;
            box-shadow: 
                inset 2px 2px 4px rgba(0, 0, 0, 0.5),
                inset -2px -2px 4px rgba(255, 255, 255, 0.02);
        }

        .enhanced-tab {
            flex: 1;
            background: #2a2a2a;
            color: #cccccc;
            border: none;
            padding: 6px 12px;
            border-radius: 12px;
            cursor: pointer;
            font-size: 11px;
            font-weight: 600;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            min-height: 24px;
            white-space: nowrap;
            box-shadow: 
                2px 2px 4px rgba(0, 0, 0, 0.4),
                -2px -2px 4px rgba(255, 255, 255, 0.02);
        }

        .tab-logo {
            width: 12px;
            height: 12px;
            object-fit: contain;
            vertical-align: middle;
        }

        .enhanced-tab:hover {
            color: #ffffff;
            box-shadow: 
                3px 3px 6px rgba(0, 0, 0, 0.5),
                -3px -3px 6px rgba(255, 255, 255, 0.02);
            transform: translateY(-1px);
        }

        .enhanced-tab.active {
            background: #333333;
            color: #ffffff;
            box-shadow: 
                inset 3px 3px 6px rgba(0, 0, 0, 0.5),
                inset -3px -3px 6px rgba(255, 255, 255, 0.02);
            transform: none;
        }

        /* Animation for enhanced tabs appearing */
        .enhanced-tab.tab-enter {
            opacity: 0;
            transform: translateX(-20px) scale(0.8);
            animation: tabSlideIn 0.4s ease-out forwards;
        }

        @keyframes tabSlideIn {
            0% {
                opacity: 0;
                transform: translateX(-20px) scale(0.8);
            }
            60% {
                opacity: 0.8;
                transform: translateX(2px) scale(1.02);
            }
            100% {
                opacity: 1;
                transform: translateX(0) scale(1);
            }
        }

        /* Stagger animation delays for multiple tabs */
        .enhanced-tab.tab-enter:nth-child(1) { animation-delay: 0ms; }
        .enhanced-tab.tab-enter:nth-child(2) { animation-delay: 100ms; }
        .enhanced-tab.tab-enter:nth-child(3) { animation-delay: 200ms; }
        .enhanced-tab.tab-enter:nth-child(4) { animation-delay: 300ms; }
        .enhanced-tab.tab-enter:nth-child(5) { animation-delay: 400ms; }


        .btn-gap {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: 4px;
        }

        /* ────────────────[ GLASS BYPASS ]─────────────── */
        :host-context(body.has-orbit) .ask-container,
        :host-context(body.has-orbit) .response-header,
        :host-context(body.has-orbit) .response-icon,
        :host-context(body.has-orbit) .copy-button,
        :host-context(body.has-orbit) .close-button,
        :host-context(body.has-orbit) .line-copy-button,
        :host-context(body.has-orbit) .text-input-container,
        :host-context(body.has-orbit) .response-container pre,
        :host-context(body.has-orbit) .response-container p code,
        :host-context(body.has-orbit) .response-container pre code {
            background: transparent !important;
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
            filter: none !important;
            backdrop-filter: none !important;
        }

        :host-context(body.has-orbit) .ask-container::before {
            display: none !important;
        }

        :host-context(body.has-orbit) .copy-button:hover,
        :host-context(body.has-orbit) .close-button:hover,
        :host-context(body.has-orbit) .line-copy-button,
        :host-context(body.has-orbit) .line-copy-button:hover,
        :host-context(body.has-orbit) .response-line:hover {
            background: transparent !important;
        }

        :host-context(body.has-orbit) .response-container::-webkit-scrollbar-track,
        :host-context(body.has-orbit) .response-container::-webkit-scrollbar-thumb {
            background: transparent !important;
        }

        .submit-btn, .clear-btn {
            display: flex;
            align-items: center;
            background: transparent;
            color: white;
            border: none;
            border-radius: 6px;
            margin-left: 8px;
            font-size: 13px;
            font-family: 'Helvetica Neue', sans-serif;
            font-weight: 500;
            overflow: hidden;
            cursor: pointer;
            transition: background 0.15s;
            height: 32px;
            padding: 0 10px;
            box-shadow: none;
        }
        .submit-btn:hover, .clear-btn:hover {
            background: rgba(255,255,255,0.1);
        }
        .btn-label {
            margin-right: 8px;
            display: flex;
            align-items: center;
            height: 100%;
        }
        .btn-icon {
            background: rgba(255,255,255,0.1);
            border-radius: 13%;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
        }
        .btn-icon img, .btn-icon svg {
            width: 13px;
            height: 13px;
            display: block;
        }
        .header-clear-btn {
            background: transparent;
            border: none;
            display: flex;
            align-items: center;
            gap: 2px;
            cursor: pointer;
            padding: 0 2px;
        }
        .header-clear-btn .icon-box {
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
        .header-clear-btn:hover .icon-box {
            background-color: rgba(255,255,255,0.18);
        }
    `;

    constructor() {
        super();
        this.currentResponse = '';
        this.currentQuestion = '';
        this.isLoading = false;
        this.copyState = 'idle';
        this.showTextInput = true;
        this.headerText = 'AI Response';
        this.headerAnimating = false;
        this.isStreaming = false;
        this.isNavigatingExternal = false;
        this.externalContent = '';
        this.originalContent = '';
        this.browserTabs = [];
        this.activeTabIndex = 0;
        this.enhancedSections = null;
        this.currentActiveTab = null;

        this.marked = null;
        this.hljs = null;
        this.DOMPurify = null;
        this.isLibrariesLoaded = false;

        // SMD.js streaming markdown parser
        this.smdParser = null;
        this.smdContainer = null;
        this.lastProcessedLength = 0;

        this.handleSendText = this.handleSendText.bind(this);
        this.handleTextKeydown = this.handleTextKeydown.bind(this);
        this.handleCopy = this.handleCopy.bind(this);
        this.clearResponseContent = this.clearResponseContent.bind(this);
        this.handleEscKey = this.handleEscKey.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
        this.handleCloseAskWindow = this.handleCloseAskWindow.bind(this);
        this.handleCloseIfNoContent = this.handleCloseIfNoContent.bind(this);

        this.loadLibraries();

        // --- Resize helpers ---
        this.isThrottled = false;
    }

    connectedCallback() {
        super.connectedCallback();

        console.log('📱 AskView connectedCallback - IPC 이벤트 리스너 설정');

        document.addEventListener('keydown', this.handleEscKey);

        this.resizeObserver = new ResizeObserver(entries => {
            for (const entry of entries) {
                const needed = entry.contentRect.height;
                const current = window.innerHeight;

                if (needed > current - 4) {
                    this.requestWindowResize(Math.ceil(needed));
                }
            }
        });

        const container = this.shadowRoot?.querySelector('.ask-container');
        if (container) this.resizeObserver.observe(container);

        this.handleQuestionFromAssistant = (event, question) => {
            console.log('AskView: Received question from ListenView:', question);
            this.handleSendText(null, question);
        };

        if (window.api) {
            window.api.askView.onShowTextInput(() => {
                console.log('Show text input signal received');
                if (!this.showTextInput) {
                    this.showTextInput = true;
                    this.updateComplete.then(() => this.focusTextInput());
                  } else {
                    this.focusTextInput();
                  }
            });

            window.api.askView.onScrollResponseUp(() => this.handleScroll('up'));
            window.api.askView.onScrollResponseDown(() => this.handleScroll('down'));
            
            // Listen for mini browser open commands
            if (window.api.askView.onOpenMiniBrowser) {
                window.api.askView.onOpenMiniBrowser((event, data) => {
                    console.log('[AskView] Opening mini browser:', data);
                    this.openInMiniBrowser(data.url, data.title);
                });
            }
            window.api.askView.onAskStateUpdate((event, newState) => {
                this.currentResponse = newState.currentResponse;
                this.currentQuestion = newState.currentQuestion;
                this.isLoading       = newState.isLoading;
                this.isStreaming     = newState.isStreaming;
              
                const wasHidden = !this.showTextInput;
                this.showTextInput = newState.showTextInput;
              
                if (newState.showTextInput) {
                  if (wasHidden) {
                    this.updateComplete.then(() => this.focusTextInput());
                  } else {
                    this.focusTextInput();
                  }
                }
              });
            console.log('AskView: IPC 이벤트 리스너 등록 완료');
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.resizeObserver?.disconnect();

        console.log('📱 AskView disconnectedCallback - IPC 이벤트 리스너 제거');

        document.removeEventListener('keydown', this.handleEscKey);

        if (this.copyTimeout) {
            clearTimeout(this.copyTimeout);
        }

        if (this.headerAnimationTimeout) {
            clearTimeout(this.headerAnimationTimeout);
        }

        if (this.streamingTimeout) {
            clearTimeout(this.streamingTimeout);
        }

        Object.values(this.lineCopyTimeouts).forEach(timeout => clearTimeout(timeout));

        if (window.api) {
            window.api.askView.removeOnAskStateUpdate(this.handleAskStateUpdate);
            window.api.askView.removeOnShowTextInput(this.handleShowTextInput);
            window.api.askView.removeOnScrollResponseUp(this.handleScroll);
            window.api.askView.removeOnScrollResponseDown(this.handleScroll);
            console.log('✅ AskView: IPC 이벤트 리스너 제거 필요');
        }
    }


    async loadLibraries() {
        try {
            if (!window.marked) {
                await this.loadScript('../../assets/marked-4.3.0.min.js');
            }

            if (!window.hljs) {
                await this.loadScript('../../assets/highlight-11.9.0.min.js');
            }

            if (!window.DOMPurify) {
                await this.loadScript('../../assets/dompurify-3.0.7.min.js');
            }

            this.marked = window.marked;
            this.hljs = window.hljs;
            this.DOMPurify = window.DOMPurify;

            if (this.marked && this.hljs) {
                this.marked.setOptions({
                    highlight: (code, lang) => {
                        if (lang && this.hljs.getLanguage(lang)) {
                            try {
                                return this.hljs.highlight(code, { language: lang }).value;
                            } catch (err) {
                                console.warn('Highlight error:', err);
                            }
                        }
                        try {
                            return this.hljs.highlightAuto(code).value;
                        } catch (err) {
                            console.warn('Auto highlight error:', err);
                        }
                        return code;
                    },
                    breaks: true,
                    gfm: true,
                    pedantic: false,
                    smartypants: false,
                    xhtml: false,
                });

                this.isLibrariesLoaded = true;
                this.renderContent();
                console.log('Markdown libraries loaded successfully in AskView');
            }

            if (this.DOMPurify) {
                this.isDOMPurifyLoaded = true;
                console.log('DOMPurify loaded successfully in AskView');
            }
        } catch (error) {
            console.error('Failed to load libraries in AskView:', error);
        }
    }

    handleCloseAskWindow() {
        // Clear browser tabs when closing the window completely
        this.browserTabs = [];
        this.activeTabIndex = 0;
        this.isNavigatingExternal = false;
        this.originalContent = null;
        // this.clearResponseContent();
        window.api.askView.closeAskWindow();
    }

    handleCloseIfNoContent() {
        if (!this.currentResponse && !this.isLoading && !this.isStreaming) {
            this.handleCloseAskWindow();
        }
    }

    handleEscKey(e) {
        if (e.key === 'Escape') {
            e.preventDefault();
            this.handleCloseIfNoContent();
        }
    }

    clearResponseContent() {
        this.currentResponse = '';
        this.currentQuestion = '';
        this.isLoading = false;
        this.isStreaming = false;
        this.headerText = 'AI Response';
        this.showTextInput = true;
        this.lastProcessedLength = 0;
        this.smdParser = null;
        this.smdContainer = null;
    }

    handleInputFocus() {
        this.isInputFocused = true;
    }

    focusTextInput() {
        requestAnimationFrame(() => {
            const textInput = this.shadowRoot?.getElementById('textInput');
            if (textInput) {
                textInput.focus();
            }
        });
    }


    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    parseMarkdown(text) {
        if (!text) return '';

        if (!this.isLibrariesLoaded || !this.marked) {
            return text;
        }

        try {
            return this.marked(text);
        } catch (error) {
            console.error('Markdown parsing error in AskView:', error);
            return text;
        }
    }

    switchEnhancedTab(tabName, event) {
        if (event) {
            event.stopPropagation();
        }
        
        if (!this.enhancedSections) return;
        
        // Update active tab
        const tabs = this.shadowRoot.querySelectorAll('.enhanced-tab');
        tabs.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update response container content based on selected tab
        const responseContainer = this.shadowRoot.getElementById('responseContainer');
        if (responseContainer) {
            let content = '';
            switch (tabName) {
                case 'paradoxe':
                    content = `<div class="main-response">${this.renderMarkdownSection(this.enhancedSections.main)}</div>`;
                    break;
                case 'overview':
                    content = this.renderMarkdownSection(this.enhancedSections.overview);
                    break;
                case 'wikipedia':
                    content = this.renderMarkdownSection(this.enhancedSections.wikipedia);
                    break;
                case 'reddit':
                    content = this.renderMarkdownSection(this.enhancedSections.reddit);
                    break;
                case 'tldr':
                    content = this.renderMarkdownSection(this.enhancedSections.tldr);
                    break;
                default:
                    content = `<div class="main-response">${this.renderMarkdownSection(this.enhancedSections.main)}</div>`;
            }
            responseContainer.innerHTML = content;
            
            // Apply syntax highlighting
            if (this.hljs) {
                responseContainer.querySelectorAll('pre code').forEach(block => {
                    if (!block.hasAttribute('data-highlighted')) {
                        this.hljs.highlightElement(block);
                        block.setAttribute('data-highlighted', 'true');
                    }
                });
            }
            
            // Add link handlers
            responseContainer.querySelectorAll('a').forEach(link => {
                if (!link.hasAttribute('data-nav-handled')) {
                    const originalHref = link.href;
                    link.setAttribute('data-original-href', originalHref);
                    
                    link.addEventListener('click', (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        this.handleLinkClick(event);
                    });
                    
                    link.setAttribute('data-nav-handled', 'true');
                }
            });
        }
        
        this.currentActiveTab = tabName;
    }

    parseEnhancedResponse(response) {
        const sections = {
            main: '',
            overview: '',
            wikipedia: '',
            reddit: '',
            tldr: ''
        };

        // Split response by sections
        const parts = response.split(/^## (AI Overview|Wikipedia|Community Discussions|TL;DR)/gm);
        
        // First part is the main response
        sections.main = parts[0] ? parts[0].trim() : '';
        
        // Parse sections
        for (let i = 1; i < parts.length; i += 2) {
            const sectionName = parts[i];
            const content = parts[i + 1] || '';
            
            switch (sectionName) {
                case 'AI Overview':
                    sections.overview = content.trim();
                    break;
                case 'Wikipedia':
                    sections.wikipedia = content.trim();
                    break;
                case 'Community Discussions':
                    sections.reddit = content.trim();
                    break;
                case 'TL;DR':
                    sections.tldr = content.trim();
                    break;
            }
        }

        return sections;
    }

    renderMarkdownSection(content) {
        if (!content) return '';
        
        if (this.isLibrariesLoaded && this.marked && this.DOMPurify) {
            try {
                const parsedHtml = this.marked.parse(content);
                console.log('Parsed HTML:', parsedHtml); // Debug log
                const sanitized = this.DOMPurify.sanitize(parsedHtml, {
                    ALLOWED_TAGS: [
                        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'b', 'em', 'i',
                        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead',
                        'tbody', 'tr', 'th', 'td', 'hr', 'sup', 'sub', 'del', 'ins', 'div', 'span',
                    ],
                    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel', 'style', 'width', 'height'],
                    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|file):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
                });
                console.log('Sanitized HTML:', sanitized); // Debug log
                return sanitized;
            } catch (error) {
                console.error('Error rendering markdown section:', error);
                return content;
            }
        } else {
            console.log('Libraries not loaded, using fallback for:', content); // Debug log
            // Basic text processing fallback with link support
            const processed = content
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>') // Process markdown links
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`([^`]+)`/g, '<code>$1</code>');
            console.log('Fallback processed:', processed); // Debug log
            return processed;
        }
    }

    fixIncompleteCodeBlocks(text) {
        if (!text) return text;

        const codeBlockMarkers = text.match(/```/g) || [];
        const markerCount = codeBlockMarkers.length;

        if (markerCount % 2 === 1) {
            return text + '\n```';
        }

        return text;
    }

    handleScroll(direction) {
        const scrollableElement = this.shadowRoot.querySelector('#responseContainer');
        if (scrollableElement) {
            const scrollAmount = 100; // 한 번에 스크롤할 양 (px)
            if (direction === 'up') {
                scrollableElement.scrollTop -= scrollAmount;
            } else {
                scrollableElement.scrollTop += scrollAmount;
            }
        }
    }


    renderContent() {
        const responseContainer = this.shadowRoot.getElementById('responseContainer');
        if (!responseContainer) return;
    
        // If navigating to external content, show that instead
        if (this.isNavigatingExternal && this.externalContent) {
            responseContainer.innerHTML = this.externalContent;
            this.adjustWindowHeightThrottled();
            return;
        }
        
        // Check loading state
        if (this.isLoading) {
            responseContainer.innerHTML = `
              <div class="loading-orbit">
                <div class="orbit-loader">
                  <div class="orbit-inner one"></div>
                  <div class="orbit-inner two"></div>
                  <div class="orbit-inner three"></div>
                </div>
              </div>`;
            this.resetStreamingParser();
            return;
        }
        
        // If there is no response, show empty state with loading animation
        if (!this.currentResponse) {
            responseContainer.innerHTML = `
              <div class="loading-orbit">
                <div class="orbit-loader">
                  <div class="orbit-inner one"></div>
                  <div class="orbit-inner two"></div>
                  <div class="orbit-inner three"></div>
                </div>
              </div>`;
            this.resetStreamingParser();
            return;
        }
        
        // Set streaming markdown parser
        this.renderStreamingMarkdown(responseContainer);

        // After updating content, recalculate window height
        this.adjustWindowHeightThrottled();
    }

    resetStreamingParser() {
        this.smdParser = null;
        this.smdContainer = null;
        this.lastProcessedLength = 0;
    }

    renderStreamingMarkdown(responseContainer) {
        try {
            const currentText = this.currentResponse;
            
            // Check if this is an enhanced response with sections
            const hasEnhancedSections = currentText.includes('## AI Overview') || 
                                      currentText.includes('## Wikipedia') || 
                                      currentText.includes('## Community Discussions') || 
                                      currentText.includes('## TL;DR');

            if (hasEnhancedSections && (!this.isStreaming && !this.isLoading)) {
                // Parse enhanced response into sections
                const sections = this.parseEnhancedResponse(currentText);
                
                // Store sections for later use
                this.enhancedSections = sections;
                this.currentActiveTab = 'paradoxe';
                
                // Populate response container with main content initially
                responseContainer.innerHTML = `<div class="main-response">${this.renderMarkdownSection(sections.main)}</div>`;
                
                // Populate tabs in header
                const tabsContainer = this.shadowRoot?.querySelector('#tabsContainer');
                if (tabsContainer) {
                    tabsContainer.innerHTML = `
                        <div class="enhanced-tabs-header">
                            <button class="enhanced-tab active" data-tab="paradoxe">
                                <img src="../assets/logomain.png" alt="Paradoxe" class="tab-logo">
                                Paradoxe
                            </button>
                            ${sections.overview ? `<button class="enhanced-tab tab-enter" data-tab="overview">Overview</button>` : ''}
                            ${sections.wikipedia ? `<button class="enhanced-tab tab-enter" data-tab="wikipedia">Wiki</button>` : ''}
                            ${sections.reddit ? `<button class="enhanced-tab tab-enter" data-tab="reddit">Community</button>` : ''}
                            ${sections.tldr ? `<button class="enhanced-tab tab-enter" data-tab="tldr">TL;DR</button>` : ''}
                        </div>
                    `;
                    
                    // Add click handlers to tabs and trigger animation
                    tabsContainer.querySelectorAll('.enhanced-tab').forEach((tab, index) => {
                        tab.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            this.switchEnhancedTab(tab.dataset.tab);
                        });
                    });
                    
                    // Remove animation classes after animation completes
                    setTimeout(() => {
                        tabsContainer.querySelectorAll('.enhanced-tab.tab-enter').forEach(tab => {
                            tab.classList.remove('tab-enter');
                        });
                    }, 800); // Wait for all animations to complete (400ms + 400ms delay)
                }
            } else {
                // Show Paradoxe tab even for non-enhanced responses
                const tabsContainer = this.shadowRoot?.querySelector('#tabsContainer');
                if (tabsContainer) {
                    tabsContainer.innerHTML = `
                        <div class="enhanced-tabs-header">
                            <button class="enhanced-tab active" data-tab="paradoxe">
                                <img src="../assets/logomain.png" alt="Paradoxe" class="tab-logo">
                                Paradoxe
                            </button>
                        </div>
                    `;
                }
                this.enhancedSections = null;
                this.currentActiveTab = 'paradoxe';
                // Use normal streaming markdown rendering
                // 파서가 없거나 컨테이너가 변경되었으면 새로 생성
                if (!this.smdParser || this.smdContainer !== responseContainer) {
                    this.smdContainer = responseContainer;
                    this.smdContainer.innerHTML = '';
                    
                    // smd.js의 default_renderer 사용
                    const renderer = default_renderer(this.smdContainer);
                    this.smdParser = parser(renderer);
                    this.lastProcessedLength = 0;
                }

                // 새로운 텍스트만 처리 (스트리밍 최적화)
                const newText = currentText.slice(this.lastProcessedLength);
                
                if (newText.length > 0) {
                    // 새로운 텍스트 청크를 파서에 전달
                    parser_write(this.smdParser, newText);
                    this.lastProcessedLength = currentText.length;
                }

                // 스트리밍이 완료되면 파서 종료
                if (!this.isStreaming && !this.isLoading) {
                    parser_end(this.smdParser);
                }
            }

            // 코드 하이라이팅 적용
            if (this.hljs) {
                responseContainer.querySelectorAll('pre code').forEach(block => {
                    if (!block.hasAttribute('data-highlighted')) {
                        this.hljs.highlightElement(block);
                        block.setAttribute('data-highlighted', 'true');
                    }
                });
            }

            // Add link click handlers for simple navigation with stronger interception
            responseContainer.querySelectorAll('a').forEach(link => {
                if (!link.hasAttribute('data-nav-handled')) {
                    // Keep the href for styling but prevent default navigation with click handler
                    const originalHref = link.href;
                    
                    // Store original URL as data attribute
                    link.setAttribute('data-original-href', originalHref);
                    
                    // Add click handler
                    link.addEventListener('click', (event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        console.log('[AskView] Link intercepted:', originalHref);
                        
                        // Call handleLinkClick with the event
                        this.handleLinkClick(event);
                    });
                    
                    link.setAttribute('data-nav-handled', 'true');
                    console.log('[AskView] Link handler attached to:', originalHref);
                }
            });

            // 스크롤을 맨 아래로
            responseContainer.scrollTop = responseContainer.scrollHeight;
            
        } catch (error) {
            console.error('Error rendering streaming markdown:', error);
            // 에러 발생 시 기본 텍스트 렌더링으로 폴백
            this.renderFallbackContent(responseContainer);
        }
    }

    renderFallbackContent(responseContainer) {
        let textToRender = this.currentResponse || '';
        
        // No loading indicator needed
        
        if (this.isLibrariesLoaded && this.marked && this.DOMPurify) {
            try {
                // 마크다운 파싱
                const parsedHtml = this.marked.parse(textToRender);

                // DOMPurify로 정제
                let cleanHtml = this.DOMPurify.sanitize(parsedHtml, {
                    ALLOWED_TAGS: [
                        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'b', 'em', 'i',
                        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'a', 'img', 'table', 'thead',
                        'tbody', 'tr', 'th', 'td', 'hr', 'sup', 'sub', 'del', 'ins', 'div', 'span',
                    ],
                    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel', 'style'],
                    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp|file):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
                });

                // No loading processing needed

                responseContainer.innerHTML = cleanHtml;

                // CSS handles the loading animation automatically

                // 코드 하이라이팅 적용
                if (this.hljs) {
                    responseContainer.querySelectorAll('pre code').forEach(block => {
                        this.hljs.highlightElement(block);
                    });
                }
            } catch (error) {
                console.error('Error in fallback rendering:', error);
                responseContainer.textContent = textToRender;
            }
        } else {
            // 라이브러리가 로드되지 않았을 때 기본 렌더링
            let processedText = textToRender;
            
            // Normal text processing with HTML escaping
            const basicHtml = processedText
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`([^`]+)`/g, '<code>$1</code>');

            responseContainer.innerHTML = `<p>${basicHtml}</p>`;
        }
    }


    requestWindowResize(targetWidth, targetHeight) {
        if (window.api) {
            if (targetHeight && !targetWidth) {
                // Backward compatibility: if only height provided, use adjustWindowHeight
                window.api.askView.adjustWindowHeight("ask", targetHeight);
            } else if (targetWidth && targetHeight) {
                // Use new adjustWindowSize for both width and height
                window.api.askView.adjustWindowSize("ask", targetWidth, targetHeight);
            }
        }
    }

    animateHeaderText(text) {
        this.headerAnimating = true;
        this.requestUpdate();

        setTimeout(() => {
            this.headerText = text;
            this.headerAnimating = false;
            this.requestUpdate();
        }, 150);
    }

    startHeaderAnimation() {
        this.animateHeaderText('analyzing screen...');

        if (this.headerAnimationTimeout) {
            clearTimeout(this.headerAnimationTimeout);
        }

        this.headerAnimationTimeout = setTimeout(() => {
            this.animateHeaderText('thinking...');
        }, 1500);
    }

    renderMarkdown(content) {
        if (!content) return '';

        if (this.isLibrariesLoaded && this.marked) {
            return this.parseMarkdown(content);
        }

        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }

    fixIncompleteMarkdown(text) {
        if (!text) return text;

        // 불완전한 볼드체 처리
        const boldCount = (text.match(/\*\*/g) || []).length;
        if (boldCount % 2 === 1) {
            text += '**';
        }

        // 불완전한 이탤릭체 처리
        const italicCount = (text.match(/(?<!\*)\*(?!\*)/g) || []).length;
        if (italicCount % 2 === 1) {
            text += '*';
        }

        // 불완전한 인라인 코드 처리
        const inlineCodeCount = (text.match(/`/g) || []).length;
        if (inlineCodeCount % 2 === 1) {
            text += '`';
        }

        // 불완전한 링크 처리
        const openBrackets = (text.match(/\[/g) || []).length;
        const closeBrackets = (text.match(/\]/g) || []).length;
        if (openBrackets > closeBrackets) {
            text += ']';
        }

        const openParens = (text.match(/\]\(/g) || []).length;
        const closeParens = (text.match(/\)\s*$/g) || []).length;
        if (openParens > closeParens && text.endsWith('(')) {
            text += ')';
        }

        return text;
    }


    async handleCopy() {
        if (this.copyState === 'copied') return;

        let responseToCopy = this.currentResponse;

        if (this.isDOMPurifyLoaded && this.DOMPurify) {
            const testHtml = this.renderMarkdown(responseToCopy);
            const sanitized = this.DOMPurify.sanitize(testHtml);

            if (this.DOMPurify.removed && this.DOMPurify.removed.length > 0) {
                console.warn('Unsafe content detected, copy blocked');
                return;
            }
        }

        const textToCopy = `Question: ${this.currentQuestion}\n\nAnswer: ${responseToCopy}`;

        try {
            await navigator.clipboard.writeText(textToCopy);
            console.log('Content copied to clipboard');

            this.copyState = 'copied';
            this.requestUpdate();

            if (this.copyTimeout) {
                clearTimeout(this.copyTimeout);
            }

            this.copyTimeout = setTimeout(() => {
                this.copyState = 'idle';
                this.requestUpdate();
            }, 1500);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    async handleLineCopy(lineIndex) {
        const originalLines = this.currentResponse.split('\n');
        const lineToCopy = originalLines[lineIndex];

        if (!lineToCopy) return;

        try {
            await navigator.clipboard.writeText(lineToCopy);
            console.log('Line copied to clipboard');

            // '복사됨' 상태로 UI 즉시 업데이트
            this.lineCopyState = { ...this.lineCopyState, [lineIndex]: true };
            this.requestUpdate(); // LitElement에 UI 업데이트 요청

            // 기존 타임아웃이 있다면 초기화
            if (this.lineCopyTimeouts && this.lineCopyTimeouts[lineIndex]) {
                clearTimeout(this.lineCopyTimeouts[lineIndex]);
            }

            // ✨ 수정된 타임아웃: 1.5초 후 '복사됨' 상태 해제
            this.lineCopyTimeouts[lineIndex] = setTimeout(() => {
                const updatedState = { ...this.lineCopyState };
                delete updatedState[lineIndex];
                this.lineCopyState = updatedState;
                this.requestUpdate(); // UI 업데이트 요청
            }, 1500);
        } catch (err) {
            console.error('Failed to copy line:', err);
        }
    }

    async handleSendText(e, overridingText = '') {
        const textInput = this.shadowRoot?.getElementById('textInput');
        const text = (overridingText || textInput?.value || '').trim();
        // if (!text) return;

        textInput.value = '';

        if (window.api) {
            window.api.askView.sendMessage(text).catch(error => {
                console.error('Error sending text:', error);
            });
        }
    }

    handleTextKeydown(e) {
        // Fix for IME composition issue: Ignore Enter key presses while composing.
        if (e.isComposing) {
            return;
        }

        const isPlainEnter = e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey;
        const isModifierEnter = e.key === 'Enter' && (e.metaKey || e.ctrlKey);

        if (isPlainEnter || isModifierEnter) {
            e.preventDefault();
            this.handleSendText();
        }
    }

    updated(changedProperties) {
        super.updated(changedProperties);
    
        // ✨ isLoading 또는 currentResponse가 변경될 때마다 뷰를 다시 그립니다.
        if (changedProperties.has('isLoading') || changedProperties.has('currentResponse') || 
            changedProperties.has('isNavigatingExternal') || changedProperties.has('externalContent')) {
            this.renderContent();
        }
    
        if (changedProperties.has('showTextInput') || changedProperties.has('isLoading') || changedProperties.has('currentResponse')) {
            this.adjustWindowHeightThrottled();
        }
    
        if (changedProperties.has('showTextInput') && this.showTextInput) {
            this.focusTextInput();
        }
    }

    firstUpdated() {
        setTimeout(() => this.adjustWindowHeight(), 200);
    }


    getTruncatedQuestion(question, maxLength = 30) {
        if (!question) return '';
        if (question.length <= maxLength) return question;
        return question.substring(0, maxLength) + '...';
    }



    render() {
        const hasResponse = this.isLoading || this.currentResponse || this.isStreaming;
        const headerText = this.isLoading ? 'Thinking...' : 'AI Response';

        return html`
            <!-- Mini Browser Interface -->
            ${this.isNavigatingExternal && this.browserTabs.length > 0 ? html`
                <div class="mini-browser">
                    <div class="browser-header">
                        <button class="browser-back-button" @click=${this.handleBackToResponse}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="m12 19-7-7 7-7"/>
                                <path d="m19 12H5"/>
                            </svg>
                            Back to Chat
                        </button>
                        
                        <div class="browser-tabs">
                            ${this.browserTabs.map((tab, index) => html`
                                <button class="browser-tab ${tab.active ? 'active' : ''}" @click=${() => this.switchToTab(index)}>
                                    <span>${tab.title}</span>
                                    <button class="tab-close" @click=${(e) => this.closeTab(index, e)}>×</button>
                                </button>
                            `)}
                            <button class="browser-new-tab" @click=${this.createNewTab}>+</button>
                        </div>
                    </div>
                    
                    <webview 
                        class="browser-content" 
                        src="${this.browserTabs[this.activeTabIndex]?.url || 'about:blank'}"
                        webpreferences="contextIsolation=false"
                        allowpopups
                    ></webview>
                </div>
            ` : ''}

            <div class="ask-container">
                <!-- Response Header -->
                <div class="response-header ${!hasResponse ? 'hidden' : ''}">
                    <div class="header-left">
                        ${this.isNavigatingExternal && this.browserTabs.length === 0 ? html`
                            <button class="back-button" @click=${this.handleBackToResponse}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="m12 19-7-7 7-7"/>
                                    <path d="m19 12H5"/>
                                </svg>
                                Back to Chat
                            </button>
                        ` : html`
                            <!-- Enhanced Response Tabs in Header -->
                            <div id="tabsContainer">
                                <!-- Tabs will be dynamically inserted here -->
                            </div>
                        `}
                    </div>
                    <div class="header-right">
                        <span class="question-text">${this.getTruncatedQuestion(this.currentQuestion)}</span>
                        <div class="header-controls">
                            ${!this.isNavigatingExternal && this.browserTabs.length > 0 ? html`
                                <button class="back-button" @click=${this.handleBackToBrowser}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                                        <line x1="8" y1="21" x2="16" y2="21"/>
                                        <line x1="12" y1="17" x2="12" y2="21"/>
                                    </svg>
                                    Back to Browser
                                </button>
                            ` : ''}
                            <button class="copy-button ${this.copyState === 'copied' ? 'copied' : ''}" @click=${this.handleCopy}>
                                <svg class="copy-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                </svg>
                                <svg
                                    class="check-icon"
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    stroke-width="2.5"
                                >
                                    <path d="M20 6L9 17l-5-5" />
                                </svg>
                            </button>
                            <button class="close-button" @click=${this.handleCloseAskWindow}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Response Container -->
                <div class="response-container ${!hasResponse || this.isNavigatingExternal ? 'hidden' : ''}" id="responseContainer">
                    <!-- Content is dynamically generated in updateResponseContent() -->
                </div>

                <!-- Text Input Container -->
                <div class="text-input-container ${!hasResponse ? 'no-response' : ''} ${!this.showTextInput || this.isNavigatingExternal ? 'hidden' : ''}">
                    <input
                        type="text"
                        id="textInput"
                        placeholder="Ask about your screen or audio"
                        @keydown=${this.handleTextKeydown}
                        @focus=${this.handleInputFocus}
                    />
                    <button
                        class="submit-btn"
                        @click=${this.handleSendText}
                    >
                        <span class="btn-label">Submit</span>
                        <span class="btn-icon">
                            ↵
                        </span>
                    </button>
                </div>
            </div>
        `;
    }

    // Dynamically resize the BrowserWindow to fit current content
    adjustWindowHeight() {
        if (!window.api) return;

        this.updateComplete.then(() => {
            // If mini browser is active, use larger width and height for better browser experience
            if (this.isNavigatingExternal && this.browserTabs.length > 0) {
                console.log('[AskView] Mini browser active - using fixed size: 900x700');
                window.api.askView.adjustWindowSize("ask", 900, 700);
                return;
            }

            // For chat mode, calculate content-based height and use normal width
            const headerEl = this.shadowRoot.querySelector('.response-header');
            const responseEl = this.shadowRoot.querySelector('.response-container');
            const inputEl = this.shadowRoot.querySelector('.text-input-container');

            if (!headerEl || !responseEl) return;

            // Use fixed 500px height for consistent scrolling experience
            const targetHeight = 500;

            // In chat mode, use fixed dimensions: 600x500
            console.log('[AskView] Chat mode - using fixed dimensions: 600x500');
            window.api.askView.adjustWindowSize("ask", 600, targetHeight);

        }).catch(err => console.error('AskView adjustWindowHeight error:', err));
    }

    // Throttled wrapper to avoid excessive IPC spam (executes at most once per animation frame)
    adjustWindowHeightThrottled() {
        if (this.isThrottled) return;

        this.isThrottled = true;
        requestAnimationFrame(() => {
            this.adjustWindowHeight();
            this.isThrottled = false;
        });
    }

    // Handle link clicks for internal mini browser
    handleLinkClick(event) {
        console.log('[AskView] Link clicked:', event.target);
        event.preventDefault();
        event.stopPropagation();
        
        const link = event.target.closest('a');
        if (!link || !link.href) {
            console.log('[AskView] No valid link found');
            return;
        }
        
        console.log('[AskView] Opening link in mini browser:', link.href);
        
        // Store original content
        if (!this.isNavigatingExternal) {
            this.originalContent = this.currentResponse;
        }
        
        // Create or add tab
        this.openInMiniBrowser(link.href, this.getTabTitle(link.href));
    }

    // Show link notification
    showLinkNotification(message) {
        // Create a temporary notification element
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
            opacity: 0;
            transition: opacity 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
        });
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Extract a nice title from URL
    getTabTitle(url) {
        try {
            const urlObj = new URL(url);
            const domain = urlObj.hostname.replace('www.', '');
            const path = urlObj.pathname;
            
            if (domain === 'en.wikipedia.org') {
                const article = path.split('/wiki/')[1];
                return article ? decodeURIComponent(article.replace(/_/g, ' ')) : 'Wikipedia';
            } else if (domain === 'reddit.com') {
                if (path.includes('/r/')) {
                    return path.split('/')[2] ? `r/${path.split('/')[2]}` : 'Reddit';
                }
                return 'Reddit';
            } else {
                return domain.charAt(0).toUpperCase() + domain.slice(1);
            }
        } catch {
            return 'Website';
        }
    }

    // Open URL in mini browser
    openInMiniBrowser(url, title) {
        // Add new tab
        const newTab = {
            id: Date.now(),
            title: title,
            url: url,
            active: true
        };
        
        // Set all other tabs to inactive
        this.browserTabs = this.browserTabs.map(tab => ({ ...tab, active: false }));
        
        // Add new tab
        this.browserTabs = [...this.browserTabs, newTab];
        this.activeTabIndex = this.browserTabs.length - 1;
        
        // Set navigation state
        this.isNavigatingExternal = true;
        
        // Let mini browser use automatic window sizing like AI responses
        console.log('[AskView] Opening mini browser - requesting window resize');
        
        this.requestUpdate();
        
        // After DOM updates, explicitly resize window to accommodate mini browser
        this.updateComplete.then(() => {
            // Mini browser needs wider window: 900x700 for optimal browsing experience
            console.log('[AskView] Requesting window resize for mini browser content: 900x700, centered');
            this.requestWindowResize(900, 700, true); // Center for browser
        });
    }

    // Switch to a tab
    switchToTab(index) {
        this.browserTabs = this.browserTabs.map((tab, i) => ({
            ...tab,
            active: i === index
        }));
        this.activeTabIndex = index;
        this.requestUpdate();
    }

    // Close a tab
    closeTab(index, event) {
        event.stopPropagation();
        
        this.browserTabs = this.browserTabs.filter((_, i) => i !== index);
        
        if (this.browserTabs.length === 0) {
            // No tabs left, return to chat and resize to normal dimensions
            this.isNavigatingExternal = false;
            if (this.originalContent) {
                this.currentResponse = this.originalContent;
                this.originalContent = null;
            }
            console.log('[AskView] All tabs closed - returning to chat mode with normal dimensions');
            this.adjustWindowHeightThrottled();
            this.requestUpdate();
            return;
        }
        
        // Adjust active tab index if needed
        if (index <= this.activeTabIndex) {
            this.activeTabIndex = Math.max(0, this.activeTabIndex - 1);
        }
        
        // Set the new active tab
        this.browserTabs = this.browserTabs.map((tab, i) => ({
            ...tab,
            active: i === this.activeTabIndex
        }));
        
        this.requestUpdate();
    }

    // Create new tab
    createNewTab() {
        this.openInMiniBrowser('https://www.google.com', 'Google');
    }

    // Handle back to response
    handleBackToResponse() {
        this.isNavigatingExternal = false;
        // Keep browser tabs available for "Back to Browser" button
        // this.browserTabs = []; // Don't clear tabs
        // this.activeTabIndex = 0;
        if (this.originalContent) {
            this.currentResponse = this.originalContent;
            this.originalContent = null;
        }
        
        // Resize window back to normal chat size
        console.log('[AskView] Returning to chat - resizing to normal dimensions');
        this.adjustWindowHeightThrottled();
        
        this.requestUpdate();
    }

    // Handle back to browser
    handleBackToBrowser() {
        if (this.browserTabs.length > 0) {
            this.isNavigatingExternal = true;
            
            // Resize window back to browser size
            this.updateComplete.then(() => {
                console.log('[AskView] Returning to browser - resizing window: 900x700, centered');
                this.requestWindowResize(900, 700, true); // Center for browser
            });
            
            this.requestUpdate();
        }
    }


}

customElements.define('ask-view', AskView);
