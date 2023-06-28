'use strict';
let got = require('got');
const vm = require('vm');
const {TextEncoder, TextDecoder} = require('util');
global.TextDecoder = TextDecoder;
global.TextEncoder = TextEncoder;
const {JSDOM} = require('jsdom');
const fetch = require('cross-fetch');
const https = require('https');

if (!process.env.APIKEY) {
    throw new Error('Define APIKEY env');
}

const computeClientDimension = (element, dimension) => {
    const path = [];

    do {
        const style = getComputedStyle(element);
        const styleStr = `width: ${style.width}; height: ${style.height}`;
        path.push(`<${element.tagName.toLowerCase()} class="${element.className}" style="${styleStr}">`);

        if (!style[dimension]) break;
        if (style[dimension] === '100%') {
            element = element.parentElement;
            continue;
        }
        if (style[dimension].endsWith('px')) {
            return parseFloat(style[dimension]);
        }

        break;

        // eslint-disable-next-line no-constant-condition
    } while (true);

    const pathFormatted = path
        .reverse()
        .map((x, i) => '  '.repeat(i) + x)
        .join('\n');

    throw new Error(`Cannot compute ${dimension}:\n${pathFormatted}`);
};

module.exports = async function () {
    let dom = await JSDOM.fromFile('index.html', {
        url: 'http://mappable.localhost/'
    });

    let mappable, mappableMain;
    const self = {
        get mappable() {
            return mappable;
        },
        set mappable(value) {
            mappable = value;
            dom.window.mappable = mappable;
        },
        get ['@mappable/mappable-main']() {
            return mappableMain;
        },
        set ['@mappable/mappable-main'](value) {
            mappableMain = value;
            dom.window.mappableMain = mappableMain;
            Object.assign(mappable, mappableMain);
        }
    };

    const appendChild = dom.window.document.head.appendChild.bind(dom.window.document.head);
    dom.window.document.head.appendChild = (script) => {
        if (script.tagName === 'SCRIPT') {
            loadAndExecuteScript(script.src)
                .then(() => {
                    script.dispatchEvent(new dom.window.Event('load'));
                })
                .catch((e) => console.log('Error', e));
        }
        return appendChild(script);
    };
    const _performance = performance;

    const agent = new https.Agent({
        rejectUnauthorized: false
    });

    const context = {
        get mappable() {
            return mappable;
        },
        ...dom.window,
        performance: _performance,
        MouseEvent: dom.window.MouseEvent,
        Image: dom.window.Image,
        HTMLElement: dom.window.HTMLElement,
        Element: dom.window.Element,
        XMLHttpRequest: dom.window.XMLHttpRequest,
        requestAnimationFrame: (cb) => cb(),
        console: console,
        window: dom.window,
        global: dom.window,
        self: self,
        fetch: (url, query) =>
            fetch(url, {
                ...query,
                agent,
                headers: {
                    referer: 'http://mappable.localhost'
                }
            }),
        AbortController: AbortController,
        clearTimeout: clearTimeout,
        setTimeout: setTimeout,
        URL: URL,
        URLSearchParams: URLSearchParams,
        ResizeObserver: function () {
            return {
                observe() {}
            };
        }
    };

    Object.defineProperties(dom.window.Element.prototype, {
        clientWidth: {
            get() {
                return computeClientDimension(this, 'width');
            }
        },
        clientHeight: {
            get() {
                return computeClientDimension(this, 'height');
            }
        }
    });

    async function loadAndExecuteScript(url) {
        const script = await got(url, {
            headers: {
                Referer: 'http://mappable.localhost'
            }
        });
        await vm.runInNewContext(script.body, context);
    }

    await loadAndExecuteScript(`https://js.api.mappable.world/3.0/?apikey=${process.env.APIKEY}&lang=en_US`);
    await mappable.ready;

    Object.assign(global, context);
};
