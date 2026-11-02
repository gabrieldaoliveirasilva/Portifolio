# SPX Expedicao Dashboard - Vercel

Este projeto é a base recomendada para migrar o dashboard do Apps Script para uma aplicação web publicada na Vercel com GitHub.

## O que ja foi criado

- Projeto Next.js pronto para Vercel.
- Abas principais: Geral, Programacao, Stage Out, Docas, Contagem e Inteligencia.
- APIs separadas:
  - `/api/painel`
  - `/api/programacao`
  - `/api/stage-out`
  - `/api/docas`
  - `/api/contagem`
  - `/api/inteligencia`
- Camada de dados mockada em `lib/mock-data.ts`.
- Camada de regra em `lib/dashboard.ts`, reaproveitando a logica do Apps Script.
- Ponto futuro para Google Sheets em `lib/data-source.ts`.

## Como rodar localmente

```bash
npm install
npm run dev
```

Depois abra:

```text
http://localhost:3000
```

## Como publicar com GitHub e Vercel

1. Crie um repositorio no GitHub.
2. Envie a pasta `vercel-spx-dashboard` para esse repositorio.
3. Entre na Vercel.
4. Clique em `Add New Project`.
5. Selecione o repositorio do GitHub.
6. Framework: `Next.js`.
7. Build command: `npm run build`.
8. Output: automatico.
9. Clique em `Deploy`.

## Proximo passo tecnico

Trocar os dados mockados por dados reais.

O ideal é implementar a leitura das abas pelo Google Sheets API em `lib/data-source.ts`, mantendo as regras em `lib/dashboard.ts`.

## Por que essa arquitetura melhora a velocidade

No Apps Script, a tela chama funcoes que frequentemente leem grandes intervalos da planilha. Na Vercel, o dashboard pode:

- Separar frontend de processamento.
- Cachear respostas de API.
- Processar dados uma vez e entregar dados prontos.
- Evoluir para banco/cache sem reescrever a interface.

O ganho real vem quando a planilha deixa de ser lida inteira a cada interação.

## Ordem recomendada da migracao

1. Publicar esta base mockada na Vercel.
2. Conectar GitHub e validar deploy automatico.
3. Implementar Google Sheets API.
4. Migrar uma API por vez começando por `/api/programacao`.
5. Criar cache das respostas.
6. Se a base crescer muito, mover dados tratados para Supabase ou BigQuery.
