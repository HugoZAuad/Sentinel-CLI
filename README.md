# Sentinel CLI 🛡️

 **Enterprise Security Framework & Vulnerability Scanner**

[![Node.js](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/nestjs-%5E11.0-red)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.7-blue)](https://www.typescriptlang.org/)

O **Sentinel** é uma ferramenta de linha de comando (CLI) modular desenvolvida em **NestJS** para auditoria de segurança cibernética. Ele combina operações de **Red Team** (Ofensivo) e **Blue Team** (Defensivo), permitindo que desenvolvedores e analistas de segurança identifiquem vulnerabilidades e validem a conformidade de seus ativos digitais em tempo real.

---

## 📄 Isenção de Responsabilidade

Esta ferramenta foi criada apenas para fins educacionais e testes de segurança autorizados. **O uso do Sentinel em alvos sem permissão explícita é ilegal e de total responsabilidade do usuário.**

---

## 📋 Tabela de Conteúdos

- [Sentinel CLI 🛡️](#sentinel-cli-️)
  - [📄 Isenção de Responsabilidade](#-isenção-de-responsabilidade)
  - [📋 Tabela de Conteúdos](#-tabela-de-conteúdos)
  - [🚀 Visão Geral](#-visão-geral)
  - [✨ Funcionalidades Principais](#-funcionalidades-principais)
    - [🔴 Red Team (Módulo Ofensivo)](#-red-team-módulo-ofensivo)
    - [🔵 Blue Team (Módulo Defensivo)](#-blue-team-módulo-defensivo)
  - [🛠️ Arquitetura Técnica](#️-arquitetura-técnica)
  - [📦 Instalação e Uso](#-instalação-e-uso)
    - [Pré-requisitos](#pré-requisitos)
    - [Passo a Passo](#passo-a-passo)
  - [📖 Como Usar](#-como-usar)
  - [👨‍💻 Autor](#-autor)

---

## 🚀 Visão Geral

Diferente de scanners convencionais, o Sentinel utiliza um motor baseado em **Puppeteer** para realizar auditorias dinâmicas. Ele não apenas lê o código estático, mas interage com a aplicação como um usuário real, permitindo a detecção de vulnerabilidades modernas em SPAs (React, Vue, Angular) e a geração de relatórios executivos em PDF.

---

## ✨ Funcionalidades Principais

### 🔴 Red Team (Módulo Ofensivo)

- **Web Vulnerability Scanner**: Detecção de falhas como DOM XSS e riscos de injeção por meio de análise comportamental do DOM.
- **Network Port Scanner**: Mapeamento de portas abertas com captura de banners de serviço para identificação de tecnologias expostas.

### 🔵 Blue Team (Módulo Defensivo)

- **Security Score Engine**: Algoritmo que calcula a postura de segurança do alvo (0-100) com base em múltiplos fatores de risco.
- **Fingerprint & Tech Stack Audit**: Identificação de servidores, linguagens e frameworks, com alertas para versões obsoletas.
- **Authentication Auditor**: Verificação de cookies (HttpOnly, Secure), transporte (HTTPS) e proteções contra CSRF.
- **Enterprise PDF Reporting**: Geração de relatórios profissionais com design moderno, prontos para apresentação executiva.

---

## 🛠️ Arquitetura Técnica

O projeto foi construído sob princípios de **Clean Architecture** e **SOLID**:

- **Core**: Motores de infraestrutura como `BrowserService` (Puppeteer) e `FormatterService`.
- **Modules**: Separação clara entre domínios `Red` e `Blue`.
- **Infrastructure**: Serviços transversais como loggers e geradores de relatórios.

Estrutura do projeto:

```text
src/
├── cli/                     # Orquestração da interface de linha de comando
├── core/                  # Serviços base e motores (Browser, Formatter, Http)
├── infrastructure/   # Implementações técnicas (Logger, Report PDF)
├── modules/           # Regras de negócio divididas por domínio
│   ├── red/             # Ferramentas ofensivas (Portscan, Webscan)
│   └── blue/           # Ferramentas defensivas (Score, Auth, Fingerprint)
└── main.ts             # Ponto de entrada da aplicação
```

---

## 📦 Instalação e Uso

### Pré-requisitos

- Node.js (v18+)
- npm ou yarn
- Chromium (instalado automaticamente pelo Puppeteer)

### Passo a Passo

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/sentinel-cli.git
cd sentinel-cli
```

2. Instale as dependências:

```bash
npm install
```

3. Compile e inicie o Sentinel:

```bash
npm run start
```

---

## 📖 Como Usar

Ao iniciar, o Sentinel apresenta um menu interativo e intuitivo:

- **Modo Red Team**: escolha entre scan de rede ou web, informe a URL/IP alvo e acompanhe os logs em tempo real.
- **Modo Blue Team**: selecione "Security Score" para executar a auditoria completa. Ao final, o sistema oferecerá a exportação dos resultados em PDF.
- **Relatórios**: todos os arquivos gerados são salvos automaticamente na pasta raiz `./reports`.

Exemplos de comando:

```bash
npm run start -- webscan https://example.com
npm run start -- portscan 127.0.0.1 1 1024
```

---

## 👨‍💻 Autor

**Hugo Zeymer Auad**  
Software Engineer & Cybersec Enthusiast
