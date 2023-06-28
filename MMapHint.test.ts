import type {LngLatBounds, LngLat, PolygonGeometry} from '@mappable-world/mappable-types/common/types';

import {MMapHint} from './index';

describe('MMapHint', () => {
    const BOUNDS: LngLatBounds = [
        [36.76340182421873, 56.50491493486398],
        [38.48276217578123, 54.98530386445313]
    ];
    const LOCATION = {bounds: BOUNDS};

    const container = document.createElement('div');
    Object.assign(container.style, {width: `643px`, height: `856px`});
    document.body.appendChild(container);
    const map = new mappable.MMap(container, {location: LOCATION});

    const featureIdMap = new Map();
    featureIdMap.set('__auto_0', {clientX: 428, clientY: 554});
    featureIdMap.set('__auto_1', {clientX: 199, clientY: 41});

    beforeAll(() => {
        // JSDom doesn't have elementFromPoint.
        document.elementFromPoint = (x, y) => {
            const id = [...featureIdMap].find(([_, {clientX, clientY}]) => x === clientX && y === clientY);
            return id ? document.querySelector(`*[data-feature-id="${id[0]}"]`) : null;
        };
    });

    afterAll(() => {
        // @ts-ignore
        delete document.elementFromPoint;
    });

    describe('MMapHint', () => {
        const linesCoordinates: LngLat[][] = [
            [
                [38.076556, 55.8100336],
                [37.783516, 55.0568147]
            ],
            [
                [37.473184, 55.01384304],
                [37.344355, 56.34694302]
            ]
        ];

        const trianglesCoordinates: LngLat[][] = [
            [
                [37.89174253825008, 55.26181825320606],
                [37.76086031941731, 55.03350998698721],
                [37.65265103754559, 55.15301404792541]
            ],
            [
                [38.091479734182144, 55.622597533233154],
                [37.9056490687874, 55.83899263170361],
                [37.98526841530588, 55.56511107379402]
            ]
        ];

        const LINES = linesCoordinates.map((coordinates, i) => ({
            geometry: {type: 'LineString', coordinates} as const,
            style: {stroke: [{color: 'red', width: 6}]},
            hint: `line #${i}`
        }));

        const TRIANGLES = trianglesCoordinates.map((coordinates, i) => ({
            geometry: {type: 'Polygon', coordinates},
            style: {stroke: [{color: 'blue', width: 3}], fill: 'white'},
            hint: `triangle #${i}`
        }));

        const linesCollection = new mappable.MMapCollection({});
        LINES.forEach(({geometry, hint, style}) => {
            linesCollection.addChild(
                new mappable.MMapFeature({
                    geometry,
                    style,
                    properties: {hint},
                    source: mappable.MMapDefaultFeaturesLayer.defaultProps.source
                })
            );
        });

        const trianglesCollection = new mappable.MMapCollection({});
        TRIANGLES.forEach(({geometry, hint, style}) => {
            trianglesCollection.addChild(
                new mappable.MMapFeature({
                    geometry: geometry as unknown as PolygonGeometry,
                    style,
                    properties: {hint},
                    source: mappable.MMapDefaultFeaturesLayer.defaultProps.source
                })
            );
        });

        const defaultFeatures = new mappable.MMapDefaultFeaturesLayer({});

        const hint = new MMapHint({
            hint: (object) => object?.properties?.hint as HTMLElement
        });

        map.addChild(new mappable.MMapDefaultSchemeLayer({}))
            .addChild(defaultFeatures)
            .addChild(linesCollection)
            .addChild(trianglesCollection)
            .addChild(hint);

        const outsidePoints = {
            point1: {clientX: 463, clientY: 482},
            point2: {clientX: 409, clientY: 659},
            point3: {clientX: 222, clientY: 371}
        };

        const containerElement = map.container.firstElementChild!;
        //@ts-ignore for getting private property
        const hintElement = hint._hintElement;

        const visibleClass = 'mappablex0--mmaphint__hint_is-visible';

        beforeAll(async () => {
            // TODO: we need a better way to wait until map is ready
            await new Promise((r) => setTimeout(r));
        });

        it('should show hint by hovering over', () => {
            containerElement.dispatchEvent(new MouseEvent('mouseenter', featureIdMap.get('__auto_0')));
            expect(hintElement.classList.contains(visibleClass)).toBe(true);

            containerElement.dispatchEvent(new MouseEvent('mouseleave', outsidePoints.point1));
            expect(hintElement.classList.contains(visibleClass)).toBe(false);

            containerElement.dispatchEvent(new MouseEvent('mouseenter', featureIdMap.get('__auto_0')));
            expect(hintElement.classList.contains(visibleClass)).toBe(true);

            containerElement.dispatchEvent(new MouseEvent('mouseleave', outsidePoints.point2));
            expect(hintElement.classList.contains(visibleClass)).toBe(false);

            containerElement.dispatchEvent(new MouseEvent('mouseenter', featureIdMap.get('__auto_1')));
            expect(hintElement.classList.contains(visibleClass)).toBe(true);

            containerElement.dispatchEvent(new MouseEvent('mouseleave', outsidePoints.point3));
            expect(hintElement.classList.contains(visibleClass)).toBe(false);

            containerElement.dispatchEvent(new MouseEvent('mouseenter', featureIdMap.get('__auto_1')));
            expect(hintElement.classList.contains(visibleClass)).toBe(true);
        });

        it('should show hint in the right place', () => {
            const {clientX: x0, clientY: y0} = featureIdMap.get('__auto_0');
            containerElement.dispatchEvent(new MouseEvent('mouseenter', featureIdMap.get('__auto_0')));
            expect(hintElement.style.transform).toBe(`translate(${x0}px, ${y0}px)`);

            const {clientX: x1, clientY: y1} = featureIdMap.get('__auto_1');
            containerElement.dispatchEvent(new MouseEvent('mouseenter', featureIdMap.get('__auto_1')));
            expect(hintElement.style.transform).toBe(`translate(${x1}px, ${y1}px)`);
        });
    });
});
