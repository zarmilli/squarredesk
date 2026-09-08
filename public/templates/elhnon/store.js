const SITE_ID = "{{SQUARRE_SITE_ID}}";
const SUPABASE_URL = "https://suwiamrsjmbvhceqxchp.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1d2lhbXJzam1idmhjZXF4Y2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NDM4MDEsImV4cCI6MjA4MDUxOTgwMX0.4V8Ec8pvDYZyM0WYO3ePMa7yrHTuvbVdoCK9eYhH6zk";
const FUNCTIONS_URL = `${SUPABASE_URL}/functions/v1`;

// ── Session management ──────────────────────────────────────────
const session = {
  get() {
    const raw = localStorage.getItem(`session_${SITE_ID}`);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (new Date(data.expires_at) < new Date()) {
      localStorage.removeItem(`session_${SITE_ID}`);
      return null;
    }
    return data;
  },
  set(data) {
    localStorage.setItem(`session_${SITE_ID}`, JSON.stringify(data));
  },
  clear() {
    localStorage.removeItem(`session_${SITE_ID}`);
  },
};

// ── Auth ────────────────────────────────────────────────────────
async function register(email, password, firstName, lastName) {
  const res = await fetch(`${FUNCTIONS_URL}/customer-register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      site_id: SITE_ID,
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  session.set({ token: data.token, customer: data.customer, expires_at: data.expires_at });
  return data.customer;
}

async function login(email, password) {
  const res = await fetch(`${FUNCTIONS_URL}/customer-login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ site_id: SITE_ID, email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  session.set({ token: data.token, customer: data.customer, expires_at: data.expires_at });
  return data.customer;
}

function logout() {
  session.clear();
  updateAuthUI();
}

// ── Cart ────────────────────────────────────────────────────────
async function addToCart(productId, quantity = 1) {
  const s = session.get();
  if (!s) { showLoginModal(); return; }

  await fetch(`${SUPABASE_URL}/rest/v1/cart_items`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify({
      site_id: SITE_ID,
      customer_id: s.customer.id,
      product_id: productId,
      quantity,
    }),
  });

  updateCartCount();
}

async function getCart() {
  const s = session.get();
  if (!s) return [];

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/cart_items?select=*,products(*)&customer_id=eq.${s.customer.id}&site_id=eq.${SITE_ID}`,
    {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
    }
  );
  return res.json();
}

async function removeFromCart(cartItemId) {
  await fetch(`${SUPABASE_URL}/rest/v1/cart_items?id=eq.${cartItemId}`, {
    method: "DELETE",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${ANON_KEY}`,
    },
  });
  renderCart();
}

async function updateCartCount() {
  const cart = await getCart();
  const countEl = document.getElementById("cart-count");
  if (countEl) countEl.textContent = cart.length;
}

// ── Checkout ────────────────────────────────────────────────────
async function checkout(shippingAddress) {
  const s = session.get();
  if (!s) { showLoginModal(); return; }

  const res = await fetch(`${FUNCTIONS_URL}/customer-checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      site_id: SITE_ID,
      session_token: s.token,
      shipping_address: shippingAddress,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error);

  // Redirect to PayFast
  window.location.href = data.paymentUrl;
}

// ── UI helpers ──────────────────────────────────────────────────
function updateAuthUI() {
  const s = session.get();
  const loggedInEls = document.querySelectorAll("[data-auth='logged-in']");
  const loggedOutEls = document.querySelectorAll("[data-auth='logged-out']");
  const nameEls = document.querySelectorAll("[data-customer='name']");

  loggedInEls.forEach(el => el.style.display = s ? "" : "none");
  loggedOutEls.forEach(el => el.style.display = s ? "none" : "");
  nameEls.forEach(el => el.textContent = s ? s.customer.first_name : "");
}

function showLoginModal() {
  const modal = document.getElementById("login-modal");
  if (modal) modal.style.display = "flex";
}

// ── Init ────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI();
  updateCartCount();
});