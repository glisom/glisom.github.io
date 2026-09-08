---
title: Hermes iOS
slug: hermes-ios
canonicalPath: /projects/hermes-ios/
summary: An iPhone app for chatting with Hermes Agent and managing its sessions, jobs, and skills.
updatedAt: '2026-09-07'
draft: false
hasDetailPage: false
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
      - I wanted to check on Hermes Agent and keep a conversation going from my phone.
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
      - The source is public under the MIT license. It connects to an existing Hermes Agent gateway over Tailscale.
---
