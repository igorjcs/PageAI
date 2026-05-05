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
      safeSendMessage({ type: 'DESATIVAR' });
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
      const contextoBase = extrairContextoEstruturado(mode);
      const headerText = redactPII(contextoBase.headerText || '');
      const bodyText = redactPII(contextoBase.bodyText || '');
      const chunks = splitIntoChunks(bodyText, 900, 120).slice(0, 18);

      let topChunks = chunks.slice(0, 6);
      try {
        const embedResult = await buscarTrechosRelevantes(pergunta, chunks);
        if (embedResult && Array.isArray(embedResult.topChunks) && embedResult.topChunks.length) {
          topChunks = embedResult.topChunks;
        }
      } catch (err) {
        console.warn('Falha na busca vetorial, usando fallback:', err);
      }

      const contextoFinal = montarContextoFinal(headerText, topChunks).slice(0, 20000);
      const respostaPayload = await enviarPergunta(pergunta, contextoFinal);

      clearTimeout(timeoutId);
      input.dataset.sending = 'false';

      if (respostaPayload.timeout) {
        finalizarResposta('⌛ A resposta demorou demais. Tente novamente.');
        return;
      }
      if (respostaPayload.error) {
        finalizarResposta(`❌ Erro de comunicação: ${respostaPayload.error}`);
        return;
      }
      if (!respostaPayload.response || !respostaPayload.response.texto) {
        console.error('PageAI resposta inválida:', respostaPayload.response);
        finalizarResposta('❌ Não consegui gerar resposta agora.');
        return;
      }
      finalizarResposta(respostaPayload.response.texto);
    });
  }

  function extrairContextoEstruturado(mode) {
    const includeIframes = mode === 'wide';
    const includeShadow = mode === 'wide';

    function getVisibleText(element) {
      if (element.nodeType === Node.TEXT_NODE) {
        return element.textContent.trim();
      }
      if (element.nodeType !== Node.ELEMENT_NODE) return "";

      const style = window.getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden') {
        return "";
      }

      if (element.id === 'pageai-chat' || 
          ['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'NAV', 'FOOTER'].includes(element.tagName)) {
        return "";
      }

      let text = "";
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
        }
      }

      for (const child of element.childNodes) {
        text += getVisibleText(child) + " ";
      }
      return text;
    }

    const textoBruto = getVisibleText(document.body);
    const textoLimpo = normalizeWhitespace(textoBruto);
    const mediaText = coletarMidiaDescricao();
    
    const titulo = document.title;
    const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.innerText.trim()).filter(t => t).join(' | ');
    const url = sanitizeUrl(location.href);

    const headerText = `URL: ${url}\nTÍTULO: ${titulo}\nH1: ${h1s}\nMODO: ${mode}`;
    const bodyText = [mediaText, textoLimpo].filter((item) => item).join('\n\n');
    return { headerText, bodyText };
  }

  function montarContextoFinal(headerText, topChunks) {
    const header = headerText ? headerText.trim() : '';
    const body = topChunks
      .map((chunk, index) => `[Trecho ${index + 1}] ${chunk}`)
      .join('\n\n');
    return `${header}\n\nCONTEUDO DA PAGINA (TRECHOS RELEVANTES):\n${body}`.trim();
  }

  function splitIntoChunks(text, chunkSize, overlap) {
    const clean = normalizeWhitespace(text);
    if (!clean) return [];
    const chunks = [];
    let start = 0;
    while (start < clean.length) {
      const end = Math.min(start + chunkSize, clean.length);
      const chunk = clean.slice(start, end).trim();
      if (chunk) chunks.push(chunk);
      if (end === clean.length) break;
      start = end - overlap;
      if (start < 0) start = 0;
    }
    return chunks;
  }

  function normalizeWhitespace(text) {
    return (text || '').replace(/\s+/g, ' ').trim();
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

  function coletarMidiaDescricao() {
    const linhas = [];
    const imagens = Array.from(document.images || []);
    const videos = Array.from(document.querySelectorAll('video'));

    imagens.forEach((img) => {
      const alt = normalizeWhitespace(img.alt || '');
      const title = normalizeWhitespace(img.title || '');
      const label = normalizeWhitespace(img.getAttribute('aria-label') || '');
      const figcaption = normalizeWhitespace(obterLegenda(img));
      const arquivo = obterNomeArquivo(img.currentSrc || img.src || '');

      const parts = [
        alt && `alt="${alt}"`,
        title && `title="${title}"`,
        label && `label="${label}"`,
        figcaption && `legenda="${figcaption}"`,
        arquivo && `arquivo="${arquivo}"`
      ].filter(Boolean);

      if (parts.length) {
        linhas.push(`Imagem: ${parts.join(' | ')}`);
      }
    });

    videos.forEach((video) => {
      const title = normalizeWhitespace(video.title || '');
      const label = normalizeWhitespace(video.getAttribute('aria-label') || '');
      const poster = obterNomeArquivo(video.poster || '');
      const src = obterNomeArquivo(video.currentSrc || video.src || '');

      const parts = [
        title && `title="${title}"`,
        label && `label="${label}"`,
        poster && `poster="${poster}"`,
        src && `arquivo="${src}"`
      ].filter(Boolean);

      if (parts.length) {
        linhas.push(`Video: ${parts.join(' | ')}`);
      }
    });

    return linhas.length ? `MIDIA DETECTADA:\n${linhas.join('\n')}` : '';
  }

  function obterLegenda(img) {
    const figure = img.closest('figure');
    if (!figure) return '';
    const caption = figure.querySelector('figcaption');
    return caption ? caption.textContent || '' : '';
  }

  function obterNomeArquivo(url) {
    try {
      const parsed = new URL(url, location.href);
      const parts = parsed.pathname.split('/').filter(Boolean);
      return parts.length ? parts[parts.length - 1] : parsed.hostname;
    } catch (err) {
      return '';
    }
  }

  function buscarTrechosRelevantes(pergunta, chunks) {
    return sendMessageWithTimeout({ type: 'EMBED_SEARCH', pergunta, chunks }, 20000)
      .then((result) => {
        if (result.error || result.timeout) throw new Error(result.error || 'Timeout');
        return result.response;
      });
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

  function enviarPergunta(pergunta, contexto) {
    return sendMessageWithTimeout({ type: 'PERGUNTA', pergunta, contexto }, 30000);
  }

  function sendMessageWithTimeout(message, timeoutMs) {
    return new Promise((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        resolve({ timeout: true });
      }, timeoutMs);

      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (settled) return;
          clearTimeout(timer);
          settled = true;
          if (chrome.runtime.lastError) {
            resolve({ error: chrome.runtime.lastError.message });
            return;
          }
          resolve({ response });
        });
      } catch (err) {
        if (settled) return;
        settled = true;
        resolve({ error: err?.message || 'Extensao invalida' });
      }
    });
  }

  function safeSendMessage(message) {
    try {
      if (!chrome?.runtime?.id) return;
      chrome.runtime.sendMessage(message, () => {
        if (chrome.runtime.lastError) {
          console.warn('PageAI sendMessage error:', chrome.runtime.lastError.message);
        }
      });
    } catch (err) {
      console.warn('PageAI sendMessage failed:', err);
    }
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
    if (!content) return;
    content.innerHTML = texto.replace(/\n\n/g, '<br><br>').replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    const msgs = shadow.getElementById('pageai-messages');
    msgs.scrollTop = msgs.scrollHeight;
  }
})();
