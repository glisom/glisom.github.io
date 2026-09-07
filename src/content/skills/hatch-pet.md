---
title: hatch-pet
slug: hatch-pet
canonicalPath: /skills/hatch-pet/
summary: A private production skill for turning character art or a visual idea into a complete animated Codex pet.
draft: false
hasDetailPage: true
featured: false
displayOrder: 3
homepageSlot: authored-skills
homepageOrder: 3
tags: [animation, sprites, tools]
ownership: made
status: Private
supportedTools: [Image generation, Python, Codex]
visibility: private
trigger: I want to create, repair, validate, or package a Codex-compatible animated pet.
inputs:
  - A character idea, reference image, or existing sprite atlas
outputs:
  - A complete animated pet package
  - Contact sheet and motion review artifacts
reviewedAt: '2026-09-02'
links: []
actionState: Kept in my private toolkit.
relationships: []
facts:
  - { label: 'Format', value: 'Codex v2 animated pet' }
  - { label: 'Review', value: 'Deterministic and visual QA' }
fieldNotes:
  - key: when-to-use
    heading: When I use it
    body:
      - I use it when a character or visual idea needs to become a complete animated pet, or when an existing sprite sheet needs repair.
  - key: how-it-works
    heading: How it works
    body:
      - It keeps one character identity grounded across the animation rows, assembles the atlas deterministically, and packages the reviewed result.
  - key: design-decisions
    heading: The choices behind it
    body:
      - Generation and assembly stay separate, while contact sheets, motion previews, and validation checks make visual drift easier to catch.
---
