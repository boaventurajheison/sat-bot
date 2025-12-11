# 📊 Strivora – Painel de Consulta Binance Futures

O **Strivora** é um painel web desenvolvido para consultar informações da sua conta Binance Futures de forma simples e direta.
Ele é utilizado exclusivamente para **visualização de dados** — nenhuma ordem é enviada ou executada por este sistema.

O painel exibe:

* 💰 **Saldo total** (Wallet + Unrealized PnL)
* 📜 **Histórico das últimas operações**
* 📈 **Ordens abertas com PnL atualizado em tempo real**

> ⚠️ O Strivora não é o bot de trading.
> Ele funciona apenas como **dashboard de acompanhamento**.

---

## 🧩 Funcionalidades

* Consulta segura via API da Binance Futures (endpoints de leitura)
* Exibição do valor total consolidado da conta
* Posições abertas com preço de marcação + PnL atualizado
* Histórico recente de operações
* Interface web simples (nota: o front atualmente **não é responsivo**)
* Backend em Node com endpoints dedicados consumindo a API da Binance

---

## 🛠️ Tecnologias Utilizadas (conforme repositório)

### **Linguagens**

* TypeScript (principal)
* CSS
* JavaScript
* HTML

### **Backend**

* Node.js + Express
* TypeScript
* Axios
* Crypto (HMAC-SHA256 para assinatura das requisições)
* Dotenv
* CORS
* Prisma (presente na pasta `prisma` — se estiver em uso)

### **Frontend**

* React (TypeScript) — frontend presente na pasta `web`
* Hooks (`useState`, `useEffect`)
* Axios / Fetch

### **Infra / DevOps**

* GitHub Actions (`.github/workflows/`)
* Build compilado em `dist/` (se aplicável)

---

## 📦 Estrutura do Repositório (visível no GitHub)

```
.
├── .github/
│   └── workflows/          # Pipelines CI/CD
├── dist/                   # Build compilado do backend (Node/TS)
├── prisma/                 # Schemas e migrações do Prisma
├── src/                    # Backend (Node.js + Express)
│   ├── server.ts
│   ├── services/
│   │   └── binance.ts
│   ├── controllers/
│   └── utils/
├── web/                    # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── pages/
│   │   └── assets/
│   └── public/
├── .env.exemple            # Modelo de variáveis de ambiente
├── .gitignore
├── package.json
├── package-lock.json
├── tsconfig.json
└── README.md
```

---

## ▶️ Como rodar localmente

### 1. Clone o repositório

```
bash
git clone https://github.com/boaventurajheison/sat-bot.git
cd sat-bot
```

### Backend

```
# Instale dependências (na raiz, se o backend for aqui)
npm install

# Configure variáveis (copie .env.exemple -> .env)
# Exemplo de .env:
# BINANCE_API_KEY=seu_key
# BINANCE_API_SECRET=seu_secret
# PORT=3000

npm run dev
```

O backend deverá ficar disponível em **[http://localhost:3000](http://localhost:3000)** (ou porta configurada).

### Frontend

```
cd web
npm install
npm run dev
```

---

## 🔐 Segurança

* As chaves API **não devem ser commitadas** (use `.env`, não o repositório).
* O projeto utiliza apenas **endpoints de leitura** da Binance.
* Assinaturas seguem o padrão oficial **HMAC-SHA256**.

---

## 🚫 O que o Strivora NÃO faz

* ❌ Não envia ordens
* ❌ Não executa trades
* ❌ Não altera posições
* ❌ Não substitui bots automatizados

Ele é **somente um painel de visualização**.

---

## 🌐 Deploy

Pode ser hospedado em:

* Hostinger
* Vercel (apenas frontend)
* Render/Railway (backend)
* VPS própria

Site atual (produção): **[https://www.strivora.com.br/](https://www.strivora.com.br/)**

---

## 🤝 Contribuições

Sugestões e melhorias são bem-vindas. Abra uma **Issue** ou envie um **Pull Request**.

