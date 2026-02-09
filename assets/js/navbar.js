function loadNavbar() {
  const navbarHTML = `
    <nav class="navbar">
      <div class="navbar-content">
        <div class="navbar-brand">
          <h1 class="navbar-title">🎰 Rifa Digital</h1>
        </div>
        <ul class="nav-links">
          <li><a href="/" class="nav-link" data-page="inicio">Inicio</a></li>
          <li><a href="/pages/buyers.html" class="nav-link" data-page="buyers">Compradores</a></li>
          <li><a href="/pages/manager.html" class="nav-link" data-page="manager">Administración</a></li>
          <li class="nav-user">
            <span class="user-info" id="userInfo">Usuario</span>
            <a href="#" class="nav-link logout-btn" id="logoutBtn">Cerrar Sesión</a>
          </li>
        </ul>
      </div>
    </nav>
  `;

  // Insertar navbar al inicio del body
  const body = document.body;
  if (body.firstChild) {
    body.insertBefore(
      document.createRange().createContextualFragment(navbarHTML),
      body.firstChild,
    );
  } else {
    body.innerHTML = navbarHTML + body.innerHTML;
  }

  // Marcar página activa
  setActiveNavLink();

  // Mostrar usuario logueado
  updateUserInfo();

  // Evento de logout
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }
}

function setActiveNavLink() {
  const currentPath = window.location.pathname.toLowerCase();
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    const href = link.getAttribute("href");

    // Marcar como activo si coincide
    if (
      href === currentPath ||
      (href === "/" &&
        (currentPath === "/" || currentPath === "/index.html")) ||
      (href === "/compradores" &&
        (currentPath === "/compradores" ||
          currentPath === "/pages/buyers.html")) ||
      (href === "/admin" &&
        (currentPath === "/admin" || currentPath === "/pages/manager.html"))
    ) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });
}

function updateUserInfo() {
  const userInfo = document.getElementById("userInfo");
  const authUser = localStorage.getItem("authUser");

  if (authUser) {
    try {
      const user = JSON.parse(authUser);
      userInfo.textContent = user.username || "Usuario";
    } catch (e) {
      userInfo.textContent = "Usuario";
    }
  } else {
    userInfo.textContent = "Invitado";
  }
}

function handleLogout(e) {
  e.preventDefault();

  if (confirm("¿Deseas cerrar sesión?")) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    window.location.href = "../login/login.html";
  }
}

// Cargar navbar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", loadNavbar);
