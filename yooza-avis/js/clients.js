/**
 * clients.js — Liste des clients Yooza Avis V1
 */

'use strict';

// État local de la liste
let clientsFilter = {
  search: '',
  statut: 'tous',
};

function renderClients(container) {
  container.innerHTML = `
    <!-- En-tête -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;flex-wrap:wrap;gap:1rem">
      <div>
        <div class="section-label">Gestion</div>
        <h1 style="font-family:var(--font-heading);font-size:1.75rem;font-weight:700;letter-spacing:-0.02em;color:var(--yooza-black)">
          Liste des clients
        </h1>
      </div>
      <div style="display:flex;gap:0.75rem;flex-wrap:wrap">
        <button class="btn btn-secondary btn-sm" onclick="exportCSV()">
          ↓ Exporter CSV
        </button>
      </div>
    </div>

    <!-- Filtres -->
    <div class="filters-bar">
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input
          type="text"
          class="search-input"
          id="search-input"
          placeholder="Rechercher un client, une entreprise..."
          value="${escapeHtml(clientsFilter.search)}"
          oninput="handleSearch(this.value)"
        >
      </div>
      <select class="filter-select" id="filter-statut" onchange="handleFilterStatut(this.value)">
        <option value="tous" ${clientsFilter.statut === 'tous' ? 'selected' : ''}>Tous les statuts</option>
        <option value="${STATUS.TO_SEND}"  ${clientsFilter.statut === STATUS.TO_SEND  ? 'selected' : ''}>À envoyer</option>
        <option value="${STATUS.SENT}"     ${clientsFilter.statut === STATUS.SENT     ? 'selected' : ''}>Envoyé</option>
        <option value="${STATUS.RECEIVED}" ${clientsFilter.statut === STATUS.RECEIVED ? 'selected' : ''}>Avis reçu</option>
      </select>
    </div>

    <!-- Tableau -->
    <div class="card">
      <div id="clients-table-wrapper">
        ${renderClientsTable()}
      </div>
    </div>
  `;
}

function renderClientsTable() {
  const filtered = getFilteredClients();

  if (filtered.length === 0) {
    return `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <div class="empty-state-title">Aucun client trouvé</div>
        <div class="empty-state-desc">Modifiez vos filtres pour afficher des résultats.</div>
      </div>
    `;
  }

  const search = clientsFilter.search.toLowerCase();

  function highlight(text) {
    const rawText = String(text);
    if (!search) return escapeHtml(rawText);
    const idx = rawText.toLowerCase().indexOf(search);
    if (idx === -1) return escapeHtml(rawText);
    return escapeHtml(rawText.substring(0, idx))
      + `<mark class="highlight">${escapeHtml(rawText.substring(idx, idx + search.length))}</mark>`
      + escapeHtml(rawText.substring(idx + search.length));
  }

  return `
    <div style="padding:0.75rem 1.5rem;border-bottom:1px solid var(--yooza-border);display:flex;align-items:center;justify-content:space-between">
      <span style="font-size:0.8rem;color:var(--yooza-gray);font-weight:500">
        ${filtered.length} client${filtered.length > 1 ? 's' : ''}
      </span>
    </div>
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Client</th>
            <th>Contact</th>
            <th>Intervention</th>
            <th>Date fin</th>
            <th>Statut</th>
            <th>Note</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(c => `
            <tr onclick="navigate('#/client/${safeClientId(c.id)}')">
              <td>
                <div style="display:flex;align-items:center;gap:0.75rem">
                  <div style="width:34px;height:34px;background:var(--yooza-yellow);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.75rem;flex-shrink:0;color:var(--yooza-black)">
                    ${escapeHtml(getInitials(c.nom))}
                  </div>
                  <div>
                    <div class="client-name">${highlight(c.nom)}</div>
                    <div class="client-company">${highlight(c.entreprise)}</div>
                  </div>
                </div>
              </td>
              <td>
                <div class="text-sm">${escapeHtml(c.telephone)}</div>
                <div class="text-xs text-muted">${escapeHtml(c.email)}</div>
              </td>
              <td class="text-sm text-muted">${escapeHtml(c.typeIntervention)}</td>
              <td class="text-sm text-muted">${escapeHtml(formatDate(c.dateFinIntervention))}</td>
              <td>
                <span class="badge ${STATUS_BADGE_CLASS[c.statut]}">
                  ${escapeHtml(STATUS_LABELS[c.statut])}
                </span>
              </td>
              <td>
                ${c.noteGoogle ? renderStars(c.noteGoogle) : '<span class="text-muted text-xs">—</span>'}
              </td>
              <td>
                ${c.statut === STATUS.TO_SEND ? `
                  <button class="btn btn-primary btn-sm"
                    onclick="event.stopPropagation();quickSend(${safeClientId(c.id)})"
                    title="Envoyer une demande d'avis">
                    Envoyer
                  </button>
                ` : `
                  <button class="btn btn-ghost btn-sm"
                    onclick="event.stopPropagation();navigate('#/client/${safeClientId(c.id)}')">
                    Voir →
                  </button>
                `}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function getFilteredClients() {
  let list = [...AppState.clients];
  const search = clientsFilter.search.toLowerCase().trim();

  if (clientsFilter.statut !== 'tous') {
    list = list.filter(c => c.statut === clientsFilter.statut);
  }

  if (search) {
    list = list.filter(c =>
      c.nom.toLowerCase().includes(search) ||
      c.entreprise.toLowerCase().includes(search) ||
      c.email.toLowerCase().includes(search) ||
      c.typeIntervention.toLowerCase().includes(search)
    );
  }

  return list.sort((a, b) => new Date(b.dateFinIntervention) - new Date(a.dateFinIntervention));
}

function handleSearch(value) {
  clientsFilter.search = value;
  document.getElementById('clients-table-wrapper').innerHTML = renderClientsTable();
}

function handleFilterStatut(value) {
  clientsFilter.statut = value;
  document.getElementById('clients-table-wrapper').innerHTML = renderClientsTable();
}

function exportCSV() {
  const filtered = getFilteredClients();
  const headers = ['Nom', 'Entreprise', 'Téléphone', 'Email', 'Intervention', 'Date fin', 'Statut', 'Note'];
  const rows = filtered.map(c => [
    c.nom, c.entreprise, c.telephone, c.email,
    c.typeIntervention, formatDate(c.dateFinIntervention),
    STATUS_LABELS[c.statut], c.noteGoogle || ''
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${sanitizeCsvValue(cell).replace(/"/g, '""')}"`).join(';'))
    .join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `yooza-avis-clients-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Export CSV téléchargé !', 'success');
}

function sanitizeCsvValue(value) {
  const text = String(value === null || value === undefined ? '' : value);
  return /^\s*[=+\-@]/.test(text) ? "'" + text : text;
}
