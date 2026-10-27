# 🎂 Birthday Capsule — Interactive Web Template

> A Spotify Wrapped–inspired, mobile-first interactive birthday experience featuring personalized voice notes with real-time waveform visualizers, animated written messages, dynamic ambient themes, and a living botanical typography finale.

**Zero backend. Zero database. 100% static & free to host on GitHub Pages, Vercel, or Netlify.**

---

## 📋 Complete Setup Checklist

Follow this checklist to personalize every single aspect of the experience:

- [ ] **1. Person's Info**: Set name and tagline in `script.js` ([Step 1](#step-1--personalize-the-name--branding))
- [ ] **2. Web Metadata**: Update title and social share preview tags in `index.html` ([Step 1](#step-1--personalize-the-name--branding))
- [ ] **3. Opening Cover**: Replace `assets/images/cover_bg.webp` with a photo or wallpaper ([Step 2](#step-2--opening-cover-photo))
- [ ] **4. Voice Notes**: Drop `.mp3` voice recordings into `assets/audio/` ([Step 3](#step-3--prepare-voice-recordings))
- [ ] **5. Wishes & Stories**: Add friends' messages and audio in `data/messages.json` ([Step 4](#step-4--add-messages--stories))
- [ ] **6. Friend Avatars**: Add profile pictures into `assets/images/` or rely on monogram initials ([Step 4.4](#44-friend-avatars--monogram-badges))
- [ ] **7. Memory Photos**: Drop photos into `assets/collage/` and list in `script.js` ([Step 5](#step-5--memory-photo-collage))
- [ ] **8. Background Music**: Select songs for slides and the finale in `assets/music/` ([Step 6](#step-6--background-music--soundtrack))
- [ ] **9. Favicon**: Customize the browser tab icon in `favicon.svg` ([Step 7](#step-7--favicon--app-icon))
- [ ] **10. Local Test**: Run a local HTTP server to preview ([Step 8](#step-8--test-locally))
- [ ] **11. Deploy**: Launch free on GitHub Pages, Vercel, or Netlify ([Step 9](#step-9--free-1-click-deployment))
- [ ] **12. Share**: Send link or print a QR code on a physical card ([Step 10](#step-10--presenting--sharing-the-surprise))

---

## Step 1 — Personalize the Name & Branding

### 1.1 In `script.js`
Open [`script.js`](script.js) and locate the `CONFIG` object at line 7:

```javascript
const CONFIG = {
  /** The birthday person's name (updates opening screen, title, and finale canvas) */
  birthdayPersonName: 'Alex',

  /** Opening screen subtitle / teaser */
  openingTagline: 'Someone has something to tell you…',

  /** Intro screen duration in milliseconds (3200 = 3.2 seconds) */
  introDuration: 3200,

  /** Background music track played during the finale celebration */
  finaleMusic: 'assets/music/nastelbom-background-music-617073.mp3',

  /** Photos from assets/collage/ displayed in the background bento conveyor of the finale */
  collageImages: [
    'memory1.jpg',
    'memory2.jpg',
  ],
};
```

### 1.2 In `index.html`
Open [`index.html`](index.html) and update the metadata (lines 8–23):

```html
<!-- Social Share Previews (WhatsApp, iMessage, Instagram, etc.) -->
<meta property="og:title" content="Happy Birthday Alex!" />
<meta property="og:description" content="Open this audio capsule to listen to birthday messages from your friends and family." />

<!-- Mobile Web App Header -->
<meta name="apple-mobile-web-app-title" content="Alex's Capsule" />

<!-- Browser Tab Title -->
<title>Happy Birthday Alex! — Birthday Capsule</title>

<!-- Opening Screen Large Heading (fallback before JS loads) -->
<h1 class="opening-name" id="opening-name">Alex</h1>
```

### 1.3 In `site.webmanifest`
Open [`site.webmanifest`](site.webmanifest) to customize the title shown when the recipient adds the website to their phone's home screen:

```json
{
  "name": "Happy Birthday Alex",
  "short_name": "Alex's Bday",
  ...
}
```

---

## Step 2 — Opening Cover Photo

The opening screen features an editorial dark aesthetic with an ambient blurred memory photo resting underneath subtle particles and glowing gradients.

1. **Choose a photo:** A favorite portrait of the birthday person, a candid childhood photo, or a festive celebratory background.
2. **Format & Dimensions:**
   - **Aspect Ratio:** 9:16 (vertical mobile portrait, e.g. 1080×1920 or 768×1376).
   - **Format:** `.webp` (recommended for fastest load) or `.jpg`.
3. **Save location:** Replace [`assets/images/cover_bg.webp`](assets/images/cover_bg.webp).
4. *(Optional)* If using a `.jpg` or different filename, update the path in:
   - [`styles.css`](styles.css) (line 208): `background-image: url("assets/images/cover_bg.webp");`
   - [`index.html`](index.html) (line 27): `<link rel="preload" href="assets/images/cover_bg.webp" as="image" />`

---

## Step 3 — Prepare Voice Recordings

Voice notes are the heart of this birthday capsule. When played, each voice note displays a **tactile rotating vinyl record** and a **real-time 36-bar frequency visualizer**.

### 3.1 Collecting Audio
Ask friends and family to record a 10–60 second voice note on their phone using:
- **iPhone:** Voice Memos app (tap Share → Save to Files).
- **Android:** Voice Recorder app or WhatsApp voice message.
- **WhatsApp / Telegram:** Export voice notes to computer.

### 3.2 Supported Formats
- Recommended: `.mp3` or `.m4a` (plays universally across iOS Safari, Android Chrome, Mac, Windows).
- Also supported: `.ogg`, `.wav`.

### 3.3 Audio Normalization & Conversion (Recommended)
Voice notes recorded on different phones often have varying loudness. To ensure consistent volume:
1. Use a free online converter or tool like [Audacity](https://www.audacityteam.org/) or [AudioMass](https://audiomass.co/).
2. Export as MP3 at 128 kbps (mono or stereo).
3. Save all audio files to [`assets/audio/`](assets/audio/), e.g.:
   - `assets/audio/sarah.mp3`
   - `assets/audio/dad.mp3`
   - `assets/audio/grandma.mp3`

### 3.4 Setting Audio Durations (Optional)
On some mobile browsers, audio metadata takes a moment to load over slower connections. You can provide exact durations in `CONFIG.audioDurations` in [`script.js`](script.js) so the scrubber and waveforms render instantly:

```javascript
audioDurations: {
  'sarah': 24.5, // 24.5 seconds
  'dad': 45.0,
},
```

---

## Step 4 — Add Messages & Stories

Open [`data/messages.json`](data/messages.json). Each JSON object in the array represents one slide. You can mix and match voice notes, written letters, and media attachments in any order!

### 4.1 Story Type A: Audio Voice Note Story
```json
{
  "id": "sarah",
  "name": "Sarah Jenkins",
  "relationship": "Best Friend",
  "avatar": "assets/images/sarah.jpg",
  "color": "#FF6B8B",
  "type": "audio",
  "audio": "assets/audio/sarah.mp3",
  "caption": "Recorded a special voice note for your birthday 🎧"
}
```
- `"color"`: Hex color applied to the vinyl record's center label and initials badge.
- `"caption"`: Subtitle shown below "A Voice Note from [Name]".

### 4.2 Story Type B: Written Text Story
```json
{
  "id": "marcus",
  "name": "Marcus",
  "relationship": "College Roommate",
  "avatar": "assets/images/marcus.jpg",
  "color": "#A855F7",
  "type": "text",
  "heading": "To one of my favorite humans ✨",
  "message": "Wishing you the happiest birthday ever!\n\nThank you for always being there through all the chaotic adventures and late-night talks. Hope this year brings you everything you deserve!",
  "music": "assets/music/nastelbom-background-music-617073.mp3",
  "audio": null
}
```
- `"heading"`: (Optional) bold lead-in headline.
- `"message"`: The message body. Use `\n\n` for paragraph breaks.
- `"music"`: Background song that fades in when this card is displayed.

### 4.3 Story Type C: Written Story with Photo/Video Attachment
```json
{
  "id": "jordan",
  "name": "Jordan",
  "relationship": "Friend",
  "avatar": null,
  "color": "#06B6D4",
  "type": "text",
  "heading": "Another year of memories!",
  "message": "Happy Birthday! Still can't believe we pulled this off last summer.",
  "image": "assets/images/camping_trip.jpg",
  "imageCaption": "That unforgettable night under the stars ⛺✨",
  "music": "assets/music/dailyvibe-upbeat-corporate-614426.mp3",
  "audio": null
}
```
- `"image"`: Path to an image (`.jpg`, `.png`, `.webp`, `.gif`) displayed directly below the letter.
- `"clip"`: Path to a short looping video (`.mp4`, `.webm`) (video is automatically muted and plays smoothly inline).
- `"imageCaption"` / `"clipCaption"`: Caption displayed under the media attachment.

### 4.4 Friend Avatars & Monogram Badges
- If you have a photo of the friend: save it to `assets/images/` and specify `"avatar": "assets/images/friend_photo.jpg"`.
- If you **don't** have a photo: set `"avatar": null`. The system automatically generates a stylish monogram badge using the person's initials and `"color"`.

---

## Step 5 — Memory Photo Collage

The finale screen features a generative botanical poster in the foreground, with an **infinite diagonal bento grid** scrolling memory photos in the background.

### 5.1 Adding Photos
1. Drop your favorite photos of the birthday person into [`assets/collage/`](assets/collage/).
2. Name them simply (e.g. `pic1.jpg`, `pic2.jpg`, `trip.jpg`).
3. Open [`script.js`](script.js) and list the filenames in `CONFIG.collageImages`:

```javascript
collageImages: [
  'pic1.jpg',
  'pic2.jpg',
  'trip.jpg',
  'graduation.jpg',
  'celebration.jpg',
],
```

### 5.2 Generating Thumbnails for Lightning-Fast Loading (Recommended)
High-resolution photos from modern smartphones can be 5–15 MB each. Creating scaled thumbnails ensures the finale loads instantly on 4G/5G mobile connections:
1. Resize images to ~400px width.
2. Save them with the **same filename** into [`assets/collage/thumbs/`](assets/collage/thumbs/).
3. *(Quick Python script to auto-generate all thumbnails):*
   ```bash
   python -c "
   import os, glob
   from PIL import Image
   os.makedirs('assets/collage/thumbs', exist_ok=True)
   for p in glob.glob('assets/collage/*.*'):
       if os.path.isfile(p):
           im = Image.open(p)
           im.thumbnail((450, 450))
           im.save(os.path.join('assets/collage/thumbs', os.path.basename(p)), quality=80)
   print('Thumbnails generated!')
   "
   ```
> **Note:** If a thumbnail is missing, the player automatically falls back to the full-size image in `assets/collage/` with zero broken image icons.

### 5.3 What if you have few (or no) photos?
- **0 photos (`[]`):** The bento photo layer remains hidden and the finale displays the pure generative floral typography against an atmospheric ambient glow.
- **1–10 photos:** The engine automatically cycles and shuffles your photos to populate the bento grid seamlessly.
- **20–44+ photos:** Displays an eclectic, non-repeating memory gallery.

---

## Step 6 — Background Music & Soundtrack

### 6.1 Included Royalty-Free Tracks
9 instrumental background tracks are included in [`assets/music/`](assets/music/):

| File | Genre / Vibe |
|---|---|
| `nastelbom-background-music-617073.mp3` | Warm, acoustic, emotional (Default Finale) |
| `dailyvibe-upbeat-corporate-614426.mp3` | Uplifting, positive, cheerful |
| `jonasblakewood-future-beat-music-619127.mp3` | Modern lofi beat, chill vibe |
| `bombinsound-podcast-music-intro-version-4-ridingx27-617278.mp3` | Acoustic guitar, heartwarming |
| `nastelbom-no-copyright-music-617081.mp3` | Inspiring cinematic piano & strings |
| `nastelbom-upbeat-upbeat-music-617071.mp3` | Bright, celebratory pop beat |
| `the_mountain-presentation-610155.mp3` | Calm ambient background |
| `atlasaudio-rap-617598.mp3` | Rhythmic beat, energetic |
| `kulakovka-adrenaline-sport-620584.mp3` | Upbeat, dynamic rhythm |

### 6.2 Custom Music
Drop any `.mp3` file into `assets/music/`, then reference it in:
- A specific story slide in `data/messages.json`: `"music": "assets/music/your_song.mp3"`
- The finale celebration in `CONFIG.finaleMusic` in `script.js`.

---

## Step 7 — Favicon & App Icon

The website includes a lightweight, clean SVG favicon with a festive birthday cake icon: [`favicon.svg`](favicon.svg).

- To change the icon emoji, open [`favicon.svg`](favicon.svg) and replace `🎂` with any emoji (e.g. `🎉`, `🎁`, `⭐`, `🌸`, `🎈`).
- To change the accent circle color, adjust `stroke="#FF6B8B"`.

---

## Step 8 — Test Locally

Because `index.html` loads `data/messages.json` using JavaScript `fetch()`, web browsers enforce CORS security and block file reading if opened via `file://`. You must serve the folder through a local HTTP server:

### Option A — VS Code Live Server (Easiest)
1. Install the **Live Server** extension in VS Code.
2. Right-click [`index.html`](index.html) → **Open with Live Server**.

### Option B — Python 3 (No Install Required)
Run this command from your project folder:
```bash
python -m http.server 8080
```
Open **[http://localhost:8080](http://localhost:8080)** in your browser.

### Option C — Node.js
```bash
npx -y serve .
```

### 📱 Testing on your Phone (Same Wi-Fi)
1. Start the server (e.g. `python -m http.server 8080`).
2. Find your computer's local IP address (`ipconfig` on Windows or `ifconfig` on Mac).
3. On your phone's browser, visit `http://<your-computer-ip>:8080`.

---

## Step 9 — Free 1-Click Deployment

This project requires **no server, no Node build step, and no database**. It can be hosted 100% free forever:

### Method A — GitHub Pages (Recommended)
1. Create a new repository on [GitHub](https://github.com/).
2. Push your project code:
   ```bash
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git branch -M main
   git push -u origin main
   ```
3. On GitHub, go to your repository's **Settings** → **Pages** (left sidebar).
4. Under **Build and deployment**, set:
   - **Source:** `Deploy from a branch`
   - **Branch:** `main`
   - **Folder:** `/ (root)`
5. Click **Save**. Within 60 seconds, your site is live at:
   `https://<your-username>.github.io/<your-repo-name>/`

### Method B — Vercel
1. Go to [Vercel](https://vercel.com/) and sign in with GitHub.
2. Click **Add New Project** → Import your repository.
3. Leave all build settings at their defaults (Framework Preset: *Other*, Root Directory: `./`).
4. Click **Deploy**. Your custom URL (e.g. `https://alex-birthday.vercel.app`) is live instantly.

### Method C — Netlify
1. Go to [Netlify Drop](https://app.netlify.com/drop).
2. Drag and drop your project folder directly into the browser window.
3. Your site is deployed in seconds with a free `.netlify.app` URL.

---

## Step 10 — Presenting & Sharing the Surprise

### 10.1 Print a QR Code on a Birthday Card / Letter
Make the reveal physical and memorable:
1. Copy your deployed website URL.
2. Generate a free high-resolution QR code at [qr-code-generator.com](https://www.qr-code-generator.com/) or [qrcode-monkey.com](https://www.qrcode-monkey.com/).
3. Print the QR code inside a birthday card, envelope, or wrapped gift box with a note:
   > *"Put on your headphones and scan this when you're ready 🎧"*

### 10.2 Install as a Native Mobile Web App (PWA)
The recipient can add the website directly to their home screen with custom icons:
- **iPhone (Safari):** Tap the **Share** button (box with upward arrow) → tap **Add to Home Screen**.
- **Android (Chrome):** Tap the **Three Dots** menu → tap **Add to Home screen** / **Install App**.

---

## 💡 Troubleshooting & FAQ

#### Why doesn't audio play automatically on mobile?
All modern mobile browsers (iOS Safari, Android Chrome) block automatic audio playback until the user interacts with the page. That's why the opening screen has the **"Open Your Capsule"** button — tapping this button unlocks the Web Audio engine so all voice notes and music play seamlessly throughout the experience.

#### Can I change the fonts?
Yes. Google Fonts ([Playfair Display](https://fonts.google.com/specimen/Playfair+Display), [Syne](https://fonts.google.com/specimen/Syne), and [Urbanist](https://fonts.google.com/specimen/Urbanist)) are loaded in [`index.html`](index.html) and defined as CSS variables at the top of [`styles.css`](styles.css):
```css
--font-display: 'Syne', sans-serif;
--font-serif: 'Playfair Display', Georgia, serif;
--font-sans: 'Urbanist', -apple-system, sans-serif;
```

#### How does the recipient replay or navigate?
- **Tap Right / Left:** Advances or goes back one slide.
- **Touch and Hold (or Spacebar):** Pauses the current story and audio.
- **Top Progress Bar:** Tap any segment to jump directly to that friend's story.
- **Finale Stage:** Includes **Replay Capsule** and **Stories** buttons, plus a palette switcher to cycle flower color themes.

---

## 📂 File Structure Reference

```text
├── assets/
│   ├── audio/
│   │   └── sample_voice_note.mp3  # Drop friends' audio recordings here (.mp3, .ogg, .m4a)
│   ├── collage/
│   │   ├── thumbs/                # Scaled thumbnail versions for fast loading (~400px)
│   │   └── sample_memory_1.jpg    # Full-resolution memory photos for finale bento grid
│   ├── images/
│   │   ├── cover_bg.webp          # Opening screen portrait background (9:16 aspect ratio)
│   │   ├── avatar-1.svg           # Sample friend profile avatars
│   │   └── sample_celebration.jpg # Sample media card attachment photo
│   └── music/                     # Royalty-free instrumental background tracks
├── data/
│   └── messages.json              # All birthday wishes, voice notes & stories
├── index.html                     # Core mobile-first HTML structure & metadata
├── script.js                      # Story progress engine, audio visualizer, BGM & CONFIG
├── styles.css                     # Obsidian dark theme, layout & animation styles
├── type_garden.js                 # Standalone generative botanical typography canvas engine
├── favicon.svg                    # Vector celebratory browser tab icon
├── site.webmanifest               # Progressive Web App (PWA) home screen configuration
├── sw.js                          # Service Worker for instant offline loading
├── .gitignore                     # Git exclusions (OS files, caches)
└── README.md                      # Complete setup & customization documentation
```

---

## 📄 License

MIT License — Free to use, fork, and customize for friends, family, and loved ones. Make someone's birthday unforgettable! ❤️
