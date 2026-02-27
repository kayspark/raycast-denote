/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Notes Directory - Path to denote notes directory */
  "notesDir": string,
  /** Papers Directory - Path to papers directory (contains notes/ and bibliography.bib) */
  "papersDir": string,
  /** Inbox Directory - Path to inbox directory for quick captures */
  "inboxDir": string,
  /** Bibliography File - Path to BibTeX bibliography file */
  "bibFile": string,
  /** Editor Command - Command to open notes (e.g., emacsclient -c -n) */
  "editorCmd": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `create-note` command */
  export type CreateNote = ExtensionPreferences & {}
  /** Preferences accessible in the `search-notes` command */
  export type SearchNotes = ExtensionPreferences & {}
  /** Preferences accessible in the `search-papers` command */
  export type SearchPapers = ExtensionPreferences & {}
  /** Preferences accessible in the `quick-capture` command */
  export type QuickCapture = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `create-note` command */
  export type CreateNote = {}
  /** Arguments passed to the `search-notes` command */
  export type SearchNotes = {}
  /** Arguments passed to the `search-papers` command */
  export type SearchPapers = {}
  /** Arguments passed to the `quick-capture` command */
  export type QuickCapture = {}
}

