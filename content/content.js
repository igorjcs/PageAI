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
        width: 380px;
        height: 520px;
        background: #ffffff;
        border-radius: 16px;
        display: flex;
        flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        box-shadow: 0 12px 48px rgba(0,0,0,0.2);
        border: 1px solid rgba(0,0,0,0.1);
        overflow: hidden;
        transition: transform 0.2s ease, height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 2147483647;
        color: #1f2937;
        line-height: 1.5;
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
        font-size: 16px; /* Base estável */
      }
      #pageai-header {
        padding: 16px 20px;
        background: #374151;
        color: #ffffff;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
        border-bottom: 2px solid #2563eb; /* Toque de cor (Azul PageAI) */
      }
      .header-info { display: flex; align-items: center; gap: 10px; }
      .header-info span { font-size: 16px !important; letter-spacing: 0.5px; }
      .logo {
        width: 28px; height: 28px;
        background: #2563eb;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: #fff;
        font-weight: bold;
      }
      .header-actions button {
        background: none; border: none; color: #d1d5db;
        cursor: pointer; font-size: 20px; padding: 4px;
        transition: color 0.2s;
      }
      .header-actions button:hover { color: #fff; }
      #pageai-body-wrapper { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: #f9fafb; }
      #pageai-messages {
        flex: 1; overflow-y: auto; padding: 20px 16px;
        display: flex; flex-direction: column; gap: 14px;
        background: #f9fafb; scroll-behavior: smooth;
        user-select: text;
      }
      .pageai-msg {
        max-width: 85%; padding: 12px 16px;
        border-radius: 14px; font-size: 14.5px; line-height: 1.5;
        word-wrap: break-word;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      }
      .pageai-msg-user {
        background: #2563eb; color: #fff;
        align-self: flex-end; border-bottom-right-radius: 2px;
      }
      .pageai-msg-ai {
        background: #ffffff; color: #1f2937;
        align-self: flex-start; border-bottom-left-radius: 2px;
        border: 1px solid #e5e7eb;
      }
      #pageai-input-row {
        padding: 16px; background: #ffffff;
        border-top: 1px solid #e5e7eb;
        display: flex; gap: 12px; align-items: flex-end;
      }
      #pageai-input {
        flex: 1; padding: 12px; border: 1px solid #d1d5db;
        border-radius: 12px; outline: none; resize: none;
        max-height: 150px; font-family: inherit; font-size: 15px !important;
        color: #111827; background: #fff; line-height: 1.4;
        transition: border-color 0.2s;
      }
      #pageai-input:focus { border-color: #2563eb; box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1); }
      #pageai-send {
        width: 42px; height: 42px; background: #2563eb;
        color: #fff; border: none; border-radius: 10px;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: background 0.2s;
      }
      #pageai-send:hover { background: #1d4ed8; }
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

  async function enviarMensagem(shadow) {
    const input = shadow.getElementById('pageai-input');
    const pergunta = input.value.trim();
    if (!pergunta) return;

    if (input.dataset.sending === 'true') return;
    input.dataset.sending = 'true';

    input.value = '';
    input.style.height = 'auto';
    adicionarMensagem(shadow, 'user', pergunta);
    const aiMsgId = adicionarMensagem(shadow, 'ai', 'Analisando página...');

    let respostaFinalizada = false;
    const finalizarResposta = (texto) => {
      if (respostaFinalizada) return;
      respostaFinalizada = true;
      formatarMensagemIA(shadow, aiMsgId, texto || '❌ Não foi possível obter resposta.');
    };

    const timeoutId = setTimeout(() => {
      input.dataset.sending = 'false';
      finalizarResposta('⌛ A resposta demorou demais. Tente novamente ou recarregue a página.');
    }, 35000);

    chrome.storage.local.get(['captureMode'], async (data) => {
      const mode = data.captureMode || 'safe';
      const contextoBruto = extrairContextoCompleto(mode);
      const contextoRedigido = redactPII(contextoBruto);
      const confirmacao = await showPreviewDialog(shadow, contextoRedigido);

      if (!confirmacao.confirmed) {
        clearTimeout(timeoutId);
        input.dataset.sending = 'false';
        finalizarResposta('Envio cancelado pelo usuario.');
        return;
      }

      const contextoFinal = confirmacao.text.slice(0, 20000);

      chrome.runtime.sendMessage(
        { type: 'PERGUNTA', pergunta, contexto: contextoFinal },
        (resposta) => {
          clearTimeout(timeoutId);
          input.dataset.sending = 'false';
          if (chrome.runtime.lastError) {
            console.error('PageAI runtime error:', chrome.runtime.lastError);
            finalizarResposta(`❌ Erro de comunicação: ${chrome.runtime.lastError.message}`);
            return;
          }
          if (!resposta || !resposta.texto) {
            console.error('PageAI resposta inválida:', resposta);
            finalizarResposta('❌ Não consegui gerar resposta agora.');
            return;
          }
          finalizarResposta(resposta.texto);
        }
      );
    });
  }

  function extrairContextoCompleto(mode) {
    const includeIframes = mode === 'wide';
    const includeShadow = mode === 'wide';

    function getVisibleText(element) {
      if (element.nodeType === Node.TEXT_NODE) {
        return element.textContent.trim();
      }
      if (element.nodeType !== Node.ELEMENT_NODE) return "";

      const style = window.getComputedStyle(element);
      // LinkedIn e outros sites modernos usam opacidade ou outros métodos que podem enganar o offsetParent
      if (style.display === 'none' || style.visibility === 'hidden') {
        return "";
      }

      if (element.id === 'pageai-chat' || 
          ['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'NAV', 'FOOTER'].includes(element.tagName)) {
        return "";
      }

      let text = "";
      // Capturar nomes de cargos e empresas que muitas vezes estão em atributos ARIA no LinkedIn
      if (element.alt) text += `[Imagem: ${element.alt}] `;
      if (element.ariaLabel) text += `[Label: ${element.ariaLabel}] `;

      if (includeShadow && element.shadowRoot) {
        text += getVisibleText(element.shadowRoot) + " ";
      }

      if (includeIframes && element.tagName === 'IFRAME') {
        try {
          const doc = element.contentDocument;
          if (doc && doc.body) {
            text += getVisibleText(doc.body) + " ";
          }
        } catch (err) {
          // iframe cross-origin: ignorar por seguranca
        }
      }

      for (const child of element.childNodes) {
        text += getVisibleText(child) + " ";
      }
      return text;
    }

    const textoBruto = getVisibleText(document.body);
    const textoLimpo = textoBruto.replace(/\s+/g, ' ').trim();
    
    const titulo = document.title;
    const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.innerText.trim()).filter(t => t).join(' | ');
    const url = sanitizeUrl(location.href);

    // Estrutura mais clara para a IA
    let contextoFinal = `URL: ${url}\nTÍTULO: ${titulo}\nH1: ${h1s}\nMODO: ${mode}\n\nCONTEÚDO DA PÁGINA:\n${textoLimpo}`;

    // Aumentado para 20.000 para perfis complexos
    return contextoFinal.slice(0, 20000);
  }

  function sanitizeUrl(rawUrl) {
    try {
      const url = new URL(rawUrl);
      url.search = '';
      url.hash = '';
      return url.toString();
    } catch (err) {
      return rawUrl.split('#')[0].split('?')[0];
    }
  }

  function redactPII(texto) {
    if (!texto) return '';
    return texto
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[EMAIL]')
      .replace(/\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g, '[CPF]')
      .replace(/\b\d{11}\b/g, '[CPF]')
      .replace(/\b(?:\d[ -]*?){13,19}\b/g, '[CARTAO]')
      .replace(/\b\+?\d{1,3}\s?\(?\d{2,3}\)?[\s.-]?\d{4,5}[\s.-]?\d{4}\b/g, '[TELEFONE]')
      .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[TOKEN]');
  }

  function showPreviewDialog(shadow, contexto) {
    return new Promise((resolve) => {
      const existing = shadow.getElementById('pageai-preview-overlay');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'pageai-preview-overlay';
      overlay.innerHTML = `
        <div class="pageai-preview-backdrop"></div>
        <div class="pageai-preview-card">
          <div class="pageai-preview-title">Revisar contexto antes de enviar</div>
          <div class="pageai-preview-subtitle">Edite ou remova qualquer trecho sensivel.</div>
          <textarea class="pageai-preview-text"></textarea>
          <div class="pageai-preview-actions">
            <button class="pageai-preview-cancel">Cancelar</button>
            <button class="pageai-preview-send">Enviar</button>
          </div>
        </div>
      `;

      const style = document.createElement('style');
      style.textContent = `
        #pageai-preview-overlay {
          position: fixed;
          inset: 0;
          z-index: 2147483647;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: inherit;
        }
        .pageai-preview-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(15, 23, 42, 0.6);
        }
        .pageai-preview-card {
          position: relative;
          background: #ffffff;
          width: min(90vw, 520px);
          max-height: 80vh;
          border-radius: 14px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          z-index: 1;
        }
        .pageai-preview-title {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
        }
        .pageai-preview-subtitle {
          font-size: 12px;
          color: #475569;
        }
        .pageai-preview-text {
          width: 100%;
          min-height: 220px;
          max-height: 50vh;
          resize: vertical;
          padding: 10px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          font-family: inherit;
          font-size: 12px;
          line-height: 1.4;
          color: #0f172a;
        }
        .pageai-preview-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        .pageai-preview-actions button {
          border: none;
          border-radius: 8px;
          padding: 8px 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .pageai-preview-cancel { background: #e2e8f0; color: #0f172a; }
        .pageai-preview-send { background: #2563eb; color: #ffffff; }
      `;

      const textarea = overlay.querySelector('.pageai-preview-text');
      const cancelBtn = overlay.querySelector('.pageai-preview-cancel');
      const sendBtn = overlay.querySelector('.pageai-preview-send');

      textarea.value = contexto;
      cancelBtn.addEventListener('click', () => {
        overlay.remove();
        resolve({ confirmed: false, text: '' });
      });
      sendBtn.addEventListener('click', () => {
        const finalText = textarea.value.trim();
        overlay.remove();
        resolve({ confirmed: true, text: finalText });
      });

      shadow.appendChild(style);
      shadow.appendChild(overlay);
      textarea.focus();
    });
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
