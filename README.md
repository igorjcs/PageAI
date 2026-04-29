# PageAI 🤖

Sua IA pessoal para navegar na web de forma inteligente. O PageAI transforma qualquer página estática em um chat interativo.

## ✨ Funcionalidades

- **Análise Multimodal**: A IA agora "vê" descrições de imagens, títulos (H1) e detecta vídeos na página.
- **Multi-Provedor**: Suporte para **Anthropic (Claude)**, **OpenAI (GPT-4o)**, **Google (Gemini 1.5)** e **Abacus AI**.
- **Conhecimento Híbrido**: Responde com base na página ou busca conhecimento externo quando necessário.
- **Interface Moderna**: Chat minimalista e funcional com modo de minimização.
- **UX Inteligente**: Campo de texto expansível e atalhos rápidos.
- **Privacidade**: Chaves de API armazenadas localmente.
- **Privacidade reforcada**: Revisao do contexto antes do envio e redacao automatica de PII.

## 🚀 Como instalar

1.  Acesse `chrome://extensions`.
2.  Ative o **"Modo do desenvolvedor"**.
3.  Clique em **"Carregar sem compactação"** e selecione a pasta do projeto.

## ⚙️ Configuração

1.  Abra o Popup da extensão.
2.  Escolha seu provedor e insira sua **API Key**.
3.  Clique em **"Configurar PageAI"**.
4.  Ative a chave **"Ativar nesta aba"**.

## 🔒 Privacidade e seguranca

- O contexto so e enviado apos revisao e confirmacao do usuario.
- Dados sensiveis comuns (email, telefone, CPF, cartao) sao redigidos automaticamente.
- A extensao funciona em qualquer site, mas sempre exige revisao do contexto.
- A extensao so injeta o script na aba ativa quando voce clica em ativar.

## ⌨️ Atalhos

- **Abrir/Fechar Chat**: `Alt + A`.
- **Enviar Mensagem**: `Enter`.
- **Quebrar Linha**: `Shift + Enter`.

---
*Nota: Requer API Key válida do provedor escolhido.*
