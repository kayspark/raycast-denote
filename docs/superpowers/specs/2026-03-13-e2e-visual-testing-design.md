# E2E Visual Testing for raycast-denote

## Summary

Add unit tests for core utility functions and a visual E2E test that launches Raycast's "Search Notes" command, captures a screenshot, and compares against a baseline image.

## Architecture

### Unit Tests (vitest)

**denote.ts** — `expandPath`, `generateIdentifier`, `slugify`, `formatOrgDate`, `buildFilename`, `createNote` (temp dir), `parseFilename`, `scanNotes`, `readTitle`

**bibtex.ts** — `parseBibFile`, `extractPdfPath`, `formatAuthors`, `getVenue`

Fixtures: inline or small files in `src/__tests__/fixtures/`. Temp dirs created per suite, cleaned after.

### Visual E2E Test

Single scenario: open "Search Notes" in Raycast, capture the window showing the latest note.

**Flow:**
1. Activate Raycast via AppleScript
2. Type "Search Notes", press Enter
3. Wait for list to render (~2s)
4. Get Raycast window ID via `osascript`
5. `screencapture -l <windowID>` to capture window
6. Save to `src/__tests__/screenshots/current/search-notes-latest.png`
7. If baseline exists in `src/__tests__/screenshots/baseline/`, compare with `pixelmatch`
8. If diff > threshold (5%), fail with diff image saved to `src/__tests__/screenshots/diff/`
9. If no baseline, save as new baseline and pass
10. Dismiss Raycast via Escape key

### VHS Integration

`test.tape` at project root records the full `vitest run` output as a GIF (`src/__tests__/screenshots/test-run.gif`). Serves as visual documentation of test results.

## File Structure

```
src/__tests__/
  denote.test.ts
  bibtex.test.ts
  fixtures/
    sample.bib
  visual/
    search-notes.test.ts
    helpers.ts              # AppleScript helpers, screencapture, pixelmatch wrapper
  screenshots/
    baseline/               # committed
    current/                # gitignored
    diff/                   # gitignored
test.tape                   # VHS tape for recording test run
```

## Dependencies

- `vitest` (dev) — test runner
- `pixelmatch` (dev) — image comparison
- `pngjs` (dev) — PNG encode/decode for pixelmatch

## Scripts

- `"test"`: `"vitest run"`
- `"test:unit"`: `"vitest run src/__tests__/denote.test.ts src/__tests__/bibtex.test.ts"`
- `"test:visual"`: `"vitest run src/__tests__/visual"`
- `"test:record"`: `"vhs test.tape"`

## Constraints

- Visual E2E requires Raycast running with the extension loaded (`ray develop`)
- macOS-only (AppleScript, screencapture)
- Accessibility permissions required for AppleScript UI automation
- Baseline images are environment-specific (resolution, theme) — regenerate per machine
