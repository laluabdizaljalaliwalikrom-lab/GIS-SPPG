import os
import re
import json
import tempfile
import subprocess
import logging
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

# Set up logger
logger = logging.getLogger("sppg_audit_ocr")
logger.setLevel(logging.INFO)

# Load .env
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

_SKIP_LINES = re.compile(
    r"^(total\b|subtotal\b|jumlah\b|ppn|pajak|diskon|terbilang|dibayar|"
    r"tunai|kembali|kasir|nota\b|tanggal|alamat|uraian|keterangan|satuan|"
    r"harga|laporan|rapat|agenda|belanja|no\b)",
    re.IGNORECASE,
)

_RE_UNIT_TABLE = re.compile(
    r"^\s*([A-Za-z][\w&.\-\' ]{2,60}?)\s+(\d+(?:[.,]\d+)?)\s*"
    r"([A-Za-z]{1,12})\s+[@x×/]\s*(?:Rp\.?\s*)?([\d.,]+)",
    re.IGNORECASE,
)

_RE_QTY_UNIT = re.compile(
    r"^\s*([A-Za-z][\w&.\-\' ]{2,60}?)\s+(\d+(?:[.,]\d+)?)\s*"
    r"([A-Za-z]{1,12})\s+(?:Rp\.?\s*)?([\d.,]+)\s*$",
    re.IGNORECASE,
)

_RE_SIMPLE_PRICE = re.compile(
    r"^\s*([A-Za-z][\w&.\-\' ]{2,60}?)\s+(?:Rp\.?\s*)?([\d.,]+)\s*$",
    re.IGNORECASE,
)

# Leading item-index token like '1.', '2)', '3 ' at the start of a table row
_RE_LEADING_INDEX = re.compile(r"^\s*\d+[).\-]?\s+")

_UNITS_ALT = (
    r"kg|kilogram|gram|gr|liter|litre|l|ml|cc|pcs|pc|pack|dus|box|karton|"
    r"karung|zak|butir|ekor|buah|bungkus|sachet|pouch|kaleng|botol|koli|"
    r"lusin|kodi|gross|ikat|renceng|strip|rim|ton|kwintal|tray|porsi|kotak"
)

# Trailing qty+unit like '100 kg' / '100kg' / '1 Liter' at the end of a name
_TRAILING_QTY_UNIT = re.compile(
    r"(?:\s+\d[\d.,]*)?\s*(?:" + _UNITS_ALT + r")\b\.?\s*$",
    re.IGNORECASE,
)


def _parse_number(value: Any) -> Optional[float]:
    """Parse Indonesian-style number ('17.500', '17,5', '12.500,50') to float."""
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    t = str(value).strip().replace("Rp", "").replace("rp", "").replace("\u00a0", " ").replace(" ", "")
    if not t or not re.search(r"\d", t):
        return None
    if "," in t:
        t = t.replace(".", "").replace(",", ".")
        try:
            return float(t)
        except ValueError:
            return None
    # Multiple dots -> thousands separator (e.g. 17.500 -> 17500)
    if t.count(".") > 1:
        t = t.replace(".", "")
        try:
            return float(t)
        except ValueError:
            return None
    # Single dot: treat as thousands separator if it looks like 1.500, decimal if 0.5/1.5
    if "." in t:
        parts = t.split(".")
        if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit() and len(parts[1]) == 3:
            t = parts[0] + parts[1]
    try:
        return float(t)
    except ValueError:
        return None


def _strip_trailing_unit(name: str) -> str:
    return _TRAILING_QTY_UNIT.sub("", name).strip()


def _normalize_items(raw_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Coerce/clean OCR items into {item_name, qty, price_per_unit, unit}."""
    out = []
    for it in raw_items:
        if not isinstance(it, dict):
            continue
        name = str(it.get("item_name") or it.get("name") or "").strip()
        if name:
            name = _strip_trailing_unit(name).strip()
        if not name:
            continue
        qty = _parse_number(it.get("qty")) or 1.0
        if qty <= 0:
            qty = 1.0
        price = _parse_number(it.get("price_per_unit") or it.get("price"))
        if price is None or price <= 0:
            continue
        unit = str(it.get("unit") or "").strip()
        out.append({
            "item_name": name,
            "qty": qty,
            "price_per_unit": price,
            "unit": unit or "kg",
        })
    return out


def _extract_json_array(text: str) -> Optional[list]:
    """Robustly extract the first JSON array from a Gemini response."""
    if not text:
        return None
    t = text.strip()
    if t.startswith("```"):
        t = t.split("\n", 1)[1] if "\n" in t else ""
        if t.rstrip().endswith("```"):
            t = t.rstrip()[:-3].rstrip()
    t = t.strip()
    start = t.find("[")
    if start == -1:
        try:
            data = json.loads(t)
            return data if isinstance(data, list) else None
        except (ValueError, json.JSONDecodeError):
            return None
    end = t.rfind("]")
    if end <= start:
        return None
    try:
        data = json.loads(t[start:end + 1])
        return data if isinstance(data, list) else None
    except (ValueError, json.JSONDecodeError):
        return None


def _gemini_extract(file_bytes: bytes, filename: str, mime_type: str, api_key: str) -> List[Dict[str, Any]]:
    import google.generativeai as genai
    logger.info(f"Running Gemini Vision OCR on {filename}...")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    if not mime_type:
        ext = filename.split(".")[-1].lower()
        if ext in ["jpg", "jpeg"]:
            mime_type = "image/jpeg"
        elif ext == "png":
            mime_type = "image/png"
        elif ext == "webp":
            mime_type = "image/webp"
        elif ext == "pdf":
            mime_type = "application/pdf"
        else:
            mime_type = "application/octet-stream"

    prompt = (
        "Extract the individual expense/purchase items from this document (RAB or invoice/receipt). "
        "For each item, extract the name, quantity, and unit price. "
        "Do NOT include the unit, brand, or packaging size inside the item_name "
        "(e.g. use 'Minyak Goreng' instead of 'Minyak Goreng Bimoli 1 Liter'). "
        "You MUST respond ONLY with a valid JSON array of objects. "
        "Do not wrap it in markdown code blocks or add explanations. "
        "Each object must have exactly these keys:\n"
        "- 'item_name': string (the name of the item, e.g. 'Beras', 'Telur Ayam')\n"
        "- 'qty': number (the quantity of the item, default to 1.0 if not specified)\n"
        "- 'price_per_unit': number (the unit price or rate per item in Rupiah)\n"
        "Example response structure:\n"
        '[{"item_name": "Beras", "qty": 100, "price_per_unit": 16500}]'
    )

    contents = [
        prompt,
        {"mime_type": mime_type, "data": file_bytes},
    ]

    response = model.generate_content(contents)
    text_response = response.text.strip()
    parsed = _extract_json_array(text_response)
    if isinstance(parsed, list) and len(parsed) > 0:
        normalized = _normalize_items(parsed)
        logger.info(f"Gemini extracted {len(normalized)} items from {filename}.")
        return normalized
    logger.warning("Gemini returned no parseable items.")
    return []


def _find_pdftotext() -> Optional[str]:
    env_bin = os.getenv("PDFTOTEXT_BIN")
    if env_bin and os.path.exists(env_bin):
        return env_bin
    which = subprocess.run(
        ["where", "pdftotext"], capture_output=True, text=True
    ) if os.name == "nt" else subprocess.run(
        ["which", "pdftotext"], capture_output=True, text=True
    )
    if which.returncode == 0 and which.stdout.strip():
        return which.stdout.strip().splitlines()[0].strip()
    # Common fallback location on Windows/Laragon (Git for Windows tools)
    candidates = [
        r"C:\laragon\bin\git\mingw64\bin\pdftotext.exe",
        r"C:\Program Files\poppler\bin\pdftotext.exe",
        "/usr/bin/pdftotext",
        "/usr/local/bin/pdftotext",
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return None


def _extract_pdf_text(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
    """Extract items from a text-based PDF using pdftotext (poppler) + RAB/nota table parser."""
    pdftotext_bin = _find_pdftotext()
    if not pdftotext_bin:
        logger.warning("pdftotext (poppler) not found; cannot extract text from PDF locally.")
        return []

    tmp_in = None
    try:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
            f.write(file_bytes)
            tmp_in = f.name
        proc = subprocess.run(
            [pdftotext_bin, "-layout", tmp_in, "-"],
            capture_output=True,
            text=True,
            timeout=90,
        )
        if proc.returncode != 0:
            logger.warning(f"pdftotext failed: {proc.stderr}")
            return []
        return _parse_rab_text(proc.stdout or "")
    except Exception as e:
        logger.error(f"Error extracting PDF text: {e}")
        return []
    finally:
        if tmp_in and os.path.exists(tmp_in):
            try:
                os.unlink(tmp_in)
            except OSError:
                pass


def _parse_rab_text(text: str) -> List[Dict[str, Any]]:
    items = []
    seen = set()
    unit_words = {
        "kg", "kilogram", "gram", "gr", "liter", "litre", "ml", "cc", "pcs", "pc",
        "pack", "dus", "box", "karton", "karung", "zak", "butir", "ekor", "buah",
        "bungkus", "sachet", "pouch", "kaleng", "botol", "koli", "lusin", "kodi",
        "gross", "ikat", "renceng", "strip", "rim", "ton", "kwintal", "tray",
        "porsi", "kotak", "pcs",
    }

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or _SKIP_LINES.match(line):
            continue
        # Skip table header rows (few words, no digits price in a meaningful position)
        if len(line.split()) < 2 or not re.search(r"\d", line):
            continue

        # Strip leading item index like '1. ', '2) ', '3 ' so the name regex stays anchored
        line = _RE_LEADING_INDEX.sub("", line).strip()

        match = _RE_UNIT_TABLE.match(line) or _RE_QTY_UNIT.match(line)
        price = None
        qty = 1.0
        unit = "kg"
        name = None

        if match:
            name = match.group(1).strip()
            qty = _parse_number(match.group(2)) or 1.0
            unit = match.group(3).lower()
            price = _parse_number(match.group(4))
        else:
            simple = _RE_SIMPLE_PRICE.match(line)
            if not simple:
                continue
            name = simple.group(1).strip()
            price = _parse_number(simple.group(2))

        if not name or not price or price <= 0:
            continue
        if unit not in unit_words:
            unit = "kg"
        name = _strip_trailing_unit(name).strip()

        key = (name.lower(), qty, price)
        if key in seen:
            continue
        seen.add(key)

        items.append({
            "item_name": name,
            "qty": qty,
            "price_per_unit": price,
            "unit": unit,
        })

    return items


def perform_ocr(file_bytes: bytes, filename: str, mime_type: str = None, api_key: str = None) -> List[Dict[str, Any]]:
    """
    Performs OCR and text extraction on receipt/RAB documents.
    1. If a Gemini API key is available (parameter or env), uses Gemini 1.5 Flash Vision.
    2. Otherwise, for PDFs, attempts local text extraction via pdftotext (poppler).
    3. Never fabricates mock items. If nothing can be extracted, returns [] so the
       caller can present a clear error to the user.
    """
    resolved_key = api_key or os.getenv("GEMINI_API_KEY")

    if resolved_key:
        try:
            items = _gemini_extract(file_bytes, filename, mime_type, resolved_key)
            if items:
                return items
            logger.warning(f"Gemini returned no items for {filename}; trying local extraction if PDF.")
        except Exception as e:
            logger.error(f"Error during Gemini OCR processing: {str(e)}")

    ext = (filename.split(".")[-1] or "").lower()
    if ext == "pdf":
        items = _extract_pdf_text(file_bytes, filename)
        if items:
            return items

    logger.info("No GEMINI_API_KEY configured and/or no local OCR path available. Returning no items.")
    return []


def perform_survey_doc_ocr(file_bytes: bytes, filename: str, mime_type: str = None, api_key: str = None) -> Dict[str, Any]:
    """
    Performs OCR and extraction on official signed market survey documents.
    Extracts header metadata (market name, date, head of market name) and item rows.
    Never fabricates mock data: on failure returns an object with an empty items list.
    """
    resolved_key = api_key or os.getenv("GEMINI_API_KEY")

    if resolved_key:
        try:
            import google.generativeai as genai
            logger.info(f"Running Gemini OCR on official survey document {filename}...")
            genai.configure(api_key=resolved_key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            if not mime_type:
                ext = filename.split(".")[-1].lower()
                if ext in ["jpg", "jpeg"]:
                    mime_type = "image/jpeg"
                elif ext == "png":
                    mime_type = "image/png"
                elif ext == "webp":
                    mime_type = "image/webp"
                elif ext == "pdf":
                    mime_type = "application/pdf"
                else:
                    mime_type = "application/octet-stream"

            prompt = (
                "You are an expert document OCR assistant. Extract data from this official market price survey document "
                "which has been verified/signed by the head of market (Kepala Pasar) or market surveyor. "
                "Respond ONLY with a valid JSON object without markdown formatting. "
                "The JSON object must have this exact structure:\n"
                "{\n"
                '  "shop_name": "string (name of market or shop, e.g. Pasar Sikur)",\n'
                '  "region_id": "string (district/region, e.g. Sikur)",\n'
                '  "survey_date": "YYYY-MM-DD (date of survey or null)",\n'
                '  "head_of_market_name": "string (name of head of market / pengesah who signed)",\n'
                '  "surveyor_name": "string (name of surveyor / petugas)",\n'
                '  "items": [\n'
                '    {\n'
                '      "item_name": "string (e.g. Beras Premium)",\n'
                '      "reference_price": number (price in Rupiah),\n'
                '      "unit": "string (e.g. kg, liter, butir, ikat)",\n'
                '      "supplier_name": "string or null",\n'
                '      "notes": "string or null"\n'
                '    }\n'
                '  ]\n'
                "}"
            )

            contents = [
                prompt,
                {"mime_type": mime_type, "data": file_bytes},
            ]

            response = model.generate_content(contents)
            text_response = response.text.strip()
            if text_response.startswith("```"):
                lines = text_response.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].strip() == "```":
                    lines = lines[:-1]
                text_response = "\n".join(lines).strip()

            parsed_data = json.loads(text_response)
            if isinstance(parsed_data, dict) and "items" in parsed_data:
                logger.info(f"Extracted {len(parsed_data.get('items', []))} items from survey doc {filename}")
                return parsed_data
        except Exception as e:
            logger.error(f"Error during survey doc OCR: {e}")

    return {"items": []}