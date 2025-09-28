const StyleDictionary = require('style-dictionary');

// Custom transforms for GenBooth Lab tokens
StyleDictionary.registerTransform({
  name: 'name/cti/gbl-kebab',
  type: 'name',
  transformer: (token) => {
    // Convert camelCase to kebab-case with gbl prefix
    const name = [token.path.join('-')]
      .join('')
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase();
    return `--gbl-${name}`;
  }
});

// Custom format for CSS variables with theme selectors
StyleDictionary.registerFormat({
  name: 'css/themed-variables',
  formatter: function(dictionary, config) {
    const isThemed = config.selector && config.selector.includes('[data-theme=');
    
    let output = '';
    
    if (isThemed) {
      output += `${config.selector} {\n`;
    } else {
      output += ':root {\n';
    }
    
    dictionary.allTokens.forEach(token => {
      const name = `--gbl-${token.path.join('-')}`;
      output += `  ${name}: ${token.value};\n`;
    });
    
    output += '}\n';
    
    return output;
  }
});

// Custom format for TypeScript/JavaScript tokens
StyleDictionary.registerFormat({
  name: 'javascript/es6-nested',
  formatter: function(dictionary) {
    const tokens = {};
    
    dictionary.allTokens.forEach(token => {
      const path = token.path;
      let current = tokens;
      
      path.forEach((segment, index) => {
        if (index === path.length - 1) {
          current[segment] = token.value;
        } else {
          current[segment] = current[segment] || {};
          current = current[segment];
        }
      });
    });
    
    return `export const tokens = ${JSON.stringify(tokens, null, 2)};`;
  }
});

module.exports = {
  source: [
    'primitives/**/*.json',
    'themes/dark.json',
    'components/**/*.json'
  ],
  platforms: {
    // CSS output for dark theme (default)
    'css/dark': {
      transformGroup: 'css',
      transforms: ['attribute/cti', 'name/cti/gbl-kebab', 'color/css'],
      buildPath: '../src/styles/tokens/',
      files: [{
        destination: 'tokens-dark.css',
        format: 'css/themed-variables',
        selector: ':root[data-theme="dark"], :root',
        filter: (token) => token.type === 'color' || 
                           token.type === 'dimension' || 
                           token.type === 'duration' ||
                           token.type === 'boxShadow' ||
                           token.type === 'string'
      }]
    },
    
    // CSS output for light theme
    'css/light': {
      transformGroup: 'css',
      transforms: ['attribute/cti', 'name/cti/gbl-kebab', 'color/css'],
      buildPath: '../src/styles/tokens/',
      source: ['primitives/**/*.json', 'themes/light.json'],
      files: [{
        destination: 'tokens-light.css',
        format: 'css/themed-variables', 
        selector: ':root[data-theme="light"]'
      }]
    },
    
    // JavaScript/TypeScript tokens
    'js': {
      transformGroup: 'js',
      buildPath: '../src/styles/tokens/',
      files: [{
        destination: 'tokens.js',
        format: 'javascript/es6-nested'
      }]
    },
    
    // JSON output for tooling
    'json': {
      transformGroup: 'web',
      buildPath: '../tokens/build/json/',
      files: [{
        destination: 'tokens.json',
        format: 'json/nested'
      }]
    },
    
    // Figma tokens format
    'figma': {
      transformGroup: 'web',
      buildPath: '../tokens/build/figma/',
      files: [{
        destination: 'tokens.json',
        format: 'json/flat'
      }]
    }
  }
};