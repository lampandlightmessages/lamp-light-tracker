# Lamp & Light Video Tracker

A Progressive Web App for tracking the full video production pipeline for Lamp & Light Messages.

---

## Deploying to GitHub Pages

### Step 1 — Upload these files to your GitHub repository

You can do this one of two ways:

**Option A — GitHub website (no Git required)**
1. Go to your repository at github.com
2. Click "Add file" → "Upload files"
3. Drag the entire contents of this folder into the upload area
4. Make sure to include the hidden `.github` folder — you may need to enable "show hidden files" on your PC first (in File Explorer: View → Show → Hidden items)
5. Click "Commit changes"

**Option B — Git command line**
```
git clone https://github.com/YOUR_USERNAME/lamp-light-tracker.git
# Copy all files from this folder into the cloned folder
git add .
git commit -m "Initial deploy"
git push origin main
```

---

### Step 2 — Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (in the left sidebar)
3. Under "Source", select **GitHub Actions**
4. Save

The deploy workflow will run automatically on every push to `main`. Your app will be live at:
```
https://YOUR_GITHUB_USERNAME.github.io/lamp-light-tracker/
```

---

### Step 3 — Add your GitHub Pages URL to Supabase

This is required so Supabase allows sign-ins from your hosted app.

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **URL Configuration**
3. Add your GitHub Pages URL to **Redirect URLs**:
   ```
   https://YOUR_GITHUB_USERNAME.github.io/lamp-light-tracker/
   ```
4. Save

---

### Step 4 — Create your account

1. Visit your live app URL
2. Click "Don't have an account? Sign Up"
3. Enter your email and a password
4. Sign in

That's it. Your data is now stored in Supabase and accessible from any device.

---

## Icons

The `icons/` folder needs two PNG files for the PWA install icon:
- `icon-192.png` — 192×192 pixels
- `icon-512.png` — 512×512 pixels

A simple flame or star icon in gold (#c9a84c) on a dark (#0d1117) background works well.
You can create these for free at favicon.io or any image editor.
Until you add icons, the app still works — it just won't have a custom icon when installed.

---

## Backup

Use the **Export** button in the hamburger menu (≡) to download a full JSON backup of all your data at any time.

---

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript, no build tools
- **Database**: Supabase (PostgreSQL)
- **Hosting**: GitHub Pages
- **Auth**: Supabase Auth (email/password)
- **Offline**: Service Worker caches all app assets
