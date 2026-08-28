import pytest
import httpx
from httpx import ASGITransport, AsyncClient
from main import app

@pytest.mark.anyio
async def test_health_endpoints():
    """Verify all observability health routes."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"

        res_db = await client.get("/health/db")
        assert res_db.status_code == 200
        assert res_db.json()["status"] == "healthy"
        assert "corpus" in res_db.json()

        res_llm = await client.get("/health/llm")
        assert res_llm.status_code == 200
        assert "local_provider" in res_llm.json()
        assert "cloud_providers" in res_llm.json()

@pytest.mark.anyio
async def test_session_crud_api():
    """Verify session creation, retrieval, patching, and deletion."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # Create
        create_res = await client.post("/sessions", json={"title": "PM Chat"})
        assert create_res.status_code == 200
        session_id = create_res.json()["id"]
        assert create_res.json()["title"] == "PM Chat"

        # List
        list_res = await client.get("/sessions")
        assert list_res.status_code == 200
        ids = [s["id"] for s in list_res.json()]
        assert session_id in ids

        # Rename
        patch_res = await client.patch(f"/sessions/{session_id}", json={"title": "Updated Growth Session"})
        assert patch_res.status_code == 200
        assert patch_res.json()["title"] == "Updated Growth Session"

        # Delete
        del_res = await client.delete(f"/sessions/{session_id}")
        assert del_res.status_code == 200
        assert del_res.json()["status"] == "deleted"

@pytest.mark.anyio
async def test_artifacts_crud_api():
    """Verify artifacts listing, detail retrieval, and search."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. List artifacts
        list_res = await client.get("/artifacts")
        assert list_res.status_code == 200
        artifacts = list_res.json()
        assert isinstance(artifacts, list)

        # 2. Filter by search
        search_res = await client.get("/artifacts?search=Growth")
        assert search_res.status_code == 200
        assert isinstance(search_res.json(), list)

        # 3. Filter by type
        html_res = await client.get("/artifacts?type=html")
        assert html_res.status_code == 200
        assert isinstance(html_res.json(), list)
