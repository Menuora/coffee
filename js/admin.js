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

  function fillForm(form, values) {
    Object.entries(values || {}).forEach(([key, value]) => {
      const field = form.querySelector(`[name="${key}"]`);
      if (field) field.value = value || '';
    });
  }

  async function loadBookings() {
    try {
      const bookings = await dbApi.getBookings();
      bookingsList.innerHTML = bookings.map((booking) => `
        <tr>
          <td>${booking.name}</td>
          <td>${booking.phone}</td>
          <td>${booking.email || '-'}</td>
          <td>${booking.date} ${booking.time}</td>
          <td>${booking.guests}</td>
          <td>${booking.message || '-'}</td>
          <td><button class="delete-booking" type="button" data-delete-booking="${booking.id}">Delete</button></td>
        </tr>`).join('') || '<tr><td colspan="7">No bookings yet.</td></tr>';
    } catch (error) {
      console.error("Failed to load bookings:", error);
    }
  }

  async function loadSettings() {
    try {
      const [settings, homepageImages] = await Promise.all([
        dbApi.getSettings(),
        dbApi.getHomepageImages()
      ]);
      fillForm(settingsForm, settings);
      fillForm(imagesForm, homepageImages);
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }

  async function boot() {
    try {
      const user = await dbApi.getCurrentUser();
      
      // Update UI placeholders depending on if Firebase is used
      const usernameInput = loginForm.querySelector('[name="username"]');
      if (usernameInput) {
        usernameInput.placeholder = dbApi.isFirebaseUsed() ? "Email / Username" : "Username";
      }

      if (!user) {
        showDashboard(false);
        return;
      }
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
      const data = Object.fromEntries(new FormData(loginForm).entries());
      await dbApi.login(data.username, data.password);
      status.textContent = '';
      await boot();
    } catch (error) {
      status.textContent = error.message;
    }
  });

  logoutButton.addEventListener('click', async () => {
    await dbApi.logout();
    showDashboard(false);
  });

  uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    uploadMessage.textContent = 'Uploading...';
    try {
      const type = uploadForm.querySelector('[name="type"]').value;
      const file = fileInput.files[0];
      if (!file) throw new Error('Please select an image file first.');
      await dbApi.uploadImage(file, type);
      uploadForm.reset();
      fileName.textContent = 'PNG, JPG, or WebP up to 12MB';
      uploadMessage.textContent = 'Image uploaded successfully.';
    } catch (error) {
      uploadMessage.textContent = error.message;
    }
  });

  bookingsList.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-delete-booking]');
    if (!button) return;
    button.textContent = 'Deleting...';
    try {
      await dbApi.deleteBooking(button.dataset.deleteBooking);
      await loadBookings();
    } catch (error) {
      alert("Failed to delete booking: " + error.message);
      button.textContent = 'Delete';
    }
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
    const status = settingsForm.querySelector('[data-status]');
    status.textContent = 'Saving...';
    try {
      const data = Object.fromEntries(new FormData(settingsForm).entries());
      await dbApi.saveSettings(data);
      status.textContent = 'Settings saved.';
    } catch (error) {
      status.textContent = 'Error: ' + error.message;
    }
  });

  imagesForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const status = imagesForm.querySelector('[data-status]');
    status.textContent = 'Saving...';
    try {
      const data = Object.fromEntries(new FormData(imagesForm).entries());
      await dbApi.saveHomepageImages(data);
      status.textContent = 'Image settings saved.';
    } catch (error) {
      status.textContent = 'Error: ' + error.message;
    }
  });

  // Change Password Form
  const passwordForm = document.querySelector('[data-password-form]');
  if (passwordForm) {
    passwordForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const status = passwordForm.querySelector('[data-status]');
      status.textContent = 'Updating...';
      const data = Object.fromEntries(new FormData(passwordForm).entries());
      
      if (data.newPassword !== data.confirmPassword) {
        status.textContent = 'New passwords do not match.';
        return;
      }

      try {
        await dbApi.changePassword(data.currentPassword, data.newPassword);
        passwordForm.reset();
        status.textContent = 'Password updated successfully.';
      } catch (error) {
        status.textContent = error.message;
      }
    });
  }

  boot();
})();
