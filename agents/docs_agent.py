# agents/docs_agent.py
"""A generic documentation‑comment agent.

This agent looks at the *task* argument and, based on the language
specified, scans the target directory (or the current working
directory by default) for source files and inserts a placeholder
comment block in a language‑appropriate style.  It supports the
following languages out of the box:

* Python   – ``"""TODO: description."""``
* JavaScript/TypeScript – JSDoc comment ``/** ... */``
* Go        – comment lines prefixed with ``//``
* Rust      – comment lines prefixed with ``//``

The agent can be easily extended by adding new entries to the
``LANG_DEFINITIONS`` mapping.

Usage example:

```
> pi docs_agent "add documentation comments to js files in src"
```
"""

import re
import os
from pathlib import Path

# ---------------------------------------------------------------------------
# Language definitions
# ---------------------------------------------------------------------------
LANG_DEFINITIONS = {
    "python": {
        "extensions": {".py"},
        "doc_pattern": r"(def\s+\w+\s*\([^)]*\):)(?=\n(?=\s*(?:#|$|\S))",
        "doc_template": """\n    """\n    TODO: add a description here.\n    """\n",
    },
    "javascript": {
        "extensions": {".js", ".jsx", ".ts", ".tsx"},
        "doc_pattern": r"(export\s+function\s+\w+\s*\([^)]*\):|function\s+\w+\s*\([^)]*\)\s*{)(?=\n(?=\s*(?://|$|\S))",
        "doc_template": """\n/**\n * TODO: add a description.\n */\n",
    },
    "go": {
        "extensions": {".go"},
        "doc_pattern": r"(func\s+\w+\s*\([^)]*\)\s*\{)(?=\n(?=\s*(?://|$|\S))",
        "doc_template": "\n// TODO: add a description.\n",
    },
    "rust": {
        "extensions": {".rs"},
        "doc_pattern": r"(fn\s+\w+\s*\([^)]*\)\s*\{)(?=\n(?=\s*(?://|$|\S))",
        "doc_template": "\n// TODO: add a description.\n",
    },
}

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def detect_language_from_task(task: str) -> str:
    """Return a language key based on the task string.

    The function looks for keywords like "python", "js", "javascript",
    "go", "rust", etc. If none are found, ``None`` is returned.
    """
    task_lower = task.lower()
    for lang in LANG_DEFINITIONS:
        if lang in task_lower:
            return lang
        # Handle common abbreviations
        if lang == "javascript" and "js" in task_lower:
            return lang
    return None


def find_source_files(root: Path, extensions: set) -> list[Path]:
    """Recursively yield files under *root* matching *extensions*."""
    for path in root.rglob("*"):
        if path.is_file() and path.suffix in extensions:
            yield path


def add_docs_to_file(file: Path, pattern: re.Pattern, template: str) -> bool:
    """Insert *template* after lines matched by *pattern*.

    Returns ``True`` if the file was modified.
    """
    content = file.read_text(encoding="utf8")
    new_content, count = pattern.subn(lambda m: m.group(1) + template, content)
    if count:
        file.write_text(new_content, encoding="utf8")
    return bool(count)

# ---------------------------------------------------------------------------
# Agent entry point
# ---------------------------------------------------------------------------
async def run(task: str, ctx):
    """Apply documentation comments to source files.

    The *task* argument must describe the desired action, for example::

        "add documentation comments to python files in src"
        "write js doc comments for all files in lib"

    The agent will:
    1. Detect the target language from *task*.
    2. Parse a directory path from *task* (first word after the language
       keyword). If no path is provided, the current working directory
       is used.
    3. Iterate over matching files and insert the placeholder comment.
    4. Log progress via ``ctx.log`` and return a summary string.
    """

    lang = detect_language_from_task(task)
    if not lang:
        return "❌ Could not detect a language from the task."

    cfg = LANG_DEFINITIONS[lang]
    pattern = re.compile(cfg["doc_pattern"], re.MULTILINE)
    template = cfg["doc_template"]

    # Extract a directory path if present.
    # We look for the first word after the language keyword.
    parts = task.split()
    try:
        lang_index = parts.index(lang)
        dir_path = parts[lang_index + 1]
    except (ValueError, IndexError):
        dir_path = "."

    root = Path(dir_path).resolve()
    if not root.exists():
        return f"❌ Path {root} does not exist."

    ctx.log(f"Scanning {root} for {lang} files...")

    files = list(find_source_files(root, cfg["extensions"]))
    processed = 0
    modified = 0

    for file in files:
        processed += 1
        if add_docs_to_file(file, pattern, template):
            modified += 1
            ctx.log(f"Updated {file}")

    return f"✅ Processed {processed} file(s); added docs to {modified}.
"  
