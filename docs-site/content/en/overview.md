# Overview

Mizutama Conte is an editor for making animation storyboards. There is an Electron version that runs on Mac / Windows / Linux, and a Web version that runs in the browser.

It does more than lay out storyboard panels for printing: you can play a storyboard back as an animatic (a storyboard you can play as video), with the camera work intact. Everything stays on your own machine — nothing is sent to a server. It is free to use.

## What you can do with it

Draw the picture for each cut, add dialogue, duration, and camera work, and pull it all together into a single storyboard. When it's finished, you can export it as a PDF close to the format studios commonly use, or as an MP4 that actually plays.

The drawing itself is left to external paint software; Mizutama Conte handles the structure, duration, camera work, and export.

## Three ideas behind it

### Playback with camera work

Set up a pan or a zoom, and that movement plays back as actual video in the preview. Camera movement is hard to convey with a still storyboard alone, and here you can check it while you work. The preview and the exported MP4 look the same.

### Everything stays on your machine

Files are saved locally and never sent anywhere. There is no account to register. The Electron version works with local files directly; the Web version does the same through the browser's File System Access API to handle the data on your own disk.

### Draw in the paint software you already use

Double-click a cut and a real `.psd` opens in the paint software you normally use (CLIP STUDIO PAINT / Photoshop / Affinity Photo / GIMP / Krita). Draw, save, and it is reloaded automatically. Nothing is converted to a proprietary format. Even if the paint software trims the canvas, the area you didn't draw on is kept.

## Main features

- Resolution and aspect ratio: choose a combination of SD / HD / FHD / 2K / 4K with 4:3 / 16:9 / 1.85:1 / 2.39:1 when you create a project.
- Crop and resize: hold Shift to snap to horizontal, vertical, or aspect ratio. Based on the direction you resized, default pan or zoom camera work is generated automatically.
- Camera work editing: adjust with sliders and numeric input, and swap IN / OUT. Values at native resolution are greyed out.
- Stopwatch Rec: the T tool in the left toolbar. A Rec control appears on each row, and you start and stop timing with Space. The length of the action you perform becomes the cut's duration (seconds + frames) directly.
- Layers: treated as a chronological flipbook within a cut. Layers stacked on top of the background are advanced one frame at a time.
- Cut operations: add a row, split a scene, merge or separate cuts, add a layer, and edit ACTION / DIALOGUE / TIME.
- Transitions: fades (White / Black, In / Out) and crossfade are supported.
- Export: a studio-format storyboard sheet PDF (A4), and an MP4 at native resolution and fps.
- Auto-save (PSD + JSON), new project, recently opened projects, Undo / Redo, multiple languages (English / Japanese / Korean), and light/dark themes.

## Who it's for

- People who want to check a storyboard including the camera movement
- People who want to keep their data on their own machine
- People who want to make storyboards without switching from the paint software they already use
- People who need a PDF in a format they can hand to downstream stages, or a video for review

## Supported environments

The Electron version runs on macOS 12 or later / Windows 10 or later / Linux (Ubuntu 20.04 equivalent or later). On older environments, use the Web version in a modern Chrome / Edge.

The distributed builds are unsigned, so the first launch takes an extra step. The procedure is explained on the download page.

## Where to read next

- [Download](#/download): getting the version that fits your environment, and the first-launch procedure.
- [Usage](#/usage): the flow from creating a project to exporting.
- [Shortcuts](#/shortcuts): a summary of keyboard operations.
