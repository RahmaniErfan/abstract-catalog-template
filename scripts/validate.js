const fs = require('fs');
const path = require('path');

const catalogPath = path.join(__dirname, '../catalog.json');

function validate() {
  console.log('Starting Catalog Validation...');

  if (!fs.existsSync(catalogPath)) {
    console.error('Error: catalog.json not found!');
    process.exit(1);
  }

  let catalog;
  try {
    catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
  } catch (e) {
    console.error('Error: Failed to parse catalog.json as JSON!');
    console.error(e.message);
    process.exit(1);
  }

  const errors = [];

  // 1. Basic Structure
  if (!catalog.version || !catalog.categories || !catalog.libraries) {
    errors.push('Missing top-level fields (version, categories, libraries)');
  }

  // 2. Category Check
  const categorySet = new Set(catalog.categories || []);
  
  // 3. Library Validation
  const libIds = new Set();
  (catalog.libraries || []).forEach((lib, index) => {
    const context = `Library[${index}] (${lib.id || 'unknown'})`;

    if (!lib.id) errors.push(`${context}: Missing ID`);
    if (libIds.has(lib.id)) errors.push(`${context}: Duplicate ID: ${lib.id}`);
    libIds.add(lib.id);

    if (!lib.repository || !lib.repository.startsWith('https://github.com/')) {
      errors.push(`${context}: Invalid GitHub repository URL: ${lib.repository}`);
    }

    if (!categorySet.has(lib.category)) {
      errors.push(`${context}: Category "${lib.category}" is not in the master categories list`);
    }

    const requiredFields = ['name', 'author', 'description', 'lastVersion'];
    requiredFields.forEach(field => {
      if (!lib[field]) {
        errors.push(`${context}: Missing field: ${field}`);
      }
    });

    if (lib.fundingUrl && !lib.fundingUrl.startsWith('https://')) {
      errors.push(`${context}: Invalid fundingUrl: ${lib.fundingUrl}`);
    }

    if (typeof lib.isVerified !== 'boolean') {
      errors.push(`${context}: Field "isVerified" must be a boolean`);
    }
  });

  // 4. Blacklist Check
  if (!Array.isArray(catalog.blacklist)) {
    errors.push('Top-level field "blacklist" must be an array');
  }

  if (errors.length > 0) {
    console.error(`\nValidation failed with ${errors.length} errors:`);
    errors.forEach(err => console.error(`  - ${err}`));
    process.exit(1);
  } else {
    console.log('\nValidation successful! catalog.json is robust and scalable.');
  }
}

validate();
