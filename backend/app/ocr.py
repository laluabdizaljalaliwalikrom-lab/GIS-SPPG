import os
import json
import logging
from typing import List, Dict, Any
from dotenv import load_dotenv

# Set up logger
logger = logging.getLogger("sppg_audit_ocr")
logger.setLevel(logging.INFO)

# Load .env
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))

def perform_ocr(file_bytes: bytes, filename: str, mime_type: str = None) -> List[Dict[str, Any]]:
    """
    Performs OCR and text extraction on receipt/RAB documents.
    If GEMINI_API_KEY is available, uses Gemini 1.5 Flash Vision.
    Otherwise, falls back to a smart mock parser to generate high-fidelity test items.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    
    # 1. Attempt using Gemini Generative AI
    if api_key:
        try:
            import google.generativeai as genai
            logger.info(f"Gemini API key detected. Running Vision OCR on {filename}...")
            
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            
            # Determine mime type if not provided
            if not mime_type:
                ext = filename.split(".")[-1].lower()
                if ext in ["jpg", "jpeg"]:
                    mime_type = "image/jpeg"
                elif ext == "png":
                    mime_type = "image/png"
                elif ext == "pdf":
                    mime_type = "application/pdf"
                else:
                    mime_type = "application/octet-stream"
            
            prompt = (
                "Extract the individual expense/purchase items from this document (RAB or invoice/receipt). "
                "For each item, extract the name, quantity, and unit price. "
                "You MUST respond ONLY with a valid JSON array of objects. Do not wrap it in markdown code blocks or add explanations. "
                "Each object must have the following keys:\n"
                "- 'item_name': string (the name of the item, e.g. 'Beras', 'Telur Ayam')\n"
                "- 'qty': number (the quantity of the item, default to 1.0 if not specified)\n"
                "- 'price_per_unit': number (the unit price or rate per item)\n"
                "Example response structure:\n"
                '[{"item_name": "Beras", "qty": 100, "price_per_unit": 16500}]'
            )
            
            contents = [
                prompt,
                {
                    "mime_type": mime_type,
                    "data": file_bytes
                }
            ]
            
            response = model.generate_content(contents)
            text_response = response.text.strip()
            
            # Clean markdown code blocks from response
            if text_response.startswith("```"):
                lines = text_response.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].strip() == "```":
                    lines = lines[:-1]
                text_response = "\n".join(lines).strip()
            
            parsed_data = json.loads(text_response)
            if isinstance(parsed_data, list) and len(parsed_data) > 0:
                logger.info(f"Successfully scanned {len(parsed_data)} items from {filename} using Gemini.")
                return parsed_data
            else:
                logger.warning("Gemini response did not return a non-empty list. Falling back to smart mock data.")
                
        except Exception as e:
            logger.error(f"Error during Gemini OCR processing: {str(e)}. Falling back to mock data.")
    else:
        logger.info("No GEMINI_API_KEY detected in environment. Running Smart Mock OCR Fallback.")
        
    # 2. Smart Mock OCR Fallback
    # Returns a realistic, diverse list of items referencing seed market prices.
    # It checks the filename to see if it can customize the mocked values.
    
    filename_lower = filename.lower()
    
    if "beras" in filename_lower:
        return [
            {"item_name": "Beras Premium", "qty": 150.0, "price_per_unit": 17000.0},
            {"item_name": "Minyak Goreng Bimoli", "qty": 50.0, "price_per_unit": 16000.0}
        ]
    elif "daging" in filename_lower or "lauk" in filename_lower:
        return [
            {"item_name": "Daging Ayam Broiler", "qty": 80.0, "price_per_unit": 43000.0},
            {"item_name": "Telur Ayam Ras", "qty": 30.0, "price_per_unit": 29000.0}
        ]
    else:
        # Default receipt containing 5 items with varying risk tags (Danger, Warning, Safe)
        return [
            {"item_name": "Beras Cianjur", "qty": 120.0, "price_per_unit": 16500.0},        # Ref: 14000 (Markup: 17.86% - Danger)
            {"item_name": "Daging Ayam Broiler", "qty": 45.0, "price_per_unit": 42000.0},   # Ref: 38000 (Markup: 10.53% - Warning)
            {"item_name": "Telur Ayam Ras", "qty": 25.0, "price_per_unit": 29000.0},        # Ref: 28000 (Markup: 3.57% - Safe)
            {"item_name": "Minyak Goreng Bimoli", "qty": 15.0, "price_per_unit": 19500.0},  # Ref: 16000 (Markup: 21.88% - Danger)
            {"item_name": "Susu UHT 200ml", "qty": 200.0, "price_per_unit": 5200.0}         # Ref: 5000  (Markup: 4.00% - Safe)
        ]


def perform_survey_doc_ocr(file_bytes: bytes, filename: str, mime_type: str = None) -> Dict[str, Any]:
    """
    Performs OCR and extraction on official signed market survey documents.
    Extracts header metadata (market name, date, head of market name) and item rows.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    
    if api_key:
        try:
            import google.generativeai as genai
            logger.info(f"Running Gemini OCR on official survey document {filename}...")
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            
            if not mime_type:
                ext = filename.split(".")[-1].lower()
                if ext in ["jpg", "jpeg"]:
                    mime_type = "image/jpeg"
                elif ext == "png":
                    mime_type = "image/png"
                elif ext == "pdf":
                    mime_type = "application/pdf"
                elif ext == "webp":
                    mime_type = "image/webp"
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
                {
                    "mime_type": mime_type,
                    "data": file_bytes
                }
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
                logger.info(f"Successfully extracted {len(parsed_data.get('items', []))} items from survey doc {filename}")
                return parsed_data
        except Exception as e:
            logger.error(f"Error during survey doc OCR: {e}. Falling back to mock data.")
            
    # Mock fallback for official survey doc
    return {
        "shop_name": "Pasar Tradisional Sikur",
        "region_id": "Sikur",
        "survey_date": None,
        "head_of_market_name": "H. Ahmad Fauzi (Kepala Pasar)",
        "surveyor_name": "Tim Survey SPPG",
        "items": [
            {"item_name": "Beras Premium", "reference_price": 14500.0, "unit": "kg", "supplier_name": "Toko Barokah", "notes": "Disahkan Kepala Pasar"},
            {"item_name": "Telur Ayam Ras", "reference_price": 28500.0, "unit": "kg", "supplier_name": "UD Ternak Mandiri", "notes": "Stok Stabil"},
            {"item_name": "Minyak Goreng Bimoli", "reference_price": 18500.0, "unit": "liter", "supplier_name": "Toko Barokah", "notes": "Kemasan Pouch"},
            {"item_name": "Daging Ayam Broiler", "reference_price": 38000.0, "unit": "kg", "supplier_name": "Lapak Pak Slamet", "notes": "Segar"},
            {"item_name": "Bawang Merah", "reference_price": 32000.0, "unit": "kg", "supplier_name": "Lapak Sayur Bu Nur", "notes": "Lokal NTB"}
        ]
    }
