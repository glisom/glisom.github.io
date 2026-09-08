---
title: skill-thief
slug: skill-thief
canonicalPath: /skills/skill-thief/
updatedAt: '2026-09-07'
draft: false
hasDetailPage: false
featured: false
displayOrder: 3
ownership: made
links:
  - label: View on GitHub
    href: https://github.com/glisom/skill-thief
    kind: primary
relationships:
  - collection: blog
    id: skill-thief
    label: Why I built it
summary: Evaluates ideas from other agent setups and decides what belongs in mine.
tags:
  - agents
  - skills
  - claude-code
  - open-source
status: Public
visibility: public
supportedTools:
  - Claude Code
  - Other skill-compatible agents
trigger: I want to evaluate a skills repo, plugin, or talk against my existing setup.
inputs:
  - An external source
  - A project with existing agent instructions
outputs:
  - Ranked findings and recorded decisions
  - Approved changes to agent configuration
facts:
  - label: Format
    value: Skill and Claude Code plugin
  - label: Source
    value: Public GitHub repository
fieldNotes:
  - key: when-to-use
    heading: When to use it
    body:
      - When another agent setup has ideas worth considering and I want to work
        out which ones fit.
  - key: how-it-works
    heading: How it works
    body:
      - It inventories the current setup, reads a specific version of the
        source, and checks for ideas already covered. It proposes changes
        together before applying them.
  - key: design-decisions
    heading: Why I made it
    body:
      - I wanted to keep the useful ideas and the reasoning behind each
        decision, including why an idea was passed over.
  - key: use-or-installation
    heading: Get the skill
    body:
      - The GitHub README covers installation as a Claude Code plugin or copying
        the skill into another compatible agent.
homepageSlot: authored-skills
homepageOrder: 3
---
