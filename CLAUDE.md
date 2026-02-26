# Knowledge Hub

## What is this?
Markdown-based knowledge and documentation hub. Code lives elsewhere, linked into the vault via **Junctions** (`mklink /J`).

## Structure
- Junction folders mirror the directory structure under `SOURCES` (from `.env`)
- `.env` – local config: SOURCES, TEMPLATES, ASSETS (not in Git)
- `.env.example` – template for `.env`
- `vault.js` – CLI: `node vault.js pull|add|status`

Templates and assets (paths from `.env`):
- `TEMPLATES` → templates, Marp themes, Pandoc reference DOCX
- `ASSETS` → images, logos, files

## Document Export

### Presentations (Marp CLI)
```bash
marp file.md --theme-set $TEMPLATES/theme.css -o output.pdf --allow-local-files
```
Select theme in frontmatter via `theme: themename`. Available themes are in `$TEMPLATES`.

### Documents (Pandoc)
```bash
pandoc input.md -o output.docx --reference-doc=$TEMPLATES/reference.docx
```
Available reference DOCX files are in `$TEMPLATES`.

## Conventions
- Windows: NTFS junctions (`mklink /J`), macOS/Linux: symlinks (`ln -s`)
- Link contents are not committed (`.gitignore` only tracks vault-owned files)
- Add a new project: `node vault.js add <git-url>`
