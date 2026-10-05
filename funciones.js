// funciones.js — BDD Contratos Alcaldía ASAS
// Versión corregida y optimizada
//
// ⚠️  Login, logout, togglePasswordVisibility y mostrarApp
//     están definidos en scripts.js (se carga primero).
//     Este archivo contiene SOLO la lógica de la app.

/* ─────────────────────────────────────────
   CARGA DE AÑO
───────────────────────────────────────── */
function cambiarAnio() {
  const anio = document.getElementById("anio-select").value;
  const contenedor = document.getElementById("contenedor-tabla");
  const anioDisplay = document.getElementById("anio-display");

  if (anioDisplay) anioDisplay.textContent = anio;

  // Indicador de carga
  contenedor.innerHTML = `
    <div class="table-loading">
      <i class="fa-solid fa-spinner fa-spin"></i> Cargando contratos ${anio}…
    </div>`;

  fetch(`contratos_${anio}.html`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then(html => {
      contenedor.innerHTML = html;
      // Pequeño timeout para dejar que el DOM termine de pintar
      requestAnimationFrame(() => {
        marcarContratosVencidos();
        actualizarTiempoEnTabla();
        aplicarFiltros();
      });
    })
    .catch(err => {
      console.error("Error cargando contratos:", err);
      contenedor.innerHTML = `
        <div class="table-loading">
          <i class="fa-solid fa-triangle-exclamation" style="color:#F9A825;font-size:32px;display:block;margin-bottom:12px;"></i>
          No se encontraron contratos para el año ${anio}.
        </div>`;
      actualizarContador(0);
    });
}

/* ─────────────────────────────────────────
   FILTRADO UNIFICADO
   (reemplaza las dos funciones separadas buscar() / aplicarFiltros())
───────────────────────────────────────── */
function aplicarFiltros() {
  const tabla = document.getElementById("tablaContratos");
  if (!tabla) return;

  const textoBusqueda = (document.getElementById("buscador")?.value || "").toLowerCase().trim();
  const dependenciaFiltro = (document.getElementById("filtroDependencia")?.value || "").toLowerCase();

  const filas = tabla.querySelectorAll("tbody tr");
  let count = 0;

  filas.forEach(fila => {
    const celdas = fila.querySelectorAll("td");
    if (!celdas.length) return;

    const textoFila = fila.textContent.toLowerCase();
    const dependenciaCelda = (celdas[9]?.textContent || "").toLowerCase().trim();

    const coincideBusqueda = !textoBusqueda || textoFila.includes(textoBusqueda);
    const coincideDependencia = !dependenciaFiltro || dependenciaCelda === dependenciaFiltro;

    if (coincideBusqueda && coincideDependencia) {
      fila.style.display = "";
      count++;
    } else {
      fila.style.display = "none";
    }
  });

  actualizarContador(count);
}

// Alias por compatibilidad con el HTML que llama buscar() desde onkeyup
function buscar() { aplicarFiltros(); }

function restablecerBusqueda() {
  const buscador = document.getElementById("buscador");
  const filtro = document.getElementById("filtroDependencia");
  if (buscador) buscador.value = "";
  if (filtro) filtro.value = "";
  aplicarFiltros();
}

/* ─────────────────────────────────────────
   CONTADOR
───────────────────────────────────────── */
function actualizarContador(valor) {
  const el = document.getElementById("contador");
  if (!el) return;
  if (valor === 0) {
    el.textContent = "Sin resultados";
    el.style.background = "#8E9BB0";
  } else {
    el.textContent = `${valor} contrato${valor !== 1 ? "s" : ""}`;
    el.style.background = "";
  }
}

/* ─────────────────────────────────────────
   MARCAR VENCIMIENTOS
───────────────────────────────────────── */
function marcarContratosVencidos() {
  const tabla = document.getElementById("tablaContratos");
  if (!tabla) return;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  tabla.querySelectorAll("tbody tr").forEach(fila => {
    const celdaFinal = fila.cells[11];
    if (!celdaFinal) return;

    const fechaTexto = celdaFinal.textContent.trim().split(" ")[0];
    const fechaContrato = parsearFecha(fechaTexto);
    if (!fechaContrato || isNaN(fechaContrato)) return;

    // Limpiar clases previas
    celdaFinal.classList.remove("fecha-vencida", "fecha-proxima");

    const diferenciaMs = fechaContrato - hoy;
    const diasRestantes = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

    if (diasRestantes < 0) {
      // Contrato vencido
      celdaFinal.classList.add("fecha-vencida");
      celdaFinal.textContent = `${fechaTexto} · Concluido`;
    } else {
      // Contrato vigente
      const tiempoTexto = calcularTiempoRestante(hoy, fechaContrato);
      if (diasRestantes <= 10) {
        celdaFinal.classList.add("fecha-proxima");
      }
      celdaFinal.textContent = `${fechaTexto} · faltan ${tiempoTexto}`;
    }
  });
}

/* ─────────────────────────────────────────
   HELPERS DE FECHA
───────────────────────────────────────── */
function parsearFecha(texto) {
  if (!texto) return null;
  const partes = texto.split("-");
  if (partes.length !== 3) return new Date(texto);
  // Si el primer segmento parece un año (YYYY-MM-DD)
  if (parseInt(partes[0]) > 31) return new Date(texto);
  // Formato DD-MM-YYYY
  const [dia, mes, año] = partes;
  return new Date(`${año}-${mes.padStart(2,"0")}-${dia.padStart(2,"0")}`);
}

function calcularTiempoRestante(desde, hasta) {
  let meses = (hasta.getFullYear() - desde.getFullYear()) * 12 + (hasta.getMonth() - desde.getMonth());
  let dias = hasta.getDate() - desde.getDate();
  if (dias < 0) {
    meses--;
    const ultimoDiaMes = new Date(hasta.getFullYear(), hasta.getMonth(), 0).getDate();
    dias += ultimoDiaMes;
  }
  let texto = "";
  if (meses > 0) texto += `${meses} mes${meses > 1 ? "es" : ""} `;
  if (dias > 0 || meses === 0) texto += `${dias} día${dias !== 1 ? "s" : ""}`;
  return texto.trim();
}

function calcularTiempoTrabajado(inicioStr, finStr) {
  const inicio = parsearFecha(inicioStr);
  const fin = parsearFecha(finStr);
  if (!inicio || !fin || isNaN(inicio) || isNaN(fin)) return "—";

  const hoy = new Date();
  const fechaFinal = fin < hoy ? fin : hoy;
  const diffDias = Math.max(0, Math.floor((fechaFinal - inicio) / (1000 * 60 * 60 * 24)));

  const años = Math.floor(diffDias / 365);
  const meses = Math.floor((diffDias % 365) / 30);
  const dias = diffDias % 30;

  const partes = [];
  if (años > 0) partes.push(`${años} año${años > 1 ? "s" : ""}`);
  if (meses > 0) partes.push(`${meses} mes${meses !== 1 ? "es" : ""}`);
  partes.push(`${dias} día${dias !== 1 ? "s" : ""}`);

  return partes.join(", ");
}

/* ─────────────────────────────────────────
   TIEMPO TRABAJADO EN TABLA
   (corregido: no inserta duplicados)
───────────────────────────────────────── */
function actualizarTiempoEnTabla() {
  const tabla = document.getElementById("tablaContratos");
  if (!tabla) return;

  const encabezados = tabla.querySelectorAll("thead tr th");
  const COL_TIEMPO = 13; // índice esperado de la columna de tiempo

  // Agregar cabecera si no existe
  if (encabezados.length <= COL_TIEMPO) {
    const thHead = tabla.querySelector("thead tr");
    if (thHead) {
      const th = document.createElement("th");
      th.textContent = "Tiempo trabajado";
      thHead.appendChild(th);
    }
  }

  tabla.querySelectorAll("tbody tr").forEach(fila => {
    const celdas = fila.cells;
    if (celdas.length < 12) return;

    const fechaInicio = celdas[10]?.textContent.trim();
    const fechaFinal  = celdas[11]?.textContent.trim().split(" ")[0]; // quitar "· Concluido" si ya fue marcado
    const tiempo = calcularTiempoTrabajado(fechaInicio, fechaFinal);

    // Si la celda ya existe, actualizar; si no, crearla
    if (celdas[COL_TIEMPO]) {
      celdas[COL_TIEMPO].textContent = tiempo;
    } else {
      const td = fila.insertCell(-1);
      td.textContent = tiempo;
    }
  });
}

/* ─────────────────────────────────────────
   UI — TABLA TOGGLE / ORDEN
───────────────────────────────────────── */
function toggleTabla() {
  const contenedor = document.getElementById("contenedor-tabla");
  const boton = document.getElementById("botonTabla");
  if (!contenedor || !boton) return;

  const oculta = contenedor.style.display === "none";
  contenedor.style.display = oculta ? "" : "none";
  boton.innerHTML = oculta
    ? '<i class="fa-solid fa-eye-slash"></i> Ocultar lista'
    : '<i class="fa-solid fa-eye"></i> Mostrar lista';

  if (oculta) aplicarFiltros();
  else actualizarContador(0);
}

let ordenAscendente = true;
function ordenarPorNumero() {
  const tabla = document.getElementById("tablaContratos");
  if (!tabla) return;

  const tbody = tabla.querySelector("tbody") || tabla;
  const filas = Array.from(tbody.querySelectorAll("tr"));

  filas.sort((a, b) => {
    const valA = parseInt(a.cells[0]?.textContent) || 0;
    const valB = parseInt(b.cells[0]?.textContent) || 0;
    return ordenAscendente ? valA - valB : valB - valA;
  });

  filas.forEach(fila => tbody.appendChild(fila));
  ordenAscendente = !ordenAscendente;

  const btn = document.getElementById("botonOrden");
  if (btn) {
    btn.innerHTML = ordenAscendente
      ? '<i class="fa-solid fa-arrow-up-1-9"></i> Cambiar orden'
      : '<i class="fa-solid fa-arrow-down-9-1"></i> Cambiar orden';
  }
}

/* ─────────────────────────────────────────
   MODO OSCURO
───────────────────────────────────────── */
function toggleDarkMode() {
  const isDark = document.body.classList.toggle("dark-mode");
  localStorage.setItem("bdd_dark", isDark ? "1" : "0");

  const btn = document.getElementById("btn-dark-mode");
  if (btn) {
    const icon = btn.querySelector("i");
    const label = btn.querySelector("span");
    if (isDark) {
      icon.classList.replace("fa-moon", "fa-sun");
      if (label) label.textContent = "Modo Claro";
    } else {
      icon.classList.replace("fa-sun", "fa-moon");
      if (label) label.textContent = "Modo Oscuro";
    }
  }
}

// Restaurar preferencia de modo oscuro al cargar
(function () {
  if (localStorage.getItem("bdd_dark") === "1") {
    document.body.classList.add("dark-mode");
  }
})();

/* ─────────────────────────────────────────
   MODALES
───────────────────────────────────────── */
function abrirObservacion(texto) {
  document.getElementById("texto-observacion").textContent = texto;
  document.getElementById("modal-observacion").style.display = "flex";
}

function cerrarObservacion() {
  document.getElementById("modal-observacion").style.display = "none";
}

function cerrarGrafico() {
  document.getElementById("modal-grafico").style.display = "none";
}

/* ─────────────────────────────────────────
   GRÁFICO DE INVERSIÓN
───────────────────────────────────────── */
function mostrarGrafico() {
  const modal = document.getElementById("modal-grafico");
  const canvas = document.getElementById("graficoDependencias");
  const ctx = canvas.getContext("2d");

  const dataPorDependencia = {};
  const contratosPorDependencia = {};
  let totalGlobal = 0;

  document.querySelectorAll("#tablaContratos tbody tr").forEach(fila => {
    if (fila.style.display === "none") return;
    const dependencia = fila.cells[9]?.textContent.trim();
    const valorTexto = fila.cells[5]?.textContent.replace(/[^0-9]/g, "") || "0";
    const valor = parseFloat(valorTexto) || 0;

    if (dependencia) {
      dataPorDependencia[dependencia] = (dataPorDependencia[dependencia] || 0) + valor;
      contratosPorDependencia[dependencia] = (contratosPorDependencia[dependencia] || 0) + 1;
      totalGlobal += valor;
    }
  });

  const dependencias = Object.keys(dataPorDependencia);
  const valores = Object.values(dataPorDependencia);

  if (window._grafico) window._grafico.destroy();

  window._grafico = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: dependencias,
      datasets: [{
        data: valores,
        backgroundColor: [
          "#2E7D32","#F9A825","#1565C0","#C62828",
          "#6A1B9A","#00838F","#558B2F","#E65100"
        ],
        borderWidth: 2,
        borderColor: "#fff"
      }]
    },
    options: {
      responsive: true,
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { font: { family: "Inter, sans-serif", size: 12 }, padding: 12 }
        },
        tooltip: {
          callbacks: {
            label(context) {
              const dep = context.label;
              const valor = context.parsed;
              const contratos = contratosPorDependencia[dep] || 0;
              const pct = ((valor / totalGlobal) * 100).toFixed(1);
              return `${dep}: ${contratos} contratos · $${valor.toLocaleString("es-CO")} (${pct}%)`;
            }
          }
        }
      }
    },
    plugins: [{
      id: "centerText",
      beforeDraw(chart) {
        const { width, height, ctx } = chart;
        ctx.save();
        const totalFmt = totalGlobal.toLocaleString("es-CO", {
          style: "currency", currency: "COP", maximumFractionDigits: 0
        });
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.font = "700 13px Inter, sans-serif";
        ctx.fillStyle = "#1B5E20";
        ctx.fillText("TOTAL", width / 2, height / 2 - 12);
        ctx.font = "600 11px Inter, sans-serif";
        ctx.fillStyle = "#3D4A5C";
        ctx.fillText(totalFmt, width / 2, height / 2 + 8);
        ctx.restore();
      }
    }]
  });

  modal.style.display = "flex";
}

/* ─────────────────────────────────────────
   EXPORTAR EXCEL
───────────────────────────────────────── */
function exportarExcel() {
  const tabla = document.getElementById("tablaContratos");
  if (!tabla) {
    alert("La tabla aún no ha cargado. Espera un momento e intenta de nuevo.");
    return;
  }

  // Solo exporta filas visibles
  const filas = Array.from(tabla.querySelectorAll("tr"))
    .filter(fila => fila.style.display !== "none");

  const datos = filas.map(fila =>
    Array.from(fila.querySelectorAll("th, td")).map(td => td.textContent.trim())
  );

  const hoja = XLSX.utils.aoa_to_sheet(datos);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, "Contratos");

  const anio = document.getElementById("anio-select").value;
  XLSX.writeFile(libro, `Contratos_${anio}.xlsx`);
}

/* ─────────────────────────────────────────
   STUB — llenarFiltroDependencia
   (mantenida por compatibilidad; el select
    está hardcodeado en el HTML)
───────────────────────────────────────── */
function llenarFiltroDependencia() { /* no-op */ }