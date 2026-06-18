# Script Import Syntax

Write your script in Markdown, and Mizutama Conte reads it to build a storyboard skeleton split into scenes and CUTs in one pass. Dialogue (DIALOGUE) and stage directions (ACTION) are sorted out automatically, and each CUT gets an empty PSD. From there, the idea is that you draw the pictures and dial in the timing and camera work.

This page explains how to write the Markdown that gets read, with input examples paired with the results they produce.

## How to start

Run it from the menu via "New from Script". The shortcut is Cmd+Shift+N (Ctrl+Shift+N on Windows / Linux).

1. Pick a Markdown script file. Besides `.md`, the `.txt` extension is also accepted.
2. Set the resolution, aspect ratio, and fps, just like a regular new project (Cmd+N / Ctrl+N).
3. Once it loads, you get a new project with scenes and CUTs assembled from the script's contents.

Even if the formatting differs from what's expected, the app won't crash. If it can't read something, it tells you with an error dialog.

## Overall structure

A script Markdown file is interpreted roughly along these levels:

- The first h1 (`# Heading`) = the work's title (= the project name)
- Headings (`##` and below, any level) = scene breaks. The heading text is the scene name
- Horizontal rules (`---` and similar) = CUT breaks
- Lines like "Name: dialogue" or "Name「dialogue」" = DIALOGUE
- Any other body text = ACTION

Let's go through these in order.

## h1 is the work's title

The h1 at the top of the file is used as the work's title, which becomes the project name.

```
# After-School, Rain Lifted
```

The explanatory text written right below the h1 (up until the next heading) is not read in. You can use it as a place to keep a synopsis or notes.

If there's no h1 at the top and the file starts straight from an h2, the Markdown file name becomes the project name, and everything from that h2 onward is read as scene breaks. If there's no heading at all at the top, the content up until the first heading appears is skipped.

## Headings are scene breaks

Headings from h2 through h6 all carry the same meaning as scene breaks. You don't need to keep the levels consistent. `##` or `####` both work. The heading text becomes that scene's title.

An h1 that appears partway through is also treated the same as h2 and below here, as a scene break.

The scene title is attached to that scene's first CUT. Empty scenes (headings with no content) are never created.

## Horizontal rules are CUT breaks

Use a horizontal rule like `---` to separate CUTs. There's some tolerance for dialects of the syntax, and all of the following are treated as CUT breaks:

```
---
***
___
- - -
```

A line of three or more of the symbol is considered a horizontal rule.

## Sorting ACTION and DIALOGUE

Within a CUT, each line is sorted into either DIALOGUE (lines) or ACTION (stage directions).

Two forms are recognized as DIALOGUE:

- A form like `Name: dialogue`, where a character name and a colon come at the start of the line. The colon can be a half-width `:` or a full-width `：`. The space after the colon can be omitted.
- A form like `Name「dialogue」`, where the name is followed by text wrapped in corner brackets.

The name portion is expected to be up to about 20 characters. Everything else becomes ACTION.

Input example:

```
Haru: Morning, hot again today
Nagi:No space after the colon is fine too
Nagi「Corner brackets are DIALOGUE all the same」
Classroom. Cicadas crying outside the window.
```

When these 4 lines go into one CUT, they're sorted like this:

- DIALOGUE: "Morning, hot again today", "No space after the colon is fine too", "Corner brackets are DIALOGUE all the same"
- ACTION: "Classroom. Cicadas crying outside the window."

The names in the dialogue (`Haru:` or `Nagi「`) are kept exactly as written. We don't strip the prefix on our own.

## Markdown syntax is stripped, only the content is brought in

Quotes, code blocks, and bullet lists are also brought in as ACTION (as long as they aren't in dialogue form). During reading, the Markdown markers are stripped, leaving only the text content.

For example, the following input:

```
> Hallway of the old schoolhouse
- Graffiti left on the blackboard
* Desk by the window
**Strong** evening sun streams in
```

is brought in as ACTION like this:

```
Hallway of the old schoolhouse
Graffiti left on the blackboard
Desk by the window
Strong evening sun streams in
```

Markers like `-`, `>`, `**...**` (bold), `*...*` (italic), and `` `...` `` (inline code) are stripped, leaving only the content. Line breaks are kept as-is. If there are multiple lines within a single CUT, they're joined by line breaks into one ACTION.

## Empty CUTs are not created

If there's neither ACTION nor DIALOGUE between two breaks, that CUT isn't created. Even if you write several `---` in a row, they're ignored as long as there's no content between them.

Each CUT ends up in a form where at least one of ACTION or DIALOGUE has text in it.

Whether or not you put a CUT break `---` right before a scene heading, the result is the same. A leftover break after the final CUT is also handled appropriately.

## A complete example

Suppose you load the following script:

```
# After-School, Rain Lifted

You can keep a synopsis here (ignored during reading)

## Classroom

Haru: The rain finally stopped
Open the window, and the smell of the wet schoolyard.

---

Nagi「Teacher, can I go home now?」
The clock points to 5 p.m.

## Entrance Hall

Haru「My shoes are damp」
```

When loaded, it comes out like this:

- Work title: After-School, Rain Lifted
- Scene "Classroom"
  - CUT 1 — DIALOGUE "The rain finally stopped" / ACTION "Open the window, and the smell of the wet schoolyard."
  - CUT 2 — DIALOGUE "Teacher, can I go home now?" / ACTION "The clock points to 5 p.m."
- Scene "Entrance Hall"
  - CUT 3 — DIALOGUE "My shoes are damp" / ACTION none

The scene titles are attached to each scene's first CUT (CUT 1 and CUT 3). The synopsis right below the h1 is not read in.

## After loading

Each CUT gets an empty PSD (`c001.psd`, `c002.psd`, ...) prepared automatically. Double-click the PICTURE to open it in an external drawing app and start drawing. CUT durations are filled with placeholder values, so use the stopwatch (T tool) or direct TIME editing to match them to the real durations.

Since you start with the lines and stage directions already in place, it should be easier to focus on the artwork.

## Notes

- The `.txt` extension is accepted in addition to `.md`, but the content is interpreted as Markdown.
- A `Name:` or `Name「` written on a line becomes DIALOGUE. A line in a stage direction that happens to fall into this form may get picked up as dialogue.
- Loading won't stop even with unexpected formatting. If the result differs from what you intended, review the positions of headings and `---`, and how the dialogue is written.

A full list of shortcuts is collected on the [Shortcuts](#/shortcuts) page.
