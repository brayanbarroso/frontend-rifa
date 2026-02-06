// Configuración de la API
//const API_BASE = "http://localhost:3000"; //Api para desarrollo local
const API_BASE = "https://backend-rifa-mu.vercel.app/"; //Api para desarrollo producción, cambiar a la URL del servidor real cuando se despliegue

// ==================== PROTECCIÓN DE RUTA ====================
// Verificar autenticación antes de cargar la página
function protectRoute() {
  const token = localStorage.getItem("authToken");
  const user = localStorage.getItem("authUser");

  if (!token || !user) {
    console.warn("No hay sesión activa. Redirigiendo a login...");
    window.location.href = "../login/login.html";
    return false;
  }

  console.log("✓ Sesión activa - Acceso permitido");
  return true;
}

// Ejecutar protección inmediatamente
if (!protectRoute()) {
  // Si no hay sesión, detener la ejecución
  throw new Error("Acceso denegado - No hay sesión activa");
}

// ==================== ESTADO GLOBAL ====================
let allBuyers = [];
let filteredBuyers = [];
let currentPage = 1;
const itemsPerPage = 10;

// ==================== INICIALIZACIÓN ====================
document.addEventListener("DOMContentLoaded", () => {
  initializePage();
  setupEventListeners();
});

async function initializePage() {
  showLoading(true);
  try {
    await Promise.all([loadStats(), loadBuyers()]);
    filterAndSortBuyers();
    renderTable();
  } catch (error) {
    showError("Error al cargar los datos. Por favor, intenta de nuevo.");
    console.error("Error:", error);
  } finally {
    showLoading(false);
  }
}

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
  // Búsqueda
  const searchInput = document.getElementById("search-input");
  searchInput.addEventListener("input", (e) => {
    currentPage = 1;
    filterAndSortBuyers();
    renderTable();
  });

  // Ordenamiento
  const sortSelect = document.getElementById("sort-select");
  sortSelect.addEventListener("change", () => {
    currentPage = 1;
    filterAndSortBuyers();
    renderTable();
  });

  // Limpiar filtros
  const clearBtn = document.getElementById("clear-filters-btn");
  clearBtn.addEventListener("click", () => {
    document.getElementById("search-input").value = "";
    document.getElementById("sort-select").value = "fecha-desc";
    currentPage = 1;
    filterAndSortBuyers();
    renderTable();
  });

  // Logout
  const logoutBtn = document.querySelector(".logout-btn");
  logoutBtn.addEventListener("click", handleLogout);
}

// ==================== CARGAR DATOS ====================
async function loadStats() {
  try {
    const response = await fetch(`${API_BASE}/stats`);
    if (!response.ok) throw new Error("Error al obtener estadísticas");

    const stats = await response.json();
    updateStats(stats);
  } catch (error) {
    console.error("Error cargando estadísticas:", error);
  }
}

async function loadBuyers() {
  try {
    const response = await fetch(`${API_BASE}/buyers`);
    if (!response.ok) throw new Error("Error al obtener compradores");

    allBuyers = await response.json();
    console.log(`Cargados ${allBuyers.length} compradores`);
  } catch (error) {
    console.error("Error cargando compradores:", error);
    throw error;
  }
}

// ==================== ACTUALIZAR ESTADÍSTICAS ====================
function updateStats(stats) {
  document.getElementById("total-numbers").textContent = stats.total || 0;
  document.getElementById("total-sold").textContent = stats.vendidos || 0;
  document.getElementById("total-available").textContent =
    stats.disponibles || 0;

  const percentage =
    stats.total > 0 ? Math.round((stats.vendidos / stats.total) * 100) : 0;
  document.getElementById("percentage-sold").textContent = `${percentage}%`;
}

// ==================== FILTRAR Y ORDENAR ====================
function filterAndSortBuyers() {
  const searchTerm = document
    .getElementById("search-input")
    .value.toLowerCase();
  const sortBy = document.getElementById("sort-select").value;

  // Filtrar
  filteredBuyers = allBuyers.filter((buyer) => {
    if (!searchTerm) return true;

    return (
      buyer.nombres.toLowerCase().includes(searchTerm) ||
      buyer.apellidos.toLowerCase().includes(searchTerm) ||
      buyer.numero_documento.toLowerCase().includes(searchTerm) ||
      buyer.correo.toLowerCase().includes(searchTerm) ||
      buyer.telefono.includes(searchTerm) ||
      buyer.numero.toString().includes(searchTerm)
    );
  });

  // Ordenar
  filteredBuyers.sort((a, b) => {
    switch (sortBy) {
      case "fecha-desc":
        return new Date(b.fecha_compra) - new Date(a.fecha_compra);
      case "fecha-asc":
        return new Date(a.fecha_compra) - new Date(b.fecha_compra);
      case "numero-asc":
        return a.numero - b.numero;
      case "numero-desc":
        return b.numero - a.numero;
      default:
        return 0;
    }
  });

  currentPage = 1; // Reset a primera página
}

// ==================== RENDERIZAR TABLA ====================
function renderTable() {
  const tbody = document.getElementById("buyers-tbody");
  const table = document.getElementById("buyers-table");
  const noResults = document.getElementById("no-results");

  tbody.innerHTML = ""; // Limpiar TABLE

  if (filteredBuyers.length === 0) {
    table.style.display = "none";
    noResults.style.display = "block";
    document.getElementById("pagination").innerHTML = "";
    return;
  }

  table.style.display = "table";
  noResults.style.display = "none";

  // Calcular paginación
  const totalPages = Math.ceil(filteredBuyers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageItems = filteredBuyers.slice(startIndex, endIndex);

  // Renderizar filas
  pageItems.forEach((buyer) => {
    const row = createBuyerRow(buyer);
    tbody.appendChild(row);
  });

  // Renderizar paginación
  renderPagination(totalPages);
}

function createBuyerRow(buyer) {
  const row = document.createElement("tr");

  const fecha_compra = new Date(buyer.fecha_compra).toLocaleDateString(
    "es-ES",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  const badgeClass = buyer.pagado ? "badge-success" : "badge-warning";
  const badgeText = buyer.pagado ? "✓ Pagado" : "⏳ Pendiente";

  row.innerHTML = `
    <td>
      <span class="numero-badge">#${String(buyer.numero).padStart(2, "0")}</span>
    </td>
    <td>
      <strong>${buyer.nombres} ${buyer.apellidos}</strong>
    </td>
    <td>${buyer.numero_documento}</td>
    <td>
      <a href="tel:${buyer.telefono}" title="Llamar">${buyer.telefono}</a>
    </td>
    <td>
      <button class="badge ${badgeClass}" data-buyer-id="${buyer.id}" data-paid="${buyer.pagado}">
        ${badgeText}
      </button>
    </td>
    <td>${fecha_compra}</td>
  `;

  // Agregar event listener al botón de pago
  const paymentBtn = row.querySelector(".badge");
  paymentBtn.addEventListener("click", (e) => {
    e.preventDefault();
    togglePaymentStatus(buyer.id, buyer.pagado);
  });

  return row;
}

// ==================== CAMBIAR ESTADO DE PAGO ====================
async function togglePaymentStatus(compradorId, currentStatus) {
  const newStatus = !currentStatus;

  try {
    // Mostrar indicador de carga
    const btn = document.querySelector(`[data-buyer-id="${compradorId}"]`);
    btn.classList.add("badge-loading");
    btn.textContent = "⏳ Actualizando...";
    btn.disabled = true;

    // Enviar petición al servidor
    const response = await fetch(`${API_BASE}/buyers/${compradorId}/payment`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ pagado: newStatus }),
    });

    if (!response.ok) {
      throw new Error("Error al actualizar el estado de pago");
    }

    const result = await response.json();

    // Actualizar el comprador en el array local
    const buyerIndex = allBuyers.findIndex((b) => b.id === compradorId);
    if (buyerIndex !== -1) {
      allBuyers[buyerIndex].pagado = newStatus;
      allBuyers[buyerIndex].fecha_pago = result.fecha_pago;
    }

    // Actualizar la tabla
    filterAndSortBuyers();
    renderTable();

    // Mostrar mensaje de éxito
    const message = newStatus
      ? "✓ Comprador marcado como pagado"
      : "⏳ Pago removido - Pendiente";
    showSuccess(message);
  } catch (error) {
    console.error("Error:", error);
    showError("Error al actualizar el estado de pago. Intenta de nuevo.");

    // Restaurar el botón
    const btn = document.querySelector(`[data-buyer-id="${compradorId}"]`);
    btn.classList.remove("badge-loading");
    btn.disabled = false;
  }
}

// ==================== PAGINACIÓN ====================
function renderPagination(totalPages) {
  const paginationContainer = document.getElementById("pagination");
  paginationContainer.innerHTML = "";

  if (totalPages <= 1) return;

  // Botón Anterior
  const prevBtn = document.createElement("button");
  prevBtn.textContent = "← Anterior";
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });
  paginationContainer.appendChild(prevBtn);

  // Números de página
  const maxVisiblePages = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage < maxVisiblePages - 1) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  if (startPage > 1) {
    const firstBtn = document.createElement("button");
    firstBtn.textContent = "1";
    firstBtn.addEventListener("click", () => {
      currentPage = 1;
      renderTable();
    });
    paginationContainer.appendChild(firstBtn);

    if (startPage > 2) {
      const dots = document.createElement("span");
      dots.textContent = "...";
      dots.style.padding = "0.5rem 0.25rem";
      paginationContainer.appendChild(dots);
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.classList.add(i === currentPage ? "active" : "");
    btn.addEventListener("click", () => {
      currentPage = i;
      renderTable();
    });
    paginationContainer.appendChild(btn);
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      const dots = document.createElement("span");
      dots.textContent = "...";
      dots.style.padding = "0.5rem 0.25rem";
      paginationContainer.appendChild(dots);
    }

    const lastBtn = document.createElement("button");
    lastBtn.textContent = totalPages;
    lastBtn.addEventListener("click", () => {
      currentPage = totalPages;
      renderTable();
    });
    paginationContainer.appendChild(lastBtn);
  }

  // Botón Siguiente
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "Siguiente →";
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  });
  paginationContainer.appendChild(nextBtn);
}

// ==================== UTILIDADES ====================
function showLoading(isLoading) {
  const loading = document.getElementById("loading");
  if (isLoading) {
    loading.style.display = "block";
  } else {
    loading.style.display = "none";
  }
}

function showError(message) {
  const errorDiv = document.getElementById("error-message");
  errorDiv.textContent = "❌ " + message;
  errorDiv.style.display = "block";

  setTimeout(() => {
    errorDiv.style.display = "none";
  }, 5000);
}

function showSuccess(message) {
  const errorDiv = document.getElementById("error-message");
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
  errorDiv.style.backgroundColor = "#dcfce7";
  errorDiv.style.color = "#166534";
  errorDiv.style.borderLeftColor = "#22c55e";

  setTimeout(() => {
    errorDiv.style.display = "none";
    errorDiv.style.backgroundColor = "";
    errorDiv.style.color = "";
    errorDiv.style.borderLeftColor = "";
  }, 3000);
}

function handleLogout() {
  if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
    localStorage.removeItem("authToken");
    localStorage.removeItem("authUser");
    window.location.href = "../login/login.html";
  }
}

// ==================== EXPORTAR MÓDULO ====================
window.buyersModule = {
  loadBuyers,
  loadStats,
  filterAndSortBuyers,
  renderTable,
  initializePage,
};
