# NAS Lemoore — Fleet Galley

A self-contained, single-file web application for managing the NAS Lemoore Fleet Galley menu, operating hours, announcements, and contact information.

**Live at:** `https://vikasnehra1.github.io/NAS-LEMR-GALLEY/`

---

## Features

- **Weekly Menu Planning** — Set menus for each day of the week (Sun–Sat)
- **4 Meal Periods** — Breakfast, Lunch, Dinner, and Midrats
- **Staff Login** — Password-protected edit mode (default: `galley2025`)
- **Editable Everything** — Announcements, operating hours, contact info, and menus
- **Live Status** — "Now Serving" / "Closed" indicator based on time of day
- **Copy/Clear Days** — Copy one day's menu to another, or clear a day
- **Photo URLs** — Add meal photos via URL
- **Data Export/Import** — Save all data as JSON, import on another device
- **Password Management** — Change the staff password from Settings
- **Print-Friendly** — Clean print layout for posting in the galley
- **Mobile Responsive** — Works on phones, tablets, and desktops
- **No Backend Required** — Everything runs client-side with localStorage

---

## How to Deploy on GitHub Pages

### Step 1: Create a GitHub Repository

1. Go to [github.com](https://github.com) and sign in
2. Click the **+** button → **New repository**
3. Name it `nas-lemoore-galley`
4. Set it to **Public**
5. Click **Create repository**

### Step 2: Upload Files

**Option A — Upload via GitHub.com (easiest):**
1. On your new repo page, click **"uploading an existing file"** link
2. Drag and drop both `index.html` and `.nojekyll` into the upload area
3. Click **Commit changes**

**Option B — Using Git command line:**
```bash
cd nas-lemoore-galley
git init
git add .
git commit -m "Initial galley website"
git branch -M main
git remote add origin https://github.com/<your-username>/nas-lemoore-galley.git
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repo → **Settings** → **Pages** (left sidebar)
2. Under **Source**, select **Deploy from a branch**
3. Set branch to `main` and folder to `/ (root)`
4. Click **Save**
5. Wait 1-2 minutes, then visit: `https://<your-username>.github.io/nas-lemoore-galley/`

---

## Staff Usage

1. Click **Staff Login** in the header
2. Enter password: `galley2025` (or your custom password)
3. Use the toolbar buttons to edit Announcements, Hours, or Contact
4. Hover over any meal card and click **Edit** to update the menu
5. Use the day selector to plan menus for the entire week
6. Use **⚙ Settings** to change password, export/import data, or reset

### Syncing Across Devices

Since data is stored in the browser's localStorage, changes are per-device. To sync:

1. Log in as staff → **⚙ Settings** → **📥 Export Data**
2. This downloads a `.json` file with all your data
3. On the other device, go to **⚙ Settings** → **📤 Import Data**
4. Select the exported JSON file — all menus and settings will sync

---

## Important Notes

- **Data is per-browser**: Each browser/device has its own copy of menu data
- **No server needed**: Everything is static HTML/CSS/JS
- **Password is stored locally**: The staff password is saved in localStorage (not secure for high-security needs, but fine for a galley menu)
- **Default password**: `galley2025` — change it after first login

---

## File Structure

```
nas-lemoore-galley/
├── index.html    ← The entire application (single file)
├── .nojekyll     ← Tells GitHub Pages not to use Jekyll
└── README.md     ← This file
```

---

Built for NAS Lemoore Fleet Galley · Naval Air Station Lemoore, CA 93246
