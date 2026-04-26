# Sentinel CLI 🛡️

 **Enterprise Security Framework & Vulnerability Scanner**

[![Node.js](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/nestjs-%5E11.0-red)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.7-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)](https://www.prisma.io/)

O **Sentinel** é uma ferramenta de linha de comando (CLI) modular desenvolvida em **NestJS** para auditoria de segurança cibernética. Ele combina operações de **Red Team** (Ofensivo) e **Blue Team** (Defensivo), permitindo que desenvolvedores e analistas identifiquem vulnerabilidades e validem a conformidade com rastreabilidade total em banco de dados.

---

## 📄 Isenção de Responsabilidade

Esta ferramenta foi criada apenas para fins educacionais e testes de segurança autorizados. **O uso do Sentinel em alvos sem permissão explícita é ilegal e de total responsabilidade do usuário.**

---

## 📋 Tabela de Conteúdos

- [🚀 Visão Geral](#-visão-geral)
- [✨ Funcionalidades Principais](#-funcionalidades-principais)
- [🛠️ Arquitetura Técnica](#️-arquitetura-técnica)
- [🗄️ Persistência e Rastreabilidade](#️-persistência-e-rastreabilidade)
- [📦 Instalação e Uso](#-instalação-e-uso)
- [📖 Como Usar](#-como-usar)
- [👨‍💻 Autor](#-autor)

---

## 🚀 Visão Geral

Diferente de scanners convencionais, o Sentinel utiliza um motor baseado em **Puppeteer** para realizar auditorias dinâmicas em tempo de execução. Ele interage com a aplicação como um usuário real, permitindo a detecção de vulnerabilidades modernas em SPAs e gerando relatórios executivos baseados em dados históricos persistidos.

---

## ✨ Funcionalidades Principais

### 🔴 Red Team (Módulo Ofensivo)
- **Web Vulnerability Scanner**: Detecção de falhas como DOM XSS e injeções via análise comportamental.
- **Network Port Scanner**: Mapeamento de portas e captura de banners para identificação de serviços.

### 🔵 Blue Team (Módulo Defensivo)
- **Security Score Engine**: Algoritmo avançado que calcula a postura de segurança (0-100).
- **Fingerprint Audit**: Identificação de tech stack e alertas para tecnologias expostas.
- **Authentication Auditor**: Verificação de cookies (HttpOnly/Secure), HTTPS e CSRF.
- **Professional PDF Reporting**: Relatórios técnicos completos com sumário executivo e matriz de severidade.

---

## 🛠️ Arquitetura Técnica

O projeto segue os princípios de **Clean Architecture** e **SOLID**:

```text
src/
├── cli/              # Interface de comando interativa (Inquirer)
├── core/             # Motores base (Browser, Formatter, Http)
├── infrastructure/   # Persistência (Prisma) e Loggers
├── modules/          # Domínios de negócio
│   ├── red/          # Offensive Tools (Portscan, Webscan)
│   ├── blue/         # Defensive Tools (Score, Auth, Fingerprint)
│   └── shared/       # Report Generator (PDF Engine)
└── main.ts           # Inicialização silenciosa do NestJS
```

## 🗄️ Persistência e Rastreabilidade

O Sentinel utiliza Prisma ORM e PostgreSQL para garantir que cada teste seja registrado.

- **Single Source of Truth**: Relatórios em PDF são gerados a partir dos dados persistidos no banco, não da memória volátil.

- **Audit Trail**: Todos os scans (mesmo os sem vulnerabilidades) são salvos para rastreabilidade histórica.

- **Atomic Transactions**: Criação de Scans e Findings em operações atômicas para integridade dos dados.

---

## 📦 Instalação e Uso

### Pré-requisitos

- Node.js v18+

- Docker e Docker Compose (para o banco de dados)

- Google Chrome/Chromium

### Passo a Passo

#### Clone e Instale:

```bash
git clone [https://github.com/seu-usuario/sentinel-cli.git](https://github.com/seu-usuario/sentinel-cli.git)
cd sentinel-cli
npm install
```

#### Configure o Ambiente:

Crie um arquivo .env na raiz:

```env
DATABASE_URL="postgresql://johndoe:randompassword@localhost:5432/sentinel_db?schema=public"
```

#### Suba o Banco de Dados:

```bash
docker-compose up -d
npx prisma migrate dev
```

#### Inicie o Sentinel:

```bash
npm run start
```

---

## 📖 Como Usar

O Sentinel opera através de um menu interativo:

- Selecione o Time: Red Team ou Blue Team.

- Escolha a Ferramenta: Cada ferramenta solicita os inputs necessários (URL/IP).

- Persistência: O resultado é automaticamente salvo no PostgreSQL.

- Relatório: No modo Security Score, confirme a geração do PDF para receber um report profissional na pasta ./reports.

---

## 👨‍💻 Autor

Hugo Zeymer Auad Software Engineer & Cybersecurity Specialist