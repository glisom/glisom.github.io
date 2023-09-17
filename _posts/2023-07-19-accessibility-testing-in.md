---
layout: post
title: "Accessibility Testing in Maestro"
description: "2min read time"
date: 2023-07-19 15:33:47 +0000
excerpt: "Recently, our mobile team came across a problem with text sizing in our app when customers.."
tags:
  - "maestro"
  - "mobile development"
  - "mobile CI/CD"
  - "iOS development"
  - "Android development"
comments: true
---

Recently, our mobile team came across a problem with text sizing in our app when customers had the "Larger Accessibility Sizes" Display Text option on. After updating our app to more fully support dynamic text, we came across a cool solution to automate testing this for future releases.

Using [Maestro](https://maestro.mobile.dev) UI Testing, we could enable these settings for certain tests. We created actions within our flows to enable certain settings prior to running the actual UI tests steps. This pattern can be applied on both Android or iOS as Maestro gives you full access to the simulator even running in their cloud environment. If you have not checked out Maestro for UI testing on either React Native or Native applications, I would highly recommend it, as it solves so many historical issues with similar tools.

Below is an example enabling the "Larger Accessibility Sizes" and then launching the target application in an iOS Simulator.

**Example Maestro Flow**

```yaml
appId: <your_bundle_id>
---
- tapOn:
	id: "Settings"
- tapOn:
	id: "ACCESSIBILITY"
- tapOn:
	id: "DISPLAY_AND_TEXT"
- tapOn:
	id: "LARGER_TEXT"
- tapOn: text: "Larger Accessibility Sizes"
	index: 0
- tapOn:
	point: "50%,90%"
- pressKey: "Home"
- launchApp:
	appId: "<your_bundle_id>"
```

This pattern or strategy can be applied to any of the accessibility settings available on simulators/emulators. This can be a huge help to ensure new UI updates and features are accessible while continuing to release fast.
