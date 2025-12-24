# File Downloader Test Plan

## Application Overview

Test plan for the File Downloader page at https://the-internet.herokuapp.com/download. Focus: verify downloads of various file types, link behavior, content validation, error handling, and edge cases (concurrent downloads, special filenames, missing files). Assumptions: tests run on a clean environment with network access and a temporary download folder per test; use Playwright (Chromium) with download events to capture files.

## Test Scenarios

### 1. File Downloader - Functional

**Seed:** `tests/seed.spec.ts`

#### 1.1. Happy path: download a text file

**File:** `tests/downloads/text-file.spec.ts`

**Steps:**
  1. 1. Navigate to `https://the-internet.herokuapp.com/download` (assume blank start state).
  2. 2. Locate the link `some-file.txt` and click it.
  3. 3. Use Playwright's `page.waitForEvent('download')` to capture the download object.
  4. 4. Wait for the download to complete and save it to a temporary path.
  5. 5. Read the file content and assert it is a non-empty text file and matches expected pattern (contains readable ASCII or known text snippet).

**Expected Results:**
  - Download event is emitted.
  - The saved file exists on disk.
  - File size > 0 bytes and content is valid textual data.

#### 1.2. Download and validate JSON file content

**File:** `tests/downloads/json-file.spec.ts`

**Steps:**
  1. 1. Navigate to the download page.
  2. 2. Click the `file.json` link and capture the download with `page.waitForEvent('download')`.
  3. 3. Save the file, parse it as JSON, and assert it parses without error.
  4. 4. Verify expected JSON structure (e.g., top-level object/array or specific keys if known).

**Expected Results:**
  - JSON download completes successfully.
  - Parsed JSON structure is valid per expectations.

#### 1.3. Download binary image and validate metadata

**File:** `tests/downloads/image-file.spec.ts`

**Steps:**
  1. 1. Click `spectrum-logo.png` and capture download.
  2. 2. Save the file and verify file signature/magic bytes correspond to PNG (e.g., starts with PNG header).
  3. 3. Optionally validate image dimensions using an image library if available (or at least non-zero byte length).

**Expected Results:**
  - File saved and begins with PNG magic bytes.
  - File size > 0 and file is readable by image tools.

#### 1.4. Download Excel file and verify it's a valid spreadsheet

**File:** `tests/downloads/excel-file.spec.ts`

**Steps:**
  1. 1. Click `excelParaValidar.xlsx` and capture download.
  2. 2. Save the file and verify it's a valid XLSX archive (e.g., open as zip or check `[Content_Types].xml` exists).
  3. 3. Optionally parse a sheet to verify non-empty cells if tooling available.

**Expected Results:**
  - XLSX file saved and recognized as a valid Office Open XML spreadsheet.
  - Basic structural checks pass (zip archive with expected entries).

#### 1.5. PDF download check

**File:** `tests/downloads/pdf-file.spec.ts`

**Steps:**
  1. 1. Click `test_document.pdf` and capture download.
  2. 2. Save the file and confirm it starts with PDF header `%PDF-` and file size > 0.
  3. 3. Optionally run a lightweight sanity check (page count > 0) using a PDF tool if available.

**Expected Results:**
  - PDF file saved and starts with `%PDF-`.
  - File is non-empty and appears valid.

#### 1.6. Verify link URLs are relative and return 200 OK

**File:** `tests/downloads/links-http-status.spec.ts`

**Steps:**
  1. 1. For each download link on the page, extract the `href` attribute.
  2. 2. Request the URL via Playwright's `page.request.get` to check server response (or use `fetch`).
  3. 3. Assert response status is 200 and `content-type` is appropriate for file type when known.

**Expected Results:**
  - All listed download URLs return 200 OK.
  - Content-type is reasonable for the file (e.g., `application/pdf`, `image/png`, `application/json`, `text/plain`).

#### 1.7. Edge case: click non-existent file and assert behavior (404)

**File:** `tests/downloads/404-missing-file.spec.ts`

**Steps:**
  1. 1. Construct or navigate to a path expected to be missing (e.g., `download/does-not-exist.txt`).
  2. 2. Request the resource and assert server returns 404 or suitable error behavior.
  3. 3. Also validate UI behavior if a link to a missing file is present (click should result in an error or no download).

**Expected Results:**
  - Missing resource returns 404/appropriate error.
  - No successful download occurs for missing files.

#### 1.8. Concurrent downloads stress test

**File:** `tests/downloads/concurrent-downloads.spec.ts`

**Steps:**
  1. 1. Identify multiple files on the page (choose at least 5 small files).
  2. 2. Trigger downloads near-simultaneously (click quickly or programmatically call link hrefs).
  3. 3. Wait for `download` events for each and ensure all complete successfully.
  4. 4. Verify distinct saved file paths and contents.

**Expected Results:**
  - All downloads complete without collisions.
  - All saved files exist and content is intact.

#### 1.9. Filename edge cases: special characters and temp names

**File:** `tests/downloads/special-filenames.spec.ts`

**Steps:**
  1. 1. If present, click files with unusual names (e.g., `tmprzpm83g_.txt` and others).
  2. 2. Save and verify filenames are preserved or sanitized consistently by the browser/Playwright.
  3. 3. Check for path traversal protection (no `../` segments resolved on the client).

**Expected Results:**
  - Filenames preserve characters safely or are sanitized but unique.
  - No path traversal occurs; downloads are contained within the expected folder.

#### 1.10. Download header checks: Content-Disposition and caching

**File:** `tests/downloads/headers.spec.ts`

**Steps:**
  1. 1. For several files, use `page.request.get(href)` to inspect response headers.
  2. 2. Assert presence and correctness of `Content-Disposition` (attachment; filename=...) when expected.
  3. 3. Verify caching headers (Cache-Control / ETag) behave consistently across file types.

**Expected Results:**
  - Responses include expected headers guiding browser download behavior.
  - Filename in `Content-Disposition` matches link target or actual file name when provided.
