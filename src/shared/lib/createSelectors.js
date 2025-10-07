// Adds `useStore.use.key()` hooks for every top-level key.
export function createSelectors(store) {
  store.use = store.use || {};
  for (const key of Object.keys(store.getState())) {
    Object.defineProperty(store.use, key, {
      get: () => () => store((s) => s[key]),
    });
  }
  return store;
}
