// ============================================================================
// SCRIPTS/LEDGER.JS - Transactional Reporting
// ============================================================================

// Assume 'ledger' object is globally available from main.js
let currentLedger = {};

function renderLedger() {
    const contentDiv = document.getElementById('content');
    if (!contentDiv) return console.error("Content div not found.");
    
    // Basic HTML Table Generation
    let tableHtml = `
        <h2 style="margin-bottom: 20px;">Registro de datos</h2>
        <div class="crud-interface">
            <table style="width:100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: var(--color-border);">
                        <th style="padding: 10px; text-align: left;">ID</th>
                        <th style="padding: 10px; text-align: left;">Cliente</th>
                        <th style="padding: 10px; text-align: left;">Fecha</th>
                        <th style="padding: 10px; text-align: left;">Ítem</th>
                        <th style="padding: 10px; text-align: left;">Cant.</th>
                        <th style="padding: 10px; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody id="ledger-body">
                    <!-- Rows will be inserted here -->
                </tbody>
            </table>
        </div>
    `;
    contentDiv.innerHTML = tableHtml;
    
    // Populate rows
    const tbody = document.getElementById('ledger-body');
    if (tbody) {
        const rows = Object.values(ledger).sort((a, b) => new Date(b.Date) - new Date(a.Date)); // Newest first
        tbody.innerHTML = rows.map(entry => `
            <tr style="border-bottom: 1px solid var(--color-border);">
                <td style="padding: 10px;">${entry.ID}</td>
                <td style="padding: 10px;">${entry.ClientName}</td>
                <td style="padding: 10px;">${entry.Date}</td>
                <td style="padding: 10px;">${entry.Item}</td>
                <td style="padding: 10px; text-align: center;">${entry.Quantity}</td>
                <td style="padding: 10px; text-align: right;">$${parseFloat(entry.Total).toFixed(2)}</td>
            </tr>
        `).join('');
    }
}

// Initialize ledger view
renderLedger();