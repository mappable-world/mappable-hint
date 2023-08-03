# Mappable JS API Hints Package

---

[![Build Status](https://github.com/mappable-world/mappable-hint/workflows/Run%20tests/badge.svg)](https://github.com/mappable-world/mappable-hint/actions/workflows/tests.yml)
[![npm version](https://badge.fury.io/js/@mappable-world%2Fmappable-hint.svg)](https://badge.fury.io/js/@mappable-world%2Fmappable-hint)
[![npm](https://img.shields.io/npm/dm/@mappable-world/mappable-hint.svg)](https://www.npmjs.com/package/@mappable-world/mappable-hint)

The package adds the functionality of hanging hints on map elements

## How use

The package is located in the `dist` folder:

- `dist/types` TypeScript types
- `dist/esm` es6 modules for direct connection in your project
- `dist/index.js` Mappable JS Module

to use Mappable JS Module you need to add your module loading handler to JS API

```js
mappable.import.loaders.unshift(async (pkg) => {
  if (!pkg.includes('mappable-hint')) {
    return;
  }

  if (location.href.includes('localhost')) {
    await mappable.import.script(`/dist/index.js`);
  } else {
    // You can use another CDN
    await mappable.import.script(`https://unpkg.com/${pkg}/dist/index.js`);
  }

  const [_, pkgName] = pkg.split('@')
  Object.assign(mappable, window[`@${pkgName}`]);
  return window[`@${pkgName}`];
});
```

and in your final code just use `mappable.import`

```js
const pkg = await mappable.import('@mappable-world/mappable-hint@0.0.1')
```
