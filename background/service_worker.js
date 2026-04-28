chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'PERGUNTA') {
    responderPergunta(msg.pergunta, msg.contexto).then(sendResponse);
    return true;
  }

  if (msg.type === 'DESATIVAR') {
    chrome.storage.local.get(null, (data) => {
      const chave = `active_${sender.tab.id}`;
      chrome.storage.local.set({ [chave]: false });
    });
  }
});

async function responderPergunta(pergunta, contexto) {
  const data = await chrome.storage.local.get(['apiKey', 'apiProvider']);
  const apiKey = data.apiKey;
  const apiProvider = data.apiProvider || 'anthropic';

  if (!apiKey) return { texto: 'API Key não configurada. Abra o popup e salve sua chave.' };

  try {
    switch (apiProvider) {
      case 'anthropic': return await responderAnthropic(pergunta, contexto, apiKey);
      case 'openai': return await responderOpenAI(pergunta, contexto, apiKey);
      case 'gemini': return await responderGemini(pergunta, contexto, apiKey);
      case 'abacus': return await responderAbacus(pergunta, contexto, apiKey);
      default: return { texto: 'Provedor de API desconhecido.' };
    }
  } catch (err) {
    return { texto: `Erro de conexão: ${err.message}` };
  }
}

const PROMPT_SISTEMA = (contexto) => `Você é um assistente para páginas web.

INSTRUÇÕES PRINCIPAIS
- Responda sempre em português (pt-BR).
- Seja direto e objetivo.
- Conteúdo extraído da página (texto, imagens, estrutura) segue abaixo.

POLÍTICA DE FONTE E CONHECIMENTO EXTERNO
1. Tente encontrar a resposta PRIMEIRO na página.
2. Se NÃO estiver na página, use seu conhecimento externo.
3. Se usar conhecimento externo, adicione: "(Nota: Informação de fontes externas)".

CONTEXTO DA PÁGINA:
${contexto}`;

async function responderAnthropic(pergunta, contexto, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      system: PROMPT_SISTEMA(contexto),
      messages: [{ role: 'user', content: pergunta }],
    }),
  });
  const json = await response.json();
  return response.ok ? { texto: json.content[0].text } : { texto: `Erro Anthropic: ${json.error?.message}` };
}

async function responderOpenAI(pergunta, contexto, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: PROMPT_SISTEMA(contexto) },
        { role: 'user', content: pergunta }
      ],
    }),
  });
  const json = await response.json();
  return response.ok ? { texto: json.choices[0].message.content } : { texto: `Erro OpenAI: ${json.error?.message}` };
}

async function responderGemini(pergunta, contexto, apiKey) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: PROMPT_SISTEMA(contexto) + "\n\nPERGUNTA: " + pergunta }]
      }]
    }),
  });
  const json = await response.json();
  return response.ok ? { texto: json.candidates[0].content.parts[0].text } : { texto: `Erro Gemini: ${json.error?.message}` };
}

async function responderAbacus(pergunta, contexto, apiKey) {
  // Abacus AI Chat API
  const response = await fetch('https://abacus.ai/api/v0/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-abacus-api-key': apiKey },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: PROMPT_SISTEMA(contexto) },
        { role: 'user', content: pergunta }
      ]
    }),
  });
  const json = await response.json();
  return response.ok ? { texto: json.result.content } : { texto: `Erro Abacus: ${json.error?.message || 'Falha na API'}` };
}
