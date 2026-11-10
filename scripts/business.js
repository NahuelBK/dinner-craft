// ============================================================================
// SCRIPTS/BUSINESS.JS - Lógica de Negocio y Configuración Visual
// ============================================================================

function renderBusinessDetails() {
    if (typeof config === 'undefined' || !config.nombreNegocio) return;

    const elNombre = document.getElementById('info-nombre-negocio');
    const elAniversario = document.getElementById('info-aniversario');
    const elTemaStatus = document.getElementById('info-tema-status');
    const temaSelect = document.getElementById('SeleccionarTema');
    const modoSelect = document.getElementById('seleccionarModo');
    const tamañoTextoSelect = document.getElementById('tamaño-texto');

    if (elNombre) elNombre.textContent = config.nombreNegocio;
    if (elAniversario) {
        const fechaLegible = typeof formatearFechaParaMostrar === 'function' ? formatearFechaParaMostrar(config.fechaAniversario) : (config.fechaAniversario || 'N/A');
        elAniversario.textContent = `Aniversario: ${fechaLegible}`;
    }
    
    const modoActual = config.modo || 'light';
    const temaActual = config.tematizacion || 'default';
    if (elTemaStatus) {
        elTemaStatus.textContent = `Modo: ${modoActual.toUpperCase()} | Tema: ${temaActual.replace('-', ' ').toUpperCase()}`;
    }

    if (temaSelect) temaSelect.value = temaActual;
    if (modoSelect) modoSelect.value = modoActual;

    const escalaActual = config.escalaTexto || config.textScaling || 'normal';
    if (tamañoTextoSelect) {
        tamañoTextoSelect.value = escalaActual;
    }
}

function CambiarTema(tema) {
    if (typeof applyTheme === 'function') {
        applyTheme(tema);
    }
}

function CambiarModo(modo) {
    config.modo = modo;
    if (typeof aplicarAparienciaCompleta === 'function') {
        aplicarAparienciaCompleta();
    }
}

function mostrarToast(mensaje) {
    let toastExistente = document.getElementById('toast-notificacion');
    if (toastExistente) toastExistente.remove();

    const toast = document.createElement('div');
    toast.id = 'toast-notificacion';
    toast.textContent = mensaje;
    toast.style.cssText = "position: fixed; bottom: 20px; right: 20px; background: #10b981; color: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999; font-weight: 600; font-size: 0.9rem; pointer-events: none; transition: opacity 0.3s ease;";
    
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2500);
}

function saveBusinessConfig() {
    const newTema = document.getElementById('SeleccionarTema').value;
    const newModo = document.getElementById('seleccionarModo').value;
    const newScale = document.getElementById('tamaño-texto').value;

    config.tematizacion = newTema;
    config.modo = newModo;
    config.escalaTexto = newScale;
    
    localStorage.setItem('dinner_craft_config', JSON.stringify(config));
    
    if (typeof aplicarAparienciaCompleta === 'function') aplicarAparienciaCompleta();
    if (typeof aplicarEscalaTexto === 'function') aplicarEscalaTexto(newScale);
    if (typeof renderizarBarraNavegacion === 'function') renderizarBarraNavegacion();
    
    mostrarToast("¡Configuración guardada correctamente!");
    renderBusinessDetails();
}

document.addEventListener("DOMContentLoaded", () => {
    const intervalo = setInterval(() => {
        if (typeof config !== 'undefined' && config.nombreNegocio) {
            renderBusinessDetails();
            clearInterval(intervalo);
        }
    }, 30);
});