---
title: HealthQL Now Supports React Native
slug: healthql-react-native
canonicalPath: /2026/02/07/healthql-react-native.html
summary: HealthQL v1.1.0 brings full React Native and Expo support—query Apple HealthKit using SQL from your JavaScript apps...
draft: false
hasDetailPage: true
featured: false
tags:
  - react native
  - expo
  - healthkit
  - open source
  - typescript
links: []
relationships: []
publishedAt: "2026-02-07"
kind: Post
comments: true
preservedHeadingIds:
  - quick-example
  - installation
  - whats-included
  - also-new-cocoapods-support
  - platform-support
numberHeadings: false
originalTimestamp: "2026-02-07T20:00:00.000Z"
---
HealthQL v1.1.0 adds full React Native and Expo support. You can now query Apple HealthKit using the same SQL syntax from JavaScript/TypeScript apps.

[GitHub](https://github.com/glisom/HealthQL) | [Documentation](https://glisom.github.io/HealthQL) | [npm](https://www.npmjs.com/package/react-native-healthql)

### Quick Example {#quick-example}

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

### Installation {#installation}

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

### What's Included {#whats-included}

- Full TypeScript types
- All 18 quantity types (heart rate, steps, calories, etc.)
- Category types (sleep analysis, headache, fatigue)
- Workouts and sleep sessions
- Schema introspection for building dynamic UIs
- Structured error handling with suggestions

### Also New: CocoaPods Support {#also-new-cocoapods-support}

The Swift library is now available via CocoaPods in addition to SPM:

```ruby
pod 'HealthQL', '~> 1.1.0'
```

### Platform Support {#platform-support}

iOS only for now. Android throws a clear `PLATFORM_NOT_SUPPORTED` error—Health Connect support is on the roadmap.

Check the [React Native docs](https://glisom.github.io/HealthQL/#/react-native) for the full API reference.
