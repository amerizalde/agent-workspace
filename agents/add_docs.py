// agents/add-docs.py
import os
import re
from pathlib import Path

async def run(task: str, ctx):
    """Add placeholder docstrings to Python functions.

    Args:
        task: Optional path to scan. Defaults to current directory.
        ctx: Pi agent context providing logging.
    """
    root = task.strip() or "."
    ctx.log(f"Scanning {root} for .py files...")
    files = [p for p in Path(root).rglob("*.py") if "__init__" not in p.parts]
    processed = 0
    for file in files:
        content = file.read_text(encoding="utf8")
        updated = add_docs(content)
        if updated != content:
            file.write_text(updated, encoding="utf8")
            ctx.log(f"Updated {file}")
            processed += 1
    return f"Processed {processed} file(s)."


def add_docs(src: str) -> str:
    """Prepend a placeholder docstring to any function definition that
    lacks one. This is intentionally simple and may need refinement for
    real‑world use.
    """
    # Regex matches "def foo(...):" lines not already followed by a docstring
    pattern = re.compile(r"(def\s+\w+\s*\([^)]*\):)(?=\n(?=\s*(?:#|$|\S))", re.MULTILINE)

    def repl(match):
        func_def = match.group(1)
        doc = """\n    """\n    TODO: Add a description here.\n    """\n"""
        return func_def + doc

    return pattern.sub(repl, src)

# The module must export the run function for Pi to discover it.
