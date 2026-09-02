---
title: "Vampire: The Hard Part Isn't Keeping the Mac Awake"
slug: vampire
canonicalPath: /2026/09/01/vampire.html
summary: A macOS menu bar app for one pmset flag, where almost all the engineering went into making sure the flag gets turned back off.
draft: false
hasDetailPage: true
featured: false
tags:
  - macos
  - swift
  - appkit
  - security
  - open source
links: []
relationships:
  - label: Earlier Mac toolkit
    collection: blog
    id: mac_apps
  - label: Another Swift project
    collection: blog
    id: healthql-sql-for-healthkit
  - label: Another app revival
    collection: blog
    id: listwithme-returns
publishedAt: "2026-09-01"
kind: Post
comments: true
preservedHeadingIds:
  - the-two-ways-i-kept-failing
  - the-feature-is-the-toggle-the-product-is-the-undo
  - write-the-intent-before-you-change-the-world
  - never-show-a-checkmark-you-cant-defend
  - the-privileged-part-stays-boring
  - small-things-i-liked
  - what-it-isnt
  - try-it
numberHeadings: false
originalTimestamp: "2026-09-01T18:00:00.000Z"
---
I close my MacBook a lot while it's still doing something. Long build, big download, whatever. Lid down, walk away. macOS sleeps on lid close, and the fix is one command:

```bash
sudo pmset -a disablesleep 1
```

That's the whole feature. I've been typing it for years.

So I built [Vampire](https://github.com/glisom/vampire), a menu bar app that runs it, and then spent basically all of the effort on the other command.

## The two ways I kept failing {#the-two-ways-i-kept-failing}

The first is just typing it. Works instantly, and nothing tracks it. Then I forget, because the machine looks completely normal, and three days later I close the lid, drop the laptop in a bag, and now it's a space heater with a zipper. The setting is global, sticky, and survives reboots. Nothing on screen tells you it's on.

The second is wrapping it. An alias, a Shortcut, an AppleScript with a privilege prompt. Now I get an admin password dialog every single time I want to flip a boolean, which is enough friction that I go right back to the terminal.

Worth saying since I checked first: Caffeine, Amphetamine, and Lungo don't do this. They take I/O Kit power assertions, which stop idle sleep and display sleep. Lid close is a separate mechanism, and `caffeinate` doesn't touch it either. Lungo is great at what it actually does, and Vampire isn't trying to replace it.

## The feature is the toggle, the product is the undo {#the-feature-is-the-toggle-the-product-is-the-undo}

Once you decide an app is going to hold this setting for you, the real question is what happens when the app isn't there anymore. Every one of those paths has to land back at `disablesleep 0`.

| What happened | Who restores Off | How |
|---|---|---|
| Normal quit | The app | Requests Off, waits for the helper to acknowledge, exits only then |
| Crash or Force Quit | The helper | XPC invalidation fires, and if the marker exists it restores Off |
| Helper crash | The helper | Every helper launch normalizes to Off before the listener accepts a connection |
| Mac restart | The helper | Same startup path, run by launchd |
| Restore fails | Nobody, yet | The marker stays, state stays Error, and recovery retries on every future start |

That last row is the one I care about most. The tempting move when a restore fails is to drop the marker anyway and show Off, because error states are ugly. But then the app is asserting something about your hardware that isn't true. Vampire never claims Off while recovery is unresolved. It would rather show you a warning triangle it can actually back up.

## Write the intent before you change the world {#write-the-intent-before-you-change-the-world}

The recovery marker is a root-owned plist at `/Library/Application Support/Insomnia/active.plist`, and the ordering around it is the load-bearing part:

- **On:** create the marker, *then* run pmset.
- **Off:** run pmset, *then* remove the marker.

Both directions record the risky state first. If you flip the setting and crash before writing anything down, nothing knows there's something to undo, and the next boot leaves you with a laptop that quietly can't sleep. Erring toward a stale marker is cheap, since a stale marker just means the next startup runs a `disablesleep 0` that was already 0. Erring the other way means a silently broken machine.

## Never show a checkmark you can't defend {#never-show-a-checkmark-you-cant-defend}

pmset exiting 0 doesn't mean the setting took. So the helper writes, then reads back `pmset -g custom` and requires every reported power profile to equal what it asked for. Disagreement between profiles is a failure, not a tiebreaker.

`disablesleep` is undocumented, though, and macOS sometimes just omits the key. In that case the successful write is accepted only on hardware that should support it, and the release checklist covers the rest with a physical lid close.

The menu item sits downstream of all of that. Clicking it doesn't check the box. The box gets checked when the helper says the change happened and verification passed.

## The privileged part stays boring {#the-privileged-part-stays-boring}

The helper runs as root, so the interesting work is in how little it's allowed to do.

It executes exactly three commands, all with fixed arguments, none of which come from the caller:

```text
/usr/bin/pmset -a disablesleep 1
/usr/bin/pmset -a disablesleep 0
/usr/bin/pmset -g custom
```

There's no shell anywhere in that path (`Process` straight to the executable URL, never `/bin/sh`), and the XPC interface has no generic execute method to abuse. It exposes three operations: status, on, off.

Before the listener activates, the helper reads its own Team ID out of the Security framework and builds a code signing requirement from that verified runtime identity, then hands it to `setConnectionCodeSigningRequirement`. A caller has to be bundle ID `co.groundwork-ai.insomnia`, signed by the same team. macOS rejects everything else before my delegate ever runs, which is my favorite kind of security code, the kind you don't write.

And because "the helper must never invoke a shell" is a sentence in a doc, and sentences don't fail builds, CI greps for it:

```bash
rg -n '/bin/(sh|bash|zsh)|system\(|popen\(' InsomniaHelper/Sources
```

A hit fails the build. The same script fails on `URLSession`, `Sparkle`, `Telemetry`, or `Analytics` in runtime source, which is how "no network, no updater, no telemetry" stays true instead of staying aspirational.

## Small things I liked {#small-things-i-liked}

**Hardware support without a whitelist.** Model whitelists rot. Vampire supports anything whose model identifier starts with `MacBook`, plus anything starting with `Mac` where I/O Kit reports an internal battery. Covers old and new naming, excludes desktops, and doesn't get fooled by a UPS.

**The repo says vampire, the code says Insomnia.** Bundle ID, helper label, Mach service, and recovery path all kept their original names on purpose. Renaming the bundle ID would invalidate the helper approval the user already granted, and the signed XPC contract with it. A rename there is a user-visible change, not a cosmetic one.

**A target whose job is to fail.** `InsomniaWrongIdentifierClient` is a binary whose entire source is `exit(EXIT_SUCCESS)`. It exists so an integration test can point the real signing requirement at a wrong-team binary and assert it gets rejected.

**76 tests, and about as many lines of test as source** (1,547 to 1,549, which I promise wasn't on purpose). They all use a fake command runner and a temporary marker store, so `scripts/ci.sh` never touches the real power settings of the machine running it. Anything involving real pmset, real registration, or a real lid close is a checklist item with an explicit ask, and it always restores afterward.

## What it isn't {#what-it-isnt}

Vampire changes lid-close sleep only. It doesn't prevent idle sleep, display sleep, or screen lock. No timers, schedules, shortcuts, or automatic activation. No network, analytics, updater, Dock icon, or window. MacBooks with a built-in lid, macOS 13 Ventura or newer.

The honest limitation: verification leans on an undocumented pmset key. When macOS reports it, Vampire is strict about it. When macOS doesn't, the best it can do is trust exit status on hardware that should support the setting. That gap is a big part of why it never enables itself at login, and why quitting always restores.

## Try it {#try-it}

Grab `Vampire.dmg` from [Releases](https://github.com/glisom/vampire/releases/latest) and check it:

```bash
shasum -a 256 -c Vampire.dmg.sha256
```

Drag it to Applications, launch it, approve the helper once. After that, On and Off never ask for a password again.

Building from source needs Xcode 26 and XcodeGen:

```bash
xcodegen generate
scripts/ci.sh
```

Signed, notarized, MIT, and no runtime dependencies outside Apple's own frameworks. Code's [on GitHub](https://github.com/glisom/vampire). If it saves your laptop from cooking in a backpack even once, that's the whole return on investment!
