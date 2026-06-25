(function () {
  let isFirebase = false;
  let auth = null;
  let db = null;

  // Check if Firebase is configured in window.ENV
  if (
    window.ENV &&
    window.ENV.apiKey &&
    window.ENV.projectId &&
    typeof firebase !== 'undefined'
  ) {
    try {
      const firebaseConfig = {
        apiKey: window.ENV.apiKey,
        authDomain: window.ENV.authDomain,
        projectId: window.ENV.projectId,
        storageBucket: window.ENV.storageBucket,
        messagingSenderId: window.ENV.messagingSenderId,
        appId: window.ENV.appId
      };
      firebase.initializeApp(firebaseConfig);
      auth = firebase.auth();
      db = firebase.firestore();
      isFirebase = true;
      console.log("Firebase initialized successfully.");
    } catch (e) {
      console.error("Firebase initialization failed, falling back to localStorage:", e);
    }
  } else {
    console.log("Firebase credentials not detected. Running in Local Storage Mode.");
  }

  // Helper to generate UUIDs locally
  function generateUUID() {
    return 'xyxx-yxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  const dbApi = {
    isFirebaseUsed: () => isFirebase,

    // Authentication Actions
    login: async (usernameOrEmail, password) => {
      if (isFirebase) {
        // If it's a simple username, append a default domain to make it look like an email
        const email = usernameOrEmail.includes('@')
          ? usernameOrEmail
          : `${usernameOrEmail}@hotel.com`;
        return auth.signInWithEmailAndPassword(email, password);
      } else {
        const expectedUser = localStorage.getItem('admin_username') || (window.ENV && window.ENV.ADMIN_USERNAME) || 'admin';
        const expectedPass = localStorage.getItem('admin_password') || (window.ENV && window.ENV.ADMIN_PASSWORD) || 'change-this-password';
        
        if (usernameOrEmail === expectedUser && password === expectedPass) {
          localStorage.setItem('local_session', 'true');
          return { email: expectedUser };
        } else {
          throw new Error('Invalid username or password');
        }
      }
    },

    logout: async () => {
      if (isFirebase) {
        return auth.signOut();
      } else {
        localStorage.removeItem('local_session');
        return true;
      }
    },

    getCurrentUser: async () => {
      if (isFirebase) {
        return new Promise((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
          });
        });
      } else {
        const isLogged = localStorage.getItem('local_session') === 'true';
        if (isLogged) {
          const username = localStorage.getItem('admin_username') || (window.ENV && window.ENV.ADMIN_USERNAME) || 'admin';
          return { email: username };
        }
        return null;
      }
    },

    changePassword: async (currentPassword, newPassword) => {
      if (isFirebase) {
        const user = auth.currentUser;
        if (!user) throw new Error('No user is currently logged in');
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
        await user.reauthenticateWithCredential(credential);
        return user.updatePassword(newPassword);
      } else {
        const expectedPass = localStorage.getItem('admin_password') || (window.ENV && window.ENV.ADMIN_PASSWORD) || 'change-this-password';
        if (currentPassword !== expectedPass) {
          throw new Error('Current password is incorrect');
        }
        localStorage.setItem('admin_password', newPassword);
        return true;
      }
    },

    // Site Settings Configuration
    getSettings: async () => {
      const defaultSettings = {
        restaurantName: 'Coffee',
        facebookLink: '#',
        instagramLink: '#',
        twitterLink: '#',
        googleMapsEmbed: '',
        openingTime: 'Mon-Fri: 8am to 2pm',
        closingTime: 'Sat-Sun: 11am to 4pm'
      };

      if (isFirebase) {
        const doc = await db.collection('settings').doc('config').get();
        return doc.exists ? { ...defaultSettings, ...doc.data() } : defaultSettings;
      } else {
        const local = localStorage.getItem('settings');
        return local ? { ...defaultSettings, ...JSON.parse(local) } : defaultSettings;
      }
    },

    saveSettings: async (settingsData) => {
      if (isFirebase) {
        return db.collection('settings').doc('config').set(settingsData, { merge: true });
      } else {
        localStorage.setItem('settings', JSON.stringify(settingsData));
        return settingsData;
      }
    },

    // Homepage Images Customization
    getHomepageImages: async () => {
      const defaultImages = {
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
      };

      if (isFirebase) {
        const doc = await db.collection('settings').doc('homepageImages').get();
        return doc.exists ? { ...defaultImages, ...doc.data() } : defaultImages;
      } else {
        const local = localStorage.getItem('homepageImages');
        return local ? { ...defaultImages, ...JSON.parse(local) } : defaultImages;
      }
    },

    saveHomepageImages: async (imagesData) => {
      if (isFirebase) {
        return db.collection('settings').doc('homepageImages').set(imagesData, { merge: true });
      } else {
        localStorage.setItem('homepageImages', JSON.stringify(imagesData));
        return imagesData;
      }
    },

    // Table Bookings Management
    getBookings: async () => {
      if (isFirebase) {
        const snap = await db.collection('bookings').orderBy('createdAt', 'desc').get();
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } else {
        return JSON.parse(localStorage.getItem('bookings') || '[]');
      }
    },

    addBooking: async (bookingData) => {
      const record = {
        name: bookingData.name || '',
        phone: bookingData.phone || '',
        email: bookingData.email || '',
        date: bookingData.date || '',
        time: bookingData.time || '',
        guests: bookingData.guests || '',
        message: bookingData.message || '',
        createdAt: new Date().toISOString()
      };

      if (isFirebase) {
        const docRef = await db.collection('bookings').add(record);
        return { id: docRef.id, ...record };
      } else {
        const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        const fullRecord = { id: generateUUID(), ...record };
        bookings.unshift(fullRecord);
        localStorage.setItem('bookings', JSON.stringify(bookings));
        return fullRecord;
      }
    },

    deleteBooking: async (bookingId) => {
      if (isFirebase) {
        return db.collection('bookings').doc(bookingId).delete();
      } else {
        let bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
        bookings = bookings.filter(b => b.id !== bookingId);
        localStorage.setItem('bookings', JSON.stringify(bookings));
        return true;
      }
    },

    // Gallery / Menu Uploads
    getImages: async () => {
      const defaultImages = [
        { type: 'item', url: 'img/g1.jpg', createdAt: '2026-01-01T00:00:00.000Z' },
        { type: 'item', url: 'img/g2.jpg', createdAt: '2026-01-02T00:00:00.000Z' },
        { type: 'item', url: 'img/g3.jpg', createdAt: '2026-01-03T00:00:00.000Z' },
        { type: 'item', url: 'img/g4.jpg', createdAt: '2026-01-04T00:00:00.000Z' },
        { type: 'item', url: 'img/g5.jpg', createdAt: '2026-01-05T00:00:00.000Z' }
      ];

      if (isFirebase) {
        try {
          const snap = await db.collection('images').orderBy('createdAt', 'desc').get();
          const items = snap.docs.map(doc => doc.data());
          return items.length ? items : defaultImages;
        } catch (e) {
          console.error("Failed to fetch images from Firestore, returning defaults:", e);
          return defaultImages;
        }
      } else {
        const local = JSON.parse(localStorage.getItem('images') || '[]');
        return local.length ? local : defaultImages;
      }
    },

    uploadImage: async (file, type) => {
      const hasCloudinary = window.ENV && window.ENV.CLOUDINARY_CLOUD_NAME && window.ENV.CLOUDINARY_UPLOAD_PRESET;

      if (hasCloudinary) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', window.ENV.CLOUDINARY_UPLOAD_PRESET);
        const cloudName = window.ENV.CLOUDINARY_CLOUD_NAME;

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || 'Cloudinary upload failed');
        }

        const data = await response.json();
        const imageData = {
          url: data.secure_url,
          publicId: data.public_id,
          type: type, // 'menu' or 'item'
          createdAt: new Date().toISOString()
        };

        if (isFirebase) {
          await db.collection('images').add(imageData);
        } else {
          const images = JSON.parse(localStorage.getItem('images') || '[]');
          images.unshift(imageData);
          localStorage.setItem('images', JSON.stringify(images));
        }

        return imageData;
      } else {
        // Fallback: Convert file to Base64 local data URL so it works offline/locally
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async () => {
            const imageData = {
              url: reader.result,
              publicId: 'local-' + Date.now(),
              type: type,
              createdAt: new Date().toISOString()
            };

            try {
              if (isFirebase) {
                await db.collection('images').add(imageData);
              } else {
                const images = JSON.parse(localStorage.getItem('images') || '[]');
                images.unshift(imageData);
                localStorage.setItem('images', JSON.stringify(images));
              }
              resolve(imageData);
            } catch (e) {
              reject(e);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }
    }
  };

  window.dbApi = dbApi;
})();
