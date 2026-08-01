/* =====================================================
   SmartCart — API Client & Shared Utilities
   ===================================================== */
const API_BASE = '/api';

// ── Auth State ────────────────────────────────────────
const Auth = {
  getToken: () => localStorage.getItem('sc_token'),
  getUser: () => { try { return JSON.parse(localStorage.getItem('sc_user')); } catch { return null; } },
  setSession: (token, user) => { localStorage.setItem('sc_token', token); localStorage.setItem('sc_user', JSON.stringify(user)); },
  clearSession: () => { localStorage.removeItem('sc_token'); localStorage.removeItem('sc_user'); },
  isLoggedIn: () => !!localStorage.getItem('sc_token'),
  isAdmin: () => { const u = Auth.getUser(); return u?.role === 'admin'; },
};

// ── Core Fetch ────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const token = Auth.getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    const data = await res.json();
    if (res.status === 401 && !endpoint.includes('/auth/')) {
      Auth.clearSession();
      window.location.href = '/pages/login.html?redirect=' + encodeURIComponent(window.location.pathname);
      return;
    }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error('API Error:', err);
    return { ok: false, data: { message: 'Network error. Please check your connection.' } };
  }
}

// ── API Modules ───────────────────────────────────────
const AuthAPI = {
  register: (body) => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  getMe: () => apiFetch('/auth/me'),
  updateProfile: (body) => apiFetch('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
  changePassword: (body) => apiFetch('/auth/change-password', { method: 'PUT', body: JSON.stringify(body) }),
  addAddress: (body) => apiFetch('/auth/address', { method: 'POST', body: JSON.stringify(body) }),
  updateAddress: (id, body) => apiFetch(`/auth/address/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAddress: (id) => apiFetch(`/auth/address/${id}`, { method: 'DELETE' }),
  forgotPassword: (email) => apiFetch('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token, password) => apiFetch(`/auth/reset-password/${token}`, { method: 'PUT', body: JSON.stringify({ password }) }),
  toggleWishlist: (productId) => apiFetch(`/auth/wishlist/${productId}`, { method: 'POST' }),
  getWishlist: () => apiFetch('/auth/wishlist'),
};

const ProductAPI = {
  getAll: (params = {}) => apiFetch(`/products?${new URLSearchParams(params)}`),
  getOne: (id) => apiFetch(`/products/${id}`),
  getCategories: () => apiFetch('/products/categories'),
  getFeatured: () => apiFetch('/products?featured=true&limit=20'),
  create: (body) => apiFetch('/products', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => apiFetch(`/products/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id) => apiFetch(`/products/${id}`, { method: 'DELETE' }),
  addReview: (id, body) => apiFetch(`/products/${id}/review`, { method: 'POST', body: JSON.stringify(body) }),
};

const CartAPI = {
  get: () => apiFetch('/cart'),
  add: (productId, quantity = 1) => apiFetch('/cart', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
  update: (productId, quantity) => apiFetch(`/cart/${productId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  remove: (productId) => apiFetch(`/cart/${productId}`, { method: 'DELETE' }),
  clear: () => apiFetch('/cart', { method: 'DELETE' }),
};

const OrderAPI = {
  createRazorpayOrder: (amount) => apiFetch('/orders/create-razorpay-order', { method: 'POST', body: JSON.stringify({ amount }) }),
  create: (body) => apiFetch('/orders', { method: 'POST', body: JSON.stringify(body) }),
  getMyOrders: () => apiFetch('/orders/my-orders'),
  getOne: (id) => apiFetch(`/orders/${id}`),
  cancel: (id, reason) => apiFetch(`/orders/${id}/cancel`, { method: 'PUT', body: JSON.stringify({ reason }) }),
  getAll: (params = {}) => apiFetch(`/orders?${new URLSearchParams(params)}`),
  updateStatus: (id, status, note) => apiFetch(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status, note }) }),
  getStats: () => apiFetch('/orders/stats'),
};

// ── Cart Badge ────────────────────────────────────────
async function updateCartBadge() {
  if (!Auth.isLoggedIn()) {
    document.querySelectorAll('.cart-count').forEach(el => { el.textContent = '0'; el.style.display = 'none'; });
    return;
  }
  const res = await CartAPI.get();
  if (res?.ok) {
    const count = res.data.cart?.totalItems || 0;
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'inline-flex' : 'none';
    });
  }
}

// ── Toast Notifications ───────────────────────────────
function showToast(message, type = 'success', duration = 3000) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || '✓'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, duration);
}

// ── Format Helpers ────────────────────────────────────
const fmt = {
  price: (n) => '₹' + Number(n).toLocaleString('en-IN'),
  date: (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
  dateTime: (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  relTime: (d) => {
    const diff = Date.now() - new Date(d);
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return days + ' days ago';
    return fmt.date(d);
  },
};

// ── Ratings helper ─────────────────────────────────── 
function ratingClass(r) {
  if (r >= 4) return '';
  if (r >= 3) return 'low';
  return 'poor';
}

// ── Navbar Render ─────────────────────────────────────
function renderNavbar() {
  const user = Auth.getUser();
  const nav = document.getElementById('navbar');
  if (!nav) return;

  nav.innerHTML = `
<nav class="navbar">
  <div class="nav-inner">
    <a href="/index.html" class="nav-logo">
      <div class="brand">Smart<span>Cart</span></div>
      <div class="tagline">Explore Plus</div>
    </a>
    <form class="nav-search" id="navSearchForm">
      <input type="text" id="navSearchInput" placeholder="Search for products, brands and more" autocomplete="off"/>
      <button type="submit">🔍</button>
    </form>
    <div class="nav-actions">
      ${user ? `
      <div class="dropdown-container">
        <button class="nav-btn dropdown-toggle">
          👤 ${user.name.split(' ')[0]} <span style="font-size:10px">▾</span>
        </button>
        <div class="dropdown-menu" id="userDropdown">
          <div class="menu-header">Hello, ${user.name.split(' ')[0]}</div>
          <a href="/pages/profile.html">👤 My Profile</a>
          <a href="/pages/orders.html">📦 Orders</a>
          <a href="/pages/wishlist.html">❤️ Wishlist</a>
          ${user.role === 'admin' ? '<a href="/pages/admin.html">⚙️ Admin Panel</a>' : ''}
          <hr/>
          <button id="logoutBtn">🚪 Logout</button>
        </div>
      </div>` :
      `<a href="/pages/login.html" class="nav-btn">Login / Register</a>`}
      <a href="/pages/cart.html" class="nav-btn">
        🛒 Cart <span class="cart-count" style="display:none">0</span>
      </a>
    </div>
  </div>
  <div class="nav-categories">
    <div class="container">
      <a href="/pages/products.html?category=Electronics">Electronics</a>
      <a href="/pages/products.html?category=Mobile+Phones">Mobiles</a>
      <a href="/pages/products.html?category=Laptops">Laptops</a>
      <a href="/pages/products.html?category=Fashion">Fashion</a>
      <a href="/pages/products.html?category=Home+%26+Kitchen">Home</a>
      <a href="/pages/products.html?category=Beauty">Beauty</a>
      <a href="/pages/products.html?category=Sports">Sports</a>
      <a href="/pages/products.html?category=Books">Books</a>
      <a href="/pages/products.html?category=Toys">Toys</a>
      <a href="/pages/products.html?category=Grocery">Grocery</a>
    </div>
  </div>
</nav>`;

  // Search
  document.getElementById('navSearchForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = document.getElementById('navSearchInput').value.trim();
    if (q) window.location.href = `/pages/products.html?search=${encodeURIComponent(q)}`;
  });

  // Dropdown toggle
  const toggle = nav.querySelector('.dropdown-toggle');
  const dropdown = document.getElementById('userDropdown');
  if (toggle && dropdown) {
    toggle.addEventListener('click', (e) => { e.stopPropagation(); dropdown.classList.toggle('show'); });
    document.addEventListener('click', () => dropdown.classList.remove('show'));
  }

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    Auth.clearSession();
    showToast('Logged out successfully');
    setTimeout(() => window.location.href = '/index.html', 600);
  });

  updateCartBadge();
}

// ── Footer Render ─────────────────────────────────────
function renderFooter() {
  const footer = document.getElementById('footer');
  if (!footer) return;
  footer.innerHTML = `
<footer>
  <div class="footer-top">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-col">
          <h4>About</h4>
          <a href="#">About Us</a><a href="#">Careers</a><a href="#">Blog</a>
          <a href="#">Press</a><a href="#">Corporate Information</a>
        </div>
        <div class="footer-col">
          <h4>Help</h4>
          <a href="#">Payments</a><a href="#">Shipping</a><a href="#">Cancellation & Returns</a>
          <a href="#">FAQ</a><a href="#">Report Infringement</a>
        </div>
        <div class="footer-col">
          <h4>Policy</h4>
          <a href="#">Return Policy</a><a href="#">Terms Of Use</a><a href="#">Security</a>
          <a href="#">Privacy</a><a href="#">Sitemap</a>
        </div>
        <div class="footer-col">
          <h4>Social</h4>
          <a href="#">Facebook</a><a href="#">Twitter</a><a href="#">YouTube</a><a href="#">Instagram</a>
        </div>
      </div>
    </div>
  </div>
  <div class="container">
    <div class="footer-bottom">
      <div class="footer-logo">Smart<span>Cart</span></div>
      <div class="footer-copy">© 2024 SmartCart.com — India's Smartest Shopping Destination</div>
      <div class="footer-payments">
        <span class="payment-icon">💳 Visa</span>
        <span class="payment-icon">💳 Mastercard</span>
        <span class="payment-icon">📱 UPI</span>
        <span class="payment-icon">📦 COD</span>
      </div>
    </div>
  </div>
</footer>`;
}

// ── Wishlist State ─────────────────────────────────────
const wishlistSet = new Set();
async function loadWishlist() {
  if (!Auth.isLoggedIn()) return;
  const res = await AuthAPI.getWishlist();
  if (res?.ok) res.data.wishlist?.forEach(p => wishlistSet.add(p._id || p));
}

// ── Product Card Builder ───────────────────────────────
function buildProductCard(p, inWishlist = false) {
  const discount = p.originalPrice > p.price ? Math.round((p.originalPrice - p.price) / p.originalPrice * 100) : 0;
  const rc = p.rating >= 4 ? '' : p.rating >= 3 ? ' low' : ' poor';
  return `
<div class="product-card" onclick="window.location.href='/pages/product.html?id=${p._id}'">
  ${discount > 10 ? `<span class="offer-badge">${discount}% off</span>` : ''}
  <button class="wishlist-btn ${inWishlist ? 'active' : ''}" data-id="${p._id}" onclick="toggleWish(event,'${p._id}')">❤</button>
  <div class="product-img-wrap">
    <img src="${p.images?.[0] || 'https://via.placeholder.com/160x160?text=No+Image'}" alt="${p.name}" loading="lazy"/>
  </div>
  <div class="product-name" title="${p.name}">${p.name}</div>
  ${p.rating > 0 ? `<div class="product-rating">
    <span class="rating-badge${rc}">${p.rating.toFixed(1)}★</span>
    <span class="rating-count">(${p.numReviews?.toLocaleString('en-IN')})</span>
  </div>` : ''}
  <div class="product-price">
    <span class="price-current">${fmt.price(p.price)}</span>
    ${discount > 0 ? `<span class="price-original">${fmt.price(p.originalPrice)}</span><span class="price-discount">${discount}% off</span>` : ''}
  </div>
</div>`;
}

function getDeliveryDate(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

async function toggleWish(e, productId) {
  e.stopPropagation();
  if (!Auth.isLoggedIn()) { window.location.href = '/pages/login.html'; return; }
  const btn = e.currentTarget;
  const res = await AuthAPI.toggleWishlist(productId);
  if (res?.ok) {
    const added = res.data.added;
    btn.classList.toggle('active', added);
    if (added) { wishlistSet.add(productId); showToast('Added to Wishlist', 'success'); }
    else { wishlistSet.delete(productId); showToast('Removed from Wishlist', 'info'); }
  }
}

// ── Init ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  renderFooter();
  loadWishlist();

  // ── Auto-inject SmartCart AI Chatbot widget ────────────────────
  // This loads the floating AI assistant on every page automatically
  if (!document.getElementById('sc-chat-widget')) {
    const chatScript = document.createElement('script');
    chatScript.src = '/js/chatbot.js';
    chatScript.defer = true;
    document.body.appendChild(chatScript);
  }
});
