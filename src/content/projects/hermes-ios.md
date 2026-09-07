---
title: Hermes iOS
slug: hermes-ios
canonicalPath: /projects/hermes-ios/
summary: My private mobile control plane for the Hermes Agent running on my Mac.
draft: false
hasDetailPage: true
featured: true
displayOrder: 1
homepageSlot: featured-project-primary
tags: [ios, react-native, agents, open-source]
ownership: made
status: Open source
platform: iOS
compatibility: Hermes Agent gateway over Tailscale
license: MIT
reviewedAt: '2026-09-02'
links:
  - {
      label: 'View on GitHub',
      href: 'https://github.com/glisom/hermes-ios',
      kind: 'primary',
    }
relationships:
  - {
      collection: app-library,
      id: hermes-agent,
      label: 'Built for Hermes Agent',
    }
facts:
  - { label: 'Stack', value: 'Expo, React Native, and TypeScript' }
  - { label: 'Connection', value: 'Private Tailscale gateway' }
  - { label: 'License', value: 'MIT' }
fieldNotes:
  - key: why-it-exists
    heading: Why I made it
    body:
      - My agent could keep working on my Mac when I stepped away, but I wanted the cockpit to stay with me on my phone.
  - key: what-it-does
    heading: What it does
    body:
      - Hermes iOS brings streaming chat, sessions, scheduled jobs, skills, gateway health, and usage details into one mobile client.
  - key: how-it-was-built
    heading: How it was built
    body:
      - It is an Expo and React Native app that connects directly to my Hermes gateway over Tailscale, without a hosted middleman.
  - key: current-state
    heading: Current state
    body:
      - The project is public and MIT licensed, with the core chat, session, job, skill, and insight surfaces in place.
---
