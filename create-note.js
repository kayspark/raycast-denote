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

// src/create-note.tsx
var create_note_exports = {};
__export(create_note_exports, {
  default: () => CreateNote
});
module.exports = __toCommonJS(create_note_exports);
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
function generateIdentifier(date = /* @__PURE__ */ new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}
function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
function formatOrgDate(date = /* @__PURE__ */ new Date()) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const pad = (n) => String(n).padStart(2, "0");
  return `[${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${days[date.getDay()]}]`;
}
function createNote(dir, title, tags, content = "") {
  const expanded = expandPath(dir);
  if (!(0, import_fs.existsSync)(expanded)) (0, import_fs.mkdirSync)(expanded, { recursive: true });
  const now = /* @__PURE__ */ new Date();
  const id = generateIdentifier(now);
  const slug = slugify(title);
  const tagSuffix = tags.length > 0 ? `__${tags.join("_")}` : "";
  const filename = `${id}--${slug}${tagSuffix}.org`;
  const filepath = (0, import_path.join)(expanded, filename);
  const tagLine = tags.length > 0 ? `:${tags.join(":")}:` : "";
  let body = `#+title:      ${title}
`;
  body += `#+date:       ${formatOrgDate(now)}
`;
  body += `#+identifier: ${id}
`;
  if (tagLine) body += `#+filetags:   ${tagLine}
`;
  body += `
`;
  if (content) body += `${content}
`;
  (0, import_fs.writeFileSync)(filepath, body, "utf-8");
  return filepath;
}
function scanTags(dirs) {
  const tags = /* @__PURE__ */ new Set();
  for (const dir of dirs) {
    const expanded = expandPath(dir);
    if (!(0, import_fs.existsSync)(expanded)) continue;
    try {
      const output = (0, import_child_process.execSync)(
        `rg --no-filename --no-line-number -oP '^#\\+filetags:\\s*\\K.+' -g '*.org' "${expanded}"`,
        { encoding: "utf-8", timeout: 5e3 }
      );
      for (const line of output.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        for (const t of trimmed.split(":")) {
          const tag = t.trim();
          if (tag) tags.add(tag);
        }
      }
    } catch {
    }
  }
  return [...tags].sort();
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

// src/create-note.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function CreateNote() {
  const prefs = (0, import_api.getPreferenceValues)();
  const [tags, setTags] = (0, import_react.useState)([]);
  (0, import_react.useEffect)(() => {
    const dirs = [prefs.notesDir, `${prefs.papersDir}/notes`].map(expandPath);
    setTags(scanTags(dirs));
  }, []);
  async function handleSubmit(values) {
    if (!values.title.trim()) {
      await (0, import_api.showToast)({ style: import_api.Toast.Style.Failure, title: "Title is required" });
      return;
    }
    try {
      const filepath = createNote(values.directory, values.title, values.tags, values.content);
      try {
        openInEditor(prefs.editorCmd, filepath);
      } catch {
      }
      await (0, import_api.showToast)({ style: import_api.Toast.Style.Success, title: "Note created", message: values.title });
    } catch (error) {
      await (0, import_api.showToast)({ style: import_api.Toast.Style.Failure, title: "Failed to create note", message: String(error) });
    }
  }
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(
    import_api.Form,
    {
      actions: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.ActionPanel, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.Action.SubmitForm, { title: "Create Note", onSubmit: handleSubmit }) }),
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.Form.TextField, { id: "title", title: "Title", placeholder: "Note title..." }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.Form.TagPicker, { id: "tags", title: "Tags", children: tags.map((tag) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.Form.TagPicker.Item, { value: tag, title: tag }, tag)) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.Form.TextArea, { id: "content", title: "Content", placeholder: "Note content (optional)..." }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_api.Form.Dropdown, { id: "directory", title: "Directory", defaultValue: prefs.notesDir, children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.Form.Dropdown.Item, { value: prefs.notesDir, title: "Notes" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.Form.Dropdown.Item, { value: `${prefs.papersDir}/notes`, title: "Paper Notes" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_api.Form.Dropdown.Item, { value: expandPath("~/org/meeting"), title: "Meeting" })
        ] })
      ]
    }
  );
}
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLmRvdGZpbGVzLy5jb25maWcvcmF5Y2FzdC9leHRlbnNpb25zL3JheWNhc3QtZGVub3RlL3NyYy9jcmVhdGUtbm90ZS50c3giLCAiLi4vLi4vLi4vLi4vLmRvdGZpbGVzLy5jb25maWcvcmF5Y2FzdC9leHRlbnNpb25zL3JheWNhc3QtZGVub3RlL3NyYy91dGlscy9kZW5vdGUudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IEFjdGlvbiwgQWN0aW9uUGFuZWwsIEZvcm0sIGdldFByZWZlcmVuY2VWYWx1ZXMsIHNob3dUb2FzdCwgVG9hc3QgfSBmcm9tIFwiQHJheWNhc3QvYXBpXCI7XG5pbXBvcnQgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0IH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBjcmVhdGVOb3RlLCBzY2FuVGFncywgZXhwYW5kUGF0aCwgb3BlbkluRWRpdG9yIH0gZnJvbSBcIi4vdXRpbHMvZGVub3RlXCI7XG5cbmludGVyZmFjZSBQcmVmZXJlbmNlcyB7XG4gIG5vdGVzRGlyOiBzdHJpbmc7XG4gIHBhcGVyc0Rpcjogc3RyaW5nO1xuICBlZGl0b3JDbWQ6IHN0cmluZztcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gQ3JlYXRlTm90ZSgpIHtcbiAgY29uc3QgcHJlZnMgPSBnZXRQcmVmZXJlbmNlVmFsdWVzPFByZWZlcmVuY2VzPigpO1xuICBjb25zdCBbdGFncywgc2V0VGFnc10gPSB1c2VTdGF0ZTxzdHJpbmdbXT4oW10pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgZGlycyA9IFtwcmVmcy5ub3Rlc0RpciwgYCR7cHJlZnMucGFwZXJzRGlyfS9ub3Rlc2BdLm1hcChleHBhbmRQYXRoKTtcbiAgICBzZXRUYWdzKHNjYW5UYWdzKGRpcnMpKTtcbiAgfSwgW10pO1xuXG4gIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZVN1Ym1pdCh2YWx1ZXM6IHsgdGl0bGU6IHN0cmluZzsgdGFnczogc3RyaW5nW107IGNvbnRlbnQ6IHN0cmluZzsgZGlyZWN0b3J5OiBzdHJpbmcgfSkge1xuICAgIGlmICghdmFsdWVzLnRpdGxlLnRyaW0oKSkge1xuICAgICAgYXdhaXQgc2hvd1RvYXN0KHsgc3R5bGU6IFRvYXN0LlN0eWxlLkZhaWx1cmUsIHRpdGxlOiBcIlRpdGxlIGlzIHJlcXVpcmVkXCIgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBmaWxlcGF0aCA9IGNyZWF0ZU5vdGUodmFsdWVzLmRpcmVjdG9yeSwgdmFsdWVzLnRpdGxlLCB2YWx1ZXMudGFncywgdmFsdWVzLmNvbnRlbnQpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgb3BlbkluRWRpdG9yKHByZWZzLmVkaXRvckNtZCwgZmlsZXBhdGgpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIEVkaXRvciBvcGVuIGZhaWxlZCBcdTIwMTQgbm90ZSBzdGlsbCBjcmVhdGVkXG4gICAgICB9XG4gICAgICBhd2FpdCBzaG93VG9hc3QoeyBzdHlsZTogVG9hc3QuU3R5bGUuU3VjY2VzcywgdGl0bGU6IFwiTm90ZSBjcmVhdGVkXCIsIG1lc3NhZ2U6IHZhbHVlcy50aXRsZSB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgYXdhaXQgc2hvd1RvYXN0KHsgc3R5bGU6IFRvYXN0LlN0eWxlLkZhaWx1cmUsIHRpdGxlOiBcIkZhaWxlZCB0byBjcmVhdGUgbm90ZVwiLCBtZXNzYWdlOiBTdHJpbmcoZXJyb3IpIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPEZvcm1cbiAgICAgIGFjdGlvbnM9e1xuICAgICAgICA8QWN0aW9uUGFuZWw+XG4gICAgICAgICAgPEFjdGlvbi5TdWJtaXRGb3JtIHRpdGxlPVwiQ3JlYXRlIE5vdGVcIiBvblN1Ym1pdD17aGFuZGxlU3VibWl0fSAvPlxuICAgICAgICA8L0FjdGlvblBhbmVsPlxuICAgICAgfVxuICAgID5cbiAgICAgIDxGb3JtLlRleHRGaWVsZCBpZD1cInRpdGxlXCIgdGl0bGU9XCJUaXRsZVwiIHBsYWNlaG9sZGVyPVwiTm90ZSB0aXRsZS4uLlwiIC8+XG4gICAgICA8Rm9ybS5UYWdQaWNrZXIgaWQ9XCJ0YWdzXCIgdGl0bGU9XCJUYWdzXCI+XG4gICAgICAgIHt0YWdzLm1hcCgodGFnKSA9PiAoXG4gICAgICAgICAgPEZvcm0uVGFnUGlja2VyLkl0ZW0ga2V5PXt0YWd9IHZhbHVlPXt0YWd9IHRpdGxlPXt0YWd9IC8+XG4gICAgICAgICkpfVxuICAgICAgPC9Gb3JtLlRhZ1BpY2tlcj5cbiAgICAgIDxGb3JtLlRleHRBcmVhIGlkPVwiY29udGVudFwiIHRpdGxlPVwiQ29udGVudFwiIHBsYWNlaG9sZGVyPVwiTm90ZSBjb250ZW50IChvcHRpb25hbCkuLi5cIiAvPlxuICAgICAgPEZvcm0uRHJvcGRvd24gaWQ9XCJkaXJlY3RvcnlcIiB0aXRsZT1cIkRpcmVjdG9yeVwiIGRlZmF1bHRWYWx1ZT17cHJlZnMubm90ZXNEaXJ9PlxuICAgICAgICA8Rm9ybS5Ecm9wZG93bi5JdGVtIHZhbHVlPXtwcmVmcy5ub3Rlc0Rpcn0gdGl0bGU9XCJOb3Rlc1wiIC8+XG4gICAgICAgIDxGb3JtLkRyb3Bkb3duLkl0ZW0gdmFsdWU9e2Ake3ByZWZzLnBhcGVyc0Rpcn0vbm90ZXNgfSB0aXRsZT1cIlBhcGVyIE5vdGVzXCIgLz5cbiAgICAgICAgPEZvcm0uRHJvcGRvd24uSXRlbSB2YWx1ZT17ZXhwYW5kUGF0aChcIn4vb3JnL21lZXRpbmdcIil9IHRpdGxlPVwiTWVldGluZ1wiIC8+XG4gICAgICA8L0Zvcm0uRHJvcGRvd24+XG4gICAgPC9Gb3JtPlxuICApO1xufVxuIiwgImltcG9ydCB7IGV4ZWNTeW5jLCBzcGF3biB9IGZyb20gXCJjaGlsZF9wcm9jZXNzXCI7XG5pbXBvcnQgeyByZWFkZGlyU3luYywgcmVhZEZpbGVTeW5jLCB3cml0ZUZpbGVTeW5jLCBta2RpclN5bmMsIGV4aXN0c1N5bmMgfSBmcm9tIFwiZnNcIjtcbmltcG9ydCB7IGpvaW4sIGJhc2VuYW1lIH0gZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGhvbWVkaXIgfSBmcm9tIFwib3NcIjtcblxuLyoqIEV4cGFuZCB+IHRvIGhvbWUgZGlyZWN0b3J5ICovXG5leHBvcnQgZnVuY3Rpb24gZXhwYW5kUGF0aChwOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gcC5zdGFydHNXaXRoKFwiflwiKSA/IHAucmVwbGFjZShcIn5cIiwgaG9tZWRpcigpKSA6IHA7XG59XG5cbi8qKiBHZW5lcmF0ZSBkZW5vdGUgaWRlbnRpZmllcjogWVlZWU1NRERUSEhNTVNTICovXG5leHBvcnQgZnVuY3Rpb24gZ2VuZXJhdGVJZGVudGlmaWVyKGRhdGU6IERhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHtcbiAgY29uc3QgcGFkID0gKG46IG51bWJlcikgPT4gU3RyaW5nKG4pLnBhZFN0YXJ0KDIsIFwiMFwiKTtcbiAgcmV0dXJuIChcbiAgICBgJHtkYXRlLmdldEZ1bGxZZWFyKCl9JHtwYWQoZGF0ZS5nZXRNb250aCgpICsgMSl9JHtwYWQoZGF0ZS5nZXREYXRlKCkpfWAgK1xuICAgIGBUJHtwYWQoZGF0ZS5nZXRIb3VycygpKX0ke3BhZChkYXRlLmdldE1pbnV0ZXMoKSl9JHtwYWQoZGF0ZS5nZXRTZWNvbmRzKCkpfWBcbiAgKTtcbn1cblxuLyoqIFNsdWdpZnkgdGl0bGUgZm9yIGRlbm90ZSBmaWxlbmFtZTogbG93ZXJjYXNlLCBzcGFjZXMgdG8gaHlwaGVucywgc3RyaXAgc3BlY2lhbCBjaGFycyAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNsdWdpZnkodGl0bGU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiB0aXRsZVxuICAgIC50b0xvd2VyQ2FzZSgpXG4gICAgLnJlcGxhY2UoL1teYS16MC05XFxzLV0vZywgXCJcIilcbiAgICAucmVwbGFjZSgvXFxzKy9nLCBcIi1cIilcbiAgICAucmVwbGFjZSgvLSsvZywgXCItXCIpXG4gICAgLnJlcGxhY2UoL14tfC0kL2csIFwiXCIpO1xufVxuXG4vKiogRm9ybWF0IGRhdGUgZm9yIG9yZyBmcm9udCBtYXR0ZXI6IFtZWVlZLU1NLUREIERheV0gKi9cbmV4cG9ydCBmdW5jdGlvbiBmb3JtYXRPcmdEYXRlKGRhdGU6IERhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHtcbiAgY29uc3QgZGF5cyA9IFtcIlN1blwiLCBcIk1vblwiLCBcIlR1ZVwiLCBcIldlZFwiLCBcIlRodVwiLCBcIkZyaVwiLCBcIlNhdFwiXTtcbiAgY29uc3QgcGFkID0gKG46IG51bWJlcikgPT4gU3RyaW5nKG4pLnBhZFN0YXJ0KDIsIFwiMFwiKTtcbiAgcmV0dXJuIGBbJHtkYXRlLmdldEZ1bGxZZWFyKCl9LSR7cGFkKGRhdGUuZ2V0TW9udGgoKSArIDEpfS0ke3BhZChkYXRlLmdldERhdGUoKSl9ICR7ZGF5c1tkYXRlLmdldERheSgpXX1dYDtcbn1cblxuLyoqIEJ1aWxkIGRlbm90ZSBmaWxlbmFtZSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJ1aWxkRmlsZW5hbWUodGl0bGU6IHN0cmluZywgdGFnczogc3RyaW5nW10sIGRhdGU6IERhdGUgPSBuZXcgRGF0ZSgpKTogc3RyaW5nIHtcbiAgY29uc3QgaWQgPSBnZW5lcmF0ZUlkZW50aWZpZXIoZGF0ZSk7XG4gIGNvbnN0IHNsdWcgPSBzbHVnaWZ5KHRpdGxlKTtcbiAgY29uc3QgdGFnU3VmZml4ID0gdGFncy5sZW5ndGggPiAwID8gYF9fJHt0YWdzLmpvaW4oXCJfXCIpfWAgOiBcIlwiO1xuICByZXR1cm4gYCR7aWR9LS0ke3NsdWd9JHt0YWdTdWZmaXh9Lm9yZ2A7XG59XG5cbi8qKiBCdWlsZCBvcmcgZnJvbnQgbWF0dGVyICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGcm9udE1hdHRlcih0aXRsZTogc3RyaW5nLCB0YWdzOiBzdHJpbmdbXSwgY29udGVudDogc3RyaW5nID0gXCJcIik6IHN0cmluZyB7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IGlkID0gZ2VuZXJhdGVJZGVudGlmaWVyKG5vdyk7XG4gIGNvbnN0IHRhZ0xpbmUgPSB0YWdzLmxlbmd0aCA+IDAgPyBgOiR7dGFncy5qb2luKFwiOlwiKX06YCA6IFwiXCI7XG4gIGxldCB0ZXh0ID0gYCMrdGl0bGU6ICAgICAgJHt0aXRsZX1cXG5gO1xuICB0ZXh0ICs9IGAjK2RhdGU6ICAgICAgICR7Zm9ybWF0T3JnRGF0ZShub3cpfVxcbmA7XG4gIHRleHQgKz0gYCMraWRlbnRpZmllcjogJHtpZH1cXG5gO1xuICBpZiAodGFnTGluZSkgdGV4dCArPSBgIytmaWxldGFnczogICAke3RhZ0xpbmV9XFxuYDtcbiAgdGV4dCArPSBgXFxuYDtcbiAgaWYgKGNvbnRlbnQpIHRleHQgKz0gYCR7Y29udGVudH1cXG5gO1xuICByZXR1cm4gdGV4dDtcbn1cblxuLyoqIENyZWF0ZSBhIGRlbm90ZSBub3RlIGZpbGUsIHJldHVybiBmdWxsIHBhdGggKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOb3RlKGRpcjogc3RyaW5nLCB0aXRsZTogc3RyaW5nLCB0YWdzOiBzdHJpbmdbXSwgY29udGVudDogc3RyaW5nID0gXCJcIik6IHN0cmluZyB7XG4gIGNvbnN0IGV4cGFuZGVkID0gZXhwYW5kUGF0aChkaXIpO1xuICBpZiAoIWV4aXN0c1N5bmMoZXhwYW5kZWQpKSBta2RpclN5bmMoZXhwYW5kZWQsIHsgcmVjdXJzaXZlOiB0cnVlIH0pO1xuICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xuICBjb25zdCBpZCA9IGdlbmVyYXRlSWRlbnRpZmllcihub3cpO1xuICBjb25zdCBzbHVnID0gc2x1Z2lmeSh0aXRsZSk7XG4gIGNvbnN0IHRhZ1N1ZmZpeCA9IHRhZ3MubGVuZ3RoID4gMCA/IGBfXyR7dGFncy5qb2luKFwiX1wiKX1gIDogXCJcIjtcbiAgY29uc3QgZmlsZW5hbWUgPSBgJHtpZH0tLSR7c2x1Z30ke3RhZ1N1ZmZpeH0ub3JnYDtcbiAgY29uc3QgZmlsZXBhdGggPSBqb2luKGV4cGFuZGVkLCBmaWxlbmFtZSk7XG4gIGNvbnN0IHRhZ0xpbmUgPSB0YWdzLmxlbmd0aCA+IDAgPyBgOiR7dGFncy5qb2luKFwiOlwiKX06YCA6IFwiXCI7XG4gIGxldCBib2R5ID0gYCMrdGl0bGU6ICAgICAgJHt0aXRsZX1cXG5gO1xuICBib2R5ICs9IGAjK2RhdGU6ICAgICAgICR7Zm9ybWF0T3JnRGF0ZShub3cpfVxcbmA7XG4gIGJvZHkgKz0gYCMraWRlbnRpZmllcjogJHtpZH1cXG5gO1xuICBpZiAodGFnTGluZSkgYm9keSArPSBgIytmaWxldGFnczogICAke3RhZ0xpbmV9XFxuYDtcbiAgYm9keSArPSBgXFxuYDtcbiAgaWYgKGNvbnRlbnQpIGJvZHkgKz0gYCR7Y29udGVudH1cXG5gO1xuICB3cml0ZUZpbGVTeW5jKGZpbGVwYXRoLCBib2R5LCBcInV0Zi04XCIpO1xuICByZXR1cm4gZmlsZXBhdGg7XG59XG5cbi8qKiBQYXJzZSBkZW5vdGUgZmlsZW5hbWUgaW50byBjb21wb25lbnRzICovXG5leHBvcnQgaW50ZXJmYWNlIERlbm90ZUZpbGUge1xuICBwYXRoOiBzdHJpbmc7XG4gIGlkZW50aWZpZXI6IHN0cmluZztcbiAgdGl0bGU6IHN0cmluZztcbiAgdGFnczogc3RyaW5nW107XG4gIGRhdGU6IHN0cmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRmlsZW5hbWUoZmlsZXBhdGg6IHN0cmluZyk6IERlbm90ZUZpbGUgfCBudWxsIHtcbiAgY29uc3QgbmFtZSA9IGJhc2VuYW1lKGZpbGVwYXRoLCBcIi5vcmdcIik7XG4gIGNvbnN0IG1hdGNoID0gbmFtZS5tYXRjaCgvXihcXGR7OH1UXFxkezZ9KS0tKC4rPykoPzpfXyguKykpPyQvKTtcbiAgaWYgKCFtYXRjaCkgcmV0dXJuIG51bGw7XG4gIGNvbnN0IFssIGlkZW50aWZpZXIsIHNsdWcsIHRhZ1N0cl0gPSBtYXRjaDtcbiAgcmV0dXJuIHtcbiAgICBwYXRoOiBmaWxlcGF0aCxcbiAgICBpZGVudGlmaWVyLFxuICAgIHRpdGxlOiBzbHVnLnJlcGxhY2UoLy0vZywgXCIgXCIpLFxuICAgIHRhZ3M6IHRhZ1N0ciA/IHRhZ1N0ci5zcGxpdChcIl9cIikgOiBbXSxcbiAgICBkYXRlOiBgJHtpZGVudGlmaWVyLnNsaWNlKDAsIDQpfS0ke2lkZW50aWZpZXIuc2xpY2UoNCwgNil9LSR7aWRlbnRpZmllci5zbGljZSg2LCA4KX1gLFxuICB9O1xufVxuXG4vKiogU2NhbiBhbGwgZGVub3RlIGZpbGVzIGluIGEgZGlyZWN0b3J5ICovXG5leHBvcnQgZnVuY3Rpb24gc2Nhbk5vdGVzKGRpcjogc3RyaW5nKTogRGVub3RlRmlsZVtdIHtcbiAgY29uc3QgZXhwYW5kZWQgPSBleHBhbmRQYXRoKGRpcik7XG4gIGlmICghZXhpc3RzU3luYyhleHBhbmRlZCkpIHJldHVybiBbXTtcbiAgcmV0dXJuIHJlYWRkaXJTeW5jKGV4cGFuZGVkKVxuICAgIC5maWx0ZXIoKGYpID0+IGYuZW5kc1dpdGgoXCIub3JnXCIpICYmIC9eXFxkezh9VFxcZHs2fS0tLy50ZXN0KGYpKVxuICAgIC5tYXAoKGYpID0+IHBhcnNlRmlsZW5hbWUoam9pbihleHBhbmRlZCwgZikpKVxuICAgIC5maWx0ZXIoKGYpOiBmIGlzIERlbm90ZUZpbGUgPT4gZiAhPT0gbnVsbClcbiAgICAuc29ydCgoYSwgYikgPT4gYi5pZGVudGlmaWVyLmxvY2FsZUNvbXBhcmUoYS5pZGVudGlmaWVyKSk7XG59XG5cbi8qKiBTY2FuIGFsbCB1bmlxdWUgdGFncyBmcm9tIGZpbGV0YWdzIGhlYWRlcnMgYWNyb3NzIGRpcmVjdG9yaWVzICovXG5leHBvcnQgZnVuY3Rpb24gc2NhblRhZ3MoZGlyczogc3RyaW5nW10pOiBzdHJpbmdbXSB7XG4gIGNvbnN0IHRhZ3MgPSBuZXcgU2V0PHN0cmluZz4oKTtcbiAgZm9yIChjb25zdCBkaXIgb2YgZGlycykge1xuICAgIGNvbnN0IGV4cGFuZGVkID0gZXhwYW5kUGF0aChkaXIpO1xuICAgIGlmICghZXhpc3RzU3luYyhleHBhbmRlZCkpIGNvbnRpbnVlO1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBvdXRwdXQgPSBleGVjU3luYyhcbiAgICAgICAgYHJnIC0tbm8tZmlsZW5hbWUgLS1uby1saW5lLW51bWJlciAtb1AgJ14jXFxcXCtmaWxldGFnczpcXFxccypcXFxcSy4rJyAtZyAnKi5vcmcnIFwiJHtleHBhbmRlZH1cImAsXG4gICAgICAgIHsgZW5jb2Rpbmc6IFwidXRmLThcIiwgdGltZW91dDogNTAwMCB9LFxuICAgICAgKTtcbiAgICAgIGZvciAoY29uc3QgbGluZSBvZiBvdXRwdXQuc3BsaXQoXCJcXG5cIikpIHtcbiAgICAgICAgY29uc3QgdHJpbW1lZCA9IGxpbmUudHJpbSgpO1xuICAgICAgICBpZiAoIXRyaW1tZWQpIGNvbnRpbnVlO1xuICAgICAgICAvLyBmaWxldGFncyBmb3JtYXQ6IDp0YWcxOnRhZzI6dGFnMzpcbiAgICAgICAgZm9yIChjb25zdCB0IG9mIHRyaW1tZWQuc3BsaXQoXCI6XCIpKSB7XG4gICAgICAgICAgY29uc3QgdGFnID0gdC50cmltKCk7XG4gICAgICAgICAgaWYgKHRhZykgdGFncy5hZGQodGFnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gcmcgcmV0dXJucyBleGl0IDEgaWYgbm8gbWF0Y2hlc1xuICAgIH1cbiAgfVxuICByZXR1cm4gWy4uLnRhZ3NdLnNvcnQoKTtcbn1cblxuLyoqIFNlYXJjaCBub3RlcyB3aXRoIHJpcGdyZXAsIHJldHVybiBtYXRjaGluZyBmaWxlIHBhdGhzICovXG5leHBvcnQgZnVuY3Rpb24gc2VhcmNoTm90ZXMoZGlyczogc3RyaW5nW10sIHF1ZXJ5OiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGlmICghcXVlcnkudHJpbSgpKSByZXR1cm4gW107XG4gIGNvbnN0IHBhdGhzID0gZGlycy5tYXAoZXhwYW5kUGF0aCkuZmlsdGVyKGV4aXN0c1N5bmMpO1xuICBpZiAocGF0aHMubGVuZ3RoID09PSAwKSByZXR1cm4gW107XG4gIHRyeSB7XG4gICAgY29uc3QgZXNjYXBlZFF1ZXJ5ID0gcXVlcnkucmVwbGFjZSgvWydcIlxcXFxdL2csIFwiXFxcXCQmXCIpO1xuICAgIGNvbnN0IG91dHB1dCA9IGV4ZWNTeW5jKFxuICAgICAgYHJnIC1sIC1pIC0tZ2xvYiAnKi5vcmcnIFwiJHtlc2NhcGVkUXVlcnl9XCIgJHtwYXRocy5tYXAoKHApID0+IGBcIiR7cH1cImApLmpvaW4oXCIgXCIpfWAsXG4gICAgICB7IGVuY29kaW5nOiBcInV0Zi04XCIsIHRpbWVvdXQ6IDEwMDAwIH0sXG4gICAgKTtcbiAgICByZXR1cm4gb3V0cHV0LnNwbGl0KFwiXFxuXCIpLmZpbHRlcihCb29sZWFuKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG59XG5cbi8qKiBSZWFkIHRoZSB0aXRsZSBmcm9tICMrdGl0bGU6IGhlYWRlciwgZmFsbGluZyBiYWNrIHRvIGZpbGVuYW1lIHNsdWcgKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkVGl0bGUoZmlsZXBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIHRyeSB7XG4gICAgY29uc3QgaGVhZCA9IHJlYWRGaWxlU3luYyhmaWxlcGF0aCwgXCJ1dGYtOFwiKS5zbGljZSgwLCA1MDApO1xuICAgIGNvbnN0IG1hdGNoID0gaGVhZC5tYXRjaCgvXiNcXCt0aXRsZTpcXHMqKC4rKSQvbSk7XG4gICAgaWYgKG1hdGNoKSByZXR1cm4gbWF0Y2hbMV0udHJpbSgpO1xuICB9IGNhdGNoIHtcbiAgICAvLyBmYWxsIHRocm91Z2hcbiAgfVxuICBjb25zdCBwYXJzZWQgPSBwYXJzZUZpbGVuYW1lKGZpbGVwYXRoKTtcbiAgcmV0dXJuIHBhcnNlZCA/IHBhcnNlZC50aXRsZSA6IGJhc2VuYW1lKGZpbGVwYXRoLCBcIi5vcmdcIik7XG59XG5cbi8qKiBTZWFyY2ggY29tbW9uIGVtYWNzY2xpZW50IGxvY2F0aW9ucyAoTWFjUG9ydHMsIEhvbWVicmV3LCBFbWFjcy5hcHAsIExpbnV4KSAqL1xuZnVuY3Rpb24gZmluZEVtYWNzY2xpZW50KCk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBjYW5kaWRhdGVzID0gW1xuICAgIFwiL0FwcGxpY2F0aW9ucy9NYWNQb3J0cy9FbWFjcy5hcHAvQ29udGVudHMvTWFjT1MvYmluL2VtYWNzY2xpZW50XCIsICAvLyBNYWNQb3J0c1xuICAgIFwiL0FwcGxpY2F0aW9ucy9FbWFjcy5hcHAvQ29udGVudHMvTWFjT1MvYmluL2VtYWNzY2xpZW50XCIsICAgICAgICAgICAvLyBFbWFjcyBmb3IgTWFjIE9TIFhcbiAgICBcIi9vcHQvaG9tZWJyZXcvYmluL2VtYWNzY2xpZW50XCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhvbWVicmV3IEFSTVxuICAgIFwiL3Vzci9sb2NhbC9iaW4vZW1hY3NjbGllbnRcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSG9tZWJyZXcgSW50ZWwgLyBMaW51eFxuICAgIFwiL29wdC9sb2NhbC9iaW4vZW1hY3NjbGllbnRcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWFjUG9ydHMgQ0xJXG4gICAgXCIvdXNyL2Jpbi9lbWFjc2NsaWVudFwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBMaW51eCBzeXN0ZW1cbiAgICBcIi9zbmFwL2Jpbi9lbWFjc2NsaWVudFwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNuYXBcbiAgXTtcbiAgcmV0dXJuIGNhbmRpZGF0ZXMuZmluZCgocCkgPT4gZXhpc3RzU3luYyhwKSkgfHwgbnVsbDtcbn1cblxuLyoqIEZpbmQgRW1hY3Mgc2VydmVyIHNvY2tldCBpbiBjb21tb24gbG9jYXRpb25zICovXG5mdW5jdGlvbiBmaW5kU29ja2V0KCk6IHN0cmluZyB8IG51bGwge1xuICBjb25zdCBjYW5kaWRhdGVzID0gW1xuICAgIGpvaW4oaG9tZWRpcigpLCBcIi5jb25maWdcIiwgXCJlbWFjc1wiLCBcInNlcnZlclwiLCBcInNlcnZlclwiKSwgICAgICAgICAgICAgLy8gWERHIGN1c3RvbVxuICAgIGpvaW4oaG9tZWRpcigpLCBcIi5lbWFjcy5kXCIsIFwic2VydmVyXCIsIFwic2VydmVyXCIpLCAgICAgICAgICAgICAgICAgICAgIC8vIFRyYWRpdGlvbmFsXG4gICAgYC90bXAvZW1hY3Mke3Byb2Nlc3MuZ2V0dWlkPy4oKSA/PyA1MDF9L3NlcnZlcmAsICAgICAgICAgICAgICAgICAgICAgLy8gRGVmYXVsdCAobWFjT1MvTGludXgpXG4gIF07XG4gIHJldHVybiBjYW5kaWRhdGVzLmZpbmQoKHApID0+IGV4aXN0c1N5bmMocCkpIHx8IG51bGw7XG59XG5cbi8qKiBSZXNvbHZlIGVtYWNzY2xpZW50OiBmaW5kIGZ1bGwgcGF0aCArIGFkZCBzb2NrZXQtbmFtZSBpZiBuZWVkZWQgKi9cbmZ1bmN0aW9uIHJlc29sdmVFZGl0b3JDbWQoZWRpdG9yQ21kOiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgY21kID0gZWRpdG9yQ21kO1xuICAvLyBJZiBiYXJlIFwiZW1hY3NjbGllbnRcIiwgcmVzb2x2ZSB0byBmdWxsIHBhdGhcbiAgaWYgKGNtZC5zdGFydHNXaXRoKFwiZW1hY3NjbGllbnQgXCIpIHx8IGNtZCA9PT0gXCJlbWFjc2NsaWVudFwiKSB7XG4gICAgY29uc3QgZnVsbFBhdGggPSBmaW5kRW1hY3NjbGllbnQoKTtcbiAgICBpZiAoZnVsbFBhdGgpIGNtZCA9IGNtZC5yZXBsYWNlKC9eZW1hY3NjbGllbnQvLCBmdWxsUGF0aCk7XG4gIH1cbiAgLy8gQWRkIC0tc29ja2V0LW5hbWUgaWYgZW1hY3NjbGllbnQgaXMgdXNlZCBidXQgc29ja2V0IGlzbid0IHNwZWNpZmllZFxuICBpZiAoY21kLmluY2x1ZGVzKFwiZW1hY3NjbGllbnRcIikgJiYgIWNtZC5pbmNsdWRlcyhcIi0tc29ja2V0LW5hbWVcIikpIHtcbiAgICBjb25zdCBzb2NrZXRQYXRoID0gZmluZFNvY2tldCgpO1xuICAgIGlmIChzb2NrZXRQYXRoKSBjbWQgKz0gYCAtLXNvY2tldC1uYW1lPSR7c29ja2V0UGF0aH1gO1xuICB9XG4gIHJldHVybiBjbWQ7XG59XG5cbi8qKiBPcGVuIGEgZmlsZSBpbiB0aGUgY29uZmlndXJlZCBlZGl0b3IgKGZpcmUtYW5kLWZvcmdldCwgbmV2ZXIgYmxvY2tzKSAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9wZW5JbkVkaXRvcihlZGl0b3JDbWQ6IHN0cmluZywgZmlsZXBhdGg6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCBQQVRIID0gW1xuICAgIFwiL0FwcGxpY2F0aW9ucy9NYWNQb3J0cy9FbWFjcy5hcHAvQ29udGVudHMvTWFjT1MvYmluXCIsXG4gICAgXCIvQXBwbGljYXRpb25zL0VtYWNzLmFwcC9Db250ZW50cy9NYWNPUy9iaW5cIixcbiAgICBcIi9vcHQvaG9tZWJyZXcvYmluXCIsXG4gICAgXCIvb3B0L2xvY2FsL2JpblwiLFxuICAgIFwiL3Vzci9sb2NhbC9iaW5cIixcbiAgICBwcm9jZXNzLmVudi5QQVRIIHx8IFwiXCIsXG4gIF0uam9pbihcIjpcIik7XG4gIGNvbnN0IHJlc29sdmVkID0gcmVzb2x2ZUVkaXRvckNtZChlZGl0b3JDbWQpO1xuICBjb25zdCBjaGlsZCA9IHNwYXduKFwiL2Jpbi9zaFwiLCBbXCItY1wiLCBgJHtyZXNvbHZlZH0gXCIke2ZpbGVwYXRofVwiYF0sIHtcbiAgICBkZXRhY2hlZDogdHJ1ZSxcbiAgICBzdGRpbzogXCJpZ25vcmVcIixcbiAgICBlbnY6IHsgLi4ucHJvY2Vzcy5lbnYsIFBBVEggfSxcbiAgfSk7XG4gIGNoaWxkLnVucmVmKCk7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFBaUY7QUFDakYsbUJBQW9DOzs7QUNEcEMsMkJBQWdDO0FBQ2hDLGdCQUFnRjtBQUNoRixrQkFBK0I7QUFDL0IsZ0JBQXdCO0FBR2pCLFNBQVMsV0FBVyxHQUFtQjtBQUM1QyxTQUFPLEVBQUUsV0FBVyxHQUFHLElBQUksRUFBRSxRQUFRLFNBQUssbUJB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
