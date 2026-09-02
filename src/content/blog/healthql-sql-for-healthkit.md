---
title: "HealthQL: SQL for Apple HealthKit"
slug: healthql-sql-for-healthkit
canonicalPath: /2026/02/01/healthql-sql-for-healthkit.html
summary: I built a Swift library that lets you query HealthKit data using SQL syntax...
draft: false
hasDetailPage: true
featured: false
tags:
  - swift
  - iOS development
  - healthkit
  - open source
links: []
relationships: []
publishedAt: "2026-02-01"
kind: Post
comments: true
preservedHeadingIds:
  - quick-example
  - swift-dsl
  - supported-data
  - installation
numberHeadings: false
originalTimestamp: "2026-02-01T20:00:00.000Z"
---
I built a Swift library that lets you query HealthKit data using SQL syntax. Working with HealthKit directly involves a lot of boilerplate—callback-based APIs, type-specific query objects, manual result transformation. HealthQL simplifies this into something more familiar.

[GitHub](https://github.com/glisom/HealthQL) | [Documentation](https://glisom.github.io/HealthQL)

### Quick Example {#quick-example}

```sql
SELECT avg(value), min(value), max(value)
FROM heart_rate
WHERE date > today() - 7d
GROUP BY day
```

This returns daily heart rate stats for the past week. The library handles all the HealthKit query setup, permissions, and result formatting.

### Swift DSL {#swift-dsl}

If you prefer type-safety, there's also a Swift DSL:

```swift
let result = try await Health
    .select(.heartRate, aggregates: [.avg, .min, .max])
    .where(.date, .greaterThan, .date(.daysAgo(7)))
    .groupBy(.day)
    .execute()
```

Both approaches compile down to the same intermediate representation before hitting HealthKit.

### Supported Data {#supported-data}

The library covers most common health types—steps, heart rate, calories, workouts, sleep sessions, and more. It supports aggregations, grouping by time periods, and the standard comparison operators you'd expect.

### Installation {#installation}

Add it via Swift Package Manager:

```
https://github.com/glisom/HealthQL.git
```

The [documentation site](https://glisom.github.io/HealthQL) has the full syntax reference and more examples. Feel free to open an issue if you run into any problems or have suggestions.
