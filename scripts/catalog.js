// ============================================================================
// SCRIPTS/CATALOG.JS - Gestión de Catálogo e Inventario Local
// ============================================================================

let baseDatosCatalogo = null;
const NOMBRE_BD_CATALOGO = 'DinnerCraftDB';
const VERSION_BD_CATALOGO = 1;
const ALMACEN_INVENTARIO = 'inventory';

function inicializarBaseDatosCatalogo() {
    return new Promise((resolve) => {
        const peticion = indexedDB.open(NOMBRE_BD_CATALOGO, VERSION_BD_CATALOGO);
        
        peticion.onerror = () => {
            resolve(null);
        };
        
        peticion.onsuccess = (evento) => {
            baseDatosCatalogo = evento.target.result;
            cargarYRenderizar();
        };
        
        peticion.onupgradeneeded = (evento) => {
            const db = evento.target.result;
            if (!db.objectStoreNames.contains(ALMACEN_INVENTARIO)) {
                db.createObjectStore(ALMACEN_INVENTARIO, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

function obtenerTodoInventario(callback) {
    if (!baseDatosCatalogo) {
        callback([]);
        return;
    }
    try {
        const transaccion = baseDatosCatalogo.transaction(ALMACEN_INVENTARIO, 'readonly');
        const almacen = transaccion.objectStore(ALMACEN_INVENTARIO);
        const peticion = almacen.getAll();
        
        peticion.onsuccess = () => callback(peticion.result || []);
        peticion.onerror = () => callback([]);
    } catch (e) {
        callback([]);
    }
}

function guardarItemInventario(datosItem, callback) {
    if (!baseDatosCatalogo) {
        if (callback) callback(null);
        return;
    }
    try {
        const transaccion = baseDatosCatalogo.transaction(ALMACEN_INVENTARIO, 'readwrite');
        const almacen = transaccion.objectStore(ALMACEN_INVENTARIO);
        const peticion = datosItem.id ? almacen.put(datosItem) : almacen.add(datosItem);
        
        peticion.onsuccess = () => { if (callback) callback(peticion.result); };
        peticion.onerror = () => { if (callback) callback(null); };
    } catch (e) {
        if (callback) callback(null);
    }
}

function cargarYRenderizar() {
    obtenerTodoInventario((itemsInventario) => {
        renderizarCatalogo(itemsInventario);
    });
}

function renderizarCatalogo(itemsInventario = []) {
    const contenedorContenido = document.getElementById('content');
    if (!contenedorContenido) return;

    let itemsCatalogo = itemsInventario.filter(item => item.catalogado === true || item.catalogado === undefined || item.catalogado === null);

    let html = `
        <div style="max-width: 1100px; margin: 0 auto; padding: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2 style="color: var(--color-text); margin: 0; font-weight: 700; font-size: 1.5rem;">Catálogo de Productos</h2>
                <button id="btn-abrir-popup-item" style="padding: 12px 20px; background: var(--color-primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">+ Nuevo producto</button>
            </div>

            <h3 style="margin-bottom: 20px; font-size: 1.1rem; color: var(--color-text);">Ítems Disponibles en Catálogo</h3>
    `;

    if (itemsCatalogo.length === 0) {
        html += `<p style="color: var(--color-text); opacity: 0.7; font-style: italic;">No hay ítems catalogados todavía. Añade uno nuevo usando el botón superior.</p>`;
    } else {
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px;">`;
        itemsCatalogo.forEach(item => {
            const precioMostrar = item.precio !== null && item.precio !== undefined && item.precio !== '' ? `$${item.precio}` : 'Precio heredado';
            
            html += `
                <div style="background: var(--color-card-bg); border: 1px solid var(--color-border); border-radius: 12px; padding: 24px; box-shadow: 0 6px 16px rgba(0,0,0,0.06); display: flex; flex-direction: column; justify-content: space-between;">
                    <div>
                        <div style="width: 56px; height: 56px; border-radius: 50%; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; font-weight: bold; margin-bottom: 16px;">
                            ${item.nombre ? item.nombre.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <h4 style="margin: 0 0 10px 0; font-size: 1.1rem; color: var(--color-text); font-weight: 600;">${item.nombre}</h4>
                        <p style="margin: 6px 0; font-size: 0.9rem; color: var(--color-text); opacity: 0.85;">💰 ${precioMostrar}</p>
                        <p style="margin: 6px 0 20px 0; font-size: 0.9rem; color: var(--color-text); opacity: 0.85;">📦 Stock: ${item.stock ?? 0}</p>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `</div>`;
    contenedorContenido.innerHTML = html;

    const btnNuevo = document.getElementById('btn-abrir-popup-item');
    if (btnNuevo) {
        btnNuevo.onclick = function() {
            abrirModalCrearItem();
        };
    }
}

function abrirModalCrearItem() {
    let modalExistente = document.getElementById('modal-item-custom');
    if (modalExistente) modalExistente.remove();

    const capaFondo = document.createElement('div');
    capaFondo.id = 'modal-item-custom';
    capaFondo.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000;";

    const cajaModal = document.createElement('div');
    cajaModal.style.cssText = "background: var(--color-card-bg, #fff); color: var(--color-text, #333); padding: 28px; border-radius: 12px; width: 420px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border: 1px solid var(--color-border, #ccc);";

    cajaModal.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 1.2rem; color: var(--color-text);">Crear Nuevo Producto</h3>
        <form id="formulario-crear-item">
            <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 0.85rem; margin-bottom: 6px; color: var(--color-text);">Nombre:</label>
                <input type="text" id="popupItemNombre" required style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 6px; background: #fff; color: #333;">
            </div>
            <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 0.85rem; margin-bottom: 6px; color: var(--color-text);">Precio ($):</label>
                <input type="number" id="popupItemPrecio" step="0.01" placeholder="Ej: 10.50" style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 6px; background: #fff; color: #333;">
            </div>
            <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 0.85rem; margin-bottom: 6px; color: var(--color-text);">Stock Inicial:</label>
                <input type="number" id="popupItemStock" value="0" required style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 6px; background: #fff; color: #333;">
            </div>
            <div style="margin-bottom: 20px; display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="popupItemCatalogado" checked style="width: 18px; height: 18px; cursor: pointer;">
                <label for="popupItemCatalogado" style="font-size: 0.9rem; color: var(--color-text); cursor: pointer;">Mostrar en Catálogo</label>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button type="button" id="btn-modal-item-cancelar" style="padding: 10px 18px; background: #e5e7eb; color: #333; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Cancelar</button>
                <button type="submit" style="padding: 10px 18px; background: var(--color-primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Guardar Producto</button>
            </div>
        </form>
    `;

    capaFondo.appendChild(cajaModal);
    document.body.appendChild(capaFondo);

    document.getElementById('btn-modal-item-cancelar').onclick = () => capaFondo.remove();
    capaFondo.onclick = (e) => { if (e.target === capaFondo) capaFondo.remove(); };

    document.getElementById('formulario-crear-item').onsubmit = function(e) {
        e.preventDefault();
        const nombre = document.getElementById('popupItemNombre').value.trim();
        const precioVal = document.getElementById('popupItemPrecio').value.trim();
        const precio = precioVal !== '' ? parseFloat(precioVal) : null;
        const stock = parseInt(document.getElementById('popupItemStock').value) || 0;
        const catalogado = document.getElementById('popupItemCatalogado').checked;

        if (nombre) {
            guardarItemInventario({
                nombre,
                precio,
                stock,
                catalogado,
                fechaCreacion: new Date().toISOString()
            }, () => {
                capaFondo.remove();
                cargarYRenderizar();
            });
        } else {
            alert("Por favor, ingresa al menos el nombre del producto.");
        }
    };
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarBaseDatosCatalogo);
} else {
    inicializarBaseDatosCatalogo();
}