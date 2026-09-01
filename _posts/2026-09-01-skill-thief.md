---
layout: post
title: "skill-thief: Steal the Ideas, Not the Install"
description: "4min read time"
date: 2026-09-01 12:00:00 +0000
excerpt: "A Claude Code plugin that reads someone else's agent tooling, pulls out the mechanisms worth having, and decides where each one actually belongs in your setup."
tags:
  - "claude code"
  - "ai"
  - "agents"
  - "open source"
comments: true
---

I read a lot of other people's agent setups. Skills repos, plugins, conference talks, that one blog post everybody links. There are almost always good ideas in there. What I kept getting wrong was what to do next.

So I built [skill-thief](https://github.com/glisom/skill-thief), a Claude Code plugin that runs the in-between step.

## The two ways I kept failing

The first one is installing the whole thing. It feels like the fast path! Add the marketplace, enable the plugin, move on. Except now every skill in it loads into every session from then on, and all those descriptions compete for routing with everything I already had. I paid that cost forever, and the actual insight was three paragraphs.

The second one is doing it by hand. I skim the source, grab the two ideas I like, apply them, and lose the reasoning behind everything else. Six months later I read the same repo from scratch and re-derive the same conclusions. Worse, I re-propose the ideas I already looked at and deliberately passed on, because nothing wrote down that I passed on them or why.

skill-thief is the repeatable thing in the middle.

## Every idea gets exactly one verdict

The whole plugin is built around a four-item ladder. Each mechanism it pulls out of a source lands in exactly one box:

| Verdict | Applies when | Lands in |
|---|---|---|
| **Absorb as a rule** (default) | No independent trigger. Nobody would ever invoke this by name. | An existing skill body, your agent instruction file, or a conventions doc |
| **Mint a new skill** | It has its own trigger. Someone would ask for this at a moment when nothing else would fire. | A new skill directory |
| **Harden a gate** | It's a check, not prose. The value is that it fails a build. | A validation script or test tier |
| **Reject** | There's a durable, concept-level reason not to adopt it. | The rejection record |

The important part is that "absorb as a rule" is the default, not the neutral middle. Minting a skill is the expensive verdict. It spends description budget in every future session and competes for routing with everything already installed. Two overlapping triggers don't average out into good coverage, they just make the router's job harder for both. So a mechanism has to earn "new skill" by showing its own trigger, not by being useful.

Reject has two guardrails I care about a lot. A deferral is not a rejection ("we're busy this quarter" changes with the calendar, so it doesn't go in the permanent record). And you never file an already-implemented idea as rejected, because a future reader will conclude you tried it and it failed, and miss that it's live and working.

## Mechanisms, not features

The other rule that does real work: pull out the mechanism, not the feature.

Say a source ships something called AutoReviewGPT that scores a PR against a five-item checklist and blocks the merge under a threshold. The feature name is AutoReviewGPT. The mechanism is "a weighted rubric gate that blocks on a numeric pass threshold before merge." You write down the second one.

The litmus test is simple: strip the source's name and product out entirely. Does what you wrote still tell you what to build? If not, you copied a feature. A mechanism carried over under someone else's marketing name shows up with their assumptions attached, and those get a lot harder to spot once the name sticks.

## How a run goes

Six phases, and only one place where anything gets written.

It starts by inventorying *your* repo and building a map of where each of the four verdicts would even land here. That map gets shown before it reads the source, so a bad guess is cheap to fix. Then it pins the exact version it's reading (a commit SHA, a publish date, a URL), scouts the source for mechanisms, and greps your repo for prior art.

That prior-art phase is my favorite bit, honestly. Evidence of absence has to be actual evidence: the literal command and its actual output, including the empty result. "I didn't see it" and "I searched these six paths with these three patterns and got nothing" are different claims, and only the second one holds up a verdict.

Then everything lands in one ranked table, at one approval gate, once. Not a finding-by-finding approval loop, because that defeats the point of ranking them. Nothing is written before that gate and everything is written after it.

Re-run it later against the same source and it goes into diff mode. It reads the findings doc from last time, resolves the current version, and reports only what changed.

## It's not an installer

Worth being loud about: skill-thief never adds a marketplace, enables someone else's plugin, or vendors their code. The only output is changes to your own config. It also doesn't write feature code, and it isn't an auditor for what you already have installed (different question, different cadence).

One real limitation. A thin host repo weakens the prior-art check. If there's not much of your own tooling to find, every mechanism looks like a gap and it will over-recommend. Verdict quality tracks how much of your conventions actually live in files instead of in people's heads.

I ran it against [obra/superpowers](https://github.com/obra/superpowers) as a dry run and it's checked into the repo under `docs/examples/`. Eight mechanisms scouted, five made the gate table. An independent review of that first run caught two rows mislabeled as rejections when they were really "not applicable at this scale yet," which turned out to be a genuine gap in the ladder itself. That fix is in the skill now. Pretty good outcome for a dry run!

## Try it

```
/plugin marketplace add glisom/skill-thief
/plugin install skill-thief
```

Then point it somewhere:

```
Use skill-thief on https://github.com/example/agent-skills and tell me
what's worth taking.
```

Not on Claude Code? The skill body is written harness-neutral on purpose, so copying `skills/skill-thief/` into your agent's skills directory works the same way. There's no second copy to keep in sync.

Zero dependencies, MIT, Node 20+. Code's [on GitHub](https://github.com/glisom/skill-thief). If you run it against something interesting, I'd love to hear what it told you to steal.
