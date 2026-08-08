/**
 * app.js — Routeur SPA et navigation Yooza Avis V1
 * --------------------------------------------------
 * Navigation hash-based : #/dashboard, #/clients, #/client/:id, #/settings
 * État global, toast, modal, sidebar mobile.
 */

// ---------------------------------------------------------------------------
// État global de l'application
// ---------------------------------------------------------------------------
var AppState = {
  currentRoute: null,
  settings: null,
  clients: null,
};

function initAppState() {
  AppState.settings = JSON.parse(localStorage.getItem('yooza_settings') || 'null') || copyObj(DEFAULT_SETTINGS);
  AppState.clients  = JSON.parse(localStorage.getItem('yooza_clients')  || 'null') || DEMO_CLIENTS.map(copyObj);
}

function copyObj(o) { return JSON.parse(JSON.stringify(o)); }

function saveClients()  { localStorage.setItem('yooza_clients',  JSON.stringify(AppState.clients));  }
function saveSettings() { localStorage.setItem('yooza_settings', JSON.stringify(AppState.settings)); }

// ---------------------------------------------------------------------------
// Routeur
// ---------------------------------------------------------------------------
function navigate(path) {
  window.location.hash = path;
}

function getPageTitle(hash) {
  if (hash.startsWith('#/client/'))  return 'Fiche client';
  if (hash === '#/clients')          return 'Clients';
  if (hash === '#/settings')         return 'Réglages';
  return 'Tableau de bord';
}

function getActiveRoute(hash) {
  if (hash.startsWith('#/client/')) return '/clients';
  if (hash === '#/clients')         return '/clients';
  if (hash === '#/settings')        return '/settings';
  return '/dashboard';
}

function handleRoute() {
  var hash = window.location.hash || '#/dashboard';
  AppState.currentRoute = hash;

  // Titre topbar
  var titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = getPageTitle(hash);

  // Nav active
  var activeRoute = getActiveRoute(hash);
  document.querySelectorAll('.nav-item').forEach(function(item) {
    item.classList.remove('active');
    if (item.dataset.route === activeRoute) item.classList.add('active');
  });

  // Rendu
  var contentEl = document.getElementById('page-content');
  if (!contentEl) return;
  contentEl.innerHTML = '';

  if (hash.startsWith('#/client/')) {
    var id = hash.split('/')[2];
    renderClientDetail(contentEl, id);
  } else if (hash === '#/clients') {
    renderClients(contentEl);
  } else if (hash === '#/settings') {
    renderSettings(contentEl);
  } else {
    renderDashboard(contentEl);
  }

  closeSidebar();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', handleRoute);

// ---------------------------------------------------------------------------
// Sidebar mobile
// ---------------------------------------------------------------------------
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('visible');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  var s = document.getElementById('sidebar');
  var o = document.getElementById('sidebar-overlay');
  if (s) s.classList.remove('open');
  if (o) o.classList.remove('visible');
  document.body.style.overflow = '';
}

// ---------------------------------------------------------------------------
// Toast notifications
// ---------------------------------------------------------------------------
function showToast(message, type, duration) {
  type = type || 'default';
  duration = duration || 3500;
  var container = document.getElementById('toast-container');
  if (!container) return;
  var toast = document.createElement('div');
  toast.className = 'toast ' + type;
  var icons = { success: '✓', error: '✕', default: 'ℹ' };
  toast.innerHTML = '<span style="font-weight:700;font-size:1rem">' + (icons[type] || icons.default) + '</span> ' + message;
  container.appendChild(toast);
  setTimeout(function() {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(110%)';
    toast.style.transition = 'all 0.25s ease';
    setTimeout(function() { if (toast.parentNode) toast.remove(); }, 260);
  }, duration);
}

// ---------------------------------------------------------------------------
// Modal générique
// ---------------------------------------------------------------------------
function openModal(titleText, bodyHTML, footerHTML) {
  var overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = titleText;
  document.getElementById('modal-body').innerHTML = bodyHTML;
  document.getElementById('modal-footer').innerHTML = footerHTML;
  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  var overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.classList.add('hidden');
  document.body.style.overflow = '';
}

// ---------------------------------------------------------------------------
// Date topbar
// ---------------------------------------------------------------------------
function updateTopbarDate() {
  var now = new Date();
  var options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  var dateStr = now.toLocaleDateString('fr-FR', options);
  var el = document.getElementById('topbar-date');
  if (el) el.textContent = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
}

// ---------------------------------------------------------------------------
// Initialisation au chargement
// ---------------------------------------------------------------------------
function initApp() {
  initAppState();
  updateTopbarDate();
  handleRoute();
}
