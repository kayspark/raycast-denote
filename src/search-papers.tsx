import {
  Action,
  ActionPanel,
  List,
  getPreferenceValues,
  showToast,
  Toast,
  Icon,
} from "@raycast/api";
import { useState, useEffect, useCallback } from "react";
import { execSync } from "child_process";
import { existsSync } from "fs";
import {
  parseBibFile,
  extractPdfPath,
  formatAuthors,
  getVenue,
  BibEntry,
} from "./utils/bibtex";
import {
  createNote,
  scanNotes,
  openInEditor,
  DenoteFile,
} from "./utils/denote";

interface Preferences {
  papersDir: string;
  bibFile: string;
  editorCmd: string;
}

export default function SearchPapers() {
  const prefs = getPreferenceValues<Preferences>();
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<BibEntry[]>([]);
  const [paperNotes, setPaperNotes] = useState<Map<string, DenoteFile>>(
    new Map(),
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bib = parseBibFile(prefs.bibFile);
    setEntries(bib);

    const notes = scanNotes(`${prefs.papersDir}/notes`);
    const noteMap = new Map<string, DenoteFile>();
    for (const note of notes) {
      noteMap.set(note.title.toLowerCase(), note);
    }
    setPaperNotes(noteMap);
    setIsLoading(false);
  }, []);

  const sorted = [...entries].sort(
    (a, b) => b.year.localeCompare(a.year) || b.key.localeCompare(a.key),
  );
  const filtered = query.trim()
    ? sorted.filter((e) => {
        const q = query.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.author.toLowerCase().includes(q) ||
          e.year.includes(q) ||
          e.key.toLowerCase().includes(q)
        );
      })
    : sorted.slice(0, 50);

  const openPdf = useCallback((entry: BibEntry) => {
    const pdfPath = extractPdfPath(entry.file);
    if (pdfPath && existsSync(pdfPath)) {
      execSync(`open "${pdfPath}"`, { timeout: 5000 });
    } else {
      showToast({
        style: Toast.Style.Failure,
        title: "PDF not found",
        message: entry.file || "No file field",
      });
    }
  }, []);

  const openNote = useCallback(
    (note: DenoteFile) => {
      try {
        openInEditor(prefs.editorCmd, note.path);
      } catch (error) {
        showToast({
          style: Toast.Style.Failure,
          title: "Failed to open",
          message: String(error),
        });
      }
    },
    [prefs.editorCmd],
  );

  const createPaperNote = useCallback(
    (entry: BibEntry) => {
      const tags = ["paper"];
      const content = `* ${entry.title}\n\n- Author :: ${entry.author}\n- Year :: ${entry.year}\n- Key :: ${entry.key}\n`;
      const filepath = createNote(
        `${prefs.papersDir}/notes`,
        entry.title,
        tags,
        content,
      );
      try {
        openInEditor(prefs.editorCmd, filepath);
        showToast({ style: Toast.Style.Success, title: "Paper note created" });
      } catch {
        showToast({
          style: Toast.Style.Failure,
          title: "Note created but failed to open",
        });
      }
    },
    [prefs.editorCmd, prefs.papersDir],
  );

  // Find matching note for a bib entry
  const findNote = (entry: BibEntry): DenoteFile | undefined => {
    const words = entry.title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 4);
    for (const [key, note] of paperNotes) {
      if (words.every((w) => key.includes(w))) return note;
    }
    return undefined;
  };

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search papers..."
      onSearchTextChange={setQuery}
      throttle
    >
      {filtered.map((entry) => {
        const pdfPath = extractPdfPath(entry.file);
        const hasPdf = pdfPath ? existsSync(pdfPath) : false;
        const matchedNote = findNote(entry);

        return (
          <List.Item
            key={entry.key}
            title={entry.title || entry.key}
            subtitle={`${formatAuthors(entry.author)} (${entry.year})`}
            accessories={[
              { text: getVenue(entry) },
              ...(hasPdf
                ? [{ icon: Icon.Document, tooltip: "PDF available" }]
                : []),
              ...(matchedNote
                ? [{ icon: Icon.Text, tooltip: "Has note" }]
                : []),
            ]}
            actions={
              <ActionPanel>
                {hasPdf && (
                  <Action
                    title="Open Pdf"
                    icon={Icon.Document}
                    onAction={() => openPdf(entry)}
                  />
                )}
                {matchedNote && (
                  <Action
                    title="Open Note in Emacs"
                    icon={Icon.Text}
                    onAction={() => openNote(matchedNote)}
                    shortcut={{ modifiers: ["cmd"], key: "return" }}
                  />
                )}
                <Action
                  title="Create Paper Note"
                  icon={Icon.Plus}
                  onAction={() => createPaperNote(entry)}
                  shortcut={{ modifiers: ["cmd"], key: "n" }}
                />
                {entry.doi && (
                  <Action.OpenInBrowser
                    title="Open Doi"
                    url={`https://doi.org/${entry.doi}`}
                    shortcut={{ modifiers: ["cmd"], key: "d" }}
                  />
                )}
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}
