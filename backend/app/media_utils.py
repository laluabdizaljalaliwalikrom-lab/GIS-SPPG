import io
import os
import uuid
import logging
from typing import Tuple
from PIL import Image

logger = logging.getLogger("sppg_media_utils")
logger.setLevel(logging.INFO)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "../static/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def compress_and_save_image(
    file_bytes: bytes,
    original_filename: str,
    mime_type: str = None,
    max_dimension: int = 1600,
    quality: int = 80,
    output_format: str = "WEBP"
) -> Tuple[str, bytes, str]:
    """
    Compresses an image file in memory, converting to WebP/JPEG with max dimension capping.
    Returns:
        (saved_path_or_url, final_compressed_bytes, final_filename)
    """
    ext = original_filename.split(".")[-1].lower() if "." in original_filename else "jpg"
    unique_base = str(uuid.uuid4())
    
    # If not an image (e.g. PDF document), return original bytes with unique name
    if ext == "pdf" or (mime_type and "pdf" in mime_type):
        unique_filename = f"{unique_base}.pdf"
        return unique_filename, file_bytes, "application/pdf"
    
    try:
        image = Image.open(io.BytesIO(file_bytes))
        
        # Handle RGBA to RGB conversion for formats like JPEG
        if output_format.upper() in ["JPEG", "JPG"] and image.mode in ("RGBA", "P"):
            image = image.convert("RGB")
        elif image.mode not in ("RGB", "RGBA"):
            image = image.convert("RGB")
            
        # Resize if dimensions exceed max_dimension while keeping aspect ratio
        w, h = image.size
        if max(w, h) > max_dimension:
            scale = max_dimension / float(max(w, h))
            new_w = int(w * scale)
            new_h = int(h * scale)
            image = image.resize((new_w, new_h), Image.Resampling.LANCZOS)
            
        output_buffer = io.BytesIO()
        
        # Save as WebP by default for maximum compression efficiency
        if output_format.upper() == "WEBP":
            image.save(output_buffer, format="WEBP", quality=quality, method=6)
            out_ext = "webp"
            out_mime = "image/webp"
        else:
            image.save(output_buffer, format="JPEG", quality=quality, optimize=True)
            out_ext = "jpg"
            out_mime = "image/jpeg"
            
        compressed_bytes = output_buffer.getvalue()
        
        # If compressed is larger than original for some reason, use original
        if len(compressed_bytes) >= len(file_bytes) and ext in ["webp", "jpg", "jpeg", "png"]:
            unique_filename = f"{unique_base}.{ext}"
            return unique_filename, file_bytes, mime_type or f"image/{ext}"
            
        unique_filename = f"{unique_base}.{out_ext}"
        return unique_filename, compressed_bytes, out_mime
        
    except Exception as e:
        logger.warning(f"Error compressing image: {e}. Falling back to original bytes.")
        unique_filename = f"{unique_base}.{ext}"
        return unique_filename, file_bytes, mime_type or "application/octet-stream"
