# Leftover Control - Web App (Google Apps Script)

Aplicação Web App corporativa de missão crítica construída sobre Google Apps Script e HtmlService.
Conecta o estoque em tempo real de Ordens de Transporte embaladas (`tos_packed`) com a programação de viagens de carretas (`db_all`), calculando sobras projetadas (*Leftovers*), alertando estouros de capacidade física do veículo e sugerindo reforços de frota antes do corte de **CPT (Critical Pull Time)**.

---

## 🔗 Links Oficiais do Projeto

- **Web App (Execução Direta):**  
  [https://script.google.com/macros/s/AKfycbzUoFyU1UaATi1BCclPUinVSBSNsyj07oSYQ2yFXnzKiVosRR8snRTyKanmFN3c5mosUg/exec](https://script.google.com/macros/s/AKfycbzUoFyU1UaATi1BCclPUinVSBSNsyj07oSYQ2yFXnzKiVosRR8snRTyKanmFN3c5mosUg/exec)

- **Editor do Google Apps Script:**  
  [https://script.google.com/d/133S8BWJlEwSanyC4WAvxXpkuxt05PLsWWC7dZBkjPEOdpzrjg8MVX82P/edit](https://script.google.com/d/133S8BWJlEwSanyC4WAvxXpkuxt05PLsWWC7dZBkjPEOdpzrjg8MVX82P/edit)

- **Script ID:** `133S8BWJlEwSanyC4WAvxXpkuxt05PLsWWC7dZBkjPEOdpzrjg8MVX82P`
- **Deployment ID (V2):** `AKfycbzUoFyU1UaATi1BCclPUinVSBSNsyj07oSYQ2yFXnzKiVosRR8snRTyKanmFN3c5mosUg`
- **Conta Proprietária:** `gabriel.sooliveira@shopee.com`

---

## 🏗️ Padrões de Arquitetura Implementados

1. **HtmlService & RPC Assíncrono (`google.script.run`):**  
   Interface desacoplada com callbacks assíncronos (`withSuccessHandler` e `withFailureHandler`), garantindo alta velocidade de renderização e sem travamento de página.

2. **LockService (Zero Race Condition):**  
   `LockService.getScriptLock().tryLock(8000)` para serialização de transações concorrentes na gravação de justificativas e atualização de cache.

3. **CacheService com Chunking de 70KB:**  
   Algoritmo proprietário de particionamento dinâmico de JSON em blocos de 70KB (`cache.putAll`), superando o limite padrão de 100KB do Google Apps Script e reduzindo a latência para sub-200ms.

4. **Batch Operations (`getValues`):**  
   Processamento em lote via matriz em memória JavaScript (motor V8), eliminando acessos célula-a-célula (`getValue`) no Google Sheets.

