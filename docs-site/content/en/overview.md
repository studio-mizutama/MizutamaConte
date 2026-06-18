# Overview

Mizutama Conte is an editor for making animation storyboards (econte). There's an Electron version that runs on Mac / Windows / Linux, and a Web version that runs in the browser.

Beyond just laying out and printing storyboards, it can play them back as moving video with the camera work intact. All your data stays on your own machine and is never sent to a server. It's free to use.

## What you can do

You draw the picture for each CUT, add dialogue, timing, and camera work, and assemble it into a single storyboard. When it's done, you can export it as a PDF close to the standard shooting-sheet format, or as an MP4 that actually moves.

Drawing is left to an external paint app. Mizutama Conte handles the structure, timing, camera work, and export.

## Three ideas behind it

### Playback with camera work

Set a pan or zoom and that motion plays back as real video in the preview. Camera movement is hard to convey with still-image storyboards alone, but here you can check it while you're still working. The preview and the exported MP4 look the same.

### Everything stays local

Files are saved locally and never sent anywhere. There's no account to register. The Electron version works with local files directly; the Web version goes through the browser's file system API to work with the data on your own disk.

### Draw in the paint app you already use

Double-click a CUT and it opens a real `.psd` in the paint app you normally use (CLIP STUDIO / Photoshop / Affinity / GIMP / Krita). Draw, save, and it reloads automatically. Nothing gets converted to a proprietary format. Even if the paint app trims the canvas, the area you didn't draw is preserved.

## Key features

- Resolution and aspect ratio: choose a combination of SD / HD / FHD / 2K / 4K and 4:3 / 16:9 / 1.85:1 / 2.39:1 when you create a project.
- Crop and resize: hold Shift to snap to horizontal, vertical, or aspect ratio. Based on the direction you resized, default pan or zoom camera work is generated automatically.
- Camera work editing: adjust with sliders and numeric input, and swap IN / OUT. Values at native resolution are grayed out.
- Stopwatch Rec: the T tool in the left toolbar. It shows a Rec on each row, and you start and stop timing with Space. The length you act out a scene becomes the CUT's duration (seconds + frames) directly.
- Layers: treated as a chronological flipbook within a CUT. Layers stacked on top of the background advance one frame at a time.
- CUT operations: add rows, scene breaks, merge and split with 🔗, multiple layers, and editing of ACTION / DIALOGUE / TIME.
- Transitions: supports fades (White / Black, In / Out) and crossfades via true dissolve. The default duration is half the fps.
- Export: a studio-format storyboard sheet PDF (A4) with IN / OUT camera frames and cumulative timing, and an MP4 at native resolution and fps.
- Auto-save (PSD + JSON), new project creation, recently opened projects, Undo / Redo, multiple languages (日本語 / 한국어 / English), and light / dark themes.
- It's built not to crash even on broken values or broken JSON.

## Who it's for

- People who want to check storyboards including the camera movement
- People who want to keep their data on their own machine
- People who want to make storyboards without switching from the paint app they already use
- People who need a print-ready PDF to hand off for shooting, or a video for review

## Supported environments

The Electron version runs on macOS 12 or later / Windows 10 or later / Linux (Ubuntu 20.04 equivalent or later). On older environments, use the Web version in a modern Chrome / Edge.

The distributed builds are unsigned, so the first launch takes an extra step. The procedure is explained on the download page.

## Where to go next

- [Download](#/download): getting the version that fits your environment, and the first-launch procedure.
- [Usage](#/usage): the flow from creating a project to exporting.
- [Shortcuts](#/shortcuts): a summary of keyboard operations.
