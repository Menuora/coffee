(function () {
  const loginView = document.querySelector('[data-login-view]');
  const dashboard = document.querySelector('[data-dashboard]');
  const loginForm = document.querySelector('[data-login-form]');
  const logoutButton = document.querySelector('[data-logout]');
  const bookingsList = document.querySelector('[data-bookings-list]');
  const uploadForm = document.querySelector('[data-upload-form]');
  const uploadMessage = document.querySelector('[data-upload-message]');
  const fileInput = uploadForm.querySelector('[type="file"]');
  const dropZone = uploadForm.querySelector('.drop-zone');
  const fileName = uploadForm.querySelector('[data-file-name]');
  const settingsForm = document.querySelector('[data-settings-form]');
  const imagesForm = document.querySelector('[data-images-form]');

  function showDashboard(show) {
    loginView.hidden = show;
    dashboard.hidden = !show;
  }

  async function request(url, options) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  }

  function fillForm(form, values) {
    Object.entries(values || {}).forEach(([key, value]) => {
      const field = form.querySelector(`[name="${key}"]`);
      if (field) field.value = value || '';
    });
  }

  async function loadBookings() {
    const data = await request('/api/admin/bookings');
    bookingsList.innerHTML = (data.bookings || []).map((booking) => `
      <tr>
        <td>${booking.name}</td>
        <td>${booking.phone}</td>
        <td>${booking.email || '-'}</td>
        <td>${booking.date} ${booking.time}</td>
        <td>${booking.guests}</td>
        <td>${booking.message || '-'}</td>
        <td><button class="delete-booking" type="button" data-delete-booking="${booking.id}">Delete</button></td>
      </tr>`).join('') || '<tr><td colspan="7">No bookings yet.</td></tr>';
  }

  async function loadSettings() {
    const data = await request('/api/settings');
    fillForm(settingsForm, data.settings);
    fillForm(imagesForm, data.homepageImages);
  }

  async function boot() {
    try {
      await request('/api/admin/me');
      showDashboard(true);
      await Promise.all([loadBookings(), loadSettings()]);
    } catch (error) {
      showDashboard(false);
    }
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = loginForm.querySelector('[data-status]');
    status.textContent = 'Checking login...';
    try {
      await request('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(loginForm).entries()))
      });
      status.textContent = '';
      await boot();
    } catch (error) {
      status.textContent = error.message;
    }
  });

  logoutButton.addEventListener('click', async () => {
    await request('/api/admin/logout', { method: 'POST' });
    showDashboard(false);
  });

  uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    uploadMessage.textContent = 'Uploading...';
    try {
      await request('/api/admin/uploads', { method: 'POST', body: new FormData(uploadForm) });
      uploadForm.reset();
      uploadMessage.textContent = 'Image uploaded.';
    } catch (error) {
      uploadMessage.textContent = error.message;
    }
  });

  bookingsList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-delete-booking]');
    if (!button) return;
    button.textContent = 'Deleting...';
    await request(`/api/admin/bookings/${button.dataset.deleteBooking}`, { method: 'DELETE' });
    await loadBookings();
  });

  fileInput.addEventListener('change', () => {
    fileName.textContent = fileInput.files[0] ? fileInput.files[0].name : 'PNG, JPG, or WebP up to 12MB';
  });

  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragover');
    if (!event.dataTransfer.files.length) return;
    fileInput.files = event.dataTransfer.files;
    fileName.textContent = event.dataTransfer.files[0].name;
  });

  settingsForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await request('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(settingsForm).entries()))
    });
    settingsForm.querySelector('[data-status]').textContent = 'Settings saved.';
  });

  imagesForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await request('/api/admin/homepage-images', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(new FormData(imagesForm).entries()))
    });
    imagesForm.querySelector('[data-status]').textContent = 'Image settings saved.';
  });

  boot();
})();
