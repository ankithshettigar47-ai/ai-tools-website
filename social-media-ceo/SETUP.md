# 🚀 CEO Social Media AI Engine - Setup Guide

## Overview
This is a **real-time AI-powered social media automation system** that:
- Downloads YouTube videos and auto-crops them to 9:16 Shorts format
- Generates AI videos using Stable Video Diffusion
- Creates AI voiceovers using Microsoft Edge TTS
- Manages approval workflow for CEO review
- Simulates Instagram upload

---

## ⚡ Quick Start (Simulation Mode)

The app works **immediately in simulation mode** without any backend:

1. Open `index.html` with Live Server in VS Code
2. Use the Content Creation tab to generate simulated videos
3. Approve content in the Approval Queue

---

## 🔥 Enable Real AI Features

### Step 1: Install Python Dependencies

Open terminal in the project folder and run:

```bash
pip install fastapi uvicorn yt-dlp moviepy edge-tts replicate python-dotenv
```

**Also required (system-level):**
- **FFmpeg**: For video processing
  - Windows: Download from https://ffmpeg.org/download.html
  - Mac: `brew install ffmpeg`
  - Linux: `sudo apt install ffmpeg`

### Step 2: Configure API Keys (Optional but Recommended)

Create a `.env` file in the project root:

```env
REPLICATE_API_TOKEN=r8_your_replicate_token_here
```

Get your Replicate token from: https://replicate.com/account/api-tokens

**Note:** The app will work without this key but will simulate video generation.

### Step 3: Run the Backend Server

```bash
python server.py
```

You should see:
```
🚀 CEO AI Engine Starting on http://localhost:8000
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 4: Open the Frontend

1. Open `index.html` with Live Server (port 5500)
2. Go to **Content Creation** tab
3. Choose your mode:
   - ✅ **Use YouTube Source**: Paste any YouTube URL to auto-crop to Shorts
   - ⬜ **AI Generation**: Create fully AI-generated videos

---

## 🎯 Features

### YouTube to Shorts Converter
- Paste any YouTube URL
- Automatically downloads the video
- Crops to 9:16 vertical format (center-focused)
- Adds AI-generated voiceover
- Ready for Instagram Reels/TikTok

### Full AI Video Generation
- Uses Stable Video Diffusion via Replicate
- Generates video from text prompts
- Creates realistic AI voiceover with Edge TTS
- No copyright concerns

### Approval Workflow
1. Research department scans trends
2. Content department creates videos
3. CEO reviews in Approval Queue
4. One-click "Approve & Upload to Instagram"

---

## 📁 Project Structure

```
social-media-ceo/
├── index.html          # Main UI
├── css/
│   └── styles.css      # Styling
├── js/
│   ├── main.js         # App controller
│   ├── content.js      # AI integration logic
│   ├── research.js     # Trend scanning
│   ├── approval.js     # Approval queue
│   ├── analytics.js    # Stats tracking
│   └── storage.js      # LocalStorage manager
├── server.py           # FastAPI backend (AI engine)
├── output/             # Generated videos (auto-created)
└── README.md           # This file
```

---

## 🔧 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/create-content` | POST | Start video generation job |
| `/api/status/{job_id}` | GET | Check job status |
| `/api/download/{job_id}` | GET | Download completed video |

---

## 💡 Usage Tips

1. **For YouTube clipping**: Use short videos (< 5 min) for faster processing
2. **For AI generation**: Provide specific topics for better results
3. **Batch creation**: Use "Auto-Create Full Campaign" for 5 pieces at once
4. **Keyboard shortcuts**: Ctrl+1 to Ctrl+5 to switch tabs

---

## 🐛 Troubleshooting

### "Backend server not running" alert
- Make sure `python server.py` is running in a terminal
- Check that port 8000 is not blocked by firewall

### FFmpeg errors
- Verify FFmpeg is installed: `ffmpeg -version`
- Add FFmpeg to system PATH if needed

### CORS errors in browser
- The backend already allows all origins (*)
- Make sure both frontend (5500) and backend (8000) are running

---

## 🎬 Next Steps

1. **Add Instagram API**: Replace simulation with real Instagram Graph API
2. **Add more AI models**: Integrate DALL-E 3 for thumbnails, GPT-4 for scripts
3. **Multi-platform**: Extend to TikTok, YouTube Shorts, LinkedIn
4. **Database**: Replace LocalStorage with PostgreSQL/MongoDB

---

**Built for CEOs who want full automation!** 🚀
