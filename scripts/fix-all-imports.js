#!/usr/bin/env node

/**
 * Fix all UI imports in the app directory
 * Replace @/components/ui imports with relative paths
 */

const fs = require('fs');
const path = require('path');

// Function to recursively find all .tsx files
function findTsxFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findTsxFiles(fullPath, files);
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Function to calculate relative path from app file to components/ui
function getRelativePath(fromFile) {
  // Get the working directory - use process.cwd() to work in both local and Vercel
  const rootDir = process.cwd();
  const appDir = `${rootDir}/src/app`;
  const componentsDir = `${rootDir}/src/components`;
  
  // Get the directory of the file
  const fileDir = path.dirname(fromFile);
  
  // Calculate relative path from file directory to components
  const relativePath = path.relative(fileDir, componentsDir);
  
  return relativePath || '.';
}

// Main function
function main() {
  console.log('🔧 Starting UI import fixes...');
  
  const rootDir = process.cwd();
  const srcDir = `${rootDir}/src`;
  
  let allFiles = [];
  
  // Process all directories under src/
  const srcDirs = ['app', 'components', 'contexts', 'hooks', 'lib', 'config'];
  
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
      
      // Get relative path for this file
      const relativePath = getRelativePath(file);
      
      // Replace UI component imports
      const uiImportRegex = /from ['"]@\/components\/ui\/([^'"]+)['"]/g;
      const newContent = content.replace(uiImportRegex, (match, componentName) => {
        hasChanges = true;
        return `from "${relativePath}/ui/${componentName}"`;
      });
      
      // Replace regular component imports
      const componentImportRegex = /from ['"]@\/components\/([^'"]+)['"]/g;
      const finalContent = newContent.replace(componentImportRegex, (match, componentName) => {
        if (!componentName.startsWith('ui/')) {
          hasChanges = true;
          return `from "${relativePath}/${componentName}"`;
        }
        return match;
      });
      
      // Replace hook imports
      const hookImportRegex = /from ['"]@\/hooks\/([^'"]+)['"]/g;
      const contentWithHooks = finalContent.replace(hookImportRegex, (match, hookName) => {
        hasChanges = true;
        const hooksPath = path.relative(path.dirname(file), `${rootDir}/src/hooks`);
        return `from "${hooksPath}/${hookName}"`;
      });
      
      // Replace lib imports
      const libImportRegex = /from ['"]@\/lib\/([^'"]+)['"]/g;
      const contentWithLib = contentWithHooks.replace(libImportRegex, (match, libName) => {
        hasChanges = true;
        const libPath = path.relative(path.dirname(file), `${rootDir}/src/lib`);
        return `from "${libPath}/${libName}"`;
      });
      
      // Replace context imports
      const contextImportRegex = /from ['"]@\/contexts\/([^'"]+)['"]/g;
      const contentWithContexts = contentWithLib.replace(contextImportRegex, (match, contextName) => {
        hasChanges = true;
        const contextPath = path.relative(path.dirname(file), `${rootDir}/src/contexts`);
        return `from "${contextPath}/${contextName}"`;
      });
      
      // Replace config imports  
      const configImportRegex = /from ['"]@\/config\/([^'"]+)['"]/g;
      const finalContentWithConfig = contentWithContexts.replace(configImportRegex, (match, configName) => {
        hasChanges = true;
        const configPath = path.relative(path.dirname(file), `${rootDir}/src/config`);
        return `from "${configPath}/${configName}"`;
      });
      
      if (hasChanges) {
        fs.writeFileSync(file, finalContentWithConfig);
        console.log(`✅ Fixed imports in: ${file}`);
        fixedFiles++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Fixed imports in ${fixedFiles} files!`);
}

main();