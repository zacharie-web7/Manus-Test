/**
 * settings.js — Page de réglages Yooza Avis V1
 */

'use strict';

function renderSettings(container) {
  const s = AppState.settings;

  container.innerHTML = `
    <!-- En-tête -->
    <div style="margin-bottom:2rem">
      <div class="section-label">Configuration</div>
      <h1 style="font-family:var(--font-heading);font-size:1.75rem;font-weight:700;letter-spacing:-0.02em;color:var(--yooza-black)">
        Réglages
      </h1>
      <p style="font-size:0.875rem;color:var(--yooza-gray);margin-top:0.25rem">
        Configurez les paramètres d'envoi des demandes d'avis Google.
      </p>
    </div>

    <div class="settings-layout">

      <!-- Formulaire principal -->
      <div>

        <!-- Section 1 : Google Avis -->
        <div class="card" style="margin-bottom:1.5rem">
          <div class="card-header">
            <div class="card-title">🔗 Lien Google Avis</div>
          </div>
          <div class="card-body">
            <div class="settings-section-title">Lien vers votre fiche Google</div>
            <div class="form-group">
              <label class="form-label" for="lien-google">
                URL de votre fiche Google Avis <span class="required">*</span>
              </label>
              <input
                type="url"
                class="form-control"
                id="lien-google"
                value="${escapeHtml(s.lienGoogleAvis)}"
                placeholder="https://g.page/r/VOTRE_CODE/review"
              >
              <div class="form-hint">
                Trouvez ce lien dans Google Business Profile → Demander des avis.
              </div>
            </div>
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label" for="delai-envoi">
                Délai avant envoi (jours après intervention)
              </label>
              <input
                type="number"
                class="form-control"
                id="delai-envoi"
                value="${escapeHtml(s.delaiEnvoi)}"
                min="0"
                max="30"
                style="max-width:160px"
              >
              <div class="form-hint">
                Nombre de jours après la fin d'intervention avant d'envoyer la demande.
                Mettre 0 pour un envoi immédiat.
              </div>
            </div>
          </div>
        </div>

        <!-- Section 2 : Canal d'envoi -->
        <div class="card" style="margin-bottom:1.5rem">
          <div class="card-header">
            <div class="card-title">📡 Canal d'envoi</div>
          </div>
          <div class="card-body">
            <div class="settings-section-title">Choisissez le canal de communication</div>
            <div class="canal-options" id="canal-options">
              ${renderCanalOptions(s.canal)}
            </div>
            <div class="alert alert-info" style="margin-top:1.25rem;margin-bottom:0">
              <span>ℹ️</span>
              <span>En V1, aucun envoi réel n'est effectué. La connexion aux services d'envoi sera activée en V2.</span>
            </div>
          </div>
        </div>

        <!-- Section 3 : Modèle de message -->
        <div class="card" style="margin-bottom:1.5rem">
          <div class="card-header">
            <div class="card-title">✉️ Modèle de message</div>
            <button class="btn btn-ghost btn-sm" onclick="resetTemplate()">
              ↺ Réinitialiser
            </button>
          </div>
          <div class="card-body">
            <div class="settings-section-title">Personnalisez votre message</div>
            <div class="alert alert-info" style="margin-bottom:1rem">
              <span>💡</span>
              <div>
                Variables disponibles :
                <code style="background:var(--yooza-yellow-mid);padding:1px 5px;border-radius:3px;font-size:0.8rem">{prenom}</code>
                <code style="background:var(--yooza-yellow-mid);padding:1px 5px;border-radius:3px;font-size:0.8rem">{type_intervention}</code>
                <code style="background:var(--yooza-yellow-mid);padding:1px 5px;border-radius:3px;font-size:0.8rem">{date_intervention}</code>
                <code style="background:var(--yooza-yellow-mid);padding:1px 5px;border-radius:3px;font-size:0.8rem">{lien_google_avis}</code>
              </div>
            </div>
            <div class="form-group" style="margin-bottom:0">
              <label class="form-label" for="modele-message">Texte du message</label>
              <textarea
                class="form-control"
                id="modele-message"
                rows="10"
                style="min-height:200px;font-family:var(--font-body)"
              >${escapeHtml(s.modeleMessage)}</textarea>
            </div>
          </div>
        </div>

        <!-- Bouton de sauvegarde -->
        <div style="display:flex;gap:0.75rem;justify-content:flex-end">
          <button class="btn btn-ghost" onclick="resetSettings()">
            Réinitialiser tout
          </button>
          <button class="btn btn-primary btn-lg" onclick="saveSettingsForm()">
            ✓ Enregistrer les réglages
          </button>
        </div>

      </div>

      <!-- Panneau latéral : prévisualisation -->
      <div class="settings-preview">
        <div class="card">
          <div class="card-header">
            <div class="card-title">Aperçu du message</div>
          </div>
          <div class="card-body">
            <div style="font-size:0.75rem;color:var(--yooza-gray);margin-bottom:0.75rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em">
              Exemple avec un client fictif
            </div>
            <div class="message-preview" id="message-preview-live">
              ${escapeHtml(generatePreview(s))}
            </div>
          </div>
        </div>

        <!-- Infos V2 -->
        <div class="card" style="margin-top:1.25rem;background:var(--yooza-black);border-color:var(--yooza-black)">
          <div class="card-body">
            <div style="font-size:0.7rem;font-weight:700;color:var(--yooza-yellow);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.75rem">
              Roadmap V2
            </div>
            <div style="font-size:0.8rem;color:rgba(255,255,255,0.7);line-height:1.7">
              Prochaines intégrations prévues :
              <ul style="margin-top:0.5rem;padding-left:1rem;list-style:disc">
                <li>Teamleader CRM</li>
                <li>Google Business Profile API</li>
                <li>Envoi Email (Mailchimp / SMTP)</li>
                <li>Envoi SMS (Twilio / Vonage)</li>
                <li>WhatsApp Business API</li>
                <li>Automatisation par déclencheur</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

    </div>
  `;

  // Mise à jour live de la prévisualisation
  document.getElementById('modele-message').addEventListener('input', updatePreview);
  document.getElementById('lien-google').addEventListener('input', updatePreview);
}

function renderCanalOptions(selected) {
  const canaux = [
    { value: 'email',    icon: '📧', name: 'Email',    desc: 'Envoi par email' },
    { value: 'sms',      icon: '💬', name: 'SMS',      desc: 'Message texte' },
    { value: 'whatsapp', icon: '📱', name: 'WhatsApp', desc: 'WhatsApp Business' },
  ];

  return canaux.map(c => `
    <div
      class="canal-option ${selected === c.value ? 'selected' : ''}"
      onclick="selectCanal('${c.value}')"
    >
      <input type="radio" name="canal" value="${c.value}" ${selected === c.value ? 'checked' : ''}>
      <div class="check-indicator">✓</div>
      <div class="canal-icon">${c.icon}</div>
      <div class="canal-name">${c.name}</div>
      <div class="canal-desc">${c.desc}</div>
    </div>
  `).join('');
}

function selectCanal(value) {
  document.querySelectorAll('.canal-option').forEach(el => {
    el.classList.toggle('selected', el.querySelector('input').value === value);
  });
}

function generatePreview(settings) {
  const fakeClient = {
    nom: 'Marie Dupont',
    typeIntervention: 'Installation climatisation',
    dateFinIntervention: new Date().toISOString().split('T')[0],
  };
  const prenom = fakeClient.nom.split(' ')[0];
  return settings.modeleMessage
    .replace('{prenom}', prenom)
    .replace('{type_intervention}', fakeClient.typeIntervention)
    .replace('{date_intervention}', formatDate(fakeClient.dateFinIntervention))
    .replace('{lien_google_avis}', settings.lienGoogleAvis || '[lien Google Avis]');
}

function updatePreview() {
  const lien = document.getElementById('lien-google')?.value || AppState.settings.lienGoogleAvis;
  const modele = document.getElementById('modele-message')?.value || AppState.settings.modeleMessage;
  const preview = document.getElementById('message-preview-live');
  if (!preview) return;

  const fakeClient = {
    nom: 'Marie Dupont',
    typeIntervention: 'Installation climatisation',
    dateFinIntervention: new Date().toISOString().split('T')[0],
  };
  const prenom = fakeClient.nom.split(' ')[0];
  const text = modele
    .replace('{prenom}', prenom)
    .replace('{type_intervention}', fakeClient.typeIntervention)
    .replace('{date_intervention}', formatDate(fakeClient.dateFinIntervention))
    .replace('{lien_google_avis}', lien || '[lien Google Avis]');

  preview.textContent = text;
}

function saveSettingsForm() {
  const lien   = document.getElementById('lien-google')?.value?.trim();
  const delai  = parseInt(document.getElementById('delai-envoi')?.value) || 0;
  const modele = document.getElementById('modele-message')?.value?.trim();
  const canalEl = document.querySelector('.canal-option.selected input');
  const canal  = canalEl ? canalEl.value : AppState.settings.canal;

  if (!lien) {
    showToast('Veuillez renseigner le lien Google Avis.', 'error');
    return;
  }

  AppState.settings = { lienGoogleAvis: lien, delaiEnvoi: delai, canal, modeleMessage: modele };
  saveSettings();
  showToast('Réglages enregistrés avec succès !', 'success');
}

function resetTemplate() {
  if (!confirm('Réinitialiser le modèle de message par défaut ?')) return;
  document.getElementById('modele-message').value = DEFAULT_SETTINGS.modeleMessage;
  updatePreview();
  showToast('Modèle réinitialisé.', 'default');
}

function resetSettings() {
  if (!confirm('Réinitialiser tous les réglages aux valeurs par défaut ?')) return;
  AppState.settings = { ...DEFAULT_SETTINGS };
  saveSettings();
  renderSettings(document.getElementById('page-content'));
  showToast('Réglages réinitialisés.', 'default');
}
