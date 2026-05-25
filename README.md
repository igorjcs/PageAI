# PageAI 🤖

AI companion for isolated browser tabs.
Companheiro de IA para abas isoladas no navegador.

PageAI turns any static page into a per-tab contextual chat, with real isolation and privacy.
PageAI transforma qualquer pagina estatica em um chat contextual por aba, com isolamento real e privacidade.

## Why? / Por que?

- **Privacy**: keys stay in the browser and context goes through PII redaction.
- **Privacidade**: suas chaves ficam no navegador e o contexto passa por redacao de PII.
- **Isolation**: each tab has its own lifecycle and state.
- **Isolamento**: cada aba tem seu proprio ciclo de vida e estado.
- **Per-tab context**: conversations do not leak across sites or tasks.
- **Contexto por aba**: conversas nao vazam entre sites ou tarefas.

I thought it would be "just an extension". Now I am debating tab lifecycle and context at 1 a.m.
Achei que seria "so uma extensao". Agora estou debatendo ciclo de vida de abas e contexto as 1h da manha.

## Features / Funcionalidades

- Multiple AI providers / Multi-provedor
- Bring your own API key / Traga sua propria API key
- Tab isolation / Isolamento por aba
- Chromium support / Suporte a Chromium
- Local storage / Armazenamento local
- Context-aware interactions / Interacoes com contexto

## Architecture / Arquitetura

- **Popup**: provider config, key and per-tab activation.
- **Popup**: configuracao de provedor, chave e ativacao por aba.
- **Content script**: collects context only in the active tab and injects the chat.
- **Content script**: coleta contexto apenas na aba ativa e injeta o chat.
- **Service worker**: orchestrates state and message routing.
- **Service worker**: orquestra estado e roteamento de mensagens.
- **Local storage**: keys and preferences stay in the browser.
- **Armazenamento local**: chaves e preferencias ficam no navegador.
- **Provider adapters**: one interface for multiple APIs.
- **Adapters de provedor**: interface unica para varias APIs.

## Screenshots / Capturas

![Imagem 1 - Pergunta "summarize this page" em uma pagina tecnica](assets/screenshots/img-1.png)

![Imagem 2 - Selecionando provider e inserindo API key](assets/screenshots/img-2.png)

![Imagem 3 - Isolamento por aba e contexto ativo](assets/screenshots/img-3.png)

## Capabilities / Capacidades

- **Multimodal analysis**: sees image descriptions, H1 titles, and detects videos.
- **Analise multimodal**: ve descricoes de imagens, titulos (H1) e detecta videos.
- **Multi-provider**: supports **Anthropic (Claude)**, **OpenAI (GPT-4o)**, **Google (Gemini 1.5)** and **Abacus AI**.
- **Multi-provedor**: suporte para **Anthropic (Claude)**, **OpenAI (GPT-4o)**, **Google (Gemini 1.5)** e **Abacus AI**.
- **Hybrid knowledge**: answers from the page or fetches external knowledge when needed.
- **Conhecimento hibrido**: responde com base na pagina ou busca conhecimento externo quando necessario.
- **Modern UI**: minimal chat with a minimize mode.
- **Interface moderna**: chat minimalista com modo de minimizacao.
- **Smart UX**: expandable input and quick shortcuts.
- **UX inteligente**: campo de texto expansivel e atalhos rapidos.
- **Privacy**: API keys stored locally.
- **Privacidade**: chaves de API armazenadas localmente.
- **Extra privacy**: automatic PII redaction before sending.
- **Privacidade reforcada**: redacao automatica de PII antes do envio.

## 🚀 Install / Instalar

1. Open `chrome://extensions`.
2. Enable **"Developer mode"**.
3. Click **"Load unpacked"** and select the project folder.
4. Acesse `chrome://extensions`.
5. Ative o **"Modo do desenvolvedor"**.
6. Clique em **"Carregar sem compactacao"** e selecione a pasta do projeto.

## ⚙️ Setup / Configuracao

1. Open the extension popup.
2. Choose your provider and enter your **API key**.
3. Click **"Configurar PageAI"**.
4. Enable **"Ativar nesta aba"**.

## 🔒 Privacy & Security / Privacidade e Seguranca

- Context goes through automatic sensitive-data redaction.
- O contexto passa por redacao automatica de dados sensiveis.
- Common PII (email, phone, CPF, card) is redacted.
- Dados sensiveis comuns (email, telefone, CPF, cartao) sao redigidos automaticamente.
- Works on any site, but always requires context review.
- A extensao funciona em qualquer site, mas sempre exige revisao do contexto.
- Script is injected only in the active tab when you enable it.
- A extensao so injeta o script na aba ativa quando voce clica em ativar.

## Hidden Technical Edge / Diferencial Tecnico Escondido

- Browser APIs
- Isolamento e contexto
- UX aplicada
- IA e seguranca
- Arquitetura de extensao

## Next Level / Proximo Nivel

- Domain memory / Memoria por dominio
- Local RAG / RAG local
- Doc auto-summary / Resumo automatico de docs
- Pair programmer mode / Modo "pair programmer"
- GitHub PR analysis / Analise de PR do GitHub
- Talk to docs / Conversar com paginas de documentacao

## ⌨️ Shortcuts / Atalhos

- **Open/Close Chat**: `Alt + A`.
- **Abrir/Fechar Chat**: `Alt + A`.
- **Send Message**: `Enter`.
- **Enviar Mensagem**: `Enter`.
- **New Line**: `Shift + Enter`.
- **Quebrar Linha**: `Shift + Enter`.

---
*Note: Requires a valid API key from the selected provider.*
*Nota: Requer API key valida do provedor escolhido.*
