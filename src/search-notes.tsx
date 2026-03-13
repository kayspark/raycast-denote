import {
  Action,
  ActionPanel,
  List,
  getPreferenceValues,
  showToast,
  Toast,
} from "@raycast/api";
import { useState, useEffect, useCallback } from "react";
import {
  scanNotes,
  searchNotes,
  readTitle,
  openInEditor,
  DenoteFile,
} from "./utils/denote";

interface Preferences {
  notesDir: string;
  papersDir: string;
  editorCmd: string;
}

export default function SearchNotes() {
  const prefs = getPreferenceValues<Preferences>();
  const dirs = [prefs.notesDir, `${prefs.papersDir}/notes`];
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState<DenoteFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load all notes initially
  useEffect(() => {
    const all = dirs.flatMap((d) => scanNotes(d));
    all.sort((a, b) => b.identifier.localeCompare(a.identifier));
    setNotes(all);
    setIsLoading(false);
  }, []);

  // Filter/search on query change
  useEffect(() => {
    if (!query.trim()) {
      const all = dirs.flatMap((d) => scanNotes(d));
      all.sort((a, b) => b.identifier.localeCompare(a.identifier));
      setNotes(all);
      return;
    }
    setIsLoading(true);
    const matches = searchNotes(dirs, query);
    const parsed = matches
      .map((p) => {
        const name = p.split("/").pop() || "";
        const match = name.match(/^(\d{8}T\d{6})--(.+?)(?:__(.+))?\.org$/);
        if (!match) return null;
        const [, identifier, , tagStr] = match;
        return {
          path: p,
          identifier,
          title: readTitle(p),
          tags: tagStr ? tagStr.split("_") : [],
          date: `${identifier.slice(0, 4)}-${identifier.slice(4, 6)}-${identifier.slice(6, 8)}`,
        } as DenoteFile;
      })
      .filter((f): f is DenoteFile => f !== null)
      .sort((a, b) => b.identifier.localeCompare(a.identifier));
    setNotes(parsed);
    setIsLoading(false);
  }, [query]);

  const handleOpen = useCallback(
    (filepath: string) => {
      try {
        openInEditor(prefs.editorCmd, filepath);
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

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search notes..."
      onSearchTextChange={setQuery}
      throttle
    >
      {notes.map((note) => (
        <List.Item
          key={note.path}
          title={note.title}
          subtitle={note.date}
          accessories={note.tags.map((t) => ({ tag: t }))}
          actions={
            <ActionPanel>
              <Action
                title="Open in Emacs"
                onAction={() => handleOpen(note.path)}
              />
              <Action.CopyToClipboard
                title="Copy Path"
                content={note.path}
                shortcut={{ modifiers: ["cmd"], key: "c" }}
              />
              <Action.CopyToClipboard
                title="Copy Denote Link"
                content={`[[denote:${note.identifier}]]`}
                shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
