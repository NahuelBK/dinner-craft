// ============================================================================
// SCRIPTS/CLIENTS.JS - Gestión de Clientes Local con IndexedDB, Edición y Favoritos
// ============================================================================

let baseDatos = null;
const NOMBRE_BD = 'DinnerCraftDB';
const VERSION_BD = 1;
const ALMACEN_CLIENTES = 'clients';

function inicializarBaseDatos() {
    return new Promise((resolve, reject) => {
        const peticion = indexedDB.open(NOMBRE_BD, VERSION_BD);
        
        peticion.onerror = (evento) => {
            reject(evento.target.error);
        };
        
        peticion.onsuccess = (evento) => {
            baseDatos = evento.target.result;
            resolve(baseDatos);
        };
        
        peticion.onupgradeneeded = (evento) => {
            const db = evento.target.result;
            if (!db.objectStoreNames.contains(ALMACEN_CLIENTES)) {
                db.createObjectStore(ALMACEN_CLIENTES, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

async function obtenerTodosLosClientes() {
    return new Promise((resolve, reject) => {
        if (!baseDatos) return resolve([]);
        const transaccion = baseDatos.transaction(ALMACEN_CLIENTES, 'readonly');
        const almacen = transaccion.objectStore(ALMACEN_CLIENTES);
        const peticion = almacen.getAll();
        
        peticion.onsuccess = () => resolve(peticion.result);
        peticion.onerror = () => reject(peticion.error);
    });
}

async function agregarClienteBD(datosCliente) {
    return new Promise((resolve, reject) => {
        const transaccion = baseDatos.transaction(ALMACEN_CLIENTES, 'readwrite');
        const almacen = transaccion.objectStore(ALMACEN_CLIENTES);
        const peticion = almacen.add(datosCliente);
        
        peticion.onsuccess = () => resolve(peticion.result);
        peticion.onerror = () => reject(peticion.error);
    });
}

async function actualizarClienteBD(datosCliente) {
    return new Promise((resolve, reject) => {
        const transaccion = baseDatos.transaction(ALMACEN_CLIENTES, 'readwrite');
        const almacen = transaccion.objectStore(ALMACEN_CLIENTES);
        const peticion = almacen.put(datosCliente);
        
        peticion.onsuccess = () => resolve(peticion.result);
        peticion.onerror = () => reject(peticion.error);
    });
}

async function eliminarClienteBD(id) {
    return new Promise((resolve, reject) => {
        const transaccion = baseDatos.transaction(ALMACEN_CLIENTES, 'readwrite');
        const almacen = transaccion.objectStore(ALMACEN_CLIENTES);
        const peticion = almacen.delete(id);
        
        peticion.onsuccess = () => resolve();
        peticion.onerror = () => reject(peticion.error);
    });
}

async function cargarClientesDesdeJSON() {
    const existentes = await obtenerTodosLosClientes();
    if (existentes.length === 0) {
        try {
            const respuesta = await fetch('data/clients.json');
            if (respuesta.ok) {
                const datos = await respuesta.json();
                if (datos.clients && Array.isArray(datos.clients)) {
                    for (const cliente of datos.clients) {
                        if (cliente.favorito === undefined) cliente.favorito = false;
                        if (!cliente.direccionHabitual && cliente.dirección) {
                            cliente.direccionHabitual = cliente.dirección;
                        }
                        if (!Array.isArray(cliente.direccionesOcasionales)) cliente.direccionesOcasionales = [];
                        if (!Array.isArray(cliente.historialPedidos)) cliente.historialPedidos = [];
                        if (!Array.isArray(cliente.pedidosFiados)) cliente.pedidosFiados = [];
                        await agregarClienteBD(cliente);
                    }
                }
            }
        } catch (e) {
            console.log("No se pudo cargar JSON inicial o no existe, continuando con BD vacía.");
        }
    }
}

async function renderizarListaClientes() {
    const contenedorContenido = document.getElementById('content');
    if (!contenedorContenido) return;

    let listaClientes = await obtenerTodosLosClientes();

    let html = `
        <div style="max-width: 1100px; margin: 0 auto; padding: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2 style="color: var(--color-text); margin: 0; font-weight: 700; font-size: 1.5rem;">Gestión de Clientes</h2>
                <button id="btn-abrir-popup-cliente" style="padding: 12px 20px; background: var(--color-primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: transform 0.2s;">+ Nuevo Cliente</button>
            </div>

            <h3 style="margin-bottom: 20px; font-size: 1.1rem; color: var(--color-text);">Clientes Registrados</h3>
    `;

    if (listaClientes.length === 0) {
        html += `<p style="color: var(--color-text); opacity: 0.7; font-style: italic;">No hay clientes registrados en la base de datos local.</p>`;
    } else {
        html += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 24px;">`;
        listaClientes.forEach(cliente => {
            const esFavorito = cliente.favorito === true;
            const iconoEstrella = esFavorito ? '⭐' : '☆';
            const cantidadFiados = Array.isArray(cliente.pedidosFiados) ? cliente.pedidosFiados.length : 0;
            const dirHabitual = cliente.direccionHabitual || cliente.dirección || 'Sin dirección';

            html += `
                <div style="background: var(--color-card-bg); border: 1px solid var(--color-border); border-radius: 12px; padding: 24px; box-shadow: 0 6px 16px rgba(0,0,0,0.06); display: flex; flex-direction: column; justify-content: space-between; position: relative;">
                    
                    <button onclick="toggleFavoritoCliente(${cliente.id})" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 1.3rem; cursor: pointer;" title="Marcar como favorito">${iconoEstrella}</button>

                    <div>
                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
                            <div style="width: 48px; height: 48px; border-radius: 50%; background: var(--color-primary); color: white; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: bold; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
                                ${cliente.nombre ? cliente.nombre.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <div>
                                <h4 style="margin: 0 0 4px 0; font-size: 1.1rem; color: var(--color-text); font-weight: 600;">${cliente.nombre}</h4>
                                <p style="margin: 0; font-size: 0.85rem; color: var(--color-text); opacity: 0.8;">📞 ${cliente.número}</p>
                            </div>
                        </div>

                        <div style="background: rgba(0,0,0,0.02); padding: 12px; border-radius: 8px; margin-bottom: 16px; font-size: 0.85rem; color: var(--color-text);">
                            <p style="margin: 0 0 6px 0;"><strong>Habitual:</strong> 📍 ${dirHabitual}</p>
                            <p style="margin: 0 0 6px 0;"><strong>Ocasionales:</strong> ${cliente.direccionesOcasionales && cliente.direccionesOcasionales.length > 0 ? cliente.direccionesOcasionales.length : 'Ninguna'}</p>
                            <p style="margin: 0;"><strong>Fiados pendientes:</strong> <span style="color: ${cantidadFiados > 0 ? '#dc2626' : 'inherit'}; font-weight: ${cantidadFiados > 0 ? 'bold' : 'normal'};">${cantidadFiados}</span></p>
                        </div>
                    </div>

                    <div style="display: flex; gap: 8px;">
                        <button onclick="abrirModalEditarCliente(${cliente.id})" style="flex: 1; padding: 10px; background: #e0f2fe; color: #0284c7; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">✏️ Gestionar / Editar</button>
                        <button onclick="eliminarClienteRemota(${cliente.id})" style="padding: 10px 12px; background: #fee2e2; color: #dc2626; border: none; border-radius: 6px; cursor: pointer; font-size: 0.85rem;" title="Eliminar">🗑️</button>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `</div>`;
    contenedorContenido.innerHTML = html;

    document.getElementById('btn-abrir-popup-cliente').onclick = function() {
        abrirModalCrearCliente();
    };
}

function abrirModalCrearCliente() {
    let modalExistente = document.getElementById('modal-cliente-custom');
    if (modalExistente) modalExistente.remove();

    const capaFondo = document.createElement('div');
    capaFondo.id = 'modal-cliente-custom';
    capaFondo.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; overflow-y: auto; padding: 20px;";

    const cajaModal = document.createElement('div');
    cajaModal.style.cssText = "background: var(--color-card-bg, #fff); color: var(--color-text, #333); padding: 28px; border-radius: 12px; width: 480px; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border: 1px solid var(--color-border, #ccc);";

    cajaModal.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 20px; font-size: 1.2rem; color: var(--color-text);">Crear Nuevo Cliente</h3>
        <form id="formulario-crear-cliente">
            <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 0.85rem; margin-bottom: 6px; color: var(--color-text);">Nombre:</label>
                <input type="text" id="popupClienteNombre" required style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 6px; background: #fff; color: #333;">
            </div>
            <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 0.85rem; margin-bottom: 6px; color: var(--color-text);">Número / Teléfono:</label>
                <input type="text" id="popupClienteNúmero" required placeholder="+549..." maxlength="25" style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 6px; background: #fff; color: #333;">
            </div>
            <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 0.85rem; margin-bottom: 6px; color: var(--color-text);">Dirección Habitual (Única):</label>
                <input type="text" id="popupClienteDireccionHabitual" required style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 6px; background: #fff; color: #333;">
            </div>
            <div style="margin-bottom: 24px;">
                <label style="display: block; font-size: 0.85rem; margin-bottom: 6px; color: var(--color-text);">Direcciones Ocasionales (Separadas por coma o una por línea, opcional):</label>
                <textarea id="popupClienteOcasionales" placeholder="Ej: Calle falsa 123, Avenida Siempreviva 1996..." style="width: 100%; padding: 10px; border: 1px solid var(--color-border); border-radius: 6px; background: #fff; color: #333; height: 70px; resize: vertical;"></textarea>
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button type="button" id="btn-modal-cli-cancelar" style="padding: 10px 18px; background: #e5e7eb; color: #333; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Cancelar</button>
                <button type="submit" style="padding: 10px 18px; background: var(--color-primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Guardar Cliente</button>
            </div>
        </form>
    `;

    capaFondo.appendChild(cajaModal);
    document.body.appendChild(capaFondo);

    const inputTelefono = document.getElementById('popupClienteNúmero');
    inputTelefono.oninput = (e) => {
        let valor = e.target.value;
        let tieneSignoMas = valor.startsWith('+');
        valor = valor.replace(/[^0-9\-]/g, '');
        if (tieneSignoMas) valor = '+' + valor;
        e.target.value = valor;
    };

    document.getElementById('btn-modal-cli-cancelar').onclick = () => capaFondo.remove();
    capaFondo.onclick = (e) => { if (e.target === capaFondo) capaFondo.remove(); };

    document.getElementById('formulario-crear-cliente').onsubmit = async function(e) {
        e.preventDefault();
        const nombre = document.getElementById('popupClienteNombre').value.trim();
        const número = inputTelefono.value.trim();
        const direccionHabitual = document.getElementById('popupClienteDireccionHabitual').value.trim();
        const ocasionalesRaw = document.getElementById('popupClienteOcasionales').value.trim();
        const direccionesOcasionales = ocasionalesRaw ? ocasionalesRaw.split('\n').map(d => d.trim()).filter(Boolean) : [];

        if (nombre && número && direccionHabitual) {
            await agregarClienteBD({
                nombre,
                número,
                direccionHabitual,
                direccionesOcasionales,
                historialPedidos: [],
                pedidosFiados: [],
                favorito: false,
                fechaCreacion: new Date().toISOString()
            });
            capaFondo.remove();
            renderizarListaClientes();
        } else {
            alert("Por favor, completa los campos obligatorios (Nombre, Teléfono y Dirección Habitual).");
        }
    };
}

async function abrirModalEditarCliente(id) {
    let listaClientes = await obtenerTodosLosClientes();
    let cliente = listaClientes.find(c => c.id === id);
    if (!cliente) return;

    if (!cliente.direccionHabitual && cliente.dirección) cliente.direccionHabitual = cliente.dirección;
    if (!Array.isArray(cliente.direccionesOcasionales)) cliente.direccionesOcasionales = [];
    if (!Array.isArray(cliente.historialPedidos)) cliente.historialPedidos = [];
    if (!Array.isArray(cliente.pedidosFiados)) cliente.pedidosFiados = [];

    let modalExistente = document.getElementById('modal-cliente-custom');
    if (modalExistente) modalExistente.remove();

    const capaFondo = document.createElement('div');
    capaFondo.id = 'modal-cliente-custom';
    capaFondo.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 2000; overflow-y: auto; padding: 20px;";

    const cajaModal = document.createElement('div');
    cajaModal.style.cssText = "background: var(--color-card-bg, #fff); color: var(--color-text, #333); padding: 28px; border-radius: 12px; width: 540px; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border: 1px solid var(--color-border, #ccc);";

    let htmlFiados = '';
    if (cliente.pedidosFiados.length === 0) {
        htmlFiados = `<p style="font-size: 0.85rem; opacity: 0.7; font-style: italic; margin: 5px 0;">No tiene pedidos fiados pendientes.</p>`;
    } else {
        cliente.pedidosFiados.forEach((fiado, index) => {
            // Convertir ítems a formato horizontal tipo Excel si vienen en array
            let itemsTexto = '';
            if (Array.isArray(fiado.items)) {
                itemsTexto = fiado.items.map(it => `${it.nombre || it} $${it.precio || ''}`).filter(Boolean).join(', ');
            } else {
                itemsTexto = String(fiado.items || '');
            }

            htmlFiados += `
                <div style="display: flex; justify-content: space-between; align-items: center; background: #fee2e2; padding: 8px 12px; border-radius: 6px; margin-bottom: 6px; font-size: 0.85rem;">
                    <div style="flex: 1; padding-right: 8px; overflow: hidden;">
                        <strong>${fiado.fecha || 'Fecha'}</strong> - <span style="font-weight: 600;">$${fiado.precioFinal}</span><br>
                        <span style="font-size: 0.75rem; opacity: 0.85; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;">Items: ${itemsTexto}</span>
                    </div>
                    <button type="button" onclick="pagarFiadoCliente(${cliente.id}, ${index})" style="padding: 6px 10px; background: #16a34a; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.75rem; white-space: nowrap;">Marcar Pagado</button>
                </div>
            `;
        });
    }

    let htmlHistorial = '';
    if (cliente.historialPedidos.length === 0) {
        htmlHistorial = `<p style="font-size: 0.85rem; opacity: 0.7; font-style: italic; margin: 5px 0;">Sin historial registrado.</p>`;
    } else {
        // Mostramos en orden inverso (más recientes arriba)
        cliente.historialPedidos.slice().reverse().forEach(ped => {
            let itemsTexto = '';
            if (Array.isArray(ped.items)) {
                itemsTexto = ped.items.map(it => `${it.nombre || it} $${it.precio || ''}`).filter(Boolean).join(', ');
            } else {
                itemsTexto = String(ped.items || 'Pedido general');
            }

            htmlHistorial += `
                <div style="background: rgba(0,0,0,0.03); padding: 8px 10px; border-radius: 6px; margin-bottom: 6px; font-size: 0.8rem; border-left: 3px solid var(--color-primary);">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                        <strong>${ped.fecha || 'Fecha'}</strong>
                        <span style="font-weight: 600;">$${ped.precioFinal} (${ped.metodoPago})${ped.esFiado ? ' <span style="color:#dc2626; font-weight:bold;">(fiado)</span>' : ''}</span>
                    </div>
                    <div style="opacity: 0.85; font-size: 0.78rem;">
                        📍 ${ped.direccionUsada || 'Dirección habitual'} | 🛒 ${itemsTexto}
                    </div>
                </div>
            `;
        });
    }

    cajaModal.innerHTML = `
        <h3 style="margin-top: 0; margin-bottom: 16px; font-size: 1.2rem; color: var(--color-text);">Editar Cliente & Historial</h3>
        <form id="formulario-editar-cliente">
            <div style="margin-bottom: 14px;">
                <label style="display: block; font-size: 0.85rem; margin-bottom: 4px; color: var(--color-text);">Nombre:</label>
                <input type="text" id="popupClienteNombre" value="${cliente.nombre || ''}" required style="width: 100%; padding: 8px; border: 1px solid var(--color-border); border-radius: 6px; background: #fff; color: #333;">
            </div>
            <div style="margin-bottom: 14px;">
                <label style="display: block; font-size: 0.85rem; margin-bottom: 4px; color: var(--color-text);">Número / Teléfono:</label>
                <input type="text" id="popupClienteNúmero" value="${cliente.número || ''}" required maxlength="25" style="width: 100%; padding: 8px; border: 1px solid var(--color-border); border-radius: 6px; background: #fff; color: #333;">
            </div>
            <div style="margin-bottom: 14px;">
                <label style="display: block; font-size: 0.85rem; margin-bottom: 4px; color: var(--color-text);">Dirección Habitual (Única):</label>
                <input type="text" id="popupClienteDireccionHabitual" value="${cliente.direccionHabitual || ''}" required style="width: 100%; padding: 8px; border: 1px solid var(--color-border); border-radius: 6px; background: #fff; color: #333;">
            </div>
            <div style="margin-bottom: 16px;">
                <label style="display: block; font-size: 0.85rem; margin-bottom: 4px; color: var(--color-text);">Direcciones Ocasionales (Una por línea):</label>
                <textarea id="popupClienteOcasionales" style="width: 100%; padding: 8px; border: 1px solid var(--color-border); border-radius: 6px; background: #fff; color: #333; height: 60px; resize: vertical;">${cliente.direccionesOcasionales.join('\n')}</textarea>
            </div>

            <!-- Contenedor con scroll vertical para Fiados Pendientes (aprox 5 líneas de alto max) -->
            <div style="border-top: 1px solid var(--color-border); padding-top: 12px; margin-bottom: 16px;">
                <label style="display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 6px; color: #dc2626;">Pedidos Fiados Pendientes:</label>
                <div style="max-height: 160px; overflow-y: auto; padding-right: 4px;">
                    ${htmlFiados}
                </div>
            </div>

            <!-- Contenedor con scroll vertical para Historial de Pedidos (aprox 5 saltos de línea / 180px) -->
            <div style="border-top: 1px solid var(--color-border); padding-top: 12px; margin-bottom: 20px;">
                <label style="display: block; font-size: 0.9rem; font-weight: 600; margin-bottom: 6px; color: var(--color-text);">Últimos Pedidos (Historial):</label>
                <div style="max-height: 180px; overflow-y: auto; padding-right: 4px;">
                    ${htmlHistorial}
                </div>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button type="button" id="btn-modal-cli-cancelar" style="padding: 10px 18px; background: #e5e7eb; color: #333; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">Cancelar</button>
                <button type="submit" style="padding: 10px 18px; background: var(--color-primary); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">Actualizar Cliente</button>
            </div>
        </form>
    `;

    capaFondo.appendChild(cajaModal);
    document.body.appendChild(capaFondo);

    const inputTelefono = document.getElementById('popupClienteNúmero');
    inputTelefono.oninput = (e) => {
        let valor = e.target.value;
        let tieneSignoMas = valor.startsWith('+');
        valor = valor.replace(/[^0-9\-]/g, '');
        if (tieneSignoMas) valor = '+' + valor;
        e.target.value = valor;
    };

    document.getElementById('btn-modal-cli-cancelar').onclick = () => capaFondo.remove();
    capaFondo.onclick = (e) => { if (e.target === capaFondo) capaFondo.remove(); };

    document.getElementById('formulario-editar-cliente').onsubmit = async function(e) {
        e.preventDefault();
        const nombre = document.getElementById('popupClienteNombre').value.trim();
        const número = inputTelefono.value.trim();
        const direccionHabitual = document.getElementById('popupClienteDireccionHabitual').value.trim();
        const ocasionalesRaw = document.getElementById('popupClienteOcasionales').value.trim();
        const direccionesOcasionales = ocasionalesRaw ? ocasionalesRaw.split('\n').map(d => d.trim()).filter(Boolean) : [];

        if (nombre && número && direccionHabitual) {
            cliente.nombre = nombre;
            cliente.número = número;
            cliente.direccionHabitual = direccionHabitual;
            cliente.direccionesOcasionales = direccionesOcasionales;
            await actualizarClienteBD(cliente);
            capaFondo.remove();
            renderizarListaClientes();
        } else {
            alert("Por favor, completa los campos obligatorios.");
        }
    };
}

async function registrarPedidoCliente(clienteId, datosPedido) {
    let listaClientes = await obtenerTodosLosClientes();
    let cliente = listaClientes.find(c => c.id === clienteId);
    if (!cliente) return;

    if (!Array.isArray(cliente.historialPedidos)) cliente.historialPedidos = [];
    if (!Array.isArray(cliente.pedidosFiados)) cliente.pedidosFiados = [];

    const esFiado = datosPedido.metodoPago && datosPedido.metodoPago.toLowerCase() === 'fiado';
    
    const pedidoParaHistorial = {
        ...datosPedido,
        esFiado: esFiado,
        descripcionMetodo: esFiado ? `${datosPedido.metodoPago} (fiado)` : datosPedido.metodoPago
    };

    cliente.historialPedidos.push(pedidoParaHistorial);

    if (esFiado) {
        cliente.pedidosFiados.push(pedidoParaHistorial);
    }

    await actualizarClienteBD(cliente);
}

window.pagarFiadoCliente = async function(clienteId, indiceFiado) {
    let listaClientes = await obtenerTodosLosClientes();
    let cliente = listaClientes.find(c => c.id === clienteId);
    if (!cliente) return;

    if (cliente.pedidosFiados && cliente.pedidosFiados[indiceFiado]) {
        cliente.pedidosFiados.splice(indiceFiado, 1);
        await actualizarClienteBD(cliente);
        abrirModalEditarCliente(clienteId);
        renderizarListaClientes();
    }
};

window.toggleFavoritoCliente = async function(id) {
    let listaClientes = await obtenerTodosLosClientes();
    let cliente = listaClientes.find(c => c.id === id);
    if (cliente) {
        cliente.favorito = !cliente.favorito;
        await actualizarClienteBD(cliente);
        renderizarListaClientes();
    }
};

window.eliminarClienteRemota = async function(id) {
    if (confirm("¿Estás seguro de eliminar este cliente de la base de datos local?")) {
        await eliminarClienteBD(id);
        renderizarListaClientes();
    }
};

inicializarBaseDatos().then(async () => {
    await cargarClientesDesdeJSON();
    renderizarListaClientes();
});
