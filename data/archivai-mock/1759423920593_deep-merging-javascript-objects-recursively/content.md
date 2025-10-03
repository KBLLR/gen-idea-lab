---
title: "Deep Merging JavaScript Objects Recursively"
template: "Code Notebook"
date: "2025-10-02"
purpose: "Save useful code with context"
---

# Deep Merging JavaScript Objects Recursively

*Save useful code with context*

**Date:** 02/10/2025

**Title:** Deep Merging JavaScript Objects Recursively

## Problem / Context

Often, when dealing with configuration objects, state management in UI libraries (like React or Vue), or combining user-provided options with default settings, a simple shallow merge isn't sufficient. Methods like `Object.assign()` or the spread operator (`{...obj1, ...obj2}`) only merge properties at the top level. If there are nested objects, they are overwritten entirely rather than merged.

This snippet addresses the need for a **deep merge**, where nested objects and arrays are also merged recursively, preserving existing keys and adding new ones, without losing data from either source object. This is particularly useful for creating robust, customizable systems where defaults can be overridden incrementally.

## Code Snippet

```
/**
 * Recursively merges two or more objects deeply.
 * Properties in later objects will overwrite properties in earlier ones.
 * Handles nested objects and arrays. Arrays are concatenated.
 *
 * @param {object} target The target object to merge into. This object will be modified.
 * @param {...object} sources The source objects to merge from.
 * @returns {object} The deeply merged object.
 */
function deepMerge(target, ...sources) {
  if (sources.length === 0) {
    return target;
  }

  const source = sources.shift(); // Get the next source object

  // Ensure target is an object and not null, otherwise return source or handle as non-mergeable
  if (typeof target !== 'object' || target === null) {
    return source; // If target is not an object, can't merge into it, just use source
  }

  // Ensure source is an object and not null
  if (typeof source !== 'object' || source === null) {
    return source; // If source is not an object, it's the final value for this path
  }

  // Handle arrays differently
  if (Array.isArray(target) && Array.isArray(source)) {
    // Concatenate arrays. For more complex logic (e.g., merging objects within arrays based on ID),
    // this section would be more elaborate.
    return [...target, ...source];
  }

  // If one is an array and the other is not, the source takes precedence.
  // This avoids trying to merge an array into an object or vice-versa.
  if (Array.isArray(target) !== Array.isArray(source)) {
      return source;
  }

  // Iterate over properties of the source object
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      const targetValue = target[key];
      const sourceValue = source[key];

      if (typeof sourceValue === 'object' && sourceValue !== null && typeof targetValue === 'object' && targetValue !== null) {
        // Both are objects/arrays, recurse
        target[key] = deepMerge(targetValue, sourceValue);
      } else {
        // Otherwise, directly assign/overwrite
        target[key] = sourceValue;
      }
    }
  }

  // Recursively merge the remaining sources
  return deepMerge(target, ...sources);
}
```

## Explanation

- **What it does:** This `deepMerge` function takes a `target` object and one or more `source` objects. It recursively traverses the properties of the source objects, merging them into the target. If a property exists in both target and source and both are objects (or arrays), it calls itself recursively to merge those nested structures. Otherwise, it directly assigns the source's value, effectively overwriting the target's value for primitive types or when types don't match (e.g., an object trying to merge with a string). Arrays are handled by concatenating their elements.

- **Key lines:**
  - **Lines 10-16:** Handles base cases where either target or source is not an object or is null, preventing errors and providing a sensible return value for non-mergeable paths.
  - **Lines 19-24:** Specifically handles array merging. If both are arrays, they are concatenated. If one is an array and the other isn't, the source array takes precedence. This avoids type mismatch errors during recursion.
  - **Lines 31-34:** This is the core recursive step. It checks if both `targetValue` and `sourceValue` are objects (and not null). If so, it calls `deepMerge` again for that nested path, ensuring a deep merge.
  - **Line 36:** For all other cases (primitives, or when one is an object and the other isn't after the array check), the `sourceValue` directly overwrites the `targetValue`.
  - **Line 41:** The function processes additional `sources` arguments sequentially, ensuring all provided objects are merged in order of precedence.

## Usage

- **How to integrate:**
  Simply copy-paste the `deepMerge` function into your JavaScript codebase. You can place it in a utility file (`utils.js`) and import it, or define it directly where needed.

- **Example call:**
  javascript
  const defaultSettings = {
    theme: {
      primaryColor: '#007bff',
      typography: {
        fontSize: '16px',
        fontFamily: 'Arial, sans-serif'
      }
    },
    api: {
      baseUrl: 'https://api.example.com/v1',
      timeout: 5000
    },
    features: ['dark-mode', 'notifications']
  };

  const userSettings = {
    theme: {
      primaryColor: '#6f42c1',
      typography: {
        fontSize: '14px' // Override font size
      }
    },
    api: {
      timeout: 10000 // Override API timeout
    },
    features: ['notifications', 'analytics'] // Concatenate features
  };

  const finalSettings = deepMerge(defaultSettings, userSettings);

  console.log(finalSettings);
  /* Expected Output:
  {
    theme: {
      primaryColor: '#6f42c1', // Overridden
      typography: {
        fontSize: '14px',     // Overridden
        fontFamily: 'Arial, sans-serif' // Retained from default
      }
    },
    api: {
      baseUrl: 'https://api.example.com/v1', // Retained
      timeout: 10000 // Overridden
    },
    features: ['dark-mode', 'notifications', 'notifications', 'analytics'] // Concatenated
  }
  */

  const immutableMerge = deepMerge({}, defaultSettings, userSettings); // To create a new object
  console.log(immutableMerge);

## References

- [Stack Overflow: How to deep merge two Javascript objects?](https://stackoverflow.com/questions/27936772/how-to-deep-merge-two-javascript-objects) – A great resource for various approaches and considerations.
- [Lodash `_.merge` documentation](https://lodash.com/docs/4.17.15#merge) – For a more robust, production-ready solution, libraries like Lodash offer battle-tested `_.merge` functionality, often with more advanced options (like custom array merging resolvers).
- Related concept: `Object.assign()` and Spread Syntax (`{...obj}`), for understanding shallow vs. deep merges.

**Tags / Keywords:** javascript, object-manipulation, deep-merge, recursion, utility-function, configuration, immutable-data
