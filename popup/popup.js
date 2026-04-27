const toggle = document.getElementById('toggle');
const apiKeyInput = document.getElementById('api-key');
const apiProviderSelect = document.getElementById('api-provider');
const saveBtn = document.getElementById('save-btn');
const deleteBtn = document.getElementById('delete-btn');
const statusEl = document.getElementById('status');
const msgEl = document.getElementById('msg');
const setupSection = document.getElementById('setup-section');
const infoCard = document.getElementById('info-card');
const activeProviderBadge = document.getElementById('active-provider');

// Ao abrir o popup, carrega o estado salvo
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab) return;
  chrome.storage.local.get(['apiKey', 'apiProvider', `active_${tab.id}`], (data) => {
    
    // Gerencia o que exibir (configuração vs informações)
    if (data.apiKey) {
      setupSection.style.display = 'none';
      infoCard.style.display = 'block';
      deleteBtn.style.display = 'block';
      activeProviderBadge.textContent = data.apiProvider === 'openai' ? 'OpenAI (GPT-4o)' : 'Anthropic (Claude)';
    } else {
      setupSection.style.display = 'block';
      infoCard.style.display = 'none';
      deleteBtn.style.display = 'none';
    }

    const isActive = !!data[`active_${tab.id}`];
    toggle.checked = isActive;
    atualizarStatus(isActive);
  });
});

// Toggle ativado/desativado
toggle.addEventListener('change', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab) return;
    const isActive = toggle.checked;

    chrome.storage.local.set({ [`active_${tab.id}`]: isActive });
    atualizarStatus(isActive);

    chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE', active: isActive }, (response) => {
      if (chrome.runtime.lastError) {
        if (isActive) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content/content.js']
          }, () => {
            chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE', active: isActive });
          });
        }
      }
    });
  });
});

// Salva a API key e o provedor selecionado
saveBtn.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  const provider = apiProviderSelect.value;

  if (!key) {
    mostrarMensagem('Insira uma chave válida.', 'error');
    return;
  }

  chrome.storage.local.set({ apiKey: key, apiProvider: provider }, () => {
    mostrarMensagem('Configurações salvas!', 'success');
    
    // Atualiza interface após salvar
    setupSection.style.display = 'none';
    infoCard.style.display = 'block';
    deleteBtn.style.display = 'block';
    activeProviderBadge.textContent = provider === 'openai' ? 'OpenAI (GPT-4o)' : 'Anthropic (Claude)';
    apiKeyInput.value = '';
  });
});

// Deleta a API Key
deleteBtn.addEventListener('click', () => {
  if (confirm('Tem certeza que deseja excluir sua chave de API?')) {
    chrome.storage.local.remove(['apiKey', 'apiProvider'], () => {
      mostrarMensagem('Chave excluída.', 'success');
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
  setTimeout(() => {
    msgEl.textContent = '';
    msgEl.className = '';
  }, 2500);
}
