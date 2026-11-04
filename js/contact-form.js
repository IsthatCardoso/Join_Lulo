// Send contact-form submissions through FormSubmit without leaving the page.
const contactForm = document.querySelector('#contact-form');

if (contactForm) {
  contactForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = contactForm.querySelector('button[type="submit"]');
    const status = document.querySelector('#contact-form-status');
    const isEnglish = document.documentElement.lang === 'en';

    submitButton.disabled = true;
    status.removeAttribute('data-state');
    status.textContent = isEnglish ? 'Sending your message…' : 'Sender din besked…';

    try {
      const response = await fetch('https://formsubmit.co/ajax/info@joinlulo.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(new FormData(contactForm)))
      });
      const result = await response.json();

      if (!response.ok || result.success === false || result.success === 'false') {
        throw new Error('The form could not be submitted.');
      }

      contactForm.reset();
      status.textContent = isEnglish
        ? 'Thank you. Your message has been received. If this is the first submission, LULO must confirm the activation email before messages are forwarded.'
        : 'Tak. Din besked er modtaget. Hvis dette er den første indsendelse, skal LULO bekræfte aktiveringsmailen, før beskeder videresendes.';
    } catch (error) {
      status.dataset.state = 'error';
      status.textContent = isEnglish
        ? 'We could not send your message. Please try again or email info@joinlulo.com.'
        : 'Din besked kunne ikke sendes. Prøv igen, eller skriv til info@joinlulo.com.';
    } finally {
      submitButton.disabled = false;
    }
  });
}
