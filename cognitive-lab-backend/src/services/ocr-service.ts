import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import crypto from 'crypto';
import os from 'os';

const execAsync = promisify(exec);

export class OcrService {
  private workerPath: string;
  private pythonEnv: string;

  constructor() {
    this.workerPath = path.resolve(__dirname, 'ocr_worker.py');
    this.pythonEnv = path.resolve(__dirname, '../../venv/bin/python3');
    
    // Fallback to system python if venv is not available
    if (!fs.existsSync(this.pythonEnv)) {
      this.pythonEnv = 'python3';
    }
  }

  async recognize(base64Image: string): Promise<string> {
    if (!base64Image) {
      throw new Error('No image provided');
    }

    // Extract base64 data
    const matches = base64Image.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    let imageBuffer: Buffer;

    if (matches && matches.length === 3) {
      imageBuffer = Buffer.from(matches[2], 'base64');
    } else {
      imageBuffer = Buffer.from(base64Image, 'base64');
    }

    // Write temp file
    const tempFileName = `ocr_${crypto.randomUUID()}.png`;
    const tempFilePath = path.join(os.tmpdir(), tempFileName);

    try {
      await fs.promises.writeFile(tempFilePath, imageBuffer);

      // Run python script
      const { stdout, stderr } = await execAsync(`PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True HOME=${path.resolve(__dirname, '../../')} ${this.pythonEnv} ${this.workerPath} ${tempFilePath}`);
      
      // Parse output. It might contain some warnings from paddleocr, so find the JSON line
      const lines = stdout.split('\n');
      let resultObj = null;
      for (const line of lines.reverse()) {
        try {
          resultObj = JSON.parse(line.trim());
          if (resultObj.success !== undefined) break;
        } catch {
          // ignore parsing errors on non-json lines
        }
      }

      if (!resultObj) {
        throw new Error(`Failed to parse OCR output: ${stdout || stderr}`);
      }

      if (!resultObj.success) {
        throw new Error(`OCR Error: ${resultObj.error}`);
      }

      return resultObj.text || '';
    } finally {
      // Clean up
      try {
        if (fs.existsSync(tempFilePath)) {
          await fs.promises.unlink(tempFilePath);
        }
      } catch (cleanupError) {
        console.error('Failed to clean up temp file:', cleanupError);
      }
    }
  }
}
