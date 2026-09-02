---
title: PDF
slug: pdf
canonicalPath: /skill-library/pdf/
summary: A practical workflow for reading, creating, filling, rendering, and verifying PDF files.
draft: false
hasDetailPage: true
featured: false
displayOrder: 5
tags: [pdf, documents, review]
ownership: used
status: In use
category: PDF work
trigger: A PDF task depends on layout, visual fidelity, or interactive form state.
inputs:
  - A source PDF or content for a new one
  - Expected layout, fields, and output state
outputs:
  - A reviewed PDF
  - Rendered pages and structural checks used for verification
guardrails:
  - Inspect both appearance and logical form state
  - Preserve interactive forms unless a static result is requested
source: OpenAI PDF skill
sourceAuthor: OpenAI
reviewedAt: '2026-09-02'
links: []
actionState: Kept in my toolkit.
relationships: []
facts:
  - { label: 'Reach', value: 'Read, create, fill, render, and verify' }
  - { label: 'QA', value: 'Visual and structural checks' }
fieldNotes:
  - key: trigger
    heading: When I reach for it
    body:
      - I use it when a PDF has to look right on the page, preserve an interactive form, or prove more than a plain text extraction can show.
  - key: inputs-and-outputs
    heading: What goes in and comes out
    body:
      - The source, expected fields, and layout goals produce a PDF that is reopened, inspected structurally, and rendered for a final visual check.
  - key: guardrails
    heading: The useful constraint
    body:
      - A form can look filled while its real field tree is wrong, so visual review and logical field validation have to agree before delivery.
---
