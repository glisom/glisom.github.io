---
title: Using Act to Run Github Actions Locally
slug: using-act-to
canonicalPath: /2023/05/15/using-act-to.html
summary: The Act package offers a convenient way to execute your GitHub Action workflows locally...
draft: false
hasDetailPage: true
featured: false
tags: []
links: []
relationships:
  - label: Another CI test workflow
    collection: blog
    id: accessibility-testing-in
  - label: Another release workflow
    collection: blog
    id: expo-app-config
publishedAt: "2023-05-15"
kind: Post
comments: true
preservedHeadingIds:
  - installation
  - setup
  - executing-workflows
numberHeadings: false
originalTimestamp: "2023-05-15T22:06:58.000Z"
---
[https://github.com/nektos/act](https://github.com/nektos/act)

The Act package offers a convenient way to execute your GitHub Action workflows locally. It's a valuable tool when debugging or working on issues that either have a long runtime or are complex, saving you those precious minutes.

### Installation {#installation}

The installation process is quite straightforward. First, ensure Docker Desktop is installed on your computer. Then, for Mac/Linux users, the easiest installation method is via [Homebrew](https://brew.sh "Homebrew").

    brew install act

That's all there is to it! Upon executing your workflows for the first time, the required Docker containers should automatically download.

### Setup {#setup}

An essential point to remember is to [pass in your personal access token from GitHub](https://docs.github.com/en/enterprise-server@3.4/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) when running any workflow dependent on SECRETS or environment variables.

### Executing Workflows {#executing-workflows}

With everything set up, running workflows becomes a breeze:

    ➜ act pull_request --container-architecture linux/amd64

Checkout the README for additional examples and a comprehensive breakdown of all the capabilities this package offers. I believe Act is an indispensable tool for anyone working with GitHub Actions who wants to test or debug their changes swiftly.
