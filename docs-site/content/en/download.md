# Download

Get the latest version from the [GitHub Releases page](https://github.com/studio-mizutama/MizutamaConte/releases). Binaries for Mac / Windows / Linux are added per release. If you don't see the file you need yet, use the **web version** or **build it yourself** (both described below).

## ⚠️ Unsigned — Use at Your Own Risk

> **This app is NOT code-signed or notarized.**
> **Install and run it at your own risk.** Your OS will show security warnings — this is the standard behavior for unsigned apps.
> Only download from the **official repository (studio-mizutama/MizutamaConte)**. Do not use binaries redistributed by third parties.

## First Launch on macOS

Because the app is unsigned, Gatekeeper blocks its first launch. Use one of the methods below.

### Method 1: Open from Finder (recommended)

1. **Right-click (Control-click)** `Mizutama Conte.app`.
2. Choose **"Open"** from the menu.
3. In the dialog that appears, click **"Open"** again.

Once you've launched it this way, you can open it normally by double-clicking from then on.

### Method 2: Remove the quarantine attribute in Terminal

Move the app into your `Applications` folder, then run this command in Terminal:

```sh
xattr -dr com.apple.quarantine "/Applications/Mizutama Conte.app"
```

### Alternatives

- Clone the repository and **build it yourself**.
- Use the **web version** (below), which needs no installation.

## First Launch on Windows

Because the app is unsigned, SmartScreen may show "Windows protected your PC."

1. Click **"More info"** in the dialog.
2. Click **"Run anyway"**.

## Web Version (No Install)

A web version that runs directly in your browser is also available.

- <https://studio-mizutama.github.io/MizutamaConte/>

No download or installation is required; it uses the browser's File System Access API to read and write files.
