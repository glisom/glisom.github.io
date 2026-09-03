---
title: ListWithMe
slug: listwithme
canonicalPath: /listwithme/
summary: Shared lists inside iMessage, rebuilt because my wife and I wanted ours back.
draft: false
hasDetailPage: true
featured: true
displayOrder: 2
homepageSlot: featured-project-secondary
tags: [ios, imessage, swiftui]
ownership: made
status: Available now
platform: iMessage app for iOS
compatibility: iOS 17+
reviewedAt: '2026-09-02'
links:
  - {
      label: 'Download on the App Store',
      href: 'https://apps.apple.com/us/app/listwithme/id1224284271',
      kind: 'primary',
    }
  - {
      label: 'View source',
      href: 'https://github.com/glisom/ListWithMe',
      kind: 'source',
    }
  - { label: 'Support', href: '/listwithme/support/', kind: 'support' }
  - { label: 'Privacy', href: '/listwithme/privacy/', kind: 'privacy' }
relationships:
  - { collection: blog, id: listwithme-returns, label: 'Wrote about' }
  - { collection: blog, id: listwithme, label: 'Earlier chapter' }
facts:
  - { label: 'Status', value: 'Available now' }
  - { label: 'Home', value: 'Inside Messages' }
  - { label: 'Compatibility', value: 'iOS 17+' }
  - { label: 'Built with', value: 'SwiftUI, Core Data, and CloudKit' }
  - { label: 'Privacy', value: 'No personal data or analytics collected' }
screenshots:
  - {
      src: 'projects/listwithme/screenshots/01-new-list.png',
      alt: 'ListWithMe New List sheet with a list-name field and the iPhone keyboard open.',
      decorative: false,
      device: 'iPhone',
      label: 'Create a list',
      order: 1,
    }
  - {
      src: 'projects/listwithme/screenshots/02-your-lists.png',
      alt: 'ListWithMe Your Lists screen with a Groceries card summarizing Eggs, Apples, and Bananas.',
      decorative: false,
      device: 'iPhone',
      label: 'Your lists',
      order: 2,
    }
  - {
      src: 'projects/listwithme/screenshots/03-groceries.png',
      alt: 'ListWithMe Groceries checklist with completed Bananas and a Send List button.',
      decorative: false,
      device: 'iPhone',
      label: 'Shared groceries',
      order: 3,
    }
  - {
      src: 'projects/listwithme/screenshots/04-activity.png',
      alt: 'ListWithMe Activity sheet showing items added and completed today.',
      decorative: false,
      device: 'iPhone',
      label: 'Recent activity',
      order: 4,
    }
fieldNotes:
  - key: why-it-exists
    heading: Why I made it
    body:
      - My wife and I wanted a shared list that lived inside the conversation we already used for errands and grocery runs.
  - key: what-it-does
    heading: What it does
    body:
      - It creates and shares editable lists in iMessage, with quantities, categories, priorities, due dates, search, sorting, and batch actions.
  - key: how-it-was-built
    heading: How it was built
    body:
      - I rebuilt the original UIKit app in SwiftUI, with local Core Data storage and CloudKit sync across Apple devices.
  - key: current-state
    heading: Current state
    body:
      - ListWithMe 2.0 is back on the App Store, though its iMessage-only home can still make the app hard to find after download.
---
