type Listener = () => void;

let isOpen = false;
const listeners = new Set<Listener>();

export const commandPaletteStore = {
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot() {
    return isOpen;
  },
  setOpen(value: boolean) {
    if (isOpen === value) return;
    isOpen = value;
    listeners.forEach((l) => l());
  },
};
