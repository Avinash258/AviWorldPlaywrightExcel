// spec: specs/downloads.test.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

test.describe('File Downloader - Functional', () => {
  test('Download and validate JSON file content', async ({ page }) => {
    // 1. Navigate to the download page.
    await page.goto('https://the-internet.herokuapp.com/download');

    // 2. Click the `file.json` link and capture the download with `page.waitForEvent('download')`.
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: 'file.json' }).click(),
    ]);

    // 3. Save the file into the project's `download/` folder, parse it as JSON, and assert it parses without error.
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    const downloadsDir = path.join(process.cwd(), 'download');
    await fs.mkdir(downloadsDir, { recursive: true });
    const savedPath = path.join(downloadsDir, download.suggestedFilename());
    await download.saveAs(savedPath);

    const raw = await fs.readFile(savedPath, 'utf-8');
    let parsed: any;
    expect(() => { parsed = JSON.parse(raw); }).not.toThrow();

    // 4. Verify expected JSON structure (object or array with at least one key/item).
    expect(parsed === Object(parsed) || Array.isArray(parsed)).toBeTruthy();
    if (Array.isArray(parsed)) {
      expect(parsed.length).toBeGreaterThan(0);
    } else {
      expect(Object.keys(parsed).length).toBeGreaterThan(0);
    }

    // Suggested filename sanity check
    expect(download.suggestedFilename()).toBe('file.json');
  });
});