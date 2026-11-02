# 🚀 Portfólio de Inteligência Operacional & Analytics Engineering

> **Plataforma Executiva & Técnica de Portfólio de Dados** desenvolvida por **Gabriel Silva** (Analista de Dados Pleno | Business Intelligence & Supply Chain Analytics).  
> Construída com **Next.js 14 (App Router)**, **React 18**, **TypeScript Estrito** e **Micro-Visualizações Nativas em SVG**.

Projetado especificamente para ser apresentado a recrutadores, gestores e lideranças técnicas através do **LinkedIn** e **GitHub**, demonstrando domínio prático de **Engenharia de Dados**, **Modelagem SQL Avançada**, **Automação em Python**, **Web Apps em Google Apps Script** e **Business Intelligence para Supply Chain de Alta Escala**.

---

## 🌟 Estrutura e Módulos do Portfólio

### 1. Capa Executiva & Biografia Profissional (`/`)
- **Apresentação & Posicionamento:** Foco em inteligência logística, planejamento de capacidade (*capacity planning*), balanceamento de esteiras e governança de indicadores operacionais.
- **Resumo Biográfico:** Trajetória fundamentada em mais de 3 anos de atuação em grandes centros de triagem e e-commerce (*Shopee*, *Mercado Livre*, *Arado*).
- **Trajetória Operacional Completa:** Histórico profissional com contextos de negócio, rotinas, responsabilidades e ferramentas aplicadas.
- **Formação & Certificações:** CST em Gestão da Cadeia de Suprimentos e Logística (Estácio) e especializações técnicas em Looker Studio, SQL Server 2022 e Power BI (Alura).

### 2. Skills & Bastidores Técnicos Deste Dashboard (`/bio`)
- **Matriz de Competências:** Indicadores de proficiência em *BI & Analytics*, *Bancos de Dados & Linguagens*, *Gestão & Supply Chain* e *Ferramentas & WMS*.
- **Deep Dive Arquitetural (5 Pilares):**
  1. *O Problema Logístico:* Por que planilhas tradicionais travam e a necessidade de sistemas analíticos dedicados.
  2. *Arquitetura Frontend & Micro-SVGs:* Renderização nativa vetorial com FCP sub-150ms e zero bibliotecas gráficas pesadas.
  3. *Pipeline de Dados & Cache SWR:* Padrão *Stale-While-Revalidate* e sincronização assíncrona.
  4. *Concorrência & Apps Script:* `LockService` contra *race conditions* e particionamento em chunks do `CacheService`.
  5. *Governança & LGPD:* 100% de blindagem com dados sintéticos (*Mock-Safe*).

### 3. Projeto Python: Robô Autônomo de Extração de TOs (`/projeto-python`)
- Pipeline autônomo com autenticação SSO/CSRF, desduplicação em memória via Pandas e ingestão em lote (*Batch Update*) na Google Sheets API v4.
- Tratamento de exceções, paginação resiliente e arquitetura desacoplada pronta para execução em contêineres/cron jobs.

### 4. Projeto SQL: Produtividade em Esteiras & Pátio (`/projeto-sql`)
- Queries analíticas complexas de alta performance para BigQuery / Trino / Presto:
  - CTEs modulares com Regex para normalização de chaves de operadores.
  - Otimização com *Partition Pruning* (redução de até 95% do volume de varredura no Data Lake).
  - Cruzamento de dados de esteiras, carretas Linehaul (LH) e monitoramento de janelas críticas de CPT.

### 5. Projeto Apps Script: Leftover Control & Gestão de Pátio (`/projeto-apps-script`)
- Web App operacional interativo desenvolvido em Google Apps Script V2:
  - Interface reativa com micro-componentes HtmlService.
  - Bloqueio de concorrência com `LockService.getScriptLock()` para gravações atômicas de pátio e sobras.
  - Cache chunking superando o limite padrão de 100KB do `CacheService`.

### 6. Portal Completo de Indicadores / Hub (`/portal`)
- Visão centralizada com oráculo de navegação para todos os módulos: *Inbound Live*, *Produtividade de Esteiras*, *Histórico de Linehaul*, *Matriz GEROT*, *People Track* e *One Pages Operacionais*.

---

## 🛡️ Blindagem de Compliance & Anonimização de Dados

Este projeto foi concebido sob rigorosas diretrizes de compliance, ética corporativa e proteção de propriedade intelectual:
- **Zero Dados Reais ou Pessoais (LGPD):** Todos os números de pacotes, identificadores de carretas, nomes de motoristas e operadores são gerados algoritmicamente via motor determinístico.
- **Descaracterização Total:** Nenhuma métrica confidencial ou credencial interna de empresas parceiras foi mantida.
- **Portfólio Público Seguro:** Permite que gestores e recrutadores avaliem a profundidade técnica do candidato sem qualquer quebra de acordos de confidencialidade (NDA).

---

## 🛠️ Stack Tecnológica

- **Frontend & Fullstack:** [Next.js 14](https://nextjs.org/) (App Router), React 18, TypeScript Estrito.
- **Estilização:** CSS moderno com Design Tokens corporativos e variáveis CSS.
- **Visualização de Dados:** Micro-componentes SVG matemáticos puros (zero bloatware).
- **Linguagens & Dados:** SQL (BigQuery / ANSI), Python 3.11 (Requests, Pandas), Google Apps Script (JavaScript ES6+).

---

## 🚀 Como Executar Localmente

```bash
# 1. Navegar até a pasta do projeto
cd c:\Users\SPXBR48307\Desktop\case

# 2. Instalar dependências (caso necessário)
npm install

# 3. Executar o servidor de desenvolvimento
npm run dev
```

Acesse em seu navegador:  
👉 **`http://localhost:3000`**

---

## 🌐 Como Publicar (Deploy para o LinkedIn)

Para gerar um link público para fixar no perfil do LinkedIn e enviar a recrutadores:
1. Suba o código em um repositório no [GitHub](https://github.com/).
2. Conecte o repositório na [Vercel](https://vercel.com/) (gratuito para projetos pessoais).
3. O deploy será feito automaticamente em segundos com URL rápida (ex: `https://gabriel-silva-portfolio.vercel.app`).
