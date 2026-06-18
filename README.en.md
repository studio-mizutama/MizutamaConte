Welcome to Mizutama Conte.
日本語: [README.md](README.md) ／ 한국어: [README.ko.md](README.ko.md)

# Mizutama Conte [\[Web App\]](https://studio-mizutama.github.io/MizutamaConte/)

![screenshot](./screenshot.png)

A storyboard editor built with React + Electron. It offers resolution & aspect-ratio settings, a camera-work animatic preview, PSD + JSON saving, PDF / video export, Undo / Redo, and more. Being able to play back the preview with camera work applied is what makes it distinctive.

> This README is for developers. End-user documentation (install steps and usage) lives on the [docs site](https://studio-mizutama.github.io/MizutamaConte/docs/).

## Usage (for developers)

### Install

```sh
$ yarn
```

### Development

```sh
$ yarn dev      # Electron edition (Mac / Win / Linux)
$ yarn dev:web  # Web edition (http://localhost:3000)
```

### Build

```sh
$ yarn build      # Electron edition (output to out/)
$ yarn build:web  # Web edition (output to build/)
$ yarn build:docs # Docs site (output to build/docs/)
```

### Deploy (GitHub Pages)

```sh
$ yarn deploy     # Publish build:web + build:docs to the gh-pages branch
```

### Verify

```sh
$ yarn test       # vitest (pure-function unit tests)
$ yarn typecheck  # type-check renderer + electron
```

> **Distribution builds are unsigned.** Builds produced from this repository are not code-signed or notarized. End-user guidance, such as the macOS quarantine workaround, is on the docs site.

## Features

- Display and edit storyboards (PSD + JSON, auto-save with a 1.5s debounce)
- Create a new project (choose resolution & aspect ratio), or create one from a script (.md)
- Canvas resize (auto-generates default camera work based on direction)
- Camera-work editing, and a camera-work animatic preview
- Transitions (fade in / fade out / crossfade)
- Stopwatch-based TIME input
- External paint-app integration (CLIP STUDIO PAINT / Photoshop / Affinity / GIMP / Krita)
- Export: PDF (storyboard print) / video (MP4, H.264)
- Undo / Redo
- Reorder CUTs / SCENEs (drag & drop)
- Local git integration (optional, for advanced users)
- Recent projects
- Multilingual (English / Japanese / Korean), light / dark / system theme
- The web edition is installable as a PWA (Chromium-based browsers)
- User preferences via `settings.json`

## Storyboard files

Mizutama Conte manages a storyboard with a single JSON file and multiple PSD files.

```sh
conte/
├── [ProjectName].json
│
├── c001.psd
├── c002.psd
├── c003.psd
└──   ...
```

### JSON structure

The saved JSON is a `ProjectFile` (v2). Each cut has `rows` (rows that map to PSD layers by order), and DIALOGUE is held per row.

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

The types are as follows (`src/project/types.ts`, `src/@types/global.d.ts`).

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
  sceneStart?: { title?: string }; // a new scene starts at this cut
  psd?: string;                    // PSD filename relative to the project folder
  time?: number;                   // duration (frames)
  action?: Action;
  cameraWork?: CameraWork;
  rows: CutRow[];
}

interface CutRow {
  id: string;
  layer: string;                   // PSD layer name (loaded by order)
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

Files in the old schema (v1, a flat array) are automatically converted to v2 on load. PSD parsing uses [ag-psd](https://github.com/Agamnentzar/ag-psd).

### PSD structure

![samplepsd](./samplepsd.png)

#### Canvas size

Create it at the same size as the actual animation (e.g. 1920×1080).

#### Layer structure

- Put the background layer at the bottom (a background with artwork is rendered too).
- If a cut has multiple frames, stack them from the top in chronological order.
- One frame = one layer, or **one frame = one group** (a group is composited and treated as a single frame).
- Layer blend modes, opacity, and clipping are honored.
- Layer names are arbitrary (loading maps by order).
- Hidden layers are loaded too.

### Sample

You can download sample files from the link below.

**This sample is NOT under BSL 1.1 nor Apache 2.0 License. ©︎ 2020 Studio Mizutama All Rights Reserved.**

[Dropbox](https://www.dropbox.com/scl/fo/3qync4e9u8eew9jvjmj53/AOZaBZuIr57tLwGSNW42fss?rlkey=3kdow3hlw9pt0hdfors67capl&st=ml747cld&dl=0)

In the Electron edition, use `File -> Open` (`Cmd / Ctrl + O`); in the [web edition](https://studio-mizutama.github.io/MizutamaConte/), use the folder icon at the top left, then select the downloaded sample as a whole folder.

## License

Mizutama Conte is provided under the **Business Source License 1.1 (BSL 1.1)**. Each version automatically converts to the Apache License 2.0 four years after its release.

- **Free to use** for doujin works (including paid distribution), film festivals, single-theater runs, personal channels (including monetized ones), and educational / non-commercial use — and the act of drawing storyboards with the tool is always free.
- **A commercial license is required** when the work you create is released to the general public via terrestrial / satellite / cable broadcast, a commercial streaming service, or a nationwide theatrical run (more than 10 screens). The party that controls that release (the production committee, the distributor, etc.) pays; the individual creators and subcontracted studios who use the tool are always free.
- See [LICENSING.md](LICENSING.md) and [LICENSE](LICENSE) for details.

"Mizutama Conte" and "Studio Mizutama" — the names, logos, and official build signatures — are trademarks and are not covered by the license (the same applies after the Apache conversion four years later).

> Previously published preview (prototype) builds were distributed under the MIT License, and those versions remain MIT.
