---
layout: post
title: "HealthQL: SQL for Apple HealthKit"
description: "2min read time"
date: 2026-02-01 20:00:00 +0000
excerpt: "I built a Swift library that lets you query HealthKit data using SQL syntax..."
tags:
  - "swift"
  - "iOS development"
  - "healthkit"
  - "open source"
comments: true
---

I built a Swift library that lets you query HealthKit data using SQL syntax. Working with HealthKit directly involves a lot of boilerplate—callback-based APIs, type-specific query objects, manual result transformation. HealthQL simplifies this into something more familiar.

[GitHub](https://github.com/glisom/HealthQL) | [Documentation](https://glisom.github.io/HealthQL)

### Quick Example

```sql
SELECT avg(value), min(value), max(value)
FROM heart_rate
WHERE date > today() - 7d
GROUP BY day
```

This returns daily heart rate stats for the past week. The library handles all the HealthKit query setup, permissions, and result formatting.

### Swift DSL

If you prefer type-safety, there's also a Swift DSL:

```swift
let result = try await Health
    .select(.heartRate, aggregates: [.avg, .min, .max])
    .where(.date, .greaterThan, .date(.daysAgo(7)))
    .groupBy(.day)
    .execute()
```

Both approaches compile down to the same intermediate representation before hitting HealthKit.

### Supported Data

The library covers most common health types—steps, heart rate, calories, workouts, sleep sessions, and more. It supports aggregations, grouping by time periods, and the standard comparison operators you'd expect.

### Installation

Add it via Swift Package Manager:

```
https://github.com/glisom/HealthQL.git
```

The [documentation site](https://glisom.github.io/HealthQL) has the full syntax reference and more examples. Feel free to open an issue if you run into any problems or have suggestions.
