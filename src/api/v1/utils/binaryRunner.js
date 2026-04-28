import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const GS_PATH = process.env.GS_PATH || 'gs';
const SOFFICE_PATH = process.env.SOFFICE_PATH || 'soffice';
const TESSERACT_PATH = process.env.TESSERACT_PATH || 'tesseract';
const CONVERT_PATH = process.env.CONVERT_PATH || 'convert'; // ImageMagick

const EXEC_TIMEOUT = 120_000; // 2 minutes

/**
 * Run Ghostscript command.
 */
export async function runGhostscript(args) {
  try {
    const { stdout, stderr } = await execFileAsync(GS_PATH, args, { timeout: EXEC_TIMEOUT });
    return { stdout, stderr };
  } catch (err) {
    console.error('[ghostscript] failed:', err.stderr || err.message);
    throw new Error('Ghostscript processing failed');
  }
}

/**
 * Run LibreOffice headless conversion.
 * @param {string} inputPath - Input file path
 * @param {string} outputDir - Output directory
 * @param {string} format - Target format (pdf, docx, pptx, xlsx, etc.)
 */
export async function runLibreOffice(inputPath, outputDir, format = 'pdf') {
  try {
    const { stdout, stderr } = await execFileAsync(SOFFICE_PATH, [
      '--headless',
      '--convert-to', format,
      '--outdir', outputDir,
      inputPath,
    ], { timeout: EXEC_TIMEOUT });
    return { stdout, stderr };
  } catch (err) {
    console.error('[libreoffice] failed:', err.stderr || err.message);
    throw new Error('LibreOffice processing failed');
  }
}

/**
 * Run Tesseract OCR.
 * @param {string} inputPath - Input image/PDF path
 * @param {string} outputBase - Output base path (without extension)
 * @param {string} lang - Language code
 * @param {string} outputFormat - pdf, txt, hocr
 */
export async function runTesseract(inputPath, outputBase, lang = 'eng', outputFormat = 'pdf') {
  try {
    const { stdout, stderr } = await execFileAsync(TESSERACT_PATH, [
      inputPath, outputBase, '-l', lang, outputFormat,
    ], { timeout: EXEC_TIMEOUT });
    return { stdout, stderr };
  } catch (err) {
    console.error('[tesseract] failed:', err.stderr || err.message);
    throw new Error('OCR processing failed');
  }
}

/**
 * Run ImageMagick convert.
 */
export async function runImageMagick(args) {
  try {
    const { stdout, stderr } = await execFileAsync(CONVERT_PATH, args, { timeout: EXEC_TIMEOUT });
    return { stdout, stderr };
  } catch (err) {
    console.error('[imagemagick] failed:', err.stderr || err.message);
    throw new Error('Image processing failed');
  }
}

/**
 * Check if a binary is available on the system.
 */
export async function checkBinary(name) {
  try {
    await execFileAsync('which', [name], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}
