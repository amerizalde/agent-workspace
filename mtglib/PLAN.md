# MTGLib Product Design Plan

## Overview

MTGLib is a library-only product: a long-lived collection of Markdown files where each file is a plain-text representation of a Magic: The Gathering card. The library is intended to be readable by humans and structured enough to support future search, retrieval, and pattern-recognition tools for deck building.

The immediate goal is not to build an application. The immediate goal is to define and curate a stable, canonical corpus that can later power applications. In practice, this means the product must optimize for clarity, consistency, scalability, and text-level regularity.

## Problem Statement

Magic card information is widely available through websites and APIs, but those sources are not the same as a portable, version-controlled, Markdown-native corpus that can be read directly and analyzed with simple text tools. Informal notes are easy to write but too inconsistent for downstream search or pattern extraction.

MTGLib exists to solve that gap by providing a disciplined card-text corpus with predictable structure and plain formatting.

## Product Vision

Create the best plain-text MTG card library for:

- Human browsing and reference
- Simple grep-style or index-based search
- Future retrieval pipelines for deck-building tools
- Future pattern analysis across color, cost, text, and keyword usage

The product should remain useful even without a dedicated UI, database, or runtime.

## Users

### Primary Users

- MTG players who want a readable local card reference
- Deck builders looking for card text patterns and mechanics
- Developers building search, recommendation, or analysis layers on top of the corpus

### Secondary Users

- Researchers experimenting with corpus analysis
- LLM and RAG workflows that need chunkable, clean Markdown inputs
- Maintainers who need a durable, auditable text representation of card data

## Product Goals

- Represent each canonical MTG card as one Markdown file
- Preserve enough structure that a future parser can recover major card fields from plain Markdown body text
- Keep files easy to read in any editor
- Support eventual full canonical card coverage
- Handle complex card types and unusual rules text without ad hoc formatting
- Keep naming and directory conventions stable over time

## Non-Goals

- Building a search application in this repository
- Building a deck recommendation engine in this repository
- Tracking market prices, formats, or legality metadata in this repository
- Modeling every physical printing as its own separate file by default
- Building an official rules engine or gameplay simulator
- Requiring YAML frontmatter or another metadata header format

## Product Boundary

MTGLib is the data library, not the product surface that consumes it. Future tools may search, rank, cluster, or recommend cards based on this library, but those tools are separate products. This boundary matters because it keeps the corpus stable, reviewable, and implementation-agnostic.

## Core Design Principles

### 1. Canonical Over Printing-Specific

The primary unit of content should be the canonical card, not each individual printing. Reprints, alternate art, and promo editions usually duplicate gameplay-relevant text and should not create duplicate corpus entries unless there is a deliberate future decision to model printings separately.

### 2. Human-Readable First

Every file should be understandable without a parser, renderer, or schema tool. Markdown should remain natural to read in raw form.

### 3. Structured Enough for Machines

Although the files are written for humans first, the arrangement of sections and labels must be regular enough that downstream tools can parse them reliably.

### 4. ASCII-Friendly and Stable

The corpus should favor ASCII-safe conventions where possible so that filenames, searches, and downstream tooling remain straightforward across environments.

### 5. Minimal Hidden Semantics

Do not rely on implicit formatting tricks. If a future tool needs to recover a field, that field should be represented explicitly in the body text.

## Canonical Unit of Content

The recommended content unit is one file per canonical Oracle-style card identity.

This means:

- One file for a gameplay-distinct card identity
- No duplicate file for each reprint by default
- Alternate printings are out of scope unless they materially change the gameplay text represented in the file
- The plan should document any exceptions explicitly rather than handling them informally

This approach keeps the corpus smaller, avoids duplicate search hits, and aligns better with future deck-building analysis.

## File Format Strategy

Each card file should remain pure Markdown body text. No YAML frontmatter should be required.

The document contract should be regular and explicit. For Phase 1 single-face cards, the baseline structure is:

```md
# Card Name

## Canonical Name
Card Name

## Slug
card-name

## Layout
single-face

## Mana Cost
- Printed: 1B
- Generic: 1
- White: 0
- Blue: 0
- Black: 1
- Red: 0
- Green: 0
- Colorless: 0
- Hybrid: none
- Phyrexian: none
- Variable: none
- Snow: 0

## Type Line
Creature - Human Wizard

## Keywords
- Flying
- Ward

## Rules Text
When Card Name enters the battlefield, draw a card.

## Stats
- Power: 2
- Toughness: 3
```

Phase 1 should use the contract-defined section names and order consistently.

## Required Content Fields

At minimum, the library format should support:

- Card name
- Mana cost broken out in a regular way
- Type line
- Keywords
- Rules text
- Stats when the card type requires them
- Loyalty when the card is a planeswalker
- Any gameplay-critical face or mode information for multi-part cards

Optional descriptive notes may exist, but the core gameplay fields must remain distinct from commentary.

## Mana Cost Representation

The original idea calls for mana costs separated by type. The product should formalize that requirement.

Recommended rules:

- Represent mana components explicitly rather than only preserving printed symbols
- Preserve enough detail to distinguish colored mana, generic mana, hybrid mana, phyrexian mana, snow mana, and variable costs like X
- Keep the representation plain text and deterministic
- Choose one notation and use it everywhere

Example normalized notation options:

- Component list: White 1, Blue 0, Black 1, Red 0, Green 0, Generic 2
- Token-style notation: W:1 U:0 B:1 R:0 G:0 C:0 Generic:2 X:0

The plan should favor the notation that is easiest to read and easiest to parse consistently.

## Keywords and Rules Text

Keywords should be called out separately from the full rules text even when they also appear in the printed card text. This improves both readability and downstream search.

Rules for these sections should include:

- Use a consistent keyword ordering policy
- Keep rules text faithful to the canonical text source
- Define a reminder-text policy and apply it consistently
- Keep flavor text out of the core rules section unless the product later chooses to preserve it in a separate optional section

## Edge Case Coverage

The design is incomplete unless it handles complex card classes explicitly. MTGLib should define formatting rules for at least the following:

- Split cards
- Fuse cards
- Transform cards
- Modal double-faced cards
- Adventure cards
- Sagas
- Planeswalkers
- Creatures with power and toughness modifiers in text
- Cards with X in their mana cost
- Cards with no mana cost
- Hybrid and phyrexian mana cards
- Cards with alternate casting conditions

The corpus format should prefer explicit sections over improvised prose when representing these cases.

## Directory and Naming Conventions

The library should scale to full coverage without forcing path churn.

Recommended naming rules:

- Use deterministic slugs derived from canonical card names
- Prefer lowercase ASCII filenames with hyphen separators
- Avoid naming rules that depend on current set membership or legality
- Keep directory structure shallow unless the corpus size makes grouping necessary

Recommended rollout approach:

- Start with a flat directory while the corpus is small
- Introduce alphabetical grouping only if scale makes it necessary
- Avoid reorganizing paths casually once external tools may depend on them

## Corpus Scope Rules

The library should define what is included and excluded.

Included:

- Canonical gameplay-relevant card entries
- Major card classes needed for deck-building analysis
- Cards across the full history of Magic, delivered in phases

Excluded by default:

- Duplicate printing records
- Tokens, emblems, and art cards unless the product later expands scope
- Market metadata
- Collector metadata
- Format legality status
- Deck lists or strategy commentary embedded in card files

## Release Strategy

Full coverage is the destination, but the product should be built in phases.

### Phase 1: Format Prototype

- Publish a written Markdown contract in `CONTRACT.md`
- Publish a repository overview and scope statement in `README.md`
- Create a flat `cards/` directory with one Markdown file per canonical card identity
- Populate a small Standard-only starter slice that covers the currently implemented single-face layouts:
	- creatures with stats
	- lands with no mana cost
	- instants and sorceries
	- enchantments and Auras
- Prove the contract works for the current starter slice while leaving room for later planeswalker, multi-face, and complex mana-cost examples

Phase 1 deliverables:

- `README.md` describing purpose, scope boundary, starter-slice status, and corpus organization
- `CONTRACT.md` defining canonical identity, slug rules, section order, conditional sections, mana-cost normalization, reminder-text policy, and out-of-scope metadata
- `cards/` as a flat directory
- A small Standard-only starter corpus of canonical card files that conforms to the contract and remains pure Markdown with no frontmatter

Phase 1 acceptance criteria:

- Every Phase 1 card file uses the same top-level labels and section order defined in `CONTRACT.md`
- Every filename is lowercase ASCII with hyphen separators and matches the documented slug policy
- Every single-face card file includes canonical name, slug, layout, mana cost, type line, keywords, and rules text
- Creature entries include a `Stats` section when power and toughness are part of the card definition
- The Phase 1 corpus is limited to the current Standard-only starter slice described in `README.md`
- Mana cost normalization is present for the current implemented examples, including colored costs and no-mana-cost lands
- No file includes legality, price, collector, set, artist, or other printing-specific metadata
- The corpus remains readable in raw Markdown without relying on frontmatter or external tooling

### Phase 2: Edge-Case Hardening

- Add difficult card classes that stress the schema
- Refine normalization rules without breaking the document contract
- Lock filename and path strategy

### Phase 3: Broad Corpus Expansion

- Scale toward large coverage using the stabilized format
- Run duplicate detection and schema checks continuously
- Track unresolved modeling exceptions explicitly

### Phase 4: Canonical Full-Coverage Build

- Reach full target coverage of canonical card identities
- Complete quality review and spot checks
- Freeze the v1 corpus format

## Success Criteria

The project is successful when:

- A new maintainer can understand a card file without external documentation
- A future parser can recover the major fields reliably from body text alone
- Duplicate canonical card entries are minimized or eliminated
- Edge-case cards can be represented without inventing one-off formatting
- The corpus is useful for later search and pattern-analysis tooling

## Quality Gates

Each corpus release should satisfy the following:

- Every file includes all required sections relevant to its card type
- No duplicate canonical entries exist without an explicit exception rule
- Filenames follow the agreed slug rules
- Required sections appear in a consistent order
- Spot checks against an authoritative source confirm content accuracy
- Search-oriented scans show that keywords, mana components, and rules text are easy to isolate

## Risks and Tradeoffs

### Risk: Overfitting to Future Tools

If the corpus is designed too aggressively around hypothetical tooling, readability will suffer. The mitigation is to keep the body text readable first and add machine-focused sidecar assets later if needed.

### Risk: Ambiguity Around Canonical Identity

If the project does not lock the identity model early, duplicate files and inconsistent search results will follow. The mitigation is to commit to canonical card identity before scaling the corpus.

### Risk: Schema Drift

If maintainers improvise field ordering or labels, the library becomes harder to parse and compare. The mitigation is to define one stable document contract and enforce it through review.

## Future Extensions

These are deliberately out of scope for MTGLib v1, but the design should leave room for them:

- A separate index file for faster search or lookup
- A validation script that checks file structure
- A search layer for deck-building queries
- A pattern-analysis pipeline for synergy discovery
- A derived dataset for retrieval or model training

These extensions should consume the library rather than redefine it.

## Implementation Plan

1. Formalize the card document contract with one canonical section layout.
2. Define the canonical identity rule for card-to-file mapping.
3. Create a starter Standard-only sample set spanning the initial implemented single-face card classes.
4. Review edge cases and adjust the schema before large-scale expansion.
5. Lock naming and path conventions.
6. Expand toward broad coverage with quality review.
7. Reach full canonical coverage and freeze the v1 corpus contract.

## Verification Checklist

- The product scope is clearly library-only.
- The plan supports both human readers and future machine consumers.
- The format is pure Markdown body text with no frontmatter requirement.
- The canonical identity rule prevents accidental duplication from reprints.
- Edge-case cards are explicitly accounted for.
- The roadmap supports eventual full coverage.
- The quality gates are concrete enough to guide review.

## Source

This plan expands the original concept stated in [idea.md](idea.md): build a collection of Markdown files, each representing a standard Magic: The Gathering card with title, mana costs separated by type, keywords, and card text.