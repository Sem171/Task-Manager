/** Bridge exposed by electron/preload.cjs; undefined when running in a browser. */
interface NovaDesktop {
  /** Raise and flash the window while an alarm rings; release it afterwards. */
  setAlarm(active: boolean): void;
}

interface Window {
  novaDesktop?: NovaDesktop;
}
