# Hotel/Restaurant Website Template

This template is ready for Vercel deployment with a private `/admin` dashboard, table bookings, Cloudinary image uploads, editable website settings, and a public menu/image gallery.

## Features

- Public coffee/restaurant landing page with the original template style
- Public `gallery.html` page for full menu and item images
- Private `/admin` dashboard with environment-based login
- Book Table form saved to the admin dashboard
- Cloudinary image uploads for full menu images and individual item photos
- Editable restaurant name, social links, map embed, opening hours, and homepage image URLs
- Vercel-friendly API routes in `api/index.js`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Run locally:

```bash
npm run dev
```

The template runs without asking for Vercel credentials. For local testing, the default admin login is:

```text
Username: admin
Password: pass
```

Local bookings and settings are saved in `.local-data/` when Cloudinary is not configured.

3. For real deployment, copy the example environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

4. Fill these values in `.env`:

```env
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-this-password
SESSION_SECRET=replace-with-a-long-random-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

5. Open:

- Public site: `http://localhost:3000`
- Admin: `http://localhost:3000/admin`
- Gallery: `http://localhost:3000/gallery.html`

## Deploy To Vercel

1. Push this folder to a GitHub repository.
2. Import the repository in Vercel.
3. Add the same environment variables from `.env.example` in the Vercel project settings.
4. Deploy.
5. Give the hotel/restaurant owner the `/admin` URL and the admin credentials.

## Notes

- GitHub Pages can host the static public files only. Bookings, admin login, uploads, and settings require the Vercel API.
- Cloudinary stores uploaded images and the small JSON data files used for bookings/settings, so no extra database credentials are required.
- Cloudinary is required for deployed persistence and image uploads. Local testing works without Cloudinary credentials.
- The admin link is intentionally not shown in the public navigation. Access it manually at `/admin`.
