import {
  Action,
  ActionPanel,
  Form,
  getPreferenceValues,
  showToast,
  Toast,
} from "@raycast/api";
import { useState, useEffect } from "react";
import { createNote, scanTags, expandPath, openInEditor } from "./utils/denote";

interface Preferences {
  notesDir: string;
  papersDir: string;
  editorCmd: string;
}

export default function CreateNote() {
  const prefs = getPreferenceValues<Preferences>();
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    const dirs = [prefs.notesDir, `${prefs.papersDir}/notes`].map(expandPath);
    setTags(scanTags(dirs));
  }, []);

  async function handleSubmit(values: {
    title: string;
    tags: string[];
    content: string;
    directory: string;
  }) {
    if (!values.title.trim()) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Title is required",
      });
      return;
    }
    try {
      const filepath = createNote(
        values.directory,
        values.title,
        values.tags,
        values.content,
      );
      try {
        openInEditor(prefs.editorCmd, filepath);
      } catch {
        // Editor open failed — note still created
      }
      await showToast({
        style: Toast.Style.Success,
        title: "Note created",
        message: values.title,
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to create note",
        message: String(error),
      });
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Create Note" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextField id="title" title="Title" placeholder="Note title..." />
      <Form.TagPicker id="tags" title="Tags">
        {tags.map((tag) => (
          <Form.TagPicker.Item key={tag} value={tag} title={tag} />
        ))}
      </Form.TagPicker>
      <Form.TextArea
        id="content"
        title="Content"
        placeholder="Note content (optional)..."
      />
      <Form.Dropdown
        id="directory"
        title="Directory"
        defaultValue={prefs.notesDir}
      >
        <Form.Dropdown.Item value={prefs.notesDir} title="Notes" />
        <Form.Dropdown.Item
          value={`${prefs.papersDir}/notes`}
          title="Paper Notes"
        />
        <Form.Dropdown.Item
          value={expandPath("~/org/meeting")}
          title="Meeting"
        />
      </Form.Dropdown>
    </Form>
  );
}
