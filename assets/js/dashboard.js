// Configuración inicial del dashboard
const TOTAL_NUMBERS = 100;

//Api en local, cambiar a la URL del servidor real cuando se despliegue
const API_BASE_URL = "http://localhost:3000/api";

// Api en producción, cambiar a la URL del servidor real cuando se despliegue
//const API_BASE_URL = "https://backend-rifa-mu.vercel.app/api";

function getAuthToken() {
  return localStorage.getItem("authToken");
}

async function authenticatedFetch(url, options = {}) {
  const token = getAuthToken();
  if (!token) {
    showMessage("No autenticado. Por favor, inicia sesión primero.", true);
    setTimeout(() => {
      window.location.href = "../login/login.html";
    }, 1500);
    throw new Error("Sin token de autenticación");
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  return fetch(API_BASE_URL + url, {
    ...options,
    headers,
  });
}

// Estructura de datos de ejemplo (en producción estas vendrían del backend)
let dashboardData = {
  totalNumbers: TOTAL_NUMBERS,
  sold: 0,
  paid: 0,
  pendingPayment: 0,
};

// Estado de carga del dashboard
let isLoading = false;

// Función para actualizar el dashboard
async function updateDashboard() {
  isLoading = true;
  showLoadingState();

  try {
    const data = await getDashboardData();

    // Calcular métricas
    const metrics = calculateMetrics(data);

    // Actualizar tarjetas
    updateMetricCards(metrics);

    // Actualizar tabla
    updateTable(metrics);

    hideLoadingState();
  } catch (error) {
    console.error("Error actualizando dashboard:", error);
    hideLoadingState();
    showErrorNotification("Error al cargar los datos del dashboard");
  } finally {
    isLoading = false;
  }
}

// Función para obtener datos de la API del backend
async function getDashboardData() {
  try {
    // Obtener estadísticas generales
    const statsResponse = await fetch(`${API_BASE_URL}/stats`);

    if (!statsResponse.ok) {
      throw new Error("Error al obtener estadísticas");
    }

    const stats = await statsResponse.json();

    // Obtener estadísticas de pago
    let paymentStats = { pagados: 0, pendiente_pago: 0 };
    try {
      const paymentResponse = await fetch(`${API_BASE_URL}/payment-stats`);
      if (paymentResponse.ok) {
        paymentStats = await paymentResponse.json();
      }
    } catch (error) {
      console.warn("No se pudieron obtener estadísticas de pago:", error);
    }

    return {
      totalNumbers: stats.total || TOTAL_NUMBERS,
      sold: stats.vendidos || 0,
      paid: paymentStats.pagados || 0,
      pendingPayment:
        paymentStats.pendiente_pago ||
        (stats.vendidos || 0) - (paymentStats.pagados || 0),
    };
  } catch (error) {
    console.error("Error obteniendo datos del dashboard:", error);

    // Fallback a datos guardados o ejemplo
    const stored = localStorage.getItem("dashboardData");
    if (stored) {
      return JSON.parse(stored);
    }

    // Datos de ejemplo para demostración
    return {
      totalNumbers: TOTAL_NUMBERS,
      sold: 45,
      paid: 30,
      pendingPayment: 15,
    };
  }
}

// Función para calcular todas las métricas
function calculateMetrics(data) {
  const { totalNumbers, sold, paid, pendingPayment } = data;

  // Números pendientes (no vendidos)
  const pending = totalNumbers - sold;

  // Números vendidos pero no pagados
  const unpaidPending = sold - paid;

  // Disponibles (no vendidos)
  const available = pending;

  // Porcentajes
  const salePercentage = ((sold / totalNumbers) * 100).toFixed(2);
  const paidPercentage = ((paid / sold) * 100 || 0).toFixed(2);
  const unpaidPercentage = ((unpaidPending / sold) * 100 || 0).toFixed(2);
  const paidPercentageTotal = ((paid / totalNumbers) * 100).toFixed(2);
  const unpaidPaidPercentage = ((unpaidPending / totalNumbers) * 100).toFixed(
    2,
  );

  return {
    totalNumbers,
    sold,
    paid,
    pendingPayment: unpaidPending,
    pending,
    available,
    salePercentage,
    paidPercentage,
    unpaidPercentage,
    paidPercentageTotal,
    unpaidPaidPercentage,
  };
}

// Función para actualizar las tarjetas de métricas
function updateMetricCards(metrics) {
  // Cantidad de Números
  document.getElementById("totalNumbers").textContent = metrics.totalNumbers;

  // Números Vendidos
  document.getElementById("soldNumbers").textContent = metrics.sold;
  document.getElementById("soldPercentage").textContent =
    metrics.salePercentage;

  // Números Pagados
  document.getElementById("paidNumbers").textContent = metrics.paid;
  document.getElementById("paidPercentage").textContent =
    metrics.paidPercentage;

  // Porcentaje de Ventas
  document.getElementById("salePercentage").textContent =
    metrics.salePercentage + "%";

  // Números Pendientes
  document.getElementById("pendingNumbers").textContent = metrics.pending;

  // Pendientes por Pagar
  document.getElementById("unpaidPending").textContent = metrics.pendingPayment;
  document.getElementById("unpaidPercentage").textContent =
    metrics.unpaidPercentage;

  // Porcentaje de Pagados
  document.getElementById("paidPercentageTotal").textContent =
    metrics.paidPercentageTotal + "%";

  // Porcentaje de Pendientes por Pagar
  document.getElementById("unpaidPaidPercentage").textContent =
    metrics.unpaidPaidPercentage + "%";
}

// Función para actualizar la tabla de detalles
function updateTable(metrics) {
  // Números pagados
  document.getElementById("tablePaidNumbers").textContent = metrics.paid;
  document.getElementById("tablePaidPercentage").textContent =
    metrics.paidPercentageTotal + "%";
  document.getElementById("tablePaidFill").style.width =
    metrics.paidPercentageTotal + "%";

  // Números pendientes de pago
  document.getElementById("tableUnpaidNumbers").textContent =
    metrics.pendingPayment;
  document.getElementById("tableUnpaidPercentage").textContent =
    metrics.unpaidPercentage + "%";
  document.getElementById("tableUnpaidFill").style.width =
    metrics.unpaidPercentage + "%";

  // Números disponibles
  const availablePercentage = (
    ((metrics.totalNumbers - metrics.sold) / metrics.totalNumbers) *
    100
  ).toFixed(2);
  document.getElementById("tableAvailableNumbers").textContent =
    metrics.available;
  document.getElementById("tableAvailablePercentage").textContent =
    availablePercentage + "%";
  document.getElementById("tableAvailableFill").style.width =
    availablePercentage + "%";
}

// Función para agregar una venta (ejemplo para integración)
async function addSale(buyer) {
  try {
    const response = await fetch(`${API_BASE_URL}/purchase/${buyer.numeroId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        numero_documento: buyer.documento,
        nombres: buyer.nombres,
        apellidos: buyer.apellidos,
        telefono: buyer.telefono,
        correo: buyer.correo || "",
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Error al registrar la compra");
    }

    // Actualizar dashboard después de agregar venta
    await updateDashboard();
    showSuccessNotification("Venta registrada exitosamente");

    return result;
  } catch (error) {
    console.error("Error al agregar venta:", error);
    showErrorNotification(error.message);
    throw error;
  }
}

// Función para marcar un número como pagado
async function markAsPaid(compradorId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/buyers/${compradorId}/payment`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pagado: true,
        }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Error al marcar pago");
    }

    // Actualizar dashboard después de marcar pago
    await updateDashboard();
    showSuccessNotification("Pago registrado exitosamente");

    return result;
  } catch (error) {
    console.error("Error al marcar pago:", error);
    showErrorNotification(error.message);
    throw error;
  }
}

// Función para actualizar el dashboard cuando se reciben datos del servidor
function updateDashboardFromServer(serverData) {
  localStorage.setItem("dashboardData", JSON.stringify(serverData));
  updateDashboard();
}

// Función para resetear el dashboard
function resetDashboard() {
  const resetData = {
    totalNumbers: TOTAL_NUMBERS,
    sold: 0,
    paid: 0,
    pendingPayment: 0,
  };
  localStorage.setItem("dashboardData", JSON.stringify(resetData));
  updateDashboard();
}

// Función para exportar datos (para reportes)
function exportDashboardData() {
  const data = getDashboardData();
  const metrics = calculateMetrics(data);
  const exportData = {
    timestamp: new Date().toISOString(),
    ...metrics,
  };
  return JSON.stringify(exportData, null, 2);
}

// Auto-actualizar el dashboard cada 30 segundos (opcional)
function startAutoUpdate(interval = 30000) {
  setInterval(() => {
    if (!isLoading) {
      updateDashboard();
    }
  }, interval);
}

// Funciones de utilidad para UI
function showLoadingState() {
  const cards = document.querySelectorAll(".metric-card");
  cards.forEach((card) => {
    card.style.opacity = "0.6";
    card.style.pointerEvents = "none";
  });
}

function hideLoadingState() {
  const cards = document.querySelectorAll(".metric-card");
  cards.forEach((card) => {
    card.style.opacity = "1";
    card.style.pointerEvents = "auto";
  });
}

function showErrorNotification(message) {
  // Crear notificación de error
  const notification = document.createElement("div");
  notification.className = "notification notification-error";
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">❌</span>
      <span class="notification-message">${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">✕</button>
    </div>
  `;

  // Agregar al documento
  if (!document.querySelector(".notifications-container")) {
    const container = document.createElement("div");
    container.className = "notifications-container";
    document.body.appendChild(container);
  }

  document.querySelector(".notifications-container").appendChild(notification);

  // Remover después de 5 segundos
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

function showSuccessNotification(message) {
  // Crear notificación de éxito
  const notification = document.createElement("div");
  notification.className = "notification notification-success";
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">✅</span>
      <span class="notification-message">${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">✕</button>
    </div>
  `;

  // Agregar al documento
  if (!document.querySelector(".notifications-container")) {
    const container = document.createElement("div");
    container.className = "notifications-container";
    document.body.appendChild(container);
  }

  document.querySelector(".notifications-container").appendChild(notification);

  // Remover después de 5 segundos
  setTimeout(() => {
    notification.remove();
  }, 5000);
}

// Inicializar el dashboard cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", async () => {
  // 🔐 VERIFICAR AUTENTICACIÓN PRIMERO
  if (!isAuthenticated()) {
    console.warn("⚠️ Acceso denegado: Usuario no autenticado");

    // Mostrar pantalla de acceso denegado
    const container = document.querySelector(".container");
    if (container) {
      container.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          gap: 2rem;
          padding: 2rem;
          text-align: center;
        ">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🔐</div>
          <h2 style="color: var(--text-main); margin: 0; font-family: 'Bebas Neue';">ACCESO RESTRINGIDO</h2>
          <p style="color: var(--text-muted); font-size: 1.1rem; margin: 1rem 0 0 0;">Debes iniciar sesión para acceder al dashboard</p>
          <p style="color: var(--text-muted); margin: 2rem 0 0 0;">Serás redirigido en <span id="countdown">3</span>s...</p>
        </div>
      `;

      // Contador regresivo
      let segundos = 3;
      const countdownEl = document.getElementById("countdown");
      const intervalo = setInterval(() => {
        segundos--;
        if (countdownEl) countdownEl.textContent = segundos;
        if (segundos <= 0) clearInterval(intervalo);
      }, 1000);
    }

    // Redirigir al login después de 3 segundos
    setTimeout(() => {
      window.location.href = "../login/login.html";
    }, 3000);

    return; // Detener ejecución del resto del código
  }

  console.log("✅ Usuario autenticado - Cargando dashboard");

  // Agregar estilos para notificaciones si no existen
  if (!document.getElementById("notification-styles")) {
    const style = document.createElement("style");
    style.id = "notification-styles";
    style.textContent = `
      .notifications-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 400px;
      }

      .notification {
        border-radius: 12px;
        backdrop-filter: blur(20px);
        border: 1px solid rgba(45, 55, 72, 0.6);
        animation: slideInRight 0.3s ease-out;
      }

      @keyframes slideInRight {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .notification-error {
        background: linear-gradient(135deg, rgba(40, 20, 20, 0.8), rgba(30, 10, 10, 0.8));
        border-color: rgba(255, 107, 107, 0.6);
      }

      .notification-success {
        background: linear-gradient(135deg, rgba(20, 40, 20, 0.8), rgba(10, 30, 10, 0.8));
        border-color: rgba(6, 214, 160, 0.6);
      }

      .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        color: white;
        font-weight: 500;
      }

      .notification-icon {
        font-size: 1.2rem;
        flex-shrink: 0;
      }

      .notification-message {
        flex: 1;
      }

      .notification-close {
        background: none;
        border: none;
        color: inherit;
        cursor: pointer;
        font-size: 1rem;
        padding: 0;
        transition: opacity 0.2s;
      }

      .notification-close:hover {
        opacity: 0.7;
      }
    `;
    document.head.appendChild(style);
  }

  // Cargar datos iniciales
  await updateDashboard();

  // Descomenta la siguiente línea para actualización automática cada 30 segundos
  startAutoUpdate(30000);
});

// Permitir actualización manual desde la consola del navegador
window.dashboard = {
  update: updateDashboard,
  addSale,
  markAsPaid,
  reset: resetDashboard,
  export: exportDashboardData,
  getData: getDashboardData,
  startAutoUpdate,
  apiBaseUrl: API_BASE_URL,
};

console.log(
  "✅ Dashboard inicializado. Usa window.dashboard para interactuar.",
);
console.log("📡 Conectado a API:", API_BASE_URL);
console.log("Comandos disponibles:");
console.log("  - window.dashboard.addSale(buyer) - Agregar una venta");
console.log("  - window.dashboard.markAsPaid(compradorId) - Marcar pago");
console.log("  - window.dashboard.update() - Actualizar dashboard");
console.log("  - window.dashboard.getData() - Obtener datos actuales");
console.log("  - window.dashboard.export() - Exportar datos");
console.log(
  "  - window.dashboard.startAutoUpdate(30000) - Auto-actualizar cada 30s",
);
