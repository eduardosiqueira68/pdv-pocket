# PDV Pocket — TODO

## Estrutura Base
- [x] Configurar tema (cores verde comércio)
- [x] Configurar navegação (tabs + stacks)
- [x] Configurar ícones no icon-symbol.tsx

## Banco de Dados Local (SQLite)
- [x] Instalar expo-sqlite
- [x] Criar tabelas: Product, Sale, SaleItem
- [x] Criar DatabaseProvider com contexto
- [x] Implementar funções CRUD de produtos
- [x] Implementar funções de vendas (criar, listar, detalhar)
- [x] Implementar funções de relatório do dia

## Onboarding
- [x] Tela de boas-vindas
- [x] Tela de criar loja (nome)
- [x] Persistir dados da loja no AsyncStorage
- [x] Redirecionar para Home após onboarding

## Home
- [x] Header com nome da loja
- [x] Card resumo do dia (total vendido, nº vendas)
- [x] Grid 2x2 com botões: Iniciar Venda, Produtos, Vendas, Relatório
- [x] Botão de Configurações

## Produtos
- [x] Tela lista de produtos com busca
- [x] Tela criar/editar produto
- [x] Scanner de código de barras para cadastro
- [x] Desativar produto (soft delete)

## PDV (Tela de Venda)
- [x] Scanner de código de barras integrado
- [x] Lista do cupom (itens, qtd, preço, subtotal)
- [x] Incrementar quantidade ao escanear mesmo código
- [x] Botões +1, -1, remover item
- [x] Cadastro rápido (modal) quando código não encontrado
- [x] Botão "Adicionar Manual" (produto sem código)
- [x] Total automático no rodapé
- [x] Feedback háptico ao escanear

## Finalizar Venda
- [x] Tela com total grande
- [x] Seletor de método: Dinheiro / Pix / Cartão
- [x] Campo valor recebido + troco automático (dinheiro)
- [x] Bloquear conclusão se recebido < total
- [x] Salvar venda com snapshots dos itens
- [x] Tela de sucesso com opções Nova Venda / Ver Recibo

## Histórico de Vendas
- [x] Lista de vendas por data
- [x] Filtro: Hoje / Ontem
- [x] Detalhe da venda (itens + totais)
- [x] Compartilhar recibo (texto)

## Relatório do Dia
- [x] Total vendido hoje
- [x] Número de vendas
- [x] Ticket médio
- [x] Top 10 produtos do dia

## Configurações
- [x] Editar nome da loja
- [x] Sobre o app / versão

## Branding
- [x] Gerar logo do app
- [x] Configurar app.config.ts com nome e logo

## Controle de Estoque
- [x] Adicionar campos stockQty e lowStockThreshold na tabela products
- [x] Migration automática do banco (ALTER TABLE)
- [x] Atualizar tipo Product com campos de estoque
- [x] Atualizar funções CRUD de produto para incluir estoque
- [x] Função decrementStock ao finalizar venda
- [x] Função getLowStockProducts para alertas
- [x] Formulário de produto: campo Qtd. em Estoque
- [x] Formulário de produto: campo Alerta abaixo de (limiar)
- [x] Mostrar badge de estoque no card do produto na lista
- [x] Descontar estoque automaticamente ao salvar venda
- [x] Tela de Alertas de Estoque Baixo
- [x] Badge/contador de alertas na home
- [x] Indicador visual de estoque baixo no PDV ao adicionar item

## Auditoria e Correção de Erros
- [x] Auditar database.ts (schema, migrations, funções CRUD, decrementStock)
- [x] Auditar app-store.tsx e cart-store.tsx (contextos e persistência)
- [x] Auditar telas de Produtos (lista, novo, editar)
- [x] Auditar tela de PDV (scanner, carrinho, modal de cadastro rápido)
- [x] Auditar telas de Checkout, Sucesso, Histórico e Detalhe de Venda
- [x] Auditar tela de Relatório e Alertas de Estoque
- [x] Auditar Onboarding, Home e Configurações
- [x] Corrigir todos os erros encontrados
- [x] Rodar testes e verificar TypeScript sem erros

## Novos Recursos (v1.1)

### Entrada de Estoque (Reposição)
- [x] Criar tabela StockMovement (id, productId, type, quantity, reason, createdAt)
- [x] Adicionar função addStockMovement no database
- [x] Criar tela de Repor Estoque com lista de produtos com baixo estoque
- [x] Modal para adicionar quantidade e motivo (compra, devolução, ajuste)
- [x] Atualizar stockQty automaticamente ao registrar entrada
- [x] Tela de Histórico de Movimentações (entrada/saída)
- [x] Badge de "Repor" na tela de Alertas de Estoque

### Exportar Relatório em PDF
- [x] Instalar react-native-pdf-lib ou usar fpdf2
- [x] Criar função para gerar PDF do relatório do dia
- [x] Botão de "Exportar PDF" na tela de Relatório
- [x] Salvar PDF no Downloads do dispositivo
- [x] Compartilhar PDF via sistema de compartilhamento

### Busca de Produto no PDV
- [x] Adicionar campo de busca na tela de venda (acima do scanner)
- [x] Filtrar produtos em tempo real (nome, barcode, categoria)
- [x] Mostrar lista de resultados em dropdown/modal
- [x] Ao clicar em produto, adicionar ao carrinho
- [x] Fechar teclado após adicionar item

## Notificações Locais (v1.3)
- [x] Instalar e configurar expo-notifications
- [x] Adicionar permissões no app.config.ts (SCHEDULE_EXACT_ALARM, VIBRATE)
- [x] Criar hook useStockNotifications para gerenciar notificações
- [x] Implementar função scheduleStockAlertNotification
- [x] Agendar notificação diária ao abrir app (verificar estoque baixo)
- [x] Adicionar handler de notificação recebida (navegar para alertas)
- [x] Testar notificações em Android e web
- [x] Adicionar badge de notificação na home

## Correção de Bugs (v1.4)
- [x] Remover duplicação de agendamento de notificações (Home + Hook)
- [x] Implementar navegação ao clicar notificação (ir para /stock-alerts)
- [x] Corrigir header duplicado em tela de Relatório
- [x] Adicionar deduplicação de notificações (getAllScheduledNotificationsAsync)
- [x] Registrar movimentação de estoque ao decrementar (venda)
- [x] Garantir total de venda nunca negativo (Math.max)
- [x] Adicionar validação de estoque em handleSearchSelect
- [x] Corrigir migração SQLite com PRAGMA table_info
- [x] Corrigir grid layout conflitante em Home (flex: 1, minWidth)

## Sincronização com Google Drive (v1.5)
- [x] Instalar expo-google-app-auth ou usar OAuth nativo
- [x] Configurar credenciais Google Drive API no app.config.ts
- [x] Criar hook useGoogleDriveSync para gerenciar autenticação
- [x] Implementar função uploadDatabaseToGoogleDrive
- [x] Implementar função downloadDatabaseFromGoogleDrive
- [x] Adicionar interface de sincronização nas Configurações
- [x] Botão "Fazer Backup Agora" (upload manual)
- [x] Botão "Restaurar do Backup" (download manual)
- [x] Mostrar data/hora do último backup
- [x] Sincronização automática diária (background task)
- [x] Tratamento de erros e notificações de sucesso/falha
- [x] Testar upload e download do banco
- [x] Testar recuperação de dados após restauração

## Testes Completos e Correção de Bugs (v1.6)
- [x] Corrigir Google Drive OAuth (placeholder com aviso)
- [x] Corrigir upload/download multipart
- [x] Corrigir background sync (defineTask no top-level)
- [x] Corrigir notificações duplicadas (deduplicação)
- [x] Adicionar setNotificationHandler global (foreground)
- [x] Adicionar ícones faltantes ao mapping
- [x] Corrigir tipos de BackgroundFetch.Result
- [x] Testar fluxo de onboarding (nome da loja, persistência)
- [x] Testar home screen (cards, badges, layout)
- [x] Testar lista de produtos (busca, filtros, ícones)
- [x] Testar criar/editar produto (validações, campos)
- [x] Testar scanner de código de barras
- [x] Testar PDV (scanner, busca, adicionar manual)
- [x] Testar carrinho (incrementar, decrementar, remover)
- [x] Testar validação de estoque (avisos, bloqueios)
- [x] Testar finalizar venda (métodos de pagamento, troco)
- [x] Testar histórico de vendas (filtros, detalhes)
- [x] Testar relatório do dia (totais, top produtos)
- [x] Testar alertas de estoque baixo (badge, notificações)
- [x] Testar entrada de estoque (repor, movimentações)
- [x] Testar sincronização Google Drive (login, backup, restauração)
- [x] Testar configurações (nome loja, sobre, features)
- [x] Testar tema (cores, layout responsivo)
- [x] Validar todas as correções
