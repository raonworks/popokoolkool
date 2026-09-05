# popokoolkool 개발 가이드

## 1. 프로젝트 개요

이 프로젝트는 Vite가 생성한 React + TypeScript 프론트엔드 애플리케이션입니다. 현재는 Vite 기본 화면을 기반으로 다음 요소가 구현되어 있습니다.

- `src/App.tsx`: 메인 화면, 카운터 상태, React/Vite 안내 링크
- `src/App.css`: 메인 화면의 레이아웃과 컴포넌트 스타일
- `src/index.css`: 전역 디자인 토큰, 타이포그래피, 기본 레이아웃
- `src/assets/`: Vite 번들에 포함되는 이미지 및 SVG 자산
- `public/`: 파일 경로를 그대로 유지해야 하는 정적 자산

현재 제품 도메인 기능, 라우팅, 서버 API 연동, 테스트 코드는 아직 정의되어 있지 않습니다. 새 기능을 추가할 때는 이 템플릿 구조를 유지하기보다 기능 단위로 점진적으로 분리하는 것을 권장합니다.

## 2. 기술 스택

| 영역               | 기술                                           |
| ------------------ | ---------------------------------------------- |
| UI                 | React 19                                       |
| 언어               | TypeScript 6                                   |
| 번들러/개발 서버   | Vite 8                                         |
| 코드 품질          | ESLint 10, typescript-eslint, React Hooks 규칙 |
| 모바일 패키징 기반 | Capacitor Android/Core/CLI 8                   |
| 패키지 형식        | ESM (`type: module`)                           |

React Compiler는 현재 활성화되어 있지 않습니다.

## 3. 시작하기

### 사전 요구사항

- Node.js와 npm 설치
- 저장소 루트에서 명령 실행

### 의존성 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

Vite가 출력하는 로컬 URL을 브라우저에서 엽니다. 소스 파일을 저장하면 HMR(Hot Module Replacement)로 변경 사항이 반영됩니다.

### 프로덕션 빌드

```bash
npm run build
```

`build` 스크립트는 TypeScript 프로젝트 빌드 검사와 Vite 번들 생성을 연속으로 수행합니다. 결과물은 `dist/`에 생성됩니다.

### 린트

```bash
npm run lint
```

### 빌드 결과 미리보기

```bash
npm run preview
```

## 4. 디렉터리 및 실행 흐름

```text
/
├─ index.html              # HTML 진입 문서와 root 컨테이너
├─ public/                 # URL 경로가 보존되는 정적 파일
├─ src/
│  ├─ main.tsx             # React root 생성 및 StrictMode 설정
│  ├─ App.tsx              # 현재 메인 화면
│  ├─ index.css            # 전역 스타일과 CSS 변수
│  ├─ App.css              # App 전용 스타일
│  └─ assets/              # import로 사용하는 번들 자산
├─ vite.config.ts          # Vite React 플러그인 설정
├─ eslint.config.js        # ESLint flat config
├─ tsconfig*.json          # TypeScript 설정
└─ package.json             # 스크립트와 의존성
```

앱의 실행 흐름은 다음과 같습니다.

1. `index.html`의 `#root`가 React 마운트 지점을 제공합니다.
2. `src/main.tsx`가 `createRoot`로 앱을 마운트하고 `StrictMode`를 적용합니다.
3. `src/App.tsx`가 현재 화면을 렌더링합니다.
4. `src/index.css`와 `src/App.css`가 전역 및 화면 스타일을 적용합니다.

## 5. 개발 규칙

### React 컴포넌트

- 컴포넌트는 `PascalCase`로 작성합니다. 예: `UserProfile.tsx`
- 이벤트 핸들러는 `handle` 접두사를 사용합니다. 예: `handleSubmit`
- 반복 렌더링에는 안정적인 `key`를 사용하고 배열 인덱스는 식별자가 없을 때만 사용합니다.
- 상태는 실제로 필요한 가장 가까운 컴포넌트에 둡니다. 여러 화면에서 공유할 때만 별도 상태 관리 도입을 검토합니다.
- 작은 UI 조각은 같은 파일에 둘 수 있지만, 재사용되거나 복잡해지면 `src/components/`로 분리합니다.

### TypeScript

- `any` 사용을 피하고 도메인 타입 또는 `unknown`을 사용합니다.
- `tsconfig.app.json`의 `noUnusedLocals`, `noUnusedParameters`를 통과해야 합니다.
- 타입만 import할 때는 `import type`을 사용합니다.
- 컴포넌트 props는 명시적인 `type` 또는 `interface`로 정의합니다.
- `allowImportingTsExtensions`가 활성화되어 있으므로 기존 코드의 import 확장자 스타일을 일관되게 유지합니다.

### 스타일

- 전역 디자인 값은 `src/index.css`의 CSS 변수에 추가합니다.
- 특정 화면에만 필요한 스타일은 `src/App.css` 또는 해당 컴포넌트 스타일 파일에 둡니다.
- 기존의 반응형 기준인 `1024px` 미디어 쿼리를 존중하고, 모바일 레이아웃이 깨지지 않는지 확인합니다.
- 접근 가능한 포커스 상태를 제거하지 않습니다. 키보드로 조작할 수 있는 요소에는 명확한 `:focus-visible` 스타일을 제공합니다.
- 이미지에는 의미에 맞는 `alt`를 지정하고, 장식 이미지는 빈 `alt`를 사용합니다.

### 자산 관리

- 코드에서 import하여 번들에 포함할 이미지와 SVG는 `src/assets/`에 둡니다.
- URL 경로로 직접 제공해야 하는 파일은 `public/`에 둡니다. 예: `/icons.svg`
- 자산을 추가할 때 사용처와 불필요한 중복 여부를 확인합니다.

## 6. 기능 확장 권장 구조

기능이 늘어나면 다음과 같이 역할별로 분리합니다.

```text
src/
├─ components/             # 여러 기능에서 재사용하는 UI
├─ features/               # 도메인 기능별 화면과 로직
├─ hooks/                  # 재사용 가능한 React hooks
├─ lib/                    # API 클라이언트와 순수 유틸리티
├─ types/                  # 여러 기능이 공유하는 타입
├─ assets/
├─ App.tsx
├─ App.css
├─ index.css
└─ main.tsx
```

라우팅이 필요해지면 먼저 화면 목록과 URL 계약을 정한 뒤 라우터를 추가합니다. API와 서버 상태가 복잡해지기 전에는 별도 상태관리 라이브러리를 도입하지 말고, React 상태와 props로 충분한지 확인합니다.

## 7. 검증 절차

변경을 제출하기 전에 다음 순서로 확인합니다.

```bash
npm run lint
npm run build
```

현재 `npm run lint`는 `android/app/build/intermediates/` 아래의 Capacitor 생성 JavaScript까지 검사합니다. 이 산출물의 `@typescript-eslint/no-unused-vars` 비활성화 주석 때문에 린트가 실패할 수 있으므로, Capacitor Android 작업을 추가하기 전에는 ESLint ignore 대상에 생성 디렉터리를 포함하는 것을 검토합니다. `npm run build`의 TypeScript 검사와 Vite 번들은 현재 정상 동작합니다.

UI를 변경했다면 `npm run dev`로 다음 항목도 수동 확인합니다.

- 데스크톱과 좁은 화면에서 레이아웃이 깨지지 않는가
- 버튼과 링크가 키보드로 접근 가능한가
- 이미지와 아이콘이 의도한 크기로 표시되는가
- 브라우저 콘솔에 오류가 없는가
- 외부 링크가 새 탭에서 정상적으로 열리는가

현재 자동화 테스트 스크립트는 `package.json`에 정의되어 있지 않습니다. 사용자 입력, API 연동, 결제 등 핵심 동작이 추가되면 해당 기능에 대한 단위 또는 컴포넌트 테스트를 먼저 도입합니다.

## 8. 모바일 패키징 참고

`package.json`에는 Capacitor 패키지가 설치되어 있지만, 현재 저장소에서 `capacitor.config.*` 또는 네이티브 플랫폼 디렉터리는 확인되지 않습니다. Android 앱 패키징을 시작할 때는 Capacitor 설정과 플랫폼 생성 절차를 별도로 정하고, 웹 빌드 결과가 네이티브 프로젝트에 동기화되는지 검증해야 합니다.

## 9. 변경 전 체크리스트

- 변경 대상 기능과 책임 파일을 먼저 확인했는가
- 기존 CSS 변수와 반응형 규칙을 재사용했는가
- 새 의존성이 정말 필요한가
- TypeScript와 ESLint 오류가 없는가
- 접근성 및 모바일 화면을 확인했는가
- 사용 방법이나 구조가 바뀌었다면 이 문서를 업데이트했는가
