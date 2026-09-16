import { useEffect, useRef, useState } from "react";
import {
  CaretRightOutlined,
  PauseOutlined,
  SoundOutlined,
} from "@ant-design/icons";
import { Button, Slider } from "antd";
import { AudioPlayer, type SoundConfig } from "./lib/audioPlayer";
import "./App.css";
// import { stars } from "./contants";

const soundOptions = [
  {
    id: "rain",
    title: "잔잔한 비",
  },
  {
    id: "wind",
    title: "느린 바람",
  },
  {
    id: "thunder",
    title: "먼 천둥",
  },
  {
    id: "fire",
    title: "작은 모닥불",
  },
] as const;

function App() {
  const audioPlayerRef = useRef<AudioPlayer | null>(null);
  const [volume, setVolume] = useState(68);
  const [isPlaying, setIsPlaying] = useState(true);
  const [soundStates, setSoundStates] = useState<
    Record<string, { isPlaying: boolean; volume: number }>
  >(
    Object.fromEntries(
      soundOptions.map((sound, index) => [
        sound.id,
        { isPlaying: index < 2, volume: [58, 36, 22, 44][index] },
      ]),
    ),
  );

  const displayedVolume = isPlaying ? volume : 0;

  useEffect(() => {
    const audioPlayer = new AudioPlayer();
    audioPlayerRef.current = audioPlayer;

    return () => {
      audioPlayer.destroy();
      audioPlayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    audioPlayerRef.current?.setMasterVolume(volume);
  }, [volume]);

  useEffect(() => {
    Object.entries(soundStates).forEach(([id, state]) => {
      audioPlayerRef.current?.setSound({
        id: id as SoundConfig["id"],
        isPlaying: state.isPlaying,
        volume: state.volume,
      });
    });
  }, [soundStates]);

  useEffect(() => {
    const audioPlayer = audioPlayerRef.current;
    if (!audioPlayer) return;

    if (isPlaying) {
      void audioPlayer
        .play(
          Object.entries(soundStates).map(([id, state]) => ({
            id: id as SoundConfig["id"],
            ...state,
          })),
        )
        .catch(() => setIsPlaying(false));
    } else {
      audioPlayer.pause();
    }
  }, [isPlaying, soundStates]);

  return (
    <main className="min-h-svh bg-[#07101d]">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* {stars.map(([left, top, size, delay], index) => (
          <span
            className={`star${size <= 0.5 ? " star-tiny" : ""}`}
            key={index}
            style={
              {
                left: `${left}%`,
                top: `${top}%`,
                width: `${size}px`,
                height: `${size}px`,
                animationDelay: `${delay}s`,
                "--twinkle-duration": `${9.6 + ((index * 11) % 13) * 0.4}s`,
              } as React.CSSProperties
            }
          />
        ))} */}
      </div>

      <section
        className="relative isolate flex h-[250px] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_35%,rgba(42,69,112,0.3),transparent_35%),linear-gradient(145deg,#14253d_0%,#0a1729_48%,#050c17_100%)] after:absolute after:inset-x-0 after:bottom-0 after:z-[-1] after:h-[42%] after:bg-[linear-gradient(180deg,transparent,rgba(3,8,16,0.7))] after:content-['']"
        aria-label="밤 분위기의 메인 패널"
      >
        <div className="moon" aria-hidden="true" />
        <div className="relative z-[1] mb-[110px] text-center max-[600px]:mb-[130px]">
          <p className="mb-4 text-[12px] font-bold uppercase tracking-[0.26em] text-[#9bb3d3]">popo koolkool</p>
          <h1 className="m-0 text-[clamp(32px,5vw,64px)] font-medium tracking-[-0.04em] text-[#f0f5ff]" style={{ fontFamily: "iyagiGGC" }}>편안히 주무세요</h1>
          <p className="mt-[14px] text-[15px] text-[#a5b7d1]">걱정과 고민은 잠시 잊으세요.</p>
        </div>

        <div className="absolute inset-x-[clamp(18px,5vw,72px)] bottom-[clamp(18px,5vw,54px)] z-[2] mx-auto flex max-w-[540px] items-center gap-4 rounded-2xl border border-[rgba(180,207,244,0.16)] bg-[rgba(9,22,39,0.72)] px-5 py-4 shadow-[0_14px_30px_rgba(0,0,0,0.2),inset_0_1px_rgba(255,255,255,0.05)] backdrop-blur-2xl max-[600px]:px-[15px] max-[600px]:py-[14px]" aria-label="메인 볼륨 컨트롤">
          <Button
            className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full border border-[rgba(190,216,250,0.2)] bg-[rgba(118,158,211,0.14)] p-0 text-base text-[#e5efff] transition-[background,border-color,transform] duration-180 hover:!border-[rgba(190,216,250,0.45)] hover:!bg-[rgba(118,158,211,0.25)] hover:!text-[#e5efff] hover:-translate-y-px focus-visible:outline-2 focus-visible:outline-[#b8d3f5] focus-visible:outline-offset-3"
            htmlType="button"
            aria-label={isPlaying ? "재생 중지" : "재생"}
            aria-pressed={!isPlaying}
            icon={
              isPlaying ? (
                <PauseOutlined size={24} />
              ) : (
                <CaretRightOutlined size={24} />
              )
            }
            onClick={() => setIsPlaying((playing) => !playing)}
          />
          <div className="min-w-0 flex-1 select-none">
            <div className="mb-[9px] flex justify-between text-xs tracking-[0.04em] text-[#dce9fb]">
              <span>Volume</span>
              <output>{displayedVolume}%</output>
            </div>
            <Slider
              aria-label="Volume"
              min={0}
              max={100}
              value={volume}
              onChange={(value) => {
                if (typeof value !== "number") return;

                setVolume(value);
                setIsPlaying(true);
              }}
            />
          </div>
        </div>
      </section>
      <section className="bg-[#07101d] px-[clamp(18px,5vw,72px)] pb-9 pt-[clamp(18px,3vw,32px)]" aria-label="사운드 선택 패널">
        <div className="mx-auto mb-6 flex max-w-[982px] items-end justify-between gap-6 text-left">
          <div>
            <h2 className="m-0 text-[clamp(22px,3vw,32px)] font-medium text-[#edf4ff]">SOUND MIXER</h2>
          </div>
        </div>
        <div className="mx-auto grid max-w-[982px] grid-cols-4 gap-[14px] max-[600px]:grid-cols-2 max-[391px]:!grid-cols-1">
          {soundOptions.map((sound) => {
            const state = soundStates[sound.id];

            return (
              <article
                className={`sound-card min-w-0 rounded-[14px] border px-4 py-3 text-left transition-[border-color,background,transform] duration-180 hover:-translate-y-0.5 hover:border-[rgba(174,207,247,0.34)] hover:bg-[rgba(22,43,70,0.82)] max-[600px]:px-3 max-[600px]:py-2.5 ${state.isPlaying ? "is-active -translate-y-0.5" : "border-[rgba(180,207,244,0.12)] bg-[rgba(13,29,50,0.72)]"}`}
                key={sound.id}
              >
                <div className="mb-3 flex items-center justify-between">
                  <output
                    className="inline-flex items-center gap-2"
                    aria-label={`${sound.title} 현재 볼륨 ${state.volume}%`}
                  >
                    <SoundOutlined
                      className="sound-level-icon"
                      aria-hidden="true"
                    />
                    {state.volume}%
                  </output>
                  <button
                    className="sound-play-button grid h-8 w-8 place-items-center rounded-full border border-[rgba(190,216,250,0.18)] bg-[rgba(118,158,211,0.14)] p-0 text-[#e5efff] transition-[background,transform] duration-180 hover:scale-105 hover:bg-[rgba(118,158,211,0.3)] focus-visible:outline-2 focus-visible:outline-[#b8d3f5] focus-visible:outline-offset-3"
                    type="button"
                    aria-label={`${sound.title} ${state.isPlaying ? "일시정지" : "재생"}`}
                    aria-pressed={state.isPlaying}
                    onClick={() =>
                      setSoundStates((current) => ({
                        ...current,
                        [sound.id]: {
                          ...current[sound.id],
                          isPlaying: !current[sound.id].isPlaying,
                        },
                      }))
                    }
                  >
                    {state.isPlaying ? (
                      <PauseOutlined />
                    ) : (
                      <CaretRightOutlined />
                    )}
                  </button>
                </div>
                <h3 className="m-0 text-base font-semibold text-[#eaf2ff]">{sound.title}</h3>
                <div className="sound-controls flex select-none items-center gap-2">
                  <span className="min-w-7 text-right text-[11px] tabular-nums text-[#90a9cb]" aria-hidden="true">{state.volume}%</span>
                  <Slider
                    className="min-w-0 w-full flex-1"
                    aria-label={`${sound.title} 볼륨`}
                    min={0}
                    max={100}
                    value={state.volume}
                    onChange={(value) => {
                      if (typeof value !== "number") return;

                      setSoundStates((current) => ({
                        ...current,
                        [sound.id]: { isPlaying: value > 0, volume: value },
                      }));
                    }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default App;
