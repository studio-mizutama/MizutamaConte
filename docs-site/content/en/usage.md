# Getting started

Mizutama Conte is an editor for animation production that lets you draw a storyboard and play it back as an animatic (a storyboard you can play back as video). All of your data is processed locally on your own computer and never sent to a server. There is a desktop version (Mac / Windows / Linux) and a Web version that runs in the browser.

This page walks through the whole flow, from creating a project to exporting it, in order. The full list of keyboard shortcuts lives on a separate page ([Shortcuts](#/shortcuts)).

## The overall flow

1. Create a project (choose resolution and aspect ratio)
2. Draw the cuts (edit PSD files in external paint software)
3. Edit the cuts (add cuts, edit scene breaks, merge and split cuts, add layers, edit ACTION / DIALOGUE / TIME)
4. Add camera work (crop and resize, slider editing)
5. Set the duration (act it out and time it with the stopwatch)
6. Add transitions (fades and crossfades)
7. Play it back in preview to check
8. Export to PDF or MP4

Saving happens automatically as you work (both the PSD and the JSON). You generally don't need to save by hand.

## 1. Create a project

### New project

Choose "New project" from the menu. When you create it, you decide the resolution and aspect ratio for the storyboard.

Pick a resolution from SD / HD / FHD / 2K / 4K, and an aspect ratio from 4:3 / 16:9 / 1.85:1 / 2.39:1. The resolution you choose here becomes the reference size of the PSD (its native resolution).

If you're unsure, HD or FHD at 16:9 is a good starting point for TV anime, and 1.85:1 or 2.39:1 if you have a theatrical work in mind.

### Build from a script (Markdown)

If your script is already in Markdown, you can generate the scenes and cuts from it in one pass. Load it from "New from script" (`Cmd / Ctrl + Shift + N`) in the menu. Headings mark scene breaks, horizontal rules mark cut breaks, dialogue lines become DIALOGUE, and an empty PSD is created automatically for each cut.

For the full syntax and concrete examples, see [Writing a script (Markdown)](#/script-syntax).

## 2. Draw

Mizutama Conte itself has no drawing tools. You draw in the paint software you already use. CLIP STUDIO PAINT / Photoshop / Affinity Photo / GIMP / Krita, or any other software that can open a PSD file and save over it, will work.

### Open a PSD and draw

1. Double-click a cut's frame (PICTURE).
2. The paint software you selected in the settings launches and opens the `.psd` file that backs that cut.
3. Draw, then save over the file.
4. When you return to Mizutama Conte, the saved content loads automatically and the frame display updates.

Nothing is converted to a proprietary format. What opens is an ordinary PSD that you can edit as usual in your regular software.

## 3. Edit the cuts

A storyboard is a collection of scenes and cuts (CUT). Each row in the list corresponds to one cut.

### Add a cut

Adding a row inserts a new, empty cut. Each cut gets an empty PSD, so you can start drawing right away.

### Break into scenes

You can break into a new scene at any position. Inserting a scene break starts a new scene from there.

### Merge and split cuts

Adjacent cuts can be merged. Conversely, a merged cut can be split back to its original state. This is handy when you re-time your cut breakdown.

### Layers = frames within a cut

A single cut can hold multiple layers. Here, layers are treated as a time-ordered flipbook within the cut. The layers stacked on top of the background are displayed one frame at a time, in order. It's the mechanism for expressing in-betweens or motion within a single cut. If you want to treat several layers as a single frame, group them.

### ACTION / DIALOGUE / TIME

Each cut can carry the following information.

- ACTION (stage directions): a description of the cut's content and motion
- DIALOGUE (line): the dialogue spoken in that cut
- TIME (duration): the length of that cut

You can edit ACTION and DIALOGUE as text in place. TIME can be entered as a number, or set with the stopwatch described below.

## 4. Add camera work

Drag the camera frame (crop frame) on the cut to set its size and position. Making the frame larger gives you a zoom-in; shifting its position gives you a pan.

Holding `Shift` while dragging enables snapping.

- Horizontal snap (a horizontal pan)
- Vertical snap (a vertical pan)
- Aspect-locked snap (a zoom that keeps the aspect ratio)

### Auto-generate a default camera move from the resize direction

When you resize the camera frame, a plausible default for the pan or zoom is filled in automatically based on the direction (which way you expanded or shrank it). The easy workflow is to move the frame roughly to get in the ballpark first, then fine-tune afterward.

### Adjust with sliders and numbers

In the camera work panel, you can dial in the values with both sliders and numeric input.

- Get it close with the slider, then set the exact value with numbers
- IN and OUT can be swapped
- Items that are at full native resolution (= no crop, no motion) are grayed out

The graying out is your signal that "there's no camera work here."

## 5. Set the duration (stopwatch)

For a cut's length, you can actually act out the performance and enter that time directly as the duration.

1. Select the `T` (stopwatch) tool in the left toolbar.
2. Choose the cut whose duration you want to time.
3. Press `Space` to start measuring, and `Space` again to stop.
4. The length you performed is entered as that cut's TIME (seconds + frames).

Read the lines aloud, act out the motion with your body — whatever lets you turn the timing in your head straight into numbers. If you'd rather type the seconds by hand, you can edit TIME directly.

## 6. Add transitions

You can set fades and crossfades at cut transitions.

- Fade in / fade out: choose between White and Black.
- Crossfade: a fade where the previous cut and the next cut overlap and swap.

The default duration for a transition is 0.5 seconds (for example, 12 frames at 24fps, or 15 frames at 30fps). You can adjust the length afterward.

## 7. Play it back in preview

Playing back the preview lets you watch the whole thing through as an animatic, with the durations, camera work, and transitions you set all applied. Pans and zooms play as real motion, so you can check the timing and how the screen reads while you're still at the drawing stage.

## 8. Export

A finished storyboard can be exported in two formats.

### PDF print (storyboard sheet)

Exports in a format close to a studio storyboard sheet (A4). Each cut's PICTURE shows the IN / OUT camera frames and includes the cumulative duration. It drops straight into a paper workflow.

### MP4 video (animatic)

Exports an MP4 video file at the project's native resolution and fps. The motion you checked in preview becomes the video as-is.

## Supported environments

The supported environments for the desktop version are as follows.

- macOS 12 or later
- Windows 10 or later
- Linux (Ubuntu 20.04 equivalent or later)

On older environments, use the Web version, which runs in Chromium-based browsers.

The Web version is intended for use in Chromium-based browsers (Chrome, Edge, and so on). Because saving and loading files and exporting video depend on the File System Access API and WebCodecs, Safari and Firefox are view-only (no saving or exporting). Chromium-based browsers are also recommended for PDF printing.

The distributed builds are currently not code-signed, so the first launch takes one extra step to get past the OS warning (for example, allowing it through Gatekeeper on Mac).

## Other

- Auto-save: your edits are saved to the PSD and JSON as you go.
- Recent projects: reopen your previous work right away.
- Undo / Redo: undo and redo your actions.
- Display language: switch between English / Japanese / Korean.
- Theme: switch between light and dark.

The shortcuts for these operations are collected on the [Shortcuts](#/shortcuts) page.
