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
function openInEditor(editorCmd, filepath) {
  (0, import_child_process.execSync)(`${editorCmd} "${filepath}"`, { timeout: 5e3 });
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLmRvdGZpbGVzLy5jb25maWcvcmF5Y2FzdC9leHRlbnNpb25zL3JheWNhc3QtZGVub3RlL3NyYy9zZWFyY2gtbm90ZXMudHN4IiwgIi4uLy4uLy4uLy4uLy5kb3RmaWxlcy8uY29uZmlnL3JheWNhc3QvZXh0ZW5zaW9ucy9yYXljYXN0LWRlbm90ZS9zcmMvdXRpbHMvZGVub3RlLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBBY3Rpb24sIEFjdGlvblBhbmVsLCBMaXN0LCBnZXRQcmVmZXJlbmNlVmFsdWVzLCBzaG93VG9hc3QsIFRvYXN0IH0gZnJvbSBcIkByYXljYXN0L2FwaVwiO1xuaW1wb3J0IHsgdXNlU3RhdGUsIHVzZUVmZmVjdCwgdXNlQ2FsbGJhY2sgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IHNjYW5Ob3Rlcywgc2VhcmNoTm90ZXMsIHJlYWRUaXRsZSwgZXhwYW5kUGF0aCwgb3BlbkluRWRpdG9yLCBEZW5vdGVGaWxlIH0gZnJvbSBcIi4vdXRpbHMvZGVub3RlXCI7XG5cbmludGVyZmFjZSBQcmVmZXJlbmNlcyB7XG4gIG5vdGVzRGlyOiBzdHJpbmc7XG4gIHBhcGVyc0Rpcjogc3RyaW5nO1xuICBlZGl0b3JDbWQ6IHN0cmluZztcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gU2VhcmNoTm90ZXMoKSB7XG4gIGNvbnN0IHByZWZzID0gZ2V0UHJlZmVyZW5jZVZhbHVlczxQcmVmZXJlbmNlcz4oKTtcbiAgY29uc3QgZGlycyA9IFtwcmVmcy5ub3Rlc0RpciwgYCR7cHJlZnMucGFwZXJzRGlyfS9ub3Rlc2BdO1xuICBjb25zdCBbcXVlcnksIHNldFF1ZXJ5XSA9IHVzZVN0YXRlKFwiXCIpO1xuICBjb25zdCBbbm90ZXMsIHNldE5vdGVzXSA9IHVzZVN0YXRlPERlbm90ZUZpbGVbXT4oW10pO1xuICBjb25zdCBbaXNMb2FkaW5nLCBzZXRJc0xvYWRpbmddID0gdXNlU3RhdGUodHJ1ZSk7XG5cbiAgLy8gTG9hZCBhbGwgbm90ZXMgaW5pdGlhbGx5XG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgYWxsID0gZGlycy5mbGF0TWFwKChkKSA9PiBzY2FuTm90ZXMoZCkpO1xuICAgIGFsbC5zb3J0KChhLCBiKSA9PiBiLmlkZW50aWZpZXIubG9jYWxlQ29tcGFyZShhLmlkZW50aWZpZXIpKTtcbiAgICBzZXROb3RlcyhhbGwpO1xuICAgIHNldElzTG9hZGluZyhmYWxzZSk7XG4gIH0sIFtdKTtcblxuICAvLyBGaWx0ZXIvc2VhcmNoIG9uIHF1ZXJ5IGNoYW5nZVxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghcXVlcnkudHJpbSgpKSB7XG4gICAgICBjb25zdCBhbGwgPSBkaXJzLmZsYXRNYXAoKGQpID0+IHNjYW5Ob3RlcyhkKSk7XG4gICAgICBhbGwuc29ydCgoYSwgYikgPT4gYi5pZGVudGlmaWVyLmxvY2FsZUNvbXBhcmUoYS5pZGVudGlmaWVyKSk7XG4gICAgICBzZXROb3RlcyhhbGwpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBzZXRJc0xvYWRpbmcodHJ1ZSk7XG4gICAgY29uc3QgbWF0Y2hlcyA9IHNlYXJjaE5vdGVzKGRpcnMsIHF1ZXJ5KTtcbiAgICBjb25zdCBwYXJzZWQgPSBtYXRjaGVzXG4gICAgICAubWFwKChwKSA9PiB7XG4gICAgICAgIGNvbnN0IG5hbWUgPSBwLnNwbGl0KFwiL1wiKS5wb3AoKSB8fCBcIlwiO1xuICAgICAgICBjb25zdCBtYXRjaCA9IG5hbWUubWF0Y2goL14oXFxkezh9VFxcZHs2fSktLSguKz8pKD86X18oLispKT9cXC5vcmckLyk7XG4gICAgICAgIGlmICghbWF0Y2gpIHJldHVybiBudWxsO1xuICAgICAgICBjb25zdCBbLCBpZGVudGlmaWVyLCAsIHRhZ1N0cl0gPSBtYXRjaDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBwYXRoOiBwLFxuICAgICAgICAgIGlkZW50aWZpZXIsXG4gICAgICAgICAgdGl0bGU6IHJlYWRUaXRsZShwKSxcbiAgICAgICAgICB0YWdzOiB0YWdTdHIgPyB0YWdTdHIuc3BsaXQoXCJfXCIpIDogW10sXG4gICAgICAgICAgZGF0ZTogYCR7aWRlbnRpZmllci5zbGljZSgwLCA0KX0tJHtpZGVudGlmaWVyLnNsaWNlKDQsIDYpfS0ke2lkZW50aWZpZXIuc2xpY2UoNiwgOCl9YCxcbiAgICAgICAgfSBhcyBEZW5vdGVGaWxlO1xuICAgICAgfSlcbiAgICAgIC5maWx0ZXIoKGYpOiBmIGlzIERlbm90ZUZpbGUgPT4gZiAhPT0gbnVsbClcbiAgICAgIC5zb3J0KChhLCBiKSA9PiBiLmlkZW50aWZpZXIubG9jYWxlQ29tcGFyZShhLmlkZW50aWZpZXIpKTtcbiAgICBzZXROb3RlcyhwYXJzZWQpO1xuICAgIHNldElzTG9hZGluZyhmYWxzZSk7XG4gIH0sIFtxdWVyeV0pO1xuXG4gIGNvbnN0IGhhbmRsZU9wZW4gPSB1c2VDYWxsYmFjayhcbiAgICAoZmlsZXBhdGg6IHN0cmluZykgPT4ge1xuICAgICAgdHJ5IHtcbiAgICAgICAgb3BlbkluRWRpdG9yKHByZWZzLmVkaXRvckNtZCwgZmlsZXBhdGgpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgc2hvd1RvYXN0KHsgc3R5bGU6IFRvYXN0LlN0eWxlLkZhaWx1cmUsIHRpdGxlOiBcIkZhaWxlZCB0byBvcGVuXCIsIG1lc3NhZ2U6IFN0cmluZyhlcnJvcikgfSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBbcHJlZnMuZWRpdG9yQ21kXSxcbiAgKTtcblxuICByZXR1cm4gKFxuICAgIDxMaXN0IGlzTG9hZGluZz17aXNMb2FkaW5nfSBzZWFyY2hCYXJQbGFjZWhvbGRlcj1cIlNlYXJjaCBub3Rlcy4uLlwiIG9uU2VhcmNoVGV4dENoYW5nZT17c2V0UXVlcnl9IHRocm90dGxlPlxuICAgICAge25vdGVzLm1hcCgobm90ZSkgPT4gKFxuICAgICAgICA8TGlzdC5JdGVtXG4gICAgICAgICAga2V5PXtub3RlLnBhdGh9XG4gICAgICAgICAgdGl0bGU9e25vdGUudGl0bGV9XG4gICAgICAgICAgc3VidGl0bGU9e25vdGUuZGF0ZX1cbiAgICAgICAgICBhY2Nlc3Nvcmllcz17bm90ZS50YWdzLm1hcCgodCkgPT4gKHsgdGFnOiB0IH0pKX1cbiAgICAgICAgICBhY3Rpb25zPXtcbiAgICAgICAgICAgIDxBY3Rpb25QYW5lbD5cbiAgICAgICAgICAgICAgPEFjdGlvbiB0aXRsZT1cIk9wZW4gaW4gRW1hY3NcIiBvbkFjdGlvbj17KCkgPT4gaGFuZGxlT3Blbihub3RlLnBhdGgpfSAvPlxuICAgICAgICAgICAgICA8QWN0aW9uLkNvcHlUb0NsaXBib2FyZFxuICAgICAgICAgICAgICAgIHRpdGxlPVwiQ29weSBQYXRoXCJcbiAgICAgICAgICAgICAgICBjb250ZW50PXtub3RlLnBhdGh9XG4gICAgICAgICAgICAgICAgc2hvcnRjdXQ9e3sgbW9kaWZpZXJzOiBbXCJjbWRcIl0sIGtleTogXCJjXCIgfX1cbiAgICAgICAgICAgICAgLz5cbiAgICAgICAgICAgICAgPEFjdGlvbi5Db3B5VG9DbGlwYm9hcmRcbiAgICAgICAgICAgICAgICB0aXRsZT1cIkNvcHkgRGVub3RlIExpbmtcIlxuICAgICAgICAgICAgICAgIGNvbnRlbnQ9e2BbW2Rlbm90ZToke25vdGUuaWRlbnRpZmllcn1dXWB9XG4gICAgICAgICAgICAgICAgc2hvcnRjdXQ9e3sgbW9kaWZpZXJzOiBbXCJjbWRcIiwgXCJzaGlmdFwiXSwga2V5OiBcImNcIiB9fVxuICAgICAgICAgICAgICAvPlxuICAgICAgICAgICAgPC9BY3Rpb25QYW5lbD5cbiAgICAgICAgICB9XG4gICAgICAgIC8+XG4gICAgICApKX1cbiAgICA8L0xpc3Q+XG4gICk7XG59XG4iLCAiaW1wb3J0IHsgZXhlY1N5bmMgfSBmcm9tIFwiY2hpbGRfcHJvY2Vzc1wiO1xuaW1wb3J0IHsgcmVhZGRpclN5bmMsIHJlYWRGaWxlU3luYywgd3JpdGVGaWxlU3luYywgbWtkaXJTeW5jLCBleGlzdHNTeW5jIH0gZnJvbSBcImZzXCI7XG5pbXBvcnQgeyBqb2luLCBiYXNlbmFtZSB9IGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBob21lZGlyIH0gZnJvbSBcIm9zXCI7XG5cbi8qKiBFeHBhbmQgfiB0byBob21lIGRpcmVjdG9yeSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4cGFuZFBhdGgocDogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHAuc3RhcnRzV2l0aChcIn5cIikgPyBwLnJlcGxhY2UoXCJ+XCIsIGhvbWVkaXIoKSkgOiBwO1xufVxuXG4vKiogR2VuZXJhdGUgZGVub3RlIGlkZW50aWZpZXI6IFlZWVlNTUREVEhITU1TUyAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdlbmVyYXRlSWRlbnRpZmllcihkYXRlOiBEYXRlID0gbmV3IERhdGUoKSk6IHN0cmluZyB7XG4gIGNvbnN0IHBhZCA9IChuOiBudW1iZXIpID0+IFN0cmluZyhuKS5wYWRTdGFydCgyLCBcIjBcIik7XG4gIHJldHVybiAoXG4gICAgYCR7ZGF0ZS5nZXRGdWxsWWVhcigpfSR7cGFkKGRhdGUuZ2V0TW9udGgoKSArIDEpfSR7cGFkKGRhdGUuZ2V0RGF0ZSgpKX1gICtcbiAgICBgVCR7cGFkKGRhdGUuZ2V0SG91cnMoKSl9JHtwYWQoZGF0ZS5nZXRNaW51dGVzKCkpfSR7cGFkKGRhdGUuZ2V0U2Vjb25kcygpKX1gXG4gICk7XG59XG5cbi8qKiBTbHVnaWZ5IHRpdGxlIGZvciBkZW5vdGUgZmlsZW5hbWU6IGxvd2VyY2FzZSwgc3BhY2VzIHRvIGh5cGhlbnMsIHN0cmlwIHNwZWNpYWwgY2hhcnMgKi9cbmV4cG9ydCBmdW5jdGlvbiBzbHVnaWZ5KHRpdGxlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdGl0bGVcbiAgICAudG9Mb3dlckNhc2UoKVxuICAgIC5yZXBsYWNlKC9bXmEtejAtOVxccy1dL2csIFwiXCIpXG4gICAgLnJlcGxhY2UoL1xccysvZywgXCItXCIpXG4gICAgLnJlcGxhY2UoLy0rL2csIFwiLVwiKVxuICAgIC5yZXBsYWNlKC9eLXwtJC9nLCBcIlwiKTtcbn1cblxuLyoqIEZvcm1hdCBkYXRlIGZvciBvcmcgZnJvbnQgbWF0dGVyOiBbWVlZWS1NTS1ERCBEYXldICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0T3JnRGF0ZShkYXRlOiBEYXRlID0gbmV3IERhdGUoKSk6IHN0cmluZyB7XG4gIGNvbnN0IGRheXMgPSBbXCJTdW5cIiwgXCJNb25cIiwgXCJUdWVcIiwgXCJXZWRcIiwgXCJUaHVcIiwgXCJGcmlcIiwgXCJTYXRcIl07XG4gIGNvbnN0IHBhZCA9IChuOiBudW1iZXIpID0+IFN0cmluZyhuKS5wYWRTdGFydCgyLCBcIjBcIik7XG4gIHJldHVybiBgWyR7ZGF0ZS5nZXRGdWxsWWVhcigpfS0ke3BhZChkYXRlLmdldE1vbnRoKCkgKyAxKX0tJHtwYWQoZGF0ZS5nZXREYXRlKCkpfSAke2RheXNbZGF0ZS5nZXREYXkoKV19XWA7XG59XG5cbi8qKiBCdWlsZCBkZW5vdGUgZmlsZW5hbWUgKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZpbGVuYW1lKHRpdGxlOiBzdHJpbmcsIHRhZ3M6IHN0cmluZ1tdLCBkYXRlOiBEYXRlID0gbmV3IERhdGUoKSk6IHN0cmluZyB7XG4gIGNvbnN0IGlkID0gZ2VuZXJhdGVJZGVudGlmaWVyKGRhdGUpO1xuICBjb25zdCBzbHVnID0gc2x1Z2lmeSh0aXRsZSk7XG4gIGNvbnN0IHRhZ1N1ZmZpeCA9IHRhZ3MubGVuZ3RoID4gMCA/IGBfXyR7dGFncy5qb2luKFwiX1wiKX1gIDogXCJcIjtcbiAgcmV0dXJuIGAke2lkfS0tJHtzbHVnfSR7dGFnU3VmZml4fS5vcmdgO1xufVxuXG4vKiogQnVpbGQgb3JnIGZyb250IG1hdHRlciAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRnJvbnRNYXR0ZXIodGl0bGU6IHN0cmluZywgdGFnczogc3RyaW5nW10sIGNvbnRlbnQ6IHN0cmluZyA9IFwiXCIpOiBzdHJpbmcge1xuICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICBjb25zdCBpZCA9IGdlbmVyYXRlSWRlbnRpZmllcihub3cpO1xuICBjb25zdCB0YWdMaW5lID0gdGFncy5sZW5ndGggPiAwID8gYDoke3RhZ3Muam9pbihcIjpcIil9OmAgOiBcIlwiO1xuICBsZXQgdGV4dCA9IGAjK3RpdGxlOiAgICAgICR7dGl0bGV9XFxuYDtcbiAgdGV4dCArPSBgIytkYXRlOiAgICAgICAke2Zvcm1hdE9yZ0RhdGUobm93KX1cXG5gO1xuICB0ZXh0ICs9IGAjK2lkZW50aWZpZXI6ICR7aWR9XFxuYDtcbiAgaWYgKHRhZ0xpbmUpIHRleHQgKz0gYCMrZmlsZXRhZ3M6ICAgJHt0YWdMaW5lfVxcbmA7XG4gIHRleHQgKz0gYFxcbmA7XG4gIGlmIChjb250ZW50KSB0ZXh0ICs9IGAke2NvbnRlbnR9XFxuYDtcbiAgcmV0dXJuIHRleHQ7XG59XG5cbi8qKiBDcmVhdGUgYSBkZW5vdGUgbm90ZSBmaWxlLCByZXR1cm4gZnVsbCBwYXRoICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTm90ZShkaXI6IHN0cmluZywgdGl0bGU6IHN0cmluZywgdGFnczogc3RyaW5nW10sIGNvbnRlbnQ6IHN0cmluZyA9IFwiXCIpOiBzdHJpbmcge1xuICBjb25zdCBleHBhbmRlZCA9IGV4cGFuZFBhdGgoZGlyKTtcbiAgaWYgKCFleGlzdHNTeW5jKGV4cGFuZGVkKSkgbWtkaXJTeW5jKGV4cGFuZGVkLCB7IHJlY3Vyc2l2ZTogdHJ1ZSB9KTtcbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgY29uc3QgaWQgPSBnZW5lcmF0ZUlkZW50aWZpZXIobm93KTtcbiAgY29uc3Qgc2x1ZyA9IHNsdWdpZnkodGl0bGUpO1xuICBjb25zdCB0YWdTdWZmaXggPSB0YWdzLmxlbmd0aCA+IDAgPyBgX18ke3RhZ3Muam9pbihcIl9cIil9YCA6IFwiXCI7XG4gIGNvbnN0IGZpbGVuYW1lID0gYCR7aWR9LS0ke3NsdWd9JHt0YWdTdWZmaXh9Lm9yZ2A7XG4gIGNvbnN0IGZpbGVwYXRoID0gam9pbihleHBhbmRlZCwgZmlsZW5hbWUpO1xuICBjb25zdCB0YWdMaW5lID0gdGFncy5sZW5ndGggPiAwID8gYDoke3RhZ3Muam9pbihcIjpcIil9OmAgOiBcIlwiO1xuICBsZXQgYm9keSA9IGAjK3RpdGxlOiAgICAgICR7dGl0bGV9XFxuYDtcbiAgYm9keSArPSBgIytkYXRlOiAgICAgICAke2Zvcm1hdE9yZ0RhdGUobm93KX1cXG5gO1xuICBib2R5ICs9IGAjK2lkZW50aWZpZXI6ICR7aWR9XFxuYDtcbiAgaWYgKHRhZ0xpbmUpIGJvZHkgKz0gYCMrZmlsZXRhZ3M6ICAgJHt0YWdMaW5lfVxcbmA7XG4gIGJvZHkgKz0gYFxcbmA7XG4gIGlmIChjb250ZW50KSBib2R5ICs9IGAke2NvbnRlbnR9XFxuYDtcbiAgd3JpdGVGaWxlU3luYyhmaWxlcGF0aCwgYm9keSwgXCJ1dGYtOFwiKTtcbiAgcmV0dXJuIGZpbGVwYXRoO1xufVxuXG4vKiogUGFyc2UgZGVub3RlIGZpbGVuYW1lIGludG8gY29tcG9uZW50cyAqL1xuZXhwb3J0IGludGVyZmFjZSBEZW5vdGVGaWxlIHtcbiAgcGF0aDogc3RyaW5nO1xuICBpZGVudGlmaWVyOiBzdHJpbmc7XG4gIHRpdGxlOiBzdHJpbmc7XG4gIHRhZ3M6IHN0cmluZ1tdO1xuICBkYXRlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUZpbGVuYW1lKGZpbGVwYXRoOiBzdHJpbmcpOiBEZW5vdGVGaWxlIHwgbnVsbCB7XG4gIGNvbnN0IG5hbWUgPSBiYXNlbmFtZShmaWxlcGF0aCwgXCIub3JnXCIpO1xuICBjb25zdCBtYXRjaCA9IG5hbWUubWF0Y2goL14oXFxkezh9VFxcZHs2fSktLSguKz8pKD86X18oLispKT8kLyk7XG4gIGlmICghbWF0Y2gpIHJldHVybiBudWxsO1xuICBjb25zdCBbLCBpZGVudGlmaWVyLCBzbHVnLCB0YWdTdHJdID0gbWF0Y2g7XG4gIHJldHVybiB7XG4gICAgcGF0aDogZmlsZXBhdGgsXG4gICAgaWRlbnRpZmllcixcbiAgICB0aXRsZTogc2x1Zy5yZXBsYWNlKC8tL2csIFwiIFwiKSxcbiAgICB0YWdzOiB0YWdTdHIgPyB0YWdTdHIuc3BsaXQoXCJfXCIpIDogW10sXG4gICAgZGF0ZTogYCR7aWRlbnRpZmllci5zbGljZSgwLCA0KX0tJHtpZGVudGlmaWVyLnNsaWNlKDQsIDYpfS0ke2lkZW50aWZpZXIuc2xpY2UoNiwgOCl9YCxcbiAgfTtcbn1cblxuLyoqIFNjYW4gYWxsIGRlbm90ZSBmaWxlcyBpbiBhIGRpcmVjdG9yeSAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjYW5Ob3RlcyhkaXI6IHN0cmluZyk6IERlbm90ZUZpbGVbXSB7XG4gIGNvbnN0IGV4cGFuZGVkID0gZXhwYW5kUGF0aChkaXIpO1xuICBpZiAoIWV4aXN0c1N5bmMoZXhwYW5kZWQpKSByZXR1cm4gW107XG4gIHJldHVybiByZWFkZGlyU3luYyhleHBhbmRlZClcbiAgICAuZmlsdGVyKChmKSA9PiBmLmVuZHNXaXRoKFwiLm9yZ1wiKSAmJiAvXlxcZHs4fVRcXGR7Nn0tLS8udGVzdChmKSlcbiAgICAubWFwKChmKSA9PiBwYXJzZUZpbGVuYW1lKGpvaW4oZXhwYW5kZWQsIGYpKSlcbiAgICAuZmlsdGVyKChmKTogZiBpcyBEZW5vdGVGaWxlID0+IGYgIT09IG51bGwpXG4gICAgLnNvcnQoKGEsIGIpID0+IGIuaWRlbnRpZmllci5sb2NhbGVDb21wYXJlKGEuaWRlbnRpZmllcikpO1xufVxuXG4vKiogU2NhbiBhbGwgdW5pcXVlIHRhZ3MgZnJvbSBmaWxldGFncyBoZWFkZXJzIGFjcm9zcyBkaXJlY3RvcmllcyAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNjYW5UYWdzKGRpcnM6IHN0cmluZ1tdKTogc3RyaW5nW10ge1xuICBjb25zdCB0YWdzID0gbmV3IFNldDxzdHJpbmc+KCk7XG4gIGZvciAoY29uc3QgZGlyIG9mIGRpcnMpIHtcbiAgICBjb25zdCBleHBhbmRlZCA9IGV4cGFuZFBhdGgoZGlyKTtcbiAgICBpZiAoIWV4aXN0c1N5bmMoZXhwYW5kZWQpKSBjb250aW51ZTtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgb3V0cHV0ID0gZXhlY1N5bmMoYHJnIC0tbm8tZmlsZW5hbWUgLW9QICcoPzw9OilbXjpdKyg/PTopJyAtZyAnKi5vcmcnIC0tbm8tbGluZS1udW1iZXIgXCIke2V4cGFuZGVkfVwiYCwge1xuICAgICAgICBlbmNvZGluZzogXCJ1dGYtOFwiLFxuICAgICAgICB0aW1lb3V0OiA1MDAwLFxuICAgICAgfSk7XG4gICAgICBvdXRwdXRcbiAgICAgICAgLnNwbGl0KFwiXFxuXCIpXG4gICAgICAgIC5maWx0ZXIoQm9vbGVhbilcbiAgICAgICAgLmZvckVhY2goKHQpID0+IHRhZ3MuYWRkKHQudHJpbSgpKSk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyByZyByZXR1cm5zIGV4aXQgMSBpZiBubyBtYXRjaGVzXG4gICAgfVxuICB9XG4gIHJldHVybiBbLi4udGFnc10uc29ydCgpO1xufVxuXG4vKiogU2VhcmNoIG5vdGVzIHdpdGggcmlwZ3JlcCwgcmV0dXJuIG1hdGNoaW5nIGZpbGUgcGF0aHMgKi9cbmV4cG9ydCBmdW5jdGlvbiBzZWFyY2hOb3RlcyhkaXJzOiBzdHJpbmdbXSwgcXVlcnk6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgaWYgKCFxdWVyeS50cmltKCkpIHJldHVybiBbXTtcbiAgY29uc3QgcGF0aHMgPSBkaXJzLm1hcChleHBhbmRQYXRoKS5maWx0ZXIoZXhpc3RzU3luYyk7XG4gIGlmIChwYXRocy5sZW5ndGggPT09IDApIHJldHVybiBbXTtcbiAgdHJ5IHtcbiAgICBjb25zdCBlc2NhcGVkUXVlcnkgPSBxdWVyeS5yZXBsYWNlKC9bJ1wiXFxcXF0vZywgXCJcXFxcJCZcIik7XG4gICAgY29uc3Qgb3V0cHV0ID0gZXhlY1N5bmMoXG4gICAgICBgcmcgLWwgLWkgLS1nbG9iICcqLm9yZycgXCIke2VzY2FwZWRRdWVyeX1cIiAke3BhdGhzLm1hcCgocCkgPT4gYFwiJHtwfVwiYCkuam9pbihcIiBcIil9YCxcbiAgICAgIHsgZW5jb2Rpbmc6IFwidXRmLThcIiwgdGltZW91dDogMTAwMDAgfSxcbiAgICApO1xuICAgIHJldHVybiBvdXRwdXQuc3BsaXQoXCJcXG5cIikuZmlsdGVyKEJvb2xlYW4pO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gW107XG4gIH1cbn1cblxuLyoqIFJlYWQgdGhlIHRpdGxlIGZyb20gIyt0aXRsZTogaGVhZGVyLCBmYWxsaW5nIGJhY2sgdG8gZmlsZW5hbWUgc2x1ZyAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRUaXRsZShmaWxlcGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBoZWFkID0gcmVhZEZpbGVTeW5jKGZpbGVwYXRoLCBcInV0Zi04XCIpLnNsaWNlKDAsIDUwMCk7XG4gICAgY29uc3QgbWF0Y2ggPSBoZWFkLm1hdGNoKC9eI1xcK3RpdGxlOlxccyooLispJC9tKTtcbiAgICBpZiAobWF0Y2gpIHJldHVybiBtYXRjaFsxXS50cmltKCk7XG4gIH0gY2F0Y2gge1xuICAgIC8vIGZhbGwgdGhyb3VnaFxuICB9XG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlRmlsZW5hbWUoZmlsZXBhdGgpO1xuICByZXR1cm4gcGFyc2VkID8gcGFyc2VkLnRpdGxlIDogYmFzZW5hbWUoZmlsZXBhdGgsIFwiLm9yZ1wiKTtcbn1cblxuLyoqIE9wZW4gYSBmaWxlIGluIHRoZSBjb25maWd1cmVkIGVkaXRvciAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9wZW5JbkVkaXRvcihlZGl0b3JDbWQ6IHN0cmluZywgZmlsZXBhdGg6IHN0cmluZyk6IHZvaWQge1xuICBleGVjU3luYyhgJHtlZGl0b3JDbWR9IFwiJHtmaWxlcGF0aH1cImAsIHsgdGltZW91dDogNTAwMCB9KTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQUFpRjtBQUNqRixtQkFBaUQ7OztBQ0RqRCwyQkFBeUI7QUFDekIsZ0JBQWdGO0FBQ2hGLGtCQUErQjtBQUMvQixnQkFBd0I7QUFHakIsU0FBUyxXQUFXLEdBQW1CO0FB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
