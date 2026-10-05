// scripts.js — BDD Contratos Alcaldía ASAS

// ─────────────────────────────────────────
// CREDENCIALES
// Agregar o quitar usuarios aquí.
// Para producción real usa un backend con hashing.
// ─────────────────────────────────────────
const USUARIOS = {
  barnaby:      "contratos123",
  admin:        "alcaldia2025",
  contratacion: "contratos123"
};

// ─────────────────────────────────────────
// LOGIN
// El evento submit lo registra funciones.js (DOMContentLoaded).
// Esta función es llamada desde allá como handleLogin(e).
// ─────────────────────────────────────────
function handleLogin(e) {
  e.preventDefault();

  const user  = document.getElementById("username").value.trim();
  const pass  = document.getElementById("password").value;  // sin trim() — las contraseñas pueden tener espacios intencionales
  const error = document.getElementById("login-error");

  if (USUARIOS[user] && USUARIOS[user] === pass) {
    error.style.display = "none";
    sessionStorage.setItem("bdd_logged", "1");
    sessionStorage.setItem("bdd_user", user);
    mostrarApp();
  } else {
    error.style.display = "flex";
    document.getElementById("password").value = "";
    document.getElementById("password").focus();
  }
}

// ─────────────────────────────────────────
// MOSTRAR APP
// ─────────────────────────────────────────
function mostrarApp() {
  document.getElementById("login-section").style.display = "none";
  document.getElementById("content-section").style.display = "flex";
  cambiarAnio(); // definida en funciones.js
}

// ─────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────
function logout() {
  sessionStorage.removeItem("bdd_logged");
  sessionStorage.removeItem("bdd_user");

  document.getElementById("content-section").style.display = "none";
  document.getElementById("login-section").style.display  = "flex";

  // Limpiar formulario
  document.getElementById("username").value = "";
  document.getElementById("password").value = "";
  document.getElementById("login-error").style.display = "none";
}

// ─────────────────────────────────────────
// VER / OCULTAR CONTRASEÑA
// Recibe el <button> que contiene el ícono.
// ─────────────────────────────────────────
function togglePasswordVisibility(btn) {
  const input = btn.closest(".password-field").querySelector("input");
  const icon  = btn.querySelector("i");
  const esPassword = input.type === "password";

  input.type = esPassword ? "text" : "password";
  icon.classList.toggle("fa-eye",      !esPassword);
  icon.classList.toggle("fa-eye-slash", esPassword);
}

// ─────────────────────────────────────────
// AUTO-LOGIN si hay sesión activa
// Se ejecuta antes que funciones.js (scripts.js carga primero en el HTML)
// ─────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem("bdd_logged") === "1") {
    mostrarApp();
  }

  // Registrar submit del formulario
  const form = document.getElementById("login-form");
  if (form) form.addEventListener("submit", handleLogin);
});