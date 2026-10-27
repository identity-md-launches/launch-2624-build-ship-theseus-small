import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'dist');
// Only the generated export is cleared. No dependency, cache or source enters it.
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
const files = ['index.html', 'changelog/index.html', 'assets/site.css', 'assets/ship.js', 'assets/state.js', 'assets/favicon.svg', 'assets/share.png'];
for (const name of files) {
  await mkdir(join(dist, name, '..'), { recursive: true });
  await cp(join(root, 'src', name), join(dist, name));
  const file = await stat(join(dist, name));
  if (!file.isFile() || file.size === 0) throw new Error(`Export missing: ${name}`);
}
console.log('Built dist/: two static pages and local assets. No runtime dependencies.');
