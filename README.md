# Mappable JS API Hints Package

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

## Contributing

> To get started in the `.env` file, you need to declare `APIKEY` https://mappable.world/docs/js-api/quickstart.html#get-api-key:

To get started:

```sh
npm start
```

or so if you didn't create the `.env` file

```sh
APIKEY=%APIKEY% npm start
```

To check with linter:

```sh
npm run lint
```

For the final build:

```sh
npm run build
```

## GitHub actions

After you create a new tag, or just push changes to the server, ci will be launched

```sh
npm version prerelease --preid=beta --no-git-tag-version
git add --all
git commit -m "New version"
git tag 0.0.1-beta.2
git push --tags origin HEAD:main
```

CI described here

- `.github/workflows/release.yml` - triggered when a new tag is created
- `.github/workflows/tests.yml` - triggers on any push to the main branch

For it to work, you need to declare two secrets in the GitHub Action:

- `APIKEY` - To run autotests on the JS API https://mappable.world/docs/js-api/quickstart.html#get-api-key
- `NPM_TOKEN` - To publish your package to npm
