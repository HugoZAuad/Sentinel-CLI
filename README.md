# Sentinel CLI 🛡️

[![Node.js](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen)](https://nodejs.org/)
[![NestJS](https://img.shields.io/badge/nestjs-%5E11.0-red)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/typescript-%5E5.7-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-UNLICENSED-blue.svg)](#)

Uma plataforma modular de segurança em linha de comando que unifica reconhecimento ofensivo (Red Team) e auditoria defensiva (Blue Team) em uma única ferramenta orientada a relatórios.

---

## 📋 Tabela de Conteúdos

- [Visão Geral](#-visão-geral)
- [Recursos](#-recursos)
- [Requisitos](#-requisitos)
- [Instalação](#-instalação)
- [Uso](#-uso)
- [Arquitetura](#-arquitetura)
- [Módulos](#-módulos)
- [Exemplos de Comando](#-exemplos-de-comando)
- [Configuração](#-configuração)
- [Desenvolvimento](#-desenvolvimento)
- [Contribuição](#-contribuição)
- [Licença](#-licença)

---

## 🚀 Visão Geral

**Sentinel CLI** é uma plataforma de segurança profissional para profissionais de segurança ofensiva e defensiva. Oferece uma interface unificada para:

- **🔴 Red Team**: Testes de penetração, reconhecimento e descoberta de vulnerabilidades
- **🔵 Blue Team**: Auditoria de segurança, avaliação de defesas e scoring de segurança

A ferramenta combina múltiplos vetores de ataque (web, network) com análise defensiva, permitindo simulações realistas de cenários de segurança.

---

## ✨ Recursos

### Red Team (Ofensivo)

- **Web Scanner Completo**
  - Rastreamento (crawling) de aplicações web
  - Descoberta de endpoints e rotas
  - Análise de headers de segurança
  - Fingerprinting de tecnologias (tech stack detection)

- **Engine de Vulnerabilidades**
  - XSS (Cross-Site Scripting) - reflexivo e DOM-based
  - SQL Injection (SQLi)
  - Server-Side Template Injection (SSTI)
  - Local File Inclusion (LFI)
  - Open Redirects
  - Descoberta de arquivos sensíveis (.env, .git, configs)
  - Análise estática de código malicioso

- **Network Scanning**
  - Port scanning com detecção de serviços
  - Banner grabbing
  - Suporte a ranges de portas customizados
  - Progresso em tempo real

- **Form Scanner**
  - Extração automática de formulários
  - Validação de campos de entrada
  - Teste automático de payloads contra formulários

- **Interaction Engine**
  - Execução com Puppeteer para JavaScript
  - Interação com aplicações dinâmicas
  - Análise de conteúdo renderizado

### Blue Team (Defensivo)

- **Security Score**
  - Cálculo de pontuação de segurança
  - Avaliação de vulnerabilidades encontradas
  - Recomendações de correção

- **Fingerprinting**
  - Detecção automática de frameworks web
  - Identificação de versões de tecnologias
  - Análise de headers HTTP

- **Authentication Testing**
  - Validação de mecanismos de autenticação
  - Testes de configuração de segurança

### Recursos Gerais

- ✅ Interface interativa com menu visual
- ✅ Modo linha de comando para automação
- ✅ Geração de relatórios em JSON
- ✅ Logging estruturado e formatação de output
- ✅ Barra de progresso em tempo real
- ✅ Arquitetura modular e extensível
- ✅ Tratamento robusto de erros
- ✅ Suporte a múltiplas concorrências

---

## 📋 Requisitos

- **Node.js**: >= 18.x
- **npm**: >= 9.x (ou yarn)
- **Sistema Operacional**: Windows, macOS, Linux

---

## 📦 Instalação

### Instalação Local (Desenvolvimento)

```bash
# Clone o repositório
git clone https://github.com/HugoZAuad/sentinel-cli.git
cd sentinel-cli

# Instale as dependências
npm install

# Execute em modo desenvolvimento (watch)
npm run start:dev
```

### Build para Produção

```bash
# Compile o projeto
npm run build

# Execute a versão compilada
npm run start:prod
```

### Instalação Global (via npm)

```bash
npm install -g sentinel-cli
sentinel-cli
```

---

## ⚙️ Uso

### Modo Interativo

Para iniciar a ferramenta em modo interativo:

```bash
npm run start
```

O menu interativo oferecerá as seguintes opções:

```
Selecione o modo de operação:
  🔴 Red Team (Ofensivo)
     └─ Web Scanning
     └─ Network Scanning (Port Scan)
     └─ Advanced Exploitation
  
  🔵 Blue Team (Defensivo)
     └─ Security Audit
     └─ Vulnerability Assessment
     └─ Security Scoring
  
  🚪 Sair
```

### Modo Linha de Comando

Para usuários avançados, use o modo comando:

#### Port Scanning

```bash
npm run start -- portscan 192.168.1.100 1 1024
```

Parâmetros:
- `host`: IP ou domínio alvo
- `startPort`: porta inicial (padrão: 1)
- `endPort`: porta final (padrão: 1024)

**Exemplo prático:**
```bash
npm run start -- portscan example.com 1 65535
npm run start -- portscan 192.168.0.1 1 1024
```

#### Web Scanning

```bash
npm run start -- webscan https://example.com
```

O scan irá:
1. Fazer requisição à URL alvo
2. Rastrear a aplicação web (crawling)
3. Descobrir endpoints
4. Extrair e analisar formulários
5. Executar suite completa de testes de vulnerabilidade
6. Gerar relatório com findings

**Exemplo prático:**
```bash
npm run start -- webscan https://target-app.com
npm run start -- webscan http://localhost:3000
```

---

## 🧩 Arquitetura

Sentinel CLI é construído com uma arquitetura modular baseada em **NestJS**, seguindo os padrões de injeção de dependência e serviços.

### Estrutura de Pasta

```
src/
├── cli/                          # Interface CLI e menu interativo
│   ├── cli.service.ts           # Lógica principal da CLI
│   └── cli.module.ts            # Módulo CLI
│
├── core/                         # Funcionalidades core/primitivas
│   ├── browser/                 # Serviços de browser (Puppeteer)
│   ├── formatter/               # Formatação de output
│   └── http/                    # Cliente HTTP customizado
│
├── infrastructure/              # Infraestrutura e utilidades
│   ├── logger/                  # Sistema de logging
│   └── report/                  # Geração de relatórios
│
├── modules/
│   ├── red/                     # 🔴 Red Team
│   │   ├── network/
│   │   │   └── portscan/       # Port scanning
│   │   └── web/
│   │       ├── crawler/         # Web crawler
│   │       ├── endpoint/        # Endpoint discovery
│   │       ├── formscanner/     # Form scanning e testing
│   │       ├── vuln/            # Vulnerability checks
│   │       │   ├── checks/      # Individual vulnerability checks
│   │       │   └── payload/     # Payload generation e mutation
│   │       └── webscan/         # Web scanner unificado
│   │
│   └── blue/                    # 🔵 Blue Team
│       ├── score/               # Security scoring
│       └── web/
│           ├── auth/            # Authentication testing
│           └── fingerprint/     # Technology fingerprinting
│
└── shared/                       # Utilitários compartilhados
    └── utils/
```

### Fluxo de Execução

```
┌─────────────────────────────────────┐
│      CLI Service (Menu/Commands)    │
└──────────────┬──────────────────────┘
               │
        ┌──────┴──────┐
        │             │
   ┌────▼──────┐  ┌──▼────────────┐
   │  Red Team │  │  Blue Team    │
   └────┬──────┘  └──┬────────────┘
        │           │
   ┌────▼──────┐   │
   │ Webscan   │   │
   │ Portscan  │   │
   └────┬──────┘   │
        │          │
   ┌────▼──────────▼────┐
   │  HTTP & Browser    │
   │  Services          │
   └────────────────────┘
        │
   ┌────▼──────────────┐
   │  Report Service   │
   └───────────────────┘
```

---

## 📚 Módulos em Detalhes

### 🔴 RED TEAM - Módulos Ofensivos

#### **Web Scanning** (`modules/red/web/webscan`)

Análise completa de aplicações web incluindo:
- Requisição inicial e análise de headers
- Rastreamento automático (crawling) com suporte a JavaScript
- Detecção de frameworks e tecnologias
- Teste de vulnerabilidades em todas as URLs descobertas
- Geração de score de segurança
- Exportação de relatórios

**Uso:**
```bash
npm run start -- webscan https://target.com
```

**Saída:**
- URLs descobertas
- Endpoints encontrados
- Formulários e campos
- Vulnerabilidades com severity (LOW/MEDIUM/HIGH/CRITICAL)
- Score de segurança
- Tempo de execução

#### **Network Scanning** (`modules/red/network/portscan`)

Análise de portas abertas e serviços:
- Scan de range de portas customizável
- Detecção automática de serviços comuns
- Banner grabbing (informações de banner de serviço)
- Progresso em tempo real com barras
- Concorrência configurável (100 portas simultâneas)

**Uso:**
```bash
npm run start -- portscan 192.168.1.1 1 65535
```

**Recursos detectados:**
- FTP, SSH, HTTP, HTTPS, MySQL, PostgreSQL, Redis, MongoDB, etc.

#### **Crawler** (`modules/red/web/crawler`)

Rastreamento avançado de aplicações web:
- Extração de links estáticos (parsing HTML)
- Detecção de JavaScript necessário
- Execução com Puppeteer para renderização dinâmica
- Fingerprinting de tecnologias durante crawl
- Deduplicação automática de URLs

#### **Endpoint Discovery** (`modules/red/web/endpoint`)

Descoberta de endpoints ocultos:
- Wordlist de paths comuns (admin, login, api, etc.)
- Validação de status HTTP
- Descoberta rápida de rotas administrativas

#### **Form Scanner** (`modules/red/web/formscanner`)

Análise e teste de formulários:
- Extração automática de formulários HTML
- Identificação de campos de entrada
- Teste automático de vulnerabilidades por formulário
- Mapping de métodos HTTP (GET/POST)

#### **Vulnerability Engine** (`modules/red/web/vuln`)

Motor de detecção de vulnerabilidades com múltiplos checks:

**Checks Implementados:**

1. **XSS (Cross-Site Scripting)**
   - Reflexivo
   - Teste com payloads customizados
   - Análise de saída renderizada

2. **SQL Injection (SQLi)**
   - Detecção por time-based
   - Análise de erro-based
   - Mutation de payloads

3. **Server-Side Template Injection (SSTI)**
   - Detecção de engines de template comuns
   - Payloads para Jinja2, ERB, etc.

4. **Local File Inclusion (LFI)**
   - Path traversal detection
   - Wrappers de stream
   - Payloads com encoded characters

5. **Open Redirects**
   - Detecção de redirecionamentos não validados
   - Validação de headers Location

6. **DOM XSS Analysis**
   - Análise estática de código
   - Detecção de sinks perigosos (eval, innerHTML, etc.)

7. **Sensitive File Discovery**
   - Detecção de arquivos comuns (.env, .git/config, docker-compose.yml, etc.)
   - Exposição de dados sensíveis

8. **Passive Checks**
   - Análise de headers HTTP
   - Verificação de segurança headers (HSTS, X-XSS-Protection, etc.)

### 🔵 BLUE TEAM - Módulos Defensivos

#### **Security Scoring** (`modules/blue/score`)

Cálculo de pontuação de segurança:
- Ponderação de vulnerabilidades por severity
- Score de 0-100
- Recomendações baseadas em findings
- Comparação com benchmarks

#### **Fingerprinting** (`modules/blue/web/fingerprint`)

Detecção de tecnologias:
- Análise de headers HTTP
- Pattern matching em conteúdo HTML
- Identificação de versões
- Framework detection

#### **Authentication Testing** (`modules/blue/web/auth`)

Testes de autenticação:
- Validação de mecanismos de login
- Detecção de endpoints de autenticação
- Análise de session management

---

## 📝 Exemplos de Comando

### Exemplos Prácticos

**Scan rápido de website:**
```bash
npm run start -- webscan https://example.com
```

**Scan completo de todas as portas:**
```bash
npm run start -- portscan 192.168.1.100 1 65535
```

**Scan de portas comuns:**
```bash
npm run start -- portscan target-host 1 1024
```

**Verificar específicas de web:**
```bash
npm run start -- webscan http://localhost:3000
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Logger
LOG_LEVEL=debug

# HTTP Client
HTTP_TIMEOUT=10000
HTTP_RETRIES=3

# Port Scan
PORT_SCAN_TIMEOUT=1000
PORT_SCAN_CONCURRENCY=100

# Web Scan
WEB_SCAN_MAX_URLS=50
WEB_SCAN_TIMEOUT=30000

# Report
REPORT_FORMAT=json
REPORT_PATH=./reports
```

### Customização

Todos os checks de vulnerabilidade podem ser customizados através dos arquivos em:
- `src/modules/red/web/vuln/checks/*.ts` - Para adicionar novos checks
- `src/modules/red/web/vuln/payload/` - Para customizar payloads

---

## 👨‍💻 Desenvolvimento

### Scripts Disponíveis

```bash
# Desenvolvimento (watch mode)
npm run start:dev

# Debug mode
npm run start:debug

# Build
npm run build

# Produção
npm run start:prod

# Testes
npm run test

# Testes com coverage
npm run test:cov

# Testes e2e
npm run test:e2e

# Lint
npm run lint

# Formatação
npm run format
```

### Estrutura de Testes

- **Unit Tests**: `src/**/*.spec.ts`
- **E2E Tests**: `test/app.e2e-spec.ts`
- **Jest Configuration**: `jest.config.json` e `test/jest-e2e.json`

### Adicionar Novo Check de Vulnerabilidade

1. Crie um novo arquivo em `src/modules/red/web/vuln/checks/your-check.check.ts`
2. Implemente a interface `IVulnCheck`
3. Registre em `src/modules/red/web/vuln/vuln.module.ts`

**Exemplo:**
```typescript
@Injectable()
export class YourCheck implements IVulnCheck {
  readonly name = 'Your Vulnerability Name';

  constructor(private readonly http: HttpService) {}

  async run(url: string, param: string, method: string): Promise<VulnFinding[]> {
    const findings: VulnFinding[] = [];
    // Sua implementação aqui
    return findings;
  }
}
```

---

## 🤝 Contribuição

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- Use TypeScript strict mode
- Siga o padrão NestJS
- Adicione testes para novas funcionalidades
- Mantenha 80%+ de code coverage
- Use ESLint e Prettier

---

## 📄 Licença

Este projeto está sob a licença UNLICENSED. Veja detalhes adicionais de uso com o autor.

---

## 👤 Autor

**HugoZAuad**

---

## 🔗 Links

- [NestJS Documentação](https://docs.nestjs.com/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Puppeteer](https://pptr.dev/)

---

**Versão**: 0.0.1  
**Última Atualização**: 2026-04-24
* Dependency Scanner
* Port Scanner
* Web Scanner
* OSINT tools

### 🔵 Blue Team

* Security Audit
* Log Analysis
* Password Audit
* Threat Detection
* Security Score

---

## 📊 Reports

Sentinel CLI generates structured reports including:

* detected vulnerabilities
* risk classification
* security recommendations

Supported formats:

* JSON
* TXT
* (coming soon) PDF

---

## 🧠 Examples

```bash
sentinel-cli scan --target ./app --json
```

```bash
sentinel-cli portscan --target 127.0.0.1
```

---

## 🏗️ Architecture

```bash
src/
 ├── cli/
 ├── modules/
 │    ├── red/
 │    └── blue/
 ├── core/
 └── main.ts
```

---

## 🔐 Purpose

This project was created for:

* learning offensive and defensive security
* automating security audits
* assisting development environments

---

## ⚠️ Disclaimer

This tool is intended for authorized testing environments only.

Misuse may violate local laws.

---

## 👨‍💻 Author

**Hugo Zeymer Auad**
GitHub: [https://github.com/HugoZAuad](https://github.com/HugoZAuad)

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the project
2. Create your feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature/new-feature`)
5. Open a Pull Request

---

## 📌 Roadmap

* [ ] PDF report export
* [ ] Plugin system
* [ ] CI/CD integration
* [ ] Web dashboard
* [ ] Performance improvements

---

## ⭐ Support

If you like this project, consider giving it a star on GitHub ⭐

---
