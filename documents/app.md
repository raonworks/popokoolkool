# 🌙 불면증 완화 화이트노이즈 앱 기획서 (Final Draft)

## 1. 개요 및 기획 배경

- **목적**: 불면증 및 수면 장애로 고통받는 사용자가 편안하게 잠들 수 있도록 돕는 커스텀 화이트노이즈(백색소음) 믹서 앱.
- **타겟 유저**: 쉽게 잠에 들지 못하는 불면증 환자, 집중력이 필요한 수험생/직장인.
- **앱 이름 추천 아이디어**:
  1. **포포의 쿨쿨 (Popo's KoolKool)**: 아늑한 보살핌을 주는 이름
  2. **소슬 (Sosle)**: 바람 소리처럼 잔잔한 순우리말
  3. **자장레이어 (Zajang Layer)**: 소리를 겹겹이 쌓는다는 의미
  4. **잠시 (Jamsi)**: 편안하게 쉬어간다는 의미

---

## 2. 기술 스택: [Vite + React + Tailwind CSS + Capacitor] 하이브리드 아키텍처

- **개발 환경 및 철학**:
  - 복잡한 React Native CLI의 네이티브 빌드 지옥에서 벗어나, 아빠가 가장 선호하고 쾌적한 **Vite + React (TypeScript) + Tailwind CSS** 기반 웹 기술을 활용합니다.
  - 스타일링은 **Tailwind CSS**를 사용하여 수면 유도형 모던 다크 모드 UI와 반응형 레이아웃을 빠르고 일관되게 구현합니다.
  - 모바일 앱 패키징이 필요할 때는 **Capacitor**를 결합하여 웹 기술만으로 안드로이드/데스크톱 앱으로 확장하는 하이브리드 전략을 채택합니다.
- **역할 분담**:
  1. **Vite + React + Tailwind CSS (프론트엔드 UI & 오디오 제어)**:
     - Tailwind CSS를 활용한 직관적이고 부드러운 수면 유도형 다크 모드 인터페이스 (카드, 토글, 볼륨 슬라이더)
     - 소리 선택 버튼 (비소리, 소나기, 천둥, 바람 등) 및 개별 볼륨 조절 슬라이더 UI
     - HTML5 Web Audio API / Audio 객체를 통한 다중 오디오 소스 믹싱 및 재생 엔진
     - 슬립 타이머(15분, 30분, 1시간 등) 설정 및 페이드 아웃(Fade-out) 상태 관리
  2. **Capacitor & Web 표준 (백그라운드 재생 및 미디어 세션 아키텍처)**:
     - **미디어 세션 (Media Session API / `MediaSessionCompat`)**: 안드로이드/iOS 시스템 레벨에서 백그라운드, 잠금화면, 상단 알림창, 블루투스/이어폰 리모컨 버튼 조작과 오디오 재생 상태를 동기화.
     - **포그라운드 서비스 (Foreground Service with Media Playback Type)**: 안드로이드 네이티브 단에서 화면이 꺼지거나 백그라운드로 진입해도 프로세스가 강제 종료되지 않고 화이트노이즈 재생이 안정적으로 유지되도록 `FOREGROUND_SERVICE_MEDIA` 타입의 서비스와 미디어 스타일 알림(`NotificationStyle`)을 결합.

---

## 3. 핵심 기능 정의 (Core Features)

### ① 멀티 사운드 믹서 (Sound Combiner)

- 사용자가 여러 자연 소리 버튼을 개별적으로 켜고 끌 수 있음.
- 각 소리별 **개별 볼륨 조절 슬라이더** 제공 (예: 빗소리 70%, 천둥소리 20%, 바람소리 40%).
- Tailwind CSS를 활용한 시각적 피드백 (재생 중인 사운드 카드 하이라이트 및 애니메이션 효과)

### ② 사운드 소스 전략 (Sound Source Strategy)

1. **프로덕션 (실제 상용 버전)**:
   - 자연에서 직접 녹음한 고음질 생생한 원본 음원(MP3/WAV) 파일을 사용하여 극상의 편안함과 몰입감 제공.
2. **테스트 및 프로토타입 (개발 단계)**:
   - 개발 초기 및 테스트 단계에서는 외부 대용량 음원 파일 없이도 빠르게 검증할 수 있도록 **Web Audio API 합성 노이즈(White/Pink Noise & Filter)**를 활용하여 가볍게 프로토타입 구동.

### ③ 재생 및 타이머 제어

- **재생/일시정지**: 전체 사운드 마스터 제어
- **슬립 타이머 (Sleep Timer)**: 15분, 30분, 1시간 뒤 자동 종료 또는 서서히 소리가 작아지는 페이드 아웃(Fade-out) 기능
- **백그라운드 지속 재생**: 스마트폰 화면을 꺼도 **미디어 세션(Media Session)** 및 안드로이드 **포그라운드 서비스(Foreground Service)**를 통해 소리가 끊기지 않고 유지되며, 잠금화면 및 이어폰 버튼으로 제어 가능

---

## 4. 향후 확장 기능 (Future Roadmap)

- 즐겨찾기 (나만의 조합 저장하기)
- 타이머 종료 시 부드러운 알람 또는 완전 차단
- 프리미엄 사운드 추가 (모닥불, 파도소리, 카페 소음 등)
- PWA(Progressive Web App) 및 Capacitor 모바일 앱 스토어 배포

---

## 5. 프로덕션(Cop) 수준 개발 및 구현 절차 (Production Roadmap)

### 1단계: 코어 오디오 엔진 및 백그라운드 재생 검증 (Engine & Background Core)

- 개발 초기 테스트용 Web Audio API 합성 오디오 노드 구현 및 프로덕션용 실제 녹음 음원(MP3) 연동 구조 설계.
- `navigator.mediaSession` 및 안드로이드 `MediaSessionCompat` / `Foreground Service` 연동을 통한 잠금화면/백그라운드 오디오 세션 유지 및 이어폰 버튼 제어 테스트.

### 2단계: 반응형 UI 및 상태 관리 구현 (Frontend UI & State)

- Vite + React + TypeScript + **Tailwind CSS** 기반 수면 유도형 다크모드 UI 및 반응형 레이아웃 구축.
- 사운드별 개별 볼륨 및 마스터 제어를 위한 전역 상태 관리(Zustand 또는 Context) 도입.

### 3단계: 스마트 슬립 타이머 & 페이드 아웃 로직 (Advanced Features)

- 15분/30분/1시간 타이머 및 종료 직전 볼륨이 서서히 줄어드는 **Volume Fade-out** 알고리즘 적용.
- LocalStorage 기반 나만의 사운드 조합 즐겨찾기 저장 기능.

### 4단계: Capacitor 하이브리드 패키징 및 QA 검증 (Packaging & Deployment)

- Capacitor(`@capacitor/core`, `@capacitor/android`)를 통한 네이티브 프로젝트 패키징.
- 실기기 배포 후 화면 꺼짐 상태에서 30분 이상 백그라운드 재생 유지 및 미디어 컨트롤러 연동 최종 QA 검증.

---

_본 문서는 라온웍스 기획 표준에 따라 작성되었습니다._  
**작성자:** 포포 상무 🐾 ("즐겁게 일하자!")
