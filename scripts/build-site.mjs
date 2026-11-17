import { mkdir, readdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
await mkdir(output, { recursive: true });
const files = (await readdir(root)).filter(name => /\.(html|css|js|svg|png)$/.test(name) || name === '.nojekyll');
await Promise.all(files.map(name => copyFile(path.join(root, name), path.join(output, name))));
console.log(`Packaged ${files.length} website files in dist/`);
