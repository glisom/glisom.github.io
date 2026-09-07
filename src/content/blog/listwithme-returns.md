---
title: Bringing ListWithMe Back to Life
slug: listwithme-returns
canonicalPath: /2026/02/24/listwithme-returns.html
summary: After years off the App Store, I've completely rebuilt ListWithMe from the ground up with SwiftUI and modern iOS features.
draft: false
hasDetailPage: true
featured: true
homepageSlot: featured-writing
tags:
  - ios
  - imessages
  - xcode
  - swift
  - swiftui
links: []
relationships:
  - label: Built as
    collection: projects
    id: listwithme
  - label: Earlier chapter
    collection: blog
    id: listwithme
publishedAt: "2026-02-24"
kind: Build log
comments: true
preservedHeadingIds:
  - a-complete-rebuild
  - the-technical-side
  - why-imessage-apps-still-matter
  - whats-next
numberHeadings: true
titleAccent: ListWithMe
featuredArt:
  src: evidence/listwithme-hand.png
  alt: A fine blue halftone drawing of a hand holding a pen
  decorative: false
relatedProject: listwithme
---
Back in 2019, I built [ListWithMe](/listwithme/)—a simple iMessage app for creating shared shopping lists. My wife and I used it constantly for grocery runs and weekend errands. It was nothing fancy, but it solved a real problem: quickly creating a list that both of us could see and edit in real-time, right inside our conversation.

Then life happened. The app sat untouched as iOS evolved, and eventually Apple removed it from the App Store. I always meant to update it, but between work and other projects, it kept getting pushed to "someday."

Well, someday finally arrived.

## A Complete Rebuild {#a-complete-rebuild}

Rather than patch the old UIKit codebase, I decided to rebuild ListWithMe from scratch using SwiftUI. The original app was functional but minimal—just lists and items. The new version keeps that simplicity while adding features I've wanted for years:

**Smart Input** — Type "3 apples" or "milk x2" and the app automatically parses the quantity. It sounds small, but it makes adding items so much faster.

**Priorities & Due Dates** — Not everything on a shopping list is equal. Now you can mark items as high priority or set a due date for time-sensitive errands.

**Categories** — Group items by aisle or type. When you're navigating a store, having items organized by Produce, Dairy, and Frozen makes the trip faster.

**Activity Feed** — See who added or completed items. When you're shopping together but apart, it's helpful to know what your partner just grabbed.

**Batch Actions** — Select multiple items to complete or delete at once. Clear all completed items with a single tap.

**Search & Sort** — Find items quickly in long lists. Sort by name, category, priority, due date, or drag to reorder manually.

## The Technical Side {#the-technical-side}

The rebuild gave me a chance to work with some iOS technologies I hadn't used in personal projects:

- **SwiftUI** with the new `@Observable` macro (iOS 17+)
- **Core Data** with CloudKit sync for seamless multi-device support
- **Modern Swift** patterns and concurrency

The codebase is [open source on GitHub](https://github.com/glisom/ListWithMe) if you want to poke around. It's a good example of a relatively simple but complete SwiftUI app with persistence.

## Why iMessage Apps Still Matter {#why-imessage-apps-still-matter}

When I first released ListWithMe, the biggest complaint was discoverability. Users would download it, then struggle to find where it went—because iMessage apps don't appear on your home screen. That's still true today, and it's still the biggest friction point.

But I think there's something valuable about apps that live inside your conversations. You don't need to context-switch. You don't need to share links or coordinate which app to use. If you're already texting someone, the list is right there.

For my wife and me, it's become invisible infrastructure. We don't think about it—we just have a shared list that updates as we shop.

## What's Next {#whats-next}

ListWithMe 2.0 is available now on the [App Store](https://apps.apple.com/us/app/listwithme/id1224284271). I'm planning to keep iterating based on feedback. A few things I'm considering:

- Recurring lists (weekly grocery templates)
- Siri integration
- Widgets for quick access

If you try it out, I'd love to hear what you think. You can find me on [GitHub](https://github.com/glisom).

Here's to shared lists and fewer forgotten items.
