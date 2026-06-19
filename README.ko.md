Mizutama Conte에 오신 것을 환영합니다.
日本語: [README.md](README.md) ／ English: [README.en.md](README.en.md)

# Mizutama Conte [\[Web App\]](https://studio-mizutama.github.io/MizutamaConte/)

![screenshot](./screenshot.png)

React + Electron으로 만든 콘티 에디터입니다. 해상도·화면비 설정, 카메라 워크가 적용된 애니매틱 프리뷰, PSD + JSON 저장, PDF / 동영상 내보내기, Undo / Redo 등을 갖추고 있습니다. 카메라 워크를 적용한 채로 프리뷰를 재생할 수 있다는 점이 이 앱의 특징입니다.

> 이 README는 개발자용입니다. 설치 방법·사용법 등 엔드유저용 문서는 [문서 사이트](https://studio-mizutama.github.io/MizutamaConte/docs/)에 있습니다.

## Usage (개발자용)

### Install

```sh
$ yarn
```

### Development

```sh
$ yarn dev      # Electron 버전 (Mac / Win / Linux)
$ yarn dev:web  # 웹 버전 (http://localhost:3000)
```

### Build

```sh
$ yarn build      # Electron 버전 (out/에 출력)
$ yarn build:web  # 웹 버전 (build/에 출력)
$ yarn build:docs # 문서 사이트 (build/docs/에 출력)
```

### Deploy (GitHub Pages)

```sh
$ yarn deploy     # build:web + build:docs를 gh-pages 브랜치에 배포
```

### Verify

```sh
$ yarn test       # vitest (순수 함수 유닛 테스트)
$ yarn typecheck  # renderer + electron 타입 체크
```

> **배포 빌드는 미서명**입니다. 이 저장소에서 생성하는 배포 빌드는 코드 서명·공증을 하지 않습니다. macOS quarantine 회피 등 엔드유저용 안내는 문서 사이트에 있습니다.

## 주요 기능

- 콘티 표시·편집 (PSD + JSON, 1.5초 디바운스 자동 저장)
- 새 프로젝트 생성 (해상도·화면비 선택) / 각본(.md)에서 생성
- 캔버스 리사이즈 (방향에 따라 기본 카메라 워크 자동 생성)
- 카메라 워크 편집 및 카메라 워크가 적용된 애니매틱 프리뷰
- 트랜지션 (페이드 인 / 페이드 아웃 / 크로스페이드)
- 스톱워치를 이용한 TIME 입력
- 외부 페인트 앱 연동 (CLIP STUDIO PAINT / Photoshop / Affinity / GIMP / Krita)
- 내보내기: PDF (콘티 인쇄) / 동영상 (MP4, H.264)
- Undo / Redo
- CUT / SCENE 재정렬 (드래그 앤 드롭)
- 로컬 git 연동 (선택·고급 사용자용)
- 최근 프로젝트
- 다국어 (한국어 / 일본어 / 영어), 라이트 / 다크 / 시스템 테마
- 웹 버전은 PWA로 설치 가능 (Chromium 계열 브라우저)
- `settings.json`을 통한 사용자 설정

## 콘티 파일

Mizutama Conte는 콘티를 하나의 JSON 파일과 여러 개의 PSD 파일로 관리합니다.

```sh
conte/
├── [프로젝트명].json
│
├── c001.psd
├── c002.psd
├── c003.psd
└──   ...
```

### JSON 구성

저장되는 JSON은 `ProjectFile`(v2)입니다. 각 컷은 `rows`(PSD 레이어에 순서로 대응하는 행)를 가지며, DIALOGUE는 행 단위로 보관합니다.

```json
{
  "version": 2,
  "title": "君と一緒に",
  "settings": {
    "aspect": "16:9",
    "resolution": "FHD",
    "frame": { "width": 1920, "height": 1080 },
    "fps": 24
  },
  "cuts": [
    {
      "id": "c1",
      "sceneStart": { "title": "Scene 1" },
      "psd": "c001.psd",
      "time": 168,
      "action": { "fadeIn": "Black In", "fadeInDuration": 96 },
      "rows": [
        { "id": "r1", "layer": "1", "dialogue": "佑希「楽しみだな！」晴奈「そうだね」", "canvas": { "width": 1920, "height": 1080 } }
      ]
    },
    {
      "id": "c2",
      "psd": "c002.psd",
      "time": 156,
      "cameraWork": {
        "position": { "in": { "x": 0, "y": 0 }, "out": { "x": -0.421875, "y": 0 } },
        "scale": { "in": 1.421875, "out": 1 }
      },
      "rows": [
        { "id": "r2", "layer": "1", "dialogue": "佑希「僕と晴奈は飛行機に乗っている。…」", "canvas": { "width": 1920, "height": 1080 } }
      ]
    }
  ]
}
```

타입은 다음과 같습니다 (`src/project/types.ts`, `src/@types/global.d.ts`).

```ts
interface ProjectFile {
  version: 2;
  title: string;
  settings: ProjectSettings;
  cuts: ProjectCut[];
}

interface ProjectSettings {
  aspect: '4:3' | '16:9' | '1.85:1' | '2.39:1';
  resolution: 'SD' | 'HD' | 'FHD' | '2K' | '4K';
  frame: { width: number; height: number };
  fps: number;
}

interface ProjectCut {
  id: string;
  sceneStart?: { title?: string }; // 이 컷에서 새 씬이 시작됨
  psd?: string;                    // 프로젝트 폴더 기준 PSD 파일명
  time?: number;                   // 듀레이션 (프레임 수)
  action?: Action;
  cameraWork?: CameraWork;
  rows: CutRow[];
}

interface CutRow {
  id: string;
  layer: string;                   // PSD 레이어명 (불러오기는 순서로 매핑)
  dialogue?: string;
  canvas: { width: number; height: number };
}

interface Action {
  fadeIn?: 'None' | 'White In' | 'Black In' | 'Cross';
  fadeInDuration?: number;
  fadeOut?: 'None' | 'White Out' | 'Black Out' | 'Cross';
  fadeOutDuration?: number;
  text?: string;
}

interface CameraWork {
  position?: { in: { x: number; y: number }; out: { x: number; y: number } };
  scale?: { in: number; out: number };
}
```

구 스키마(v1·플랫 배열 형식) 파일도 불러올 때 v2로 자동 변환됩니다. PSD 파싱에는 [ag-psd](https://github.com/Agamnentzar/ag-psd)를 사용합니다.

### PSD 구성

![samplepsd](./samplepsd.png)

#### 캔버스 크기

실제 애니메이션과 같은 크기로 만듭니다 (예: 1920×1080).

#### 레이어 구성

- 최하단을 배경 레이어로 둡니다 (그림이 있는 배경도 렌더링됩니다).
- 한 컷에 여러 프레임이 있으면 아래에서부터 시간순으로 배치합니다.
- 1프레임 = 1레이어, 또는 **1프레임 = 1그룹**(그룹은 합성하여 1프레임으로 취급합니다).
- 레이어의 블렌드 모드·불투명도·클리핑도 반영됩니다.
- 레이어명은 자유입니다 (불러오기는 순서로 매핑합니다).
- 숨겨진 레이어도 불러옵니다.

### 샘플

샘플 파일을 아래에서 다운로드할 수 있습니다.

**This sample is NOT under BSL 1.1 nor Apache 2.0 License. ©︎ 2020 Studio Mizutama All Rights Reserved.**

[Dropbox](https://www.dropbox.com/scl/fo/3qync4e9u8eew9jvjmj53/AOZaBZuIr57tLwGSNW42fss?rlkey=3kdow3hlw9pt0hdfors67capl&st=ml747cld&dl=0)

Electron 버전에서는 `File -> Open`(`Cmd / Ctrl + O`), [웹 버전](https://studio-mizutama.github.io/MizutamaConte/)에서는 좌측 상단의 폴더 아이콘에서 다운로드한 샘플을 폴더째로 선택하세요.

## License

Mizutama Conte는 **Business Source License 1.1 (BSL 1.1)**로 제공됩니다. 각 버전은 공개 4년 후 자동으로 Apache License 2.0으로 전환됩니다.

- **무료로 사용할 수 있는 경우**: 동인(유상 반포 포함)·영화제·단관 상영·개인 채널(수익화 포함)·교육/비상업, 그리고 도구로 콘티를 그리는 행위 자체.
- **상용 라이선스가 필요한 경우**: 제작한 작품을 지상파/위성/케이블 방송, 상용 스트리밍 배신, 또는 전국 규모(10개관 초과)의 극장에서 일반 공개하는 경우. 비용을 지불하는 쪽은 공개를 주관하는 측(제작위원회·배급 등)이며, 도구를 사용한 제작자 개인·하청 스튜디오는 항상 무료입니다.
- 자세한 내용은 [LICENSING.md](LICENSING.md)와 [LICENSE](LICENSE)를 참고하세요.

「Mizutama Conte」「Studio Mizutama」의 명칭·로고·공식 빌드 서명은 상표이며 라이선스의 대상이 아닙니다 (4년 후 Apache 전환 이후에도 동일).

> 과거에 공개된 프리뷰판(프로토타입)은 MIT 라이선스로 배포되었으며, 해당 버전은 계속 MIT입니다.
