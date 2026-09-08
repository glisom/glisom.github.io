---
title: HealthQL
slug: healthql
canonicalPath: /projects/healthql/
summary: An open source library for querying Apple HealthKit with familiar SQL syntax.
draft: false
hasDetailPage: false
featured: false
displayOrder: 3
tags: [healthkit, swift, react-native, open-source]
ownership: made
status: Open source
platform: Swift and React Native on iOS
compatibility: Swift Package Manager, CocoaPods, React Native, and Expo
reviewedAt: '2026-09-02'
links:
  - {
      label: 'View on GitHub',
      href: 'https://github.com/glisom/HealthQL',
      kind: 'primary',
    }
  - {
      label: 'Read the documentation',
      href: 'https://glisom.github.io/HealthQL',
      kind: 'secondary',
    }
relationships:
  - {
      collection: blog,
      id: healthql-sql-for-healthkit,
      label: 'Swift launch post',
    }
  - {
      collection: blog,
      id: healthql-react-native,
      label: 'React Native release',
    }
facts:
  - { label: 'Interface', value: 'SQL and a Swift DSL' }
  - { label: 'Platforms', value: 'Swift, React Native, and Expo on iOS' }
  - { label: 'Data', value: 'Quantities, categories, workouts, and sleep' }
fieldNotes:
  - key: why-it-exists
    heading: Why I made it
    body:
      - HealthKit is powerful, but its type-specific queries and result handling add a lot of ceremony to a simple question.
  - key: what-it-does
    heading: What it does
    body:
      - HealthQL turns SQL or a type-safe Swift DSL into HealthKit queries, then handles permissions, setup, and result formatting.
  - key: how-it-was-built
    heading: How it was built
    body:
      - The Swift and SQL interfaces compile to the same intermediate representation, and the React Native package wraps the native implementation.
  - key: current-state
    heading: Current state
    body:
      - It supports Swift Package Manager, CocoaPods, React Native, and Expo, with iOS as the current platform boundary.
---
