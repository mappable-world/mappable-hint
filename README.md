# Mappable JS API Hints Package

---

[![Build Status](https://github.com/mappable-world/mappable-hint/workflows/Run%20tests/badge.svg)](https://github.com/mappable-world/mappable-hint/actions/workflows/tests.yml)
[![npm version](https://badge.fury.io/js/@mappable-world%2Fmappable-hint.svg)](https://badge.fury.io/js/@mappable-world%2Fmappable-hint)
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

## More about working with the package

### Example 1: Creating a Map and adding a Clusterer to the Map

We declare a variable for the map, load the mappable library, extract the necessary classes.

```javascript
window.map = null;
async function main() {
  await mappable.ready;

  const {MMap, MMapDefaultSchemeLayer, MMapMarker, MMapLayer, MMapFeatureDataSource} = mappable;
  //...
}
```

We load the package with the clusterer, extract the classes for creating clusterer objects and the clustering method.

```javascript
const {MMapClusterer, clusterByGrid} = await mappable.import('@mappable-world/mappable-clusterer@0.0.1');
```

Create and add to the map a layer with a default schema, data sources, a layer of markers.

```javascript
const map = new MMap(document.getElementById('app'), {location: LOCATION});
map
  .addChild(new MMapDefaultSchemeLayer())
  .addChild(new MMapFeatureDataSource({id: 'my-source'}))
  .addChild(new MMapLayer({source: 'my-source', type: 'markers', zIndex: 1800}));
```

You can set any markup for the marker and for the cluster.

```javascript
const contentPin = document.createElement('div');
contentPin.innerHTML = '<img src="./pin.svg" />';
```

We declare the function for rendering ordinary markers, we will submit it to the clusterer settings.
Note that the function must return any Entity element. In the example, this is mappable.MMapMarker.

```javascript
const marker = (feature) =>
  new mappable.MMapMarker(
    {
      coordinates: feature.geometry.coordinates,
      source: 'my-source'
    },
    contentPin.cloneNode(true)
  );
```

As for ordinary markers, we declare a cluster rendering function that also returns an Entity element.

```javascript
const cluster = (coordinates, features) =>
  new mappable.MMapMarker(
    {
      coordinates,
      source: 'my-source'
    },
    circle(features.length).cloneNode(true)
  );

function circle(count) {
  const circle = document.createElement('div');
  circle.classList.add('circle');
  circle.innerHTML = `
        <div class="circle-content">
            <span class="circle-text">${count}</span>
        </div>
    `;
  return circle;
}
```

Let's declare an array with marker coordinates, then create an array of features with the appropriate interface. We will pass it to the clusterer settings.

```javascript
const coordinates = [
  [54.64, 25.76],
  [54.63, 25.7],
  [54.43, 25.69],
  [54.47, 25.68],
  [54.53, 25.6],
  [54.59, 25.71],
  [54.5, 25.63],
  [54.22, 25.57],
  [54.42, 25.127],
  [54.12, 25.437]
];

const points = coordinates.map((lnglat, i) => ({
  type: 'Feature',
  id: i,
  geometry: {coordinates: lnglat},
  properties: {name: 'Point of issue of orders'}
}));
```

We create a clusterer object and add it to the map object.
As parameters, we pass the clustering method, an array of features, the functions for rendering markers and clusters.
For the clustering method, we will pass the size of the grid division in pixels.

```javascript
const clusterer = new MMapClusterer({
    method: clusterByGrid({gridSize: 64}),
    features: points,
    marker,
    cluster
});

map.addChild(clusterer);
```

### Example 2. Using a Clusterer with React JS

We declare a variable for the map, load the mappable library, extract the necessary classes.

```jsx
window.map = null;
main();
async function main() {
  await mappable.ready;
  const mappableReact = await mappable.import('@mappable-world/mappable-reactify');
  const reactify = mappableReact.reactify.bindTo(React, ReactDOM);
  const {
    MMap,
    MMapDefaultSchemeLayer,
    MMapLayer,
    MMapFeatureDataSource,
    MMapMarker
  } = reactify.module(mappable);
  // ...
}
```

We connect the package with the clusterer, extract the classes for creating clusterer objects and the clustering method.

```jsx
const {MMapClusterer, clusterByGrid} = reactify.module(
  await mappable.import('@mappable-world/mappable-clusterer@0.0.1')
);
```

We extract the necessary hooks. Let's declare an array with marker coordinates, then create an array of features with the appropriate interface.
We will pass it to the clusterer settings.

```jsx
const {useCallback, useMemo} = React;

const coordinates = [
  [54.64, 25.76],
  [54.63, 25.7],
  [54.43, 25.69],
  [54.47, 25.68],
  [54.53, 25.6],
  [54.59, 25.71],
  [54.5, 25.63],
  [54.42, 25.57],
  [54.12, 25.57],
  [54.32, 25.57]
];

const points = coordinates.map((lnglat, i) => ({
  type: 'Feature',
  id: i,
  geometry: {coordinates: lnglat},
  properties: {name: 'Point of issue of orders'}
}));
```

We declare a render function. For the clustering method, we pass and store the size of one grid division in pixels.

```jsx
function App() {
  const gridSizedMethod = useMemo(() => clusterByGrid({gridSize: 64}), []);
  // ...
}
```

We declare a function for rendering ordinary markers. Note that the function must return any Entity element. In the example, this is mappable.MMapMarker.

```jsx
const marker = useCallback(
  (feature) => (
    <MMapMarker coordinates={feature.geometry.coordinates} source={'my-source'}>
      <img src={'./pin.svg'} />
    </MMapMarker>
  ),
  []
);
```

We declare a cluster rendering function that also returns an Entity element. We will transfer the marker and cluster rendering functions to the clusterer settings.

```jsx
const cluster = useCallback(
  (coordinates, features) => (
    <MMapMarker coordinates={coordinates} source={'my-source'}>
      <div className="circle">
        <div className="circle-content">
          <span className="circle-text">{features.length}</span>
        </div>
      </div>
    </MMapMarker>
  ),
  []
);
```

We return JSX, in which we render the components of the map, the default layer, data sources, the layer for markers and the clusterer.
In the clusterer props, we pass the previously declared functions for rendering markers and clusters, the clustering method, and an array of features.

```jsx
function App() {
  // ...
  return <>
    <MMap location={LOCATION} ref={x => map = x}>
      <MMapDefaultSchemeLayer />
      <MMapFeatureDataSource id="my-source" />
      <MMapLayer source="my-source" type="markers" zIndex={1800} />
      <MMapClusterer
        marker={marker}
        cluster={cluster}
        method={gridSizedMethod}
        features={points}
      />
    </MMap>
  </>;
}
// ...
ReactDOM.render(<App />, document.getElementById("app"));
```
