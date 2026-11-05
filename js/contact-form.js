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
      if (window.location.protocol === 'file:') {
        throw new Error('Open the website through its host or a local web server before submitting the form.');
      }

      const response = await fetch('https://formsubmit.co/ajax/info@joinlulo.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify(Object.fromEntries(new FormData(contactForm)))
      });
      const result = await response.json();

      const submissionSucceeded = result.success === true || result.success === 'true';
      if (!response.ok || !submissionSucceeded) {
        const serviceMessage = String(result.message || '').toLowerCase();
        if (serviceMessage.includes('activation') || serviceMessage.includes('actived')) {
          status.dataset.state = 'error';
          status.textContent = isEnglish
            ? 'The form still needs activation. Check the inbox and spam folder for info@joinlulo.com, then click FormSubmit’s activation link.'
            : 'Formularen mangler aktivering. Tjek indbakken og spam-mappen for info@joinlulo.com, og klik på aktiveringslinket fra FormSubmit.';
          return;
        }

        throw new Error(result.message || 'The form could not be submitted.');
      }

      contactForm.reset();
      status.textContent = isEnglish
        ? 'Thank you. Your message has been received. If this is the first submission, LULO must confirm the activation email before messages are forwarded.'
        : 'Tak. Din besked er modtaget. Hvis dette er den første indsendelse, skal LULO bekræfte aktiveringsmailen, før beskeder videresendes.';
    } catch (error) {
      status.dataset.state = 'error';
      if (window.location.protocol === 'file:') {
        status.textContent = isEnglish
          ? 'The form cannot be sent from a file opened directly. Open the website through its host or a local web server.'
          : 'Formularen kan ikke sendes fra en fil, der åbnes direkte. Åbn hjemmesiden via webhotellet eller en lokal webserver.';
      } else {
        status.textContent = isEnglish
          ? 'We could not send your message. Please try again or email info@joinlulo.com.'
          : 'Din besked kunne ikke sendes. Prøv igen, eller skriv til info@joinlulo.com.';
      }
    } finally {
      submitButton.disabled = false;
    }
  });
}
