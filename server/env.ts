import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadEnvironment() {
  try {
    if (typeof (process as any).loadEnvFile === 'function') {
      const serverEnv = path.resolve(__dirname, '.env');
      const parentEnv = path.resolve(__dirname, '../.env');
      const cwdEnv = path.resolve(process.cwd(), '.env');

      if (fs.existsSync(serverEnv)) {
        (process as any).loadEnvFile(serverEnv);
      } else if (fs.existsSync(parentEnv)) {
        (process as any).loadEnvFile(parentEnv);
      } else if (fs.existsSync(cwdEnv)) {
        (process as any).loadEnvFile(cwdEnv);
      } else {
        (process as any).loadEnvFile();
      }
    }
  } catch {
    // .env not present or environment variables supplied by platform (Docker, Railway, etc.)
  }
}

// Auto-run on import
loadEnvironment();
