# 📊 Strivora – Painel de Consulta Binance Futures

O **Strivora** é um painel web que permite consultar informações da sua conta Binance Futures de forma simples e direta.  
O sistema exibe:

- 💰 Saldo total da conta (Wallet + Unrealized PnL)  
- 📜 Histórico de operações  
- 📈 Ordens abertas com PnL atualizado em tempo real  

Este projeto é **apenas um dashboard de consulta**.  
Nenhuma ordem é executada por ele.  
O bot de trading é totalmente separado e não tem relação com este repositório.

---

## 🧩 Funcionalidades

- Consulta segura à API da Binance Futures  
- Cálculo de total de patrimônio + PnL  
- Exibição de todas as posições abertas  
- Histórico simplificado das últimas operações  
- Atualização automática dos dados  
- Interface leve e direta para uso em qualquer navegador

---

## 🛠️ Tecnologias Utilizadas

### **Backend**
- Node.js + Express  
- TypeScript  
- Axios  
- Crypto (assinaturas para autenticação Binance)  
- Dotenv  
- CORS  

### **Frontend**
- React (TypeScript)  
- Hooks (`useState`, `useEffect`)  
- Fetch/Axios  

### **Exchange**
- Binance Futures API (somente endpoints de leitura)

---

## 📦 Estrutura do Projeto

