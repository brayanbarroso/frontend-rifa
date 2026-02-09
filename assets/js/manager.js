//Api para desarrollo local, cambiar a la URL del servidor real cuando se despliegue
//const API_BASE = "http://localhost:3000";

//Api en producción, cambiar a la URL del servidor real cuando se despliegue
const API_BASE = "https://backend-rifa-mu.vercel.app";

function showMessage(text, isError = false) {
  const el = document.getElementById("msg");
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? "#c53030" : "#2b6cb0";
}

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

  return fetch(API_BASE + url, {
    ...options,
    headers,
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const restartBtn = document.getElementById("restartBtn");
  const releaseBtn = document.getElementById("releaseBtn");
  const deleteBuyerBtn = document.getElementById("deleteBuyerBtn");
  const reloadBtn = document.getElementById("reloadBtn");

  restartBtn?.addEventListener("click", restartRaffle);
  releaseBtn?.addEventListener("click", releaseNumber);
  deleteBuyerBtn?.addEventListener("click", deleteBuyer);
  reloadBtn?.addEventListener("click", loadData);

  loadData();
});

async function restartRaffle() {
  if (
    !confirm(
      "¿Confirmas reiniciar la rifa? Esta acción eliminará todos los compradores. Es irreversible.",
    )
  )
    return;
  try {
    const res = await authenticatedFetch("/api/admin/reiniciar-rifa", {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const data = await res.json();
      showMessage("✓ " + (data.message || "Rifa reiniciada correctamente."));
      await loadData();
    } else {
      const text = await res.text();
      showMessage("Error: " + text, true);
    }
  } catch (err) {
    showMessage("Error de red: " + err.message, true);
  }
}

async function releaseNumber() {
  const input = document.getElementById("releaseNumberInput");
  if (!input) return;
  const value = input.value.trim();
  if (!value) {
    showMessage("Introduce un número válido (00-99).", true);
    return;
  }

  const numeroValue = parseInt(value, 10);
  if (isNaN(numeroValue) || numeroValue < 0 || numeroValue > 99) {
    showMessage("Número debe estar entre 00 y 99.", true);
    return;
  }

  try {
    // Obtener todos los números para encontrar el ID
    const res = await authenticatedFetch("/api/numbers", { method: "GET" });
    if (!res.ok) {
      showMessage("Error al obtener números.", true);
      return;
    }

    const numbers = await res.json();
    const found = numbers.find((n) => n.numero === numeroValue);

    if (!found) {
      showMessage("Número no encontrado en la base de datos.", true);
      return;
    }

    // Liberar el número usando su ID
    const releaseRes = await authenticatedFetch(
      `/api/admin/liberar-numero/${found.id}`,
      { method: "PUT", body: JSON.stringify({}) },
    );

    if (releaseRes.ok) {
      const data = await releaseRes.json();
      showMessage("✓ " + (data.message || `Número ${value} liberado.`));
      input.value = "";
      await loadData();
    } else {
      const text = await releaseRes.text();
      showMessage("Error: " + text, true);
    }
  } catch (err) {
    showMessage("Error de red: " + err.message, true);
  }
}

async function deleteBuyer() {
  const input = document.getElementById("deleteBuyerInput");
  if (!input) return;
  const searchValue = input.value.trim();
  if (!searchValue) {
    showMessage("Introduce el ID o email del comprador.", true);
    return;
  }
  if (!confirm("¿Eliminar este comprador? El número se liberará.")) return;

  try {
    // Obtener lista de compradores
    const res = await authenticatedFetch("/api/buyers", { method: "GET" });
    if (!res.ok) {
      showMessage("Error al obtener compradores.", true);
      return;
    }

    const buyers = await res.json();

    // Buscar por ID (numérico) o email
    const compradorId = parseInt(searchValue, 10);
    let found = null;

    if (!isNaN(compradorId)) {
      found = buyers.find((b) => b.id === compradorId);
    }
    if (!found) {
      found = buyers.find(
        (b) => b.correo && b.correo.toLowerCase() === searchValue.toLowerCase(),
      );
    }

    if (!found) {
      showMessage("Comprador no encontrado. Verifica el ID o email.", true);
      return;
    }

    // Eliminar comprador
    const deleteRes = await authenticatedFetch(
      `/api/admin/eliminar-comprador/${found.id}`,
      { method: "DELETE", body: JSON.stringify({}) },
    );

    if (deleteRes.ok) {
      const data = await deleteRes.json();
      showMessage(
        "✓ " +
          (data.message ||
            `Comprador ${found.nombres} eliminado. Número ${data.numeroLiberado} liberado.`),
      );
      input.value = "";
      await loadData();
    } else {
      const text = await deleteRes.text();
      showMessage("Error: " + text, true);
    }
  } catch (err) {
    showMessage("Error de red: " + err.message, true);
  }
}

async function loadData() {
  showMessage("Cargando datos...");
  try {
    const [buyersRes, statsRes] = await Promise.all([
      authenticatedFetch("/api/buyers", { method: "GET" }),
      authenticatedFetch("/api/stats", { method: "GET" }),
    ]);

    const tbody = document.querySelector("#buyersTable tbody");
    if (!tbody) return;

    if (buyersRes.ok) {
      const buyers = await buyersRes.json();
      if (!Array.isArray(buyers) || buyers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4">No hay compradores.</td></tr>';
      } else {
        tbody.innerHTML = buyers
          .map(
            (b) => `
          <tr>
            <td>${escapeHtml(String(b.id ?? ""))}</td>
            <td>${escapeHtml(b.nombres ?? "")} ${escapeHtml(b.apellidos ?? "")}</td>
            <td>${escapeHtml(b.correo ?? "")}</td>
            <td>${escapeHtml(String(b.numero ?? ""))}</td>
          </tr>
        `,
          )
          .join("");
      }
    } else {
      tbody.innerHTML =
        '<tr><td colspan="4">Error cargando compradores</td></tr>';
    }

    if (statsRes.ok) {
      const stats = await statsRes.json();
      const msg = `Datos cargados. Total: ${stats.total ?? 0}, Vendidos: ${stats.vendidos ?? 0}, Disponibles: ${stats.disponibles ?? 0}`;
      showMessage(msg);
    } else {
      showMessage("Datos cargados (estadísticas no disponibles).");
    }
  } catch (err) {
    showMessage("Error al cargar datos: " + err.message, true);
  }
}

function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
