/**
 * 콘텐츠에 독립적인 수면 사운드 믹서 라이브러리.
 *
 * 어떤 사운드를 다룰 수 있는지(오디오 파일 URL, 합성 노이즈, 필터 설정)와
 * 시스템 미디어 컨트롤에 표시할 메타데이터는 생성자 옵션으로 주입받는다.
 * 이 모듈은 특정 사운드 리소스나 앱 도메인을 알지 못한다.
 */

export type NoiseType = "white" | "pink" | "brown";

export type SoundSourceConfig =
  | { kind: "audio"; url: string }
  | { kind: "noise"; noise: NoiseType };

export type SoundFilterConfig = {
  type: BiquadFilterType;
  frequency: number;
  q?: number;
};

export type SoundDefinition = {
  id: string;
  source: SoundSourceConfig;
  filter?: SoundFilterConfig;
};

export type SoundState = {
  id: string;
  /** 0~100 사이의 퍼센트 값. */
  volume: number;
  isPlaying: boolean;
};

export type MediaSessionInfo = {
  title: string;
  artist?: string;
  album?: string;
};

export type AudioPlayerOptions = {
  sounds: readonly SoundDefinition[];
  /** 0~100 사이의 퍼센트 값. 기본값은 68. */
  masterVolume?: number;
  /** 오디오 파일을 반복 재생할 때 이어 붙이는 크로스페이드 길이(초). 기본값은 1.5. */
  crossfadeSeconds?: number;
  /** 잠금 화면 등 시스템 미디어 컨트롤에 표시할 메타데이터. */
  mediaSession?: MediaSessionInfo | null;
};

type AudioLayer = {
  source: AudioBufferSourceNode | null;
  audio: HTMLAudioElement | null;
  nextAudio: HTMLAudioElement | null;
  audioGain: GainNode | null;
  nextAudioGain: GainNode | null;
  filter: BiquadFilterNode;
  gain: GainNode;
  targetVolume: number;
  crossfadeTimer: number | null;
  isCrossfading: boolean;
};

const DEFAULT_MASTER_VOLUME_PERCENT = 68;
const DEFAULT_CROSSFADE_SECONDS = 1.5;
const CROSSFADE_CHECK_INTERVAL_MS = 100;
const NOISE_BUFFER_SECONDS = 4;

function clampVolume(volume: number) {
  return Math.min(1, Math.max(0, volume / 100));
}

export class AudioPlayer {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseBuffers = new Map<NoiseType, AudioBuffer>();
  private definitions = new Map<string, SoundDefinition>();
  private layers = new Map<string, AudioLayer>();
  private masterVolume: number;
  private crossfadeSeconds: number;
  private mediaSessionInfo: MediaSessionInfo | null;
  private playing = false;

  constructor(options: AudioPlayerOptions) {
    options.sounds.forEach((definition) => {
      this.definitions.set(definition.id, definition);
    });
    this.masterVolume = clampVolume(
      options.masterVolume ?? DEFAULT_MASTER_VOLUME_PERCENT,
    );
    this.crossfadeSeconds = Math.max(
      0,
      options.crossfadeSeconds ?? DEFAULT_CROSSFADE_SECONDS,
    );
    this.mediaSessionInfo = options.mediaSession ?? null;
  }

  private configureMediaSession() {
    if (!("mediaSession" in navigator)) return;

    if (this.mediaSessionInfo) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: this.mediaSessionInfo.title,
        artist: this.mediaSessionInfo.artist,
        album: this.mediaSessionInfo.album,
      });
    }
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

  private createNoiseBuffer(context: AudioContext, type: NoiseType) {
    const cached = this.noiseBuffers.get(type);
    if (cached) return cached;

    const buffer = context.createBuffer(
      1,
      context.sampleRate * NOISE_BUFFER_SECONDS,
      context.sampleRate,
    );
    const channel = buffer.getChannelData(0);

    if (type === "white") {
      for (let index = 0; index < channel.length; index += 1) {
        channel[index] = Math.random() * 2 - 1;
      }
    } else if (type === "pink") {
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      let b3 = 0;
      let b4 = 0;
      let b5 = 0;
      let b6 = 0;

      for (let index = 0; index < channel.length; index += 1) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.969 * b2 + white * 0.153852;
        b3 = 0.8665 * b3 + white * 0.3104856;
        b4 = 0.55 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.016898;
        channel[index] =
          (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    } else {
      let last = 0;

      for (let index = 0; index < channel.length; index += 1) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        channel[index] = last * 3.5;
      }
    }

    this.noiseBuffers.set(type, buffer);
    return buffer;
  }

  private createLayer(id: string) {
    const definition = this.definitions.get(id);
    if (!definition) {
      throw new Error(`Sound is not registered: ${id}`);
    }

    const context = this.ensureContext();
    const masterGain = this.masterGain;
    if (!masterGain) throw new Error("Audio mixer is not initialized");

    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    let input: AudioNode = gain;
    let source: AudioBufferSourceNode | null = null;
    let audio: HTMLAudioElement | null = null;
    let nextAudio: HTMLAudioElement | null = null;
    let audioGain: GainNode | null = null;
    let nextAudioGain: GainNode | null = null;

    if (definition.filter) {
      filter.type = definition.filter.type;
      filter.frequency.value = definition.filter.frequency;
      if (definition.filter.q !== undefined) {
        filter.Q.value = definition.filter.q;
      }
      filter.connect(gain);
      input = filter;
    }
    gain.gain.value = 0;

    if (definition.source.kind === "audio") {
      audio = new Audio(definition.source.url);
      nextAudio = new Audio(definition.source.url);
      audio.loop = false;
      nextAudio.loop = false;
      audio.preload = "auto";
      nextAudio.preload = "auto";
      audioGain = context.createGain();
      nextAudioGain = context.createGain();
      audioGain.gain.value = 1;
      nextAudioGain.gain.value = 0;
      context.createMediaElementSource(audio).connect(audioGain);
      context.createMediaElementSource(nextAudio).connect(nextAudioGain);
      audioGain.connect(input);
      nextAudioGain.connect(input);
    } else {
      source = context.createBufferSource();
      source.buffer = this.createNoiseBuffer(context, definition.source.noise);
      source.loop = true;
      source.connect(input);
      source.start();
    }

    gain.connect(masterGain);

    const layer: AudioLayer = {
      source,
      audio,
      nextAudio,
      audioGain,
      nextAudioGain,
      filter,
      gain,
      targetVolume: 0,
      crossfadeTimer: null,
      isCrossfading: false,
    };
    this.layers.set(id, layer);
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
        audio.duration <= this.crossfadeSeconds ||
        audio.currentTime < audio.duration - this.crossfadeSeconds
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
    const endTime = startTime + this.crossfadeSeconds;

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
    }, this.crossfadeSeconds * 1000);
  }

  private getLayer(id: string) {
    return this.layers.get(id) ?? this.createLayer(id);
  }

  private stopLayerPlayback(layer: AudioLayer) {
    layer.audio?.pause();
    layer.nextAudio?.pause();
    if (layer.audio) layer.audio.currentTime = 0;
    if (layer.nextAudio) layer.nextAudio.currentTime = 0;
    this.stopCrossfadeMonitor(layer);
  }

  async play(states: readonly SoundState[] = []) {
    const context = this.ensureContext();
    if (context.state === "suspended") await context.resume();

    this.playing = true;
    states.forEach((state) => this.setSound(state));

    const playbackPromises: Promise<void>[] = [];
    this.layers.forEach((layer) => {
      if (layer.targetVolume <= 0) return;
      if (layer.audio) playbackPromises.push(layer.audio.play());
      this.startCrossfadeMonitor(layer);
    });

    await Promise.all(playbackPromises);
    if ("mediaSession" in navigator)
      navigator.mediaSession.playbackState = "playing";
  }

  private async resume() {
    if (!this.context) return;
    await this.context.resume();
    this.playing = true;

    const playbackPromises: Promise<void>[] = [];
    this.layers.forEach((layer) => {
      if (layer.targetVolume <= 0) return;
      if (layer.audio) playbackPromises.push(layer.audio.play());
      this.startCrossfadeMonitor(layer);
    });

    await Promise.all(playbackPromises);
    if ("mediaSession" in navigator)
      navigator.mediaSession.playbackState = "playing";
  }

  pause() {
    this.playing = false;
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

  setSound(state: SoundState) {
    const layer = this.getLayer(state.id);
    const targetVolume = state.isPlaying ? clampVolume(state.volume) : 0;
    layer.targetVolume = targetVolume;

    if (this.context) {
      layer.gain.gain.setTargetAtTime(
        targetVolume,
        this.context.currentTime,
        0.04,
      );
    } else {
      layer.gain.gain.value = targetVolume;
    }

    if (targetVolume <= 0) {
      this.stopLayerPlayback(layer);
      return;
    }

    if (this.playing && layer.audio && layer.audio.paused) {
      void layer.audio.play().catch(() => undefined);
      this.startCrossfadeMonitor(layer);
    }
  }

  destroy() {
    this.playing = false;
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
    this.noiseBuffers.clear();
    if ("mediaSession" in navigator) {
      navigator.mediaSession.playbackState = "none";
      navigator.mediaSession.metadata = null;
    }
  }
}
