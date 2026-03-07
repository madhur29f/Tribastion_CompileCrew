"""
Content Disarm & Reconstruction (CDR) Service.

Strips potentially malicious payloads (JavaScript, macros, embedded files)
from documents before they are moved to clean storage.
"""

import os
import logging
import zipfile
import shutil
import tempfile
from pathlib import Path

logger = logging.getLogger("securedata-siem")


def sanitize_pdf(file_path: str) -> dict:
    """
    Open a PDF and strip dangerous elements:
      - /JS and /JavaScript actions (embedded JavaScript)
      - /Launch actions (can execute programs)
      - /URI actions with suspicious schemes
      - /EmbeddedFiles (attached executables)

    Overwrites the file in-place with the sanitized version.
    Returns a dict with stats about what was removed.
    """
    import pikepdf

    stats = {
        "js_removed": 0,
        "launch_removed": 0,
        "embedded_files_removed": 0,
        "uri_actions_removed": 0,
    }

    try:
        pdf = pikepdf.open(file_path, allow_overwriting_input=True)

        # --- Strip document-level JavaScript ---
        root = pdf.Root

        # Remove /Names -> /JavaScript
        if "/Names" in root:
            names = root["/Names"]
            if "/JavaScript" in names:
                del names["/JavaScript"]
                stats["js_removed"] += 1
                logger.info(f"CDR: Removed /Names/JavaScript from {file_path}")

        # Remove /OpenAction if it contains JS
        if "/OpenAction" in root:
            open_action = root["/OpenAction"]
            if isinstance(open_action, pikepdf.Dictionary):
                action_type = str(open_action.get("/S", ""))
                if action_type in ("/JavaScript", "/JS"):
                    del root["/OpenAction"]
                    stats["js_removed"] += 1
                    logger.info(f"CDR: Removed /OpenAction JS from {file_path}")

        # Remove /EmbeddedFiles
        if "/Names" in root:
            names = root["/Names"]
            if "/EmbeddedFiles" in names:
                del names["/EmbeddedFiles"]
                stats["embedded_files_removed"] += 1
                logger.info(f"CDR: Removed /EmbeddedFiles from {file_path}")

        # --- Scan all pages for per-page actions ---
        for page_num, page in enumerate(pdf.pages):
            # Remove /AA (Additional Actions) on the page
            if "/AA" in page:
                del page["/AA"]
                stats["js_removed"] += 1

            # Scan annotations for malicious actions
            if "/Annots" in page:
                annots = page["/Annots"]
                clean_annots = []
                for annot in annots:
                    try:
                        annot_obj = annot if isinstance(annot, pikepdf.Dictionary) else pdf.get_object(annot)
                        action = annot_obj.get("/A", None)
                        if action and isinstance(action, pikepdf.Dictionary):
                            action_type = str(action.get("/S", ""))
                            if action_type in ("/JavaScript", "/JS"):
                                stats["js_removed"] += 1
                                continue  # skip this annotation
                            elif action_type == "/Launch":
                                stats["launch_removed"] += 1
                                continue
                            elif action_type == "/URI":
                                uri = str(action.get("/URI", ""))
                                if any(scheme in uri.lower() for scheme in ["javascript:", "data:", "file:"]):
                                    stats["uri_actions_removed"] += 1
                                    continue
                        clean_annots.append(annot)
                    except Exception:
                        clean_annots.append(annot)

                if len(clean_annots) != len(annots):
                    page["/Annots"] = clean_annots

        pdf.save(file_path)
        pdf.close()

        total_removed = sum(stats.values())
        if total_removed > 0:
            logger.info(
                f"CDR: PDF sanitization complete — {total_removed} threats neutralized",
                extra={
                    "event_type": "CDR_PDF_Sanitized",
                    "file": file_path,
                    **stats,
                },
            )
        else:
            logger.info(
                f"CDR: PDF is clean — no threats found",
                extra={"event_type": "CDR_PDF_Clean", "file": file_path},
            )

        return stats

    except Exception as e:
        logger.error(
            f"CDR: PDF sanitization failed: {e}",
            extra={"event_type": "CDR_PDF_Error", "file": file_path, "error": str(e)},
        )
        return stats


def sanitize_docx(file_path: str) -> dict:
    """
    Strip VBA macros from DOCX files.

    DOCX files are ZIP archives. Macro-enabled docs (.docm) contain
    a `vbaProject.bin` file inside the zip. This function:
      1. Opens the DOCX as a ZIP
      2. Removes `vbaProject.bin` and related macro files
      3. Updates [Content_Types].xml to remove macro references
      4. Saves the clean version back

    Returns stats about what was removed.
    """
    stats = {"macros_removed": 0, "activex_removed": 0}

    macro_patterns = ["vbaProject.bin", "vbaData.xml", "activeX"]

    try:
        temp_dir = tempfile.mkdtemp()
        clean_path = os.path.join(temp_dir, "clean.docx")

        with zipfile.ZipFile(file_path, "r") as zin:
            with zipfile.ZipFile(clean_path, "w", zipfile.ZIP_DEFLATED) as zout:
                for item in zin.infolist():
                    # Skip macro/ActiveX files
                    is_malicious = False
                    for pattern in macro_patterns:
                        if pattern.lower() in item.filename.lower():
                            is_malicious = True
                            if "vba" in item.filename.lower():
                                stats["macros_removed"] += 1
                            else:
                                stats["activex_removed"] += 1
                            logger.info(f"CDR: Stripped {item.filename} from DOCX")
                            break

                    if not is_malicious:
                        data = zin.read(item.filename)

                        # Clean [Content_Types].xml to remove macro references
                        if item.filename == "[Content_Types].xml":
                            content = data.decode("utf-8")
                            # Remove content type entries for macros
                            import re
                            content = re.sub(
                                r'<Override[^>]*PartName="[^"]*vba[^"]*"[^>]*/>\s*',
                                "",
                                content,
                                flags=re.IGNORECASE,
                            )
                            content = re.sub(
                                r'<Override[^>]*PartName="[^"]*activeX[^"]*"[^>]*/>\s*',
                                "",
                                content,
                                flags=re.IGNORECASE,
                            )
                            data = content.encode("utf-8")

                        zout.writestr(item, data)

        # Replace original file with clean version
        shutil.move(clean_path, file_path)
        shutil.rmtree(temp_dir, ignore_errors=True)

        total_removed = sum(stats.values())
        if total_removed > 0:
            logger.info(
                f"CDR: DOCX sanitization complete — {total_removed} threats neutralized",
                extra={
                    "event_type": "CDR_DOCX_Sanitized",
                    "file": file_path,
                    **stats,
                },
            )
        else:
            logger.info(
                f"CDR: DOCX is clean — no macros found",
                extra={"event_type": "CDR_DOCX_Clean", "file": file_path},
            )

        return stats

    except Exception as e:
        logger.error(
            f"CDR: DOCX sanitization failed: {e}",
            extra={"event_type": "CDR_DOCX_Error", "file": file_path, "error": str(e)},
        )
        return stats
