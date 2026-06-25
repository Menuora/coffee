(function () {
  const target = document.querySelector('[data-gallery-list]');
  if (!target) return;

  function card(image) {
    const label = image.type === 'menu' ? 'Full Menu' : 'Menu Item';
    return `
      <div class="col-lg-4 col-md-6">
        <a href="${image.url}" class="img-pop-home gallery-card">
          <img class="img-fluid" src="${image.url}" alt="${label}">
          <span>${label}</span>
        </a>
      </div>`;
  }

  dbApi.getImages()
    .then((images) => {
      target.innerHTML = images.length
        ? images.map(card).join('')
        : '<div class="col-12 text-center"><p>No menu images have been uploaded yet.</p></div>';
    })
    .catch(() => {
      target.innerHTML = '<div class="col-12 text-center"><p>Gallery is not available right now.</p></div>';
    });
})();
