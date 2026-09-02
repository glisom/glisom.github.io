---
title: goodreads-export
slug: goodreads-export
canonicalPath: /skills/goodreads-export/
summary: A private backup workflow that turns my Goodreads export into durable book records in Obsidian.
draft: false
hasDetailPage: true
featured: false
displayOrder: 2
homepageSlot: authored-skills
homepageOrder: 2
tags: [books, backups, obsidian]
ownership: made
status: Private
supportedTools: [Browser, Python, Obsidian]
visibility: private
trigger: I want to export my Goodreads library, archive the CSV, or refresh the reading records in my vault.
inputs:
  - A fresh Goodreads library export
outputs:
  - An archived CSV snapshot
  - Markdown book records and a current library view
reviewedAt: '2026-09-02'
links: []
actionState: Kept in my private toolkit.
relationships:
  - { collection: app-library, id: obsidian, label: 'Where the library lives' }
facts:
  - { label: 'Source', value: 'Goodreads library export' }
  - { label: 'Home', value: 'Obsidian book records' }
fieldNotes:
  - key: when-to-use
    heading: When I use it
    body:
      - I use it when I want a fresh backup of my Goodreads library and book records I can browse alongside the rest of my notes.
  - key: how-it-works
    heading: How it works
    body:
      - It starts with a new Goodreads CSV, archives that snapshot, then creates or updates one Markdown record for each book in the library.
  - key: design-decisions
    heading: The choices behind it
    body:
      - Fresh exports are required, handwritten notes stay intact, and the output uses plain files so the backup remains useful beyond one service.
---
