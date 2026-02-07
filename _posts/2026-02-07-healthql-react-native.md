---
layout: post
title: "HealthQL Now Supports React Native"
description: "2min read time"
date: 2026-02-07 20:00:00 +0000
excerpt: "HealthQL v1.1.0 brings full React Native and Expo support—query Apple HealthKit using SQL from your JavaScript apps..."
tags:
  - "react native"
  - "expo"
  - "healthkit"
  - "open source"
  - "typescript"
comments: true
---

HealthQL v1.1.0 adds full React Native and Expo support. You can now query Apple HealthKit using the same SQL syntax from JavaScript/TypeScript apps.

[GitHub](https://github.com/glisom/HealthQL) | [Documentation](https://glisom.github.io/HealthQL) | [npm](https://www.npmjs.com/package/react-native-healthql)

### Quick Example

```typescript
import { HealthQL } from 'react-native-healthql';

// Request authorization
await HealthQL.requestAuthorization({
  read: ['heart_rate', 'steps', 'sleep_analysis'],
});

// Query with SQL
const results = await HealthQL.query(`
  SELECT avg(value) FROM heart_rate
  WHERE date > today() - 7d
  GROUP BY day
`);
```

Same SQL syntax as the Swift version—the React Native package wraps the native Swift implementation, so you get real HealthKit queries, not mock data.

### Installation

```bash
npm install react-native-healthql
```

Add the Expo config plugin to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      ["react-native-healthql", {
        "healthShareUsageDescription": "Read health data to display insights"
      }]
    ]
  }
}
```

Then rebuild:

```bash
npx expo prebuild --clean
npx expo run:ios
```

### What's Included

- Full TypeScript types
- All 18 quantity types (heart rate, steps, calories, etc.)
- Category types (sleep analysis, headache, fatigue)
- Workouts and sleep sessions
- Schema introspection for building dynamic UIs
- Structured error handling with suggestions

### Also New: CocoaPods Support

The Swift library is now available via CocoaPods in addition to SPM:

```ruby
pod 'HealthQL', '~> 1.1.0'
```

### Platform Support

iOS only for now. Android throws a clear `PLATFORM_NOT_SUPPORTED` error—Health Connect support is on the roadmap.

Check the [React Native docs](https://glisom.github.io/HealthQL/#/react-native) for the full API reference.
