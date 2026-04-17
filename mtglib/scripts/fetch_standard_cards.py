from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from mtglib_contract import CardModel, card_model_from_scryfall, render_card


STANDARD_URL = "https://magic.wizards.com/en/formats/standard"
SCRYFALL_SEARCH_URL = "https://api.scryfall.com/cards/search"
USER_AGENT = "mtglib-fetcher/1.0"


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []

    def handle_data(self, data: str) -> None:
        cleaned = " ".join(data.split())
        if cleaned:
            self.parts.append(cleaned)


def fetch_text(url: str) -> str:
    request = Request(
        url,
        headers={
            "User-Agent": "Mozilla/5.0 (compatible; mtglib-fetcher/1.0)",
            "Accept": "application/json, text/html;q=0.9, */*;q=0.8",
        },
    )
    with urlopen(request) as response:  # noqa: S310
        return response.read().decode("utf-8")


def fetch_json(url: str) -> dict[str, Any]:
    return json.loads(fetch_text(url))


def scrape_standard_set_names() -> list[str]:
    parser = _TextExtractor()
    parser.feed(fetch_text(STANDARD_URL))
    lines = parser.parts

    try:
        start = lines.index("What Sets Are Legal in Standard?") + 1
    except ValueError as error:
        raise RuntimeError("Could not find the Standard set list on the Wizards page") from error

    end_markers = {"Different Ways to Play", "Discover More MTG", "Latest Products"}
    set_names: list[str] = []
    for line in lines[start:]:
        if line in end_markers:
            break
        if not line:
            continue
        set_names.append(line)

    if not set_names:
        raise RuntimeError("Standard set scrape returned an empty list")
    return set_names


def normalized_set_aliases(set_names: list[str]) -> set[str]:
    aliases: set[str] = set()
    for set_name in set_names:
        aliases.add(_normalize_set_name(set_name))

        no_paren = re.sub(r"\s*\([^)]*\)", "", set_name).strip()
        if no_paren:
            aliases.add(_normalize_set_name(no_paren))

        parenthetical = re.findall(r"\(([^)]*)\)", set_name)
        for item in parenthetical:
            aliases.add(_normalize_set_name(item.replace("including", "").strip()))

        if "|" in set_name:
            aliases.add(_normalize_set_name(set_name.split("|", 1)[1].strip()))

    return {alias for alias in aliases if alias}


def fetch_standard_cards(today: dt.date, allowed_set_aliases: set[str]) -> list[dict[str, Any]]:
    query = "game:paper legal:standard"
    params = urlencode({"q": query, "unique": "prints", "order": "name"})
    next_url = f"{SCRYFALL_SEARCH_URL}?{params}"

    cards: list[dict[str, Any]] = []
    seen_oracle_ids: set[str] = set()

    while next_url:
        payload = fetch_json(next_url)
        for card in payload.get("data", []):
            if card.get("digital"):
                continue
            if "paper" not in card.get("games", []):
                continue
            if card.get("legalities", {}).get("standard") != "legal":
                continue
            released_at = dt.date.fromisoformat(card["released_at"])
            if released_at > today:
                continue

            alias = _normalize_set_name(card.get("set_name", ""))
            if allowed_set_aliases and alias not in allowed_set_aliases:
                continue

            oracle_id = card.get("oracle_id") or card.get("id")
            if oracle_id in seen_oracle_ids:
                continue
            seen_oracle_ids.add(oracle_id)
            cards.append(card)

        next_url = payload.get("next_page")

    if not cards:
        raise RuntimeError("No current Standard-legal paper cards were returned")
    return cards


def write_cards(cards: list[dict[str, Any]], output_dir: Path, dry_run: bool, limit: int | None) -> tuple[int, list[str]]:
    output_dir.mkdir(parents=True, exist_ok=True)
    selected = cards[:limit] if limit else cards
    written_slugs: list[str] = []
    count = 0

    for raw_card in selected:
        model: CardModel = card_model_from_scryfall(raw_card)
        output_path = output_dir / f"{model.slug}.md"
        written_slugs.append(model.slug)
        if not dry_run:
            output_path.write_text(render_card(model), encoding="utf-8")
        count += 1

    if not dry_run and limit is None:
        _remove_stale_markdown_files(output_dir, set(written_slugs))

    return count, written_slugs


def main() -> int:
    parser = argparse.ArgumentParser(description="Fetch the current Standard-legal card pool into MTGLib Markdown files.")
    parser.add_argument(
        "--cards-dir",
        default=str(Path(__file__).resolve().parent.parent / "cards"),
        help="Directory where Markdown card files should be written.",
    )
    parser.add_argument("--today", default=dt.date.today().isoformat(), help="Reference date in YYYY-MM-DD format.")
    parser.add_argument(
        "--limit",
        type=int,
        default=None,
        help="Only process the first N cards after filtering. Partial runs do not delete stale files.",
    )
    parser.add_argument("--dry-run", action="store_true", help="Fetch and render metadata without writing files.")
    args = parser.parse_args()

    today = dt.date.fromisoformat(args.today)
    cards_dir = Path(args.cards_dir)

    try:
        set_names = scrape_standard_set_names()
        allowed_aliases = normalized_set_aliases(set_names)
        cards = fetch_standard_cards(today=today, allowed_set_aliases=allowed_aliases)
        written_count, written_slugs = write_cards(cards, cards_dir, dry_run=args.dry_run, limit=args.limit)
    except Exception as error:  # noqa: BLE001
        print(f"Fetch failed: {error}", file=sys.stderr)
        return 1

    mode = "Would write" if args.dry_run else "Wrote"
    print(f"{mode} {written_count} Standard-legal cards into {cards_dir}")
    for slug in written_slugs[:10]:
        print(f"- {slug}")
    if written_count > 10:
        print(f"... and {written_count - 10} more")
    return 0


def _normalize_set_name(value: str) -> str:
    normalized = value.lower()
    normalized = normalized.replace("\u2014", " ").replace("\u2013", " ")
    normalized = normalized.replace("\u00ae", " ").replace("\u2122", " ")
    normalized = normalized.replace("magic: the gathering", " ")
    normalized = normalized.replace("magic the gathering", " ")
    normalized = normalized.replace("|", " ")
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
    return " ".join(normalized.split())


def _remove_stale_markdown_files(output_dir: Path, valid_slugs: set[str]) -> None:
    for existing_path in output_dir.glob("*.md"):
        if existing_path.stem not in valid_slugs:
            existing_path.unlink()


if __name__ == "__main__":
    raise SystemExit(main())