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

  if (!apiKey) return { texto: '⚠️ API Key não configurada. Abra o popup e salve sua chave.' };

  // Timeout de 30 segundos (aumentado para análises longas)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    let resultado;
    // Tenta executar a chamada e garante que nunca fique "pendente"
    const apiPromise = (async () => {
      switch (apiProvider) {
        case 'anthropic': return await responderAnthropic(pergunta, contexto, apiKey, controller.signal);
        case 'openai': return await responderOpenAI(pergunta, contexto, apiKey, controller.signal);
        case 'gemini': return await responderGemini(pergunta, contexto, apiKey, controller.signal);
        case 'abacus': return await responderAbacus(pergunta, contexto, apiKey, controller.signal);
        default: return { texto: '❌ Provedor de API desconhecido.' };
      }
    })();

    resultado = await apiPromise;
    clearTimeout(timeoutId);
    
    if (!resultado || !resultado.texto) {
      throw new Error("Resposta da API vazia ou inválida.");
    }
    
    return resultado;
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("Erro no Service Worker:", err);
    
    if (err.name === 'AbortError') {
      return { texto: '⌛ A análise está demorando mais do que o esperado. O LinkedIn é uma página pesada, tente simplificar a pergunta ou recarregar a página.' };
    }
    
    return { texto: `❌ Não consegui processar sua solicitação agora. (Erro: ${err.message})` };
  }
}

const PROMPT_SISTEMA = (contexto) => `Você é o PageAI, um assistente especialista em análise de páginas web e perfis profissionais.

OBJETIVO PRINCIPAL:
- Analisar TODO o contexto fornecido da página atual.
- Se o usuário pedir melhorias no perfil (LinkedIn), você deve ser crítico e dar dicas reais baseadas no que está lendo (Sobre, Experiência, Competências).
- Se a informação NÃO estiver no contexto, você deve dizer claramente: "Não encontrei essa informação específica na página, mas baseando-me em perfis similares..."

REGRAS CRÍTICAS:
1. Responda SEMPRE em português (pt-BR).
2. Se você encontrar um erro ou não conseguir ler a página, NÃO fique em silêncio. Responda explicando o que você consegue ver.
3. Use o conhecimento externo para complementar, mas priorize os dados da página.
4. Mantenha um tom profissional e prestativo.

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
