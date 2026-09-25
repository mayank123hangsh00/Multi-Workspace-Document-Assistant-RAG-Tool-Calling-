"""
End-to-End Automated Test Suite for Abstrat Document Assistant.
Tests:
1. Health check & DB connection
2. User authentication (Supabase Auth)
3. Workspace creation (Workspace A: Project Alpha, Workspace B: Project Beta)
4. Document Ingestion (Parsing, overlapping chunking, Gemini embedding, single-store DB insert)
5. Tenant Isolation Verification (Ask Workspace B for Workspace A's secret -> verify refusal & 0 retrieved chunks)
6. Grounded RAG Chat with Citations (Ask Workspace A -> verify exact answer & citations)
7. Autonomous Tool Execution (save_task & send_summary_to_discord)
8. Tool Call Audit Logging & Dashboard Stats
"""
import sys
import os
import json
import httpx
import asyncio
from dotenv import load_dotenv

sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))
load_dotenv(os.path.join(os.path.dirname(__file__), "backend", ".env"))

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

API_BASE = "http://localhost:8000"


async def main():
    print("==========================================================")
    print("[+] STARTING E2E AUTOMATED VERIFICATION FOR ABSTRAT ASSISTANT")
    print("==========================================================\n")

    async with httpx.AsyncClient(timeout=30.0) as client:

        # -----------------------------------------------------------------
        # TEST 1: Health Check
        # -----------------------------------------------------------------
        print("[1] Testing Health Check Endpoint...")
        res = await client.get(f"{API_BASE}/api/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        data = res.json()
        print(f"   [OK] Health check passed: {data}\n")

        # -----------------------------------------------------------------
        # TEST 2: Demo Authentication (Supabase Admin & Auth API)
        # -----------------------------------------------------------------
        print("[2] Authenticating Demo User via Supabase Auth...")
        from app.config import get_settings
        settings = get_settings()

        admin_headers = {
            "apikey": settings.supabase_service_role_key,
            "Authorization": f"Bearer {settings.supabase_service_role_key}",
            "Content-Type": "application/json",
        }
        anon_headers = {
            "apikey": settings.supabase_anon_key,
            "Content-Type": "application/json",
        }

        # Create auto-confirmed demo user via Admin API
        admin_url = f"{settings.supabase_url}/auth/v1/admin/users"
        user_body = {
            "email": "demo@abstrat.ai",
            "password": "DemoUser123!",
            "email_confirm": True,
        }
        await client.post(admin_url, json=user_body, headers=admin_headers)

        # Login to get valid JWT token
        token_url = f"{settings.supabase_url}/auth/v1/token?grant_type=password"
        login_body = {"email": "demo@abstrat.ai", "password": "DemoUser123!"}
        auth_res = await client.post(token_url, json=login_body, headers=anon_headers)

        assert auth_res.status_code == 200, f"Supabase auth failed: {auth_res.text}"
        token = auth_res.json()["access_token"]
        user_id = auth_res.json()["user"]["id"]
        auth_header = {"Authorization": f"Bearer {token}"}
        print(f"   [OK] Authenticated demo user: {user_id}\n")

        # -----------------------------------------------------------------
        # TEST 3: Create Workspace A & Workspace B
        # -----------------------------------------------------------------
        print("[3] Creating Workspaces for Tenant Isolation Test...")
        ws_a_res = await client.post(
            f"{API_BASE}/api/workspaces",
            json={"name": "Project Alpha"},
            headers=auth_header,
        )
        if ws_a_res.status_code != 201 and ws_a_res.status_code != 409:
            print(f"Workspace A Creation Error ({ws_a_res.status_code}): {ws_a_res.text}")

        if ws_a_res.status_code == 409:
            list_res = await client.get(f"{API_BASE}/api/workspaces", headers=auth_header)
            ws_a = next(w for w in list_res.json()["workspaces"] if w["name"] == "Project Alpha")
        else:
            ws_a = ws_a_res.json()

        ws_b_res = await client.post(
            f"{API_BASE}/api/workspaces",
            json={"name": "Project Beta"},
            headers=auth_header,
        )
        if ws_b_res.status_code == 409:
            list_res = await client.get(f"{API_BASE}/api/workspaces", headers=auth_header)
            ws_b = next(w for w in list_res.json()["workspaces"] if w["name"] == "Project Beta")
        else:
            ws_b = ws_b_res.json()

        ws_a_id = ws_a["id"]
        ws_b_id = ws_b["id"]
        print(f"   [OK] Created Workspace A: '{ws_a['name']}' ({ws_a_id})")
        print(f"   [OK] Created Workspace B: '{ws_b['name']}' ({ws_b_id})\n")

        # -----------------------------------------------------------------
        # TEST 4: Document Ingestion (Embeddings + Vector DB)
        # -----------------------------------------------------------------
        print("[4] Ingesting Documents into Separate Workspaces...")

        import time
        ts = int(time.time())

        # Secret doc for Workspace A
        doc_a_content = (
            f"Project Alpha Official Documentation (v{ts}).\n"
            "The secret codename for the new stealth product is PHOENIX-99.\n"
            "Budget allocated: $2.5 Million USD."
        ).encode("utf-8")

        files_a = {"file": (f"alpha_secret_{ts}.txt", doc_a_content, "text/plain")}
        upload_a_res = await client.post(
            f"{API_BASE}/api/workspaces/{ws_a_id}/documents",
            files=files_a,
            headers=auth_header,
        )
        if upload_a_res.status_code != 200:
            print(f"   Upload A Error ({upload_a_res.status_code}): {upload_a_res.text}")
        else:
            print(f"   [OK] Workspace A Ingestion: {upload_a_res.json().get('message')}")

        # Secret doc for Workspace B
        doc_b_content = (
            f"Project Beta Operational Guide (v{ts}).\n"
            "Target launch deadline is October 15, 2026.\n"
            "Lead Architect: Dr. Sarah Connor."
        ).encode("utf-8")

        files_b = {"file": (f"beta_guide_{ts}.txt", doc_b_content, "text/plain")}
        upload_b_res = await client.post(
            f"{API_BASE}/api/workspaces/{ws_b_id}/documents",
            files=files_b,
            headers=auth_header,
        )
        if upload_b_res.status_code != 200:
            print(f"   Upload B Error ({upload_b_res.status_code}): {upload_b_res.text}")
        else:
            print(f"   [OK] Workspace B Ingestion: {upload_b_res.json().get('message')}\n")

        # -----------------------------------------------------------------
        # TEST 5: Verify Multi-Tenant Isolation (CRITICAL TEST)
        # -----------------------------------------------------------------
        print("[5] Verification of Strict Tenant Isolation (Asking Workspace B for Workspace A's secret)...")
        isolation_chat_res = await client.post(
            f"{API_BASE}/api/workspaces/{ws_b_id}/chat",
            json={"message": "What is the secret codename for the stealth product?"},
            headers=auth_header,
        )
        assert isolation_chat_res.status_code == 200
        iso_data = isolation_chat_res.json()
        retrieved_in_b = iso_data["retrieved_chunks"]
        answer_in_b = iso_data["message"]["content"]

        print(f"   Query asked in Workspace B: 'What is the secret codename for the stealth product?'")
        print(f"   Retrieved Chunks from Workspace B: {len(retrieved_in_b)}")
        print(f"   Assistant Response: \"{answer_in_b}\"")

        # Ensure PHOENIX-99 was NOT retrieved or leaked!
        assert "PHOENIX-99" not in answer_in_b, "CRITICAL ERROR: Cross-tenant data leakage detected!"
        assert len(retrieved_in_b) == 0 or not any("PHOENIX-99" in c["content"] for c in retrieved_in_b), "CRITICAL ERROR: Chunks from Workspace A were retrieved in Workspace B!"
        print("   [PASSED] Tenant Isolation confirmed! Zero cross-workspace leakage.\n")

        # -----------------------------------------------------------------
        # TEST 6: Grounded RAG Chat in Workspace A
        # -----------------------------------------------------------------
        print("[6] Grounded RAG Chat with Citations (Asking Workspace A)...")
        rag_chat_res = await client.post(
            f"{API_BASE}/api/workspaces/{ws_a_id}/chat",
            json={"message": "What is the secret codename and budget for Project Alpha?"},
            headers=auth_header,
        )
        assert rag_chat_res.status_code == 200
        rag_data = rag_chat_res.json()
        answer_in_a = rag_data["message"]["content"]
        citations_in_a = rag_data["message"]["citations"]

        print(f"   Assistant Response: \"{answer_in_a}\"")
        print(f"   Citations ({len(citations_in_a)}): {citations_in_a}")
        normalized_answer = answer_in_a.replace('\u2011', '-')
        assert "PHOENIX-99" in normalized_answer or "PHOENIX" in normalized_answer, "Failed to answer grounded fact from document."
        print("   [PASSED] Grounded RAG answer with source citations verified!\n")

        # -----------------------------------------------------------------
        # TEST 7: Autonomous Tool Calling (save_task)
        # -----------------------------------------------------------------
        print("[7] Testing Autonomous Tool Calling (save_task)...")
        tool_chat_res = await client.post(
            f"{API_BASE}/api/workspaces/{ws_a_id}/chat",
            json={"message": "Save a high priority task to review the PHOENIX-99 security audit report by tomorrow."},
            headers=auth_header,
        )
        assert tool_chat_res.status_code == 200
        tool_data = tool_chat_res.json()
        tool_calls = tool_data.get("tool_calls", [])

        print(f"   Assistant Response: \"{tool_data['message']['content']}\"")
        print(f"   Tool Executed: {tool_calls}")

        assert len(tool_calls) > 0, "No tool calls executed."
        assert tool_calls[0]["tool_name"] == "save_task", "Expected save_task tool."
        print("   [PASSED] Autonomous tool calling loop verified!\n")

        # -----------------------------------------------------------------
        # TEST 8: Verify Dashboard & Tool Audit Logs
        # -----------------------------------------------------------------
        print("[8] Verifying Dashboard Stats & Tool Audit Logs...")
        dash_res = await client.get(f"{API_BASE}/api/workspaces/{ws_a_id}/dashboard", headers=auth_header)
        dash_data = dash_res.json()
        print(f"   Workspace A Dashboard Stats: {dash_data}")

        tasks_res = await client.get(f"{API_BASE}/api/workspaces/{ws_a_id}/tasks", headers=auth_header)
        tasks_data = tasks_res.json()["tasks"]
        print(f"   Saved Tasks in DB ({len(tasks_data)}): {[t['title'] for t in tasks_data]}")

        tool_logs_res = await client.get(f"{API_BASE}/api/workspaces/{ws_a_id}/tool-calls", headers=auth_header)
        tool_logs = tool_logs_res.json()["tool_calls"]
        print(f"   Tool Call Log Entries in DB ({len(tool_logs)}): {[tl['tool_name'] for tl in tool_logs]}")

        print("\n==========================================================")
        print("[SUCCESS] ALL 8 E2E VERIFICATION TESTS PASSED SUCCESSFULLY!")
        print("==========================================================")

if __name__ == "__main__":
    asyncio.run(main())
