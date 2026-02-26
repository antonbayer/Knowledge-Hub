# Knowledge Vault

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](README.md)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-brightgreen)](package.json)
[![Tests](https://github.com/antonbayer/Knowledge-Hub/actions/workflows/test.yml/badge.svg)](https://github.com/antonbayer/Knowledge-Hub/actions/workflows/test.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

A markdown-based knowledge and documentation hub. Code repositories live elsewhere. Their contents are automatically linked into the vault via **directory links** (junctions on Windows, symlinks on macOS/Linux) — readable, searchable, and editable with any markdown-capable tool.

## Concept

Projects live in their own Git repos. Their contents should be centrally visible without maintaining duplicates.

**Solution:** Directory links (junctions on Windows, symlinks on macOS/Linux) connect repos into the vault. A Node.js script (`vault.js`) recursively finds all Git repos under configured source paths, pulls them, and creates links.

## Prerequisites

- **Git**
- **Node.js** (for vault.js — automatically installs missing tools)
- **Windows 10/11** uses NTFS junctions, **macOS/Linux** uses symlinks

## Setup

### 1. Clone the vault

```bash
git clone <vault-url> <vault-path>
```

### 2. Configure

Copy `.env.example` to `.env` and adjust:

```bash
cp .env.example .env
```

```bash
# .env
SOURCES=C:\path\to\repos
TEMPLATES=path/to/templates
ASSETS=path/to/assets
```

| Variable | Description |
|----------|-------------|
| `SOURCES` | Where your Git repos live (comma-separated for multiple) |
| `TEMPLATES` | Path to templates, Marp themes, Pandoc reference DOCX (relative to vault) |
| `ASSETS` | Path to images, logos, files (relative to vault) |

### 3. Pull repos + create junctions

```bash
node vault.js pull
```

Missing tools (Marp, Pandoc) are installed automatically. All Git repos are found recursively, pulled, and linked via junctions.

### 4. Start working

Open the vault folder with any markdown-capable editor (Obsidian, VS Code, etc.).

Or use the CLI directly:

```bash
claude
```

Claude Code can manage the vault, search docs, create brainstorms, trigger exports, and run `vault.js` commands — all via chat.

## vault.js

| Command | What it does |
|---------|-------------|
| `node vault.js pull` | Pull all repos + create missing junctions |
| `node vault.js add <url>` | Clone a new project + link it |
| `node vault.js add <url> --link <path>` | With explicit vault path |
| `node vault.js status` | Show status of all repos |

### How does vault.js find repos?

`vault.js` reads `SOURCES` from `.env` and searches each path recursively. When a `.git` folder is found, that's a repo — recursion stops there. For each repo, a junction is created in the vault (path = relative to source directory).

### Path derivation from URL (add)

```
git@host:org/group/project.git
         └─┘ └─ project path ─┘

Cloned into the first SOURCES directory + project path.
Junction in vault = project path.
```

## Document Export

Documents are written in markdown and exported. Template and asset paths are configured in `.env`.

### Presentations (Marp)

```bash
marp file.md --theme-set $TEMPLATES/theme.css -o output.pdf --allow-local-files
```

### Documents (Pandoc)

```bash
pandoc input.md -o output.docx --reference-doc=$TEMPLATES/reference.docx
```

Available themes and templates: see README in the templates folder.

## How Linking Works

On **Windows**, vault.js uses NTFS junctions (`mklink /J`) — no Developer Mode required. On **macOS/Linux**, it uses symlinks (`ln -s`).

- Junction/symlink contents are **excluded** from the vault repo via `.gitignore`
- Changes go directly into the original repo

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT — see [LICENSE](LICENSE).
