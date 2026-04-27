(function() {
  if (window.pageaiInitialized) {
    console.log("PageAI já inicializado nesta aba.");
    return;
  }
  window.pageaiInitialized = true;

  let chatBox = null;

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    try {
      if (msg.type === 'TOGGLE') {
        if (msg.active) mostrarChat();
        else esconderChat();
      }
    } catch (err) {
      console.error("PageAI: Erro ao processar mensagem:", err);
    }
  });

  function mostrarChat() {
    if (document.getElementById('pageai-chat')) {
      chatBox = document.getElementById('pageai-chat');
      chatBox.style.display = 'flex';
      return;
    }

    chatBox = document.createElement('div');
    chatBox.id = 'pageai-chat';
    chatBox.innerHTML = `
      <div id="pageai-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 24px; height: 24px; background: rgba(0,0,0,0.1); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #444;">AI</div>
          <span>PageAI</span>
        </div>
        <div style="display: flex; gap: 10px; align-items: center;">
          <button id="pageai-minimize" title="Minimizar">−</button>
          <button id="pageai-close" title="Fechar">✕</button>
        </div>
      </div>
      <div id="pageai-body-wrapper">
        <div id="pageai-messages"></div>
        <div id="pageai-input-row">
          <textarea id="pageai-input" placeholder="Pergunte sobre esta página..." rows="1"></textarea>
          <button id="pageai-send">➤</button>
        </div>
      </div>
    `;

    document.body.appendChild(chatBox);
    injetarEstilos();

    const input = document.getElementById('pageai-input');
    input.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    document.getElementById('pageai-close').addEventListener('click', () => {
      esconderChat();
      chrome.runtime.sendMessage({ type: 'DESATIVAR' });
    });

    document.getElementById('pageai-minimize').addEventListener('click', toggleMinimizar);
    document.getElementById('pageai-send').addEventListener('click', enviarMensagem);
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensagem();
      }
    });

    setTimeout(() => input.focus(), 100);
  }

  function toggleMinimizar() {
    const wrapper = document.getElementById('pageai-body-wrapper');
    const chat = document.getElementById('pageai-chat');
    const btn = document.getElementById('pageai-minimize');
    if (!wrapper || !chat) return;

    if (wrapper.style.display === 'none') {
      wrapper.style.display = 'flex';
      chat.style.height = '480px';
      btn.textContent = '−';
    } else {
      wrapper.style.display = 'none';
      chat.style.height = 'auto';
      btn.textContent = '□';
    }
  }

  function esconderChat() {
    const el = document.getElementById('pageai-chat');
    if (el) {
      el.remove();
      chatBox = null;
    }
  }

  function enviarMensagem() {
    const input = document.getElementById('pageai-input');
    const pergunta = input.value.trim();
    if (!pergunta) return;

    input.value = '';
    input.style.height = 'auto';
    adicionarMensagem('user', pergunta);
    const aiMsgId = adicionarMensagem('ai', 'Pensando...');

    chrome.runtime.sendMessage(
      { type: 'PERGUNTA', pergunta, contexto: extrairContexto() },
      (resposta) => {
        if (chrome.runtime.lastError) {
          formatarMensagemIA(aiMsgId, "Erro: Conexão interrompida. Por favor, atualize a página.");
          return;
        }
        formatarMensagemIA(aiMsgId, resposta?.texto || "Erro: A IA não retornou uma resposta válida.");
      }
    );
  }

  function adicionarMensagem(origem, texto) {
    const msgs = document.getElementById('pageai-messages');
    if (!msgs) return;
    const el = document.createElement('div');
    const id = 'msg-' + Date.now();
    el.id = id;
    el.className = 'pageai-msg pageai-msg-' + origem;
    if (origem === 'ai') el.innerHTML = '<div class="msg-content">' + texto + '</div>';
    else el.textContent = texto;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return id;
  }

  function formatarMensagemIA(id, texto) {
    const el = document.getElementById(id);
    if (!el) return;
    const content = el.querySelector('.msg-content');
    if (!content) return;

    let formatado = texto
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>');

    content.innerHTML = formatado;
    const msgs = document.getElementById('pageai-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  function extrairContexto() {
    const clone = document.body.cloneNode(true);
    const elementsToRemove = clone.querySelectorAll('script, style, nav, footer');
    elementsToRemove.forEach(el => el.remove());
    
    return "URL: " + location.href + 
           "\nTítulo: " + document.title + 
           "\n\nConteúdo da Página:\n" + 
           clone.innerText.slice(0, 6000);
  }

  function injetarEstilos() {
    if (document.getElementById('pageai-styles')) return;
    const style = document.createElement('style');
    style.id = 'pageai-styles';
    style.textContent = `
      #pageai-chat { position: fixed; bottom: 24px; right: 24px; width: 360px; height: 480px; background: #ffffff; border-radius: 16px; display: flex; flex-direction: column; z-index: 2147483647; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; box-shadow: 0 12px 48px rgba(0,0,0,0.15); border: 1px solid rgba(0,0,0,0.1); overflow: hidden; transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
      #pageai-header { padding: 14px 18px; background: #f3f4f6; color: #1f2937; display: flex; justify-content: space-between; align-items: center; font-weight: 600; border-bottom: 1px solid #e5e7eb; cursor: default; }
      #pageai-header button { background: none; border: none; color: #6b7280; cursor: pointer; font-size: 18px; padding: 4px; line-height: 1; transition: color 0.2s; }
      #pageai-header button:hover { color: #111827; }
      #pageai-body-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #ffffff; }
      #pageai-messages { flex: 1; overflow-y: auto; padding: 20px 16px; display: flex; flex-direction: column; gap: 12px; scroll-behavior: smooth; }
      .pageai-msg { max-width: 85%; padding: 10px 14px; border-radius: 14px; line-height: 1.5; font-size: 14px; word-wrap: break-word; }
      .pageai-msg-user { background: #374151; color: white; align-self: flex-end; border-bottom-right-radius: 2px; }
      .pageai-msg-ai { background: #f3f4f6; color: #1f2937; align-self: flex-start; border-bottom-left-radius: 2px; border: 1px solid #e5e7eb; }
      #pageai-input-row { padding: 12px 16px; background: white; border-top: 1px solid #f0f0f0; display: flex; gap: 10px; align-items: flex-end; }
      #pageai-input { flex: 1; padding: 10px 14px; border: 1px solid #e2e8f0; border-radius: 12px; outline: none; resize: none; max-height: 120px; font-family: inherit; font-size: 14px; line-height: 1.4; transition: border-color 0.2s; }
      #pageai-input:focus { border-color: #374151; }
      #pageai-send { width: 36px; height: 36px; background: #374151; color: white; border: none; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-bottom: 2px; transition: transform 0.1s, background 0.2s; }
      #pageai-send:hover { background: #1f2937; transform: scale(1.05); }
      #pageai-send:active { transform: scale(0.95); }
      .msg-content code { background: rgba(0,0,0,0.05); padding: 2px 4px; border-radius: 4px; font-family: monospace; }
    `;
    document.head.appendChild(style);
  }
})();
