const fs = require('fs');
const path = require('path');
const app = require('./api/index');

const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const index = trimmed.indexOf('=');
    if (index === -1) return;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  });
}

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Template running at http://localhost:${port}`);
  console.log(`Admin dashboard: http://localhost:${port}/admin`);
});
