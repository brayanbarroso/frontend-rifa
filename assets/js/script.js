// Configuración de la API
//const API_URL = "http://localhost:3000/api";

//Api en producción, cambiar a la URL del servidor real cuando se despliegue
const API_URL = "https://backend-rifa-mu.vercel.app/api";

// Estado global
let numbers = [];
let selectedNumberId = null;

// Inicializar la aplicación
document.addEventListener("DOMContentLoaded", () => {
  loadNumbers();
  setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
  const form = document.getElementById("purchaseForm");
  form.addEventListener("submit", handleFormSubmit);

  // Validaciones en tiempo real
  const documento = document.getElementById("documento");
  const nombres = document.getElementById("nombres");
  const apellidos = document.getElementById("apellidos");
  const email = document.getElementById("email");
  const telefono = document.getElementById("telefono");

  // Solo números para documento
  documento.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");
  });

  // Solo letras y espacios para nombres
  nombres.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
  });

  // Solo letras y espacios para apellidos
  apellidos.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
  });

  // Validación de email al perder el foco
  email.addEventListener("blur", validateEmail);
}

// Cargar números desde la API
async function loadNumbers() {
  try {
    const response = await fetch(`${API_URL}/numbers`);

    if (!response.ok) {
      throw new Error("Error al cargar los números");
    }

    numbers = await response.json();
    renderNumbers();
    updateStats();
  } catch (error) {
    console.error("Error:", error);
    showToast(
      "Error al cargar los números. Intenta recargar la página.",
      "error",
    );
  }
}

// Renderizar la cuadrícula de números
function renderNumbers() {
  const grid = document.getElementById("numbersGrid");
  grid.innerHTML = "";

  numbers.forEach((number, index) => {
    const button = document.createElement("button");
    button.className = `number-btn ${number.vendido ? "sold" : ""}`;
    button.textContent = String(index).padStart(2, "0");
    button.disabled = number.vendido;

    if (!number.vendido) {
      button.addEventListener("click", () => openModal(number));
    }

    // Añadir animación escalonada
    button.style.animationDelay = `${index * 0.01}s`;

    grid.appendChild(button);
  });
}

// Actualizar estadísticas
function updateStats() {
  const vendidos = numbers.filter((n) => n.vendido).length;
  const disponibles = numbers.length - vendidos;

  document.getElementById("vendidos").textContent = vendidos;
  document.getElementById("disponibles").textContent = disponibles;
}

// Abrir modal
function openModal(number) {
  selectedNumberId = number.id;
  const numberDisplay = numbers.findIndex((n) => n.id === number.id);

  document.getElementById("selectedNumber").textContent = String(
    numberDisplay,
  ).padStart(2, "0");
  document.getElementById("modal").classList.add("active");
  document.body.style.overflow = "hidden";

  // Reset form
  document.getElementById("purchaseForm").reset();
}

// Cerrar modal
function closeModal() {
  document.getElementById("modal").classList.remove("active");
  document.body.style.overflow = "auto";
  selectedNumberId = null;
}

// Manejar el envío del formulario
async function handleFormSubmit(e) {
  e.preventDefault();

  // Validar todos los campos
  const documento = document.getElementById("documento").value.trim();
  const nombres = document.getElementById("nombres").value.trim();
  const apellidos = document.getElementById("apellidos").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const email = document.getElementById("email").value.trim();

  // Validar que no estén vacíos
  if (!documento || !nombres || !apellidos || !telefono || !email) {
    showToast("Por favor completa todos los campos", "error");
    return;
  }

  // Validar documento (solo números)
  if (!/^\d+$/.test(documento)) {
    showToast("El documento debe contener solo números", "error");
    return;
  }

  // Validar documento (mínimo 8 caracteres)
  if (documento.length < 8) {
    showToast("El documento debe tener al menos 8 dígitos", "error");
    return;
  }

  // Validar nombres (solo letras y espacios)
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombres)) {
    showToast("El nombre solo debe contener letras", "error");
    return;
  }

  // Validar apellidos (solo letras y espacios)
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(apellidos)) {
    showToast("El apellido solo debe contener letras", "error");
    return;
  }

  // Validar email
  if (!isValidEmail(email)) {
    showToast("Por favor ingresa un correo electrónico válido", "error");
    return;
  }

  // Validar teléfono (al menos 7 dígitos)
  if (!/^\d{7,}$/.test(telefono.replace(/\D/g, ""))) {
    showToast("El teléfono debe tener al menos 7 dígitos", "error");
    return;
  }

  const formData = {
    numero_documento: documento,
    nombres: nombres,
    apellidos: apellidos,
    telefono: telefono,
    correo: email,
  };

  try {
    const response = await fetch(`${API_URL}/purchase/${selectedNumberId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al procesar la compra");
    }

    showToast("¡Número comprado exitosamente!", "success");
    closeModal();

    // Recargar números
    await loadNumbers();
  } catch (error) {
    console.error("Error:", error);
    showToast(error.message || "Error al procesar la compra", "error");
  }
}

// ==================== VALIDACIONES ====================

// Validar formato de email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validar email al perder el foco
function validateEmail(e) {
  const email = e.target.value.trim();
  if (email && !isValidEmail(email)) {
    e.target.style.borderColor = "#dc2626";
    e.target.style.backgroundColor = "#fee2e2";
  } else {
    e.target.style.borderColor = "";
    e.target.style.backgroundColor = "";
  }
}

// Mostrar notificación toast
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast ${type}`;

  // Activar toast
  setTimeout(() => {
    toast.classList.add("active");
  }, 100);

  // Ocultar después de 3 segundos
  setTimeout(() => {
    toast.classList.remove("active");
  }, 3500);
}

// Cerrar modal al presionar ESC
document.addEventListener("keydown", (e) => {
  if (
    e.key === "Escape" &&
    document.getElementById("modal").classList.contains("active")
  ) {
    closeModal();
  }
});
