# Sentinel CLI 🛡️

**Framework Enterprise de Segurança Cibernética & Scanner de Vulnerabilidades**

[![Node.js](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/nestjs-%5E11.0-red)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.7-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)](https://www.prisma.io/)
[![Puppeteer](https://img.shields.io/badge/Puppeteer-24.x-00D8FF)](https://pptr.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791)](https://www.postgresql.org/)

O **Sentinel CLI** é uma ferramenta de linha de comando modular e _enterprise-grade_ desenvolvida em **NestJS** e **TypeScript** para auditoria de segurança cibernética. Ele integra operações de **Red Team** (ofensivas) e **Blue Team** (defensivas) em uma única plataforma unificada, permitindo que desenvolvedores, analistas de segurança e equipes de DevSecOps identifiquem vulnerabilidades, auditem configurações e validem a conformidade de aplicações web e infraestrutura de rede — com **rastreabilidade total** via persistência em banco de dados e **relatórios executivos em PDF**.

Diferente de scanners convencionais, o Sentinel utiliza um motor baseado em **Puppeteer** para realizar auditorias dinâmicas em tempo de execução, interagindo com a aplicação como um usuário real. Isso permite a detecção de vulnerabilidades modernas em **SPAs (Single Page Applications)**, análise comportamental de DOM e geração de relatórios baseados em dados históricos persistidos.

---

## ⚠️ Isenção de Responsabilidade

> **Esta ferramenta foi desenvolvida exclusivamente para fins educacionais, pesquisa de segurança e testes de invasão autorizados.**
>
> O uso do Sentinel CLI em sistemas, redes ou aplicações sem permissão explícita por escrito do proprietário é **ilegal** e configura crime nos termos da Lei Carolina Dieckmann (Lei nº 12.737/2012) e da LGPD. O autor não se responsabiliza por qualquer uso indevido, danos diretos ou indiretos resultantes da utilização desta ferramenta. **Use com ética e responsabilidade.**

---

## 📋 Tabela de Conteúdos

- [Sentinel CLI 🛡️](#sentinel-cli-️)
  - [⚠️ Isenção de Responsabilidade](#️-isenção-de-responsabilidade)
  - [📋 Tabela de Conteúdos](#-tabela-de-conteúdos)
  - [🚀 Visão Geral](#-visão-geral)
  - [✨ Funcionalidades](#-funcionalidades)
    - [🔴 Red Team — Operações Ofensivas](#-red-team--operações-ofensivas)
    - [🔵 Blue Team — Operações Defensivas](#-blue-team--operações-defensivas)
    - [📊 Relatórios e Persistência](#-relatórios-e-persistência)
  - [🏗️ Arquitetura Técnica](#️-arquitetura-técnica)
    - [Fluxo de Dados](#fluxo-de-dados)
  - [🛠️ Tecnologias](#️-tecnologias)
  - [📦 Instalação e Configuração](#-instalação-e-configuração)
    - [Pré-requisitos](#pré-requisitos)
    - [Passo a Passo](#passo-a-passo)
      - [1. Clone o repositório](#1-clone-o-repositório)
      - [2. Instale as dependências](#2-instale-as-dependências)
      - [3. Configure as variáveis de ambiente](#3-configure-as-variáveis-de-ambiente)
      - [4. Inicie o banco de dados](#4-inicie-o-banco-de-dados)
      - [5. Execute as migrações do Prisma](#5-execute-as-migrações-do-prisma)
      - [6. Inicie o Sentinel CLI](#6-inicie-o-sentinel-cli)
      - [7. Build para produção](#7-build-para-produção)
  - [🎮 Guia de Uso](#-guia-de-uso)
    - [🔴 Modo Red Team](#-modo-red-team)
    - [🔵 Modo Blue Team](#-modo-blue-team)
    - [Exemplo de Saída — Security Score](#exemplo-de-saída--security-score)
  - [🗄️ Modelo de Dados](#️-modelo-de-dados)
    - [`Scan`](#scan)
    - [`Finding`](#finding)
    - [`NetworkScan` e `NetworkPort`](#networkscan-e-networkport)
  - [🗺️ Roadmap](#️-roadmap)
    - [Em Desenvolvimento](#em-desenvolvimento)
    - [Backlog Futuro](#backlog-futuro)
  - [👨‍💻 Autor e Licença](#-autor-e-licença)

---

## 🚀 Visão Geral

O Sentinel CLI foi projetado para ser um **orquestrador completo de auditoria de segurança**, combinando:

- **Análise Ofensiva (Red Team)**: Varredura de portas TCP, descoberta de endpoints, crawling dinâmico em SPAs, scanner de formulários e motor de vulnerabilidades web com checks automatizados (XSS, SQLi, LFI, SSTI, DOM XSS, Open Redirect, arquivos sensíveis).
- **Análise Defensiva (Blue Team)**: Cálculo de pontuação de segurança (0-100), fingerprint de stack tecnológica, auditoria de autenticação (HTTPS, CSRF, cookies), análise de headers de segurança e correlação com CVEs via NVD API.
- **Persistência e Rastreabilidade**: Todos os scans são persistidos em PostgreSQL via Prisma ORM, garantindo _audit trail_ completo e possibilidade de regeneração de relatórios a partir de dados históricos.
- **Relatórios Executivos**: Geração de PDFs profissionais com sumário executivo, matriz de severidade, estatísticas Red vs Blue, gráficos de impacto e metadados técnicos do scan.

A arquitetura segue princípios de **Clean Architecture**, **Domain-Driven Design (DDD)** e **SOLID**, com separação clara entre camadas de _core_, infraestrutura, domínio de negócio (Red/Blue) e interface CLI.

---

## ✨ Funcionalidades

### 🔴 Red Team — Operações Ofensivas

| Ferramenta | Descrição |
|------------|-----------|
| **🔍 Port Scanner** | Varredura TCP concorrente (limite de 50 conexões simultâneas) com timeout de 300ms, _banner grabbing_ inteligente e inferência de serviços (SSH, HTTP, MySQL, MongoDB, etc.). Barra de progresso visual em tempo real. |
| **🌐 Web Vulnerability Scanner** | Motor modular de vulnerabilidades (`VulnEngine`) que executa checks automatizados: **XSS Refletido**, **SQL Injection**, **DOM XSS**, **LFI (Local File Inclusion)**, **SSTI (Server-Side Template Injection)**, **Open Redirect** e **Sensitive File Exposure**. Utiliza _baseline_ de resposta e mutação de payloads para reduzir falsos positivos. |
| **🕷️ Web Crawler** | Crawler híbrido que extrai links estáticos via análise HTML e ativa navegação dinâmica (`InteractionService`) para SPAs construídas em React, Angular e Vue. Suporta controle de profundidade e descoberta de rotas ocultas por interação. |
| **📁 Endpoint Discovery** | Descoberta de endpoints por _wordlist_ inteligente (`/admin`, `/login`, `/api`, `/dashboard`, `/robots.txt`, `/sitemap.xml`, `/health`, etc.) com _probe_ HTTP e análise de _status code_. |
| **📝 Form Scanner** | Extração e análise de formulários HTML, identificando campos de entrada, _actions_ relativas e entregando contexto para execução de payloads de vulnerabilidade. |

### 🔵 Blue Team — Operações Defensivas

| Ferramenta | Descrição |
|------------|-----------|
| **📊 Security Score Engine** | Algoritmo avançado que calcula a postura de segurança de 0 a 100 com penalidades ponderadas por severidade (LOW, MEDIUM, HIGH, CRITICAL) e categoria (webscan, portscan, auth, config, exposure, network). Produz _breakdown_ por headers, autenticação, CVEs e findings. |
| **🕵️ Fingerprint Audit** | Identificação da _stack_ tecnológica por análise de headers HTTP e assinaturas HTML (WordPress, React, Angular, Vue, Laravel, Nginx, Apache, Cloudflare). Alerta para tecnologias com histórico de vulnerabilidades e headers de segurança ausentes. |
| **🔑 Authentication Auditor** | Verificação completa de controles de autenticação: presença de HTTPS, tokens anti-CSRF em formulários, flags de segurança em cookies (HttpOnly, Secure, SameSite) e teste de login automatizado via Puppeteer. |
| **🛡️ Web Analyzer** | Análise de headers críticos de segurança: **HSTS**, **CSP (Content Security Policy)**, **X-Frame-Options**, **X-Content-Type-Options** e **Referrer-Policy**. Avalia não apenas a presença, mas também a qualidade da configuração (ex: `max-age` no HSTS, `default-src` no CSP). |
| **🐛 CVE Lookup** | Integração com a **NVD API (National Vulnerability Database)** do NIST para busca de CVEs por tecnologia detectada. Retorna CVEs ordenadas por _baseScore_, com normalização de severidade e agregação por _stack_ tecnológica. |

### 📊 Relatórios e Persistência

- **Persistência Atômica**: Cada scan e seus _findings_ são salvos em transações atômicas no PostgreSQL, garantindo integridade dos dados.
- **Single Source of Truth**: Relatórios PDF são gerados a partir dos dados persistidos no banco, não da memória volátil.
- **Audit Trail**: Todos os scans — mesmo os sem vulnerabilidades — são registrados para rastreabilidade histórica e _compliance_.
- **PDF Profissional**: Relatórios executivos com sumário, score colorido (verde/âmbar/vermelho), matriz de severidade com gráficos de barras, distribuição Red vs Blue, impacto acumulado e metadados técnicos (endpoints, portas, headers, duração).

---

## 🏗️ Arquitetura Técnica

O projeto segue os princípios de **Clean Architecture**, **Domain-Driven Design (DDD)** e **SOLID**, com separação clara de responsabilidades:

```text
src/
├── main.ts                    # Bootstrap silencioso do NestJS (ApplicationContext)
├── app.module.ts              # Orquestração global de módulos
│
├── cli/                       # Interface de Comando (Presentation Layer)
│   ├── cli.module.ts
│   └── cli.service.ts         # Menu interativo (Inquirer), orquestração de scans,
│                              # formatação de tabelas, persistência e geração de PDF
│
├── core/                      # Motores Reutilizáveis (Core Layer)
│   ├── browser/
│   │   ├── browser.service.ts     # Lifecycle do Puppeteer (browser/page/stealth)
│   │   ├── dom-xss.service.ts     # Detecção de sinks XSS no DOM
│   │   └── interaction.service.ts # Navegação dinâmica para SPAs
│   ├── formatter/
│   │   └── formatter.service.ts   # Formatação de tabelas e texto para terminal
│   └── http/
│       ├── http.service.ts        # Cliente HTTP com retries, User-Agent rotativo,
│       │                          # tratamento de 429 e políticas de backoff
│       └── user-agents.data.ts    # Lista de User-Agents para rotação
│
├── infrastructure/            # Infraestrutura e Cross-Cutting Concerns
│   ├── database/
│   │   ├── service/prisma.service.ts      # Conexão e lifecycle do Prisma Client
│   │   └── repository/scan.repository.ts  # Repositório de scans e findings
│   ├── logger/
│   │   └── logger.service.ts              # Logger com spinner visual para CLI
│   └── report/
│       ├── report.service.ts              # Geração de PDF via Puppeteer
│       ├── report.types.ts                # Tipagens de findings e metadados
│       └── report-html.template.ts        # Template HTML/CSS do relatório
│
├── modules/                   # Domínios de Negócio (Domain Layer)
│   ├── blue/                  # 🔵 Blue Team — Operações Defensivas
│   │   ├── score/
│   │   │   ├── security-score.service.ts  # Motor de pontuação 0-100
│   │   │   ├── score.constants.ts         # Pesos e configurações de score
│   │   │   └── score.module.ts
│   │   └── web/
│   │       ├── auth/
│   │       │   ├── auth.service.ts        # Auditoria de HTTPS, CSRF e cookies
│   │       │   ├── auth.types.ts
│   │       │   └── auth.module.ts
│   │       ├── fingerprint/
│   │       │   ├── fingerprint.service.ts # Identificação de stack tecnológica
│   │       │   └── fingerprint.module.ts
│   │       └── webanalyzer/
│   │           ├── web-analyzer.service.ts # Análise de headers de segurança
│   │           └── web-analyzer.module.ts
│   │
│   └── red/                   # 🔴 Red Team — Operações Ofensivas
│       ├── network/
│       │   └── portscan/
│       │       ├── portscan.service.ts    # Varredura TCP concorrente
│       │       └── portscan.module.ts
│       └── web/
│           ├── crawler/
│           │   ├── crawler.service.ts     # Crawler estático + dinâmico
│           │   └── interaction/
│           │       ├── interaction.engine.ts # Motor de interação para SPAs
│           │       └── interaction.module.ts
│           ├── endpoint/
│           │   ├── endpoint.service.ts    # Discovery por wordlist
│           │   └── endpoint.module.ts
│           ├── formscanner/
│           │   ├── form-scanner.service.ts # Extração de formulários
│           │   └── form-scanner.module.ts
│           ├── vuln/
│           │   ├── vuln.engine.ts         # Orquestrador de checks de vuln
│           │   ├── vuln-check.interface.ts # Contrato dos checks
│           │   ├── vuln.types.ts
│           │   ├── checks/                # Implementações de checks
│           │   │   ├── xss.check.ts
│           │   │   ├── sqli.check.ts
│           │   │   ├── domxss.check.ts
│           │   │   ├── lfi.check.ts
│           │   │   ├── ssti.check.ts
│           │   │   ├── redirect.check.ts
│           │   │   ├── sensitive-file.check.ts
│           │   │   └── passive.check.ts
│           │   └── payload/
│           │       └── payload.mutator.ts # Mutador de payloads
│           └── webscan/
│               ├── webscan.service.ts     # Orquestrador de scan web
│               ├── webscan.types.ts
│               └── webscan.module.ts
│
├── shared/                    # Capacidades Transversais
│   ├── cve/
│   │   ├── cve.service.ts     # Integração NVD API
│   │   └── cve.module.ts
│   └── utils/
│       ├── concurrency.util.ts
│       └── report.util.ts
│
prisma/
├── schema.prisma              # Schema do Prisma (Scan, Finding, NetworkScan, NetworkPort)
└── migrations/                # Migrações versionadas do PostgreSQL
```

### Fluxo de Dados

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│   Usuário   │────▶│  CLI Menu   │────▶│  Serviço de     │
│  (Terminal) │     │ (Inquirer)  │     │  Scan (Red/Blue)│
└─────────────┘     └─────────────┘     └─────────────────┘
                                                │
                        ┌───────────────────────┼───────────────────────┐
                        ▼                       ▼                       ▼
                ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
                │  Motor Web    │      │  Motor Rede   │      │  Motor Blue   │
                │ (Puppeteer)   │      │ (TCP/Net)     │      │ (Score/Auth)  │
                └───────────────┘      └───────────────┘      └───────────────┘
                        │                       │                       │
                        └───────────────────────┼───────────────────────┘
                                                ▼
                                       ┌─────────────────┐
                                       │  ScanRepository │
                                       │  (Prisma ORM)   │
                                       └─────────────────┘
                                                │
                        ┌───────────────────────┴───────────────────────┐
                        ▼                                               ▼
               ┌─────────────────┐                            ┌─────────────────┐
               │  PostgreSQL     │                            │  ReportService  │
               │  (Persistência) │                            │  (PDF Engine)   │
               └─────────────────┘                            └─────────────────┘
                                                                       │
                                                                       ▼
                                                              ┌─────────────────┐
                                                              │  Relatório PDF  │
                                                              │  (./reports/)   │
                                                              └─────────────────┘
```

---

## 🛠️ Tecnologias

| Categoria | Tecnologia | Versão | Descrição |
|-----------|-----------|--------|-----------|
| **Runtime** | Node.js | >= 18.x | Ambiente de execução JavaScript |
| **Framework** | NestJS | ^11.0 | Framework Node.js modular e escalável |
| **Linguagem** | TypeScript | ^5.7 | Superset tipado de JavaScript |
| **Browser Engine** | Puppeteer | ^24.42 | Automação de Chrome/Chromium para scans dinâmicos |
| **ORM** | Prisma | ^6.19 | ORM moderno para PostgreSQL |
| **Database** | PostgreSQL | 15 | Banco relacional para persistência de scans |
| **HTTP Client** | Axios | ^1.15 | Cliente HTTP com retry e rotação de User-Agent |
| **CLI UX** | Inquirer | ^13.4 | Menus interativos no terminal |
| **CLI Styling** | Chalk | ^5.6 | Cores e estilos no terminal |
| **CLI Progress** | cli-progress | ^3.12 | Barras de progresso visuais |
| **CLI Tables** | cli-table3 | ^0.6.5 | Tabelas formatadas no terminal |
| **Container** | Docker | — | Orquestração do PostgreSQL |

---

## 📦 Instalação e Configuração

### Pré-requisitos

- **Node.js** v18 ou superior
- **npm** ou **yarn**
- **Docker** e **Docker Compose** (para o banco de dados PostgreSQL)
- **Google Chrome** ou **Chromium** (dependência do Puppeteer)

### Passo a Passo

#### 1. Clone o repositório

```bash
git clone https://github.com/seu-usuario/sentinel-cli.git
cd sentinel-cli
```

#### 2. Instale as dependências

```bash
npm install
```

#### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Banco de dados
DB_USER=sentinel
DB_PASSWORD=sentinel_secret
DB_NAME=sentinel_db
DB_PORT=5432
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}?schema=public"
```

#### 4. Inicie o banco de dados

```bash
docker-compose up -d
```

#### 5. Execute as migrações do Prisma

```bash
npx prisma migrate dev
```

#### 6. Inicie o Sentinel CLI

```bash
npm run start
```

Ou em modo de desenvolvimento com _hot reload_:

```bash
npm run start:dev
```

#### 7. Build para produção

```bash
npm run build
npm run start:prod
```

---

## 🎮 Guia de Uso

O Sentinel opera através de um **menu interativo** no terminal. Ao iniciar, você verá o banner ASCII e o menu principal:

```
███████╗███████╗███╗   ██╗████████╗██╗███╗   ██╗███████╗██╗
██╔════╝██╔════╝████╗  ██║╚══██╔══╝██║████╗  ██║██╔════╝██║
███████╗█████╗  ██╔██╗ ██║   ██║   ██║██╔██╗ ██║█████╗  ██║
╚════██║██╔══╝  ██║╚██╗██║   ██║   ██║██║╚██╗██║██╔══╝  ██║
███████║███████╗██║ ╚████║   ██║   ██║██║ ╚████║███████╗███████╗
╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝

? Selecione o modo de operação: (Use arrow keys)
❯ 🔴 Red Team
  🔵 Blue Team
  🚪 Sair
```

### 🔴 Modo Red Team

Opções disponíveis:

- **🔍 Port Scanner**: Informe o host (ex: `127.0.0.1`) e o range de portas (ex: `1-1000`). O scanner executa varredura TCP concorrente com barra de progresso e exibe portas abertas, serviços e banners capturados.

- **🌐 Web Scanner**: Informe a URL alvo (ex: `https://exemplo.com`). O Sentinel executa crawling, descoberta de endpoints, análise de formulários e verificação de vulnerabilidades (XSS, SQLi, DOM XSS, etc.). Os achados são exibidos em tabela e persistidos automaticamente.

### 🔵 Modo Blue Team

Opções disponíveis:

- **🕵️ Fingerprint**: Informe a URL para identificação da stack tecnológica, headers expostos e tecnologias com histórico de vulnerabilidades.

- **🔑 Auth Audit**: Informe a URL para auditoria de controles de autenticação (HTTPS, CSRF, cookies HttpOnly/Secure).

- **📊 Security Score**: Informe a URL para cálculo completo da postura de segurança (0-100). O motor integra fingerprint, auth audit, web analyzer e CVE lookup. Ao final, confirme a geração do PDF para receber um relatório executivo na pasta `./reports/`.

### Exemplo de Saída — Security Score

```
SCORE: 72/100

┌────────┬────────────┬──────────────────────────┬────────────────────────────────────────┐
│ SEV.   │ ORIGEM     │ ASPECTO                  │ STATUS                                 │
├────────┼────────────┼──────────────────────────┼────────────────────────────────────────┤
│ OK     │ BLUE · WEB │ Strict-Transport-Security│ ✔ Configurado: max-age=31536000...     │
│ OK     │ BLUE · WEB │ Content-Security-Policy  │ ✔ Configurado: default-src 'self'...   │
│ HIGH   │ BLUE · WEB │ X-Frame-Options          │ ✘ Proteção contra Clickjacking ausente.│
│ MEDIUM │ BLUE · WEB │ CVE — Nginx              │ ✘ CVE-2021-23017, CVE-2022-41741...   │
└────────┴────────────┴──────────────────────────┴────────────────────────────────────────┘

? Gerar PDF? (Y/n)
```

---

## 🗄️ Modelo de Dados

O schema Prisma define as seguintes entidades para rastreabilidade e persistência:

### `Scan`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `String (UUID)` | Identificador único do scan |
| `target` | `String` | Alvo do scan (URL ou IP) |
| `score` | `Int` | Pontuação de segurança (0-100) |
| `mode` | `String` | Modo de operação (`WEB_SCAN`, `PORT_SCAN`, `FINGERPRINT`, `AUTH_AUDIT`, `FULL_SCORE`) |
| `createdAt` | `DateTime` | Timestamp de criação |
| `duration` | `String?` | Duração do scan |
| `portsScanned` | `Int?` | Quantidade de portas varridas |
| `endpointsAnalyzed` | `Int?` | Endpoints analisados |
| `endpointsDiscovered` | `Int?` | Endpoints descobertos |
| `headersAnalyzed` | `Int?` | Headers analisados |
| `endpointDetails` | `Json?` | Detalhes dos endpoints (JSON) |
| `findings` | `Finding[]` | Relação 1:N com achados |

### `Finding`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | `String (UUID)` | Identificador único |
| `scanId` | `String` | FK para Scan |
| `type` | `String` | Tipo do achado (ex: "Porta Aberta", "DOM XSS") |
| `evidence` | `String (Text)` | Evidência técnica |
| `severity` | `String` | Severidade (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`) |
| `team` | `String` | Time (`RED` ou `BLUE`) |

### `NetworkScan` e `NetworkPort`

Modelos adicionais para varreduras de rede, armazenando ranges de portas e banners capturados por porta aberta.

---

## 🗺️ Roadmap

### Em Desenvolvimento

- [ ] Padronização completa de DTOs e remoção de `any` nos contratos de scan
- [ ] Contexto de execução encapsulado para evitar efeitos colaterais entre scans
- [ ] Melhoria na profundidade do crawler e extração de conteúdo dinâmico
- [ ] Cache local eBackoff para consultas NVD (CVE)
- [ ] Sub-scores especializados: headers, auth, tech stack e CVE
- [ ] Testes de unidade e integração para motores principais

### Backlog Futuro

- [ ] Suporte a autenticação básica/digest e sessões em scans
- [ ] Scanner de APIs REST/GraphQL
- [ ] Módulo de Compliance (OWASP Top 10, PCI-DSS)
- [ ] Exportação de relatórios em JSON/XML
- [ ] Dashboard web para visualização histórica de scans
- [ ] Integração com ferramentas CI/CD (GitHub Actions, GitLab CI)

---

## 👨‍💻 Autor e Licença

**Hugo Zeymer Auad**  
Software Engineer & Cybersecurity Specialist

Este projeto é distribuído sob licença **UNLICENSED**. Uso permitido exclusivamente para fins educacionais e testes de segurança autorizados.

> ⚠️ **Lembre-se:** Com grandes poderes vêm grandes responsabilidades. Use o Sentinel CLI para fortalecer a segurança, nunca para causar danos.

---

<p align="center">
  <sub>🛡️ Sentinel CLI — Protegendo aplicações, um scan de cada vez.</sub>
</p>

