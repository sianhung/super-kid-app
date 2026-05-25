# Task Board - Super Kid PWA Premium Animations & UI Overhaul

## Active Tasks
- `[x]` **Step 1: Setup Workspace & Integrate GSAP**
  - Link GSAP CDN core library in `index.html`
  - Add cosmic cyber-grid scanline overlays and particle backdrop markup
- `[x]` **Step 2: Smooth Screen Slide transitions (`app.js` & `styles.css`)**
  - Upgrade `navigateTo()` to animate screen swapping with elastic GSAP transitions
  - Build staggered entry animations for active screen cards and list elements
- `[x]` **Step 3: Horizontal Carousel Episode Guide (`index.html`, `styles.css`, `app.js`)**
  - Convert dashboard listing container into a fluid horizontal-scrolling card track
  - Add left/right floating arrow buttons and touch progress scrollbar
  - Add 3D card perspective tilt animations and visual glowing locks
- `[x]` **Step 4: Star Coin Burst Physics (`app.js` & `styles.css`)**
  - Build a custom canvas particle system to burst stars (`⭐`) under the user's cursor
  - Program bezier-curve trajectory paths tracking directly into the header points bar coordinates
  - Program scaling spring-bounce reactions on the coins box when star particles land
- `[x]` **Step 5: E2E Verification & Live Surge Deployment**
  - Run automated Puppeteer browser assertions in landscape formats
  - Push the updated PWA code live to `https://sianhung-superkid.surge.sh`
