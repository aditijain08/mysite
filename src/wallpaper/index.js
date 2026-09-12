import { ReactiveWallpaper } from './wallpaper.js';

if (typeof customElements !== 'undefined' && !customElements.get('reactive-wallpaper')) {
  customElements.define('reactive-wallpaper', ReactiveWallpaper);
}

export { ReactiveWallpaper };
export { createFrameStore, loadOrder } from './frames.js';
export { createInput } from './input.js';
