#!/usr/bin/env node

/**
 * Design Tokens Validation Script
 * 
 * This script validates:
 * 1. Token file integrity (JSON validation)
 * 2. Token naming conventions
 * 3. Required token coverage
 * 4. Cross-reference consistency
 * 
 * Exit codes:
 * 0 - All validations passed
 * 1 - Validation failures found
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  rootDir: path.resolve(__dirname, '..'),
  tokensDir: path.resolve(__dirname, '../tokens'),
  srcDir: path.resolve(__dirname, '../src'),
  requiredFiles: [
    'tokens/primitives/color.json',
    'tokens/primitives/spacing.json',
    'tokens/primitives/typography.json',
    'tokens/themes/light.json',
    'tokens/themes/dark.json',
    'src/styles/tokens/tokens.css'
  ],
  namingPatterns: {
    primitive: /^(color|spacing|typography|radius|shadow|motion|z-index)-/,
    semantic: /^(surface|text|border|interactive|selection)-/,
    component: /^(button|input|card|modal|nav)-/
  }
};

class TokenValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.validationResults = {
      fileIntegrity: false,
      namingConventions: false,
      coverage: false,
      consistency: false
    };
  }

  // Log validation results
  log(type, message, file = null) {
    const entry = { type, message, file };
    if (type === 'error') {
      this.errors.push(entry);
    } else if (type === 'warning') {
      this.warnings.push(entry);
    }
    
    const icon = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    const fileStr = file ? ` (${file})` : '';
    console.log(`${icon} ${message}${fileStr}`);
  }

  // Validate file integrity
  validateFileIntegrity() {
    console.log('\n🔍 Validating file integrity...');
    let passed = true;

    // Check required files exist
    for (const requiredFile of config.requiredFiles) {
      const filePath = path.join(config.rootDir, requiredFile);
      if (!fs.existsSync(filePath)) {
        this.log('error', `Required file missing: ${requiredFile}`);
        passed = false;
        continue;
      }

      // Validate JSON files
      if (requiredFile.endsWith('.json')) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          JSON.parse(content);
          this.log('info', `✅ Valid JSON: ${requiredFile}`);
        } catch (error) {
          this.log('error', `Invalid JSON: ${error.message}`, requiredFile);
          passed = false;
        }
      }
    }

    this.validationResults.fileIntegrity = passed;
    return passed;
  }

  // Validate naming conventions
  validateNamingConventions() {
    console.log('\n🏷️ Validating naming conventions...');
    let passed = true;

    // Check generated tokens file
    const tokensFile = path.join(config.rootDir, 'src/styles/tokens/tokens.css');
    if (!fs.existsSync(tokensFile)) {
      this.log('warning', 'Generated tokens file not found. Run npm run tokens:build');
      return true; // Don't fail build for this
    }

    try {
      const content = fs.readFileSync(tokensFile, 'utf-8');
      const tokenMatches = content.match(/--[\w-]+/g);
      
      if (tokenMatches) {
        const tokens = [...new Set(tokenMatches)];
        let validTokens = 0;
        let invalidTokens = 0;

        tokens.forEach(token => {
          const cleanToken = token.replace('--', '');
          
          // Check if token follows any valid pattern
          const isValid = Object.values(config.namingPatterns).some(pattern => 
            pattern.test(cleanToken)
          ) || this.isSemanticToken(cleanToken);

          if (isValid) {
            validTokens++;
          } else {
            invalidTokens++;
            if (invalidTokens <= 5) { // Limit output
              this.log('warning', `Unconventional token name: ${token}`);
            }
          }
        });

        this.log('info', `✅ Validated ${tokens.length} tokens (${validTokens} valid, ${invalidTokens} unconventional)`);
        
        if (invalidTokens > 0) {
          this.log('warning', `${invalidTokens} tokens don't follow naming conventions`);
        }
      }
    } catch (error) {
      this.log('error', `Error reading tokens file: ${error.message}`, tokensFile);
      passed = false;
    }

    this.validationResults.namingConventions = passed;
    return passed;
  }

  // Check if token is a semantic token (acceptable naming)
  isSemanticToken(token) {
    const semanticTokens = [
      'surface-primary', 'surface-secondary', 'surface-tertiary', 'surface-quaternary',
      'text-primary', 'text-secondary', 'text-tertiary', 'text-muted', 'text-inverse',
      'border-primary', 'border-secondary', 'border-accent',
      'backdrop-filter', 'radius-none', 'radius-xs', 'radius-sm', 'radius-md', 'radius-lg'
    ];
    return semanticTokens.includes(token);
  }

  // Validate token coverage
  validateCoverage() {
    console.log('\n📊 Validating token coverage...');
    let passed = true;

    const requiredCategories = [
      'color', 'spacing', 'typography', 'radius', 'shadow'
    ];

    const tokensFile = path.join(config.rootDir, 'src/styles/tokens/tokens.css');
    if (!fs.existsSync(tokensFile)) {
      this.log('warning', 'Cannot validate coverage without generated tokens file');
      return true;
    }

    try {
      const content = fs.readFileSync(tokensFile, 'utf-8');
      
      for (const category of requiredCategories) {
        const pattern = new RegExp(`--${category}-`, 'g');
        const matches = content.match(pattern);
        
        if (!matches || matches.length < 3) {
          this.log('warning', `Low coverage for ${category} tokens (${matches?.length || 0} found)`);
        } else {
          this.log('info', `✅ Good coverage for ${category} tokens (${matches.length} found)`);
        }
      }

      // Check for theme support
      const lightThemePattern = /data-theme="light"/g;
      const darkThemePattern = /data-theme="dark"/g;
      
      if (!lightThemePattern.test(content) && !darkThemePattern.test(content)) {
        this.log('warning', 'No theme-specific tokens found');
      } else {
        this.log('info', '✅ Theme support detected');
      }

    } catch (error) {
      this.log('error', `Error validating coverage: ${error.message}`);
      passed = false;
    }

    this.validationResults.coverage = passed;
    return passed;
  }

  // Validate consistency across files
  validateConsistency() {
    console.log('\n🔄 Validating cross-file consistency...');
    let passed = true;

    // Check that legacy.css tokens map to existing tokens
    const legacyFile = path.join(config.rootDir, 'src/styles/tokens/legacy.css');
    const tokensFile = path.join(config.rootDir, 'src/styles/tokens/tokens.css');

    if (fs.existsSync(legacyFile) && fs.existsSync(tokensFile)) {
      try {
        const legacyContent = fs.readFileSync(legacyFile, 'utf-8');
        const tokensContent = fs.readFileSync(tokensFile, 'utf-8');

        // Extract referenced tokens from legacy file
        const legacyReferences = legacyContent.match(/var\(--[\w-]+\)/g);
        
        if (legacyReferences) {
          let missingReferences = 0;
          
          legacyReferences.forEach(ref => {
            const tokenName = ref.replace(/var\(--|\)/g, '');
            if (!tokensContent.includes(`--${tokenName}`)) {
              missingReferences++;
              if (missingReferences <= 3) {
                this.log('warning', `Legacy token references missing token: --${tokenName}`);
              }
            }
          });

          if (missingReferences === 0) {
            this.log('info', '✅ All legacy token references are valid');
          } else {
            this.log('warning', `${missingReferences} legacy token references may be invalid`);
          }
        }
      } catch (error) {
        this.log('error', `Error validating consistency: ${error.message}`);
        passed = false;
      }
    }

    this.validationResults.consistency = passed;
    return passed;
  }

  // Generate validation report
  generateReport() {
    console.log('\n📋 Validation Report');
    console.log('==================');
    
    const results = Object.entries(this.validationResults);
    const passed = results.filter(([_, result]) => result).length;
    const total = results.length;

    results.forEach(([test, result]) => {
      const icon = result ? '✅' : '❌';
      const testName = test.replace(/([A-Z])/g, ' $1').toLowerCase();
      console.log(`${icon} ${testName}: ${result ? 'PASSED' : 'FAILED'}`);
    });

    console.log(`\n📊 Summary: ${passed}/${total} validations passed`);
    
    if (this.warnings.length > 0) {
      console.log(`⚠️  ${this.warnings.length} warning(s)`);
    }
    
    if (this.errors.length > 0) {
      console.log(`❌ ${this.errors.length} error(s)`);
      console.log('\nErrors must be fixed before merging.');
    }

    return this.errors.length === 0;
  }

  // Run all validations
  async validate() {
    console.log('🔍 Starting design token validation...\n');

    const validations = [
      this.validateFileIntegrity(),
      this.validateNamingConventions(),
      this.validateCoverage(),
      this.validateConsistency()
    ];

    const allPassed = validations.every(result => result);
    const reportPassed = this.generateReport();

    return allPassed && reportPassed;
  }
}

// Run validation if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new TokenValidator();
  
  validator.validate()
    .then(success => {
      if (success) {
        console.log('\n🎉 All validations passed! Design tokens are ready.');
        process.exit(0);
      } else {
        console.log('\n💥 Validation failed. Please fix the issues above.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 Validation script error:', error);
      process.exit(1);
    });
}

export default TokenValidator;