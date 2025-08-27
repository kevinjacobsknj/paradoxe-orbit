<p align="center">
  <a href="https://paradoxe.com/orbit">
   <img src="./orbit/public/assets/banner.gif" alt="Paradoxe - Orbit Logo">
  </a>

  <h1 align="center">Paradoxe - Orbit: Digital Mind Extension 🧠</h1>

</p>

<p align="center">
  <a href="https://discord.gg/UCZH5B5Hpd"><img src="./orbit/public/assets/button_dc.png" width="80" alt="Paradoxe Discord"></a>&ensp;<a href="https://paradoxe.com"><img src="./orbit/public/assets/button_we.png" width="105" alt="Paradoxe Website"></a>&ensp;<a href="https://x.com/intent/user?screen_name=leinadpark"><img src="./orbit/public/assets/button_xe.png" width="109" alt="Follow Daniel"></a>
</p>

> This project is a fork of [CheatingDaddy](https://github.com/sohzm/cheating-daddy) with modifications and enhancements. Thanks to [Soham](https://x.com/soham_btw) and all the open-source contributors who made this possible!

🤖 **Fast, light & open-source**—Paradoxe Orbit lives on your desktop, sees what you see, listens in real time, understands your context, and turns every moment into structured knowledge.

💬 **Proactive in meetings**—it surfaces action items, summaries, and answers the instant you need them.

🫥️ **Truly invisible**—never shows up in screen recordings, screenshots, or your dock; no always-on capture or hidden sharing.

To have fun building with us, join our [Discord](https://discord.gg/UCZH5B5Hpd)!

## Instant Launch

⚡️  Skip the setup—launch instantly with our ready-to-run macOS app.  [[Download Here]](https://www.dropbox.com/scl/fi/znid09apxiwtwvxer6oc9/ParadoxeOrbit_latest.dmg?rlkey=gwvvyb3bizkl25frhs4k1zwds&st=37q31b4w&dl=1)

## Quick Start (Local Build)

### Prerequisites

First download & install [Python](https://www.python.org/downloads/) and [Node](https://nodejs.org/en/download).
If you are using Windows, you need to also install [Build Tools for Visual Studio](https://visualstudio.microsoft.com/downloads/)

Ensure you're using Node.js version 20.x.x to avoid build errors with native dependencies.

```bash
# Check your Node.js version
node --version

# If you need to install Node.js 20.x.x, we recommend using nvm:
# curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
# nvm install 20
# nvm use 20
```

### Installation

Navigate to the orbit directory and run setup:

```bash
cd orbit
npm run setup
```

### Environment Configuration

Paradoxe Orbit uses environment variables for secure API key management and customizable configuration. Follow these steps to set up your environment:

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Configure required API keys in `.env`:**
   ```bash
   # Required for push-to-talk speech-to-text functionality
   DEEPGRAM_API_KEY=your_deepgram_api_key_here
   ```

3. **Optional configurations:**
   ```bash
   # Customize server ports and URLs
   PARADOXE_ORBIT_API_URL=http://localhost:9001
   PARADOXE_ORBIT_WEB_URL=http://localhost:3000
   
   # Agent daemon settings
   AGENT_DAEMON_URL=http://localhost:4823
   AGENT_HEALTH_TIMEOUT=2000
   AGENT_TASK_TIMEOUT=10000
   
   # Development/Production settings
   NODE_ENV=development
   PARADOXE_ORBIT_DEBUG=true
   PARADOXE_ORBIT_LOG_LEVEL=info
   ```

4. **Get your Deepgram API key:**
   - Sign up at [Deepgram Console](https://console.deepgram.com/)
   - Create a new API key
   - Add it to your `.env` file

5. **For macOS app notarization (optional, for distribution builds):**
   ```bash
   APPLE_ID=your_apple_developer_email
   APPLE_ID_PASSWORD=your_app_specific_password
   APPLE_TEAM_ID=your_apple_team_id
   ```

**Security Note:** Never commit your `.env` file to version control. The `.env.example` file serves as a template with safe placeholder values.

## Project Structure

This repository contains two main components:

### 🖥️ Orbit Desktop App (`/orbit/`)
The main Electron-based desktop application that provides:
- Real-time screen and audio capture
- AI-powered context understanding
- Meeting transcription and summarization
- Invisible overlay interface
- Multi-platform support (macOS, Windows, Linux)

### 🤖 Agent Daemon (`/agent-daemon/`)
A Python-based service that provides:
- Browser automation capabilities
- WebSocket communication with the desktop app
- AI agent task execution
- RESTful API endpoints

## Highlights

### Ask: get answers based on all your previous screen actions & audio

<img width="100%" alt="booking-screen" src="./orbit/public/assets/00.gif">

### Meetings: real-time meeting notes, live summaries, session records

<img width="100%" alt="booking-screen" src="./orbit/public/assets/01.gif">

### Use your own API key, or sign up to use ours (free)

<img width="100%" alt="booking-screen" src="./orbit/public/assets/02.gif">

**Currently Supporting:**
- OpenAI API: Get OpenAI API Key [here](https://platform.openai.com/api-keys)
- Gemini API: Get Gemini API Key [here](https://aistudio.google.com/apikey)
- Local LLM Ollama & Whisper

### Liquid Glass Design (coming soon)

<img width="100%" alt="booking-screen" src="./orbit/public/assets/03.gif">

<p>
  for a more detailed guide, please refer to this <a href="https://www.youtube.com/watch?v=qHg3_4bU1Dw">video.</a>
  <i style="color:gray; font-weight:300;">
    we don't waste money on fancy vids; we just code.
  </i>
</p>

## Keyboard Shortcuts

`Ctrl/Cmd + \` : show and hide main window

`Ctrl/Cmd + Enter` : ask AI using all your previous screen and audio

`Ctrl/Cmd + Arrows` : move main window position

## Development

### Running the Desktop App

```bash
cd orbit
npm start
```

### Running the Agent Daemon

```bash
cd agent-daemon
pip install -r requirements.txt
python simple_server.py
```

The agent daemon will be available at `http://localhost:4823` and provides WebSocket support for real-time communication with the desktop app.

## Repo Activity

![Alt](https://repobeats.axiom.co/api/embed/a23e342faafa84fa8797fa57762885d82fac1180.svg "Repobeats analytics image")

## Contributing

We love contributions! Feel free to open issues for bugs or feature requests. For detailed guide, please see our [contributing guide](/CONTRIBUTING.md).
> Currently, we're working on a full code refactor and modularization. Once that's completed, we'll jump into addressing the major issues.

### Contributors

<a href="https://github.com/paradoxe-com/orbit/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=paradoxe-com/orbit" />
</a>

### Help Wanted Issues

We have a list of [help wanted](https://github.com/paradoxe-com/orbit/issues?q=is%3Aissue%20state%3Aopen%20label%3A%22%F0%9F%99%8B%E2%80%8D%E2%99%82%EF%B8%8Fhelp%20wanted%22) that contain small features and bugs which have a relatively limited scope. This is a great place to get started, gain experience, and get familiar with our contribution process.

### 🛠 Current Issues & Improvements

| Status | Issue                          | Description                                       |
|--------|--------------------------------|---------------------------------------------------|
| 🚧 WIP      | Liquid Glass                    | Liquid Glass UI for MacOS 26 |

### Changelog

- Jul 5: Now support Gemini, Intel Mac supported
- Jul 6: Full code refactoring has done.
- Jul 7: Now support Claude, LLM/STT model selection
- Jul 8: Now support Windows(beta), Improved AEC by Rust(to separate mic/system audio), shortcut editing(beta)
- Jul 8: Now support Local LLM & STT, Firebase Data Storage

## About Paradoxe

**Our mission is to build a living digital clone for everyone.** Paradoxe - Orbit is part of Step 1—a trusted pipeline that transforms your daily data into a scalable clone. Visit [paradoxe.com](https://paradoxe.com) to learn more.

## Star History
[![Star History Chart](https://api.star-history.com/svg?repos=paradoxe-com/orbit&type=Date)](https://www.star-history.com/#paradoxe-com/orbit&Date)