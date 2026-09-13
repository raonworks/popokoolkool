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
	filter: BiquadFilterNode;
	gain: GainNode;
};

const audioSources: Partial<Record<SoundId, string>> = {
 rain: rainAudio,
 thunder: thunderAudio,
};

const filterConfig: Record<SoundId, { type: BiquadFilterType; frequency: number }> = {
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
		}

		return this.context;
	}

	private createNoiseBuffer(context: AudioContext) {
		if (this.noiseBuffer) return this.noiseBuffer;

		const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate);
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

		filter.type = soundFilter.type;
		filter.frequency.value = soundFilter.frequency;
		gain.gain.value = config.isPlaying ? clampVolume(config.volume) : 0;

		if (sourceUrl) {
			audio = new Audio(sourceUrl);
			audio.loop = true;
			audio.preload = "auto";
			context.createMediaElementSource(audio).connect(filter);
		} else {
			source = context.createBufferSource();
			source.buffer = this.createNoiseBuffer(context);
			source.loop = true;
			source.connect(filter);
			source.start();
		}

		filter.connect(gain).connect(masterGain);

		const layer = { source, audio, filter, gain };
		this.layers.set(config.id, layer);
		return layer;
	}

	private getLayer(config: SoundConfig) {
		return this.layers.get(config.id) ?? this.createLayer(config);
	}

	async play(configs: SoundConfig[]) {
		const context = this.ensureContext();
		if (context.state === "suspended") await context.resume();

		configs.forEach((config) => this.setSound(config));
		await Promise.all(
			Array.from(this.layers.values()).map((layer) =>
				layer.audio?.play(),
			),
		);
	}

	pause() {
		this.layers.forEach(({ audio }) => audio?.pause());
		if (this.context?.state === "running") {
			void this.context.suspend();
		}
	}

	setMasterVolume(volume: number) {
		this.masterVolume = clampVolume(volume * 100);
		if (this.masterGain && this.context) {
			this.masterGain.gain.setTargetAtTime(this.masterVolume, this.context.currentTime, 0.04);
		}
	}

	setSound(config: SoundConfig) {
		const layer = this.getLayer(config);
		const targetVolume = config.isPlaying ? clampVolume(config.volume) : 0;

		if (this.context) {
			layer.gain.gain.setTargetAtTime(targetVolume, this.context.currentTime, 0.04);
		} else {
			layer.gain.gain.value = targetVolume;
		}
	}

	destroy() {
		this.layers.forEach(({ source, audio }) => {
			source?.stop();
			audio?.pause();
		});
		this.layers.clear();
		if (this.context) void this.context.close();
		this.context = null;
		this.masterGain = null;
		this.noiseBuffer = null;
	}
}
