import type TReact from 'react';
import type {DomDetach} from '@mappable-world/mappable-types/imperative/DomContext';
import type {MMapFeature, MMapMarker, MMapHotspot} from '@mappable-world/mappable-types/imperative';
import type {CustomReactify} from '@mappable-world/mappable-types/reactify/reactify';

import './index.css';

type MMapHintProps = {
    hint: (object: MMapFeature | MMapMarker | MMapHotspot | undefined) => unknown;
};

const MMapHintContext = new mappable.MMapContext('MMapHint');

/**
 * Display hint on map elements.
 *
 * @example
 * ```javascript
 * const {MMapHint, MMapHintContext} = await mappable.import('@mappable/mappable-hint@0.0.1');
 * map.addChild(defaultFeatures = new MMapDefaultFeaturesLayer());
 * map.addChild(hint = MMapHint({
 *    layers: [defaultFeatures.layer],
 *    hint: object => object?.properties?.hint
 * }));
 *
 * const {MMapDefaultMarker} = await mappable.import('@mappable/mappable-markers@0.0.1');
 * map.addChild(new MMapDefaultMarker({coordinates: [37, 55], properties: {hint: 'Hello world!'}}));
 *
 * hint.addChild(new class MyHint extends mappable.MMapEntity {
 *    _onAttach() {
 *         this._element = document.createElement('div');
 *         this._element.className = 'my-hint';
 *
 *         this._detachDom = mappable.useDomContext(this, this._element);
 *         this._watchContext(MMapHintContext, () => {
 *              this._element.textContent = this._consumeContext(MMapHintContext)?.hint;
 *         }, {immediate: true});
 *    }
 *
 *    _onDetach() {
 *        this._detachDom();
 *    }
 * });
 * ```
 */
class MMapHint extends mappable.MMapGroupEntity<MMapHintProps> {
    static [mappable.overrideKeyReactify]: CustomReactify<MMapHint, TReact.FC<TReact.PropsWithChildren<MMapHintProps>>> = (
        MMapHint,
        {reactify, React}
    ) => {
        const Component = reactify.entity(MMapHint);
        // @ts-ignore
        const {MMapReactContainer: MMapReactContainerR } = reactify.module(mappable);

        // @ts-ignore
        return ({children, ...props}) =>
            React.createElement(
                Component,
                props,
                React.createElement(MMapReactContainerR, {context: MMapHintContext}, children)
            );
    };

    private _destroyDomContext!: Function;
    private _detachDom!: DomDetach;
    private _element!: HTMLElement | null;
    private _hintElement!: HTMLElement;

    constructor(props: MMapHintProps) {
        super(props, {container: true});

        this._addDirectChild(
            new mappable.MMapListener({
                layer: 'any',
                onMouseMove: (_type, {screenCoordinates}) => {
                    if (this._hintElement.classList.contains('mappablex0--mmaphint__hint_is-visible')) {
                        this._positionHintElement(screenCoordinates);
                    }
                },
                onMouseEnter: (object, {screenCoordinates}) => {
                    const hint = this._props.hint(object?.entity);

                    if (hint) {
                        this._positionHintElement(screenCoordinates);
                        this._toggleHint(true);
                        this._provideContext(MMapHintContext, {hint});
                    } else {
                        this._toggleHint(false);
                        this._provideContext(MMapHintContext, null);
                    }
                },
                onMouseLeave: () => {
                    this._provideContext(MMapHintContext, null);
                    this._toggleHint(false);
                },
                onUpdate: () => {
                    this._provideContext(MMapHintContext, null);
                    this._toggleHint(false);
                }
            })
        );
    }

    protected _positionHintElement(screenCoordinates: [number, number]): void {
        const {left, top} = this.root!.container.getBoundingClientRect();
        const x = (screenCoordinates[0] - left).toFixed(0);
        const y = (screenCoordinates[1] - top).toFixed(0);
        this._hintElement.style.transform = `translate(${x}px, ${y}px)`;
    }

    protected _toggleHint(add: boolean) {
        this._hintElement.classList.toggle('mappablex0--mmaphint__hint_is-visible', add);
    }

    protected _onAttach(): void {
        this._element = document.createElement('MMaps');
        this._element.className = 'mappablex0--mmaphint__container';
        this._hintElement = this._element.appendChild(document.createElement('MMaps'));
        this._hintElement.className = 'mappablex0--mmaphint__hint';

        this._detachDom = mappable.useDomContext(this, this._element, this._hintElement);
        this._provideContext(MMapHintContext, null);
    }

    protected _onDetach(): void {
        this._destroyDomContext();
        this._detachDom();
        this._element = null;
    }
}

export {MMapHint, MMapHintContext};
