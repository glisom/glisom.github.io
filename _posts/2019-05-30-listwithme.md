---
layout: post
title: "ListWithMe, Creating an iMessage-only Application"
description: "1m 30s read time"
excerpt: "Here is a list of what I listened to throughout the past year."
tags: ios imessages xcode swift
comments: true
---

Over the past month, I built a small iMessage app that allows users to create editable lists in their conversations. The app itself is nothing too flashy, but it was something I hadn’t found a solid solution to and was a great excuse to get some experience with standalone iMessage apps. My wife and I use it whenever we have errands to run after work or a handful of things to get done during the week. Please check it out and let me know what you think!

 [Product Hunt](https://www.producthunt.com/posts/listwithme)
 [App Store](https://apps.apple.com/ca/app/listwithme/id1224284271)

It was pretty easy getting up and going with the  [Messages Framework](https://developer.apple.com/documentation/messages) . The Delegate methods are very straight forward and there are not too many additional situations to handle outside of what you would normally do for a UIViewController. The main and most important thing to take care of is making sure you update the views appropriately when the user expands or minimizes the app view. Feel free to check out my  [implementation on Github](https://github.com/glisom/ListWithMe) . Standalone iMessage apps can be really useful, the largest downfall I have found is how difficult it is to manage them and find them. A handful of users were frustrated with that and felt that it was a “sketchy” experience after downloading the app because it had no presence on the home screen. If Apple improved the way iMessage apps existed in Messages I think there could be a serious uptick in developers creating these little utilities.
