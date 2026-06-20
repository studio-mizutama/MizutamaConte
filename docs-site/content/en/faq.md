# Frequently asked questions

A collection of common questions about Mizutama Conte.

## What kind of app is Mizutama Conte?

It's an editor for making and managing animation storyboards. You draw the picture for each cut, add dialogue, duration, and camera work, and pull it all together into a single storyboard.

Set up a pan or a zoom, and you can play the storyboard back as video with that movement intact. A finished storyboard can be exported as a PDF close to the format studios commonly use, or as an MP4 that actually plays. There's a desktop version for Mac / Windows / Linux and a Web version that runs in the browser, and all of your data stays on your own machine.

## How do I get started?

The easiest thing is to open the Web version in your browser and try it. There's nothing to install. For everyday work, we recommend the desktop version, which gives you auto-save and integration with external paint software.

How to get it is on the [Download](#/download) page, and the flow from creating a project to exporting is on the [Usage](#/usage) page.

## Are there any AI features?

No. Mizutama Conte has no AI generation or AI assistance features. Drawing the pictures, working out the structure, and adding the camera work are all done by hand. If the paint software you connect has AI features, you're free to use those. There are no plans to add AI features to Mizutama Conte.

## Is it just a preview app?

No. Mizutama Conte is an editor for making and managing storyboards. It handles laying out the cuts, editing dialogue, duration, and camera work, and exporting to PDF or video.

Playing the storyboard back as video with the camera work intact is one of its strengths, but it's one feature among many — it isn't a preview-only tool.

## Why is there no drawing feature inside the app?

Because the paint software you already use is faster and more comfortable for drawing. Double-click a cut and a real `.psd` opens in your paint software. Draw, save, and it's reloaded automatically.

Adding a basic paint feature would be technically possible, but you'd end up editing in a separate tab or window, so from the standpoint of a seamless experience there isn't much to gain from building paint tools in. Rather than carry a half-baked drawing feature, we think it's better to let you keep using the tools you already know.

## Which paint software is supported?

CLIP STUDIO PAINT, Photoshop, Affinity Photo, GIMP, Krita, and any other software that can open a PSD file and save over it will work.

## Are there feature differences between the Web version and the desktop version?

The core editing features are the same, but a few features are desktop-only.

- Double-clicking a cut to open it in your paint software, and automatically reloading after you save, are desktop-only. In the Web version, you open the local file yourself from Finder or Explorer to draw, and reload it yourself when you're done.
- git integration (version control for your project) is also desktop-only.

The desktop version is more comfortable for everyday work. Use the Web version when you want to try it right away without installing, or when the desktop version won't run on your OS.

## Is it still being developed?

Yes. Development is ongoing. New features and bug fixes happen in the [GitHub repository](https://github.com/studio-mizutama/MizutamaConte), where the change history and releases are also published.


## Is it open source?

The source code is published on GitHub. It isn't, however, open source in the strict sense of the OSI (Open Source Initiative) definition. The license is the Business Source License 1.1 (BSL 1.1).

Anyone can read the source, and for many uses — individuals, doujin work, and so on — it's free. Some uses, such as broadcast, theatrical release, and commercial distribution, require a commercial license. Each version switches to the Apache License 2.0 four years after its release. See [License](https://github.com/studio-mizutama/MizutamaConte/blob/master/LICENSING.md) for details.

## Is it free to use?

It's free for personal work, doujin projects, school assignments, film festival submissions, single-theater screenings, personal online distribution, and the like. For larger commercial use — TV broadcast, nationwide theatrical release, commercial streaming services — we offer a commercial license.

The concrete process is still being put together. If you think you might fall under it, get in touch first. We'll talk it through case by case and can provide a signed build or customizations tailored to your setup.

## Is any data sent to a server?

No. The storyboard data you draw is never sent to an external server. Mizutama Conte runs entirely on your own machine. There's no account to register and no login, and there's no telemetry collecting how you use it.

The desktop version works with local files directly, and the Web version reads and writes data on your own disk through the browser's File System Access API.

## Can I sync to the cloud or collaborate with others?

Mizutama Conte itself has no cloud sync or simultaneous multi-person editing. Your data lives only on your own machine.

When you want to work on the same project across several environments, put the project in a cloud storage folder such as Dropbox, or use the desktop version's git integration.

## Can I turn off auto-save?

No, there's no setting to turn off auto-save. Each time you edit, it's saved to the file.

When you want to keep past states around, we recommend one of two approaches. One is to put the project inside cloud storage such as Dropbox that automatically keeps snapshots (version history). The other is to manage versions with the desktop version's git integration. Either one lets you go back to a given point in time.

## What is git integration?

The desktop version can version-control your project with git. You can start a new project under git management, or place an existing project under git management later. From there, commit whenever you like to record the state at that point. You can roll back to a previous state, or trace the history of your changes.

For the details of what's recorded and what's excluded, and how large PSDs are handled (git-lfs), see the [Git integration](#/git) page.

## Which browsers are supported?

The Web version is intended for use in Chromium-based browsers (Google Chrome, Microsoft Edge, and so on), because saving and exporting depend on the File System Access API and WebCodecs.

In Safari and Firefox these APIs aren't all present, so you can view but can't save or export. For making storyboards, use Chrome or Edge, or the desktop version.

## In the Web version, I can't read a folder directly under the Documents folder

This is a browser security restriction. The File System Access API blocks access to special folders such as Documents, Desktop, and Downloads, and to folders directly under them. It's a browser-side specification, so the app can't change it.

If you place your project folder one level deeper rather than directly under these folders, it can be read. For example, make a working folder inside Documents and put the project further inside that. Using a different drive or any working folder also works.

## Which operating systems are supported?

The desktop version runs on macOS 12 or later, Windows 10 or later, and Linux (Ubuntu 20.04 equivalent or later). On older environments, use the Web version in Chrome or Edge. Details on supported environments are on the [Download](#/download) page.

## What format does it save in?

The pictures are saved as `.psd`, and the structure and settings are saved as `.json`. Both are common formats, so you can open the contents in other tools to check them. Nothing is locked away in a proprietary format.

## Can I export to PDF or video?

Yes. You can export a storyboard sheet PDF (A4) close to the format used in studios, and an MP4 at native resolution and fps. The MP4 comes out with the camera work intact, exactly as you saw it in preview. The export steps are explained on the [Usage](#/usage) page.

## Can I import a script to build a storyboard draft?

Yes. Importing a script written in Markdown is supported. The detailed syntax is explained on the [Script import](#/script-syntax) page.

## Can I import video or audio?

No. There's currently no video or audio import feature. For matching timing against audio, we recommend using the stopwatch feature. We're considering adding this in a future update.

## I found a bug. Where do I send requests?

We accept them in the [GitHub repository's Issues](https://github.com/studio-mizutama/MizutamaConte/issues). It helps if you include steps to reproduce and the OS / browser you're using.

For more involved matters, such as a commercial license, you're also welcome to email the contact on the landing page.
