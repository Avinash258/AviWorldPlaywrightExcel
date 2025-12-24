// spec: specs/downloads.test.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

test.describe('File Downloader - Functional', () => {
  test('Happy path: download a text file', async ({ page }) => {
    // 1. Navigate to `https://the-internet.herokuapp.com/download` (assume blank start state).
    await page.goto('https://the-internet.herokuapp.com/download');

    // 2. Locate the link `some-file.txt` and click it.
    // 3. Use Playwright's `page.waitForEvent('download')` to capture the download object.
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: 'some-file.txt' }).click(),
    ]);

    // 4. Wait for the download to complete and save it to the project's `download/` folder.
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    // Ensure download folder exists and save the file there
    const downloadsDir = path.join(process.cwd(), 'download');
    await fs.mkdir(downloadsDir, { recursive: true });
    const savedPath = path.join(downloadsDir, download.suggestedFilename());
    await download.saveAs(savedPath);

    // 5. Read the saved file content and assert it is a non-empty text file and matches expected pattern.
    const content = await fs.readFile(savedPath, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
    // Basic sanity: contains printable ASCII characters
    expect(/^[\x20-\x7E\r\n]+$/.test(content.trim())).toBeTruthy();

    // Verify suggested filename matches the link target
    expect(download.suggestedFilename()).toBe('some-file.txt');
  });
});