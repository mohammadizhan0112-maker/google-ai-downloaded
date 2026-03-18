import fs from 'fs';
import path from 'path';

const REPO = 'mohammadizhan0112-maker/crypto00';
const BRANCH = 'main';

async function fetchDir(dirPath: string) {
  const url = `https://api.github.com/repos/${REPO}/contents/${dirPath}?ref=${BRANCH}`;
  console.log(`Fetching ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Failed to fetch ${url}: ${res.statusText}`);
    return;
  }
  const items = await res.json();
  
  for (const item of items) {
    if (item.type === 'file') {
      await fetchFile(item.path, item.download_url);
    } else if (item.type === 'dir') {
      const fullPath = path.join(process.cwd(), item.path);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
      await fetchDir(item.path);
    }
  }
}

async function fetchFile(filePath: string, downloadUrl: string) {
  console.log(`Downloading ${filePath}`);
  const res = await fetch(downloadUrl);
  if (!res.ok) {
    console.error(`Failed to download ${filePath}: ${res.statusText}`);
    return;
  }
  const content = await res.text();
  const fullPath = path.join(process.cwd(), filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content);
}

async function main() {
  await fetchDir('src');
  await fetchDir('public');
  await fetchFile('index.html', `https://raw.githubusercontent.com/${REPO}/${BRANCH}/index.html`);
  await fetchFile('vite.config.ts', `https://raw.githubusercontent.com/${REPO}/${BRANCH}/vite.config.ts`);
  await fetchFile('tsconfig.json', `https://raw.githubusercontent.com/${REPO}/${BRANCH}/tsconfig.json`);
  await fetchFile('package.json', `https://raw.githubusercontent.com/${REPO}/${BRANCH}/package.json`);
  console.log('Done fetching repo.');
}

main().catch(console.error);
