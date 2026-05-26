# 🎨 Super Kid Bible Adventures App

Welcome to **Super Kid Adventures**, a bright, responsive, and delightful Bible-learning web application inspired by the vibrant style of **Superbook**! The app is designed to engage children in Bible stories through episodes, sequential trivia quizzes, and drawing contests, while providing parents and teachers with a complete secure control panel.

This app is fully optimized as a **Progressive Web App (PWA)**, meaning you or your client can install it natively on any iOS or Android phone with its own custom desktop icon, splash screen, and full-screen layout.

---

## 🚀 Key Features

### 🧒 For Kids & Students:
- **🎬 Multimedia Adventure Hub**: Watch Bible story videos with a fully working YouTube player.
- **🧠 Sequential Trivia Quizzes**: Interactive quizzes unlocked step-by-step. Get answers right to earn **SuperPoints**!
- **🛍️ Gizmo's Upgrade Shop**: Use earned points to purchase cool accessories like *Cyber Tactical Visors*, *Plasma Thruster Jetpacks*, or a *Royal Crown*.
- **🎭 Dynamic Mascot Dressing Room**: Customize the Gizmo mascot avatar with purchased items and watch him wear them in real-time across the app!
- **🏆 Creative Contests**: Submit drawings and written responses for active contests (like the *Space Drawing Contest*) to win massive point payouts.

### 🔒 For Parents & Teachers (Admin Mainframe):
- **🛡️ Secure Decryption Portal**: High-tech locking screen requiring secret mainframe keys. Toggles password eye-visibility and wiggles aggressively if credentials fail.
- **📦 Content Upload Engine**: Add new video episodes, customized questions, or exciting new contests with ease.
- **🖼️ Dual Thumbnail Picker**: Gives creators two options when adding or editing thumbnails:
  1. **🔗 Image Link**: Paste a custom URL or click one of our preset artwork buttons (e.g. *Bubble Planet*, *Gizmo*, *Crown*).
  2. **📸 Upload Photo**: Choose any local photo from a computer or phone, see a live preview instantly, and save it directly.
- **🔧 Edit Uploads Ledger**: View, modify, or delete uploaded episodes and contests in highly polished management tables.
- **📋 Submissions Reviewer**: Review kids' drawings. Approve them to burst screen-wide victory confetti and pay out points to the user instantly!

---

## 🔒 Mainframe Credentials
To access parent/teacher features:
1. Tap the **⚙️ Settings** icon in the top header.
2. Tap the **Parent & Teacher Portal** card.
3. Log in with:
   - **Username**: `admin`
   - **Decryption Key**: `admin123`

---

## 📱 Mobile Phone PWA Installation Guide

Because the app is PWA-compliant, it installs instantly onto physical phones without requiring App Store or Google Play Store downloads:

### 🍏 On iOS (iPhone / iPad):
1. Open the hosted website URL in the native **Safari** browser.
2. Tap the **Share** button (the square icon with an arrow pointing up).
3. Scroll down and tap **Add to Home Screen** (➕).
4. Tap **Add** in the top-right corner.
5. The **Super Kid** mascot icon will appear on your home screen! Tap it to launch the app in a full-screen, native orientation.

### 🤖 On Android (Chrome / Samsung Internet):
1. Open the hosted website URL in the **Google Chrome** browser.
2. Tap the **three vertical dots** in the top-right corner to open the menu.
3. Tap **Install App** or **Add to Home Screen**.
4. Follow the prompt to complete the installation.
5. Launch the app from your home screen for the full, immersive, distraction-free adventure!

---

## 💻 Free Hosting via GitHub Pages

This app is built using zero-dependency, serverless web technologies (`HTML5`, `Vanilla CSS3`, `Javascript ES6`, and `localStorage` for offline-first data persistence). This makes it perfectly compatible with **free, high-performance hosting** via **GitHub Pages**.

### Deploy in 3 Simple Steps:
1. Create a repository on GitHub (e.g., named `super-kid-app`).
2. Open your terminal in this directory and push the repository:
   ```bash
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/super-kid-app.git
   git branch -M main
   git push -u origin main
   ```
3. On GitHub, navigate to your repository's **Settings > Pages**:
   - Under **Build and deployment**, select **Deploy from a branch**.
   - Under **Branch**, choose `main` and `/ (root)`.
   - Click **Save**.

Your live URL will be ready in seconds at `https://YOUR_GITHUB_USERNAME.github.io/super-kid-app/`! Share this link with your client or load it on your phone to install it.

---

## 🤖 Native Android Build (Capacitor/WebView Wrapper)

In addition to PWA compliance, this repository includes a fully configured native Android build environment inside the `android/` directory. This allows you to compile the website into a standalone, signed, release-ready Android `.apk` file that runs in forced landscape mode with an immersive edge-to-edge layout.

The pre-compiled, signed APK is located at:
* [android/superkid.apk](file:///Users/Richard/.gemini/antigravity-ide/scratch/super-kid-app/android/superkid.apk)

### Build Environment Prerequisites
To rebuild the Android package locally, ensure you have:
1. **Java 17 (JDK 17)**: Set your `JAVA_HOME`.
2. **Android SDK**: Install API level 33/34 and platform-tools. Expose `ANDROID_HOME` in your environment.

Example shell exports:
```bash
export JAVA_HOME="/Users/Richard/jdk17/Contents/Home"
export ANDROID_HOME="/Users/Richard/android-sdk"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"
```

### How to Compile the APK
Navigate to the `android/` folder and run the `make.sh` build script:
```bash
cd android
./make.sh build superkid.conf
```
The script will automatically:
- Apply all configuration parameters from `superkid.conf` (pointing to the live Surge URL).
- Set package naming to `com.superkid.webtoapk`.
- Lock orientation to **Landscape mode** for an optimal kid-friendly interface.
- Enable full immersive **Edge-to-Edge display** support.
- Set deep link integration for `sianhung-superkid.surge.sh`.
- Compile and sign the APK in release mode with standard signing keys.

