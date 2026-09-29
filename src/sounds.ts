import rainAudio from "./assets/sound/rain-1.mp3";
import thunderAudio from "./assets/sound/thunder-1.mp3";
import type {
  AudioPlayerOptions,
  SoundDefinition,
} from "./lib/audioPlayer";

export type SoundId = "rain" | "wind" | "thunder" | "fire";

export type SoundOption = {
  id: SoundId;
  title: string;
};

export const soundOptions: readonly SoundOption[] = [
  { id: "rain", title: "잔잔한 비" },
  { id: "wind", title: "느린 바람" },
  { id: "thunder", title: "먼 천둥" },
  { id: "fire", title: "작은 모닥불" },
];

const soundDefinitions: readonly SoundDefinition[] = [
  {
    id: "rain",
    source: { kind: "audio", url: rainAudio },
    filter: { type: "lowpass", frequency: 5200 },
  },
  {
    id: "wind",
    source: { kind: "noise", noise: "white" },
    filter: { type: "lowpass", frequency: 900 },
  },
  {
    id: "thunder",
    source: { kind: "audio", url: thunderAudio },
    filter: { type: "lowpass", frequency: 240 },
  },
  {
    id: "fire",
    source: { kind: "noise", noise: "white" },
    filter: { type: "bandpass", frequency: 1800 },
  },
];

export const audioPlayerOptions: AudioPlayerOptions = {
  sounds: soundDefinitions,
  masterVolume: 68,
  mediaSession: {
    title: "포포의 쿨쿨",
    artist: "Popo KoolKool",
    album: "수면 사운드 믹서",
  },
};