"""
VirusTotal Privacy-First Hash-Check Client.

This service NEVER uploads actual file contents to VirusTotal.
It only sends the SHA-256 hash for lookup, preserving user privacy
in compliance with the DPDP Act.
"""

import hashlib
import logging
from typing import Optional

import httpx

from config import VIRUSTOTAL_API_KEY

logger = logging.getLogger("securedata-siem")

VT_API_BASE = "https://www.virustotal.com/api/v3"


class VirusTotalClient:
    """Async VirusTotal client — hash-check only, never uploads files."""

    def __init__(self, api_key: Optional[str] = None):
        self._api_key_override = api_key

    @property
    def api_key(self) -> str:
        """Resolve API key lazily so .env is loaded before we read it."""
        return self._api_key_override or VIRUSTOTAL_API_KEY

    @property
    def enabled(self) -> bool:
        key = self.api_key
        return bool(key and key != "your_virustotal_api_key_here")

    @staticmethod
    def compute_sha256(data: bytes) -> str:
        """Compute SHA-256 hash of file bytes."""
        return hashlib.sha256(data).hexdigest()

    async def check_file_hash(self, sha256: str) -> dict:
        """
        Query VirusTotal for a file hash.
        Returns: { safe: bool, malicious: int, suspicious: int, skipped: bool, raw: dict }
        """
        if not self.enabled:
            logger.warning(
                f"VirusTotal check skipped — no API key configured (key='{self.api_key[:8]}...' if key else 'empty')",
                extra={"event_type": "VT_Scan_Skipped", "file_hash": sha256},
            )
            return {
                "safe": True,
                "malicious": 0,
                "suspicious": 0,
                "skipped": True,
                "raw": {},
            }

        headers = {"x-apikey": self.api_key}
        url = f"{VT_API_BASE}/files/{sha256}"

        logger.info(
            f"VirusTotal: querying hash {sha256[:16]}... (API key: {self.api_key[:8]}...)",
            extra={"event_type": "VT_Query_Start", "file_hash": sha256},
        )

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(url, headers=headers)

                if response.status_code == 404:
                    # Hash not in VT database — treat as unknown/safe
                    logger.info(
                        f"VirusTotal: hash not found (file not in VT database)",
                        extra={
                            "event_type": "VT_Hash_Not_Found",
                            "file_hash": sha256,
                        },
                    )
                    return {
                        "safe": True,
                        "malicious": 0,
                        "suspicious": 0,
                        "skipped": False,
                        "raw": {"status": "not_found"},
                    }

                response.raise_for_status()
                data = response.json()

                stats = data.get("data", {}).get("attributes", {}).get(
                    "last_analysis_stats", {}
                )
                malicious = stats.get("malicious", 0)
                suspicious = stats.get("suspicious", 0)

                is_safe = malicious == 0 and suspicious == 0

                logger.info(
                    f"VirusTotal scan result: malicious={malicious}, suspicious={suspicious}",
                    extra={
                        "event_type": "VT_Scan_Complete",
                        "file_hash": sha256,
                        "malicious_count": malicious,
                        "suspicious_count": suspicious,
                        "verdict": "clean" if is_safe else "threat_detected",
                    },
                )

                return {
                    "safe": is_safe,
                    "malicious": malicious,
                    "suspicious": suspicious,
                    "skipped": False,
                    "raw": stats,
                }

            except httpx.HTTPStatusError as e:
                logger.error(
                    f"VirusTotal API error: {e.response.status_code}",
                    extra={
                        "event_type": "VT_API_Error",
                        "file_hash": sha256,
                        "status_code": e.response.status_code,
                    },
                )
                # On API error, fail open (allow upload) but log the issue
                return {
                    "safe": True,
                    "malicious": 0,
                    "suspicious": 0,
                    "skipped": True,
                    "raw": {"error": str(e)},
                }
            except Exception as e:
                logger.error(
                    f"VirusTotal connection error: {e}",
                    extra={"event_type": "VT_Connection_Error", "file_hash": sha256},
                )
                return {
                    "safe": True,
                    "malicious": 0,
                    "suspicious": 0,
                    "skipped": True,
                    "raw": {"error": str(e)},
                }


# Module-level singleton
vt_client = VirusTotalClient()
