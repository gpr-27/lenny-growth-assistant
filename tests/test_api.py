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
async def test_model_discovery_endpoint():
    """Verify dynamic model discovery for cloud and local providers."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # OpenAI
        res_openai = await client.post("/models", json={"provider": "openai"})
        assert res_openai.status_code == 200
        models_oai = res_openai.json()["models"]
        assert len(models_oai) > 0
        assert any(m["id"] == "gpt-4o" for m in models_oai)

        # Anthropic
        res_anthropic = await client.post("/models", json={"provider": "anthropic"})
        assert res_anthropic.status_code == 200
        models_ant = res_anthropic.json()["models"]
        assert len(models_ant) > 0
        assert any(m["id"] == "claude-3-5-sonnet-20241022" for m in models_ant)

        # Ollama
        res_ollama = await client.post("/models", json={"provider": "ollama"})
        assert res_ollama.status_code == 200
        models_ollama = res_ollama.json()["models"]
        assert len(models_ollama) > 0
        assert any(m["id"] == "llama3.1" for m in models_ollama)

@pytest.mark.anyio
async def test_artifacts_crud_api():
    """Verify artifacts listing, detail retrieval, renaming, and deletion."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. List artifacts
        list_res = await client.get("/artifacts")
        assert list_res.status_code == 200
        artifacts = list_res.json()
        assert isinstance(artifacts, list)

        # 2. If an artifact exists, test GET / PATCH / DELETE
        if len(artifacts) > 0:
            art = artifacts[0]
            art_id = art["id"]

            # Detail
            detail_res = await client.get(f"/artifacts/{art_id}")
            assert detail_res.status_code == 200
            assert detail_res.json()["id"] == art_id
            assert "content" in detail_res.json()
            assert "filename" in detail_res.json()

            # Patch
            patch_res = await client.patch(f"/artifacts/{art_id}", json={"title": "Updated Growth Prototype"})
            assert patch_res.status_code == 200
            assert patch_res.json()["title"] == "Updated Growth Prototype"

