"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/search-notes.tsx
var search_notes_exports = {};
__export(search_notes_exports, {
  default: () => SearchNotes
});
module.exports = __toCommonJS(search_notes_exports);
var import_api = require("@raycast/api");
var import_react = require("react");

// src/utils/denote.ts
var import_child_process = require("child_process");
var import_fs = require("fs");
var import_path = require("path");
var import_os = require("os");
function expandPath(p) {
  return p.startsWith("~") ? p.replace("~", (0, import_os.homedir)()) : p;
}
function parseFilename(filepath) {
  const name = (0, import_path.basename)(filepath, ".org");
  const match = name.match(/^(\d{8}T\d{6})--(.+?)(?:__(.+))?$/);
  if (!match) return null;
  const [, identifier, slug, tagStr] = match;
  return {
    path: filepath,
    identifier,
    title: slug.replace(/-/g, " "),
    tags: tagStr ? tagStr.split("_") : [],
    date: `${identifier.slice(0, 4)}-${identifier.slice(4, 6)}-${identifier.slice(6, 8)}`
  };
}
function scanNotes(dir) {
  const expanded = expandPath(dir);
  if (!(0, import_fs.existsSync)(expanded)) return [];
  return (0, import_fs.readdirSync)(expanded).filter((f) => f.endsWith(".org") && /^\d{8}T\d{6}--/.test(f)).map((f) => parseFilename((0, import_path.join)(expanded, f))).filter((f) => f !== null).sort((a, b) => b.identifier.localeCompare(a.identifier));
}
function searchNotes(dirs, query) {
  if (!query.trim()) return [];
  const paths = dirs.map(expandPath).filter(import_fs.existsSync);
  if (paths.length === 0) return [];
  try {
    const escapedQuery = query.replace(/['"\\]/g, "\\$&");
    const output = (0, import_child_process.execSync)(
      `rg -l -i --glob '*.org' "${escapedQuery}" ${paths.map((p) => `"${p}"`).join(" ")}`,
      { encoding: "utf-8", timeout: 1e4 }
    );
    return output.split("\n").filter(Boolean);
  } catch {
    return [];
  }
}
function readTitle(filepath) {
  try {
    const head = (0, import_fs.readFileSync)(filepath, "utf-8").slice(0, 500);
    const match = head.match(/^#\+title:\s*(.+)$/m);
    if (match) return match[1].trim();
  } catch {
  }
  const parsed = parseFilename(filepath);
  return parsed ? parsed.title : (0, import_path.basename)(filepath, ".org");
}
function findEmacsclient() {
  const candidates = [
    "/Applications/MacPorts/Emacs.app/Contents/MacOS/bin/emacsclient",
    // MacPorts
    "/Applications/Emacs.app/Contents/MacOS/bin/emacsclient",
    // Emacs for Mac OS X
    "/opt/homebrew/bin/emacsclient",
    // Homebrew ARM
    "/usr/local/bin/emacsclient",
    // Homebrew Intel / Linux
    "/opt/local/bin/emacsclient",
    // MacPorts CLI
    "/usr/bin/emacsclient",
    // Linux system
    "/snap/bin/emacsclient"
    // Snap
  ];
  return candidates.find((p) => (0, import_fs.existsSync)(p)) || null;
}
function findSocket() {
  const candidates = [
    (0, import_path.join)((0, import_os.homedir)(), ".config", "emacs", "server", "server"),
    // XDG custom
    (0, import_path.join)((0, import_os.homedir)(), ".emacs.d", "server", "server"),
    // Traditional
    `/tmp/emacs${process.getuid?.() ?? 501}/server`
    // Default (macOS/Linux)
  ];
  return candidates.find((p) => (0, import_fs.existsSync)(p)) || null;
}
function resolveEditorCmd(editorCmd) {
  let cmd = editorCmd;
  if (cmd.startsWith("emacsclient ") || cmd === "emacsclient") {
    const fullPath = findEmacsclient();
    if (fullPath) cmd = cmd.replace(/^emacsclient/, fullPath);
  }
  if (cmd.includes("emacsclient") && !cmd.includes("--socket-name")) {
    const socketPath = findSocket();
    if (socketPath) cmd += ` --socket-name=${socketPath}`;
  }
  return cmd;
}
function openInEditor(editorCmd, filepath) {
  const PATH = [
    "/Applications/MacPorts/Emacs.app/Contents/MacOS/bin",
    "/Applications/Emacs.app/Contents/MacOS/bin",
    "/opt/homebrew/bin",
    "/opt/local/bin",
    "/usr/local/bin",
    process.env.PATH || ""
  ].join(":");
  const resolved = resolveEditorCmd(editorCmd);
  const child = (0, import_child_process.spawn)("/bin/sh", ["-c", `${resolved} "${filepath}"`], {
    detached: true,
    stdio: "ignore",
    env: { ...process.env, PATH }
  });
  child.unref();
}

// src/search-notes.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function SearchNotes() {
  const prefs = (0, import_api.getPreferenceValues)();
  const dirs = [prefs.notesDir, `${prefs.papersDir}/notes`];
  const [query, setQuery] = (0, import_react.useState)("");
  const [notes, setNotes] = (0, import_react.useState)([]);
  const [isLoading, setIsLoading] = (0, import_react.useState)(true);
  (0, import_react.useEffect)(() => {
    const all = dirs.flatMap((d) => scanNotes(d));
    all.sort((a, b) => b.identifier.localeCompare(a.identifier));
    setNotes(all);
    setIsLoading(false);
  }, []);
  (0, import_react.useEffect)(() => {
    if (!query.trim()) {
      const all = dirs.flatMap((d) => scanNotes(d));
      all.sort((a, b) => b.identifier.localeCompare(a.identifier));
      setNotes(all);
      return;
    }
    setIsLoading(true);
    const matches = searchNotes(dirs, query);
    const parsed = matches.map((p) => {
      const name = p.split("/").pop() || "";
      const match = name.match(/^(\d{8}T\d{6})--(.+?)(?:__(.+))?\.org$/);
      if (!match) return null;
      const [, identifier, , tagStr] = match;
      return {
        path: p,
        identifier,
        title: readTitle(p),
        tags: tagStr ? tagStr.split("_") : [],
        date: `${identifier.slice(0, 4)}-${identifier.slice(4, 6)}-${identifier.slice(6, 8)}`
      };
    }).filter((f) => f !== null).sort((a, b) => b.identifier.localeCompare(a.identifier));
    setNotes(parsed);
    setIsLoading(false);
  }, [query]);
  const handleOpen = (0, import_react.useCallback)(
    (filepath) => {
      try {
        openInEditor(prefs.editorCmd, filepath);
      } catch (error) {
        (0, import_api.showToast)({ style: import_api.Toast.Style.Failure, title: "Failed to open", message: String(error) });
      }
    },
    [prefs.editorCmd]
  );
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.List, { isLoading, searchBarPlaceholder: "Search notes...", onSearchTextChange: setQuery, throttle: true, children: notes.map((note) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    import_api.List.Item,
    {
      title: note.title,
      subtitle: note.date,
      accessories: note.tags.map((t) => ({ tag: t })),
      actions: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_api.ActionPanel, { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.Action, { title: "Open in Emacs", onAction: () => handleOpen(note.path) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_api.Action.CopyToClipboard,
          {
            title: "Copy Path",
            content: note.path,
            shortcut: { modifiers: ["cmd"], key: "c" }
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
          import_api.Action.CopyToClipboard,
          {
            title: "Copy Denote Link",
            content: `[[denote:${note.identifier}]]`,
            shortcut: { modifiers: ["cmd", "shift"], key: "c" }
          }
        )
      ] })
    },
    note.path
  )) });
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLmRvdGZpbGVzLy5jb25maWcvcmF5Y2FzdC9leHRlbnNpb25zL3JheWNhc3QtZGVub3RlL3NyYy9zZWFyY2gtbm90ZXMudHN4IiwgIi4uLy4uLy4uLy4uLy5kb3RmaWxlcy8uY29uZmlnL3JheWNhc3QvZXh0ZW5zaW9ucy9yYXljYXN0LWRlbm90ZS9zcmMvdXRpbHMvZGVub3RlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBBY3Rpb24sIEFjdGlvblBhbmVsLCBMaXN0LCBnZXRQcmVmZXJlbmNlVmFsdWVzLCBzaG93VG9hc3QsIFRvYXN0IH0gZnJvbSBcIkByYXljYXN0L2FwaVwiO1xuaW1wb3J0IHsgdXNlU3RhdGUsIHVzZUVmZmVjdCwgdXNlQ2FsbGJhY2sgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IHNjYW5Ob3Rlcywgc2VhcmNoTm90ZXMsIHJlYWRUaXRsZSwgZXhwYW5kUGF0aCwgb3BlbkluRWRpdG9yLCBEZW5vdGVGaWxlIH0gZnJvbSBcIi4vdXRpbHMvZGVub3RlXCI7XG5cbmludGVyZmFjZSBQcmVmZXJlbmNlcyB7XG4gIG5vdGVzRGlyOiBzdHJpbmc7XG4gIHBhcGVyc0Rpcjogc3RyaW5nO1xuICBlZGl0b3JDbWQ6IHN0cmluZztcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gU2VhcmNoTm90ZXMoKSB7XG4gIGNvbnN0IHByZWZzID0gZ2V0UHJlZmVyZW5jZVZhbHVlczxQcmVmZXJlbmNlcz4oKTtcbiAgY29uc3QgZGlycyA9IFtwcmVmcy5ub3Rlc0RpciwgYCR7cHJlZnMucGFwZXJzRGlyfS9ub3Rlc2BdO1xuICBjb25zdCBbcXVlcnksIHNldFF1ZXJ5XSA9IHVzZVN0YXRlKFwiXCIpO1xuICBjb25zdCBbbm90ZXMsIHNldE5vdGVzXSA9IHVzZVN0YXRlPERlbm90ZUZpbGVbXT4oW10pO1xuICBjb25zdCBbaXNMb2FkaW5nLCBzZXRJc0xvYWRpbmddID0gdXNlU3RhdGUodHJ1ZSk7XG5cbiAgLy8gTG9hZCBhbGwgbm90ZXMgaW5pdGlhbGx5XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgYWxsID0gZGlycy5mbGF0TWFwKChkKSA9PiBzY2FuTm90ZXMoZCkpO1xuICAgIGFsbC5zb3J0KChhLCBiKSA9PiBiLmlkZW50aWZpZXIubG9jYWxlQ29tcGFyZShhLmlkZW50aWZpZXIpKTtcbiAgICBzZXROb3RlcyhhbGwpO1xuICAgIHNldElzTG9hZGluZyhmYWxzZSk7XG4gIH0sIFtdKTtcblxuICAvLyBGaWx0ZXIvc2VhcmNoIG9uIHF1ZXJ5IGNoYW5nZVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghcXVlcnkudHJpbSgpKSB7XG4gICAgICBjb25zdCBhbGwgPSBkaXJzLmZsYXRNYXAoKGQpID0+IHNjYW5Ob3RlcyhkKSk7XG4gICAgICBhbGwuc29ydCgoYSwgYikgPT4gYi5pZGVudGlmaWVyLmxvY2FsZUNvbXBhcmUoYS5pZGVudGlmaWVyKSk7XG4gICAgICBzZXROb3RlcyhhbGwpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzZXRJc0xvYWRpbmcodHJ1ZSk7XG4gICAgY29uc3QgbWF0Y2hlcyA9IHNlYXJjaE5vdGVzKGRpcnMsIHF1ZXJ5KTtcbiAgICBjb25zdCBwYXJzZWQgPSBtYXRjaGVzXG4gICAgICAubWFwKChwKSA9PiB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBwLnNwbGl0KFwiL1wiKS5wb3AoKSB8fCBcIlwiO1xuICAgICAgICBjb25zdCBtYXRjaCA9IG5hbWUubWF0Y2goL14oXFxkezh9VFxcZHs2fSktLSguKz8pKD86X18oLispKT9cXC5vcmckLyk7XG4gICAgICAgIGlmICghbWF0Y2gpIHJldHVybiBudWxsO1xuICAgICAgICBjb25zdCBbLCBpZGVudGlmaWVyLCAsIHRhZ1N0cl0gPSBtYXRjaDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBwYXRoOiBwLFxuICAgICAgICAgIGlkZW50aWZpZXIsXG4gICAgICAgICAgdGl0bGU6IHJlYWRUaXRsZShwKSxcbiAgICAgICAgICB0YWdzOiB0YWdTdHIgPyB0YWdTdHIuc3BsaXQoXCJfXCIpIDogW10sXG4gICAgICAgICAgZGF0ZTogYCR7aWRlbnRpZmllci5zbGljZSgwLCA0KX0tJHtpZGVudGlmaWVyLnNsaWNlKDQsIDYpfS0ke2lkZW50aWZpZXIuc2xpY2UoNiwgOCl9YCxcbiAgICAgICAgfSBhcyBEZW5vdGVGaWxlO1xuICAgICAgfSlcbiAgICAgIC5maWx0ZXIoKGYpOiBmIGlzIERlbm90ZUZpbGUgPT4gZiAhPT0gbnVsbClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBiLmlkZW50aWZpZXIubG9jYWxlQ29tcGFyZShhLmlkZW50aWZpZXIpKTtcbiAgICBzZXROb3RlcyhwYXJzZWQpO1xuICAgIHNldElzTG9hZGluZyhmYWxzZSk7XG4gIH0sIFtxdWVyeV0pO1xuXG4gIGNvbnN0IGhhbmRsZU9wZW4gPSB1c2VDYWxsYmFjayhcbiAgICAoZmlsZXBhdGg6IHN0cmluZykgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgb3BlbkluRWRpdG9yKHByZWZzLmVkaXRvckNtZCwgZmlsZXBhdGgpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgc2hvd1RvYXN0KHsgc3R5bGU6IFRvYXN0LlN0eWxlLkZhaWx1cmUsIHRpdGxlOiBcIkZhaWxlZCB0byBvcGVuXCIsIG1lc3NhZ2U6IFN0cmluZyhlcnJvcikgfSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBbcHJlZnMuZWRpdG9yQ21kXSxcbiAgKTtcblxuICByZXR1cm4gKFxuICAgIDxMaXN0IGlzTG9hZGluZz17aXNMb2FkaW5nfSBzZWFyY2hCYXJQbGFjZWhvbGRlcj1cIlNlYXJjaCBub3Rlcy4uLlwiIG9uU2VhcmNoVGV4dENoYW5nZT17c2V0UXVlcnl9IHRocm90dGxlPlxuICAgICAge25vdGVzLm1hcCgobm90ZSkgPT4gKFxuICAgICAgICA8TGlzdC5JdGVtXG4gICAgICAgICAga2V5PXtub3RlLnBhdGh9XG4gICAgICAgICAgdGl0bGU9e25vdGUudGl0bGV9XG4gICAgICAgICAgc3VidGl0bGU9e25vdGUuZGF0ZX1cbiAgICAgICAgICBhY2Nlc3Nvcmllcz17bm90ZS50YWdzLm1hcCgodCkgPT4gKHsgdGFnOiB0IH0pKX1cbiAgICAgICAgICBhY3Rpb25zPXtcbiAgICAgICAgICAgIDxBY3Rpb25QYW5lbD5cbiAgICAgICAgICAgICAgPEFjdGlvbiB0aXRsZT1cIk9wZW4gaW4gRW1hY3NcIiBvbkFjdGlvbj17KCkgPT4gaGFuZGxlT3Blbihub3RlLnBhdGgpfSAvPlxuICAgICAgICAgICAgICA8QWN0aW9uLkNvcHlUb0NsaXBib2FyZFxuICAgICAgICAgICAgICAgIHRpdGxlPVwiQ29weSBQYXRoXCJcbiAgICAgICAgICAgICAgICBjb250ZW50PXtub3RlLnBhdGh9XG4gICAgICAgICAgICAgICAgc2hvcnRjdXQ9e3sgbW9kaWZpZXJzOiBbXCJjbWRcIl0sIGtleTogXCJjXCIgfX1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPEFjdGlvbi5Db3B5VG9DbGlwYm9hcmRcbiAgICAgICAgICAgICAgICB0aXRsZT1cIkNvcHkgRGVub3RlIExpbmtcIlxuICAgICAgICAgICAgICAgIGNvbnRlbnQ9e2BbW2Rlbm90ZToke25vdGUuaWRlbnRpZmllcn1dXWB9XG4gICAgICAgICAgICAgICAgc2hvcnRjdXQ9e3sgbW9kaWZpZXJzOiBbXCJjbWRcIiwgXCJzaGlmdFwiXSwga2V5OiBcImNcIiB9fVxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9BY3Rpb25QYW5lbD5cbiAgICAgICAgICB9XG4gICAgICAgIC8+XG4gICAgICApKX1cbiAgICA8L0xpc3Q+XG4gICk7XG59XG4iLCAiaW1wb3J0IHsgZXhlY1N5bmMsIHNwYXduIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcbmltcG9ydCB7IHJlYWRkaXJTeW5jLCByZWFkRmlsZVN5bmMsIHdyaXRlRmlsZVN5bmMsIG1rZGlyU3luYywgZXhpc3RzU3luYyB9IGZyb20gXCJmc1wiO1xuaW1wb3J0IHsgam9pbiwgYmFzZW5hbWUgfSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgaG9tZWRpciB9IGZyb20gXCJvc1wiO1xuXG4vKiogRXhwYW5kIH4gdG8gaG9tZSBkaXJlY3RvcnkgKi9cbmV4cG9ydCBmdW5jdGlvbiBleHBhbmRQYXRoKHA6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBwLnN0YXJ0c1dpdGgoXCJ+XCIpID8gcC5yZXBsYWNlKFwiflwiLCBob21lZGlyKCkpIDogcDtcbn1cblxuLyoqIEdlbmVyYXRlIGRlbm90ZSBpZGVudGlmaWVyOiBZWVlZTU1ERFRISE1NU1MgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUlkZW50aWZpZXIoZGF0ZTogRGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICBjb25zdCBwYWQgPSAobjogbnVtYmVyKSA9PiBTdHJpbmcobikucGFkU3RhcnQoMiwgXCIwXCIpO1xuICByZXR1cm4gKFxuICAgIGAke2RhdGUuZ2V0RnVsbFllYXIoKX0ke3BhZChkYXRlLmdldE1vbnRoKCkgKyAxKX0ke3BhZChkYXRlLmdldERhdGUoKSl9YCArXG4gICAgYFQke3BhZChkYXRlLmdldEhvdXJzKCkpfSR7cGFkKGRhdGUuZ2V0TWludXRlcygpKX0ke3BhZChkYXRlLmdldFNlY29uZHMoKSl9YFxuICApO1xufVxuXG4vKiogU2x1Z2lmeSB0aXRsZSBmb3IgZGVub3RlIGZpbGVuYW1lOiBsb3dlcmNhc2UsIHNwYWNlcyB0byBoeXBoZW5zLCBzdHJpcCBzcGVjaWFsIGNoYXJzICovXG5leHBvcnQgZnVuY3Rpb24gc2x1Z2lmeSh0aXRsZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRpdGxlXG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAucmVwbGFjZSgvW15hLXowLTlcXHMtXS9nLCBcIlwiKVxuICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiLVwiKVxuICAgIC5yZXBsYWNlKC8tKy9nLCBcIi1cIilcbiAgICAucmVwbGFjZSgvXi18LSQvZywgXCJcIik7XG59XG5cbi8qKiBGb3JtYXQgZGF0ZSBmb3Igb3JnIGZyb250IG1hdHRlcjogW1lZWVktTU0tREQgRGF5XSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdE9yZ0RhdGUoZGF0ZTogRGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICBjb25zdCBkYXlzID0gW1wiU3VuXCIsIFwiTW9uXCIsIFwiVHVlXCIsIFwiV2VkXCIsIFwiVGh1XCIsIFwiRnJpXCIsIFwiU2F0XCJdO1xuICBjb25zdCBwYWQgPSAobjogbnVtYmVyKSA9PiBTdHJpbmcobikucGFkU3RhcnQoMiwgXCIwXCIpO1xuICByZXR1cm4gYFske2RhdGUuZ2V0RnVsbFllYXIoKX0tJHtwYWQoZGF0ZS5nZXRNb250aCgpICsgMSl9LSR7cGFkKGRhdGUuZ2V0RGF0ZSgpKX0gJHtkYXlzW2RhdGUuZ2V0RGF5KCldfV1gO1xufVxuXG4vKiogQnVpbGQgZGVub3RlIGZpbGVuYW1lICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGaWxlbmFtZSh0aXRsZTogc3RyaW5nLCB0YWdzOiBzdHJpbmdbXSwgZGF0ZTogRGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICBjb25zdCBpZCA9IGdlbmVyYXRlSWRlbnRpZmllcihkYXRlKTtcbiAgY29uc3Qgc2x1ZyA9IHNsdWdpZnkodGl0bGUpO1xuICBjb25zdCB0YWdTdWZmaXggPSB0YWdzLmxlbmd0aCA+IDAgPyBgX18ke3RhZ3Muam9pbihcIl9cIil9YCA6IFwiXCI7XG4gIHJldHVybiBgJHtpZH0tLSR7c2x1Z30ke3RhZ1N1ZmZpeH0ub3JnYDtcbn1cblxuLyoqIEJ1aWxkIG9yZyBmcm9udCBtYXR0ZXIgKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZyb250TWF0dGVyKHRpdGxlOiBzdHJpbmcsIHRhZ3M6IHN0cmluZ1tdLCBjb250ZW50OiBzdHJpbmcgPSBcIlwiKTogc3RyaW5nIHtcbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgY29uc3QgaWQgPSBnZW5lcmF0ZUlkZW50aWZpZXIobm93KTtcbiAgY29uc3QgdGFnTGluZSA9IHRhZ3MubGVuZ3RoID4gMCA/IGA6JHt0YWdzLmpvaW4oXCI6XCIpfTpgIDogXCJcIjtcbiAgbGV0IHRleHQgPSBgIyt0aXRsZTogICAgICAke3RpdGxlfVxcbmA7XG4gIHRleHQgKz0gYCMrZGF0ZTogICAgICAgJHtmb3JtYXRPcmdEYXRlKG5vdyl9XFxuYDtcbiAgdGV4dCArPSBgIytpZGVudGlmaWVyOiAke2lkfVxcbmA7XG4gIGlmICh0YWdMaW5lKSB0ZXh0ICs9IGAjK2ZpbGV0YWdzOiAgICR7dGFnTGluZX1cXG5gO1xuICB0ZXh0ICs9IGBcXG5gO1xuICBpZiAoY29udGVudCkgdGV4dCArPSBgJHtjb250ZW50fVxcbmA7XG4gIHJldHVybiB0ZXh0O1xufVxuXG4vKiogQ3JlYXRlIGEgZGVub3RlIG5vdGUgZmlsZSwgcmV0dXJuIGZ1bGwgcGF0aCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vdGUoZGlyOiBzdHJpbmcsIHRpdGxlOiBzdHJpbmcsIHRhZ3M6IHN0cmluZ1tdLCBjb250ZW50OiBzdHJpbmcgPSBcIlwiKTogc3RyaW5nIHtcbiAgY29uc3QgZXhwYW5kZWQgPSBleHBhbmRQYXRoKGRpcik7XG4gIGlmICghZXhpc3RzU3luYyhleHBhbmRlZCkpIG1rZGlyU3luYyhleHBhbmRlZCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IGlkID0gZ2VuZXJhdGVJZGVudGlmaWVyKG5vdyk7XG4gIGNvbnN0IHNsdWcgPSBzbHVnaWZ5KHRpdGxlKTtcbiAgY29uc3QgdGFnU3VmZml4ID0gdGFncy5sZW5ndGggPiAwID8gYF9fJHt0YWdzLmpvaW4oXCJfXCIpfWAgOiBcIlwiO1xuICBjb25zdCBmaWxlbmFtZSA9IGAke2lkfS0tJHtzbHVnfSR7dGFnU3VmZml4fS5vcmdgO1xuICBjb25zdCBmaWxlcGF0aCA9IGpvaW4oZXhwYW5kZWQsIGZpbGVuYW1lKTtcbiAgY29uc3QgdGFnTGluZSA9IHRhZ3MubGVuZ3RoID4gMCA/IGA6JHt0YWdzLmpvaW4oXCI6XCIpfTpgIDogXCJcIjtcbiAgbGV0IGJvZHkgPSBgIyt0aXRsZTogICAgICAke3RpdGxlfVxcbmA7XG4gIGJvZHkgKz0gYCMrZGF0ZTogICAgICAgJHtmb3JtYXRPcmdEYXRlKG5vdyl9XFxuYDtcbiAgYm9keSArPSBgIytpZGVudGlmaWVyOiAke2lkfVxcbmA7XG4gIGlmICh0YWdMaW5lKSBib2R5ICs9IGAjK2ZpbGV0YWdzOiAgICR7dGFnTGluZX1cXG5gO1xuICBib2R5ICs9IGBcXG5gO1xuICBpZiAoY29udGVudCkgYm9keSArPSBgJHtjb250ZW50fVxcbmA7XG4gIHdyaXRlRmlsZVN5bmMoZmlsZXBhdGgsIGJvZHksIFwidXRmLThcIik7XG4gIHJldHVybiBmaWxlcGF0aDtcbn1cblxuLyoqIFBhcnNlIGRlbm90ZSBmaWxlbmFtZSBpbnRvIGNvbXBvbmVudHMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVub3RlRmlsZSB7XG4gIHBhdGg6IHN0cmluZztcbiAgaWRlbnRpZmllcjogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICB0YWdzOiBzdHJpbmdbXTtcbiAgZGF0ZTogc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VGaWxlbmFtZShmaWxlcGF0aDogc3RyaW5nKTogRGVub3RlRmlsZSB8IG51bGwge1xuICBjb25zdCBuYW1lID0gYmFzZW5hbWUoZmlsZXBhdGgsIFwiLm9yZ1wiKTtcbiAgY29uc3QgbWF0Y2ggPSBuYW1lLm1hdGNoKC9eKFxcZHs4fVRcXGR7Nn0pLS0oLis/KSg/Ol9fKC4rKSk/JC8pO1xuICBpZiAoIW1hdGNoKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgWywgaWRlbnRpZmllciwgc2x1ZywgdGFnU3RyXSA9IG1hdGNoO1xuICByZXR1cm4ge1xuICAgIHBhdGg6IGZpbGVwYXRoLFxuICAgIGlkZW50aWZpZXIsXG4gICAgdGl0bGU6IHNsdWcucmVwbGFjZSgvLS9nLCBcIiBcIiksXG4gICAgdGFnczogdGFnU3RyID8gdGFnU3RyLnNwbGl0KFwiX1wiKSA6IFtdLFxuICAgIGRhdGU6IGAke2lkZW50aWZpZXIuc2xpY2UoMCwgNCl9LSR7aWRlbnRpZmllci5zbGljZSg0LCA2KX0tJHtpZGVudGlmaWVyLnNsaWNlKDYsIDgpfWAsXG4gIH07XG59XG5cbi8qKiBTY2FuIGFsbCBkZW5vdGUgZmlsZXMgaW4gYSBkaXJlY3RvcnkgKi9cbmV4cG9ydCBmdW5jdGlvbiBzY2FuTm90ZXMoZGlyOiBzdHJpbmcpOiBEZW5vdGVGaWxlW10ge1xuICBjb25zdCBleHBhbmRlZCA9IGV4cGFuZFBhdGgoZGlyKTtcbiAgaWYgKCFleGlzdHNTeW5jKGV4cGFuZGVkKSkgcmV0dXJuIFtdO1xuICByZXR1cm4gcmVhZGRpclN5bmMoZXhwYW5kZWQpXG4gICAgLmZpbHRlcigoZikgPT4gZi5lbmRzV2l0aChcIi5vcmdcIikgJiYgL15cXGR7OH1UXFxkezZ9LS0vLnRlc3QoZikpXG4gICAgLm1hcCgoZikgPT4gcGFyc2VGaWxlbmFtZShqb2luKGV4cGFuZGVkLCBmKSkpXG4gICAgLmZpbHRlcigoZik6IGYgaXMgRGVub3RlRmlsZSA9PiBmICE9PSBudWxsKVxuICAgIC5zb3J0KChhLCBiKSA9PiBiLmlkZW50aWZpZXIubG9jYWxlQ29tcGFyZShhLmlkZW50aWZpZXIpKTtcbn1cblxuLyoqIFNjYW4gYWxsIHVuaXF1ZSB0YWdzIGZyb20gZmlsZXRhZ3MgaGVhZGVycyBhY3Jvc3MgZGlyZWN0b3JpZXMgKi9cbmV4cG9ydCBmdW5jdGlvbiBzY2FuVGFncyhkaXJzOiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcbiAgY29uc3QgdGFncyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IGRpciBvZiBkaXJzKSB7XG4gICAgY29uc3QgZXhwYW5kZWQgPSBleHBhbmRQYXRoKGRpcik7XG4gICAgaWYgKCFleGlzdHNTeW5jKGV4cGFuZGVkKSkgY29udGludWU7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG91dHB1dCA9IGV4ZWNTeW5jKFxuICAgICAgICBgcmcgLS1uby1maWxlbmFtZSAtLW5vLWxpbmUtbnVtYmVyIC1vUCAnXiNcXFxcK2ZpbGV0YWdzOlxcXFxzKlxcXFxLLisnIC1nICcqLm9yZycgXCIke2V4cGFuZGVkfVwiYCxcbiAgICAgICAgeyBlbmNvZGluZzogXCJ1dGYtOFwiLCB0aW1lb3V0OiA1MDAwIH0sXG4gICAgICApO1xuICAgICAgZm9yIChjb25zdCBsaW5lIG9mIG91dHB1dC5zcGxpdChcIlxcblwiKSkge1xuICAgICAgICBjb25zdCB0cmltbWVkID0gbGluZS50cmltKCk7XG4gICAgICAgIGlmICghdHJpbW1lZCkgY29udGludWU7XG4gICAgICAgIC8vIGZpbGV0YWdzIGZvcm1hdDogOnRhZzE6dGFnMjp0YWczOlxuICAgICAgICBmb3IgKGNvbnN0IHQgb2YgdHJpbW1lZC5zcGxpdChcIjpcIikpIHtcbiAgICAgICAgICBjb25zdCB0YWcgPSB0LnRyaW0oKTtcbiAgICAgICAgICBpZiAodGFnKSB0YWdzLmFkZCh0YWcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyByZyByZXR1cm5zIGV4aXQgMSBpZiBubyBtYXRjaGVzXG4gICAgfVxuICB9XG4gIHJldHVybiBbLi4udGFnc10uc29ydCgpO1xufVxuXG4vKiogU2VhcmNoIG5vdGVzIHdpdGggcmlwZ3JlcCwgcmV0dXJuIG1hdGNoaW5nIGZpbGUgcGF0aHMgKi9cbmV4cG9ydCBmdW5jdGlvbiBzZWFyY2hOb3RlcyhkaXJzOiBzdHJpbmdbXSwgcXVlcnk6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgaWYgKCFxdWVyeS50cmltKCkpIHJldHVybiBbXTtcbiAgY29uc3QgcGF0aHMgPSBkaXJzLm1hcChleHBhbmRQYXRoKS5maWx0ZXIoZXhpc3RzU3luYyk7XG4gIGlmIChwYXRocy5sZW5ndGggPT09IDApIHJldHVybiBbXTtcbiAgdHJ5IHtcbiAgICBjb25zdCBlc2NhcGVkUXVlcnkgPSBxdWVyeS5yZXBsYWNlKC9bJ1wiXFxcXF0vZywgXCJcXFxcJCZcIik7XG4gICAgY29uc3Qgb3V0cHV0ID0gZXhlY1N5bmMoXG4gICAgICBgcmcgLWwgLWkgLS1nbG9iICcqLm9yZycgXCIke2VzY2FwZWRRdWVyeX1cIiAke3BhdGhzLm1hcCgocCkgPT4gYFwiJHtwfVwiYCkuam9pbihcIiBcIil9YCxcbiAgICAgIHsgZW5jb2Rpbmc6IFwidXRmLThcIiwgdGltZW91dDogMTAwMDAgfSxcbiAgICApO1xuICAgIHJldHVybiBvdXRwdXQuc3BsaXQoXCJcXG5cIikuZmlsdGVyKEJvb2xlYW4pO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gW107XG4gIH1cbn1cblxuLyoqIFJlYWQgdGhlIHRpdGxlIGZyb20gIyt0aXRsZTogaGVhZGVyLCBmYWxsaW5nIGJhY2sgdG8gZmlsZW5hbWUgc2x1ZyAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRUaXRsZShmaWxlcGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBoZWFkID0gcmVhZEZpbGVTeW5jKGZpbGVwYXRoLCBcInV0Zi04XCIpLnNsaWNlKDAsIDUwMCk7XG4gICAgY29uc3QgbWF0Y2ggPSBoZWFkLm1hdGNoKC9eI1xcK3RpdGxlOlxccyooLispJC9tKTtcbiAgICBpZiAobWF0Y2gpIHJldHVybiBtYXRjaFsxXS50cmltKCk7XG4gIH0gY2F0Y2gge1xuICAgIC8vIGZhbGwgdGhyb3VnaFxuICB9XG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlRmlsZW5hbWUoZmlsZXBhdGgpO1xuICByZXR1cm4gcGFyc2VkID8gcGFyc2VkLnRpdGxlIDogYmFzZW5hbWUoZmlsZXBhdGgsIFwiLm9yZ1wiKTtcbn1cblxuLyoqIFNlYXJjaCBjb21tb24gZW1hY3NjbGllbnQgbG9jYXRpb25zIChNYWNQb3J0cywgSG9tZWJyZXcsIEVtYWNzLmFwcCwgTGludXgpICovXG5mdW5jdGlvbiBmaW5kRW1hY3NjbGllbnQoKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IGNhbmRpZGF0ZXMgPSBbXG4gICAgXCIvQXBwbGljYXRpb25zL01hY1BvcnRzL0VtYWNzLmFwcC9Db250ZW50cy9NYWNPUy9iaW4vZW1hY3NjbGllbnRcIiwgIC8vIE1hY1BvcnRzXG4gICAgXCIvQXBwbGljYXRpb25zL0VtYWNzLmFwcC9Db250ZW50cy9NYWNPUy9iaW4vZW1hY3NjbGllbnRcIiwgICAgICAgICAgIC8vIEVtYWNzIGZvciBNYWMgT1MgWFxuICAgIFwiL29wdC9ob21lYnJldy9iaW4vZW1hY3NjbGllbnRcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSG9tZWJyZXcgQVJNXG4gICAgXCIvdXNyL2xvY2FsL2Jpbi9lbWFjc2NsaWVudFwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIb21lYnJldyBJbnRlbCAvIExpbnV4XG4gICAgXCIvb3B0L2xvY2FsL2Jpbi9lbWFjc2NsaWVudFwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNYWNQb3J0cyBDTElcbiAgICBcIi91c3IvYmluL2VtYWNzY2xpZW50XCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIExpbnV4IHN5c3RlbVxuICAgIFwiL3NuYXAvYmluL2VtYWNzY2xpZW50XCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU25hcFxuICBdO1xuICByZXR1cm4gY2FuZGlkYXRlcy5maW5kKChwKSA9PiBleGlzdHNTeW5jKHApKSB8fCBudWxsO1xufVxuXG4vKiogRmluZCBFbWFjcyBzZXJ2ZXIgc29ja2V0IGluIGNvbW1vbiBsb2NhdGlvbnMgKi9cbmZ1bmN0aW9uIGZpbmRTb2NrZXQoKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IGNhbmRpZGF0ZXMgPSBbXG4gICAgam9pbihob21lZGlyKCksIFwiLmNvbmZpZ1wiLCBcImVtYWNzXCIsIFwic2VydmVyXCIsIFwic2VydmVyXCIpLCAgICAgICAgICAgICAvLyBYREcgY3VzdG9tXG4gICAgam9pbihob21lZGlyKCksIFwiLmVtYWNzLmRcIiwgXCJzZXJ2ZXJcIiwgXCJzZXJ2ZXJcIiksICAgICAgICAgICAgICAgICAgICAgLy8gVHJhZGl0aW9uYWxcbiAgICBgL3RtcC9lbWFjcyR7cHJvY2Vzcy5nZXR1aWQ/LigpID8/IDUwMX0vc2VydmVyYCwgICAgICAgICAgICAgICAgICAgICAvLyBEZWZhdWx0IChtYWNPUy9MaW51eClcbiAgXTtcbiAgcmV0dXJuIGNhbmRpZGF0ZXMuZmluZCgocCkgPT4gZXhpc3RzU3luYyhwKSkgfHwgbnVsbDtcbn1cblxuLyoqIFJlc29sdmUgZW1hY3NjbGllbnQ6IGZpbmQgZnVsbCBwYXRoICsgYWRkIHNvY2tldC1uYW1lIGlmIG5lZWRlZCAqL1xuZnVuY3Rpb24gcmVzb2x2ZUVkaXRvckNtZChlZGl0b3JDbWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCBjbWQgPSBlZGl0b3JDbWQ7XG4gIC8vIElmIGJhcmUgXCJlbWFjc2NsaWVudFwiLCByZXNvbHZlIHRvIGZ1bGwgcGF0aFxuICBpZiAoY21kLnN0YXJ0c1dpdGgoXCJlbWFjc2NsaWVudCBcIikgfHwgY21kID09PSBcImVtYWNzY2xpZW50XCIpIHtcbiAgICBjb25zdCBmdWxsUGF0aCA9IGZpbmRFbWFjc2NsaWVudCgpO1xuICAgIGlmIChmdWxsUGF0aCkgY21kID0gY21kLnJlcGxhY2UoL15lbWFjc2NsaWVudC8sIGZ1bGxQYXRoKTtcbiAgfVxuICAvLyBBZGQgLS1zb2NrZXQtbmFtZSBpZiBlbWFjc2NsaWVudCBpcyB1c2VkIGJ1dCBzb2NrZXQgaXNuJ3Qgc3BlY2lmaWVkXG4gIGlmIChjbWQuaW5jbHVkZXMoXCJlbWFjc2NsaWVudFwiKSAmJiAhY21kLmluY2x1ZGVzKFwiLS1zb2NrZXQtbmFtZVwiKSkge1xuICAgIGNvbnN0IHNvY2tldFBhdGggPSBmaW5kU29ja2V0KCk7XG4gICAgaWYgKHNvY2tldFBhdGgpIGNtZCArPSBgIC0tc29ja2V0LW5hbWU9JHtzb2NrZXRQYXRofWA7XG4gIH1cbiAgcmV0dXJuIGNtZDtcbn1cblxuLyoqIE9wZW4gYSBmaWxlIGluIHRoZSBjb25maWd1cmVkIGVkaXRvciAoZmlyZS1hbmQtZm9yZ2V0LCBuZXZlciBibG9ja3MpICovXG5leHBvcnQgZnVuY3Rpb24gb3BlbkluRWRpdG9yKGVkaXRvckNtZDogc3RyaW5nLCBmaWxlcGF0aDogc3RyaW5nKTogdm9pZCB7XG4gIGNvbnN0IFBBVEggPSBbXG4gICAgXCIvQXBwbGljYXRpb25zL01hY1BvcnRzL0VtYWNzLmFwcC9Db250ZW50cy9NYWNPUy9iaW5cIixcbiAgICBcIi9BcHBsaWNhdGlvbnMvRW1hY3MuYXBwL0NvbnRlbnRzL01hY09TL2JpblwiLFxuICAgIFwiL29wdC9ob21lYnJldy9iaW5cIixcbiAgICBcIi9vcHQvbG9jYWwvYmluXCIsXG4gICAgXCIvdXNyL2xvY2FsL2JpblwiLFxuICAgIHByb2Nlc3MuZW52LlBBVEggfHwgXCJcIixcbiAgXS5qb2luKFwiOlwiKTtcbiAgY29uc3QgcmVzb2x2ZWQgPSByZXNvbHZlRWRpdG9yQ21kKGVkaXRvckNtZCk7XG4gIGNvbnN0IGNoaWxkID0gc3Bhd24oXCIvYmluL3NoXCIsIFtcIi1jXCIsIGAke3Jlc29sdmVkfSBcIiR7ZmlsZXBhdGh9XCJgXSwge1xuICAgIGRldGFjaGVkOiB0cnVlLFxuICAgIHN0ZGlvOiBcImlnbm9yZVwiLFxuICAgIGVudjogeyAuLi5wcm9jZXNzLmVudiwgUEFUSCB9LFxuICB9KTtcbiAgY2hpbGQudW5yZWYoKTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQUFpRjtBQUNqRixtQkFBaUQ7OztBQ0RqRCwyQkFBZ0M7QUFDaEMsZ0JBQWdGO0FBQ2hGLGtCQUErQjtBQUMvQixnQkFBd0I7QUFHakIsU0FBUyxXQUFXLEdBQW1CO0FBQzVDLFNBQU8sRUFBRSxXQUFXLEdBQUcs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
