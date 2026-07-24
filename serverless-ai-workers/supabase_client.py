import os
from typing import Dict, Any, Optional

from supabase import create_client, Client


_supabase_client: Optional[Client] = None


def get_supabase() -> Client:
    global _supabase_client

    if _supabase_client is None:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_KEY")

        if not url or not key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY are required")

        _supabase_client = create_client(url, key)

    return _supabase_client


def update_audit_log(log_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
    supabase = get_supabase()

    result = (
        supabase.table("audit_logs")
        .update(updates)
        .eq("id", log_id)
        .execute()
    )

    return result.data[0] if result.data else None


def insert_violation(violation: Dict[str, Any]) -> Dict[str, Any]:
    supabase = get_supabase()

    result = (
        supabase.table("violations")
        .insert(violation)
        .execute()
    )

    return result.data[0] if result.data else None


def get_audit_log(log_id: str) -> Optional[Dict[str, Any]]:
    supabase = get_supabase()

    result = (
        supabase.table("audit_logs")
        .select("*")
        .eq("id", log_id)
        .execute()
    )

    return result.data[0] if result.data else None


def get_org_by_api_key(api_key: str) -> Optional[Dict[str, Any]]:
    supabase = get_supabase()

    result = supabase.rpc("get_org_by_api_key", {"p_api_key": api_key}).execute()

    return result.data[0] if result.data else None


def submit_audit_log(
    org_id: str,
    source_identifier: str,
    raw_content: str
) -> Optional[str]:
    supabase = get_supabase()

    result = supabase.rpc(
        "submit_audit_log",
        {
            "p_org_id": org_id,
            "p_source_identifier": source_identifier,
            "p_raw_content": raw_content
        }
    ).execute()

    return result.data if result.data else None
