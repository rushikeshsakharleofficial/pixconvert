const fs = require('fs');
const path = require('path');

const files = [
  "src/components/About.jsx",
  "src/components/AddPageNumbers.jsx",
  "src/components/AddWatermark.jsx",
  "src/components/ComingSoon.jsx",
  "src/components/Contact.jsx",
  "src/components/CropPdf.jsx",
  "src/components/DropZone.jsx",
  "src/components/EditPdf.jsx",
  "src/components/ErrorBoundary.jsx",
  "src/components/ExcelToPdf.jsx",
  "src/components/ExtractPages.jsx",
  "src/components/FolderUpload.jsx",
  "src/components/Footer.jsx",
  "src/components/GifMaker.jsx",
  "src/components/Home.jsx",
  "src/components/HtmlToPdf.jsx",
  "src/components/JpgToPdf.jsx",
  "src/components/MergePdf.jsx",
  "src/components/Navbar.jsx",
  "src/components/NotFound.jsx",
  "src/utils/fileHelpers.js",
  "src/utils/formatSize.js",
  "src/utils/htmlToPdf.js",
  "src/utils/isHeic.js",
  "src/utils/pdfPasswordCheck.js",
  "src/utils/pptxExtractText.js"
];

const results = {};

files.forEach(file => {
  const absolutePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(absolutePath)) {
    console.error(`Missing: ${file}`);
    return;
  }
  const content = fs.readFileSync(absolutePath, 'utf-8');
  
  const imports = { external: [], internal: [] };
  const exports = { named: [], default: null };
  let usesServer = false;

  // Extract imports
  // Handles import X from 'y', import { X } from 'y', import 'y'
  const importRegex = /import\s+(?:(?:\*\s+as\s+\w+|[\w\s{},*]+)\s+from\s+)?['"](.*?)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const source = match[1];
    if (source.startsWith('.') || source.startsWith('/')) {
        if (!imports.internal.includes(source)) imports.internal.push(source);
    } else {
        if (!imports.external.includes(source)) imports.external.push(source);
    }
  }

  // Extract dynamic imports
  const dynamicImportRegex = /import\(['"](.*?)['"]\)/g;
  while ((match = dynamicImportRegex.exec(content)) !== null) {
      const source = match[1];
      if (source.startsWith('.') || source.startsWith('/')) {
        if (!imports.internal.includes(source)) imports.internal.push(source);
    } else {
        if (!imports.external.includes(source)) imports.external.push(source);
    }
  }

  // Extract default export
  // export default Name; or export default function Name() {}
  const defaultExportRegex = /export\s+default\s+(?:function\s+|class\s+)?(\w+)/;
  const defaultMatch = content.match(defaultExportRegex);
  if (defaultMatch) {
    exports.default = defaultMatch[1];
  } else {
      // Handles export default () => ... or export default React.memo(...)
      const defaultExportOther = /export\s+default\s+([^;]*)/;
      const defaultMatchOther = content.match(defaultExportOther);
      if (defaultMatchOther) {
          const val = defaultMatchOther[1].trim();
          if (val.startsWith('(') || val.startsWith('function') || val.startsWith('class')) {
              exports.default = "anonymous";
          } else {
              exports.default = val.split('(')[0].trim();
          }
      }
  }
  
  // Extract named exports
  const namedExportRegex1 = /export\s+(?:const|let|var|function|class)\s+(\w+)/g;
  while ((match = namedExportRegex1.exec(content)) !== null) {
    exports.named.push(match[1]);
  }
  const namedExportListRegex = /export\s+\{([^}]+)\}/g;
  while ((match = namedExportListRegex.exec(content)) !== null) {
    const names = match[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0]).filter(s => s);
    names.forEach(n => {
        if (n !== 'default') exports.named.push(n);
        else if (!exports.default) exports.default = "from_list";
    });
  }

  // Check usesServer
  // Search for /api/, /upload, /contact or fetch to a server-side endpoint
  if (content.includes('/api/') || content.includes('/upload') || content.includes('/contact') || content.includes('/cleanup') || content.includes('axios.')) {
      usesServer = true;
  }
  // Also check for fetch call that doesn't look like a local asset
  if (/fetch\s*\(\s*['"](?!.*\.svg|.*\.png|.*\.css|.*\.json|http)/.test(content)) {
      usesServer = true;
  }

  results[file] = {
    path: file,
    exports,
    imports,
    usesServer,
    usedBy: []
  };
});

// Compute usedBy for utils
const utils = Object.keys(results).filter(f => f.startsWith('src/utils/'));
Object.values(results).forEach(fileData => {
  fileData.imports.internal.forEach(imp => {
    let resolved;
    if (imp.startsWith('.')) {
        // Resolve relative path
        resolved = path.resolve(path.dirname(fileData.path), imp);
        // Normalize for comparison
        resolved = path.relative(process.cwd(), resolved).replace(/\\/g, '/');
    } else if (imp.startsWith('/')) {
        // Absolute from root
        resolved = imp.substring(1);
    }
    
    if (resolved) {
        utils.forEach(utilFile => {
            const utilNoExt = utilFile.replace(/\.(js|jsx)$/, '');
            if (resolved === utilFile || resolved === utilNoExt) {
                if (!results[utilFile].usedBy.includes(fileData.path)) {
                    results[utilFile].usedBy.push(fileData.path);
                }
            }
        });
    }
  });
});

console.log(JSON.stringify(Object.values(results), null, 2));
