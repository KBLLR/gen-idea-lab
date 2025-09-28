#!/usr/bin/env node

/**
 * CSS Audit Script for Design Tokens
 * 
 * This script analyzes the codebase to extract:
 * - All CSS custom properties (variables)
 * - Hard-coded values (colors, spacing, etc.)
 * - Usage patterns
 * 
 * Outputs to /reports/design-audit.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  rootDir: path.resolve(__dirname, '..'),
  srcDir: path.resolve(__dirname, '../src'),
  outputDir: path.resolve(__dirname, '../reports'),
  outputFile: 'design-audit.json',
  includedExtensions: ['.css', '.scss', '.js', '.jsx', '.ts', '.tsx'],
  excludedDirs: ['node_modules', '.git', 'dist', 'build', '.next']
};

// Regex patterns for extraction
const patterns = {
  customProperties: /--[\w-]+\s*:\s*([^;]+)/g,
  customPropertyUsage: /var\(--[\w-]+[^)]*\)/g,
  hexColors: /#(?:[0-9a-fA-F]{3}){1,2}/g,
  rgbColors: /rgba?\([^)]+\)/g,
  hslColors: /hsla?\([^)]+\)/g,
  pixelValues: /\b\d+(?:\.\d+)?px\b/g,
  remValues: /\b\d+(?:\.\d+)?rem\b/g,
  emValues: /\b\d+(?:\.\d+)?em\b/g,
  percentValues: /\b\d+(?:\.\d+)?%/g,
  zIndexValues: /z-index\s*:\s*(\d+)/g,
  borderRadius: /border-radius\s*:\s*([^;]+)/g,
  boxShadow: /box-shadow\s*:\s*([^;]+)/g,
  transition: /transition\s*:\s*([^;]+)/g,
  fontFamily: /font-family\s*:\s*([^;]+)/g,
  fontWeight: /font-weight\s*:\s*([^;]+)/g,
  fontSize: /font-size\s*:\s*([^;]+)/g
};

class CSSAuditor {
  constructor() {
    this.results = {
      metadata: {
        timestamp: new Date().toISOString(),
        totalFiles: 0,
        totalLines: 0
      },
      customProperties: {
        definitions: {}, // where properties are defined
        usage: {}        // where properties are used
      },
      hardcodedValues: {
        colors: new Set(),
        spacing: new Set(),
        typography: new Set(),
        shadows: new Set(),
        zIndex: new Set(),
        borderRadius: new Set(),
        transitions: new Set()
      },
      fileAnalysis: {},
      summary: {}
    };
  }

  // Get all files to analyze
  getFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!config.excludedDirs.includes(item)) {
          this.getFiles(fullPath, files);
        }
      } else {
        const ext = path.extname(item);
        if (config.includedExtensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
    
    return files;
  }

  // Analyze a single file
  analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const relativePath = path.relative(config.rootDir, filePath);
    const lines = content.split('\n');
    
    this.results.metadata.totalFiles++;
    this.results.metadata.totalLines += lines.length;

    const fileResults = {
      path: relativePath,
      extension: path.extname(filePath),
      lines: lines.length,
      customProperties: {
        definitions: [],
        usage: []
      },
      hardcodedValues: {
        colors: [],
        spacing: [],
        typography: [],
        shadows: [],
        zIndex: [],
        borderRadius: [],
        transitions: []
      }
    };

    // Extract custom property definitions
    let match;
    while ((match = patterns.customProperties.exec(content)) !== null) {
      const property = match[0].split(':')[0].trim();
      const value = match[1].trim();
      
      fileResults.customProperties.definitions.push({
        property,
        value,
        line: this.getLineNumber(content, match.index)
      });

      if (!this.results.customProperties.definitions[property]) {
        this.results.customProperties.definitions[property] = [];
      }
      this.results.customProperties.definitions[property].push({
        file: relativePath,
        value,
        line: this.getLineNumber(content, match.index)
      });
    }

    // Extract custom property usage
    patterns.customPropertyUsage.lastIndex = 0;
    while ((match = patterns.customPropertyUsage.exec(content)) !== null) {
      const usage = match[0];
      fileResults.customProperties.usage.push({
        usage,
        line: this.getLineNumber(content, match.index)
      });

      if (!this.results.customProperties.usage[usage]) {
        this.results.customProperties.usage[usage] = [];
      }
      this.results.customProperties.usage[usage].push({
        file: relativePath,
        line: this.getLineNumber(content, match.index)
      });
    }

    // Extract hardcoded values
    this.extractHardcodedValues(content, fileResults, relativePath);

    this.results.fileAnalysis[relativePath] = fileResults;
    return fileResults;
  }

  // Extract various hardcoded values
  extractHardcodedValues(content, fileResults, filePath) {
    const extractors = [
      { pattern: patterns.hexColors, category: 'colors', set: this.results.hardcodedValues.colors },
      { pattern: patterns.rgbColors, category: 'colors', set: this.results.hardcodedValues.colors },
      { pattern: patterns.hslColors, category: 'colors', set: this.results.hardcodedValues.colors },
      { pattern: patterns.pixelValues, category: 'spacing', set: this.results.hardcodedValues.spacing },
      { pattern: patterns.remValues, category: 'spacing', set: this.results.hardcodedValues.spacing },
      { pattern: patterns.emValues, category: 'spacing', set: this.results.hardcodedValues.spacing },
      { pattern: patterns.fontFamily, category: 'typography', set: this.results.hardcodedValues.typography },
      { pattern: patterns.fontSize, category: 'typography', set: this.results.hardcodedValues.typography },
      { pattern: patterns.fontWeight, category: 'typography', set: this.results.hardcodedValues.typography },
      { pattern: patterns.boxShadow, category: 'shadows', set: this.results.hardcodedValues.shadows },
      { pattern: patterns.zIndexValues, category: 'zIndex', set: this.results.hardcodedValues.zIndex },
      { pattern: patterns.borderRadius, category: 'borderRadius', set: this.results.hardcodedValues.borderRadius },
      { pattern: patterns.transition, category: 'transitions', set: this.results.hardcodedValues.transitions }
    ];

    for (const extractor of extractors) {
      let match;
      extractor.pattern.lastIndex = 0;
      while ((match = extractor.pattern.exec(content)) !== null) {
        const value = match[1] || match[0];
        extractor.set.add(value);
        fileResults.hardcodedValues[extractor.category].push({
          value,
          line: this.getLineNumber(content, match.index)
        });
      }
    }
  }

  // Get line number from character index
  getLineNumber(content, index) {
    return content.substr(0, index).split('\n').length;
  }

  // Generate summary statistics
  generateSummary() {
    // Convert Sets to Arrays for JSON serialization
    Object.keys(this.results.hardcodedValues).forEach(key => {
      this.results.hardcodedValues[key] = Array.from(this.results.hardcodedValues[key]);
    });

    this.results.summary = {
      customProperties: {
        totalDefinitions: Object.keys(this.results.customProperties.definitions).length,
        totalUsage: Object.keys(this.results.customProperties.usage).length,
        mostUsedProperties: this.getMostUsedProperties()
      },
      hardcodedValues: {
        colors: this.results.hardcodedValues.colors.length,
        spacing: this.results.hardcodedValues.spacing.length,
        typography: this.results.hardcodedValues.typography.length,
        shadows: this.results.hardcodedValues.shadows.length,
        zIndex: this.results.hardcodedValues.zIndex.length,
        borderRadius: this.results.hardcodedValues.borderRadius.length,
        transitions: this.results.hardcodedValues.transitions.length
      },
      recommendations: this.generateRecommendations()
    };
  }

  // Get most frequently used custom properties
  getMostUsedProperties() {
    const usage = {};
    Object.entries(this.results.customProperties.usage).forEach(([prop, locations]) => {
      usage[prop] = locations.length;
    });

    return Object.entries(usage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([prop, count]) => ({ property: prop, usageCount: count }));
  }

  // Generate recommendations for token strategy
  generateRecommendations() {
    const recommendations = [];
    
    // Color recommendations
    if (this.results.hardcodedValues.colors.length > 20) {
      recommendations.push({
        category: 'colors',
        severity: 'high',
        message: `Found ${this.results.hardcodedValues.colors.length} hardcoded color values. Consider creating a color palette token system.`,
        values: this.results.hardcodedValues.colors.slice(0, 10)
      });
    }

    // Spacing recommendations
    if (this.results.hardcodedValues.spacing.length > 30) {
      recommendations.push({
        category: 'spacing',
        severity: 'high',
        message: `Found ${this.results.hardcodedValues.spacing.length} hardcoded spacing values. Consider creating a spacing scale.`,
        values: this.results.hardcodedValues.spacing.slice(0, 10)
      });
    }

    // Typography recommendations
    if (this.results.hardcodedValues.typography.length > 15) {
      recommendations.push({
        category: 'typography',
        severity: 'medium',
        message: `Found ${this.results.hardcodedValues.typography.length} hardcoded typography values. Consider creating typography tokens.`,
        values: this.results.hardcodedValues.typography.slice(0, 8)
      });
    }

    return recommendations;
  }

  // Run the full audit
  async run() {
    console.log('🔍 Starting CSS audit...');
    console.log(`📁 Scanning directory: ${config.srcDir}`);

    const files = this.getFiles(config.srcDir);
    console.log(`📄 Found ${files.length} files to analyze`);

    // Analyze each file
    for (const file of files) {
      try {
        this.analyzeFile(file);
      } catch (error) {
        console.warn(`⚠️  Error analyzing ${file}: ${error.message}`);
      }
    }

    // Generate summary
    this.generateSummary();

    // Ensure output directory exists
    if (!fs.existsSync(config.outputDir)) {
      fs.mkdirSync(config.outputDir, { recursive: true });
    }

    // Write results
    const outputPath = path.join(config.outputDir, config.outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));

    console.log('✅ Audit complete!');
    console.log(`📊 Results saved to: ${outputPath}`);
    console.log(`📈 Analyzed ${this.results.metadata.totalFiles} files (${this.results.metadata.totalLines} lines)`);
    console.log(`🎨 Found ${this.results.summary.customProperties.totalDefinitions} custom properties`);
    console.log(`🔧 Found ${Object.values(this.results.summary.hardcodedValues).reduce((a, b) => a + b, 0)} hardcoded values`);
    
    if (this.results.summary.recommendations.length > 0) {
      console.log(`💡 Generated ${this.results.summary.recommendations.length} recommendations`);
      this.results.summary.recommendations.forEach(rec => {
        console.log(`   ${rec.severity.toUpperCase()}: ${rec.message}`);
      });
    }
  }
}

// Run the audit if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const auditor = new CSSAuditor();
  auditor.run().catch(console.error);
}

export default CSSAuditor;