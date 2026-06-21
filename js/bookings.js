(function () {
  const form = document.querySelector('[data-booking-form]');
  const message = document.querySelector('[data-booking-message]');
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (message) message.textContent = 'Sending your booking...';
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Booking failed');
      form.reset();
      if (message) message.textContent = 'Thank you. Your table request has been sent.';
    } catch (error) {
      if (message) message.textContent = error.message;
    }
  });
})();
