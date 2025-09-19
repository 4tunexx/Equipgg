const fs = require('fs');
const path = require('path');

// Function to find all TypeScript and JavaScript files recursively
function findTsxFiles(dir) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      results = results.concat(findTsxFiles(fullPath));
    } else if (file.match(/\.(tsx?|jsx?|ts|js)$/)) {
      results.push(fullPath);
    }
  }
  
  return results;
}

// Main function
function main() {
  console.log('🔧 Starting comprehensive import fixes...');
  
  const rootDir = process.cwd();
  const srcDir = `${rootDir}/src`;
  
  let allFiles = [];
  const srcDirs = ['app', 'components', 'contexts', 'hooks', 'lib', 'config', 'types', 'sockets', 'ai'];
  
  for (const dirName of srcDirs) {
    const dirPath = `${srcDir}/${dirName}`;
    if (fs.existsSync(dirPath)) {
      allFiles = allFiles.concat(findTsxFiles(dirPath));
      console.log(`📁 Processing ${dirName} directory...`);
    }
  }
  
  if (allFiles.length === 0) {
    console.log(`❌ No files found to process`);
    return;
  }
  
  let fixedFiles = 0;
  
  for (const file of allFiles) {
    try {
      let content = fs.readFileSync(file, 'utf8');
      let hasChanges = false;
      const originalContent = content;
      
      // Get relative paths for this file
      const fileDir = path.dirname(file);
      
      // Replace all @/ imports with relative paths
      const patterns = [
        { pattern: /@\/components\//g, target: 'src/components/' },
        { pattern: /@\/lib\//g, target: 'src/lib/' },
        { pattern: /@\/hooks\//g, target: 'src/hooks/' },
        { pattern: /@\/contexts\//g, target: 'src/contexts/' },
        { pattern: /@\/config\//g, target: 'src/config/' },
        { pattern: /@\/types\//g, target: 'src/types/' },
        { pattern: /@\/sockets\//g, target: 'src/sockets/' },
        { pattern: /@\/ai\//g, target: 'src/ai/' }
      ];
      
      for (const { pattern, target } of patterns) {
        content = content.replace(pattern, (match) => {
          hasChanges = true;
          const targetDir = path.join(rootDir, target);
          const relativePath = path.relative(fileDir, targetDir);
          return `${relativePath}/`;
        });
      }
      
      // Fix any remaining standalone @/ imports
      const standalonePattern = /from ['"]@\/([^'"]+)['"]/g;
      content = content.replace(standalonePattern, (match, importPath) => {
        hasChanges = true;
        const targetFile = path.join(rootDir, 'src', importPath);
        const relativePath = path.relative(fileDir, targetFile);
        return `from "${relativePath}"`;
      });
      
      // Fix dynamic imports too
      const dynamicPattern = /import\(['"]@\/([^'"]+)['"]\)/g;
      content = content.replace(dynamicPattern, (match, importPath) => {
        hasChanges = true;
        const targetFile = path.join(rootDir, 'src', importPath);
        const relativePath = path.relative(fileDir, targetFile);
        return `import('${relativePath}')`;
      });
      
      if (hasChanges) {
        fs.writeFileSync(file, content);
        console.log(`✅ Fixed imports in: ${path.relative(rootDir, file)}`);
        fixedFiles++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Fixed imports in ${fixedFiles} files!`);
}

main();