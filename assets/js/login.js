const API_BASE = "http://localhost:3000";

async function loginRequest(username, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      payload?.message || payload?.error || "Error en el inicio de sesión";
    const err = new Error(message);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }
  return payload;
}

function showFormMessage(form, text, isError = true) {
  let el = form.querySelector(".form-message");
  if (!el) {
    el = document.createElement("div");
    el.className = "form-message";
    el.setAttribute("role", "alert");
    el.style.marginTop = "0.5rem";
    el.style.fontSize = "0.95rem";
    form.prepend(el);
  }
  el.textContent = text;
  el.style.color = isError ? "#b91c1c" : "#065f46";
}

async function handleLoginSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const user = form.querySelector("#user")?.value?.trim() || "";
  const password = form.querySelector("#password")?.value || "";
  if (!user || !password) {
    showFormMessage(form, "Por favor completa el usuario y la contraseña.");
    return;
  }
  try {
    const resp = await loginRequest(user, password);
    const token = resp?.token || resp?.accessToken || resp?.access_token;
    if (token) {
      localStorage.setItem("authToken", token);
    }
    if (resp?.user) {
      try {
        localStorage.setItem("authUser", JSON.stringify(resp.user));
      } catch (e) {}
    }
    showFormMessage(form, "Inicio de sesión exitoso. Redirigiendo...", false);
    setTimeout(() => {
      window.location.href = resp?.redirect || "../pages/buyers.html";
    }, 700);
  } catch (err) {
    const msg = err?.message || "No se pudo iniciar sesión";
    showFormMessage(form, msg, true);
  }
}

// Helper para obtener el token almacenado
function getAuthToken() {
  return localStorage.getItem("authToken");
}

// Helper para hacer peticiones autenticadas
async function authenticatedFetch(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

// Helper para verificar si el usuario está autenticado
function isAuthenticated() {
  return !!getAuthToken();
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".login-form");
  if (form) form.addEventListener("submit", handleLoginSubmit);
});

window.loginModule = {
  loginRequest,
  handleLoginSubmit,
  getAuthToken,
  authenticatedFetch,
  isAuthenticated,
};
