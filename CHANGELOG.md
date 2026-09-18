# Changelog

All notable changes to this skill are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Installed copies are updated with `npx skills update aiwaysmeme`.

## [0.1.0] - 2026-09-18

### Added

- Meme mode: `/aiwaysmeme:on` makes the assistant answer with a meme rendered in the terminal instead of prose, `/aiwaysmeme:off` puts it back. The meme is the answer, not decoration — someone reading only the meme gets the conclusion.
- A catalogue of 33 templates, each documented with the meaning it asserts, because a template used against its meaning is just a picture. Every aspect ratio was measured against memegen rather than guessed: an unknown id comes back as a square placeholder that renders distorted.
- Two render tiers, chosen automatically. A terminal that speaks the iTerm2 or kitty graphics protocol — Warp, iTerm2, WezTerm, kitty, Ghostty — is handed the PNG itself, with captions of any length. Everything else gets truecolor half blocks, with short captions rasterised into the image and long ones printed as terminal text beside it.
- A PNG decoder built on `node:zlib`, so the package has no dependencies at all: no npm packages, no external binaries, no API keys, no accounts. Resizing happens on memegen's side, which is what removed the last piece that only worked on macOS.
- Terminal discovery by walking up the process tree. An AI client spawns its plugins without a controlling terminal, but `/dev/ttysNNN` is writable by path, so nothing has to be configured and the frame never travels back through the model.
- Claude Code, pi and opencode all read the same two command files and the same skill, so a change is one edit and no host can drift away from another.
- Per-turn reinjection of the rule where the host allows it — `before_agent_start` in pi, `experimental.chat.system.transform` in opencode — because a command is a user message whose weight fades as the conversation grows.

### Known limitations

- Claude Code has to run with `"tui": "default"`. Its full-screen mode repaints the whole viewport from its own model of the screen and paints over anything written to the terminal device.
- opencode installs the plugin from npm, so it needs this release to be published before its one-line configuration works.
