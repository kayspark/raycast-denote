import { execSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { PNG } from "pngjs";
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pixelmatchModule = require("pixelmatch");
const pixelmatch = pixelmatchModule.default || pixelmatchModule;

const SCREENSHOTS_DIR = join(__dirname, "..", "screenshots");
const BASELINE_DIR = join(SCREENSHOTS_DIR, "baseline");
const CURRENT_DIR = join(SCREENSHOTS_DIR, "current");
const DIFF_DIR = join(SCREENSHOTS_DIR, "diff");

/** Run AppleScript and return trimmed output */
export function osascript(script: string): string {
  return execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
    encoding: "utf-8",
    timeout: 10000,
  }).trim();
}

/** Activate Raycast and wait for it to be ready */
export function activateRaycast(): void {
  osascript('tell application "Raycast" to activate');
  sleep(500);
}

/** Dismiss Raycast */
export function dismissRaycast(): void {
  osascript(
    'tell application "System Events" to tell process "Raycast" to keystroke (ASCII character 27)',
  );
  sleep(300);
  osascript(
    'tell application "System Events" to tell process "Raycast" to keystroke (ASCII character 27)',
  );
  sleep(300);
}

/** Type text into the active Raycast window */
export function typeInRaycast(text: string): void {
  osascript(
    `tell application "System Events" to tell process "Raycast" to keystroke "${text}"`,
  );
}

/** Press Return key */
export function pressReturn(): void {
  osascript(
    'tell application "System Events" to tell process "Raycast" to keystroke return',
  );
}

/** Sleep for ms */
export function sleep(ms: number): void {
  execSync(`/bin/sleep ${ms / 1000}`, { timeout: ms + 5000 });
}

/** Capture full screen with Raycast in foreground, return path.
 *  Uses AppleScript to ensure Raycast is frontmost at capture time. */
export function captureRaycastWindow(name: string): string {
  mkdirSync(CURRENT_DIR, { recursive: true });
  const outputPath = join(CURRENT_DIR, `${name}.png`);
  // Re-activate Raycast right before capture so it's definitely in front
  execSync(
    `osascript -e 'tell application "Raycast" to activate' -e 'delay 0.5' -e 'do shell script "screencapture -x \\"${outputPath}\\""'`,
    { timeout: 10000 },
  );
  return outputPath;
}

/** Compare current screenshot against baseline. Returns diff percentage (0-100). */
export function compareScreenshots(
  name: string,
): { diffPercent: number; diffPath: string | null; isNewBaseline: boolean } {
  const currentPath = join(CURRENT_DIR, `${name}.png`);
  const baselinePath = join(BASELINE_DIR, `${name}.png`);
  const diffPath = join(DIFF_DIR, `${name}-diff.png`);

  if (!existsSync(currentPath)) {
    throw new Error(`Current screenshot not found: ${currentPath}`);
  }

  // If no baseline, save current as baseline
  if (!existsSync(baselinePath)) {
    mkdirSync(dirname(baselinePath), { recursive: true });
    writeFileSync(baselinePath, readFileSync(currentPath));
    return { diffPercent: 0, diffPath: null, isNewBaseline: true };
  }

  const baseline = PNG.sync.read(readFileSync(baselinePath));
  const current = PNG.sync.read(readFileSync(currentPath));

  // Handle size mismatch
  if (baseline.width !== current.width || baseline.height !== current.height) {
    return { diffPercent: 100, diffPath: null, isNewBaseline: false };
  }

  const { width, height } = baseline;
  const diff = new PNG({ width, height });

  const numDiffPixels = pixelmatch(baseline.data, current.data, diff.data, width, height, {
    threshold: 0.3,
  });

  const totalPixels = width * height;
  const diffPercent = (numDiffPixels / totalPixels) * 100;

  if (diffPercent > 0) {
    mkdirSync(dirname(diffPath), { recursive: true });
    writeFileSync(diffPath, PNG.sync.write(diff));
  }

  return { diffPercent, diffPath: diffPercent > 0 ? diffPath : null, isNewBaseline: false };
}
