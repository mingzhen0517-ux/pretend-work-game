import { initApp, app } from './ui/app.js';

initApp();

// 便于自动化测试与调试；不暴露任何业务写接口。
if (typeof window !== 'undefined') {
  window.__PRETEND_WORK__ = {
    get state() { return app.run; },
    get meta() { return app.meta; },
    get screen() { return app.screen; },
    get modal() { return app.modal; },
    get dialogue() { return app.dialogue; },
  };
}
