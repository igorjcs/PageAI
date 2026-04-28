(function() {
  if (window.pageaiInitialized) return;
  window.pageaiInitialized = true;

  let chatBox = null;

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'TOGGLE') {
      if (msg.active) mostrarChat();
      else esconderChat();
    }
  });

  function mostrarChat() {
    if (document.getElementById('pageai-chat')) {
      document.getElementById('pageai-chat').style.display = 'flex';
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
          <button id="pageai-minimize">−</button>
          <button id="pageai-close">✕</button>
        </div>
      </div>
      <div id="pageai-body-wrapper">
        <div id="pageai-messages"></div>
        <div id="pageai-input-row">
          <textarea id="pageai-input" placeholder="Pergunte..." rows="1"></textarea>
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
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarMensagem(); }
    });
    setTimeout(() => input.focus(), 100);
  }

  function toggleMinimizar() {
    const wrapper = document.getElementById('pageai-body-wrapper');
    const chat = document.getElementById('pageai-chat');
    const btn = document.getElementById('pageai-minimize');
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
    if (el) el.remove();
  }

  function enviarMensagem() {
    const input = document.getElementById('pageai-input');
    const pergunta = input.value.trim();
    if (!pergunta) return;

    input.value = '';
    input.style.height = 'auto';
    adicionarMensagem('user', pergunta);
    const aiMsgId = adicionarMensagem('ai', 'Analisando página...');

    // Timeout de segurança para evitar "Pensando..." eterno
    const timeoutId = setTimeout(() => {
        formatarMensagemIA(aiMsgId, "Erro: A resposta demorou muito ou o site bloqueou a conexão. Tente recarregar a página.");
    }, 15000);

    chrome.runtime.sendMessage(
      { type: 'PERGUNTA', pergunta, contexto: extrairContextoCompleto() },
      (resposta) => {
        clearTimeout(timeoutId);
        if (chrome.runtime.lastError) {
          formatarMensagemIA(aiMsgId, "Erro: Conexão interrompida. Atualize a página e tente novamente.");
          return;
        }
        if (!resposta || !resposta.texto) {
          formatarMensagemIA(aiMsgId, "Erro: A IA não conseguiu gerar uma resposta. Tente reformular a pergunta.");
          return;
        }
        formatarMensagemIA(aiMsgId, resposta.texto);
      }
    );
  }

  function extrairContextoCompleto() {
    const clone = document.body.cloneNode(true);
    const inuteis = clone.querySelectorAll('script, style, nav, footer, noscript, svg, path');
    inuteis.forEach(el => el.remove());
    
    // Tenta pegar o título principal e descrição da meta tag
    const metaDesc = document.querySelector('meta[name="description"]')?.content || '';
    const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.innerText).join(' | ');

    const texto = clone.innerText.replace(/\s\s+/g, ' ').slice(0, 7000);

    const imagens = Array.from(document.querySelectorAll('img'))
      .slice(0, 15)
      .map(img => `[Img: ${img.alt || 'Sem descrição'}]`)
      .filter(t => t.length > 5)
      .join(', ');

    return `URL: ${location.href}\nMeta Description: ${metaDesc}\nTítulos: ${h1s}\n\nTEXTO ÚTIL:\n${texto}\n\nIMAGENS:\n${imagens}`;
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
    content.innerHTML = texto.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.*?)`/g, '<code>$1</code>');
    const msgs = document.getElementById('pageai-messages');
    if (msgs) msgs.scrollTop = msgs.scrollHeight;
  }

  function injetarEstilos() {
    if (document.getElementById('pageai-styles')) return;
    const style = document.createElement('style');
    style.id = 'pageai-styles';
    style.textContent = `
      #pageai-chat { position: fixed; bottom: 24px; right: 24px; width: 360px; height: 480px; background: #fff; border-radius: 16px; display: flex; flex-direction: column; z-index: 2147483647; font-family: sans-serif; box-shadow: 0 12px 48px rgba(0,0,0,0.15); border: 1px solid rgba(0,0,0,0.1); overflow: hidden; transition: height 0.3s; }
      #pageai-header { padding: 14px 18px; background: #f3f4f6; color: #1f2937; display: flex; justify-content: space-between; align-items: center; font-weight: 600; border-bottom: 1px solid #e5e7eb; }
      #pageai-header button { background: none; border: none; color: #6b7280; cursor: pointer; font-size: 18px; }
      #pageai-body-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
      #pageai-messages { flex: 1; overflow-y: auto; padding: 20px 16px; display: flex; flex-direction: column; gap: 12px; }
      .pageai-msg { max-width: 85%; padding: 10px 14px; border-radius: 14px; font-size: 14px; line-height: 1.4; word-wrap: break-word; }
      .pageai-msg-user { background: #374151; color: white; align-self: flex-end; border-bottom-right-radius: 2px; }
      .pageai-msg-ai { background: #f3f4f6; color: #1f2937; align-self: flex-start; border-bottom-left-radius: 2px; border: 1px solid #e5e7eb; }
      #pageai-input-row { padding: 12px 16px; border-top: 1px solid #f0f0f0; display: flex; gap: 10px; align-items: flex-end; }
      #pageai-input { flex: 1; padding: 8px 12px; border: 1px solid #e2e8f0; border-radius: 12px; outline: none; resize: none; max-height: 120px; font-family: inherit; }
      #pageai-send { width: 32px; height: 32px; background: #374151; color: white; border: none; border-radius: 50%; cursor: pointer; }
    `;
    document.head.appendChild(style);
  }
})();
