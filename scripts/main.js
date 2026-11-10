// ============================================================================
// SCRIPTS/MAIN.JS - Control Principal, Temas, Modos y Configuración Global
// ============================================================================

let config = {};
let catalog = {};
let inventory = {};
let clients = {};
let ledger = {};

async function loadInitialData() {
    try {
        const configRes = await fetch('../data/config.json');
        const configPlantillaServidor = await configRes.json();
        const configGuardada = localStorage.getItem('dinner_craft_config');
        if (configGuardada) {
            const configLocal = JSON.parse(configGuardada);
            config = { ...configPlantillaServidor, ...configLocal };
        } else {
            config = configPlantillaServidor;
            localStorage.setItem('dinner_craft_config', JSON.stringify(config));
        }
        const catalogRes = await fetch('../data/catalog.json');
		catalog = await catalogRes.json();

        const inventoryRes = await fetch('../data/inventory.json');
		inventory = await inventoryRes.json();
        
        aplicarAparienciaCompleta();

        const escalaAMostrar = config.escalaTexto || config.textScaling || 'normal';
        aplicarEscalaTexto(escalaAMostrar);
        renderizarBarraNavegacion();
        verificarYRenderizarVistaActual();

    } catch (e) {
        console.error("Error cargando datos iniciales:", e);
    }
}

function aplicarAparienciaCompleta() {
    const body = document.body;
    
    body.className = body.className.replace(/mode-\S+/g, '').replace(/theme-\S+/g, '').trim();

    const modo = config.modo || 'light';
    body.classList.add(`mode-${modo}`);

    const tema = config.tematizacion || 'default';
    body.classList.add(`theme-${tema}`);

    if (config.fechaAniversario) {
        const hoy = new Date();
        const [anho, mes, dia] = config.fechaAniversario.split('-').map(Number);
        if (hoy.getMonth() + 1 === mes && hoy.getDate() === dia) {
            body.classList.add('theme-birthday');
        }
    }
}

function applyTheme(theme) {
    config.tematizacion = theme;
    aplicarAparienciaCompleta();
}

function aplicarEscalaTexto(tamaño) {
    const cuerpo = document.body;
    cuerpo.classList.remove('mediano', 'grande');
    
    if (tamaño === 'mediano') {
        cuerpo.classList.add('mediano');
    } else if (tamaño === 'grande') {
        cuerpo.classList.add('grande');
    }

    const elementoSelector = document.getElementById('tamaño-texto');
    if (elementoSelector) {
        elementoSelector.value = tamaño;
    }
}

window.cambiarEscalaTexto = function(tamaño) {
    aplicarEscalaTexto(tamaño);
    config.escalaTexto = tamaño;
    localStorage.setItem('dinner_craft_config', JSON.stringify(config));
};

document.addEventListener("DOMContentLoaded", function() {
    const configGuardada = localStorage.getItem('dinner_craft_config');
    if (configGuardada) {
        config = JSON.parse(configGuardada);
        aplicarAparienciaCompleta();
        if (config.escalaTexto) {
            aplicarEscalaTexto(config.escalaTexto);
        }
    }
    
    loadInitialData();
    renderizarBarraNavegacion();
    verificarYRenderizarVistaActual();
});

function renderizarBarraNavegacion() {
    const nombreNegocio = config.nombreNegocio || 'Dinner Craft';
    const logoPerfil = config.urlLogo ? config.urlLogo : "https://via.placeholder.com/40";

    let esCumple = false;
    if (config.fechaAniversario) {
        const hoy = new Date();
        const [anho, mes, dia] = config.fechaAniversario.split('-').map(Number);
        if (hoy.getMonth() + 1 === mes && hoy.getDate() === dia) {
            esCumple = true;
        }
    }

    const textoTitulo = esCumple ? '🎉 Dinner Craft 🥳' : 'Dinner Craft';

    const navHTML = `
        <nav style="position: relative; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;">
            <h1 class="título-marca">${textoTitulo}</h1>
            <ul class="nav-bar" style="list-style: none; margin: 0; padding: 0; display: flex; align-items: center; gap: 10px;">
                <li><a href="index.html" class="nav-item">Inicio</a></li>
                <li><a href="catalog.html" class="nav-item">Catálogo</a></li>
                <li><a href="inventory.html" class="nav-item">Inventario</a></li>
                <li><a href="clients.html" class="nav-item">Clientes</a></li>
                <li><a href="ledger.html" class="nav-item">Registro</a></li>
                <li><a href="business.html" class="nav-item">Negocio</a></li>
            </ul>
            
            <div class="user-profile-nav" style="display: flex; align-items: center; position: relative;">
                <div id="perfil-menu-trigger" style="display: flex; align-items: center; cursor: pointer; gap: 10px; user-select: none; background: var(--color-card-bg, #f8f9fa); border: 1px solid var(--color-border, #dee2e6); padding: 6px 14px; border-radius: 50px; box-shadow: 0 2px 5px rgba(0,0,0,0.08); transition: all 0.2s ease;">
                    <img src="${logoPerfil}" alt="Perfil" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-primary, #007bff);">
                    <span style="font-size: 0.9rem; font-weight: 500; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${nombreNegocio}</span>
                </div>
                
                <div id="menu-desplegable-perfil" style="display: none; position: absolute; right: 0; top: 48px; background: var(--color-card-bg, #fff); border: 1px solid var(--color-border, #ccc); border-radius: 8px; box-shadow: 0 6px 16px rgba(0,0,0,0.15); width: 190px; z-index: 1000; overflow: hidden; transform: translateY(-10px); opacity: 0; transition: all 0.25s ease;">
                    <button id="btn-cambiar-nombre" style="width: 100%; text-align: left; padding: 12px 16px; background: none; border: none; border-bottom: 1px solid var(--color-border, #eee); cursor: pointer; font-size: 0.9rem; color: var(--color-text, #333);">Cambiar nombre</button>
                    <button id="btn-cambiar-logo" style="width: 100%; text-align: left; padding: 12px 16px; background: none; border: none; border-bottom: 1px solid var(--color-border, #eee); cursor: pointer; font-size: 0.9rem; color: var(--color-text, #333);">Cambiar logo</button>
                    <button id="btn-cambiar-fecha" style="width: 100%; text-align: left; padding: 12px 16px; background: none; border: none; cursor: pointer; font-size: 0.9rem; color: var(--color-text, #333);">Cambiar fecha</button>
                </div>
            </div>
        </nav>
    `;

    const contenedorNav = document.getElementById("nav-container");
    if (contenedorNav) {
        contenedorNav.innerHTML = navHTML;
    }

    const ubicacionActual = window.location.pathname.split("/").pop();
    const enlacesNav = document.querySelectorAll(".nav-bar .nav-item");
    
    enlacesNav.forEach(enlace => {
        if (enlace.getAttribute("href") === ubicacionActual) {
            enlace.classList.add("active");
        }
    });

    configurarEventosMenuPerfil();
}

function configurarEventosMenuPerfil() {
    const trigger = document.getElementById('perfil-menu-trigger');
    const menu = document.getElementById('menu-desplegable-perfil');
    if (!trigger || !menu) return;

    trigger.onclick = function(e) {
        e.stopPropagation();
        if (menu.style.display === 'none' || menu.style.display === '') {
            menu.style.display = 'block';
            setTimeout(() => {
                menu.style.transform = 'translateY(0)';
                menu.style.opacity = '1';
            }, 10);
        } else {
            cerrarMenuPerfil();
        }
    };

    document.onclick = function(e) {
        if (!menu.contains(e.target) && !trigger.contains(e.target)) {
            cerrarMenuPerfil();
        }
    };

    document.getElementById('btn-cambiar-nombre').onclick = function() {
        cerrarMenuPerfil();
        if (typeof abrirModalNombre === 'function') {
            abrirModalNombre();
        }
    };

    document.getElementById('btn-cambiar-logo').onclick = function() {
        cerrarMenuPerfil();
        abrirModalLogo();
    };

    document.getElementById('btn-cambiar-fecha').onclick = function() {
        cerrarMenuPerfil();
        if (typeof abrirModalFecha === 'function') {
            abrirModalFecha();
        }
    };
}

function cerrarMenuPerfil() {
    const menu = document.getElementById('menu-desplegable-perfil');
    if (menu && menu.style.display === 'block') {
        menu.style.transform = 'translateY(-10px)';
        menu.style.opacity = '0';
        setTimeout(() => {
            menu.style.display = 'none';
        }, 250);
    }
}

function abrirModalLogo() {
    let modalExistente = document.getElementById('modal-logo-custom');
    if (modalExistente) modalExistente.remove();

    const overlay = document.createElement('div');
    overlay.id = 'modal-logo-custom';
    overlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000;";

    const modalBox = document.createElement('div');
    modalBox.style.cssText = "background: var(--color-card-bg, #fff); color: var(--color-text, #333); padding: 24px; border-radius: 12px; width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border: 1px solid var(--color-border, #ccc);";

    const esBase64 = config.urlLogo && config.urlLogo.startsWith('data:');
    const urlInicial = config.urlLogo && !esBase64 ? config.urlLogo : '';

    modalBox.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 18px; font-size: 1.15rem; color: var(--color-text);">Actualizar Logo del Negocio</h3>
        
        <div id="seccion-url" style="margin-bottom: 16px; ${esBase64 ? 'display:none;' : ''}">
            <label style="display: block; font-size: 0.85rem; margin-bottom: 6px; color: var(--color-text);">Opción 1: Pegar URL de imagen</label>
            <div style="display: flex; gap: 8px;">
                <input type="text" id="input-modal-url" placeholder="https://..." value="${urlInicial}" style="flex: 1; padding: 10px; border: 1px solid var(--color-border, #ccc); border-radius: 6px; background: var(--color-background, #fff); color: var(--color-text, #333);">
                <button id="btn-borrar-url" style="padding: 10px 14px; background: var(--color-border, #eee); color: var(--color-text, #333); border: none; border-radius: 6px; cursor: pointer;" title="Borrar URL">🗑️</button>
            </div>
        </div>

        <div id="seccion-file" style="margin-bottom: 24px; ${urlInicial ? 'display:none;' : ''}">
            <label style="display: block; font-size: 0.85rem; margin-bottom: 6px; color: var(--color-text);">Opción 2: Subir archivo desde la PC</label>
            <div style="display: flex; gap: 8px; align-items: center;">
                <input type="file" id="input-modal-file" accept="image/png, image/jpeg, image/jpg, image/webp" style="flex: 1; font-size: 0.85rem; color: var(--color-text);">
                <button id="btn-borrar-file" style="padding: 10px 14px; background: var(--color-border, #eee); color: var(--color-text, #333); border: none; border-radius: 6px; cursor: pointer;" title="Quitar archivo cargado">🗑️</button>
            </div>
            ${esBase64 ? '<span style="font-size: 0.75rem; color: var(--color-primary); display: block; margin-top: 4px;">✔ Imagen local cargada actualmente</span>' : ''}
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button id="btn-modal-cancelar" style="padding: 10px 18px; background: var(--color-border, #e5e7eb); color: var(--color-text, #333); border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Cancelar</button>
            <button id="btn-modal-guardar" style="padding: 10px 18px; background: var(--color-primary, #007bff); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Guardar</button>
        </div>
    `;

    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);

    const inputUrl = document.getElementById('input-modal-url');
    const inputFile = document.getElementById('input-modal-file');
    const seccionUrl = document.getElementById('seccion-url');
    const seccionFile = document.getElementById('seccion-file');

    inputUrl.oninput = () => {
        if (inputUrl.value.trim() !== '') {
            seccionFile.style.display = 'none';
        } else {
            seccionFile.style.display = 'block';
        }
    };

    inputFile.onchange = () => {
        if (inputFile.files && inputFile.files[0]) {
            seccionUrl.style.display = 'none';
        } else {
            seccionUrl.style.display = 'block';
        }
    };

    document.getElementById('btn-borrar-url').onclick = () => {
        inputUrl.value = '';
        seccionFile.style.display = 'block';
    };

    document.getElementById('btn-borrar-file').onclick = () => {
        inputFile.value = '';
        seccionUrl.style.display = 'block';
    };

    document.getElementById('btn-modal-cancelar').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    document.getElementById('btn-modal-guardar').onclick = () => {
        const urlVal = inputUrl.value.trim();

        if (inputFile.files && inputFile.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                config.urlLogo = e.target.result;
                localStorage.setItem('dinner_craft_config', JSON.stringify(config));
                renderizarBarraNavegacion();
                overlay.remove();
            };
            reader.readAsDataURL(inputFile.files[0]);
        } else if (urlVal !== '') {
            config.urlLogo = urlVal;
            localStorage.setItem('dinner_craft_config', JSON.stringify(config));
            renderizarBarraNavegacion();
            overlay.remove();
        } else {
            config.urlLogo = null;
            localStorage.setItem('dinner_craft_config', JSON.stringify(config));
            renderizarBarraNavegacion();
            overlay.remove();
        }
    };
}

function abrirModalNombre() {
    let modalExistente = document.getElementById('modal-custom-prompt');
    if (modalExistente) modalExistente.remove();

    const overlay = document.createElement('div');
    overlay.id = 'modal-custom-prompt';
    overlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000;";

    const modalBox = document.createElement('div');
    modalBox.style.cssText = "background: var(--color-card-bg, #fff); color: var(--color-text, #333); padding: 24px; border-radius: 12px; width: 380px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border: 1px solid var(--color-border, #ccc);";

    modalBox.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 14px; font-size: 1.15rem; color: var(--color-text);">Cambiar Nombre del Negocio</h3>
        <input type="text" id="input-modal-valor" value="${config.nombreNegocio || ''}" style="width: 100%; padding: 10px; border: 1px solid var(--color-border, #ccc); border-radius: 6px; background: var(--color-background, #fff); color: var(--color-text, #333); margin-bottom: 20px; font-size: 0.95rem;">
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button id="btn-modal-cancelar" style="padding: 10px 18px; background: var(--color-border, #e5e7eb); color: var(--color-text, #333); border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Cancelar</button>
            <button id="btn-modal-guardar" style="padding: 10px 18px; background: var(--color-primary, #007bff); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Guardar</button>
        </div>
    `;

    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);

    const input = document.getElementById('input-modal-valor');
    input.focus();

    document.getElementById('btn-modal-cancelar').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    document.getElementById('btn-modal-guardar').onclick = () => {
        const nuevoNombre = input.value.trim();
        if (nuevoNombre !== "") {
            config.nombreNegocio = nuevoNombre;
            localStorage.setItem('dinner_craft_config', JSON.stringify(config));
            renderizarBarraNavegacion();
            if (typeof renderBusinessDetails === 'function') renderBusinessDetails();
            if (typeof verificarYRenderizarVistaActual === 'function') verificarYRenderizarVistaActual();
            
            let toastExistente = document.getElementById('toast-notificacion');
            if (toastExistente) toastExistente.remove();

            const toast = document.createElement('div');
            toast.id = 'toast-notificacion';
            toast.textContent = "¡Nombre actualizado correctamente!";
            toast.style.cssText = "position: fixed; bottom: 20px; right: 20px; background: var(--color-primary, #10b981); color: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999; font-weight: 600; font-size: 0.9rem;";
            document.body.appendChild(toast);
            setTimeout(() => { toast.remove(); }, 2500);
        }
        overlay.remove();
    };
}

function formatearFechaParaMostrar(fechaISO) {
    if (!fechaISO) return 'N/A';
    const partes = fechaISO.split('-');
    if (partes.length !== 3) return fechaISO;
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
}

function formatearFechaParaGuardar(fechaDDMMYYYY) {
    const partes = fechaDDMMYYYY.split('-');
    if (partes.length !== 3) return fechaDDMMYYYY;
    return `${partes[2]}-${partes[1]}-${partes[0]}`;
}

function abrirModalFecha() {
    let modalExistente = document.getElementById('modal-custom-prompt');
    if (modalExistente) modalExistente.remove();

    const overlay = document.createElement('div');
    overlay.id = 'modal-custom-prompt';
    overlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000;";

    const modalBox = document.createElement('div');
    modalBox.style.cssText = "background: var(--color-card-bg, #fff); color: var(--color-text, #333); padding: 24px; border-radius: 12px; width: 380px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border: 1px solid var(--color-border, #ccc);";

    const fechaISO = config.fechaAniversario || '';

    modalBox.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 6px; font-size: 1.15rem; color: var(--color-text);">Cambiar Fecha de Aniversario</h3>
        <p style="font-size: 0.85rem; color: var(--color-text); opacity: 0.8; margin-bottom: 14px;">Seleccione la fecha del negocio:</p>
        <input type="date" id="input-modal-valor" value="${fechaISO}" style="width: 100%; padding: 10px; border: 1px solid var(--color-border, #ccc); border-radius: 6px; background: var(--color-background, #fff); color: var(--color-text, #333); margin-bottom: 20px; font-size: 0.95rem;">
        <div style="display: flex; justify-content: flex-end; gap: 10px;">
            <button id="btn-modal-cancelar" style="padding: 10px 18px; background: var(--color-border, #e5e7eb); color: var(--color-text, #333); border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Cancelar</button>
            <button id="btn-modal-guardar" style="padding: 10px 18px; background: var(--color-primary, #007bff); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Guardar</button>
        </div>
    `;

    overlay.appendChild(modalBox);
    document.body.appendChild(overlay);

    const input = document.getElementById('input-modal-valor');
    input.focus();

    document.getElementById('btn-modal-cancelar').onclick = () => overlay.remove();
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

    document.getElementById('btn-modal-guardar').onclick = () => {
        const fechaSeleccionada = input.value;
        if (fechaSeleccionada) {
            config.fechaAniversario = fechaSeleccionada;
            localStorage.setItem('dinner_craft_config', JSON.stringify(config));
            if (typeof aplicarAparienciaCompleta === 'function') aplicarAparienciaCompleta();
            if (typeof renderBusinessDetails === 'function') renderBusinessDetails();
            if (typeof verificarYRenderizarVistaActual === 'function') verificarYRenderizarVistaActual();
            
            let toastExistente = document.getElementById('toast-notificacion');
            if (toastExistente) toastExistente.remove();

            const toast = document.createElement('div');
            toast.id = 'toast-notificacion';
            toast.textContent = "¡Fecha de aniversario actualizada!";
            toast.style.cssText = "position: fixed; bottom: 20px; right: 20px; background: var(--color-primary, #10b981); color: white; padding: 12px 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 9999; font-weight: 600; font-size: 0.9rem;";
            document.body.appendChild(toast);
            setTimeout(() => { toast.remove(); }, 2500);
        }
        overlay.remove();
    };
}

function verificarYRenderizarVistaActual() {
    const pagina = window.location.pathname.split("/").pop();
    if (pagina === 'business.html' && typeof renderBusinessDetails === 'function') {
        renderBusinessDetails();
    }

    if (pagina === '' || pagina === 'index.html') {
        const tituloBienvenida = document.getElementById('titulo-bienvenida');
        if (tituloBienvenida && config.fechaAniversario) {
            const hoy = new Date();
            const [anho, mes, dia] = config.fechaAniversario.split('-').map(Number);
            if (hoy.getMonth() + 1 === mes && hoy.getDate() === dia) {
                tituloBienvenida.textContent = "¡Feliz aniversario, de parte de Dinner Craft! 🎉🥳";
            }
        }
    }
}