# Knowledge Vault

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](README.md)
[![Zero Dependencies](https://img.shields.io/badge/Dependencies-0-brightgreen)](package.json)
[![Tests](https://github.com/antonbayer/Knowledge-Hub/actions/workflows/test.yml/badge.svg)](https://github.com/antonbayer/Knowledge-Hub/actions/workflows/test.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

## The Problem

As a developer or freelancer you accumulate dozens of repos — each with its own docs, notes, and assets. Finding that one decision record or meeting note means remembering which repo it lives in, cloning it, and hoping the docs are up to date. Documentation is scattered, searching is painful, and maintaining duplicates is a dead end.

## The Idea

**Knowledge Vault** turns a single folder into a central documentation hub. Instead of copying files, it **links** your existing repos into the vault using directory links (junctions on Windows, symlinks on macOS/Linux). Every linked repo's content becomes instantly visible, searchable, and editable — with Obsidian, VS Code, or any markdown tool.

A small Node.js CLI (`vault.js`) does the heavy lifting: it discovers all Git repos under your configured source paths, pulls them, and creates the links automatically.

On top of that, **Claude Code** manages the vault: search across all docs, scaffold new files from templates, export polished Word documents via Pandoc, and generate presentations via Marp — all through chat.

**The result:** One place to search, browse, and edit all your documentation — while every file stays in its original repo.

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
TEMPLATES=templates
ASSETS=path/to/assets
```

| Variable | Description |
|----------|-------------|
| `SOURCES` | Where your Git repos live (comma-separated for multiple) |
| `TEMPLATES` | Marp themes, Pandoc reference DOCX, markdown templates (default: `templates/`) |
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

## Templates

The vault ships with generic templates in `templates/`:

| File | Purpose |
|------|---------|
| `theme.css` | Marp presentation theme (Inter font, clean blue accent) |
| `reference.docx` | Pandoc reference document for Word export |
| `meeting.md` | Meeting notes with agenda, decisions, action items |
| `brainstorm.md` | Brainstorming with context, ideas, pros/cons |
| `customer.md` | Customer/project overview |

Override `TEMPLATES` in `.env` to point to your own templates instead.

## Document Export

Documents are written in markdown and exported using the templates above.

### Presentations (Marp)

```bash
marp file.md --theme-set $TEMPLATES/theme.css -o output.pdf --allow-local-files
```

### Documents (Pandoc)

```bash
pandoc input.md -o output.docx --reference-doc=$TEMPLATES/reference.docx
```

## How Linking Works

On **Windows**, vault.js uses NTFS junctions (`mklink /J`) — no Developer Mode required. On **macOS/Linux**, it uses symlinks (`ln -s`).

- Junction/symlink contents are **excluded** from the vault repo via `.gitignore`
- Changes go directly into the original repo

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT — see [LICENSE](LICENSE).
