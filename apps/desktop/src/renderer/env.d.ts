import type { MovelApi } from "../preload/index";

declare global {
  interface Window {
    movel: MovelApi;
  }
}

export {};
