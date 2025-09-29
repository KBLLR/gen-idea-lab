/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// Import the complete module data from JSON
import moduleData from '../../docs/modules-code-university.json';

// Add resources field to each module for compatibility
const rawModules = moduleData.map(module => ({
  ...module,
  "resources": [
    { "type": "figma", "url": "" },
    { "type": "github", "url": "" },
    { "type": "notion", "url": "" },
    { "type": "googledrive", "url": "" }
  ]
}));

// Clean the data by removing citation marks
const cleanString = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/:contentReference\[.*?\]\{index=\d+\}/g, '').trim();
}

const cleanedModules = rawModules.map(module => {
    const cleanedModule = {};
    for (const key in module) {
        if (Array.isArray(module[key])) {
            cleanedModule[key] = module[key].map(cleanString);
        } else {
            cleanedModule[key] = cleanString(module[key]);
        }
    }
    return cleanedModule;
})
.filter(module => !module['Module Code'].startsWith('BM_')); // Remove BM modules

// Create a lookup object by module code
export const modules = cleanedModules.reduce((acc, module) => {
  acc[module['Module Code']] = module;
  return acc;
}, {});

// Group modules by discipline for the UI
export const modulesByDiscipline = cleanedModules.reduce((acc, module) => {
  const moduleCode = module['Module Code'];
  let discipline;

  if (moduleCode.startsWith('DS_')) {
    discipline = 'Human-Computer Design (DS)';
  } else if (moduleCode.startsWith('SE_')) {
    discipline = 'Software Engineering (SE)';
  } else if (moduleCode.startsWith('STS_')) {
    discipline = 'Science, Technology and Society (STS)';
  } else if (moduleCode.startsWith('BA_')) {
    discipline = 'Synthesis (BA)';
  } else {
    discipline = 'Foundation & Orientation';
  }

  if (!acc[discipline]) {
    acc[discipline] = [];
  }
  acc[discipline].push(module);
  return acc;
}, {});

// Keep backwards compatibility
export const modulesBySemester = modulesByDiscipline;