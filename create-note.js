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
      const output = (0, import_child_process.execSync)(`rg --no-filename -oP '(?<=:)[^:]+(?=:)' -g '*.org' --no-line-number "${expanded}"`, {
        encoding: "utf-8",
        timeout: 5e3
      });
      output.split("\n").filter(Boolean).forEach((t) => tags.add(t.trim()));
    } catch {
    }
  }
  return [...tags].sort();
}
function openInEditor(editorCmd, filepath) {
  (0, import_child_process.execSync)(`${editorCmd} "${filepath}"`, { timeout: 5e3 });
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLmRvdGZpbGVzLy5jb25maWcvcmF5Y2FzdC9leHRlbnNpb25zL3JheWNhc3QtZGVub3RlL3NyYy9jcmVhdGUtbm90ZS50c3giLCAiLi4vLi4vLi4vLi4vLmRvdGZpbGVzLy5jb25maWcvcmF5Y2FzdC9leHRlbnNpb25zL3JheWNhc3QtZGVub3RlL3NyYy91dGlscy9kZW5vdGUudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IEFjdGlvbiwgQWN0aW9uUGFuZWwsIEZvcm0sIGdldFByZWZlcmVuY2VWYWx1ZXMsIHNob3dUb2FzdCwgVG9hc3QgfSBmcm9tIFwiQHJheWNhc3QvYXBpXCI7XG5pbXBvcnQgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0IH0gZnJvbSBcInJlYWN0XCI7XG5pbXBvcnQgeyBjcmVhdGVOb3RlLCBzY2FuVGFncywgZXhwYW5kUGF0aCwgb3BlbkluRWRpdG9yIH0gZnJvbSBcIi4vdXRpbHMvZGVub3RlXCI7XG5cbmludGVyZmFjZSBQcmVmZXJlbmNlcyB7XG4gIG5vdGVzRGlyOiBzdHJpbmc7XG4gIHBhcGVyc0Rpcjogc3RyaW5nO1xuICBlZGl0b3JDbWQ6IHN0cmluZztcbn1cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gQ3JlYXRlTm90ZSgpIHtcbiAgY29uc3QgcHJlZnMgPSBnZXRQcmVmZXJlbmNlVmFsdWVzPFByZWZlcmVuY2VzPigpO1xuICBjb25zdCBbdGFncywgc2V0VGFnc10gPSB1c2VTdGF0ZTxzdHJpbmdbXT4oW10pO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgZGlycyA9IFtwcmVmcy5ub3Rlc0RpciwgYCR7cHJlZnMucGFwZXJzRGlyfS9ub3Rlc2BdLm1hcChleHBhbmRQYXRoKTtcbiAgICBzZXRUYWdzKHNjYW5UYWdzKGRpcnMpKTtcbiAgfSwgW10pO1xuXG4gIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZVN1Ym1pdCh2YWx1ZXM6IHsgdGl0bGU6IHN0cmluZzsgdGFnczogc3RyaW5nW107IGNvbnRlbnQ6IHN0cmluZzsgZGlyZWN0b3J5OiBzdHJpbmcgfSkge1xuICAgIGlmICghdmFsdWVzLnRpdGxlLnRyaW0oKSkge1xuICAgICAgYXdhaXQgc2hvd1RvYXN0KHsgc3R5bGU6IFRvYXN0LlN0eWxlLkZhaWx1cmUsIHRpdGxlOiBcIlRpdGxlIGlzIHJlcXVpcmVkXCIgfSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICBjb25zdCBmaWxlcGF0aCA9IGNyZWF0ZU5vdGUodmFsdWVzLmRpcmVjdG9yeSwgdmFsdWVzLnRpdGxlLCB2YWx1ZXMudGFncywgdmFsdWVzLmNvbnRlbnQpO1xuICAgICAgdHJ5IHtcbiAgICAgICAgb3BlbkluRWRpdG9yKHByZWZzLmVkaXRvckNtZCwgZmlsZXBhdGgpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIEVkaXRvciBvcGVuIGZhaWxlZCBcdTIwMTQgbm90ZSBzdGlsbCBjcmVhdGVkXG4gICAgICB9XG4gICAgICBhd2FpdCBzaG93VG9hc3QoeyBzdHlsZTogVG9hc3QuU3R5bGUuU3VjY2VzcywgdGl0bGU6IFwiTm90ZSBjcmVhdGVkXCIsIG1lc3NhZ2U6IHZhbHVlcy50aXRsZSB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgYXdhaXQgc2hvd1RvYXN0KHsgc3R5bGU6IFRvYXN0LlN0eWxlLkZhaWx1cmUsIHRpdGxlOiBcIkZhaWxlZCB0byBjcmVhdGUgbm90ZVwiLCBtZXNzYWdlOiBTdHJpbmcoZXJyb3IpIH0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiAoXG4gICAgPEZvcm1cbiAgICAgIGFjdGlvbnM9e1xuICAgICAgICA8QWN0aW9uUGFuZWw+XG4gICAgICAgICAgPEFjdGlvbi5TdWJtaXRGb3JtIHRpdGxlPVwiQ3JlYXRlIE5vdGVcIiBvblN1Ym1pdD17aGFuZGxlU3VibWl0fSAvPlxuICAgICAgICA8L0FjdGlvblBhbmVsPlxuICAgICAgfVxuICAgID5cbiAgICAgIDxGb3JtLlRleHRGaWVsZCBpZD1cInRpdGxlXCIgdGl0bGU9XCJUaXRsZVwiIHBsYWNlaG9sZGVyPVwiTm90ZSB0aXRsZS4uLlwiIC8+XG4gICAgICA8Rm9ybS5UYWdQaWNrZXIgaWQ9XCJ0YWdzXCIgdGl0bGU9XCJUYWdzXCI+XG4gICAgICAgIHt0YWdzLm1hcCgodGFnKSA9PiAoXG4gICAgICAgICAgPEZvcm0uVGFnUGlja2VyLkl0ZW0ga2V5PXt0YWd9IHZhbHVlPXt0YWd9IHRpdGxlPXt0YWd9IC8+XG4gICAgICAgICkpfVxuICAgICAgPC9Gb3JtLlRhZ1BpY2tlcj5cbiAgICAgIDxGb3JtLlRleHRBcmVhIGlkPVwiY29udGVudFwiIHRpdGxlPVwiQ29udGVudFwiIHBsYWNlaG9sZGVyPVwiTm90ZSBjb250ZW50IChvcHRpb25hbCkuLi5cIiAvPlxuICAgICAgPEZvcm0uRHJvcGRvd24gaWQ9XCJkaXJlY3RvcnlcIiB0aXRsZT1cIkRpcmVjdG9yeVwiIGRlZmF1bHRWYWx1ZT17cHJlZnMubm90ZXNEaXJ9PlxuICAgICAgICA8Rm9ybS5Ecm9wZG93bi5JdGVtIHZhbHVlPXtwcmVmcy5ub3Rlc0Rpcn0gdGl0bGU9XCJOb3Rlc1wiIC8+XG4gICAgICAgIDxGb3JtLkRyb3Bkb3duLkl0ZW0gdmFsdWU9e2Ake3ByZWZzLnBhcGVyc0Rpcn0vbm90ZXNgfSB0aXRsZT1cIlBhcGVyIE5vdGVzXCIgLz5cbiAgICAgICAgPEZvcm0uRHJvcGRvd24uSXRlbSB2YWx1ZT17ZXhwYW5kUGF0aChcIn4vb3JnL21lZXRpbmdcIil9IHRpdGxlPVwiTWVldGluZ1wiIC8+XG4gICAgICA8L0Zvcm0uRHJvcGRvd24+XG4gICAgPC9Gb3JtPlxuICApO1xufVxuIiwgImltcG9ydCB7IGV4ZWNTeW5jIH0gZnJvbSBcImNoaWxkX3Byb2Nlc3NcIjtcbmltcG9ydCB7IHJlYWRkaXJTeW5jLCByZWFkRmlsZVN5bmMsIHdyaXRlRmlsZVN5bmMsIG1rZGlyU3luYywgZXhpc3RzU3luYyB9IGZyb20gXCJmc1wiO1xuaW1wb3J0IHsgam9pbiwgYmFzZW5hbWUgfSBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IHsgaG9tZWRpciB9IGZyb20gXCJvc1wiO1xuXG4vKiogRXhwYW5kIH4gdG8gaG9tZSBkaXJlY3RvcnkgKi9cbmV4cG9ydCBmdW5jdGlvbiBleHBhbmRQYXRoKHA6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBwLnN0YXJ0c1dpdGgoXCJ+XCIpID8gcC5yZXBsYWNlKFwiflwiLCBob21lZGlyKCkpIDogcDtcbn1cblxuLyoqIEdlbmVyYXRlIGRlbm90ZSBpZGVudGlmaWVyOiBZWVlZTU1ERFRISE1NU1MgKi9cbmV4cG9ydCBmdW5jdGlvbiBnZW5lcmF0ZUlkZW50aWZpZXIoZGF0ZTogRGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICBjb25zdCBwYWQgPSAobjogbnVtYmVyKSA9PiBTdHJpbmcobikucGFkU3RhcnQoMiwgXCIwXCIpO1xuICByZXR1cm4gKFxuICAgIGAke2RhdGUuZ2V0RnVsbFllYXIoKX0ke3BhZChkYXRlLmdldE1vbnRoKCkgKyAxKX0ke3BhZChkYXRlLmdldERhdGUoKSl9YCArXG4gICAgYFQke3BhZChkYXRlLmdldEhvdXJzKCkpfSR7cGFkKGRhdGUuZ2V0TWludXRlcygpKX0ke3BhZChkYXRlLmdldFNlY29uZHMoKSl9YFxuICApO1xufVxuXG4vKiogU2x1Z2lmeSB0aXRsZSBmb3IgZGVub3RlIGZpbGVuYW1lOiBsb3dlcmNhc2UsIHNwYWNlcyB0byBoeXBoZW5zLCBzdHJpcCBzcGVjaWFsIGNoYXJzICovXG5leHBvcnQgZnVuY3Rpb24gc2x1Z2lmeSh0aXRsZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHRpdGxlXG4gICAgLnRvTG93ZXJDYXNlKClcbiAgICAucmVwbGFjZSgvW15hLXowLTlcXHMtXS9nLCBcIlwiKVxuICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiLVwiKVxuICAgIC5yZXBsYWNlKC8tKy9nLCBcIi1cIilcbiAgICAucmVwbGFjZSgvXi18LSQvZywgXCJcIik7XG59XG5cbi8qKiBGb3JtYXQgZGF0ZSBmb3Igb3JnIGZyb250IG1hdHRlcjogW1lZWVktTU0tREQgRGF5XSAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZvcm1hdE9yZ0RhdGUoZGF0ZTogRGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICBjb25zdCBkYXlzID0gW1wiU3VuXCIsIFwiTW9uXCIsIFwiVHVlXCIsIFwiV2VkXCIsIFwiVGh1XCIsIFwiRnJpXCIsIFwiU2F0XCJdO1xuICBjb25zdCBwYWQgPSAobjogbnVtYmVyKSA9PiBTdHJpbmcobikucGFkU3RhcnQoMiwgXCIwXCIpO1xuICByZXR1cm4gYFske2RhdGUuZ2V0RnVsbFllYXIoKX0tJHtwYWQoZGF0ZS5nZXRNb250aCgpICsgMSl9LSR7cGFkKGRhdGUuZ2V0RGF0ZSgpKX0gJHtkYXlzW2RhdGUuZ2V0RGF5KCldfV1gO1xufVxuXG4vKiogQnVpbGQgZGVub3RlIGZpbGVuYW1lICovXG5leHBvcnQgZnVuY3Rpb24gYnVpbGRGaWxlbmFtZSh0aXRsZTogc3RyaW5nLCB0YWdzOiBzdHJpbmdbXSwgZGF0ZTogRGF0ZSA9IG5ldyBEYXRlKCkpOiBzdHJpbmcge1xuICBjb25zdCBpZCA9IGdlbmVyYXRlSWRlbnRpZmllcihkYXRlKTtcbiAgY29uc3Qgc2x1ZyA9IHNsdWdpZnkodGl0bGUpO1xuICBjb25zdCB0YWdTdWZmaXggPSB0YWdzLmxlbmd0aCA+IDAgPyBgX18ke3RhZ3Muam9pbihcIl9cIil9YCA6IFwiXCI7XG4gIHJldHVybiBgJHtpZH0tLSR7c2x1Z30ke3RhZ1N1ZmZpeH0ub3JnYDtcbn1cblxuLyoqIEJ1aWxkIG9yZyBmcm9udCBtYXR0ZXIgKi9cbmV4cG9ydCBmdW5jdGlvbiBidWlsZEZyb250TWF0dGVyKHRpdGxlOiBzdHJpbmcsIHRhZ3M6IHN0cmluZ1tdLCBjb250ZW50OiBzdHJpbmcgPSBcIlwiKTogc3RyaW5nIHtcbiAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcbiAgY29uc3QgaWQgPSBnZW5lcmF0ZUlkZW50aWZpZXIobm93KTtcbiAgY29uc3QgdGFnTGluZSA9IHRhZ3MubGVuZ3RoID4gMCA/IGA6JHt0YWdzLmpvaW4oXCI6XCIpfTpgIDogXCJcIjtcbiAgbGV0IHRleHQgPSBgIyt0aXRsZTogICAgICAke3RpdGxlfVxcbmA7XG4gIHRleHQgKz0gYCMrZGF0ZTogICAgICAgJHtmb3JtYXRPcmdEYXRlKG5vdyl9XFxuYDtcbiAgdGV4dCArPSBgIytpZGVudGlmaWVyOiAke2lkfVxcbmA7XG4gIGlmICh0YWdMaW5lKSB0ZXh0ICs9IGAjK2ZpbGV0YWdzOiAgICR7dGFnTGluZX1cXG5gO1xuICB0ZXh0ICs9IGBcXG5gO1xuICBpZiAoY29udGVudCkgdGV4dCArPSBgJHtjb250ZW50fVxcbmA7XG4gIHJldHVybiB0ZXh0O1xufVxuXG4vKiogQ3JlYXRlIGEgZGVub3RlIG5vdGUgZmlsZSwgcmV0dXJuIGZ1bGwgcGF0aCAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZU5vdGUoZGlyOiBzdHJpbmcsIHRpdGxlOiBzdHJpbmcsIHRhZ3M6IHN0cmluZ1tdLCBjb250ZW50OiBzdHJpbmcgPSBcIlwiKTogc3RyaW5nIHtcbiAgY29uc3QgZXhwYW5kZWQgPSBleHBhbmRQYXRoKGRpcik7XG4gIGlmICghZXhpc3RzU3luYyhleHBhbmRlZCkpIG1rZGlyU3luYyhleHBhbmRlZCwgeyByZWN1cnNpdmU6IHRydWUgfSk7XG4gIGNvbnN0IG5vdyA9IG5ldyBEYXRlKCk7XG4gIGNvbnN0IGlkID0gZ2VuZXJhdGVJZGVudGlmaWVyKG5vdyk7XG4gIGNvbnN0IHNsdWcgPSBzbHVnaWZ5KHRpdGxlKTtcbiAgY29uc3QgdGFnU3VmZml4ID0gdGFncy5sZW5ndGggPiAwID8gYF9fJHt0YWdzLmpvaW4oXCJfXCIpfWAgOiBcIlwiO1xuICBjb25zdCBmaWxlbmFtZSA9IGAke2lkfS0tJHtzbHVnfSR7dGFnU3VmZml4fS5vcmdgO1xuICBjb25zdCBmaWxlcGF0aCA9IGpvaW4oZXhwYW5kZWQsIGZpbGVuYW1lKTtcbiAgY29uc3QgdGFnTGluZSA9IHRhZ3MubGVuZ3RoID4gMCA/IGA6JHt0YWdzLmpvaW4oXCI6XCIpfTpgIDogXCJcIjtcbiAgbGV0IGJvZHkgPSBgIyt0aXRsZTogICAgICAke3RpdGxlfVxcbmA7XG4gIGJvZHkgKz0gYCMrZGF0ZTogICAgICAgJHtmb3JtYXRPcmdEYXRlKG5vdyl9XFxuYDtcbiAgYm9keSArPSBgIytpZGVudGlmaWVyOiAke2lkfVxcbmA7XG4gIGlmICh0YWdMaW5lKSBib2R5ICs9IGAjK2ZpbGV0YWdzOiAgICR7dGFnTGluZX1cXG5gO1xuICBib2R5ICs9IGBcXG5gO1xuICBpZiAoY29udGVudCkgYm9keSArPSBgJHtjb250ZW50fVxcbmA7XG4gIHdyaXRlRmlsZVN5bmMoZmlsZXBhdGgsIGJvZHksIFwidXRmLThcIik7XG4gIHJldHVybiBmaWxlcGF0aDtcbn1cblxuLyoqIFBhcnNlIGRlbm90ZSBmaWxlbmFtZSBpbnRvIGNvbXBvbmVudHMgKi9cbmV4cG9ydCBpbnRlcmZhY2UgRGVub3RlRmlsZSB7XG4gIHBhdGg6IHN0cmluZztcbiAgaWRlbnRpZmllcjogc3RyaW5nO1xuICB0aXRsZTogc3RyaW5nO1xuICB0YWdzOiBzdHJpbmdbXTtcbiAgZGF0ZTogc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VGaWxlbmFtZShmaWxlcGF0aDogc3RyaW5nKTogRGVub3RlRmlsZSB8IG51bGwge1xuICBjb25zdCBuYW1lID0gYmFzZW5hbWUoZmlsZXBhdGgsIFwiLm9yZ1wiKTtcbiAgY29uc3QgbWF0Y2ggPSBuYW1lLm1hdGNoKC9eKFxcZHs4fVRcXGR7Nn0pLS0oLis/KSg/Ol9fKC4rKSk/JC8pO1xuICBpZiAoIW1hdGNoKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgWywgaWRlbnRpZmllciwgc2x1ZywgdGFnU3RyXSA9IG1hdGNoO1xuICByZXR1cm4ge1xuICAgIHBhdGg6IGZpbGVwYXRoLFxuICAgIGlkZW50aWZpZXIsXG4gICAgdGl0bGU6IHNsdWcucmVwbGFjZSgvLS9nLCBcIiBcIiksXG4gICAgdGFnczogdGFnU3RyID8gdGFnU3RyLnNwbGl0KFwiX1wiKSA6IFtdLFxuICAgIGRhdGU6IGAke2lkZW50aWZpZXIuc2xpY2UoMCwgNCl9LSR7aWRlbnRpZmllci5zbGljZSg0LCA2KX0tJHtpZGVudGlmaWVyLnNsaWNlKDYsIDgpfWAsXG4gIH07XG59XG5cbi8qKiBTY2FuIGFsbCBkZW5vdGUgZmlsZXMgaW4gYSBkaXJlY3RvcnkgKi9cbmV4cG9ydCBmdW5jdGlvbiBzY2FuTm90ZXMoZGlyOiBzdHJpbmcpOiBEZW5vdGVGaWxlW10ge1xuICBjb25zdCBleHBhbmRlZCA9IGV4cGFuZFBhdGgoZGlyKTtcbiAgaWYgKCFleGlzdHNTeW5jKGV4cGFuZGVkKSkgcmV0dXJuIFtdO1xuICByZXR1cm4gcmVhZGRpclN5bmMoZXhwYW5kZWQpXG4gICAgLmZpbHRlcigoZikgPT4gZi5lbmRzV2l0aChcIi5vcmdcIikgJiYgL15cXGR7OH1UXFxkezZ9LS0vLnRlc3QoZikpXG4gICAgLm1hcCgoZikgPT4gcGFyc2VGaWxlbmFtZShqb2luKGV4cGFuZGVkLCBmKSkpXG4gICAgLmZpbHRlcigoZik6IGYgaXMgRGVub3RlRmlsZSA9PiBmICE9PSBudWxsKVxuICAgIC5zb3J0KChhLCBiKSA9PiBiLmlkZW50aWZpZXIubG9jYWxlQ29tcGFyZShhLmlkZW50aWZpZXIpKTtcbn1cblxuLyoqIFNjYW4gYWxsIHVuaXF1ZSB0YWdzIGZyb20gZmlsZXRhZ3MgaGVhZGVycyBhY3Jvc3MgZGlyZWN0b3JpZXMgKi9cbmV4cG9ydCBmdW5jdGlvbiBzY2FuVGFncyhkaXJzOiBzdHJpbmdbXSk6IHN0cmluZ1tdIHtcbiAgY29uc3QgdGFncyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xuICBmb3IgKGNvbnN0IGRpciBvZiBkaXJzKSB7XG4gICAgY29uc3QgZXhwYW5kZWQgPSBleHBhbmRQYXRoKGRpcik7XG4gICAgaWYgKCFleGlzdHNTeW5jKGV4cGFuZGVkKSkgY29udGludWU7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IG91dHB1dCA9IGV4ZWNTeW5jKGByZyAtLW5vLWZpbGVuYW1lIC1vUCAnKD88PTopW146XSsoPz06KScgLWcgJyoub3JnJyAtLW5vLWxpbmUtbnVtYmVyIFwiJHtleHBhbmRlZH1cImAsIHtcbiAgICAgICAgZW5jb2Rpbmc6IFwidXRmLThcIixcbiAgICAgICAgdGltZW91dDogNTAwMCxcbiAgICAgIH0pO1xuICAgICAgb3V0cHV0XG4gICAgICAgIC5zcGxpdChcIlxcblwiKVxuICAgICAgICAuZmlsdGVyKEJvb2xlYW4pXG4gICAgICAgIC5mb3JFYWNoKCh0KSA9PiB0YWdzLmFkZCh0LnRyaW0oKSkpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gcmcgcmV0dXJucyBleGl0IDEgaWYgbm8gbWF0Y2hlc1xuICAgIH1cbiAgfVxuICByZXR1cm4gWy4uLnRhZ3NdLnNvcnQoKTtcbn1cblxuLyoqIFNlYXJjaCBub3RlcyB3aXRoIHJpcGdyZXAsIHJldHVybiBtYXRjaGluZyBmaWxlIHBhdGhzICovXG5leHBvcnQgZnVuY3Rpb24gc2VhcmNoTm90ZXMoZGlyczogc3RyaW5nW10sIHF1ZXJ5OiBzdHJpbmcpOiBzdHJpbmdbXSB7XG4gIGlmICghcXVlcnkudHJpbSgpKSByZXR1cm4gW107XG4gIGNvbnN0IHBhdGhzID0gZGlycy5tYXAoZXhwYW5kUGF0aCkuZmlsdGVyKGV4aXN0c1N5bmMpO1xuICBpZiAocGF0aHMubGVuZ3RoID09PSAwKSByZXR1cm4gW107XG4gIHRyeSB7XG4gICAgY29uc3QgZXNjYXBlZFF1ZXJ5ID0gcXVlcnkucmVwbGFjZSgvWydcIlxcXFxdL2csIFwiXFxcXCQmXCIpO1xuICAgIGNvbnN0IG91dHB1dCA9IGV4ZWNTeW5jKFxuICAgICAgYHJnIC1sIC1pIC0tZ2xvYiAnKi5vcmcnIFwiJHtlc2NhcGVkUXVlcnl9XCIgJHtwYXRocy5tYXAoKHApID0+IGBcIiR7cH1cImApLmpvaW4oXCIgXCIpfWAsXG4gICAgICB7IGVuY29kaW5nOiBcInV0Zi04XCIsIHRpbWVvdXQ6IDEwMDAwIH0sXG4gICAgKTtcbiAgICByZXR1cm4gb3V0cHV0LnNwbGl0KFwiXFxuXCIpLmZpbHRlcihCb29sZWFuKTtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIFtdO1xuICB9XG59XG5cbi8qKiBSZWFkIHRoZSB0aXRsZSBmcm9tICMrdGl0bGU6IGhlYWRlciwgZmFsbGluZyBiYWNrIHRvIGZpbGVuYW1lIHNsdWcgKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkVGl0bGUoZmlsZXBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIHRyeSB7XG4gICAgY29uc3QgaGVhZCA9IHJlYWRGaWxlU3luYyhmaWxlcGF0aCwgXCJ1dGYtOFwiKS5zbGljZSgwLCA1MDApO1xuICAgIGNvbnN0IG1hdGNoID0gaGVhZC5tYXRjaCgvXiNcXCt0aXRsZTpcXHMqKC4rKSQvbSk7XG4gICAgaWYgKG1hdGNoKSByZXR1cm4gbWF0Y2hbMV0udHJpbSgpO1xuICB9IGNhdGNoIHtcbiAgICAvLyBmYWxsIHRocm91Z2hcbiAgfVxuICBjb25zdCBwYXJzZWQgPSBwYXJzZUZpbGVuYW1lKGZpbGVwYXRoKTtcbiAgcmV0dXJuIHBhcnNlZCA/IHBhcnNlZC50aXRsZSA6IGJhc2VuYW1lKGZpbGVwYXRoLCBcIi5vcmdcIik7XG59XG5cbi8qKiBPcGVuIGEgZmlsZSBpbiB0aGUgY29uZmlndXJlZCBlZGl0b3IgKi9cbmV4cG9ydCBmdW5jdGlvbiBvcGVuSW5FZGl0b3IoZWRpdG9yQ21kOiBzdHJpbmcsIGZpbGVwYXRoOiBzdHJpbmcpOiB2b2lkIHtcbiAgZXhlY1N5bmMoYCR7ZWRpdG9yQ21kfSBcIiR7ZmlsZXBhdGh9XCJgLCB7IHRpbWVvdXQ6IDUwMDAgfSk7XG59XG4iXSwKICAibWFwcGluZ3MiOiAiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxpQkFBaUY7QUFDakYsbUJBQW9DOzs7QUNEcEMsMkJBQXlCO0FBQ3pCLGdCQUFnRjtBQUNoRixrQkFBK0I7QUFDL0IsZ0JBQXdCO0FBR2pCLFNBQVMsV0FBVyxHQUFtQjtBQUM1QyxTQUFPLEVBQUUsV0FBVyxHQUFH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
