import { store } from "./App/store";
import { showConfirm, hideConfirm } from "./features/error/confirmSlice";

let resolver = null;

export function confirm(message) {
  store.dispatch(showConfirm(message));

  return new Promise((resolve) => {
    resolver = resolve;
  });
}

export function confirmYes() {
  resolver?.(true);
  resolver = null;
  store.dispatch(hideConfirm());
}

export function confirmNo() {
  resolver?.(false);
  resolver = null;
  store.dispatch(hideConfirm());
}