# MTGLib

MTGLib is a library-only repository that stores Magic: The Gathering card entries as plain Markdown. The goal is a stable, human-readable corpus that is regular enough for future parsing, search, and analysis without requiring an app, database, or frontmatter.

## Scope Boundary

This repository is the card-text library, not a search product, deck builder, parser, rules engine, or pricing dataset. Each entry represents one canonical gameplay identity rather than a separate file for every printing.

## Starter Slice Status

The current repository state is a Phase 1 starter slice. It defines the document contract, fixes the initial naming rules, and ships a small Standard-only corpus slice.

Phase 1 is intentionally small. The purpose is to lock format decisions before scaling coverage.

The current corpus is intentionally pruned to cards that are clearly Standard-legal as of 2026-04-16. If a prior sample's legality was uncertain for that date, it was removed instead of retained.

## Corpus Organization

- `CONTRACT.md`: the canonical Markdown contract for card files
- `PLAN.md`: product plan and phased rollout
- `cards/`: flat directory of canonical card entries
- `scripts/fetch_standard_cards.py`: fetches the current Standard pool into Markdown files
- `scripts/lint_cards.py`: rewrites card files into deterministic contract order and formatting

The `cards/` directory is flat on purpose for the starter slice. Files use lowercase ASCII slugs with hyphen separators so they stay easy to browse and easy to target with simple text tools.

## Regeneration Workflow

The corpus can now be regenerated and normalized with the bundled Python scripts.

Fetch the current Standard-legal paper card pool into `cards/`:

```powershell
f:/workspace/.venv/Scripts/python.exe mtglib/scripts/fetch_standard_cards.py --today 2026-04-16
```

The fetcher now treats `cards/` as a synced Standard pool directory: it writes every currently legal paper card it finds and removes stale Markdown files that are no longer part of that pool.

Lint and rewrite all current card files so they match `CONTRACT.md` deterministically:

```powershell
f:/workspace/.venv/Scripts/python.exe mtglib/scripts/lint_cards.py
```

Run the linter in check-only mode:

```powershell
f:/workspace/.venv/Scripts/python.exe mtglib/scripts/lint_cards.py --check
```

The fetcher uses the official Wizards Standard page as the legality boundary and intersects that with structured card data so the output stays aligned with the current legal pool while still using canonical Oracle text and metadata for formatting.

## What A Card File Contains

Each card file is written for raw Markdown reading first, but uses stable labels and ordering so future tooling can recover key fields directly from the body text.

The current Standard-only corpus includes examples for:

- single-face cards
- creatures with stats
- lands with no mana cost
- instants and sorceries
- enchantments and Auras

The contract still supports multi-face layouts, planeswalkers, and more complex mana-cost structures, but the current card slice does not attempt to cover every supported layout.

## What Is Deliberately Excluded

Card files do not include legality, prices, collector numbers, set-by-set printings, or other printing-specific metadata. The repository is focused on canonical gameplay-relevant text.