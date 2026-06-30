import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const outputRoot = path.join(projectRoot, 'static-assets');
const sourceOrigin = 'http://test.yudao.iocoder.cn';

const ignoredDirs = new Set([
  'node_modules',
  'unpackage',
  '.git',
  'dist',
  'static-assets',
]);

const allowedExtensions = new Set([
  '.vue',
  '.js',
  '.ts',
  '.json',
  '.scss',
  '.css',
]);

const resourcePaths = new Set();

function scanDirectory(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
      continue;
    }

    if (!allowedExtensions.has(path.extname(entry.name))) {
      continue;
    }

    const content = fs.readFileSync(fullPath, 'utf8');

    // 提取代码中的 /static/... 资源路径
    const matches = content.matchAll(
      /['"`](\/static\/[^'"`\s)]+)['"`]/g,
    );

    for (const match of matches) {
      resourcePaths.add(match[1]);
    }
  }
}

async function downloadFile(resourcePath) {
  const sourceUrl = `${sourceOrigin}${resourcePath}`;
  const targetPath = path.join(
    outputRoot,
    resourcePath.replace(/^\/+/, ''),
  );

  try {
    const response = await fetch(sourceUrl, {
      redirect: 'follow',
    });

    if (!response.ok) {
      console.error(`下载失败 ${response.status}: ${sourceUrl}`);
      return;
    }

    fs.mkdirSync(path.dirname(targetPath), {
      recursive: true,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(targetPath, buffer);

    console.log(`下载成功: ${resourcePath}`);
  } catch (error) {
    console.error(`下载异常: ${sourceUrl}`, error.message);
  }
}

scanDirectory(projectRoot);

console.log(`共找到 ${resourcePaths.size} 个静态资源`);

for (const resourcePath of resourcePaths) {
  await downloadFile(resourcePath);
}

console.log(`资源保存目录：${outputRoot}`);