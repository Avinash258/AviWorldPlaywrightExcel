// spec: specs/downloads.test.plan.md
// seed: tests/seed.spec.ts

import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import ExcelJS from 'exceljs';

test.describe('File Downloader - Functional', () => {
  test("Download Excel file and verify it's a valid spreadsheet", async ({ page }) => {
    // 1. Click `excelParaValidar.xlsx` and capture download.
    await page.goto('https://the-internet.herokuapp.com/download');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('link', { name: 'excelParaValidar.xlsx' }).click(),
    ]);

    // 2. Save the file into the project's `download/` folder and verify file signature/magic bytes correspond to ZIP (PK\x03\x04).
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    const downloadsDir = path.join(process.cwd(), 'download');
    await fs.mkdir(downloadsDir, { recursive: true });
    const savedPath = path.join(downloadsDir, download.suggestedFilename());
    await download.saveAs(savedPath);

    const buf = await fs.readFile(savedPath);
    // ZIP files start with bytes: 0x50 0x4B 0x03 0x04 ('PK\x03\x04')
    expect(buf.subarray(0, 4)).toEqual(Buffer.from([0x50, 0x4B, 0x03, 0x04]));

    // 3. Verify the archive contains `[Content_Types].xml` indicating a valid OOXML spreadsheet.
    expect(buf.includes(Buffer.from('[Content_Types].xml'))).toBeTruthy();

    // Open the workbook with ExcelJS and replace any row containing 'NO DEBE ESTAR' so all A..D in that row become 'test'
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(savedPath);
    const sheet = workbook.getWorksheet(1);
    let replaced = false;
    sheet?.eachRow((row, rowNumber) => {
      row.eachCell({ includeEmpty: true }, (cell) => {
        const v = cell.value;
        if (typeof v === 'string' && v.includes('NO DEBE ESTAR')) {
          for (let col = 1; col <= 4; col++) {
            sheet.getRow(rowNumber).getCell(col).value = 'test';
          }
          replaced = true;
        }
      });
    });

    if (replaced) {
      await workbook.xlsx.writeFile(savedPath);
    }

    // Re-open and verify at least one row A..D is all 'test'
    const workbook2 = new ExcelJS.Workbook();
    await workbook2.xlsx.readFile(savedPath);
    const sheet2 = workbook2.getWorksheet(1);
    let foundRowAllTest = false;
    sheet2?.eachRow((row) => {
      const vals = [1,2,3,4].map(c => row.getCell(c).value);
      if (vals.every(v => v === 'test')) foundRowAllTest = true;
    });
    expect(foundRowAllTest).toBeTruthy();

    // 4. Optionally, check file size > 0 and suggested filename equals `excelParaValidar.xlsx`.
    const newBuf = await fs.readFile(savedPath);
    expect(newBuf.length).toBeGreaterThan(0);
    expect(download.suggestedFilename()).toBe('excelParaValidar.xlsx');
  });
});