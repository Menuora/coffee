const express = require('express');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs/promises');
const { v2: cloudinary } = require('cloudinary');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } });
const COOKIE = 'hotel_admin_session';
const DATA_FOLDER = 'hotel-template/data';
const LOCAL_DATA_DIR = path.join(__dirname, '..', '.local-data');

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..')));

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const defaults = {
  settings: {
    restaurantName: 'Coffee',
    facebookLink: '#',
    instagramLink: '#',
    twitterLink: '#',
    googleMapsEmbed: '',
    openingTime: 'Mon-Fri: 8am to 2pm',
    closingTime: 'Sat-Sun: 11am to 4pm'
  },
  homepageImages: {
    heroImage1: 'img/header-bg.jpg',
    heroImage1Secondary: 'img/g1.jpg',
    heroImage2: 'img/menu-bg.jpg',
    heroImage2Secondary: 'img/g2.jpg',
    aboutImage1: 'img/video-bg.jpg',
    aboutImage2: 'img/g3.jpg',
    bookingImage: 'img/footer-bg.jpg',
    menuHeaderImage: 'img/menu-bg.jpg',
    galleryHeaderImage: 'img/header-bg.jpg',
    contactHeaderImage: 'img/footer-bg.jpg'
  },
  bookings: []
};

function configured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

function sign(value) {
  const secret = process.env.SESSION_SECRET || 'dev-secret';
  return crypto.createHmac('sha256', secret).update(value).digest('hex');
}

function sessionValue() {
  const user = process.env.ADMIN_USERNAME || 'admin';
  return `${user}:${sign(user)}`;
}

function requireAuth(req, res, next) {
  if (req.cookies[COOKIE] === sessionValue()) return next();
  return res.status(401).json({ error: 'Login required' });
}

async function readJson(name) {
  if (!configured()) {
    try {
      const content = await fs.readFile(path.join(LOCAL_DATA_DIR, `${name}.json`), 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return defaults[name];
    }
  }
  try {
    const resource = await cloudinary.api.resource(`${DATA_FOLDER}/${name}`, { resource_type: 'raw' });
    const response = await fetch(`${resource.secure_url}?v=${Date.now()}`);
    if (!response.ok) return defaults[name];
    return await response.json();
  } catch (error) {
    return defaults[name];
  }
}

async function writeJson(name, value) {
  if (!configured()) {
    await fs.mkdir(LOCAL_DATA_DIR, { recursive: true });
    await fs.writeFile(path.join(LOCAL_DATA_DIR, `${name}.json`), JSON.stringify(value, null, 2));
    return value;
  }
  await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        public_id: `${DATA_FOLDER}/${name}`,
        overwrite: true,
        invalidate: true,
        format: 'json'
      },
      (error, result) => error ? reject(error) : resolve(result)
    );
    stream.end(Buffer.from(JSON.stringify(value, null, 2)));
  });
  return value;
}

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function extractMapSrc(value) {
  const input = cleanString(value);
  const match = input.match(/src=["']([^"']+)["']/i);
  return match ? match[1] : input;
}

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'admin.html'));
});

app.post('/api/admin/login', (req, res) => {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'pass';
  if (req.body.username === username && req.body.password === password) {
    res.cookie(COOKIE, sessionValue(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 8
    });
    return res.json({ ok: true });
  }
  return res.status(401).json({ error: 'Invalid username or password' });
});

app.post('/api/admin/logout', (req, res) => {
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

app.get('/api/admin/me', requireAuth, (req, res) => res.json({ ok: true }));

app.get('/api/settings', async (req, res) => {
  const [settings, homepageImages] = await Promise.all([readJson('settings'), readJson('homepageImages')]);
  res.json({ settings: { ...defaults.settings, ...settings }, homepageImages: { ...defaults.homepageImages, ...homepageImages } });
});

app.put('/api/admin/settings', requireAuth, async (req, res) => {
  const current = await readJson('settings');
  const settings = {
    ...defaults.settings,
    ...current,
    restaurantName: cleanString(req.body.restaurantName) || defaults.settings.restaurantName,
    facebookLink: cleanString(req.body.facebookLink) || '#',
    instagramLink: cleanString(req.body.instagramLink) || '#',
    twitterLink: cleanString(req.body.twitterLink) || '#',
    googleMapsEmbed: extractMapSrc(req.body.googleMapsEmbed),
    openingTime: cleanString(req.body.openingTime),
    closingTime: cleanString(req.body.closingTime)
  };
  await writeJson('settings', settings);
  res.json({ settings });
});

app.put('/api/admin/homepage-images', requireAuth, async (req, res) => {
  const current = await readJson('homepageImages');
  const homepageImages = { ...defaults.homepageImages, ...current };
  Object.keys(homepageImages).forEach((key) => {
    if (typeof req.body[key] === 'string') homepageImages[key] = req.body[key].trim();
  });
  await writeJson('homepageImages', homepageImages);
  res.json({ homepageImages });
});

app.post('/api/bookings', async (req, res) => {
  const booking = {
    id: crypto.randomUUID(),
    name: cleanString(req.body.name),
    phone: cleanString(req.body.phone),
    email: cleanString(req.body.email),
    date: cleanString(req.body.date),
    time: cleanString(req.body.time),
    guests: cleanString(req.body.guests),
    message: cleanString(req.body.message),
    createdAt: new Date().toISOString()
  };
  if (!booking.name || !booking.phone || !booking.date || !booking.time || !booking.guests) {
    return res.status(400).json({ error: 'Name, phone, date, time, and guests are required' });
  }
  const bookings = await readJson('bookings');
  bookings.unshift(booking);
  await writeJson('bookings', bookings);
  res.status(201).json({ booking });
});

app.get('/api/admin/bookings', requireAuth, async (req, res) => {
  res.json({ bookings: await readJson('bookings') });
});

app.delete('/api/admin/bookings/:id', requireAuth, async (req, res) => {
  const bookings = await readJson('bookings');
  const nextBookings = bookings.filter((booking) => booking.id !== req.params.id);
  await writeJson('bookings', nextBookings);
  res.json({ ok: true });
});

app.post('/api/admin/uploads', requireAuth, upload.single('image'), async (req, res) => {
  if (!configured()) return res.status(500).json({ error: 'Cloudinary environment variables are missing' });
  if (!req.file) return res.status(400).json({ error: 'Image is required' });
  const type = req.body.type === 'item' ? 'item' : 'menu';
  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `hotel-template/${type}`, resource_type: 'image' },
      (error, uploadResult) => error ? reject(error) : resolve(uploadResult)
    );
    stream.end(req.file.buffer);
  });
  res.status(201).json({ image: { url: result.secure_url, publicId: result.public_id, type, createdAt: result.created_at } });
});

app.get('/api/images', async (req, res) => {
  if (!configured()) return res.json({ images: [] });
  const [menus, items] = await Promise.all([
    cloudinary.search.expression('folder:hotel-template/menu').sort_by('created_at', 'desc').max_results(100).execute(),
    cloudinary.search.expression('folder:hotel-template/item').sort_by('created_at', 'desc').max_results(100).execute()
  ]);
  const normalize = (type) => (item) => ({ type, url: item.secure_url, publicId: item.public_id, createdAt: item.created_at });
  res.json({ images: [...menus.resources.map(normalize('menu')), ...items.resources.map(normalize('item'))] });
});

module.exports = app;
