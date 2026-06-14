# Project Case Study Template

Use this checklist when creating a new file in `src/content/projects/`. Project pages are for hiring-focused deep dives, so each one should prove what you built, why you made the tradeoffs you made, and what you learned from the rough edges.

## Frontmatter

```yaml
---
title: "Project name"
description: "One or two sentences about the system, the problem, and the interesting technical angle."
pubDate: "Jun 11 2026"
updatedDate: "Jun 11 2026"
startedDate: "May 01 2026"
completedDate: "Jun 01 2026"
status: "shipped"
role: "Solo backend engineer"
stack:
  - FastAPI
  - Postgres
  - Redis
  - Docker
featured: true
heroImage: "../../assets/blog-placeholder-1.jpg"
screenshots:
  - image: "../../assets/blog-placeholder-2.jpg"
    alt: "Screenshot of the running project"
    caption: "The main project surface or architecture proof."
links:
  repo: "https://github.com/0xPolar/example"
  demo: "https://example.com"
  docs: "https://github.com/0xPolar/example#readme"
---
```

Required status values are `planned`, `in-progress`, `shipped`, or `archived`. Every project must include at least one `repo` or `demo` link and at least one screenshot.

## MDX Body

```mdx
import Callout from "@components/Callout.astro";

<Callout type="tldr">
  Explain the project in plain language: what it does, why it matters, the most important tradeoff, and the result.
</Callout>

## The Problem

What was missing, painful, slow, confusing, or worth learning? Make the reader care before describing the implementation.

## Constraints

List the boundaries that shaped the solution: scale, time, hosting, budget, APIs, data model, operational limits, or learning goals.

## Architecture

Show how the system fits together. Prefer a screenshot or diagram near the top, then explain the main components and data flow.

## Key Decisions

Describe the decisions that reveal engineering judgement. Include the option you rejected and why.

## Implementation Notes

Use focused code snippets, schema examples, queue flows, deployment config, or request/response examples. Keep this section concrete.

## What Broke

Write down the failures: bugs, performance surprises, deployment problems, observability gaps, or assumptions that did not survive contact with real code.

## Results

Show evidence. Use screenshots, measured behavior, completed features, latency/load notes, tests, or before/after comparisons.

## What I Would Change

Explain the next version. This is where hiring readers see how you think after the first pass works.

## Closing Thoughts

End with the lesson the project taught you and what kind of system you understand better now.
```

## Publish Checklist

- The page opens with a screenshot or strong visual proof.
- The project has a repo or demo link.
- The first callout can stand alone as a short summary.
- The architecture section explains boundaries and data flow.
- The failures section names at least one real problem.
- The retrospective section includes concrete next steps.
- `pnpm build` passes before publishing.
