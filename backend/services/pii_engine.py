from presidio_analyzer import AnalyzerEngine, PatternRecognizer, Pattern
from presidio_anonymizer import AnonymizerEngine
from presidio_anonymizer.entities import OperatorConfig
import hashlib
import re
import io


# ---------------------------------------------------------------------------
# Initialize Presidio with custom Indian PII recognizers
# ---------------------------------------------------------------------------

# Custom: Aadhaar Number (4 digits, space, 4 digits, space, 4 digits)
aadhaar_pattern = Pattern(
    name="aadhaar_pattern",
    regex=r"\b\d{4}\s\d{4}\s\d{4}\b",
    score=0.9,
)
aadhaar_recognizer = PatternRecognizer(
    supported_entity="AADHAAR_NUMBER",
    patterns=[aadhaar_pattern],
    supported_language="en",
)

# Custom: PAN Number (5 uppercase letters, 4 digits, 1 uppercase letter)
pan_pattern = Pattern(
    name="pan_pattern",
    regex=r"\b[A-Z]{5}[0-9]{4}[A-Z]\b",
    score=0.9,
)
pan_recognizer = PatternRecognizer(
    supported_entity="PAN_NUMBER",
    patterns=[pan_pattern],
    supported_language="en",
)

# Build analyzer with custom recognizers
analyzer = AnalyzerEngine()
analyzer.registry.add_recognizer(aadhaar_recognizer)
analyzer.registry.add_recognizer(pan_recognizer)

anonymizer = AnonymizerEngine()


# ---------------------------------------------------------------------------
# Supported entities
# ---------------------------------------------------------------------------
SUPPORTED_ENTITIES = [
    "PERSON",
    "EMAIL_ADDRESS",
    "PHONE_NUMBER",
    "IP_ADDRESS",
    "AADHAAR_NUMBER",
    "PAN_NUMBER",
]


# ---------------------------------------------------------------------------
# PII counting (for upload scan)
# ---------------------------------------------------------------------------
def count_pii(text: str) -> int:
    """Count total PII entities found in text."""
    results = analyzer.analyze(text=text, entities=SUPPORTED_ENTITIES, language="en")
    return len(results)


# ---------------------------------------------------------------------------
# Anonymization operators by method
# ---------------------------------------------------------------------------
def _get_operators(method: str) -> dict:
    """Return Presidio operator configs for the given sanitization method."""
    redact_op = OperatorConfig("replace", {"new_value": "[REDACTED]"})
    mask_op = OperatorConfig("mask", {"type": "mask", "masking_char": "*", "chars_to_mask": 8, "from_end": False})
    hash_op = OperatorConfig("hash", {"hash_type": "sha256"})

    if method == "smart":
        critical_entities = ["AADHAAR_NUMBER", "PAN_NUMBER", "IP_ADDRESS"]
        return {
            entity: (redact_op if entity in critical_entities else mask_op)
            for entity in SUPPORTED_ENTITIES
        }

    if method == "redaction":
        op = redact_op
    elif method == "tokenization":
        op = hash_op
    else:  # masking (default)
        op = mask_op
    
    return {entity: op for entity in SUPPORTED_ENTITIES}


# ---------------------------------------------------------------------------
# Text anonymization
# ---------------------------------------------------------------------------
def anonymize_text(text: str, method: str = "masking") -> str:
    """Run Presidio analysis + anonymization on plain text."""
    results = analyzer.analyze(text=text, entities=SUPPORTED_ENTITIES, language="en")
    operators = _get_operators(method)
    anonymized = anonymizer.anonymize(text=text, analyzer_results=results, operators=operators)
    return anonymized.text


# ---------------------------------------------------------------------------
# SQL anonymization using sqlparse
# Properly parses INSERT statements and only sanitizes string values
# without breaking SQL syntax.
# ---------------------------------------------------------------------------
def anonymize_sql(sql_text: str, method: str = "masking") -> str:
    """Parse SQL with sqlparse, sanitize PII inside string literals of
    INSERT/UPDATE statements while preserving SQL syntax."""
    import sqlparse
    from sqlparse.sql import Statement, Parenthesis, Values
    from sqlparse.tokens import String as TString, Punctuation, DML

    parsed = sqlparse.parse(sql_text)
    output_parts: list[str] = []

    for statement in parsed:
        new_tokens: list[str] = []
        is_insert = False
        in_values = False

        for token in statement.flatten():
            # Detect INSERT keyword
            if token.ttype is DML and token.normalized == "INSERT":
                is_insert = True

            # Detect VALUES keyword
            if is_insert and token.ttype is sqlparse.tokens.Keyword and token.normalized == "VALUES":
                in_values = True

            # Sanitize string literals inside VALUES(...)
            if in_values and token.ttype in (TString.Single, TString.Symbol):
                # Strip outer quotes, sanitize the value, re-quote
                raw_value = token.value.strip("'")
                sanitized_value = anonymize_text(raw_value, method)
                new_tokens.append(f"'{sanitized_value}'")
                continue

            new_tokens.append(token.value)

        output_parts.append("".join(new_tokens))

    return "\n".join(output_parts)


# ---------------------------------------------------------------------------
# SQL PII counting — extract string literals from INSERT VALUES and count PII
# ---------------------------------------------------------------------------
def count_pii_in_sql(sql_text: str) -> int:
    """Count PII in string literals of SQL INSERT statements."""
    import sqlparse
    from sqlparse.tokens import String as TString, DML

    total = 0
    parsed = sqlparse.parse(sql_text)

    for statement in parsed:
        is_insert = False
        in_values = False
        for token in statement.flatten():
            if token.ttype is DML and token.normalized == "INSERT":
                is_insert = True
            if is_insert and token.ttype is sqlparse.tokens.Keyword and token.normalized == "VALUES":
                in_values = True
            if in_values and token.ttype in (TString.Single, TString.Symbol):
                raw_value = token.value.strip("'")
                total += count_pii(raw_value)

    return total


# ---------------------------------------------------------------------------
# PDF text extraction using PyMuPDF with bounding box coordinates
# ---------------------------------------------------------------------------
def extract_pdf_text_with_positions(raw_bytes: bytes) -> list[dict]:
    """Extract text spans from PDF with bounding box coordinates.
    Returns list of {text, bbox, page} dicts."""
    import fitz  # PyMuPDF

    doc = fitz.open(stream=raw_bytes, filetype="pdf")
    spans = []

    for page_num, page in enumerate(doc):
        # Use "dict" output for detailed span-level text + bbox
        blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)["blocks"]
        for block in blocks:
            if block.get("type") != 0:  # skip image blocks
                continue
            for line in block.get("lines", []):
                for span in line.get("spans", []):
                    text = span.get("text", "").strip()
                    if text:
                        spans.append({
                            "text": text,
                            "bbox": span["bbox"],  # (x0, y0, x1, y1)
                            "page": page_num,
                            "font": span.get("font", ""),
                            "size": span.get("size", 0),
                        })

    doc.close()
    return spans


# ---------------------------------------------------------------------------
# PDF anonymization using PyMuPDF bounding boxes
# ---------------------------------------------------------------------------
def anonymize_pdf(raw_bytes: bytes, method: str = "masking") -> bytes:
    """Read PDF, extract text spans with bounding boxes, find PII,
    and redact the precise bounding box areas. Returns sanitized PDF bytes."""
    import fitz  # PyMuPDF

    doc = fitz.open(stream=raw_bytes, filetype="pdf")

    for page_num, page in enumerate(doc):
        # Get text blocks with bounding boxes
        blocks = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)["blocks"]

        for block in blocks:
            if block.get("type") != 0:
                continue
            for line in block.get("lines", []):
                # Combine all span text in the line for better PII detection
                line_text = "".join(s.get("text", "") for s in line.get("spans", []))
                if not line_text.strip():
                    continue

                # Analyze PII in the full line text
                results = analyzer.analyze(
                    text=line_text, entities=SUPPORTED_ENTITIES, language="en"
                )
                if not results:
                    continue

                # Map each PII result back to the specific span(s) containing it
                for result in results:
                    pii_text = line_text[result.start:result.end]

                    # Search for the PII text within span bounding boxes
                    char_offset = 0
                    for span in line.get("spans", []):
                        span_text = span.get("text", "")
                        span_start = char_offset
                        span_end = char_offset + len(span_text)

                        # Check if this span overlaps with the PII range
                        if span_end > result.start and span_start < result.end:
                            bbox = fitz.Rect(span["bbox"])

                            sanitized = anonymize_text(pii_text, method)
                            if sanitized == "[REDACTED]":
                                page.add_redact_annot(
                                    bbox,
                                    text="[REDACTED]",
                                    fontsize=span.get("size", 10) * 0.8,
                                    fill=(0, 0, 0),
                                    text_color=(1, 1, 1)
                                )
                            else:
                                page.add_redact_annot(
                                    bbox,
                                    text=sanitized,
                                    fontsize=span.get("size", 10) * 0.8,
                                    fill=(1, 1, 1),  # white bg
                                )

                        char_offset = span_end

        page.apply_redactions()

    output = io.BytesIO()
    doc.save(output)
    doc.close()
    return output.getvalue()


# ---------------------------------------------------------------------------
# DOCX anonymization (sanitize paragraph/table text in memory)
# ---------------------------------------------------------------------------
def anonymize_docx(raw_bytes: bytes, method: str = "masking") -> bytes:
    """Read DOCX, sanitize paragraphs and table cells, return bytes."""
    from docx import Document

    doc = Document(io.BytesIO(raw_bytes))

    # Sanitize paragraphs
    for paragraph in doc.paragraphs:
        if paragraph.text.strip():
            sanitized = anonymize_text(paragraph.text, method)
            for run in paragraph.runs:
                run.text = ""
            if paragraph.runs:
                paragraph.runs[0].text = sanitized

    # Sanitize table cells
    for table in doc.tables:
        for row in table.rows:
            for cell in row.cells:
                if cell.text.strip():
                    sanitized = anonymize_text(cell.text, method)
                    for paragraph in cell.paragraphs:
                        for run in paragraph.runs:
                            run.text = ""
                        if paragraph.runs:
                            paragraph.runs[0].text = sanitized

    output = io.BytesIO()
    doc.save(output)
    return output.getvalue()
