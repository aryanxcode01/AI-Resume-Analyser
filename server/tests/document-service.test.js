import { describe, expect, it } from 'vitest';
import { ApiError } from '../src/errors/api-error.js';
import {
  normalizeExtractedText,
  validateUploadedDocument,
} from '../src/services/document-service.js';

const pdfHeader = Buffer.from('%PDF-1.7\n%resume content');
const docxHeader = Buffer.concat([
  Buffer.from([0x50, 0x4b, 0x03, 0x04]),
  Buffer.from('[Content_Types].xml word/document.xml'),
]);

function file(buffer, mimetype, size = buffer.length) {
  return { buffer, mimetype, size, originalname: 'resume' };
}

describe('document validation', () => {
  it('accepts a PDF only when MIME type and signature agree', async () => {
    await expect(validateUploadedDocument(file(pdfHeader, 'application/pdf'))).resolves.toEqual({
      mimeType: 'application/pdf',
      kind: 'pdf',
    });
  });

  it('accepts a DOCX only when its container markers are present', async () => {
    await expect(
      validateUploadedDocument(
        file(docxHeader, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
      ),
    ).resolves.toEqual({
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      kind: 'docx',
    });
  });

  it('rejects a claimed PDF with non-PDF contents', async () => {
    await expect(
      validateUploadedDocument(file(Buffer.from('not a document'), 'application/pdf')),
    ).rejects.toMatchObject({ code: 'INVALID_FILE', status: 415 });
  });

  it('rejects a file whose declared type does not match its contents', async () => {
    await expect(
      validateUploadedDocument(
        file(pdfHeader, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'),
      ),
    ).rejects.toMatchObject({ code: 'MIME_MISMATCH', status: 415 });
  });

  it('rejects a file above the 5 MB limit', async () => {
    await expect(
      validateUploadedDocument(file(pdfHeader, 'application/pdf', 5 * 1024 * 1024 + 1)),
    ).rejects.toMatchObject({ code: 'FILE_TOO_LARGE', status: 413 });
  });
});

describe('extracted text normalization', () => {
  it('keeps paragraph boundaries while removing noisy whitespace', () => {
    expect(normalizeExtractedText('First   line\r\n\r\n\r\nSecond\u0000 line')).toBe(
      'First line\n\nSecond line',
    );
  });
});

describe('API errors', () => {
  it('provide stable client-safe fields', () => {
    const error = new ApiError(422, 'UNREADABLE_DOCUMENT', 'Readable message');
    expect(error.status).toBe(422);
    expect(error.code).toBe('UNREADABLE_DOCUMENT');
  });
});
