---
layout: post
title: "Expo App Config Setup for Multiple Environments"
description: "3min read time"
date: 2023-02-01 04:22:25 +0000
excerpt: "Expo is a free and open-source platform for creating and building mobile apps using..."
tags:
  - "mobile app development"
  - "expo"
  - "eas"
  - "react native"
comments: true
---

Expo is a free and open-source platform for creating and building mobile apps using JavaScript and React Native. It is a popular choice among developers for its ease of use and its ability to quickly set up and run a mobile app without the need for extensive configuration. Expo provides a set of tools and services that allow developers to build, test, and publish their apps to the App Store and Google Play with minimal setup and without the need for Xcode or Android Studio.

One of the most powerful features of Expo is the ability to use a single codebase to create apps for both iOS and Android platforms, which can save a lot of time and effort. Expo also provides a rich set of pre-built components and APIs for common functionality such as push notifications, camera access, and location tracking, which can help developers get their apps up and running quickly.

One of the things you may come across is figuring out how to setup different environments or app variants within an Expo app. If you want to just target one binary on iOS and Android, there is very little to do other than setup some [environment variables](https://docs.expo.dev/guides/environment-variables/). If you want to have multiple apps for development, QA/test, production, etc then you’ll need to do a few things to be able to take advantage of all Expo has to offer without having to manage these things yourself.

## Converting to app.json to app.config.js for multiple environments.

The first step is to convert the `app.json` file into an `app.config.js` file. This allows for dynamic changes for things such as your app’s bundle identifier/package name. Below is an example of a basic conversion. Somethings to note is that you are not able to auto bump build numbers when using the app.config.js but there are other ways to accomplish this.

#### app.config.js

```javascript
function getBundleId() {
    switch (process.env.APP_VARIANT) {
        case 'development': {
            return 'com.isom.grant.dev';
        }
        case 'qa': {
            return 'com.isom.grant.qa';
        }
        case 'production': {
            return 'com.isom.grant.prod';
        }
        default: {
            return 'com.isom.grant.dev';
        }
    }
}

export default {
    name: getName(),
    ...
    ios: {
        bundleIdentifier: getBundleId(),
        ...
    },
    android: {
        package: getBundleId(),
        ...
    },
    extra: {
        APP_VARIANT: process.env.APP_VARIANT || 'development',
    },
};
```

#### eas.json

```json
{
    "build": {
        "development": {
            "distribution": "internal",
            "developmentClient": true,
            "autoIncrement": false,
            "env": {
                "APP_VARIANT": "development"
            },
            "android": {
                "buildType": "apk"
            }
        },
        ...
    },
    ...
}
```

Now simply providing the `--profile` when running an `eas build` command will set the bundle identifier and package name of your app. You can do this for environment variables as well.

    Constants.expoConfig?.extra?.APP_VARIANT

The above snippet will return the value set during build at runtime.

## Passing Environment Variables to EAS Update

Environment variables are fairly straightforward for updates. You will need to configure use interactive mode to attach branches to variants. But after that, you will just include the environment variable(s) before the command like any other CLI.

    APP_VARIANT='production' eas update -p all --branch prod

To wrap things up, if you're using Expo to build your mobile app, setting up multiple environments or variants can be a big help. By converting your app.json file to a app.config.js file, you'll have more control over your app's settings and can utilize environment variables for native pieces. And if you need to pass on environment variables to the EAS update, it's pretty simple. Just include the variables before you run the update command and you're good to go. All in all, Expo makes it easy for you to build, test, and publish your app to both the App Store and Google Play with a smooth and stress-free experience.
