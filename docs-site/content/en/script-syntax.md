# Script Import Syntax

If you write your script in Markdown, Mizutama Conte can read it and build a storyboard draft for you in one pass, split into scenes and CUTs. It also sorts the dialogue (DIALOGUE) and the action (ACTION), and gives each CUT an empty PSD. From there, the idea is that you draw the pictures and work out the timing and camera work.

This page explains how to write the Markdown that gets imported, with input examples paired against the result they produce.

## How to start

Run it from the menu under "New from Script". The shortcut is Cmd+Shift+N (Ctrl+Shift+N on Windows / Linux).

1. Pick the Markdown file for your script. Besides `.md`, the `.txt` and `.markdown` extensions are also accepted.
2. Set the resolution, aspect ratio, and fps, just like a regular new project (Cmd+N / Ctrl+N).
3. Once it loads, you get a new project with scenes and CUTs assembled from the contents of the script.

If the formatting isn't what's expected, the app won't crash. When something can't be read, it tells you with an error dialog.

## Overall structure

A script in Markdown is interpreted, broadly, along the following hierarchy.

- The h1 at the top (`# Heading`) = the work's title (which becomes the project name)
- A heading (`##` and below, any level) = a scene break. The heading text is the scene name.
- A horizontal rule (`---` and the like) = a CUT break
- A line in the form "Name: dialogue" or "Name 'dialogue'" = DIALOGUE
- Any other body text = ACTION

Let's go through them in order.

## The h1 is the work's title

The h1 at the top of the file is used as the work's title, which becomes the project name.

```
# After the Rain
```

Any explanatory text written just below the h1 (up until the next heading) is not imported. You can use it as a place to keep a synopsis or notes.

If there's no h1 at the top and the file starts straight from an h2, the Markdown file name becomes the project name, and everything from that h2 on is read as scene breaks. If there's no heading at all at the top, anything before the first heading appears is skipped.

## Headings mark scene breaks

Headings from h2 through h6 all carry the same meaning as scene breaks. You don't need to keep the levels consistent. `##` is fine, and so is `####`. The heading text becomes the title of that scene.

An h1 that turns up partway through is also treated as a scene break here, the same as h2 and below.

The scene title is attached to the first CUT of that scene. Empty scenes (a heading with no contents) are never created.

## Horizontal rules mark CUT breaks

A horizontal rule like `---` separates CUTs. There's some tolerance for stylistic variants, and all of the following are treated as CUT breaks.

```
---
***
___
- - -
```

A line made up of three or more of the same symbol is treated as a horizontal rule.

## Sorting into ACTION and DIALOGUE

Within a CUT, the contents are sorted line by line into either DIALOGUE (the lines) or ACTION (the stage directions).

A line is recognized as DIALOGUE when it takes one of these two forms.

- A character name followed by a colon at the start of the line, as in `Name: dialogue`. The colon can be a half-width `:` or a full-width `：`. The space after the colon may be omitted.
- A name followed by the line in quotation marks, as in `Name "dialogue"`.

The name part is expected to be up to about 20 characters. Everything else becomes ACTION.

Input example:

```
Haru: Morning, hot again today
Nagi:No space after the colon is fine too
Nagi "Quotation marks are DIALOGUE all the same"
The classroom. Cicadas are singing outside the window.
```

When these 4 lines land in a single CUT, they're sorted like this.

- DIALOGUE: "Morning, hot again today" / "No space after the colon is fine too" / "Quotation marks are DIALOGUE all the same"
- ACTION: "The classroom. Cicadas are singing outside the window."

The names on the dialogue (`Haru:` or `Nagi "`) are kept exactly as written. The prefix isn't stripped out on its own.

## Markdown syntax is removed; only the contents are imported

Quotes, code blocks, and bullet lists are imported as ACTION too (as long as they aren't in dialogue form). On import, the Markdown markers are removed and only the text inside is kept.

For example, the following input

```
> Hallway of the old schoolhouse
- Graffiti left on the blackboard
* A desk by the window
A strong **western sun** streams in
```

is imported as ACTION like this.

```
Hallway of the old schoolhouse
Graffiti left on the blackboard
A desk by the window
A strong western sun streams in
```

Markers such as `-`, `>`, `**...**` (bold), `*...*` (italic), and `` `...` `` (inline code) come off, and only the contents remain. Line breaks are kept as is. When there are several lines within one CUT, they're joined by line breaks into a single ACTION.

## Empty CUTs aren't created

If there's no ACTION and no DIALOGUE between two breaks, that CUT isn't created. Even if you happen to write `---` several times in a row, they're ignored as long as there's nothing in between.

Each CUT ends up with text in at least one of ACTION or DIALOGUE.

It makes no difference whether or not you put a `---` CUT break right before a scene heading. A break left over after the final CUT is handled cleanly as well.

## A complete example

Suppose you import the following script.

```
# After the Rain

You can keep a synopsis here (ignored on import)

## Classroom

Haru: The rain finally let up
Open the window, and there's the smell of the wet schoolyard.

---

Nagi "Sir, can I head home now?"
The clock points to 5 p.m.

## Entrance Hall

Haru "My shoes are damp"
```

After importing, it comes out like this.

- Work title: After the Rain
- Scene "Classroom"
  - CUT 1 — DIALOGUE "The rain finally let up" / ACTION "Open the window, and there's the smell of the wet schoolyard."
  - CUT 2 — DIALOGUE "Sir, can I head home now?" / ACTION "The clock points to 5 p.m."
- Scene "Entrance Hall"
  - CUT 3 — DIALOGUE "My shoes are damp" / no ACTION

The scene titles are attached to the first CUT of each scene (CUT 1 and CUT 3). The synopsis directly under the h1 isn't imported.

## After importing

Each CUT comes with an empty PSD (`c001.psd`, `c002.psd`, and so on) prepared automatically. Double-click PICTURE to open it in your external paint software and start drawing. The CUT durations start with placeholder values, so use the stopwatch (T tool) or edit TIME directly to bring them in line with the real durations.

Since you start out with the dialogue and action already in place, it should be easier to focus on the artwork.

## Things to keep in mind

- Besides `.md`, the `.txt` and `.markdown` extensions are accepted, but the contents are interpreted as Markdown.
- A `Name:` or `Name "` written on a line becomes DIALOGUE. A line within the action that happens to fall into this form may be picked up as dialogue.
- Even with unexpected formatting, the import itself won't stop. When the result isn't what you intended, take another look at the placement of headings and `---`, and at how the dialogue is written.

The full list of shortcuts is collected on the [Shortcuts](#/shortcuts) page.
