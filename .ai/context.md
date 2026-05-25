# 🤖 AI Handover & Project Context Resume

Welcome, AI Coding Assistant (Claude Code, Cursor, or standard Claude)! 

This project is the **Super Kid Adventures** Progressive Web App (PWA) — a gorgeous, high-fidelity Bible adventures app featuring a neon, cyber-glowing kid dashboard and a secure Admin Mainframe Decryption Portal for parents and teachers.

Use this file to instantly understand what has been built, how the latest critical bugs were resolved, and where to resume work seamlessly.

---

## 🚀 Active Project Status

* **Live Web App / PWA**: **[https://sianhung-superkid.surge.sh](https://sianhung-superkid.surge.sh)**
* **GitHub Repository**: **[https://github.com/sianhung/super-kid-app](https://github.com/sianhung/super-kid-app)**
* **Local Workspace**: `/Users/Richard/.gemini/antigravity/scratch/super-kid-app/`

---

## 🔒 Security Credentials (For testing Admin functions)
* **Parent & Teacher Portal**: Accessed via the **⚙️ Settings** tab in the top-right header -> **Parent & Teacher Portal**.
* **Decryption Credentials**:
  * **Username**: `admin`
  * **Password**: `admin123`

---

## 🛠️ Key Architectural Implementations

1. **Progressive Web App (PWA)**:
   * [manifest.json](file:///Users/Richard/.gemini/antigravity/scratch/super-kid-app/manifest.json) declares the circular Gizmo Robot mascot app icon, theme colors, and standalone viewport orientation.
   * [sw.js](file:///Users/Richard/.gemini/antigravity/scratch/super-kid-app/sw.js) registers an offline-first caching policy, storing all core code and graphics for immediate load times.
2. **Dynamic Admin Mainframe**:
   * Full dynamic form processing (adding episodes, contests, quizzes) with immediate local saving to `localStorage`.
   * **Dual Image Uploader**: Allows uploading via custom URL links or direct Local Image Files (automatically parsed as base64 strings).
   * **Sci-Fi Edit Modal**: A gorgeous, blur-backdrop modal for editing existing episodes and contests dynamically.
   * **Pending Submissions Ledger**: Parent/Teacher review portal with Confetti approval payouts (`+200 pts` to the kid's coin total).

---

## ⚙️ Latest Critical Playback Fixes (Completed)

We recently resolved two critical timing and DOM-selection bugs related to the YouTube Iframe Player API that prevented video playback in standalone PWA wrappers:

1. **Asynchronous ready queue race condition**:
   * *Problem*: The original code called `new YT.Player` immediately after downloading the YouTube script tag, throwing a silent javascript error because `window.YT` was undefined.
   * *Fix*: Implemented an async queue (`ytPlayerPendingEpisode`). If the YouTube API isn't fully ready yet, the app queues the episode and mounts it automatically the exact millisecond `onYouTubeIframeAPIReady` fires.
2. **DOM selector deletion on navigate**:
   * *Problem*: Calling `player.destroy()` when closing the video screen stripped the placeholder `<div id="youtube-player">` out of the DOM on many mobile devices, breaking subsequent playback clicks.
   * *Fix*: Added dynamic DOM placeholder reconstruction (`createYoutubePlayer`) to remove any stale elements and recreate a fresh placeholder div inside the wrapper before loading a new video.
3. **Tap-to-Play interaction overlay**:
   * *Problem*: The transparent `.timeline-interaction-blocker` placed over the iframe to prevent scrubbing was blocking all click/tap events, preventing users from un-pausing autoplay-blocked videos.
   * *Fix*: Added a click listener directly to the blocker. Tapping the video screen now successfully toggles Play/Pause naturally!

---

## 🧪 E2E Verification & Proof

An automated end-to-end browser test was executed using Puppeteer, setting a landscape layout, clicking Episode 1, and successfully verifying that the player iframe loaded, mounted, and played without errors (100% Pass).

* **E2E Visual Screenshot Proof**: Located at [test_screenshot.png](file:///Users/Richard/.gemini/antigravity/scratch/super-kid-app/.ai/test_screenshot.png) in this directory.

---

## 📈 Next Steps for Future Development
If the user requests new features or improvements:
1. **Adding Default Content**: You can hardcode new episodes, contests, or quizzes by editing the `MOCK_EPISODES` or `MOCK_CONTESTS` arrays at the very top of `app.js`.
2. **Offline Mode Expansion**: Update `sw.js` asset list if you add new static graphics or audio files.
3. **Database Integration**: The project currently has a simulated fallback db (`localStorage`). If the client wants to transition to a true database, you can integrate standard REST endpoints (Node/Postgres) by reading `db_init.sql` at the root!
