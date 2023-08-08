# Mappable JS API Hints Package

---

[![Build Status](https://github.com/mappable-world/mappable-hint/workflows/Run%20tests/badge.svg)](https://github.com/mappable-world/mappable-hint/actions/workflows/tests.yml)
[![npm version](https://badge.fury.io/js/@mappable-world%2Fmappable-hint.svg)](https://www.npmjs.com/package/@mappable-world/mappable-hint)
[![npm](https://img.shields.io/npm/dm/@mappable-world/mappable-hint.svg)](https://www.npmjs.com/package/@mappable-world/mappable-hint)

The package adds the functionality of hanging hints on map elements

- [Demo](https://codesandbox.io/embed/wgqnh8?fontsize=14&hidenavigation=1&theme=dark&initialpath=react.html&module=react.html&moduleview=1)

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

  const [_, pkgName] = pkg.split('@');
  Object.assign(mappable, window[`@${pkgName}`]);
  return window[`@${pkgName}`];
});
```

and in your final code just use `mappable.import`

```js
const LOCATION = {center: [25.205247, 25.077816], zoom: 10};

async function main() {
  const {MMapHint, MMapHintContext} = await mappable.import('@mappable-world/mappable-hint@0.0.1');

  const map = new mappable.MMap(document.getElementById('app'), {location: LOCATION});

  map.addChild(new MMapDefaultSchemeLayer());

  const defaultFeatures = new MMapDefaultFeaturesLayer();
  map.addChild(defaultFeatures);

  const hint = new MMapHint({
    layers: [defaultFeatures.layer],
    hint: (object) => object?.properties?.hint
  });

  map.addChild(hint);

  hint.addChild(
    new (class MyHint extends mappable.MMapEntity {
      _onAttach() {
        this._element = document.createElement('div');
        this._element.className = 'my-hint';

        this._detachDom = mappable.useDomContext(this, this._element);
        this._watchContext(
          MMapHintContext,
          () => {
            this._element.textContent = this._consumeContext(MMapHintContext)?.hint;
          },
          {immediate: true}
        );
      }

      _onDetach() {
        this._detachDom();
      }
    })()
  );

  map.addChild(new MMapMarker({coordinates: LOCATION.center, properties: {hint: 'Some hint'}}));
}
main();
```

### React version

```jsx
const {MMapHint, MMapHintContext} = reactify.module(await mappable.import('@mappable-world/mappable-hint@0.0.1'));

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('app')
);

function App() {
  const [location, setLocation] = useState(LOCATION);

  const getHint = useCallback((object) => object && object.properties && object.properties.hint, []);

  return (
    <MMap location={location} ref={(x) => (map = x)}>
      <MMapDefaultSchemeLayer />
      <MMapDefaultFeaturesLayer />
      <MMapControls position="right">
        <MMapZoomControl />
      </MMapControls>

      <MMapHint hint={getHint}>
        <MyHint />
      </MMapHint>

      <MyMarker coordinates={LOCATION.center} properties={{hint: 'Some text'}} color={'#ff00ff'} />
    </MMap>
  );
}
function MyMarker({coordinates, properties, color}) {
  return (
    <MMapMarker properties={properties} coordinates={coordinates}>
      <div
        dangerouslySetInnerHTML={{__html: '<svg>...</svg>'}}
        style={{transform: 'translate(-15px, -33px)', position: 'absolute'}}
      ></div>
    </MMapMarker>
  );
}
function MyHint() {
  const ctx = React.useContext(MMapHintContext);
  return <div className="my-hint">{ctx && ctx.hint}</div>;
}
```
