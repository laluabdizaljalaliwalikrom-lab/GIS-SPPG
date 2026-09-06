"""Unit-aware, date-aware market price reference matching.

Provides:
  - canonicalize_unit(): normalize unit synonyms (kg/kilogram, gr/gram, pc/pcs, ...)
  - DEFAULT_UNIT_CONVERSIONS: editable base + factor per unit (stored in
    system_settings key `unit_conversions` by admin).
  - convert_reference_price(): convert a reference price from one unit to another.

Groups separate physical dimensions. Conversions BETWEEN groups (e.g. karung -> kg,
liter -> kg) are only possible when the admin defines an explicit factor pointing at
the target base unit. Within a group, conversion is always possible arithmetically.

Base units:
  weight: kg   (g=0.001, ton=1000, kwintal=100)
  volume: liter (ml=0.001, cc=0.001)
  count : pcs  (pcs/butir/ekor/buah/ikat... = 1 each; lusin/kodi/gross/rim multiply)

Explicit cross-group admin factors (default):
  karung/zak/sak:25 -> kg ; tabung:12 -> kg ; galon:19 -> liter ;
  dus:40 -> pcs ; box:40 -> pcs ; pack:12 -> pcs ; bungkus:10 -> pcs ;
  karton:48 -> pcs ; tray:30 -> pcs ; sachet:1 -> pcs
"""
from typing import Dict, Optional, Tuple

import json
import re

DEFAULT_UNIT_CONVERSIONS: Dict[str, dict] = {
    # within-group: base + factor (factor = how many base units per unit)
    "kg": {"base": "kg", "factor": 1.0},
    "kilogram": {"base": "kg", "factor": 1.0},
    "kilo": {"base": "kg", "factor": 1.0},
    "g": {"base": "kg", "factor": 0.001},
    "gram": {"base": "kg", "factor": 0.001},
    "gr": {"base": "kg", "factor": 0.001},
    "mg": {"base": "kg", "factor": 0.000001},
    "ton": {"base": "kg", "factor": 1000.0},
    "kwintal": {"base": "kg", "factor": 100.0},
    "liter": {"base": "liter", "factor": 1.0},
    "litre": {"base": "liter", "factor": 1.0},
    "l": {"base": "liter", "factor": 1.0},
    "ml": {"base": "liter", "factor": 0.001},
    "cc": {"base": "liter", "factor": 0.001},
    "pcs": {"base": "pcs", "factor": 1.0},
    "pc": {"base": "pcs", "factor": 1.0},
    "butir": {"base": "pcs", "factor": 1.0},
    "buah": {"base": "pcs", "factor": 1.0},
    "ekor": {"base": "pcs", "factor": 1.0},
    "ikat": {"base": "pcs", "factor": 1.0},
    "renceng": {"base": "pcs", "factor": 1.0},
    "strip": {"base": "pcs", "factor": 1.0},
    "lusin": {"base": "pcs", "factor": 12.0},
    "kodi": {"base": "pcs", "factor": 20.0},
    "gross": {"base": "pcs", "factor": 144.0},
    "rim": {"base": "pcs", "factor": 500.0},
    # cross-group admin factors
    "karung": {"base": "kg", "factor": 25.0},
    "zak": {"base": "kg", "factor": 25.0},
    "sak": {"base": "kg", "factor": 25.0},
    "tabung": {"base": "kg", "factor": 12.0},
    "galon": {"base": "liter", "factor": 19.0},
    "dus": {"base": "pcs", "factor": 40.0},
    "box": {"base": "pcs", "factor": 40.0},
    "pack": {"base": "pcs", "factor": 12.0},
    "bungkus": {"base": "pcs", "factor": 10.0},
    "karton": {"base": "pcs", "factor": 48.0},
    "tray": {"base": "pcs", "factor": 30.0},
    "sachet": {"base": "pcs", "factor": 1.0},
    "kaleng": {"base": "pcs", "factor": 1.0},
    "botol": {"base": "pcs", "factor": 1.0},
}

_UNIT_ALIAS = {
    "kgr": "kg", "kgs": "kg", "kilog": "kg", "kilograms": "kg", "kilogram": "kg", "kilo": "kg",
    "grams": "g", "gram": "g", "litres": "liter", "liters": "liter", "letre": "liter",
    "pcs": "pcs", "pack": "pack", "pk": "pack", "dus": "dus", "dos": "dus",
    "karung": "karung", "zak": "zak", "sak": "sak", "sac": "sak",
    "tabung": "tabung", "tong": "tabung", "galon": "galon", "dispenser": "galon",
    "butir": "butir", "pcs": "pcs", "buah": "buah", "ekor": "ekor", "ikat": "ikat",
    "bungkus": "bungkus", "sachet": "sachet", "strip": "strip", "renceng": "renceng",
    "karton": "karton", "box": "box", "tray": "tray", "papan": "papan", "koli": "koli",
    "botol": "botol", "kaleng": "kaleng", "rim": "rim", "lusin": "lusin", "kodi": "kodi",
    "gross": "gross", "kantong": "kantong", "plastik": "plastik", "porsi": "porsi",
    "kotak": "kotak", "ml": "ml", "cc": "cc", "l": "l", "liter": "liter", "ton": "ton",
    "kwintal": "kwintal", "gr": "gr", "g": "g", "kg": "kg",
}

# Units that never imply a quantity (packaging/serving units without a fixed count)
_AMBIGUOUS = {"porsi", "kotak", "kantong", "plastik", "koli", "papan"}


def canonicalize_unit(unit: str) -> str:
    """Map any unit spelling/synonym to a canonical token (e.g. 'Kilogram' -> 'kg')."""
    if not unit:
        return ""
    u = str(unit).strip().lower().rstrip(".").rstrip("s")
    u = re.sub(r"[^a-z]", "", u)
    return _UNIT_ALIAS.get(u, u)


def _load_conversions(config_obj: Optional[dict]) -> Dict[str, dict]:
    """Merge the DEFAULT conversion table with an admin override dict."""
    merged = {}
    for k, v in DEFAULT_UNIT_CONVERSIONS.items():
        merged[k] = dict(v)
    if isinstance(config_obj, dict):
        for k, v in config_obj.items():
            if not k or not isinstance(v, dict):
                continue
            try:
                merged[k.lower()] = {
                    "base": str(v.get("base") or "").lower(),
                    "factor": float(v.get("factor") or 0.0),
                }
            except (TypeError, ValueError):
                continue
    return merged


def format_conversions_for_storage(config_obj: Optional[dict]) -> Dict[str, dict]:
    """Return only the admin-editable (non-default) portion? No - return a clean
    JSON-serializable copy of the full effective table, ready for settings storage."""
    return _load_conversions(config_obj)


def convert_reference_price(
    price: float,
    from_unit: str,
    to_unit: str,
    conversions: Optional[dict] = None,
) -> Tuple[Optional[float], bool]:
    """Convert `price` (per `from_unit`) into `per to_unit`.

    Returns (converted_price, base_from) where base_from is the canonical unit of
    `from_unit` (for transparency, e.g. converting from 'karung' reports the base 'kg').
    Returns (None, None) when no conversion path exists.
    """
    table = _load_conversions(conversions)
    f = canonicalize_unit(from_unit)
    t = canonicalize_unit(to_unit)

    f_info = table.get(f)
    t_info = table.get(t)
    if not f_info or not t_info or f_info["factor"] <= 0 or t_info["factor"] <= 0:
        return None, None
    # Only convertible when they share a base unit.
    if f_info["base"] != t_info["base"]:
        return None, None
    # price per from_unit -> price per base -> price per to_unit
    # factor = base units per 1 unit (e.g. 'karung' 25 kg => price/25 -> per kg)
    per_base = price / f_info["factor"]
    per_to = per_base * t_info["factor"]
    return per_to, f_info["base"]


def units_equivalent(u1: str, u2: str, conversions: Optional[dict] = None) -> bool:
    table = _load_conversions(conversions)
    a = canonicalize_unit(u1)
    b = canonicalize_unit(u2)
    if not a or not b:
        return a == b
    fi = table.get(a)
    ti = table.get(b)
    if not fi or not ti:
        return a == b
    return fi["base"] == ti["base"]


def same_unit(u1: str, u2: str) -> bool:
    return canonicalize_unit(u1) == canonicalize_unit(u2)