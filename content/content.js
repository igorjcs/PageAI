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
      document.getElementById('pageai-chat').style.display = 'block';
      return;
    }

    // Criamos um contêiner HOST para isolar o chat do resto da página via Shadow DOM
    chatBox = document.createElement('div');
    chatBox.id = 'pageai-chat';
    document.body.appendChild(chatBox);

    const shadow = chatBox.attachShadow({ mode: 'open' });
    
    const wrapper = document.createElement('div');
    wrapper.id = 'pageai-wrapper-outer';
    wrapper.innerHTML = `
      <div id="pageai-header">
        <div class="header-info">
          <div class="logo">AI</div>
          <span>PageAI</span>
        </div>
        <div class="header-actions">
          <button id="pageai-minimize" title="Minimizar">−</button>
          <button id="pageai-close" title="Fechar">✕</button>
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

    const style = document.createElement('style');
    style.textContent = `
      #pageai-wrapper-outer {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 360px;
        height: 480px;
        background: #fff;
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        box-shadow: 0 12px 48px rgba(0,0,0,0.15);
        border: 1px solid rgba(0,0,0,0.1);
        overflow: hidden;
        transition: height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 2147483647;
      }
      #pageai-header {
        padding: 14px 18px;
        background: #f3f4f6;
        color: #1f2937;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
        border-bottom: 1px solid #e5e7eb;
      }
      .header-info { display: flex; align-items: center; gap: 8px; }
      .logo {
        width: 24px; height: 24px;
        background: rgba(0,0,0,0.1);
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        color: #444;
      }
      .header-actions button {
        background: none; border: none; color: #6b7280;
        cursor: pointer; font-size: 18px; padding: 4px;
      }
      #pageai-body-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #fff; }
      #pageai-messages {
        flex: 1; overflow-y: auto; padding: 20px 16px;
        display: flex; flex-direction: column; gap: 12px;
        background: #fff; scroll-behavior: smooth;
      }
      .pageai-msg {
        max-width: 85%; padding: 10px 14px;
        border-radius: 14px; font-size: 14px; line-height: 1.5;
        word-wrap: break-word;
      }
      .pageai-msg-user {
        background: #374151; color: #fff;
        align-self: flex-end; border-bottom-right-radius: 2px;
      }
      .pageai-msg-ai {
        background: #f3f4f6; color: #1f2937;
        align-self: flex-start; border-bottom-left-radius: 2px;
        border: 1px solid #e5e7eb;
      }
      #pageai-input-row {
        padding: 12px 16px; background: #fff;
        border-top: 1px solid #f0f0f0;
        display: flex; gap: 10px; align-items: flex-end;
      }
      #pageai-input {
        flex: 1; padding: 10px; border: 1px solid #e2e8f0;
        border-radius: 10px; outline: none; resize: none;
        max-height: 120px; font-family: inherit; font-size: 14px;
        color: #000; background: #fff; line-height: 1.4;
      }
      #pageai-send {
        width: 36px; height: 36px; background: #374151;
        color: #fff; border: none; border-radius: 50%;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
      }
    `;

    shadow.appendChild(style);
    shadow.appendChild(wrapper);

    const input = shadow.getElementById('pageai-input');
    input.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });

    shadow.getElementById('pageai-close').addEventListener('click', () => {
      esconderChat();
      chrome.runtime.sendMessage({ type: 'DESATIVAR' });
    });

    shadow.getElementById('pageai-minimize').addEventListener('click', () => {
        const body = shadow.getElementById('pageai-body-wrapper');
        const outer = shadow.getElementById('pageai-wrapper-outer');
        const btn = shadow.getElementById('pageai-minimize');
        if (body.style.display === 'none') {
            body.style.display = 'flex';
            outer.style.height = '480px';
            btn.textContent = '−';
        } else {
            body.style.display = 'none';
            outer.style.height = 'auto';
            btn.textContent = '□';
        }
    });

    shadow.getElementById('pageai-send').addEventListener('click', () => enviarMensagem(shadow));
    
    // Impedir que eventos de teclado vazem para o site (evita atalhos do Kick/YouTube)
    input.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        enviarMensagem(shadow);
      }
    });

    input.addEventListener('keypress', (e) => e.stopPropagation());
    input.addEventListener('keyup', (e) => e.stopPropagation());

    setTimeout(() => {
      input.focus();
    }, 100);
  }

  function esconderChat() {
    const el = document.getElementById('pageai-chat');
    if (el) el.remove();
  }

  function enviarMensagem(shadow) {
    const input = shadow.getElementById('pageai-input');
    const pergunta = input.value.trim();
    if (!pergunta) return;

    input.value = '';
    input.style.height = 'auto';
    adicionarMensagem(shadow, 'user', pergunta);
    const aiMsgId = adicionarMensagem(shadow, 'ai', 'Analisando página...');

    chrome.runtime.sendMessage(
      { type: 'PERGUNTA', pergunta, contexto: extrairContextoCompleto() },
      (resposta) => {
        formatarMensagemIA(shadow, aiMsgId, resposta?.texto || "Erro na resposta.");
      }
    );
  }

  function extrairContextoCompleto() {
    const clone = document.body.cloneNode(true);
    const inuteis = clone.querySelectorAll('script, style, nav, footer, noscript, svg, #pageai-chat');
    inuteis.forEach(el => el.remove());

    // Limpeza agressiva de tags e atributos pra reduzir ruído e tokens
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT);
    let n;
    while(n = walker.nextNode()) {
      n.removeAttribute('style');
      n.removeAttribute('class');
      n.removeAttribute('id');
    }

    const textoLimpo = clone.innerText.replace(/\s\s+/g, ' ').trim();
    const titulo = document.title;
    const metaDesc = document.querySelector('meta[name="description"]')?.content || "";

    return `TÍTULO: ${titulo}\nDESCRIÇÃO: ${metaDesc}\nURL: ${location.href}\n\nCONTEÚDO PRINCIPAL:\n${textoLimpo.slice(0, 8000)}`;
  }

  function adicionarMensagem(shadow, origem, texto) {
    const msgs = shadow.getElementById('pageai-messages');
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

  function formatarMensagemIA(shadow, id, texto) {
    const el = shadow.getElementById(id);
    if (!el) return;
    const content = el.querySelector('.msg-content');
    content.innerHTML = texto.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    const msgs = shadow.getElementById('pageai-messages');
    msgs.scrollTop = msgs.scrollHeight;
  }
})();
