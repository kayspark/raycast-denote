import { Action, ActionPanel, Form, getPreferenceValues, showToast, Toast, popToRoot } from "@raycast/api";
import { createNote } from "./utils/denote";

interface Preferences {
  inboxDir: string;
}

export default function QuickCapture() {
  const prefs = getPreferenceValues<Preferences>();

  async function handleSubmit(values: { text: string }) {
    const text = values.text.trim();
    if (!text) {
      await showToast({ style: Toast.Style.Failure, title: "Enter some text" });
      return;
    }
    try {
      const firstLine = text.split("\n")[0].slice(0, 60);
      const title = firstLine || "Inbox";
      createNote(prefs.inboxDir, title, ["inbox"], text);
      await showToast({ style: Toast.Style.Success, title: "Captured", message: firstLine });
      popToRoot();
    } catch (error) {
      await showToast({ style: Toast.Style.Failure, title: "Capture failed", message: String(error) });
    }
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Capture" onSubmit={handleSubmit} />
        </ActionPanel>
      }
    >
      <Form.TextArea id="text" title="" placeholder="Quick thought..." autoFocus />
    </Form>
  );
}
