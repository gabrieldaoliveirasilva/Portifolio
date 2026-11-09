# Performance Monitor - Dashboard Web App (Google Apps Script)

Aplicação Web App moderna e de alta fidelidade desenvolvida em **Google Apps Script (Runtime V8)** e **HtmlService**, 100% fiel ao layout de telemetria e produtividade operacional (Performance Monitor).

---

## 🌐 URL do Web App Publicado (Google Apps Script)
👉 **[Acessar Web App no Google Apps Script](https://script.google.com/macros/s/AKfycbw1fhV5-rLf041oVNMSZOllk_Zx3gP6bGaftLhMLlfhrtCpvLi3DOwrSx8ZHuUBeL8sFA/exec)**  
*(Execução em ambiente de produção com dados 100% sintéticos e resilientes)*

---

## 🚀 Como Executar / Fazer Deploy no Google Apps Script

### Opção 1: Direto no Navegador (Menos de 2 minutos)
1. Acesse o [Google Apps Script](https://script.google.com/) ou abra uma Planilha Google e clique em **Extensões > Apps Script**.
2. No menu esquerdo:
   - No arquivo `Código.gs`, cole o conteúdo de [`Código.js`](./Código.js).
   - Clique em **+ > HTML**, nomeie o arquivo exatamente como `Index` e cole o conteúdo de [`Index.html`](./Index.html).
   - Em **Configurações do Projeto > Mostrar arquivo "appsscript.json" no editor**, garanta que o [`appsscript.json`](./appsscript.json) esteja configurado.
3. Clique em **Implantar > Nova Implantação**:
   - Tipo: **App da Web**
   - Executar como: **Eu (seu e-mail)**
   - Quem tem acesso: **Qualquer pessoa** (ou restrito ao seu domínio corporativo)
4. Copie a URL do Web App gerada e abra no seu navegador!

---

## 📊 Estrutura de Dados 100% Mock Safe & Integração com Planilha

O dashboard opera em modo **híbrido e resiliente**:
- **Sem planilha vinculada (Standalone):** Exibe instantaneamente os dados mockados de telemetria (`4,210,895` ações, `94.2%` eficiência, picos de tráfego `471.6K` / `172.48K` / `62.82K`, throughput por zona e ranking de top performers).
- **Com planilha vinculada:** Se você abrir a planilha e rodar a função `setupMockSpreadsheet()` no editor do Apps Script, ele cria automaticamente as abas:
  - `kpis_resumo`
  - `hourly_traffic`
  - `zone_throughput`
  - `top_performers`
- **Leitura em Batch:** Realiza a leitura de todas as linhas em 1 único round-trip HTTP (`getValues()`) e utiliza mapeamento dinâmico de colunas imune a alterações de ordem.
- **CacheService:** Chunking de cache em pedaços de 75KB, contornando o limite de 100KB do Google e garantindo resposta instantânea aos usuários.

