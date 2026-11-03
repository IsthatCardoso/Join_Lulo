// Scroll animation: elements with .reveal fade in as they enter the screen.
document.documentElement.classList.add('js');

// Hide the navigation while scrolling down and reveal it while scrolling up.
const nav = document.querySelector('.nav');
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('#primary-navigation');
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
  const currentScrollY = window.scrollY;
  const scrollDelta = currentScrollY - lastScrollY;

  if (nav.classList.contains('nav-menu-open')) {
    nav.classList.remove('nav-hidden');
    lastScrollY = currentScrollY;
    return;
  }

  if (currentScrollY <= 24) {
    nav.classList.remove('nav-hidden');
    lastScrollY = currentScrollY;
    return;
  }

  if (Math.abs(scrollDelta) >= 8) {
    nav.classList.toggle('nav-hidden', scrollDelta > 0);
    lastScrollY = currentScrollY;
  }
}, { passive: true });

// Keep the navigation available when a keyboard user tabs into it.
nav.addEventListener('focusin', () => nav.classList.remove('nav-hidden'));

// Toggle the compact navigation on small screens and keep its state accessible.
const closeNavigationMenu = () => {
  nav.classList.remove('nav-menu-open');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', document.documentElement.lang === 'en' ? 'Open menu' : 'Åbn menu');
};

navToggle.addEventListener('click', () => {
  const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
  nav.classList.toggle('nav-menu-open', !isOpen);
  navToggle.setAttribute('aria-expanded', String(!isOpen));
  const labels = document.documentElement.lang === 'en'
    ? ['Open menu', 'Close menu']
    : ['Åbn menu', 'Luk menu'];
  navToggle.setAttribute('aria-label', isOpen ? labels[0] : labels[1]);
});

navMenu.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeNavigationMenu();
});

document.addEventListener('pointerdown', (event) => {
  if (!nav.contains(event.target)) closeNavigationMenu();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav.classList.contains('nav-menu-open')) {
    closeNavigationMenu();
    navToggle.focus();
  }
});

// Let visitors expand the hero video without displaying its sound controls.
const hero = document.querySelector('.hero');
const heroVideo = document.querySelector('.hero-video');
const fullscreenButton = document.querySelector('.hero-fullscreen');

// The homepage has a looping hero video; secondary pages do not.
if (hero && heroVideo && fullscreenButton) {
  // Play the two smaller hero-video files one after the other, then repeat.
  const heroVideoParts = [
    'assets/frontpage/LULO_finalvideo-hero-part1.mp4',
    'LULO_finalvideo-hero-part2.mp4'
  ];
  let currentHeroVideoPart = 0;
  let nextHeroPartPreloader = null;

  // Load the next part shortly before the current one ends to reduce pauses.
  heroVideo.addEventListener('timeupdate', () => {
    const timeRemaining = heroVideo.duration - heroVideo.currentTime;

    if (timeRemaining <= 4 && !nextHeroPartPreloader) {
      const nextPart = (currentHeroVideoPart + 1) % heroVideoParts.length;
      nextHeroPartPreloader = document.createElement('video');
      nextHeroPartPreloader.preload = 'auto';
      nextHeroPartPreloader.src = heroVideoParts[nextPart];
      nextHeroPartPreloader.load();
    }
  });

  heroVideo.addEventListener('ended', () => {
    currentHeroVideoPart = (currentHeroVideoPart + 1) % heroVideoParts.length;
    heroVideo.src = heroVideoParts[currentHeroVideoPart];
    heroVideo.load();
    heroVideo.play().catch(() => {});
    nextHeroPartPreloader = null;
  });

  fullscreenButton.addEventListener('click', async () => {
    if (document.fullscreenElement === hero) {
      await document.exitFullscreen();
    } else if (hero.requestFullscreen) {
      await hero.requestFullscreen();
    }
  });

  document.addEventListener('fullscreenchange', () => {
    const isFullscreen = document.fullscreenElement === hero;
    fullscreenButton.textContent = isFullscreen ? '×' : '⛶';
    const labels = document.documentElement.lang === 'en'
      ? ['Exit full screen', 'View hero in full screen']
      : ['Afslut fuld skærm', 'Vis hero i fuld skærm'];
    fullscreenButton.setAttribute('aria-label', isFullscreen ? labels[0] : labels[1]);
    fullscreenButton.title = isFullscreen ? labels[0] : (document.documentElement.lang === 'en' ? 'View in full screen' : 'Vis i fuld skærm');
  });
}

const items = document.querySelectorAll('.reveal');

// Stagger siblings so a row of cards appears one after another
items.forEach(el => {
  const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
  el.style.setProperty('--i', siblings.indexOf(el));
});

if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });
  items.forEach(el => io.observe(el));
} else {
  items.forEach(el => el.classList.add('in'));
}

