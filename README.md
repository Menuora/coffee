# Serverless Hotel/Restaurant Website Template

This restaurant template is fully portable, serverless, and ready for deployment on any static hosting provider (Vercel, Netlify, GitHub Pages, etc.). It features client-side **Firebase (Firestore & Auth)** integration and secure client-side **Cloudinary** uploads.

No Node.js backend or Vercel serverless functions are required for live data storage, allowing easy white-labeling and credential swapping.

---

## 🌟 Architecture & White-Labeling Plan

1. **Static Deployment**: Because the template is 100% client-side, you can host it for free on any static host.
2. **Easy Portability / White-Labeling**: All external credentials (Gmail IDs, Firebase configs, Cloudinary cloud names) are stored in a single config file: `js/env.js`. 
3. **Local Fallback Mode**: If `js/env.js` is left unconfigured, the website automatically falls back to browser `localStorage` for bookings, images, and settings. This allows local development and instant previews without any setup.
4. **Secure Uploads**: Client-side Cloudinary upload uses **Unsigned Upload Presets** so that your private Cloudinary API Secret is never exposed in the browser.

---

## 🚀 Features

- **Home Page**: Modern restaurant landing page with contact info, opening hours, and dynamic map iframe.
- **Book Table**: Real-time table booking form that saves directly to Firestore (or LocalStorage).
- **Gallery Page (`gallery.html`)**: Dynamically lists full menu and individual item uploads from the database.
- **Admin Dashboard (`/admin`)**:
  - **Login / Logout**: Private credentials login using Firebase Auth (or fallback local credentials).
  - **Bookings Management**: View submitted bookings list in real-time, complete with a delete action.
  - **Menu/Image Upload**: Direct client-side upload of full menus or item images.
  - **Website Settings**: Instantly update the restaurant name, social links, opening times, and Google Maps iframe embed.
  - **Homepage Image Settings**: Change hero banners, corner photos, and header images on the fly.
  - **Change Password**: Change the admin login password securely.

---

## ⚙️ Configuration Setup

### 1. Copy the configuration file:
Copy the example config to a real `js/env.js` file:
```bash
cp js/env.example.js js/env.js
```
On Windows PowerShell:
```powershell
Copy-Item js/env.example.js js/env.js
```

### 2. Enter Credentials in `js/env.js`:
Open `js/env.js` and enter the specific credentials for the restaurant/hotel owner:
- **Firebase Configuration**: Set up a Firebase project, enable **Firebase Authentication** (Email/Password provider) and **Cloud Firestore Database**, and copy the config block.
- **Cloudinary Configuration**: Enable client-side uploads by creating an **Unsigned Upload Preset** in your Cloudinary Dashboard under *Settings > Upload > Upload Presets*. Enter your Cloud Name and the Preset Name.
- **Fallback Credentials**: Specify the initial login credentials when running in Local Mode.

---

## 💻 Local Development

1. **Install Dependencies** (only needed for a simple local development server):
   ```bash
   npm install
   ```

2. **Run the local preview server**:
   ```bash
   npm run dev
   ```

3. **Default Local Login** (if `js/env.js` is empty):
   - **Username**: `admin`
   - **Password**: `change-this-password`

4. **Access Links**:
   - Public landing page: `http://localhost:3000`
   - Admin panel: `http://localhost:3000/admin`
   - Gallery page: `http://localhost:3000/gallery.html`

---

## ☁️ Deploying Live

To set up a live site for a new hotel owner:
1. Create a Firebase project and Cloudinary account for the owner.
2. Replace the values in `js/env.js` with their credentials.
3. Deploy the folder statically to **Vercel**, **Netlify**, or **GitHub Pages**.
4. The template is now fully white-labeled and owned by the hotel client!
