(function () {
  const fallbackImages = {
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

  function setText(selector, value) {
    document.querySelectorAll(selector).forEach((node) => {
      if (value) node.textContent = value;
    });
  }

  function setHref(selector, value) {
    document.querySelectorAll(selector).forEach((node) => {
      if (value && value !== '#') node.href = value;
    });
  }

  function setBackground(selector, value) {
    const image = value || fallbackImages.heroImage1;
    document.querySelectorAll(selector).forEach((node) => {
      node.style.backgroundImage = `url("${image}")`;
      node.style.backgroundSize = 'cover';
      node.style.backgroundPosition = 'center';
    });
  }

  function setImage(selector, value) {
    document.querySelectorAll(selector).forEach((node) => {
      if (value) node.src = value;
    });
  }

  function renderMap(src) {
    document.querySelectorAll('[data-map-frame]').forEach((node) => {
      if (!src) return;
      node.innerHTML = `<iframe src="${src}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`;
    });
  }

  window.siteSettingsReady = Promise.all([
    dbApi.getSettings(),
    dbApi.getHomepageImages()
  ])
    .then(([settings, homepageImages]) => {
      const images = Object.assign({}, fallbackImages, homepageImages || {});
      document.title = settings.restaurantName || document.title;
      setText('[data-setting="restaurantName"]', settings.restaurantName);
      setText('[data-setting="openingTime"]', settings.openingTime);
      setText('[data-setting="closingTime"]', settings.closingTime);
      setHref('[data-setting-link="facebookLink"]', settings.facebookLink);
      setHref('[data-setting-link="instagramLink"]', settings.instagramLink);
      setHref('[data-setting-link="twitterLink"]', settings.twitterLink);
      setBackground('[data-image-bg="heroImage1"]', images.heroImage1);
      setBackground('[data-image-bg="heroImage2"]', images.heroImage2);
      setBackground('[data-image-bg="galleryHeaderImage"]', images.galleryHeaderImage);
      setBackground('[data-image-bg="menuHeaderImage"]', images.menuHeaderImage);
      setBackground('[data-image-bg="contactHeaderImage"]', images.contactHeaderImage);
      setImage('[data-image="heroImage1Secondary"]', images.heroImage1Secondary);
      setImage('[data-image="heroImage2Secondary"]', images.heroImage2Secondary);
      setImage('[data-image="aboutImage1"]', images.aboutImage1);
      setImage('[data-image="aboutImage2"]', images.aboutImage2);
      setImage('[data-image="bookingImage"]', images.bookingImage);
      renderMap(settings.googleMapsEmbed);
      return { settings, homepageImages };
    })
    .catch((err) => {
      console.error(err);
      return null;
    });
})();
