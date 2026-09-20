import { registerPlugin, type PluginListenerHandle } from "@capacitor/core";

type AudioBackgroundPlugin = {
  start(): Promise<void>;
  stop(): Promise<void>;
  addListener(
    eventName: "mediaAction",
    listenerFunc: (event: { action: string }) => void,
  ): Promise<PluginListenerHandle>;
};

export const audioBackground =
  registerPlugin<AudioBackgroundPlugin>("AudioBackground");

export async function startAudioBackground() {
  try {
    await audioBackground.start();
  } catch {
    // The web implementation uses Media Session without a native service.
  }
}

export async function stopAudioBackground() {
  try {
    await audioBackground.stop();
  } catch {
    // The web implementation has no foreground service to stop.
  }
}
