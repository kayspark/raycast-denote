# Raycast Denote

Create, search, and manage [denote](https://protesilaos.com/emacs/denote) notes from Raycast.

Integrates with Emacs (GUI via emacsclient) and BibTeX paper libraries.

## Commands

| Command | Description |
|---------|-------------|
| **Create Note** | Form with title, tags (autocomplete from existing), content, directory picker |
| **Search Notes** | Fuzzy search across all denote notes by title, tags, or content |
| **Search Papers** | Search bibliography.bib by title/author/year, open PDFs, create paper notes |
| **Quick Capture** | Minimal input — type a thought, press Enter, done |

## Actions

### Search Notes
- **Enter** — Open in Emacs GUI (`emacsclient -c -n`)
- **Cmd+C** — Copy file path
- **Cmd+Shift+C** — Copy denote link `[[denote:ID]]`

### Search Papers
- **Enter** — Open PDF in Preview.app
- **Cmd+Enter** — Open paper note in Emacs (if exists)
- **Cmd+N** — Create new paper note from bib entry
- **Cmd+D** — Open DOI in browser

## Requirements

- [Raycast](https://raycast.com)
- [Emacs](https://www.gnu.org/software/emacs/) with daemon mode (`emacsclient`)
- [ripgrep](https://github.com/BurntSushi/ripgrep) (`rg`) for fast note search
- Org files using [denote](https://protesilaos.com/emacs/denote) naming convention

## Setup

```bash
git clone https://github.com/kayspark/raycast-denote.git
cd raycast-denote
npm install
npm run dev
```

Configure paths in Raycast extension preferences.

## Preferences

| Setting | Default | Description |
|---------|---------|-------------|
| Notes Directory | `~/org/notes` | Where denote notes live |
| Papers Directory | `~/org/papers` | Papers directory (with `notes/` subdirectory) |
| Inbox Directory | `~/org/inbox` | Quick capture destination |
| Bibliography File | `~/org/papers/bibliography.bib` | BibTeX file for paper search |
| Editor Command | `emacsclient -c -n` | Command to open notes in Emacs GUI |

## Denote File Format

Files follow the denote naming convention:

```
YYYYMMDDTHHMMSS--slugified-title__tag1_tag2.org
```

With front matter:

```org
#+title:      My Note Title
#+date:       [2026-02-28 Fri]
#+identifier: 20260228T143022
#+filetags:   :tag1:tag2:
```

## License

MIT
