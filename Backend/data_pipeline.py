"""
Data pipeline helpers for unified scheme datasets.

This file is intentionally self-contained so worktree apply/switch operations
don't fail when code references `data_pipeline.py`.
"""

from __future__ import annotations

import csv
import json
import os
import re
from typing import Any


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

SCHEMES_JSON = os.path.join(DATA_DIR, "schemes.json")
SCST_JSON = os.path.join(DATA_DIR, "SCST_schemes.json")
SCHEMES_CSV = os.path.join(DATA_DIR, "all_schemes_dataset.csv")


def _safe_str(v: Any) -> str:
    if v is None:
        return ""
    if isinstance(v, (list, tuple)):
        return "; ".join(_safe_str(x) for x in v if x is not None)
    if isinstance(v, dict):
        return json.dumps(v, ensure_ascii=False)
    return str(v).strip()


def _pick(row: dict[str, Any], aliases: tuple[str, ...]) -> str:
    norm = {k.lower().replace(" ", "_"): v for k, v in row.items() if k is not None}
    for a in aliases:
        if a in row:
            return _safe_str(row[a])
        key = a.lower().replace(" ", "_")
        if key in norm:
            return _safe_str(norm[key])
    return ""


def _normalize(raw: dict[str, Any], source: str) -> dict[str, str]:
    return {
        "scheme_name": _pick(raw, ("scheme_name", "name", "title", "scheme", "Scheme Name")) or "Unknown Scheme",
        "category": _pick(raw, ("category", "Category", "sector", "type")),
        "eligibility": _pick(raw, ("eligibility", "Eligibility", "criteria")),
        "benefits": _pick(raw, ("benefits", "Benefits", "benefit")),
        "documents": _pick(raw, ("documents", "Documents", "required_documents", "docs_required")),
        "application_process": _pick(raw, ("application_process", "how_to_apply", "application", "process")),
        "source": source,
    }


def _load_json(path: str, source: str) -> list[dict[str, str]]:
    if not os.path.isfile(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, dict):
        for k in ("schemes", "data", "items", "results"):
            if isinstance(data.get(k), list):
                data = data[k]
                break
        else:
            data = [data]
    if not isinstance(data, list):
        return []
    return [_normalize(x, source) for x in data if isinstance(x, dict)]


def _load_csv(path: str) -> list[dict[str, str]]:
    if not os.path.isfile(path):
        return []
    out: list[dict[str, str]] = []
    try:
        import pandas as pd  # optional

        df = pd.read_csv(path, encoding="utf-8", on_bad_lines="skip")
        df = df.fillna("")
        for _, row in df.iterrows():
            out.append(_normalize({str(c): row[c] for c in df.columns}, "csv"))
    except Exception:
        with open(path, "r", encoding="utf-8", errors="replace", newline="") as f:
            for row in csv.DictReader(f):
                if row:
                    out.append(_normalize(dict(row), "csv"))
    return out


def load_all_records() -> list[dict[str, str]]:
    records: list[dict[str, str]] = []
    records.extend(_load_json(SCHEMES_JSON, "json"))
    records.extend(_load_json(SCST_JSON, "scst"))
    records.extend(_load_csv(SCHEMES_CSV))
    return records


def merge_dedupe(records: list[dict[str, str]]) -> list[dict[str, str]]:
    seen: dict[str, dict[str, str]] = {}
    order: list[str] = []
    for rec in records:
        key = re.sub(r"[^a-z0-9]+", " ", (rec.get("scheme_name", "").lower())).strip()
        if not key:
            continue
        if key not in seen:
            seen[key] = dict(rec)
            order.append(key)
        else:
            for fld in ("category", "eligibility", "benefits", "documents", "application_process"):
                if not seen[key].get(fld) and rec.get(fld):
                    seen[key][fld] = rec[fld]
    return [seen[k] for k in order]


def get_dataset_stats() -> dict[str, Any]:
    raw = load_all_records()
    merged = merge_dedupe(raw)
    return {
        "raw_count": len(raw),
        "merged_count": len(merged),
        "files": {
            "schemes_json": os.path.isfile(SCHEMES_JSON),
            "scst_json": os.path.isfile(SCST_JSON),
            "all_schemes_dataset_csv": os.path.isfile(SCHEMES_CSV),
        },
    }

