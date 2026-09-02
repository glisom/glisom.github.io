---
title: Browser Control
slug: browser-control
canonicalPath: /skill-library/browser-control/
summary: A browser skill for inspecting pages, navigating interfaces, taking screenshots, and testing local sites.
draft: false
hasDetailPage: true
featured: false
displayOrder: 2
tags: [browser, testing, automation]
ownership: used
status: In use
category: Browser work
trigger: The task depends on visible or interactive browser state.
inputs:
  - A page, route, or browser task
  - A clear interaction or inspection goal
outputs:
  - Navigated or inspected page state
  - Screenshots and local web test evidence when needed
guardrails:
  - Use a purpose-built connector for semantic work when one fits
  - Never inspect credentials, cookies, or session stores
source: OpenAI bundled Browser skill
sourceAuthor: OpenAI
reviewedAt: '2026-09-02'
links: []
actionState: Kept in my toolkit.
relationships: []
facts:
  - { label: 'Trigger', value: 'A task depends on browser state' }
  - {
      label: 'Reach',
      value: 'Navigation, interaction, inspection, and screenshots',
    }
fieldNotes:
  - key: trigger
    heading: When I reach for it
    body:
      - I use browser control when the visible page, an interactive flow, or a local web build has to be inspected instead of inferred.
  - key: inputs-and-outputs
    heading: What goes in and comes out
    body:
      - A concrete page and goal go in, then the useful output is observed state, completed interaction, or visual evidence from the real interface.
  - key: guardrails
    heading: The useful constraint
    body:
      - Browser state stays scoped to the task, and semantic work moves to a more direct connector or API when that is the better surface.
---
