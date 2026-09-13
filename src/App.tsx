import { useState } from "react";
import {
  CaretRightOutlined,
  PauseOutlined,
  SoundOutlined,
} from "@ant-design/icons";
import { Button, Slider } from "antd";
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

  return (
    <main className="App">
      <div className="stars" aria-hidden="true">
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

      <section className="main-panel" aria-label="밤 분위기의 메인 패널">
        <div className="moon" aria-hidden="true" />
        <div className="welcome-copy">
          <p className="eyebrow">popo koolkool</p>
          <h1 style={{ fontFamily: "iyagiGGC" }}>편안히 주무세요</h1>
          <p className="subcopy">걱정과 고민은 잠시 잊으세요.</p>
        </div>

        <div className="audio-controller" aria-label="메인 볼륨 컨트롤">
          <Button
            className="volume-button"
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
          <div className="volume-info">
            <div className="volume-heading">
              <span>Volume</span>
              <output>{displayedVolume}%</output>
            </div>
            <Slider
              aria-label="Volume"
              min={0}
              max={100}
              value={displayedVolume}
              onChange={(value) => {
                if (typeof value !== "number") return;

                setVolume(value);
                setIsPlaying(true);
              }}
            />
          </div>
        </div>
      </section>
      <section className="sounds-panel" aria-label="사운드 선택 패널">
        <div className="sounds-heading">
          <div>
            <h2>SOUND MIXER</h2>
          </div>
        </div>
        <div className="sound-list">
          {soundOptions.map((sound) => {
            const state = soundStates[sound.id];

            return (
              <article
                className={`sound-card${state.isPlaying ? " is-active" : ""}`}
                key={sound.id}
              >
                <div className="sound-card-top">
                  <output
                    className="sound-level"
                    aria-label={`${sound.title} 현재 볼륨 ${state.volume}%`}
                  >
                    <SoundOutlined
                      className="sound-level-icon"
                      aria-hidden="true"
                    />
                    {state.volume}%
                  </output>
                  <button
                    className="sound-play-button"
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
                <h3>{sound.title}</h3>
                <div className="sound-controls">
                  <span aria-hidden="true">{state.volume}%</span>
                  <Slider
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
