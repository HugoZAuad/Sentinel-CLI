# Sentinel CLI 🛡️

[![Node.js](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen)](#)
[![NestJS](https://img.shields.io/badge/nestjs-framework-red)](#)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#)

A command-line security auditing and analysis toolkit built with NestJS.

---

## 🚀 Overview

Sentinel CLI is a modular security suite designed for:

* 🔴 Red Team (offensive security testing)
* 🔵 Blue Team (defensive security auditing)

All features are accessible via terminal, supporting both interactive menus and command-based usage.

---

## ✨ Features

* Interactive CLI menu (beginner-friendly)
* Command-based execution (pro usage)
* Modular architecture (scalable)
* Security reports (JSON/TXT)
* Red Team + Blue Team workflows

---

## 📦 Installation

### Global installation

```bash
npm install -g sentinel-cli
```

### Run locally

```bash
git clone https://github.com/HugoZAuad/sentinel-cli
cd sentinel-cli
npm install
npm run start
```

---

## ⚙️ Usage

### 🔹 Interactive mode

```bash
sentinel-cli
```

Launches an interactive menu with options like:

* Red Team
* Blue Team
* Reports

---

### 🔹 Command mode

#### Code vulnerability scan

```bash
sentinel-cli scan --target ./your-project
```

#### Dependency scan

```bash
sentinel-cli deps --target ./your-project
```

#### Port scanner

```bash
sentinel-cli portscan --target 192.168.0.1
```

#### Web scanner

```bash
sentinel-cli webscan --url https://example.com
```

---

## 🧩 Modules

### 🔴 Red Team

* Vulnerability Scanner
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
