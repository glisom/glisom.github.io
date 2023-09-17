---
layout: post
title: "Using Act to Run Github Actions Locally"
description: "1min read time"
date: 2023-05-15 22:06:58 +0000
excerpt: "The Act package offers a convenient way to execute your GitHub Action workflows locally..."
comments: true
---

[https://github.com/nektos/act](https://github.com/nektos/act)

The Act package offers a convenient way to execute your GitHub Action workflows locally. It's a valuable tool when debugging or working on issues that either have a long runtime or are complex, saving you those precious minutes.

### Installation

The installation process is quite straightforward. First, ensure Docker Desktop is installed on your computer. Then, for Mac/Linux users, the easiest installation method is via [Homebrew](https://brew.sh "Homebrew").

    brew install act

That's all there is to it! Upon executing your workflows for the first time, the required Docker containers should automatically download.

### Setup

An essential point to remember is to [pass in your personal access token from GitHub](https://docs.github.com/en/enterprise-server@3.4/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token) when running any workflow dependent on SECRETS or environment variables.

### Executing Workflows

With everything set up, running workflows becomes a breeze:

    ➜ act pull_request --container-architecture linux/amd64

Checkout the README for additional examples and a comprehensive breakdown of all the capabilities this package offers. I believe Act is an indispensable tool for anyone working with GitHub Actions who wants to test or debug their changes swiftly.
