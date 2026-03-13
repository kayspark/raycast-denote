import { describe, it, expect, afterAll } from "vitest";
import { execSync, spawn } from "child_process";
import { mkdirSync, existsSync } from "fs";
import { join } from "path";
import { compareScreenshots } from "./helpers";

const SCREENSHOTS_DIR = join(__dirname, "..", "screenshots");
const CURRENT_DIR = join(SCREENSHOTS_DIR, "current");
const DIFF_THRESHOLD = 5; // percent

function sleep(ms: number): void {
  execSync(`/bin/sleep ${ms / 1000}`, { timeout: ms + 5000 });
}

/** Launch screencapture in a detached process with delay */
function scheduleCaptue(outputPath: string, delaySec: number): void {
  const cap = spawn("/bin/sh", ["-c", `sleep ${delaySec} && screencapture -x "${outputPath}"`], {
    detached: true,
    stdio: "ignore",
  });
  cap.unref();
}

/** Open Raycast via Cmd+Space, type command, press Enter */
function openRaycastCommand(command: string): void {
  execSync(
    `osascript -e '
tell application "System Events"
    key code 49 using command down
    delay 1.5
    keystroke "${command}"
    delay 2
    keystroke return
end tell
'`,
    { timeout: 15000 },
  );
}

/** Dismiss Raycast via Escape */
function dismissRaycast(): void {
  execSync(
    `osascript -e '
tell application "System Events"
    key code 53
    delay 0.3
    key code 53
end tell
'`,
    { timeout: 5000 },
  );
}

/** Close the frontmost Emacs frame (not the daemon) */
function closeEmacsFrame(): void {
  try {
    execSync(
      `/Applications/MacPorts/Emacs.app/Contents/MacOS/bin/emacsclient ` +
        `--socket-name=$HOME/.config/emacs/server/server ` +
        `-e '(delete-frame)'`,
      { timeout: 5000 },
    );
  } catch {
    // Frame may already be closed
  }
}

describe("Visual E2E: Search Notes", () => {
  afterAll(() => {
    dismissRaycast();
  });

  it("displays latest notes in search results", () => {
    mkdirSync(CURRENT_DIR, { recursive: true });
    const outputPath = join(CURRENT_DIR, "search-notes-latest.png");

    scheduleCaptue(outputPath, 5);
    openRaycastCommand("Search Notes");
    sleep(6000);
    dismissRaycast();

    expect(existsSync(outputPath)).toBe(true);

    const result = compareScreenshots("search-notes-latest");

    if (result.isNewBaseline) {
      console.log("New baseline created: screenshots/baseline/search-notes-latest.png");
      return;
    }

    if (result.diffPath) {
      console.log(`Diff image saved: ${result.diffPath}`);
      console.log(`Diff: ${result.diffPercent.toFixed(2)}%`);
    }

    expect(result.diffPercent).toBeLessThan(DIFF_THRESHOLD);
  });

  it("opens note in Emacs via Search Notes action", () => {
    mkdirSync(CURRENT_DIR, { recursive: true });
    const outputPath = join(CURRENT_DIR, "emacs-open-note.png");

    // Open Raycast → Search Notes
    openRaycastCommand("Search Notes");
    sleep(2000);

    // Press Enter on the first note — triggers "Open in Emacs" action
    execSync(`osascript -e 'tell application "System Events" to keystroke return'`, {
      timeout: 5000,
    });

    // Wait for Emacs frame to appear, then bring it to front
    sleep(4000);

    // Schedule capture in 2s, then activate Emacs
    scheduleCaptue(outputPath, 2);
    execSync(`osascript -e 'tell application "Emacs" to activate'`, { timeout: 5000 });
    sleep(4000);

    expect(existsSync(outputPath)).toBe(true);

    // Clean up: close the Emacs frame opened by the test
    closeEmacsFrame();

    const result = compareScreenshots("emacs-open-note");

    if (result.isNewBaseline) {
      console.log("New baseline created: screenshots/baseline/emacs-open-note.png");
      return;
    }

    if (result.diffPath) {
      console.log(`Diff image saved: ${result.diffPath}`);
      console.log(`Diff: ${result.diffPercent.toFixed(2)}%`);
    }

    expect(result.diffPercent).toBeLessThan(DIFF_THRESHOLD);
  });
});
