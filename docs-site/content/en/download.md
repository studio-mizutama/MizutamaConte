# Download

Mizutama Conte comes in two flavors: a desktop build that runs on Electron, and a web build that runs in the browser. Both run entirely on your machine, and the storyboards you draw are never sent to a server. They're free.

The latest version is available from the [GitHub Releases page](https://github.com/studio-mizutama/MizutamaConte/releases). We'll add Mac / Windows / Linux binaries to each release. Only download from the official repository (studio-mizutama/MizutamaConte). Don't use binaries redistributed by third parties.

If you're not sure where to start, open the web version in your browser and try it. There's nothing to install, so you can start right away. For everyday work, go with the desktop version, which gives you autosave and integration with external drawing apps.

## Which one to use

- Just want to try it / don't want to install → web version (a modern Chrome / Edge)
- Daily use / want to round-trip PSD edits in an external drawing app → desktop version (Mac / Windows / Linux)

## Downloading the desktop version

On the [Releases page](https://github.com/studio-mizutama/MizutamaConte/releases), pick the file for your OS.

### macOS

- Download the `.dmg`.
- Open the `.dmg` and drag Mizutama Conte into your Applications folder.

Both Apple Silicon (M1 and later) and Intel are supported. If the file names distinguish between chips, pick the one that matches your Mac. The first launch requires the steps in "About the first launch" below.

### Windows

- Download the installer (`.exe`).
- Run the downloaded `.exe` and follow the on-screen instructions to install.
- A SmartScreen warning appears the first time you run it. See "About the first launch" below.

### Linux

- Download the `AppImage`.
- Make the file executable, then launch it. Either right-click the file → "Properties" → check "Allow executing file as program", or run the following in a terminal.

```sh
chmod +x Mizutama-Conte*.AppImage
```

## Supported environments

- macOS 12 (Monterey) or later
- Windows 10 or later
- Linux: Ubuntu 20.04 equivalent or later

On older systems, the desktop version may fail to launch. In that case, use the web version, which runs in a modern Chrome / Edge.

## About the first launch (unsigned builds)

The desktop builds we currently distribute are not code-signed or notarized. Because of that, the first time you launch one, your OS will warn you that it "can't verify the developer" or similar. The app isn't broken; this happens with any unsigned app. Install and run it at your own risk. Here's how to get it started.

### macOS

When you double-click it, you may see "'Mizutama Conte' is damaged and can't be opened" or "can't be opened because the developer cannot be verified." Either of the following will get it running.

Option 1: Allow it from System Settings (recommended)

1. Double-click Mizutama Conte and confirm the warning appears. Don't move it to the Trash here; just close the dialog for now.
2. Open the Apple menu → "System Settings" → "Privacy & Security."
3. Near the bottom you'll see a message like "'Mizutama Conte' was blocked from use because it is not from an identified developer." Click "Open Anyway" next to it.
4. If another confirmation dialog appears, choose "Open." From then on, a normal double-click will launch it.

Option 2: Remove the quarantine attribute in the terminal

If you get "is damaged and can't be opened" and don't see the message from Option 1, removing the quarantine attribute that gets attached on download will let it launch. Move the app into your Applications folder, then run the following in a terminal.

```sh
xattr -dr com.apple.quarantine "/Applications/Mizutama Conte.app"
```

After running it, open the app again.

### Windows

The first time you run the `.exe`, Microsoft Defender SmartScreen may show a blue screen saying "Windows protected your PC."

1. Click "More info" in the dialog.
2. Press the "Run anyway" button that appears below.

This lets the install (or launch) proceed. It won't show up on later runs.

### Linux

Depending on your distribution, you may be asked to confirm execute permission or trust at launch. As noted above, make the `AppImage` executable before launching it.

## Web version

Just open it in your browser. No installation needed.

- <https://studio-mizutama.github.io/MizutamaConte/>

It reads and writes files through the browser's File System Access API and is intended for use in a modern Chrome / Edge. It's also a good option when the desktop version won't run on an older OS.

## Shortcuts

The full list of keyboard shortcuts is on a separate page.

- Shortcut list: [#/shortcuts](#/shortcuts)
