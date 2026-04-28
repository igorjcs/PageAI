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

  // Timeout de 15 segundos para evitar o "Analisando..." infinito
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    let resultado;
    switch (apiProvider) {
      case 'anthropic': resultado = await responderAnthropic(pergunta, contexto, apiKey, controller.signal); break;
      case 'openai': resultado = await responderOpenAI(pergunta, contexto, apiKey, controller.signal); break;
      case 'gemini': resultado = await responderGemini(pergunta, contexto, apiKey, controller.signal); break;
      case 'abacus': resultado = await responderAbacus(pergunta, contexto, apiKey, controller.signal); break;
      default: resultado = { texto: 'Provedor de API desconhecido.' };
    }
    clearTimeout(timeoutId);
    return resultado;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      return { texto: '⚠️ A resposta demorou muito. Verifique sua conexão ou se a chave de API é válida.' };
    }
    return { texto: `Erro de conexão: ${err.message}` };
  }
}

const PROMPT_SISTEMA = (contexto) => `Você é um assistente especialista em análise de páginas web.

OBJETIVO PRINCIPAL:
- Responder perguntas sobre a página atual usando o contexto fornecido.
- Se a resposta não estiver na página, você DEVE buscar em seu conhecimento geral, avisando o usuário.

REGRAS DE RESPOSTA:
1. Responda SEMPRE em português (pt-BR).
2. Tente identificar o tema central da página (ex: se é o site do Flamengo, de uma loja, etc).
3. Seja direto. Se o usuário perguntar "qual o time dessa página?", analise o título, URL e conteúdo para responder (ex: "Esta página é do Clube de Regatas do Flamengo").
4. Se usar conhecimento externo à página, adicione ao final: "(Nota: Informação de fontes externas)".

CONTEXTO DA PÁGINA ATUAL:
${contexto}`;

async function responderAnthropic(pergunta, contexto, apiKey, signal) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
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
  if (!response.ok) return { texto: `Erro Anthropic: ${json.error?.message || response.status}` };
  return { texto: json.content[0].text };
}

async function responderOpenAI(pergunta, contexto, apiKey, signal) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: PROMPT_SISTEMA(contexto) },
        { role: 'user', content: pergunta }
      ],
      max_tokens: 1024,
    }),
  });
  const json = await response.json();
  if (!response.ok) return { texto: `Erro OpenAI: ${json.error?.message || response.status}` };
  return { texto: json.choices[0].message.content };
}

async function responderGemini(pergunta, contexto, apiKey, signal) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: PROMPT_SISTEMA(contexto) + "\n\nPERGUNTA DO USUÁRIO: " + pergunta }]
      }]
    }),
  });
  const json = await response.json();
  if (!response.ok) return { texto: `Erro Gemini: ${json.error?.message || response.status}` };
  return { texto: json.candidates[0].content.parts[0].text };
}

async function responderAbacus(pergunta, contexto, apiKey, signal) {
  const response = await fetch('https://abacus.ai/api/v0/chat', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', 'x-abacus-api-key': apiKey },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: PROMPT_SISTEMA(contexto) },
        { role: 'user', content: pergunta }
      ]
    }),
  });
  const json = await response.json();
  if (!response.ok) return { texto: `Erro Abacus: ${json.error?.message || 'Falha na API'}` };
  return { texto: json.result.content };
}
