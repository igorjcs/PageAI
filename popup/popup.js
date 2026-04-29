const toggle = document.getElementById('toggle');
const apiKeyInput = document.getElementById('api-key');
const apiProviderSelect = document.getElementById('api-provider');
const captureModeSelect = document.getElementById('capture-mode');
const saveBtn = document.getElementById('save-btn');
const deleteBtn = document.getElementById('delete-btn');
const statusEl = document.getElementById('status');
const msgEl = document.getElementById('msg');
const setupSection = document.getElementById('setup-section');
const infoCard = document.getElementById('info-card');
const activeProviderBadge = document.getElementById('active-provider');

const PROVIDER_NAMES = {
  openai: 'OpenAI (GPT-4o)',
  anthropic: 'Anthropic (Claude)',
  gemini: 'Google (Gemini 1.5)',
  abacus: 'Abacus AI'
};


// Ao abrir o popup, carrega o estado salvo
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab) return;
  chrome.storage.local.get(['apiKey', 'apiProvider', 'captureMode', `active_${tab.id}`], (data) => {
    if (data.apiKey) {
      setupSection.style.display = 'none';
      infoCard.style.display = 'block';
      deleteBtn.style.display = 'block';
      activeProviderBadge.textContent = PROVIDER_NAMES[data.apiProvider] || data.apiProvider;
    } else {
      setupSection.style.display = 'block';
      infoCard.style.display = 'none';
      deleteBtn.style.display = 'none';
    }

    captureModeSelect.value = data.captureMode || 'safe';

    const isActive = !!data[`active_${tab.id}`];
    toggle.checked = isActive;
    atualizarStatus(isActive);
  });
});

captureModeSelect.addEventListener('change', () => {
  const captureMode = captureModeSelect.value || 'safe';
  chrome.storage.local.set({ captureMode }, () => {
    mostrarMensagem('Modo de leitura atualizado.', 'success');
  });
});

toggle.addEventListener('change', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab) return;
    const isActive = toggle.checked;
    chrome.storage.local.set({ [`active_${tab.id}`]: isActive });
    atualizarStatus(isActive);
    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE', active: isActive }, (r) => {
      if (chrome.runtime.lastError && isActive) {
        chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content/content.js'] }, () => {
          chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE', active: isActive });
        });
      }
    });
  });
});

saveBtn.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  const provider = apiProviderSelect.value;
  const captureMode = captureModeSelect.value || 'safe';
  if (!key) return mostrarMensagem('Insira uma chave válida.', 'error');

  chrome.storage.local.set({ apiKey: key, apiProvider: provider, captureMode }, () => {
    mostrarMensagem('Configurações salvas!', 'success');
    setupSection.style.display = 'none';
    infoCard.style.display = 'block';
    deleteBtn.style.display = 'block';
    activeProviderBadge.textContent = PROVIDER_NAMES[provider];
    apiKeyInput.value = '';
  });
});

deleteBtn.addEventListener('click', () => {
  if (confirm('Excluir chave de API?')) {
    chrome.storage.local.remove(['apiKey', 'apiProvider'], () => {
      mostrarMensagem('Excluída.', 'success');
      setupSection.style.display = 'block';
      infoCard.style.display = 'none';
      deleteBtn.style.display = 'none';
    });
  }
});

function atualizarStatus(isActive) {
  statusEl.textContent = isActive ? 'Ativo' : 'Desativado';
  statusEl.style.background = isActive ? '#d1fae5' : '#f3f4f6';
  statusEl.style.color = isActive ? '#065f46' : '#6b7280';
}

function mostrarMensagem(texto, tipo) {
  msgEl.textContent = texto;
  msgEl.className = tipo;
  setTimeout(() => { msgEl.textContent = ''; msgEl.className = ''; }, 2500);
}

function getHostname(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname || '';
  } catch (err) {
    return '';
  }
}
