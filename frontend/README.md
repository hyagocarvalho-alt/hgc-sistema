# 🏥 HGC — Sistema de Agendamento de Consultas

Sistema web completo para gerenciamento de agendamentos médicos, desenvolvido com **Vue.js** (frontend) e **Node.js + Express** (backend).

---

## 🌐 Como Acessar o Sistema

### No Computador ou Celular
Abra o navegador e acesse:

```
https://hgc-sistema.vercel.app
```

> ⚠️ **Atenção:** Na primeira vez que acessar, o sistema pode demorar até **1 minuto** para responder. Isso acontece porque o servidor gratuito "dorme" quando fica inativo. Aguarde e tente novamente.

---

## 🔑 Contas de Teste

| Perfil | Email | Senha |
|---|---|---|
| Paciente | joao@email.com | 123456 |
| Secretário | secretaria@hgc.com | 123456 |

---

## 📋 Funcionalidades

- ✅ Cadastro e login seguro com **JWT**
- ✅ Agendamento de consultas com verificação de horários disponíveis
- ✅ Consulta automática de endereço pelo **CEP (ViaCEP)**
- ✅ Alerta de chuva com **OpenWeatherMap**
- ✅ Painel administrativo para secretários

---

## 🔗 Links

| Recurso | URL |
|---|---|
| 🌐 Sistema (Frontend) | https://hgc-sistema.vercel.app |
| ⚙️ API (Backend) | https://hgc-sistema.onrender.com/api/health |
| 📁 Repositório | https://github.com/hyagocarvalho-alt/hgc-sistema |

---

## 🛠️ Tecnologias

| Camada | Tecnologia |
|---|---|
| Frontend | Vue.js 3 + Vite + Vue Router |
| Backend | Node.js + Express |
| Banco de dados | SQLite (sqlite3) |
| Autenticação | JWT + bcryptjs |
| API de CEP | ViaCEP |
| API de Clima | OpenWeatherMap |
| Deploy Frontend | Vercel |
| Deploy Backend | Render |

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js v18 ou superior

### 1. Clonar o projeto
```bash
git clone https://github.com/hyagocarvalho-alt/hgc-sistema.git
cd hgc-sistema
```

### 2. Configurar o Backend
```bash
cd backend
npm install
cp .env.example .env
node server.js
```

### 3. Configurar o Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Acessar localmente
- Frontend: http://localhost:8080
- Backend: http://localhost:5000

---

## 📡 Endpoints da API

| Método | Rota | Descrição |
|---|---|---|
| POST | /api/auth/register | Cadastro |
| POST | /api/auth/login | Login |
| GET | /api/agendamentos | Listar consultas |
| POST | /api/agendamentos | Criar consulta |
| PATCH | /api/agendamentos/:id/status | Atualizar status |
| GET | /api/agendamentos/horarios | Horários disponíveis |
| GET | /api/cep/:cep | Buscar endereço |
| GET | /api/clima | Previsão do tempo |

---
