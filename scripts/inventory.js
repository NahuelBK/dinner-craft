// scripts/inventory.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("Inventario: Inicializando lógica del motor transaccional...");
    let inventoryData = {};
    let catalogData = [];

    const inventoryPath = 'data/inventory.json';
    const catalogPath = 'data/catalog.json';
    const receiptLogPath = 'data/ledger.csv';

    async function mockFetch(path, options = {}) {
        if (path.includes('inventory.json')) {
            let data = {
                'item1': { id: 'item1', nombre: 'Plato Principal Elegante', stock: 50 },
                'item2': { id: 'item2', nombre: 'Postre de Vainilla', stock: 120 },
                'item3': { id: 'item3', nombre: 'Vino Reserva Tinta', stock: 20 },
                'item4': { id: 'item4', nombre: 'Nuevos Panes Artisanales', stock: 100 }
            };
            if (options.method === 'POST') {
                 return { ok: true, json: async () => data };
            }
            return { ok: true, json: async () => data };
        }
        if (path.includes('catalog.json')) {
            return { ok: true, json: async () => [
                { id: 'item1', nombre: 'Plato Principal Elegante', sku: 'PME001', precio: 25.99, catalogado: true },
                { id: 'item2', nombre: 'Postre de Vainilla', sku: 'PV002', precio: 8.50, catalogado: true },
                { id: 'item3', nombre: 'Vino Reserva Tinta', sku: 'VRT003', precio: 45.00, catalogado: false },
                { id: 'item4', nombre: 'Nuevos Panes Artisanales', sku: 'NPA004', precio: 3.00, catalogado: true }
            ]};
        }
        return { ok: false, json: async () => null };
    }

    async function loadData() {
        try {
            console.log("Cargando datos de Inventario y Catálogo...");
            
            const invResponse = await mockFetch(inventoryPath);
            inventoryData = await invResponse.json();
            
            const catResponse = await mockFetch(catalogPath);
            catalogData = await catResponse.json();
            
            await syncInventoryFromCatalog();

            renderInventory();
        } catch (error) {
            console.error("Fallo al cargar datos:", error);
            document.getElementById('content').innerHTML = `<p class="error">Error: No se pudieron cargar los datos de inventario. ${error.message}</p>`;
        }
    }

    async function syncInventoryFromCatalog() {
        console.log("Ejecutando sincronización de Catálogo a Inventario...");
        for (const item of catalogData) {
            const invItem = inventoryData[item.id];
            if (item.catalogado && !invItem) {
                inventoryData[item.id] = { id: item.id, nombre: item.nombre, stock: 0 };
                console.log(\`[SYNC] Item \${item.id} añadido a inventario basado en Catálogo.\`);
            } else if (!item.catalogado && invItem) {
                console.warn(\`[SYNC] Item \${item.id} está oculto en Catálogo, pero sigue en Inventario.\`);
            }
        }
        await mockFetch(inventoryPath, { method: 'POST', body: JSON.stringify(inventoryData) });
    }

    function renderInventory() {
        const contentDiv = document.getElementById('content');
        if (!contentDiv) return;

        let html = '<h2>Gestión de Inventario</h2><p>Stock y Movimientos de Productos</p>';
        html += '<div class="inventory-list">';

        // Task 2: Transactional Motor Visualization
        Object.values(inventoryData).forEach(item => {
            const catalogItem = catalogData.find(ci => ci.id === item.id);
            const isSaleable = catalogItem && catalogItem.catalogado;
            
            html += `<div class="item-card ${isSaleable ? 'saleable' : 'hidden'}">
                        <h3>${item.nombre} (SKU: ${catalogItem ? catalogItem.sku : 'N/A'})</h3>
                        <p>Stock Actual: <strong>${item.stock}</strong></p>
                        <p>Visibilidad: ${isSaleable ? 'Visible en Catálogo' : 'Oculto'}</p>
                        ${isSaleable ? `<button class="sell-btn" data-id="${item.id}">Registrar Venta</button>` : ''}
                    </div>`;
        });

        html += '</div>';

        html += '<hr><div id="transaction-log"><h3>Historial de Transacciones (Ledger)</h3><ul id="log-entries"></ul></div>';

        contentDiv.innerHTML = html;

        document.querySelectorAll('.sell-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                handleSaleTransaction(e.target.dataset.id);
            });
        });
        
        loadTransactionLog();
    }
    
    async function handleSaleTransaction(itemId) {
        if (!confirm("¿Está seguro de que desea registrar esta venta?")) return;

        const item = inventoryData[itemId];
        if (!item) {
            alert("Item no encontrado en inventario.");
            return;
        }

        const quantity = parseInt(prompt("¿Cuántas unidades se venden?"), 10);

        if (isNaN(quantity) || quantity <= 0) {
            alert("Cantidad inválida.");
            return;
        }

        if (item.stock < quantity) {
            alert("Error: Stock insuficiente.");
            return;
        }

        item.stock -= quantity;
        inventoryData[itemId] = item;

        const catalogItem = catalogData.find(ci => ci.id === itemId);
        const price = catalogItem ? catalogItem.precio : 0;
        const total = price * quantity;
        const timestamp = new Date().toISOString();
        
        const logEntry = `${timestamp},${item.nombre},Venta,${quantity},${total.toFixed(2)}\n`;

        try {
            await mockFetch(inventoryPath, { method: 'POST', body: JSON.stringify(inventoryData) });
            
            let ledger = await mockFetch(receiptLogPath).then(r => r.json());
            ledger.push(logEntry);
            await mockFetch(receiptLogPath, { method: 'POST', body: ledger.join('') });

            alert(`Venta registrada con éxito. Stock restante: ${item.stock}`);
            renderInventory();

        } catch (error) {
            console.error("Error al actualizar stock o ledger:", error);
            alert("Fallo al completar la transacción.");
        }
    }

    function loadTransactionLog() {
        const logUl = document.getElementById('log-entries');
        if (!logUl) return;
        
        const mockLogs = [
            "2023-10-27T10:00:00.000Z,Plato Principal Elegante,Venta,5,129.95",
            "2023-10-27T10:05:00.000Z,Postre de Vainilla,Venta,10,85.00"
        ];

        logUl.innerHTML = mockLogs.map(log => {
            const [timestamp, name, type, quantity, total] = log.split(',');
            return \`<li>[\${timestamp.substring(0,10)}] \${name} - \${type}: \${quantity} x \${total}€</li>\`;
        }).join('');
    }
});
