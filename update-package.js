const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Ensure devDependencies exists
if (!pkg.devDependencies) pkg.devDependencies = {};

// Force add TypeScript deps
pkg.devDependencies.typescript = "5.3.3";
pkg.devDependencies["@types/react"] = "18.3.3";
pkg.devDependencies["@types/node"] = "20.14.0";
pkg.devDependencies["@types/react-dom"] = "18.3.0";

// Update scripts
pkg.scripts.prebuild = "node scripts/force-typescript.js && node scripts/ensure-components.js && node scripts/fix-auth-pages.js";
pkg.scripts.build = "next build";
pkg.scripts["vercel-build"] = "npm install && npm run build";

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✅ package.json updated');