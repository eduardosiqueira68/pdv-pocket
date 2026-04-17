# 📚 Guia Completo: Como Colocar seu Projeto no GitHub (Para Leigos)

Vou explicar de forma bem simples, como se você nunca tivesse usado GitHub antes.

---

## O que é GitHub?

**GitHub** é um site onde você armazena seu código na nuvem. É como um Google Drive, mas para programadores.

**Benefícios**:
- ✅ Seu código fica seguro na nuvem
- ✅ Você pode acessar de qualquer lugar
- ✅ Outros podem colaborar com você
- ✅ Histórico completo de mudanças
- ✅ Workflows automáticos (CI/CD)

---

## Passo 1: Instalar Git no seu Computador

**Git** é um programa que você instala no seu PC para sincronizar código com GitHub.

### Windows

1. Acesse: https://git-scm.com/download/win
2. Clique no botão verde "Download"
3. Execute o arquivo baixado (`.exe`)
4. Clique "Next" em todas as telas
5. Clique "Finish"

### Mac

```bash
# Abra o Terminal e execute:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install git
```

### Linux

```bash
# Ubuntu/Debian
sudo apt-get install git

# Fedora
sudo dnf install git
```

### Verificar se Git foi instalado

Abra o **Terminal** (ou **PowerShell** no Windows) e execute:

```bash
git --version
```

Se aparecer um número de versão (ex: `git version 2.40.0`), Git foi instalado com sucesso! ✅

---

## Passo 2: Configurar Git com seus Dados

Abra o **Terminal** (ou **PowerShell**) e execute:

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@example.com"
```

**Exemplo**:
```bash
git config --global user.name "Eduardo Siqueira"
git config --global user.email "eduardosiqueira68@gmail.com"
```

---

## Passo 3: Criar Token no GitHub

Um **token** é como uma senha especial para você fazer upload do código.

### Criar Token

1. Acesse: https://github.com/settings/tokens
2. Clique no botão azul **"Generate new token"**
3. Selecione **"Generate new token (classic)"**
4. Preencha assim:
   - **Token name**: `pdv-pocket-push`
   - **Expiration**: `No expiration` (sem expiração)
   - **Select scopes**: Marque apenas ✅ `repo`
5. Clique no botão verde **"Generate token"**
6. **COPIE O TOKEN** (aparece uma única vez!)
   - Clique no ícone de copiar ao lado do token
   - Cole em um arquivo de texto (você vai precisar depois)

**⚠️ IMPORTANTE**: Não compartilhe este token com ninguém! É como sua senha.

---

## Passo 4: Clonar o Projeto para seu Computador

Agora vamos baixar o projeto do servidor Manus para seu PC.

### No Windows (PowerShell)

1. Abra o **PowerShell** (clique com botão direito no desktop → "Open PowerShell here")
2. Execute:

```powershell
# Vá para a pasta onde quer guardar o projeto
cd C:\Users\SeuUsuario\Documents

# Baixe o projeto
git clone https://github.com/eduardosiqueira68/pdv-pocket.git
cd pdv-pocket
```

### No Mac/Linux (Terminal)

```bash
# Vá para a pasta onde quer guardar o projeto
cd ~/Documents

# Baixe o projeto
git clone https://github.com/eduardosiqueira68/pdv-pocket.git
cd pdv-pocket
```

---

## Passo 5: Fazer Upload do Projeto para GitHub

Agora vamos enviar o projeto para GitHub.

### Windows (PowerShell)

```powershell
# Certifique-se que está na pasta do projeto
cd C:\Users\SeuUsuario\Documents\pdv-pocket

# Configure o remote (URL do GitHub)
git remote set-url origin https://github.com/eduardosiqueira68/pdv-pocket.git

# Mude para branch main
git branch -M main

# Faça o upload
git push -u origin main
```

### Mac/Linux (Terminal)

```bash
# Certifique-se que está na pasta do projeto
cd ~/Documents/pdv-pocket

# Configure o remote (URL do GitHub)
git remote set-url origin https://github.com/eduardosiqueira68/pdv-pocket.git

# Mude para branch main
git branch -M main

# Faça o upload
git push -u origin main
```

### O que vai acontecer

1. Vai pedir seu **username**: `eduardosiqueira68`
2. Vai pedir sua **senha**: Cole o **token** que você copiou no Passo 3
3. Vai fazer upload do projeto
4. Pronto! ✅

**Saída esperada**:
```
Enumerating objects: 150, done.
Counting objects: 100% (150/150), done.
Delta compression using up to 8 threads
Compressing objects: 100% (120/120), done.
Writing objects: 100% (150/150), 2.50 MiB | 1.25 MiB/s, done.
Total 150 (delta 30), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas: 100% (30/30), done.
To https://github.com/eduardosiqueira68/pdv-pocket.git
 * [new branch]      main -> main
Branch 'main' set up to track 'origin/main'.
```

---

## Passo 6: Verificar se Funcionou

1. Acesse: https://github.com/eduardosiqueira68/pdv-pocket
2. Você deve ver seus arquivos do projeto
3. Clique na aba **"Actions"** (ao lado de "Pull requests")
4. Você deve ver os **workflows** rodando:
   - ✅ Mobile App Audit & Quality Check
   - ✅ Tests & Coverage

---

## Troubleshooting (Se der Erro)

### Erro: "fatal: not a git repository"

**Causa**: Você não está na pasta do projeto

**Solução**:
```bash
cd /caminho/para/pdv-pocket
```

### Erro: "Authentication failed"

**Causa**: Username ou token incorreto

**Solução**:
1. Verifique se digitou `eduardosiqueira68` como username
2. Verifique se colou o token correto (não a senha do GitHub)
3. Se ainda não funcionar, gere um novo token

### Erro: "remote origin already exists"

**Causa**: Remote já foi configurado

**Solução**:
```bash
git remote remove origin
git remote add origin https://github.com/eduardosiqueira68/pdv-pocket.git
```

### Erro: "branch 'main' does not fully merge into 'origin/main'"

**Causa**: Conflito de branches

**Solução**:
```bash
git branch -M main
git push -u origin main --force
```

---

## Próximos Passos (Depois que Funcionar)

### 1. Ativar GitHub Actions

1. Acesse: https://github.com/eduardosiqueira68/pdv-pocket/settings
2. Clique em **"Actions"** (no menu esquerdo)
3. Clique em **"General"**
4. Em "Actions permissions", selecione:
   - ✅ "Allow all actions and reusable workflows"
5. Clique **"Save"**

### 2. Ver Workflows Rodando

1. Acesse: https://github.com/eduardosiqueira68/pdv-pocket/actions
2. Você deve ver seus workflows:
   - Mobile App Audit & Quality Check
   - Tests & Coverage
3. Clique em um para ver os detalhes

### 3. Configurar Branch Protection (Opcional)

Isso força que os workflows passem antes de fazer merge:

1. Acesse: https://github.com/eduardosiqueira68/pdv-pocket/settings/branches
2. Clique **"Add rule"**
3. Em "Branch name pattern", digite: `main`
4. Marque:
   - ✅ "Require status checks to pass before merging"
   - ✅ "Project Audit"
   - ✅ "Unit Tests"
5. Clique **"Create"**

---

## Resumo em 5 Passos

| Passo | O que fazer | Comando |
|-------|-----------|---------|
| 1 | Instalar Git | Download em git-scm.com |
| 2 | Configurar Git | `git config --global user.name "Seu Nome"` |
| 3 | Criar Token | https://github.com/settings/tokens |
| 4 | Clonar Projeto | `git clone https://github.com/eduardosiqueira68/pdv-pocket.git` |
| 5 | Fazer Upload | `git push -u origin main` |

---

## Dicas Importantes

### 💡 Dica 1: Salvar Token em Lugar Seguro

Depois que fizer o push, **salve o token em um arquivo seguro** (como um gerenciador de senhas):
- 1Password
- LastPass
- Bitwarden
- Até um arquivo .txt em pasta privada

### 💡 Dica 2: Usar SSH (Mais Seguro - Avançado)

Se quiser mais segurança, use SSH em vez de HTTPS. Mas isso é mais complexo, então deixe para depois.

### 💡 Dica 3: Fazer Commits Regularmente

Depois que o projeto estiver no GitHub, sempre que fizer mudanças, execute:

```bash
git add .
git commit -m "Descrição da mudança"
git push
```

### 💡 Dica 4: Usar GitHub Desktop (Mais Fácil)

Se achar o terminal complicado, baixe **GitHub Desktop**:
- https://desktop.github.com/
- Interface gráfica (sem linhas de comando)
- Mais fácil para iniciantes

---

## Precisa de Ajuda?

Se tiver dúvidas:

1. Verifique o **Troubleshooting** acima
2. Leia a documentação oficial: https://docs.github.com
3. Procure no Google: "github [seu erro]"
4. Peça ajuda em comunidades: Stack Overflow, Reddit r/learnprogramming

---

## Parabéns! 🎉

Se você chegou até aqui, seu projeto está no GitHub e pronto para CI/CD automático!

**Próximas funcionalidades**:
- ✅ Workflows rodam automaticamente em cada push
- ✅ Testes executam automaticamente
- ✅ Auditoria de qualidade automática
- ✅ Relatórios em pull requests
- ✅ Deploy automático (em breve)

Boa sorte! 🚀
