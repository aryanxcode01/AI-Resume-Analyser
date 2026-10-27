import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import { ApiError } from '../errors/api-error.js';

export const maxUploadBytes = 5 * 1024 * 1024;
const pdfMimeType = 'application/pdf';
const docxMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function isDocxBuffer(buffer) {
  return (
    buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04])) &&
    buffer.includes(Buffer.from('[Content_Types].xml')) &&
    buffer.includes(Buffer.from('word/'))
  );
}

export async function identifyDocument(buffer) {
  if (buffer.subarray(0, 5).toString('ascii') === '%PDF-') {
    return { mimeType: pdfMimeType, kind: 'pdf' };
  }
  if (isDocxBuffer(buffer)) return { mimeType: docxMimeType, kind: 'docx' };
  return null;
}

export async function validateUploadedDocument(file) {
  if (!file) throw new ApiError(400, 'FILE_REQUIRED', 'Choose a PDF or DOCX resume to upload.');
  if (file.size > maxUploadBytes) {
    throw new ApiError(413, 'FILE_TOO_LARGE', 'Resume files must be 5 MB or smaller.');
  }
  const document = await identifyDocument(file.buffer);
  if (!document) {
    throw new ApiError(415, 'INVALID_FILE', 'Only valid PDF and DOCX files can be uploaded.');
  }
  if (file.mimetype !== document.mimeType) {
    throw new ApiError(415, 'MIME_MISMATCH', 'The file type does not match its contents.');
  }
  return document;
}

export function normalizeExtractedText(text) {
  return text
    .replaceAll('\u0000', '')
    .replaceAll('\r\n', '\n')
    .replaceAll(/[ \t]+/g, ' ')
    .replaceAll(/\n{3,}/g, '\n\n')
    .trim();
}

async function extractPdf(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

async function extractDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

export async function extractResumeText(buffer, kind) {
  try {
    const rawText = kind === 'pdf' ? await extractPdf(buffer) : await extractDocx(buffer);
    const text = normalizeExtractedText(rawText);
    if (text.length < 200) {
      throw new ApiError(
        422,
        'UNREADABLE_DOCUMENT',
        'We could not read enough text from this file. It may be scanned or unsupported.',
      );
    }
    return text;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(422, 'EXTRACTION_FAILED', 'We could not read this resume file.');
  }
}
