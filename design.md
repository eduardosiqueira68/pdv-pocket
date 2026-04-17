# PDV Pocket — Design do App

## Visão Geral

App de PDV (Ponto de Venda) para pequenas mercearias, conveniências e feirantes. Substitui calculadora e caderno por um fluxo rápido: escanear, somar, finalizar. Funciona 100% offline com SQLite local.

---

## Telas do App

### 1. Onboarding (primeiro acesso)
- **Tela de Boas-vindas**: "Bem-vindo ao PDV Pocket — seu caixa simples". Ilustração minimalista de um celular com scanner. Botão "Começar".
- **Tela Criar Loja**: Campo "Nome da loja". Botão "Criar Loja e Começar".

### 2. Home (menu principal)
- Header com nome da loja e saudação
- Card de resumo do dia: total vendido hoje, número de vendas
- 4 botões grandes em grid 2x2:
  - **Iniciar Venda** (ícone scanner, cor primária, destaque)
  - **Produtos** (ícone caixa/pacote)
  - **Vendas** (ícone lista/recibo)
  - **Relatório do Dia** (ícone gráfico)
- Botão de Configurações no header (ícone engrenagem)

### 3. Produtos (lista)
- Barra de busca por nome ou código
- FlatList com cards: nome, preço (R$), código de barras
- Botão flutuante "+ Novo Produto"
- Swipe ou botão para editar/desativar

### 4. Produto (criar/editar)
- Botão "Escanear Código" (abre câmera)
- Campo código de barras (preenchido pelo scanner ou manual)
- Campo nome
- Campo preço (teclado numérico, formato R$ 0,00)
- Campo categoria (opcional, dropdown simples)
- Botão "Salvar"

### 5. PDV — Tela de Venda (tela principal do app)
- Área superior: câmera/scanner ativa (ou botão para ativar)
- Lista do cupom (FlatList):
  - Cada item: nome, qtd, preço unitário, subtotal
  - Botões inline: +1, -1, remover
- Rodapé fixo:
  - Total em fonte grande (24pt+)
  - Botão "Adicionar Manual" (produto sem código)
  - Botão "Finalizar" (destaque, cor primária)

### 6. Cadastro Rápido (modal no PDV)
- Aparece quando código escaneado não existe
- Código já preenchido (readonly)
- Campo nome
- Campo preço
- Botão "Salvar e Adicionar ao Cupom"

### 7. Finalizar Venda
- Total grande no topo
- Seletor de método: Dinheiro / Pix / Cartão (3 botões)
- Se Dinheiro:
  - Campo "Valor Recebido" (teclado numérico)
  - Troco calculado automaticamente
  - Bloqueia "Concluir" se recebido < total
- Botão "Concluir Venda"
- Tela de sucesso: "Venda concluída!" com opções:
  - "Nova Venda"
  - "Ver Recibo"

### 8. Histórico de Vendas
- Filtro por data (Hoje / Ontem / Escolher data)
- FlatList: hora, total, método de pagamento
- Tap abre detalhe da venda

### 9. Detalhe da Venda
- Data/hora
- Lista de itens (nome, qtd, preço, subtotal)
- Total, desconto, método
- Botão "Compartilhar Recibo" (texto via WhatsApp/share)

### 10. Relatório do Dia
- Card: Total vendido hoje (destaque grande)
- Card: Número de vendas
- Card: Ticket médio
- Lista: Top 10 produtos do dia

### 11. Configurações
- Nome da loja (editável)
- Sobre o app
- Versão

---

## Fluxos Principais

### Fluxo de Venda (principal)
1. Home → "Iniciar Venda"
2. Scanner abre → passa produto
3. Produto encontrado → adiciona ao cupom (incrementa se repetido)
4. Produto não encontrado → modal "Cadastrar agora?" → cadastra → volta ao cupom
5. Toca "Finalizar"
6. Seleciona pagamento → Dinheiro (digita recebido, troco aparece)
7. "Concluir" → salva venda → tela sucesso → "Nova Venda"

### Fluxo de Cadastro de Produto
1. Home → "Produtos" → "+ Novo Produto"
2. Escaneia código ou digita
3. Preenche nome e preço
4. Salva

---

## Paleta de Cores

| Token | Light | Dark | Uso |
|-------|-------|------|-----|
| primary | #1B6B3A | #2ECC71 | Botões principais, destaque PDV |
| background | #F8F9FA | #121212 | Fundo das telas |
| surface | #FFFFFF | #1E1E1E | Cards e superfícies elevadas |
| foreground | #1A1A1A | #F0F0F0 | Texto principal |
| muted | #6B7280 | #9CA3AF | Texto secundário |
| border | #E5E7EB | #2D2D2D | Bordas e divisores |
| success | #22C55E | #4ADE80 | Sucesso, venda concluída |
| warning | #F59E0B | #FBBF24 | Alertas |
| error | #EF4444 | #F87171 | Erros, remover item |

A cor primária verde remete a dinheiro/comércio e é a identidade visual do app.

---

## Tipografia

- Títulos de tela: 24px bold
- Total do PDV: 36px bold (destaque máximo)
- Preços nos cards: 18px semibold
- Texto normal: 16px regular
- Texto secundário: 14px regular, cor muted

---

## Navegação

- **Tab Bar** com 4 abas: Home, PDV (Venda), Produtos, Vendas
- Telas modais: Cadastro Rápido, Finalizar Venda
- Stack navigation dentro de cada tab para drill-down (ex: lista produtos → editar produto)

---

## Regras de UX

- Feedback háptico ao escanear código com sucesso
- Som de "beep" ao ler código (sensação de PDV real)
- Fonte grande no total (acessibilidade e uso rápido)
- Teclado numérico para campos de preço/valor
- Arredondamento sempre 2 casas decimais
- Valores em centavos (INT) internamente para evitar erros de ponto flutuante
