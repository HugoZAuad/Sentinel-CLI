import * as fs from 'fs';
import * as path from 'path';

export function saveReport(filename: string, data: any) {
  const dir = path.resolve(process.cwd(), 'reports');

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }

  const filePath = path.join(dir, `${filename}.json`);

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  return filePath;
}