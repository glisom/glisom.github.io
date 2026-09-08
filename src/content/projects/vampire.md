---
title: Vampire
slug: vampire
canonicalPath: /projects/vampire/
updatedAt: '2026-09-07'
draft: false
hasDetailPage: false
featured: false
displayOrder: 4
ownership: made
links:
  - label: View on GitHub
    href: https://github.com/glisom/vampire
    kind: primary
relationships:
  - collection: blog
    id: vampire
    label: Why I built it
summary: A Mac menu bar app for keeping a MacBook awake with the lid closed.
tags:
  - macos
  - swift
  - open-source
status: Open source
platform: macOS
facts:
  - label: Interface
    value: Menu bar app
  - label: Built with
    value: Swift and AppKit
fieldNotes:
  - key: why-it-exists
    heading: Why I made it
    body:
      - I wanted long builds and downloads to keep going when I closed my MacBook, without leaving sleep disabled after the work was done.
  - key: what-it-does
    heading: What it does
    body:
      - Vampire controls the sleep setting from the menu bar. Its recovery logic is designed to restore normal sleep when the app quits or something goes wrong.
  - key: current-state
    heading: Try it
    body:
      - The source and setup instructions are on GitHub. The build post explains the recovery behavior and its limits.
---
