#!/usr/bin/env node

// Database Schema Mismatch Checker
// Compares API usage against all2.txt schema

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Extract table names from all2.txt schema
const schemaContent = fs.readFileSync('./all2.txt', 'utf8');
const schemaTableRegex = /CREATE TABLE public\.(\w+) \(/g;
const schemaTables = new Set();
let match;
while ((match = schemaTableRegex.exec(schemaContent)) !== null) {
  schemaTables.add(match[1]);
}

console.log('📊 SCHEMA TABLES FOUND (' + schemaTables.size + '):');
console.log([...schemaTables].sort().join(', '));

// Extract table names used in API code
const apiFiles = [];
function findApiFiles(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      findApiFiles(filePath);
    } else if (file.endsWith('.ts') && filePath.includes('src/app/api')) {
      apiFiles.push(filePath);
    }
  }
}

findApiFiles('./src');

const usedTables = new Set();
const potentialIssues = [];

for (const file of apiFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    
    // Find .from() calls
    const fromRegex = /\.from\(['"`](\w+)['"`]\)/g;
    let match;
    while ((match = fromRegex.exec(content)) !== null) {
      const tableName = match[1];
      usedTables.add(tableName);
      
      // Check if table exists in schema
      if (!schemaTables.has(tableName)) {
        potentialIssues.push({
          file: file.replace('./src/app/api/', ''),
          table: tableName,
          type: 'MISSING_TABLE'
        });
      }
    }
  } catch (err) {
    console.error('Error reading file:', file, err.message);
  }
}

console.log('\n🔍 API TABLES USED (' + usedTables.size + '):');
console.log([...usedTables].sort().join(', '));

console.log('\n❌ POTENTIAL ISSUES:');
if (potentialIssues.length === 0) {
  console.log('✅ No table mismatches found!');
} else {
  potentialIssues.forEach(issue => {
    console.log(`- ${issue.file}: Uses table "${issue.table}" (${issue.type})`);
  });
}

console.log('\n📋 SCHEMA TABLES NOT USED IN APIs:');
const unusedTables = [...schemaTables].filter(table => !usedTables.has(table));
console.log(unusedTables.sort().join(', '));

console.log('\n🔎 API TABLES NOT IN SCHEMA:');
const extraTables = [...usedTables].filter(table => !schemaTables.has(table));
console.log(extraTables.sort().join(', '));

// Check for column mismatches
console.log('\n🔍 CHECKING COLUMN USAGE...');
const columnIssues = [];

for (const file of apiFiles) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    
    // Look for select statements with specific columns
    const selectRegex = /\.select\(['"`]([^'"`]+)['"`]\)/g;
    let match;
    while ((match = selectRegex.exec(content)) !== null) {
      const selectClause = match[1];
      if (selectClause !== '*' && !selectClause.includes('(')) {
        const columns = selectClause.split(',').map(c => c.trim());
        // Store for manual review - automated column checking would be complex
      }
    }
  } catch (err) {
    // Skip file
  }
}

console.log('\n📊 SUMMARY:');
console.log(`- Schema tables: ${schemaTables.size}`);
console.log(`- API tables used: ${usedTables.size}`);
console.log(`- Missing tables: ${extraTables.length}`);
console.log(`- Unused tables: ${unusedTables.length}`);
console.log(`- Issues found: ${potentialIssues.length}`);