//Api para desarrollo local, cambiar a la URL del servidor real cuando se despliegue
const API_BASE = "http://localhost:3000";

//Api en producción, cambiar a la URL del servidor real cuando se despliegue
//const API_BASE = "https://backend-rifa-mu.vercel.app";

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

  // Nuevos campos individuales del formulario
  const raffleDate = document.getElementById("raffleDate");
  const raffleLottery = document.getElementById("raffleLottery");
  const raffleValue = document.getElementById("raffleValue");
  const rafflePrize = document.getElementById("rafflePrize");
  const rafflePayment = document.getElementById("rafflePayment");
  const raffleResponsible = document.getElementById("raffleResponsible");
  const saveRaffleConfigBtn = document.getElementById("saveRaffleConfigBtn");

  restartBtn?.addEventListener("click", restartRaffle);
  releaseBtn?.addEventListener("click", releaseNumber);
  deleteBuyerBtn?.addEventListener("click", deleteBuyer);
  reloadBtn?.addEventListener("click", loadData);

  if (
    raffleDate &&
    raffleLottery &&
    raffleValue &&
    rafflePrize &&
    rafflePayment &&
    raffleResponsible &&
    saveRaffleConfigBtn
  ) {
    loadRaffleConfigFromAPI(
      raffleDate,
      raffleLottery,
      raffleValue,
      rafflePrize,
      rafflePayment,
      raffleResponsible,
    );

    saveRaffleConfigBtn.addEventListener("click", () => {
      saveRaffleConfigToAPI(
        raffleDate.value,
        raffleLottery.value,
        raffleValue.value,
        rafflePrize.value,
        rafflePayment.value,
        raffleResponsible.value,
      );
    });
  }

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

// ==================== CONFIGURACIÓN DE TEXTOS DE LA RIFA ====================

async function loadRaffleConfigFromAPI(
  dateInput,
  lotteryInput,
  valueInput,
  prizeInput,
  paymentInput,
  responsibleInput,
) {
  try {
    const res = await authenticatedFetch("/api/config");

    if (!res.ok) {
      console.error("Error al cargar configuración de la API");
      return;
    }

    const data = await res.json();
    const config = data.data || data;

    // Llenar los campos individuales con los datos de la API
    dateInput.value =
      config.fecha_rifa || new Date().toISOString().split("T")[0];
    lotteryInput.value = config.loteria || "Sinuano Noche";
    valueInput.value = config.valor_rifa || "15000";
    prizeInput.value = config.premio || "500000";
    paymentInput.value = config.medio_pago || "Nequi o Llave";
    responsibleInput.value = config.responsable || "Responsable";

    // Guardar en localStorage también para referencia
    const raffleConfig = {
      fecha_rifa: config.fecha_rifa,
      loteria: config.loteria,
      valor_rifa: config.valor_rifa,
      premio: config.premio,
      medio_pago: config.medio_pago,
      responsable: config.responsable,
    };
    localStorage.setItem("raffleConfig", JSON.stringify(raffleConfig));
  } catch (err) {
    console.error("Error al cargar configuración de la rifa:", err);
    // Intentar cargar del localStorage como fallback
    loadRaffleConfigFromLocalStorage(
      dateInput,
      lotteryInput,
      valueInput,
      prizeInput,
      paymentInput,
      responsibleInput,
    );
  }
}

function loadRaffleConfigFromLocalStorage(
  dateInput,
  lotteryInput,
  valueInput,
  prizeInput,
  paymentInput,
  responsibleInput,
) {
  try {
    const raw = localStorage.getItem("raffleConfig");
    if (!raw) return;

    const config = JSON.parse(raw);

    // Llenar los campos individuales con los datos del localStorage
    dateInput.value =
      config.fecha_rifa || new Date().toISOString().split("T")[0];
    lotteryInput.value = config.loteria || "Sinuano Noche";
    valueInput.value = config.valor_rifa || "15000";
    prizeInput.value = config.premio || "500000";
    paymentInput.value = config.medio_pago || "Nequi o Llave";
    responsibleInput.value = config.responsable || "Responsable";
  } catch (err) {
    console.error("Error al cargar configuración del localStorage:", err);
  }
}

function formatDate(dateStr) {
  if (!dateStr) return "27 de febrero";
  const date = new Date(dateStr);
  const options = { month: "long", day: "numeric" };
  const formatted = date.toLocaleDateString("es-ES", options);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatNumber(num) {
  if (!num) return "0";
  return Math.floor(num).toLocaleString("es-ES");
}

// Función auxiliar para parsear valores del formulario
function parseRaffleFormData(dateText, pricePrizeText, paymentText) {
  try {
    // Parsear fecha - del formato "📅 Juega: 27 de febrero ..."
    const existingConfig = JSON.parse(
      localStorage.getItem("raffleConfig") || "{}",
    );

    // Parsear lotería - del formato "... con las Dos (2) últimas cifras de [LOTERÍA]"
    let loteria = "Lotería Nacional";
    const lotteryMatch = paymentText.match(/cifras\s+de\s+(.+?)(?:\s+$|$)/i);
    if (lotteryMatch) {
      loteria = lotteryMatch[1].trim();
    } else if (dateText) {
      const dateMatch = dateText.match(/cifras\s+de\s+(.+?)(?:\s*$|$)/);
      if (dateMatch) {
        loteria = dateMatch[1].trim();
      }
    }

    // Parsear valor y premio - del formato "... $15.000 ... $500.000 ..."
    let valor_rifa = 0;
    let premio = 0;

    const numbers = pricePrizeText.match(
      /\$[\s]?(\d+(?:[.,]\d{3})*(?:[.,]\d{2})?)/g,
    );
    if (numbers && numbers.length >= 2) {
      valor_rifa = parseFloat(
        numbers[0].replace(/[$\s.,]/g, (m) => (m === "." ? "." : "")),
      );
      premio = parseFloat(
        numbers[1].replace(/[$\s.,]/g, (m) => (m === "." ? "." : "")),
      );
    }

    // Parsear medio de pago - del formato "📲 Medios de pago: [PAGO]"
    let medio_pago = "Nequi o Llave";
    const paymentMatch = paymentText.match(/pago:\s+(.+?)(?:\s+📞|$)/i);
    if (paymentMatch) {
      medio_pago = paymentMatch[1].trim();
    }

    return {
      fecha_rifa:
        existingConfig.fecha_rifa || new Date().toISOString().split("T")[0],
      loteria: loteria,
      valor_rifa: valor_rifa,
      premio: premio,
      medio_pago: medio_pago,
      responsable: existingConfig.responsable || "Responsable",
    };
  } catch (err) {
    console.error("Error al parsear datos del formulario:", err);
    return {
      fecha_rifa: new Date().toISOString().split("T")[0],
      loteria: "Lotería Nacional",
      valor_rifa: 15000,
      premio: 500000,
      medio_pago: "Nequi o Llave",
      responsable: "Responsable",
    };
  }
}

async function saveRaffleConfigToAPI(
  dateValue,
  lotteryValue,
  valueValue,
  prizeValue,
  paymentValue,
  responsibleValue,
) {
  try {
    // Construir el objeto de configuración desde los campos individuales
    const configData = {
      fecha_rifa: dateValue,
      loteria: lotteryValue,
      valor_rifa: parseInt(valueValue, 10),
      premio: parseInt(prizeValue, 10),
      medio_pago: paymentValue,
      responsable: responsibleValue,
    };

    const res = await authenticatedFetch("/api/config", {
      method: "PUT",
      body: JSON.stringify(configData),
    });

    if (!res.ok) {
      const error = await res.text();
      showMessage("Error al guardar: " + error, true);
      return;
    }

    const result = await res.json();

    // Guardar en localStorage también
    localStorage.setItem("raffleConfig", JSON.stringify(configData));

    // Mostrar mensaje de éxito
    const configMsg = document.getElementById("configMsg");
    if (configMsg) {
      configMsg.textContent =
        "✓ Configuración de la rifa actualizada correctamente.";
      configMsg.classList.add("show", "success");
      configMsg.classList.remove("error");
      setTimeout(() => {
        configMsg.classList.remove("show");
      }, 3000);
    }
  } catch (err) {
    console.error("Error al guardar configuración:", err);
    const configMsg = document.getElementById("configMsg");
    if (configMsg) {
      configMsg.textContent =
        "Error al guardar la configuración: " + err.message;
      configMsg.classList.add("show", "error");
      configMsg.classList.remove("success");
    }
  }
}
