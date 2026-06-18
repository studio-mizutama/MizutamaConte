# Getting Started

Mizutama Conte is an editor for drawing animation storyboards (econte) and playing them back as video storyboards with camera moves. All data is processed locally on your own machine and never sent to a server. There's an Electron build (Mac / Windows / Linux) and a Web version that runs in the browser.

This page walks through the whole flow, from creating a project to exporting it, in order. The full list of keyboard shortcuts lives on a separate page ([Shortcuts](#/shortcuts)).

## The overall flow

1. Create a project (pick the resolution and aspect ratio)
2. Draw the cuts (edit the PSD in an external drawing app)
3. Edit the cuts (add, split scenes, merge/separate, layers, ACTION / DIALOGUE / TIME)
4. Add camera moves (crop and resize, slider editing)
5. Set the timing (act it out with the stopwatch and measure it)
6. Add transitions (fades and crossfades)
7. Play it back in Preview to check
8. Export to PDF or MP4

Saving happens automatically along the way (both the PSD and the JSON). You generally don't need to save manually.

## 1. Create a project

### New project

Choose "New Project" from the menu. When you create it, you decide the resolution and aspect ratio for the storyboard.

Pick a resolution from SD / HD / FHD / 2K / 4K and an aspect ratio from 4:3 / 16:9 / 1.85:1 / 2.39:1. The resolution you choose here becomes the base size of the PSD (the native resolution). The camera moves described below are expressed by cropping inside this base size.

If you're not sure, HD or FHD at 16:9 is a good starting point for TV anime; 2.39:1 is a reasonable choice if you're aiming for a theatrical look.

### Create from a script (Markdown)

If your script is already in Markdown, you can generate scenes and cuts from it in one pass. Load it from "New from Script" (`Cmd / Ctrl + Shift + N`) in the menu. Headings mark scene breaks, horizontal rules mark cut breaks, lines in the form "Name: Dialogue" become DIALOGUE, and an empty PSD is created for each cut automatically.

For the syntax details and concrete examples, see [Writing a script (Markdown)](#/script-syntax).

## 2. Draw

Mizutama Conte itself has no drawing tools. You draw in whatever drawing app you normally use. The supported apps are CLIP STUDIO PAINT / Photoshop / Affinity / GIMP / Krita.

### Open a PSD and draw

1. Double-click a cut's frame (PICTURE).
2. The drawing app you selected in Settings launches and opens the `.psd` file that backs that cut.
3. Draw as usual, then save over the file.
4. When you return to Mizutama Conte, the saved content is loaded automatically and the frame updates.

Nothing is converted to a proprietary format. What opens is an ordinary PSD, and you can edit it in your usual app exactly as you would anything else.

### Your drawing is preserved even if the canvas is trimmed

Some drawing apps trim the canvas down to the edges of the drawn area on save. Mizutama Conte corrects for this (normalize) and restores the original canvas size before importing. Even if the canvas is trimmed, the position of the artwork and the empty margins you haven't drawn on yet are not lost.

## 3. Edit the cuts

A storyboard is a collection of scenes and cuts (CUT). Each row in the list corresponds to one cut.

### Add a cut

Adding a row inserts a new, empty cut. Each cut gets an empty PSD, so you can start drawing right away.

### Split scenes

You can split into a new scene at any position. Inserting a scene break starts a new scene from that point.

### Merge and separate cuts (🔗)

Adjacent cuts can be merged. Conversely, a merged cut can be separated back to how it was. This is handy when you re-time your cut breakdown.

### Layers = frames within a cut

A single cut can hold multiple layers. Here, layers are treated as a time-ordered flipbook within the cut. The layers stacked on top of the background are displayed one frame at a time, in order. It's the mechanism for expressing in-betweens and motion within a single cut.

### ACTION / DIALOGUE / TIME

Each cut can carry the following information.

- ACTION: a description of what happens in the cut and the motion
- DIALOGUE: the lines spoken in that cut
- TIME: the length of that cut

You can edit ACTION and DIALOGUE as text in place. TIME can be entered as a number, or set with the stopwatch described below.

## 4. Add camera moves

This is the core feature of Mizutama Conte. Set a frame cropped inside the base size (native resolution) as IN (start) and OUT (end), and the camera moves between them. Pans and zooms play back as real footage in Preview.

### Set the camera frame by cropping

Drag the camera frame (crop frame) on the cut to set its size and position. Making the frame smaller gives you a zoom-in; shifting its position gives you a pan.

Holding `Shift` while dragging enables snapping.

- Horizontal snap (a horizontal pan)
- Vertical snap (a vertical pan)
- Aspect-locked snap (a zoom that keeps the aspect ratio)

### Auto-generate a default camera move from the resize direction

When you resize the camera frame, a plausible default for the pan or zoom is filled in automatically based on the direction (which way you expanded or shrank it). The easy workflow is to roughly move the frame to get in the ballpark first, then fine-tune afterward.

### Adjust with sliders and numbers

In the camera move panel, you can dial in the values with both sliders and numeric input.

- Get it close with the slider, then nail it precisely with numbers
- IN and OUT can be swapped
- Items that are at full native resolution (= no crop, no motion) are grayed out

The graying out is your signal that "there's no camera move here."

## 5. Set the timing (stopwatch Rec)

For a cut's length, you can actually perform the action and use that duration directly as the timing.

1. Select the `T` (stopwatch) tool in the left toolbar.
2. Choose Rec on the row of the cut you want to time.
3. Press `Space` to start measuring, and `Space` again to stop.
4. The duration you performed is entered as that cut's TIME (seconds + frames).

Read the lines aloud, act out the motion with your body — whatever timing you have in your head, you can turn it straight into numbers. If you'd rather type the seconds by hand, you can edit TIME directly.

## 6. Add transitions

You can set fades and crossfades at cut boundaries.

- Fade: White / Black, In / Out. The picture fades up from or down to white or black.
- Crossfade: a true dissolve where the previous cut and the next cut overlap and swap.

The default transition length is half the project's fps (for example, 12 frames at 24fps, 15 frames at 30fps). You can adjust the length afterward.

## 7. Play it back in Preview

Playing back the Preview lets you watch the whole thing as a video storyboard, with the timing, camera moves, and transitions you set all applied. Pans and zooms play as real motion, so you can check the timing and how the screen reads while you're still at the drawing stage.

What you see in Preview matches the result of the export that follows (WYSIWYG).

## 8. Export

A finished storyboard can be exported in two formats.

### PDF (storyboard sheet)

Exports as a studio-format storyboard sheet (A4). Each cut's PICTURE shows the IN / OUT camera frames and includes the cumulative timing. It drops straight into a paper workflow — for meetings, handing off to the animation director, and so on.

### MP4 (video storyboard)

Exports as MP4 at the project's native resolution and fps. The motion you checked in Preview becomes the video as-is.

## Supported environments

The supported environments for the Electron build are as follows.

- macOS 12 or later
- Windows 10 or later
- Linux (Ubuntu 20.04 equivalent or later)

On older environments, use the Web version, which runs in a modern Chrome / Edge.

The distributed builds are currently not code-signed, so the first launch takes one extra step to get past the OS warning (for example, allowing it through Gatekeeper on Mac).

## Small conveniences

- Auto-save: your edits are saved to the PSD and JSON as you go.
- Recent projects: reopen your previous work right away.
- Undo / Redo: undo and redo your actions.
- Display language: switch between 日本語 / 한국어 / English.
- Theme: switch between light and dark.
- Resilience: the app is built not to crash even if it reads invalid values or broken JSON.

The shortcuts for these operations are collected on the [Shortcuts](#/shortcuts) page.
