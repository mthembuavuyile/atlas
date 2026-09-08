/**
 * Atlas Website Common Navigation & Mobile Drawer Controller
 * Provides accessible burger menu toggling, Escape dismiss, backdrop clicks,
 * scroll locking, and robust active route detection across all public pages.
 */
document.addEventListener('DOMContentLoaded', () => {
  const burgerBtn = document.getElementById('siteBurgerBtn');
  const mobileDrawer = document.getElementById('siteMobileDrawer');
  const backdropOverlay = document.getElementById('siteBackdropOverlay');
  const allNavLinks = document.querySelectorAll('.site-nav-link, .mobile-drawer-link');

  if (!burgerBtn || !mobileDrawer) return;

  function openMenu() {
    burgerBtn.setAttribute('aria-expanded', 'true');
    burgerBtn.setAttribute('aria-label', 'Close navigation menu');
    mobileDrawer.classList.add('active');
    if (backdropOverlay) backdropOverlay.classList.add('active');
    document.body.classList.add('site-menu-locked');
  }

  function closeMenu() {
    burgerBtn.setAttribute('aria-expanded', 'false');
    burgerBtn.setAttribute('aria-label', 'Open navigation menu');
    mobileDrawer.classList.remove('active');
    if (backdropOverlay) backdropOverlay.classList.remove('active');
    document.body.classList.remove('site-menu-locked');
  }

  function toggleMenu() {
    const isExpanded = burgerBtn.getAttribute('aria-expanded') === 'true';
    if (isExpanded) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  // Toggle button click
  burgerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Click backdrop overlay to close
  if (backdropOverlay) {
    backdropOverlay.addEventListener('click', () => {
      closeMenu();
    });
  }

  // Close when clicking any link in the mobile drawer
  mobileDrawer.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  // Close on Escape key press
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && burgerBtn.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      burgerBtn.focus();
    }
  });

  // Close on window resize if widening past mobile threshold
  window.addEventListener('resize', () => {
    if (window.innerWidth > 860 && burgerBtn.getAttribute('aria-expanded') === 'true') {
      closeMenu();
    }
  });

  // Automatic Active Link Highlighting with clean path normalization
  try {
    const normalizeRoute = (rawPath) => {
      if (!rawPath) return '';
      let p = rawPath.split('#')[0].split('?')[0].trim();
      p = p.replace(/\.html$/, '').replace(/\/$/, '') || '/';
      if (p === '/capabilities') p = '/docs';
      return p;
    };

    const currentNormalized = normalizeRoute(window.location.pathname);
    const currentHash = window.location.hash;

    allNavLinks.forEach(link => {
      const linkHref = link.getAttribute('href');
      if (!linkHref || linkHref.startsWith('http')) return;

      // Special handling for hash anchor links
      if (linkHref.includes('#')) {
        const [basePath, targetHash] = linkHref.split('#');
        const normalizedBase = normalizeRoute(basePath) || currentNormalized;
        if (normalizedBase === currentNormalized && currentHash === '#' + targetHash) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
        return;
      }

      const linkNormalized = normalizeRoute(linkHref);

      if (linkNormalized === currentNormalized && !currentHash) {
        link.classList.add('active');
      } else if (currentNormalized !== '/' && linkNormalized !== currentNormalized) {
        link.classList.remove('active');
      }
    });
  } catch (err) {
    console.debug('Active link match notice:', err);
  }
});
