# Direct battle mode

The launcher writes an isolated `bossroom.ini` next to its prepared save. Modified native initialization loads that save for party attributes, bypasses the campaign menu, and starts the selected native encounter. Chapters 2–5 use the game's battle test room; chapter 1 retains its save room. Restart rewrites the baseline save and immediately launches again.

Original game resources are pinned to ByAlvaro19/deltarune commit `125c727d07732276d3c6677227ddfa07d5221c72`.

The two edited GameMaker events for each chapter are in `mods/chapterN`. They were compiled with UndertaleModTool CLI 0.9.2.0. To regenerate, join upstream `game.unx.partN` files numerically (chapter 1 already has a complete game.unx), then run the CLI `replace` command with that chapter's two event files. Pass the original and compiled data files to:

    python3 scripts/package_native_patch.py original.unx modified.unx dist/chapterN/battle.patch.gz

The resulting copy/insert patch includes SHA-256 hashes of both inputs. The browser checks both hashes and never falls back to an unmodified campaign silently. `scripts/check-native.cjs DIRECTORY` verifies the actual browser decoder against original `chN.unx` and compiled `patchedN.unx` files for all five chapters, including rejection of a changed upstream game.

Validation: all five native modifications compiled; patch reconstruction matched each compiled file in Python and in the browser's JavaScript decoder; inline JavaScript syntax and battle configuration were checked. The remote browser has no usable WebGL context, so actual combat behavior and boss-specific scene dependencies remain unverified. The direct mode is labeled experimental for that reason.

## Reported regression fixes

Public checkpoint files included modified attributes (for example, Tenna's Kris had 1600 HP). Initialization now snapshots canonical chapter stats before loading the save, then restores HP, max HP, AT, DF, MAG and guts and resets invulnerability. The checkpoint still provides inventory and story flags.

The native entry prefetches the exact texture group names embedded in the port and waits for texture readiness before starting the encounter. The battle test arena explicitly clears its background to black via `scripts/arena-background.csx`, and the debug chase enemy is removed. Apply that room edit after compiling the GML and before packaging its patch. Actual resolution of the reported magenta frame remains unverified in gameplay.

Input now sends one bubbling event to the runner canvas with `key`, `code`, `keyCode`, `which`, and paired keydown/keyup events. Touch buttons use pointer capture and cancel handling. A temporary iframe fixture confirmed Z from the onscreen control and X from the parent page keyboard reach the child with correct codes and key release; the fixture was removed before publishing. Coarse-pointer devices enable controls by default, and the game toolbar can always toggle controls.

## Bounds, proportions and Flowery audio

The native stat snapshot/restore bounds are now the minimum of the actual lengths of hp/maxhp/at/df/mag/guts, calculated before and again after loading. This avoids the reported chapter 1 guts[4] access (that array has four entries). All five chapters use the same bounded logic.

Removed the parent's repeated canvas width=100vw/height=100vh override and removed hardcoded drawing-buffer resolution assignments. Each chapter now delegates CSS sizing to game-layout.js using the logical dimensions reported by the runner (640x480 fallback). The body centers the canvas and letterboxes unused space; toolbar height and touch-control scale stay within viewport bounds. Layout contract checks cover 14 combinations, and the browser fixture measured 360x270 in a 360x592 portrait viewport, 416x312 in a 640x312 landscape viewport, and about 866.66x650 in a 1000x650 desktop viewport. Fixtures were removed before publishing.

Flowery now uses an embedded PCM16 stereo 48kHz track through the native audio system, preserving the music playback clock used by lyrics and effects. Decode the upstream OGG with ffmpeg, set BOSSROOM_FLOWERY_WAV, apply scripts/embed-flowery-audio.csx to the chapter 5 build, and compile both Flowery Create and the time Step event before packaging. Unchanged AUDO records are copied from the source; compressed patches exceeding 20MiB are split and verified with a manifest SHA-256. The input bridge resumes the native AudioContext from keyboard or pointer gestures and offers ATIVAR SOM if audio remains suspended. Browser fixture verified the full 192.02s stereo track decodes and the parent button changes the child context from suspended to running. Fixture removed before publication.

Chapter 1's room_battletest is an empty 2x2 placeholder, so direct battle was stuck waiting for obj_mainchara. Initialization now enters room_cc_joker; scripts/chapter1-arena.csx removes story triggers, doors and markers from both the room and instance layers, preserving the player, dark controller and Jevil background. The native 640x480 view initializes the party. King removes the Jevil background before starting. Apply the script after compiling the chapter 1 initializer and time events. Native checks verify dimensions, required instances, layer references and cleared background. scripts/check-audio-arena.cjs verifies production download/decompression/hash validation and exact reconstruction for chapters 1 and 5. Full combat and audible in-game playback remain unverified because the remote browser does not provide WebGL.

## Pixel menu redesign

The selector now uses the upstream Determination font and exported native boss sprites, a keyboard/touch carousel, themed pixel frames, a red soul cursor, a dialogue box and LUTAR action. Chapter filtering, direct encounter launch and restart still use the same battle preparation. Options expose existing touch controls and real menu-sound volume; unsupported modifiers or scores are not represented. Verified arrow-key selection, chapter 5 filtering and options dialog. A 360px-wide browser fixture had 360px document scroll width, loaded sprite artwork, and a 328px-wide fight button. Temporary fixture removed before publication.

## Experimental character party co-op

`mods/coop` contains the GameMaker changes for independent souls, owner-specific inputs, native hit routing and combat telemetry. `scripts/apply-party-coop.csx` compiles those edits on top of each chapter's already patched direct-battle baseline. The checked-in co-op overlays are enabled only for chapters 1–3 in `dist/party-native.json`; chapters 4 and 5 remain solo. Chapter 1 is the only chapter covered by the current native gameplay QA. Chapters 2–3 overlays compile, but their boss gameplay and all three chapters' full encounter sets still need validation.

To rebuild, first prepare the same chapter baseline used by direct battle above, then run UndertaleModTool CLI 0.9.2.0 with `BOSSROOM_COOP_ROOT` set to this repository and `scripts/apply-party-coop.csx`. Package the baseline and result with `scripts/package_native_patch.py` into `dist/chapterN/coop.patch.gz`. For a local Chapter 1 QA build only, set `BOSSROOM_COOP_QA=1` before compiling. QA hooks create a controlled arena and bullet to test real GameMaker collisions and damage; never publish that QA patch. See `COOP.md` for the browser and native test commands and current coverage.
