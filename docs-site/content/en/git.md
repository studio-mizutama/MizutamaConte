# Git integration

The desktop version can version-control your project with git. You can record the current state at any moment, then later roll back to an earlier state or trace the history of your changes. The Web version doesn't have this feature.

Auto-save is always running, and your edits are written to the files as you go. Git integration sits on top of that, as a way to mark off "the state up to here" and keep it.

## Getting started

With a project open, press "Start version control" in the git panel, and that project folder comes under git management. When this happens, the following are done for you automatically.

- Initialize the folder as a git repository
- Write out `.gitignore` and `.gitattributes`
- Enable git-lfs for this repository
- Make the first commit

If you open a project that's already managed with git, you can just pick up where you left off.

## Leaving a snapshot

When there are changes, pressing "Create snapshot" records the current state as a commit. You can write a message to go with it, or leave it blank and it'll be recorded under a name based on the date and time.

When there are no changes, the button can't be pressed. You can also check when you last recorded in the panel.

## What gets recorded and what is excluded

What gets recorded (tracked) is the contents of the storyboard itself.

- `.json`: the project's structure and settings
- `.psd`: the picture for each cut (managed with git-lfs, as described below)

On the other hand, the following are excluded via `.gitignore`.

```
.DS_Store
*.pdf
*.mp4
*.mov
.trash/
```

PDFs and videos (MP4 / MOV) are the result of exporting from the storyboard. Since they can be regenerated from the source data any number of times, they aren't included in the history. `.trash/` is where things deleted inside the app are kept, and `.DS_Store` is a housekeeping file that macOS creates, so neither is recorded.

## Large PSDs are handled with git-lfs

Since `.psd` files are images, they tend to be large. Putting them into git as-is would make the repository swell quickly and the history heavy to work with. So `.psd` files are managed with [git-lfs](https://git-lfs.com/) (Git Large File Storage).

When you start version control, the following single line is written into `.gitattributes`.

```
*.psd filter=lfs diff=lfs merge=lfs -text
```

With this, only a lightweight pointer goes into the repository itself, while the actual PSD data is stored on the lfs side. You don't need to be aware of git-lfs in everyday use.

## What you need

To use git integration, both `git` and `git-lfs` need to be installed. If either one can't be found, the git panel shows a note to that effect along with guidance on installing it. Install them and restart the app, and the feature becomes available.
