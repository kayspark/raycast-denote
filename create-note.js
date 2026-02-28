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
  (0, import_child_process.execSync)(`${resolved} "${filepath}"`, { timeout: 5e3, env: { ...process.env, PATH } });
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLmRvdGZpbGVzLy5jb25maWcvcmF5Y2FzdC9leHRlbnNpb25zL3JheWNhc3QtZGVub3RlL3NyYy9jcmVhdGUtbm90ZS50c3giLCAiLi4vLi4vLi4vLi4vLmRvdGZpbGVzLy5jb25maWcvcmF5Y2FzdC9leHRlbnNpb25zL3JheWNhc3QtZGVub3RlL3NyYy91dGlscy9kZW5vdGUudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IEFjdGlvbiwgQWN0aW9uUGFuZWwsIEZvcm0sIGdldFByZWZlcmVuY2VWYWx1ZXMsIHNob3dUb2FzdCwgVG9hc3QgfSBmcm9tIFwiQHJheWNhc3QvYXBpXCI7XG5pbXBvcnQgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0IH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBjcmVhdGVOb3RlLCBzY2FuVGFncywgZXhwYW5kUGF0aCwgb3BlbkluRWRpdG9yIH0gZnJvbSBcIi4vdXRpbHMvZGVub3RlXCI7XG5cbmludGVyZmFjZSBQcmVmZXJlbmNlcyB7XG4gIG5vdGVzRGlyOiBzdHJpbmc7XG4gIHBhcGVyc0Rpcjogc3RyaW5nO1xuICBlZGl0b3JDbWQ6IHN0cmluZztcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gQ3JlYXRlTm90ZSgpIHtcbiAgY29uc3QgcHJlZnMgPSBnZXRQcmVmZXJlbmNlVmFsdWVzPFByZWZlcmVuY2VzPigpO1xuICBjb25zdCBbdGFncywgc2V0VGFnc10gPSB1c2VTdGF0ZTxzdHJpbmdbXT4oW10pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgZGlycyA9IFtwcmVmcy5ub3Rlc0RpciwgYCR7cHJlZnMucGFwZXJzRGlyfS9ub3Rlc2BdLm1hcChleHBhbmRQYXRoKTtcbiAgICBzZXRUYWdzKHNjYW5UYWdzKGRpcnMpKTtcbiAgfSwgW10pO1xuXG4gIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZVN1Ym1pdCh2YWx1ZXM6IHsgdGl0bGU6IHN0cmluZzsgdGFnczogc3RyaW5nW107IGNvbnRlbnQ6IHN0cmluZzsgZGlyZWN0b3J5OiBzdHJpbmcgfSkge1xuICAgIGlmICghdmFsdWVzLnRpdGxlLnRyaW0oKSkge1xuICAgICAgYXdhaXQgc2hvd1RvYXN0KHsgc3R5bGU6IFRvYXN0LlN0eWxlLkZhaWx1cmUsIHRpdGxlOiBcIlRpdGxlIGlzIHJlcXVpcmVkXCIgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBmaWxlcGF0aCA9IGNyZWF0ZU5vdGUodmFsdWVzLmRpcmVjdG9yeSwgdmFsdWVzLnRpdGxlLCB2YWx1ZXMudGFncywgdmFsdWVzLmNvbnRlbnQpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgb3BlbkluRWRpdG9yKHByZWZzLmVkaXRvckNtZCwgZmlsZXBhdGgpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIEVkaXRvciBvcGVuIGZhaWxlZCBcdTIwMTQgbm90ZSBzdGlsbCBjcmVhdGVkXG4gICAgICB9XG4gICAgICBhd2FpdCBzaG93VG9hc3QoeyBzdHlsZTogVG9hc3QuU3R5bGUuU3VjY2VzcywgdGl0bGU6IFwiTm90ZSBjcmVhdGVkXCIsIG1lc3NhZ2U6IHZhbHVlcy50aXRsZSB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgYXdhaXQgc2hvd1RvYXN0KHsgc3R5bGU6IFRvYXN0LlN0eWxlLkZhaWx1cmUsIHRpdGxlOiBcIkZhaWxlZCB0byBjcmVhdGUgbm90ZVwiLCBtZXNzYWdlOiBTdHJpbmcoZXJyb3IpIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPEZvcm1cbiAgICAgIGFjdGlvbnM9e1xuICAgICAgICA8QWN0aW9uUGFuZWw+XG4gICAgICAgICAgPEFjdGlvbi5TdWJtaXRGb3JtIHRpdGxlPVwiQ3JlYXRlIE5vdGVcIiBvblN1Ym1pdD17aGFuZGxlU3VibWl0fSAvPlxuICAgICAgICA8L0FjdGlvblBhbmVsPlxuICAgICAgfVxuICAgID5cbiAgICAgIDxGb3JtLlRleHRGaWVsZCBpZD1cInRpdGxlXCIgdGl0bGU9XCJUaXRsZVwiIHBsYWNlaG9sZGVyPVwiTm90ZSB0aXRsZS4uLlwiIC8+XG4gICAgICA8Rm9ybS5UYWdQaWNrZXIgaWQ9XCJ0YWdzXCIgdGl0bGU9XCJUYWdzXCI+XG4gICAgICAgIHt0YWdzLm1hcCgodGFnKSA9PiAoXG4gICAgICAgICAgPEZvcm0uVGFnUGlja2VyLkl0ZW0ga2V5PXt0YWd9IHZhbHVlPXt0YWd9IHRpdGxlPXt0YWd9IC8+XG4gICAgICAgICkpfVxuICAgICAgPC9Gb3JtLlRhZ1BpY2tlcj5cbiAgICAgIDxGb3JtLlRleHRBcmVhIGlkPVwiY29udGVudFwiIHRpdGxlPVwiQ29udGVudFwiIHBsYWNlaG9sZGVyPVwiTm90ZSBjb250ZW50IChvcHRpb25hbCkuLi5cIiAvPlxuICAgICAgPEZvcm0uRHJvcGRvd24gaWQ9XCJkaXJlY3RvcnlcIiB0aXRsZT1cIkRpcmVjdG9yeVwiIGRlZmF1bHRWYWx1ZT17cHJlZnMubm90ZXNEaXJ9PlxuICAgICAgICA8Rm9ybS5Ecm9wZG93bi5JdGVtIHZhbHVlPXtwcmVmcy5ub3Rlc0Rpcn0gdGl0bGU9XCJOb3Rlc1wiIC8+XG4gICAgICAgIDxGb3JtLkRyb3Bkb3duLkl0ZW0gdmFsdWU9e2Ake3ByZWZzLnBhcGVyc0Rpcn0vbm90ZXNgfSB0aXRsZT1cIlBhcGVyIE5vdGVzXCIgLz5cbiAgICAgICAgPEZvcm0uRHJvcGRvd24uSXRlbSB2YWx1ZT17ZXhwYW5kUGF0aChcIn4vb3JnL21lZXRpbmdcIil9IHRpdGxlPVwiTWVldGluZ1wiIC8+XG4gICAgICA8L0Zvcm0uRHJvcGRvd24+XG4gICAgPC9Gb3JtPlxuICApO1xufVxuIiwgImltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcbmltcG9ydCB7IHJlYWRkaXJTeW5jLCByZWFkRmlsZVN5bmMsIHdyaXRlRmlsZVN5bmMsIG1rZGlyU3luYywgZXhpc3RzU3luYyB9IGZyb20gXCJmc1wiO1xuaW1wb3J0IHsgam9pbiwgYmFzZW5hbWUgfSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgaG9tZWRpciB9IGZyb20gXCJvc1wiO1xuXG4vKiogRXhwYW5kIH4gdG8gaG9tZSBkaXJlY3RvcnkgKi9cbmV4cG9ydCBmdW5jdGlvbiBleHBhbmRQYXRoKHA6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBwLnN0YXJ0c1dpdGgoXCJ+XCIpID8gcC5yZXBsYWNlKFwiflwiLCBob21lZGlyKCkpIDogcDtcbn1cblxuLyoqIEdlbmVyYXRlIGRlbm90ZSBpZGVudGlmaWVyOiBZWVlZTU1ERFRISE1NU1MgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUlkZW50aWZpZXIoZGF0ZTogRGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICBjb25zdCBwYWQgPSAobjogbnVtYmVyKSA9PiBTdHJpbmcobikucGFkU3RhcnQoMiwgXCIwXCIpO1xuICByZXR1cm4gKFxuICAgIGAke2RhdGUuZ2V0RnVsbFllYXIoKX0ke3BhZChkYXRlLmdldE1vbnRoKCkgKyAxKX0ke3BhZChkYXRlLmdldERhdGUoKSl9YCArXG4gICAgYFQke3BhZChkYXRlLmdldEhvdXJzKCkpfSR7cGFkKGRhdGUuZ2V0TWludXRlcygpKX0ke3BhZChkYXRlLmdldFNlY29uZHMoKSl9YFxuICApO1xufVxuXG4vKiogU2x1Z2lmeSB0aXRsZSBmb3IgZGVub3RlIGZpbGVuYW1lOiBsb3dlcmNhc2UsIHNwYWNlcyB0byBoeXBoZW5zLCBzdHJpcCBzcGVjaWFsIGNoYXJzICovXG5leHBvcnQgZnVuY3Rpb24gc2x1Z2lmeSh0aXRsZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRpdGxlXG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAucmVwbGFjZSgvW15hLXowLTlcXHMtXS9nLCBcIlwiKVxuICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiLVwiKVxuICAgIC5yZXBsYWNlKC8tKy9nLCBcIi1cIilcbiAgICAucmVwbGFjZSgvXi18LSQvZywgXCJcIik7XG59XG5cbi8qKiBGb3JtYXQgZGF0ZSBmb3Igb3JnIGZyb250IG1hdHRlcjogW1lZWVktTU0tREQgRGF5XSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdE9yZ0RhdGUoZGF0ZTogRGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICBjb25zdCBkYXlzID0gW1wiU3VuXCIsIFwiTW9uXCIsIFwiVHVlXCIsIFwiV2VkXCIsIFwiVGh1XCIsIFwiRnJpXCIsIFwiU2F0XCJdO1xuICBjb25zdCBwYWQgPSAobjogbnVtYmVyKSA9PiBTdHJpbmcobikucGFkU3RhcnQoMiwgXCIwXCIpO1xuICByZXR1cm4gYFske2RhdGUuZ2V0RnVsbFllYXIoKX0tJHtwYWQoZGF0ZS5nZXRNb250aCgpICsgMSl9LSR7cGFkKGRhdGUuZ2V0RGF0ZSgpKX0gJHtkYXlzW2RhdGUuZ2V0RGF5KCldfV1gO1xufVxuXG4vKiogQnVpbGQgZGVub3RlIGZpbGVuYW1lICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGaWxlbmFtZSh0aXRsZTogc3RyaW5nLCB0YWdzOiBzdHJpbmdbXSwgZGF0ZTogRGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICBjb25zdCBpZCA9IGdlbmVyYXRlSWRlbnRpZmllcihkYXRlKTtcbiAgY29uc3Qgc2x1ZyA9IHNsdWdpZnkodGl0bGUpO1xuICBjb25zdCB0YWdTdWZmaXggPSB0YWdzLmxlbmd0aCA+IDAgPyBgX18ke3RhZ3Muam9pbihcIl9cIil9YCA6IFwiXCI7XG4gIHJldHVybiBgJHtpZH0tLSR7c2x1Z30ke3RhZ1N1ZmZpeH0ub3JnYDtcbn1cblxuLyoqIEJ1aWxkIG9yZyBmcm9udCBtYXR0ZXIgKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZyb250TWF0dGVyKHRpdGxlOiBzdHJpbmcsIHRhZ3M6IHN0cmluZ1tdLCBjb250ZW50OiBzdHJpbmcgPSBcIlwiKTogc3RyaW5nIHtcbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgY29uc3QgaWQgPSBnZW5lcmF0ZUlkZW50aWZpZXIobm93KTtcbiAgY29uc3QgdGFnTGluZSA9IHRhZ3MubGVuZ3RoID4gMCA/IGA6JHt0YWdzLmpvaW4oXCI6XCIpfTpgIDogXCJcIjtcbiAgbGV0IHRleHQgPSBgIyt0aXRsZTogICAgICAke3RpdGxlfVxcbmA7XG4gIHRleHQgKz0gYCMrZGF0ZTogICAgICAgJHtmb3JtYXRPcmdEYXRlKG5vdyl9XFxuYDtcbiAgdGV4dCArPSBgIytpZGVudGlmaWVyOiAke2lkfVxcbmA7XG4gIGlmICh0YWdMaW5lKSB0ZXh0ICs9IGAjK2ZpbGV0YWdzOiAgICR7dGFnTGluZX1cXG5gO1xuICB0ZXh0ICs9IGBcXG5gO1xuICBpZiAoY29udGVudCkgdGV4dCArPSBgJHtjb250ZW50fVxcbmA7XG4gIHJldHVybiB0ZXh0O1xufVxuXG4vKiogQ3JlYXRlIGEgZGVub3RlIG5vdGUgZmlsZSwgcmV0dXJuIGZ1bGwgcGF0aCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vdGUoZGlyOiBzdHJpbmcsIHRpdGxlOiBzdHJpbmcsIHRhZ3M6IHN0cmluZ1tdLCBjb250ZW50OiBzdHJpbmcgPSBcIlwiKTogc3RyaW5nIHtcbiAgY29uc3QgZXhwYW5kZWQgPSBleHBhbmRQYXRoKGRpcik7XG4gIGlmICghZXhpc3RzU3luYyhleHBhbmRlZCkpIG1rZGlyU3luYyhleHBhbmRlZCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IGlkID0gZ2VuZXJhdGVJZGVudGlmaWVyKG5vdyk7XG4gIGNvbnN0IHNsdWcgPSBzbHVnaWZ5KHRpdGxlKTtcbiAgY29uc3QgdGFnU3VmZml4ID0gdGFncy5sZW5ndGggPiAwID8gYF9fJHt0YWdzLmpvaW4oXCJfXCIpfWAgOiBcIlwiO1xuICBjb25zdCBmaWxlbmFtZSA9IGAke2lkfS0tJHtzbHVnfSR7dGFnU3VmZml4fS5vcmdgO1xuICBjb25zdCBmaWxlcGF0aCA9IGpvaW4oZXhwYW5kZWQsIGZpbGVuYW1lKTtcbiAgY29uc3QgdGFnTGluZSA9IHRhZ3MubGVuZ3RoID4gMCA/IGA6JHt0YWdzLmpvaW4oXCI6XCIpfTpgIDogXCJcIjtcbiAgbGV0IGJvZHkgPSBgIyt0aXRsZTogICAgICAke3RpdGxlfVxcbmA7XG4gIGJvZHkgKz0gYCMrZGF0ZTogICAgICAgJHtmb3JtYXRPcmdEYXRlKG5vdyl9XFxuYDtcbiAgYm9keSArPSBgIytpZGVudGlmaWVyOiAke2lkfVxcbmA7XG4gIGlmICh0YWdMaW5lKSBib2R5ICs9IGAjK2ZpbGV0YWdzOiAgICR7dGFnTGluZX1cXG5gO1xuICBib2R5ICs9IGBcXG5gO1xuICBpZiAoY29udGVudCkgYm9keSArPSBgJHtjb250ZW50fVxcbmA7XG4gIHdyaXRlRmlsZVN5bmMoZmlsZXBhdGgsIGJvZHksIFwidXRmLThcIik7XG4gIHJldHVybiBmaWxlcGF0aDtcbn1cblxuLyoqIFBhcnNlIGRlbm90ZSBmaWxlbmFtZSBpbnRvIGNvbXBvbmVudHMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVub3RlRmlsZSB7XG4gIHBhdGg6IHN0cmluZztcbiAgaWRlbnRpZmllcjogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICB0YWdzOiBzdHJpbmdbXTtcbiAgZGF0ZTogc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VGaWxlbmFtZShmaWxlcGF0aDogc3RyaW5nKTogRGVub3RlRmlsZSB8IG51bGwge1xuICBjb25zdCBuYW1lID0gYmFzZW5hbWUoZmlsZXBhdGgsIFwiLm9yZ1wiKTtcbiAgY29uc3QgbWF0Y2ggPSBuYW1lLm1hdGNoKC9eKFxcZHs4fVRcXGR7Nn0pLS0oLis/KSg/Ol9fKC4rKSk/JC8pO1xuICBpZiAoIW1hdGNoKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgWywgaWRlbnRpZmllciwgc2x1ZywgdGFnU3RyXSA9IG1hdGNoO1xuICByZXR1cm4ge1xuICAgIHBhdGg6IGZpbGVwYXRoLFxuICAgIGlkZW50aWZpZXIsXG4gICAgdGl0bGU6IHNsdWcucmVwbGFjZSgvLS9nLCBcIiBcIiksXG4gICAgdGFnczogdGFnU3RyID8gdGFnU3RyLnNwbGl0KFwiX1wiKSA6IFtdLFxuICAgIGRhdGU6IGAke2lkZW50aWZpZXIuc2xpY2UoMCwgNCl9LSR7aWRlbnRpZmllci5zbGljZSg0LCA2KX0tJHtpZGVudGlmaWVyLnNsaWNlKDYsIDgpfWAsXG4gIH07XG59XG5cbi8qKiBTY2FuIGFsbCBkZW5vdGUgZmlsZXMgaW4gYSBkaXJlY3RvcnkgKi9cbmV4cG9ydCBmdW5jdGlvbiBzY2FuTm90ZXMoZGlyOiBzdHJpbmcpOiBEZW5vdGVGaWxlW10ge1xuICBjb25zdCBleHBhbmRlZCA9IGV4cGFuZFBhdGgoZGlyKTtcbiAgaWYgKCFleGlzdHNTeW5jKGV4cGFuZGVkKSkgcmV0dXJuIFtdO1xuICByZXR1cm4gcmVhZGRpclN5bmMoZXhwYW5kZWQpXG4gICAgLmZpbHRlcigoZikgPT4gZi5lbmRzV2l0aChcIi5vcmdcIikgJiYgL15cXGR7OH1UXFxkezZ9LS0vLnRlc3QoZikpXG4gICAgLm1hcCgoZikgPT4gcGFyc2VGaWxlbmFtZShqb2luKGV4cGFuZGVkLCBmKSkpXG4gICAgLmZpbHRlcigoZik6IGYgaXMgRGVub3RlRmlsZSA9PiBmICE9PSBudWxsKVxuICAgIC5zb3J0KChhLCBiKSA9PiBiLmlkZW50aWZpZXIubG9jYWxlQ29tcGFyZShhLmlkZW50aWZpZXIpKTtcbn1cblxuLyoqIFNjYW4gYWxsIHVuaXF1ZSB0YWdzIGZyb20gZmlsZXRhZ3MgaGVhZGVycyBhY3Jvc3MgZGlyZWN0b3JpZXMgKi9cbmV4cG9ydCBmdW5jdGlvbiBzY2FuVGFncyhkaXJzOiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcbiAgY29uc3QgdGFncyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IGRpciBvZiBkaXJzKSB7XG4gICAgY29uc3QgZXhwYW5kZWQgPSBleHBhbmRQYXRoKGRpcik7XG4gICAgaWYgKCFleGlzdHNTeW5jKGV4cGFuZGVkKSkgY29udGludWU7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG91dHB1dCA9IGV4ZWNTeW5jKFxuICAgICAgICBgcmcgLS1uby1maWxlbmFtZSAtLW5vLWxpbmUtbnVtYmVyIC1vUCAnXiNcXFxcK2ZpbGV0YWdzOlxcXFxzKlxcXFxLLisnIC1nICcqLm9yZycgXCIke2V4cGFuZGVkfVwiYCxcbiAgICAgICAgeyBlbmNvZGluZzogXCJ1dGYtOFwiLCB0aW1lb3V0OiA1MDAwIH0sXG4gICAgICApO1xuICAgICAgZm9yIChjb25zdCBsaW5lIG9mIG91dHB1dC5zcGxpdChcIlxcblwiKSkge1xuICAgICAgICBjb25zdCB0cmltbWVkID0gbGluZS50cmltKCk7XG4gICAgICAgIGlmICghdHJpbW1lZCkgY29udGludWU7XG4gICAgICAgIC8vIGZpbGV0YWdzIGZvcm1hdDogOnRhZzE6dGFnMjp0YWczOlxuICAgICAgICBmb3IgKGNvbnN0IHQgb2YgdHJpbW1lZC5zcGxpdChcIjpcIikpIHtcbiAgICAgICAgICBjb25zdCB0YWcgPSB0LnRyaW0oKTtcbiAgICAgICAgICBpZiAodGFnKSB0YWdzLmFkZCh0YWcpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyByZyByZXR1cm5zIGV4aXQgMSBpZiBubyBtYXRjaGVzXG4gICAgfVxuICB9XG4gIHJldHVybiBbLi4udGFnc10uc29ydCgpO1xufVxuXG4vKiogU2VhcmNoIG5vdGVzIHdpdGggcmlwZ3JlcCwgcmV0dXJuIG1hdGNoaW5nIGZpbGUgcGF0aHMgKi9cbmV4cG9ydCBmdW5jdGlvbiBzZWFyY2hOb3RlcyhkaXJzOiBzdHJpbmdbXSwgcXVlcnk6IHN0cmluZyk6IHN0cmluZ1tdIHtcbiAgaWYgKCFxdWVyeS50cmltKCkpIHJldHVybiBbXTtcbiAgY29uc3QgcGF0aHMgPSBkaXJzLm1hcChleHBhbmRQYXRoKS5maWx0ZXIoZXhpc3RzU3luYyk7XG4gIGlmIChwYXRocy5sZW5ndGggPT09IDApIHJldHVybiBbXTtcbiAgdHJ5IHtcbiAgICBjb25zdCBlc2NhcGVkUXVlcnkgPSBxdWVyeS5yZXBsYWNlKC9bJ1wiXFxcXF0vZywgXCJcXFxcJCZcIik7XG4gICAgY29uc3Qgb3V0cHV0ID0gZXhlY1N5bmMoXG4gICAgICBgcmcgLWwgLWkgLS1nbG9iICcqLm9yZycgXCIke2VzY2FwZWRRdWVyeX1cIiAke3BhdGhzLm1hcCgocCkgPT4gYFwiJHtwfVwiYCkuam9pbihcIiBcIil9YCxcbiAgICAgIHsgZW5jb2Rpbmc6IFwidXRmLThcIiwgdGltZW91dDogMTAwMDAgfSxcbiAgICApO1xuICAgIHJldHVybiBvdXRwdXQuc3BsaXQoXCJcXG5cIikuZmlsdGVyKEJvb2xlYW4pO1xuICB9IGNhdGNoIHtcbiAgICByZXR1cm4gW107XG4gIH1cbn1cblxuLyoqIFJlYWQgdGhlIHRpdGxlIGZyb20gIyt0aXRsZTogaGVhZGVyLCBmYWxsaW5nIGJhY2sgdG8gZmlsZW5hbWUgc2x1ZyAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRUaXRsZShmaWxlcGF0aDogc3RyaW5nKTogc3RyaW5nIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBoZWFkID0gcmVhZEZpbGVTeW5jKGZpbGVwYXRoLCBcInV0Zi04XCIpLnNsaWNlKDAsIDUwMCk7XG4gICAgY29uc3QgbWF0Y2ggPSBoZWFkLm1hdGNoKC9eI1xcK3RpdGxlOlxccyooLispJC9tKTtcbiAgICBpZiAobWF0Y2gpIHJldHVybiBtYXRjaFsxXS50cmltKCk7XG4gIH0gY2F0Y2gge1xuICAgIC8vIGZhbGwgdGhyb3VnaFxuICB9XG4gIGNvbnN0IHBhcnNlZCA9IHBhcnNlRmlsZW5hbWUoZmlsZXBhdGgpO1xuICByZXR1cm4gcGFyc2VkID8gcGFyc2VkLnRpdGxlIDogYmFzZW5hbWUoZmlsZXBhdGgsIFwiLm9yZ1wiKTtcbn1cblxuLyoqIFNlYXJjaCBjb21tb24gZW1hY3NjbGllbnQgbG9jYXRpb25zIChNYWNQb3J0cywgSG9tZWJyZXcsIEVtYWNzLmFwcCwgTGludXgpICovXG5mdW5jdGlvbiBmaW5kRW1hY3NjbGllbnQoKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IGNhbmRpZGF0ZXMgPSBbXG4gICAgXCIvQXBwbGljYXRpb25zL01hY1BvcnRzL0VtYWNzLmFwcC9Db250ZW50cy9NYWNPUy9iaW4vZW1hY3NjbGllbnRcIiwgIC8vIE1hY1BvcnRzXG4gICAgXCIvQXBwbGljYXRpb25zL0VtYWNzLmFwcC9Db250ZW50cy9NYWNPUy9iaW4vZW1hY3NjbGllbnRcIiwgICAgICAgICAgIC8vIEVtYWNzIGZvciBNYWMgT1MgWFxuICAgIFwiL29wdC9ob21lYnJldy9iaW4vZW1hY3NjbGllbnRcIiwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSG9tZWJyZXcgQVJNXG4gICAgXCIvdXNyL2xvY2FsL2Jpbi9lbWFjc2NsaWVudFwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIb21lYnJldyBJbnRlbCAvIExpbnV4XG4gICAgXCIvb3B0L2xvY2FsL2Jpbi9lbWFjc2NsaWVudFwiLCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBNYWNQb3J0cyBDTElcbiAgICBcIi91c3IvYmluL2VtYWNzY2xpZW50XCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIExpbnV4IHN5c3RlbVxuICAgIFwiL3NuYXAvYmluL2VtYWNzY2xpZW50XCIsICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU25hcFxuICBdO1xuICByZXR1cm4gY2FuZGlkYXRlcy5maW5kKChwKSA9PiBleGlzdHNTeW5jKHApKSB8fCBudWxsO1xufVxuXG4vKiogRmluZCBFbWFjcyBzZXJ2ZXIgc29ja2V0IGluIGNvbW1vbiBsb2NhdGlvbnMgKi9cbmZ1bmN0aW9uIGZpbmRTb2NrZXQoKTogc3RyaW5nIHwgbnVsbCB7XG4gIGNvbnN0IGNhbmRpZGF0ZXMgPSBbXG4gICAgam9pbihob21lZGlyKCksIFwiLmNvbmZpZ1wiLCBcImVtYWNzXCIsIFwic2VydmVyXCIsIFwic2VydmVyXCIpLCAgICAgICAgICAgICAvLyBYREcgY3VzdG9tXG4gICAgam9pbihob21lZGlyKCksIFwiLmVtYWNzLmRcIiwgXCJzZXJ2ZXJcIiwgXCJzZXJ2ZXJcIiksICAgICAgICAgICAgICAgICAgICAgLy8gVHJhZGl0aW9uYWxcbiAgICBgL3RtcC9lbWFjcyR7cHJvY2Vzcy5nZXR1aWQ/LigpID8/IDUwMX0vc2VydmVyYCwgICAgICAgICAgICAgICAgICAgICAvLyBEZWZhdWx0IChtYWNPUy9MaW51eClcbiAgXTtcbiAgcmV0dXJuIGNhbmRpZGF0ZXMuZmluZCgocCkgPT4gZXhpc3RzU3luYyhwKSkgfHwgbnVsbDtcbn1cblxuLyoqIFJlc29sdmUgZW1hY3NjbGllbnQ6IGZpbmQgZnVsbCBwYXRoICsgYWRkIHNvY2tldC1uYW1lIGlmIG5lZWRlZCAqL1xuZnVuY3Rpb24gcmVzb2x2ZUVkaXRvckNtZChlZGl0b3JDbWQ6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCBjbWQgPSBlZGl0b3JDbWQ7XG4gIC8vIElmIGJhcmUgXCJlbWFjc2NsaWVudFwiLCByZXNvbHZlIHRvIGZ1bGwgcGF0aFxuICBpZiAoY21kLnN0YXJ0c1dpdGgoXCJlbWFjc2NsaWVudCBcIikgfHwgY21kID09PSBcImVtYWNzY2xpZW50XCIpIHtcbiAgICBjb25zdCBmdWxsUGF0aCA9IGZpbmRFbWFjc2NsaWVudCgpO1xuICAgIGlmIChmdWxsUGF0aCkgY21kID0gY21kLnJlcGxhY2UoL15lbWFjc2NsaWVudC8sIGZ1bGxQYXRoKTtcbiAgfVxuICAvLyBBZGQgLS1zb2NrZXQtbmFtZSBpZiBlbWFjc2NsaWVudCBpcyB1c2VkIGJ1dCBzb2NrZXQgaXNuJ3Qgc3BlY2lmaWVkXG4gIGlmIChjbWQuaW5jbHVkZXMoXCJlbWFjc2NsaWVudFwiKSAmJiAhY21kLmluY2x1ZGVzKFwiLS1zb2NrZXQtbmFtZVwiKSkge1xuICAgIGNvbnN0IHNvY2tldFBhdGggPSBmaW5kU29ja2V0KCk7XG4gICAgaWYgKHNvY2tldFBhdGgpIGNtZCArPSBgIC0tc29ja2V0LW5hbWU9JHtzb2NrZXRQYXRofWA7XG4gIH1cbiAgcmV0dXJuIGNtZDtcbn1cblxuLyoqIE9wZW4gYSBmaWxlIGluIHRoZSBjb25maWd1cmVkIGVkaXRvciAqL1xuZXhwb3J0IGZ1bmN0aW9uIG9wZW5JbkVkaXRvcihlZGl0b3JDbWQ6IHN0cmluZywgZmlsZXBhdGg6IHN0cmluZyk6IHZvaWQge1xuICBjb25zdCBQQVRIID0gW1xuICAgIFwiL0FwcGxpY2F0aW9ucy9NYWNQb3J0cy9FbWFjcy5hcHAvQ29udGVudHMvTWFjT1MvYmluXCIsXG4gICAgXCIvQXBwbGljYXRpb25zL0VtYWNzLmFwcC9Db250ZW50cy9NYWNPUy9iaW5cIixcbiAgICBcIi9vcHQvaG9tZWJyZXcvYmluXCIsXG4gICAgXCIvb3B0L2xvY2FsL2JpblwiLFxuICAgIFwiL3Vzci9sb2NhbC9iaW5cIixcbiAgICBwcm9jZXNzLmVudi5QQVRIIHx8IFwiXCIsXG4gIF0uam9pbihcIjpcIik7XG4gIGNvbnN0IHJlc29sdmVkID0gcmVzb2x2ZUVkaXRvckNtZChlZGl0b3JDbWQpO1xuICBleGVjU3luYyhgJHtyZXNvbHZlZH0gXCIke2ZpbGVwYXRofVwiYCwgeyB0aW1lb3V0OiA1MDAwLCBlbnY6IHsgLi4ucHJvY2Vzcy5lbnYsIFBBVEggfSB9KTtcbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGlCQUFpRjtBQUNqRixtQkFBb0M7OztBQ0RwQywyQkFBeUI7QUFDekIsZ0JBQWdGO0FBQ2hGLGtCQUErQjtBQUMvQixnQkFBd0I7QUFHakIsU0FBUyxXQUFXLEdBQW1CO0FBQzVDLFNBQU8sRUFBRSxXQUFXLEdBQUcsSUFBSSxFQUFFLFFBQVEsU0FBSyxtQkFBUSxDQUFDLElBQUk7QUFDekQ7QUFHTyxTQUFTLG1CQUFtQixPQUFhLG9CQUFJLEtBQUssR0FBVztBQUNsRSxRQUFNLE1BQU0sQ0FBQyxNQUFjLE9BQU8sQ0FBQyxFQUFFLFNBQVMsR0FBRyxHQUFHO0FBQ3BELFNBQ0UsR0FBRyxL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
