// scripts/inventory.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("Inventario: Inicializando lógica del motor transaccional...");
    let inventoryData = {};
    let catalogData = [];

    const inventoryPath = '../data/inventory.json';
    const catalogPath = '../data/catalog.json';
    const receiptLogPath = '../data/ledger.csv'; // Reusing ledger for quick logging

    // --- Mock Data Fetching for Simulation ---
    // Note: In a real implementation, these would be proper AJAX calls.
    async function mockFetch(path, options = {}) {
        if (path.includes('inventory.json')) {
            let data = {
                'item1': { id: 'item1', nombre: 'Plato Principal Elegante', stock: 50 },
                'item2': { id: 'item2', nombre: 'Postre de Vainilla', stock: 120 },
                'item3': { id: 'item3', nombre: 'Vino Reserva Tinta', stock: 20 },
                'item4': { id: 'item4', nombre: 'Nuevos Panes Artisanales', stock: 100 }
            };
            if (options.method === 'POST') {
                 return { ok: true, json: async () => data }; // Mock update
            }
            return { ok: true, json: async () => data };
        }
        if (path.includes('catalog.json')) {
            return { ok: true, json: async () => [
                { id: 'item1', nombre: 'Plato Principal Elegante', sku: 'PME001', precio: 25.99, catalogado: true },
                { id: 'item2', nombre: 'Postre de Vainilla', sku: 'PV002', precio: 8.50, catalogado: true },
                { id: 'item3', nombre: 'Vino Reserva Tinta', sku: 'VRT003', precio: 45.00, catalogado: false }, // Not cataloged
                { id: 'item4', nombre: 'Nuevos Panes Artisanales', sku: 'NPA004', precio: 3.00, catalogado: true } // New item example
            ]};
        }
        return { ok: false, json: async () => null };
    }
    // --- End Mock Data Fetching ---

    async function loadData() {
        try {
            console.log("Cargando datos de Inventario y Catálogo...");
            // Load Inventory
            const invResponse = await mockFetch(inventoryPath);
            inventoryData = await invResponse.json();
            
            // Load Catalog
            const catResponse = await mockFetch(catalogPath);
            catalogData = await catResponse.json();
            
            // Task 3 Sync: Initial check to ensure inventory matches catalog state
            await syncInventoryFromCatalog();

            renderInventory();
        } catch (error) {
            console.error("Fallo al cargar datos:", error);
            document.getElementById('content').innerHTML = `<p class="error">Error: No se pudieron cargar los datos de inventario. ${error.message}</p>`;
        }
    }

    // Task 3: Synchronization Logic (Catalog -> Inventory visibility)
    async function syncInventoryFromCatalog() {
        console.log("Ejecutando sincronización de Catálogo a Inventario...");
        for (const item of catalogData) {
            const invItem = inventoryData[item.id];
            if (item.catalogado && !invItem) {
                // Item is in catalog but not in inventory (shouldn't happen if creation flow works, but safety net)
                inventoryData[item.id] = { id: item.id, nombre: item.nombre, stock: 0 };
                console.log(\`[SYNC] Item \${item.id} añadido a inventario basado en Catálogo.\`);
            } else if (!item.catalogado && invItem) {
                // Item is removed from catalog but still in inventory (Mark as non-saleable/hidden)
                // In a real system, we'd change a 'saleable' flag, here we just log it.
                console.warn(\`[SYNC] Item \${item.id} está oculto en Catálogo, pero sigue en Inventario.\`);
            }
        }
        // Persist changes (simulated)
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

        // Task 2: Receipt/Log Display
        html += '<hr><div id="transaction-log"><h3>Historial de Transacciones (Ledger)</h3><ul id="log-entries"></ul></div>';

        contentDiv.innerHTML = html;

        // Attach event listeners
        document.querySelectorAll('.sell-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                handleSaleTransaction(e.target.dataset.id);
            });
        });
        
        // Load and display log (simulated)
        loadTransactionLog();
    }
    
    // Task 2: Transactional Motor - Deduction and Logging
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

        // 1. Perform Deduction (Core Motor Logic)
        item.stock -= quantity;
        inventoryData[itemId] = item; // Update local reference

        // 2. Log Transaction (Ledger)
        const catalogItem = catalogData.find(ci => ci.id === itemId);
        const price = catalogItem ? catalogItem.precio : 0;
        const total = price * quantity;
        const timestamp = new Date().toISOString();
        
        const logEntry = `${timestamp},${item.nombre},Venta,${quantity},${total.toFixed(2)}\n`;

        try {
            // 3. Save updated Inventory and Ledger
            await mockFetch(inventoryPath, { method: 'POST', body: JSON.stringify(inventoryData) });
            
            let ledger = await mockFetch(receiptLogPath).then(r => r.json()); // Mock read
            ledger.push(logEntry);
            await mockFetch(receiptLogPath, { method: 'POST', body: ledger.join('') }); // Mock write

            alert(`Venta registrada con éxito. Stock restante: ${item.stock}`);
            renderInventory(); // Re-render the entire view

        } catch (error) {
            console.error("Error al actualizar stock o ledger:", error);
            alert("Fallo al completar la transacción.");
        }
    }

    // Task 2: Receipt/Log Display
    function loadTransactionLog() {
        const logUl = document.getElementById('log-entries');
        if (!logUl) return;
        
        // Mock log data
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