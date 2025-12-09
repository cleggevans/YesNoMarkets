/**
 * Project Verification Script
 * Verifies that all required files and configurations are present
 */

const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'contracts/YesNoMarket.sol',
  'hardhat.config.js',
  'package.json',
  'README.md',
  '.gitignore',
  'LICENSE',
];

const recommendedFiles = [
  'test/YesNoMarket.test.js',
  'scripts/deploy.js',
  'SECURITY.md',
  'CONTRIBUTING.md',
  '.env.example',
];

console.log('🔍 Verifying YesNoMarket project structure...\n');

let allGood = true;

// Check required files
console.log('📋 Checking required files:');
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING!`);
    allGood = false;
  }
});

console.log('\n📋 Checking recommended files:');
recommendedFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ⚠️  ${file} - Recommended but missing`);
  }
});

// Check package.json
console.log('\n📦 Checking package.json:');
try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  console.log(`  ✅ Name: ${packageJson.name}`);
  console.log(`  ✅ Version: ${packageJson.version}`);
  console.log(`  ✅ Scripts: ${Object.keys(packageJson.scripts || {}).length} scripts found`);
} catch (e) {
  console.log(`  ❌ Error reading package.json: ${e.message}`);
  allGood = false;
}

// Check contracts directory
console.log('\n📄 Checking contracts:');
const contractsDir = path.join(__dirname, '..', 'contracts');
if (fs.existsSync(contractsDir)) {
  const contracts = fs.readdirSync(contractsDir);
  console.log(`  ✅ Contracts directory exists`);
  console.log(`  ✅ Found ${contracts.length} items in contracts/`);
} else {
  console.log(`  ❌ Contracts directory missing!`);
  allGood = false;
}

// Check test directory
console.log('\n🧪 Checking tests:');
const testDir = path.join(__dirname, '..', 'test');
if (fs.existsSync(testDir)) {
  const tests = fs.readdirSync(testDir);
  console.log(`  ✅ Test directory exists`);
  console.log(`  ✅ Found ${tests.length} test file(s)`);
} else {
  console.log(`  ⚠️  Test directory missing`);
}

// Summary
console.log('\n' + '='.repeat(50));
if (allGood) {
  console.log('✅ Project structure verification PASSED!');
  console.log('\nYour project is ready for:');
  console.log('  - GitHub submission to DappBay');
  console.log('  - Deployment to BSC Testnet');
  console.log('  - Further development');
} else {
  console.log('❌ Project structure verification FAILED!');
  console.log('Please fix the missing required files before proceeding.');
}
console.log('='.repeat(50));

process.exit(allGood ? 0 : 1);

