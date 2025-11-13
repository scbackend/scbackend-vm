const ScratchCommon = require('./tw-extension-api-common');
const createScratchX = require('./tw-scratchx-compatibility-layer');
const AsyncLimiter = require('../util/async-limiter');
const createTranslate = require('./tw-l10n');
const staticFetch = require('../util/tw-static-fetch');

// Node.js specific additions
const vmModule = require('vm');

/* eslint-disable require-await */

/**
 * Parse a URL object or return null.
 * @param {string} url
 * @returns {URL|null}
 */
const parseURL = url => {
    try {
        // 浏览器中使用 location.href 作为基准；在 Node 中使用当前工作目录的 file:// 作为基准
        const base = `file://${process.cwd().replace(/\\/g, '/')}/`;
        return new URL(url, base);
    } catch (e) {
        return null;
    }
};

/**
 * Sets up the global.Scratch API for an unsandboxed extension.
 * @param {VirtualMachine} vm
 * @returns {Promise<object[]>} Resolves with a list of extension objects when Scratch.extensions.register is called.
 */
const setupUnsandboxedExtensionAPI = vm => new Promise(resolve => {
    const extensionObjects = [];
    const register = extensionObject => {
        extensionObjects.push(extensionObject);
        resolve(extensionObjects);
    };

    // Create a new copy of global.Scratch for each extension
    const Scratch = Object.assign({}, global.Scratch || {}, ScratchCommon);
    Scratch.extensions = {
        unsandboxed: true,
        register
    };
    Scratch.vm = vm;
    Scratch.renderer = vm.runtime.renderer;

    Scratch.canFetch = async url => {
        const parsed = parseURL(url);
        if (!parsed) {
            return false;
        }
        // Always allow protocols that don't involve a remote request.
        if (parsed.protocol === 'blob:' || parsed.protocol === 'data:') {
            return true;
        }
        return vm.securityManager.canFetch(parsed.href);
    };

    Scratch.canOpenWindow = async url => {
        const parsed = parseURL(url);
        if (!parsed) {
            return false;
        }
        // 在 Node 环境中不允许打开浏览器窗口（也拒绝 javascript:）
        // eslint-disable-next-line no-script-url
        if (parsed.protocol === 'javascript:') {
            return false;
        }
        return vm.securityManager.canOpenWindow(parsed.href);
    };

    Scratch.canRedirect = async url => {
        const parsed = parseURL(url);
        if (!parsed) {
            return false;
        }
        // eslint-disable-next-line no-script-url
        if (parsed.protocol === 'javascript:') {
            return false;
        }
        return vm.securityManager.canRedirect(parsed.href);
    };

    Scratch.canRecordAudio = async () => vm.securityManager.canRecordAudio();

    Scratch.canRecordVideo = async () => vm.securityManager.canRecordVideo();

    Scratch.canReadClipboard = async () => vm.securityManager.canReadClipboard();

    Scratch.canNotify = async () => vm.securityManager.canNotify();

    Scratch.canGeolocate = async () => vm.securityManager.canGeolocate();

    Scratch.canEmbed = async url => {
        const parsed = parseURL(url);
        if (!parsed) {
            return false;
        }
        return vm.securityManager.canEmbed(parsed.href);
    };

    Scratch.canDownload = async (url, name) => {
        const parsed = parseURL(url);
        if (!parsed) {
            return false;
        }
        // Always reject protocols that would allow code execution.
        // eslint-disable-next-line no-script-url
        if (parsed.protocol === 'javascript:') {
            return false;
        }
        return vm.securityManager.canDownload(url, name);
    };

    Scratch.fetch = async (url, options) => {
        // url 可能是字符串或类似 Request 的对象
        const actualURL = (typeof url === 'string') ? url : (url && (url.url || url.href)) || '';

        const staticFetchResult = staticFetch(url);
        if (staticFetchResult) {
            return staticFetchResult;
        }

        if (!await Scratch.canFetch(actualURL)) {
            throw new Error(`Permission to fetch ${actualURL} rejected.`);
        }
        return fetch(url, options);
    };

    Scratch.openWindow = async (url, features) => {
        if (!await Scratch.canOpenWindow(url)) {
            throw new Error(`Permission to open tab ${url} rejected.`);
        }
        // Node 环境不支持打开浏览器窗口
        throw new Error('openWindow is not supported in Node.js environment.');
    };

    Scratch.redirect = async url => {
        if (!await Scratch.canRedirect(url)) {
            throw new Error(`Permission to redirect to ${url} rejected.`);
        }
        // Node 环境不支持直接重定向浏览器 location
        throw new Error('redirect is not supported in Node.js environment.');
    };

    Scratch.download = async (url, name) => {
        if (!await Scratch.canDownload(url, name)) {
            throw new Error(`Permission to download ${name} rejected.`);
        }
        // Node 环境不支持浏览器式下载：可以选择实现为写文件，但此处标为不支持以保留安全性
        throw new Error('download is not supported in Node.js environment.');
    };

    Scratch.translate = createTranslate(vm);

    global.Scratch = Scratch;
    global.ScratchExtensions = createScratchX(Scratch);

    vm.emit('CREATE_UNSANDBOXED_EXTENSION_API', Scratch);
});

/**
 * Disable the existing global.Scratch unsandboxed extension APIs.
 * This helps debug poorly designed extensions.
 */
const teardownUnsandboxedExtensionAPI = () => {
    // We can assume global.Scratch already exists.
    global.Scratch.extensions.register = () => {
        throw new Error('Too late to register new extensions.');
    };
};

/**
 * Load an unsandboxed extension from an arbitrary URL. This is dangerous.
 * @param {string} extensionURL
 * @param {Virtualmachine} vm
 * @returns {Promise<object[]>} Resolves with a list of extension objects if the extension was loaded successfully.
 */
const loadUnsandboxedExtension = (extensionURL, vm) => new Promise((resolve, reject) => {
    // setup resolves when extension registers via Scratch.extensions.register
    setupUnsandboxedExtensionAPI(vm).then(resolve);

    const parsed = parseURL(extensionURL);
    if (!parsed) {
        reject(new Error(`Invalid extension URL: ${extensionURL}`));
        return;
    }

    // Local file (file:// or relative path) -> require
    if (parsed.protocol === 'file:' || parsed.protocol === '') {
        try {
            let modulePath = parsed.protocol === 'file:' ? decodeURIComponent(parsed.pathname) : extensionURL;
            // Windows: 去掉前导斜杠
            if (process.platform === 'win32' && modulePath.startsWith('/')) {
                modulePath = modulePath.slice(1);
            }
            // 使用 require 在同一进程/同一全局中加载（unsandboxed）
            require(modulePath);
        } catch (e) {
            reject(new Error(`Error in unsandboxed script ${extensionURL}: ${e && e.message ? e.message : e}`));
        }
    } else if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        // 远程脚本：用 fetch 拉取并在当前上下文运行
        fetch(extensionURL).then(res => {
            if (!res || !res.ok) {
                throw new Error(`Failed to fetch ${extensionURL}: ${res ? res.status : 'no response'}`);
            }
            return res.text();
        }).then(code => {
            try {
                // 在当前上下文执行，以便脚本可以访问 global.Scratch 等全局变量
                vmModule.runInThisContext(code, { filename: extensionURL });
            } catch (e) {
                reject(new Error(`Error executing unsandboxed script ${extensionURL}: ${e && e.message ? e.message : e}`));
            }
        }).catch(err => {
            reject(new Error(`Error loading unsandboxed script ${extensionURL}: ${err && err.message ? err.message : err}`));
        });
    } else {
        reject(new Error(`Unsupported protocol for ${extensionURL}`));
    }
}).then(objects => {
    teardownUnsandboxedExtensionAPI();
    return objects;
});

// Because loading unsandboxed extensions requires messing with global state (global.Scratch),
// only let one extension load at a time.
const limiter = new AsyncLimiter(loadUnsandboxedExtension, 1);
const load = (extensionURL, vm) => limiter.do(extensionURL, vm);

module.exports = {
    setupUnsandboxedExtensionAPI,
    load
};
