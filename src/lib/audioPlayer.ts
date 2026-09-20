import rainAudio from "../assets/sound/rain-1.mp3";
import thunderAudio from "../assets/sound/thunder-1.mp3";

export type SoundId = "rain" | "wind" | "thunder" | "fire";

export type SoundConfig = {
  id: SoundId;
  volume: number;
  isPlaying: boolean;
};

type AudioLayer = {
  source: AudioBufferSourceNode | null;
  audio: HTMLAudioElement | null;
  nextAudio: HTMLAudioElement | null;
  audioGain: GainNode | null;
  nextAudioGain: GainNode | null;
  filter: BiquadFilterNode;
  gain: GainNode;
  crossfadeTimer: number | null;
  isCrossfading: boolean;
};

const CROSSFADE_SECONDS = 1.5;
const CROSSFADE_CHECK_INTERVAL_MS = 100;

const audioSources: Partial<Record<SoundId, string>> = {
  rain: rainAudio,
  thunder: thunderAudio,
};

const filterConfig: Record<
  SoundId,
  { type: BiquadFilterType; frequency: number }
> = {
  rain: { type: "lowpass", frequency: 5200 },
  wind: { type: "lowpass", frequency: 900 },
  thunder: { type: "lowpass", frequency: 240 },
  fire: { type: "bandpass", frequency: 1800 },
};

function clampVolume(volume: number) {
  return Math.min(1, Math.max(0, volume / 100));
}

export class AudioPlayer {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private layers = new Map<SoundId, AudioLayer>();
  private masterVolume = 0.68;

  private configureMediaSession() {
    if (!("mediaSession" in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: "포포의 쿨쿨",
      artist: "Popo KoolKool",
      album: "수면 사운드 믹서",
    });
    navigator.mediaSession.setActionHandler("play", () => {
      void this.resume();
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      this.pause();
    });
    navigator.mediaSession.setActionHandler("stop", () => {
      this.pause();
    });
  }

  private ensureContext() {
    if (!this.context) {
      const AudioContextConstructor =
        window.AudioContext ??
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (!AudioContextConstructor) {
        throw new Error("Web Audio API is not supported");
      }

      this.context = new AudioContextConstructor();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.context.destination);
      this.configureMediaSession();
    }

    return this.context;
  }

  private createNoiseBuffer(context: AudioContext) {
    if (this.noiseBuffer) return this.noiseBuffer;

    const buffer = context.createBuffer(
      1,
      context.sampleRate * 4,
      context.sampleRate,
    );
    const channel = buffer.getChannelData(0);

    for (let index = 0; index < channel.length; index += 1) {
      channel[index] = Math.random() * 2 - 1;
    }

    this.noiseBuffer = buffer;
    return buffer;
  }

  private createLayer(config: SoundConfig) {
    const context = this.ensureContext();
    const masterGain = this.masterGain;
    if (!masterGain) throw new Error("Audio mixer is not initialized");

    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const soundFilter = filterConfig[config.id];
    const sourceUrl = audioSources[config.id];
    let source: AudioBufferSourceNode | null = null;
    let audio: HTMLAudioElement | null = null;
    let nextAudio: HTMLAudioElement | null = null;
    let audioGain: GainNode | null = null;
    let nextAudioGain: GainNode | null = null;

    filter.type = soundFilter.type;
    filter.frequency.value = soundFilter.frequency;
    gain.gain.value = config.isPlaying ? clampVolume(config.volume) : 0;

    if (sourceUrl) {
      audio = new Audio(sourceUrl);
      nextAudio = new Audio(sourceUrl);
      audio.loop = false;
      nextAudio.loop = false;
      audio.preload = "auto";
      nextAudio.preload = "auto";
      audioGain = context.createGain();
      nextAudioGain = context.createGain();
      audioGain.gain.value = 1;
      nextAudioGain.gain.value = 0;
      context
        .createMediaElementSource(audio)
        .connect(audioGain)
        .connect(filter);
      context
        .createMediaElementSource(nextAudio)
        .connect(nextAudioGain)
        .connect(filter);
    } else {
      source = context.createBufferSource();
      source.buffer = this.createNoiseBuffer(context);
      source.loop = true;
      source.connect(filter);
      source.start();
    }

    filter.connect(gain).connect(masterGain);

    const layer: AudioLayer = {
      source,
      audio,
      nextAudio,
      audioGain,
      nextAudioGain,
      filter,
      gain,
      crossfadeTimer: null,
      isCrossfading: false,
    };
    this.layers.set(config.id, layer);
    return layer;
  }

  private startCrossfadeMonitor(layer: AudioLayer) {
    if (!layer.audio || !layer.nextAudio || layer.crossfadeTimer !== null)
      return;

    layer.crossfadeTimer = window.setInterval(() => {
      const audio = layer.audio;
      if (
        !audio ||
        layer.isCrossfading ||
        audio.paused ||
        !Number.isFinite(audio.duration) ||
        audio.duration <= CROSSFADE_SECONDS ||
        audio.currentTime < audio.duration - CROSSFADE_SECONDS
      ) {
        return;
      }

      this.crossfadeLayer(layer);
    }, CROSSFADE_CHECK_INTERVAL_MS);
  }

  private stopCrossfadeMonitor(layer: AudioLayer) {
    if (layer.crossfadeTimer === null) return;

    window.clearInterval(layer.crossfadeTimer);
    layer.crossfadeTimer = null;
  }

  private crossfadeLayer(layer: AudioLayer) {
    const context = this.context;
    const currentAudio = layer.audio;
    const nextAudio = layer.nextAudio;
    const currentGain = layer.audioGain;
    const nextGain = layer.nextAudioGain;
    if (!context || !currentAudio || !nextAudio || !currentGain || !nextGain)
      return;

    layer.isCrossfading = true;
    const startTime = context.currentTime;
    const endTime = startTime + CROSSFADE_SECONDS;

    nextAudio.currentTime = 0;
    nextGain.gain.cancelScheduledValues(startTime);
    nextGain.gain.setValueAtTime(0, startTime);
    nextGain.gain.linearRampToValueAtTime(1, endTime);
    currentGain.gain.cancelScheduledValues(startTime);
    currentGain.gain.setValueAtTime(1, startTime);
    currentGain.gain.linearRampToValueAtTime(0, endTime);
    void nextAudio.play().catch(() => {
      layer.isCrossfading = false;
    });

    window.setTimeout(() => {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      layer.audio = nextAudio;
      layer.nextAudio = currentAudio;
      layer.audioGain = nextGain;
      layer.nextAudioGain = currentGain;
      layer.isCrossfading = false;
    }, CROSSFADE_SECONDS * 1000);
  }

  private getLayer(config: SoundConfig) {
    return this.layers.get(config.id) ?? this.createLayer(config);
  }

  async play(configs: SoundConfig[]) {
    const context = this.ensureContext();
    if (context.state === "suspended") await context.resume();

    configs.forEach((config) => this.setSound(config));
    await Promise.all(
      Array.from(this.layers.values()).map((layer) => layer.audio?.play()),
    );
    this.layers.forEach((layer) => this.startCrossfadeMonitor(layer));
    if ("mediaSession" in navigator)
      navigator.mediaSession.playbackState = "playing";
  }

  private async resume() {
    if (!this.context) return;
    await this.context.resume();
    this.layers.forEach(({ audio }) => {
      void audio?.play();
    });
    this.layers.forEach((layer) => this.startCrossfadeMonitor(layer));
    if ("mediaSession" in navigator)
      navigator.mediaSession.playbackState = "playing";
  }

  pause() {
    this.layers.forEach((layer) => {
      layer.audio?.pause();
      layer.nextAudio?.pause();
      this.stopCrossfadeMonitor(layer);
    });
    if (this.context?.state === "running") {
      void this.context.suspend();
    }
    if ("mediaSession" in navigator)
      navigator.mediaSession.playbackState = "paused";
  }

  setMasterVolume(volume: number) {
    this.masterVolume = clampVolume(volume);
    if (this.masterGain && this.context) {
      this.masterGain.gain.setTargetAtTime(
        this.masterVolume,
        this.context.currentTime,
        0.04,
      );
    }
  }

  setSound(config: SoundConfig) {
    const layer = this.getLayer(config);
    const targetVolume = config.isPlaying ? clampVolume(config.volume) : 0;

    if (this.context) {
      layer.gain.gain.setTargetAtTime(
        targetVolume,
        this.context.currentTime,
        0.04,
      );
    } else {
      layer.gain.gain.value = targetVolume;
    }
  }

  destroy() {
    this.layers.forEach((layer) => {
      const { source, audio, nextAudio } = layer;
      source?.stop();
      audio?.pause();
      nextAudio?.pause();
      this.stopCrossfadeMonitor(layer);
    });
    this.layers.clear();
    if (this.context) void this.context.close();
    this.context = null;
    this.masterGain = null;
    this.noiseBuffer = null;
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "none";
      navigator.mediaSession.metadata = null;
    }
  }
}
