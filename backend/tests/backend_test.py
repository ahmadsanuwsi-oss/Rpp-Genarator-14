"""Backend API tests for RPP Studio."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # fallback to frontend/.env
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def demo_token():
    r = requests.post(f"{API}/auth/login", json={"email": "guru@demo.com", "password": "guru123"}, timeout=30)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and "user" in data
    return data["token"]


@pytest.fixture(scope="session")
def demo_headers(demo_token):
    return {"Authorization": f"Bearer {demo_token}"}


# ---------- Auth ----------
class TestAuth:
    def test_login_demo(self, demo_token):
        assert isinstance(demo_token, str) and len(demo_token) > 10

    def test_login_wrong_password(self):
        r = requests.post(f"{API}/auth/login", json={"email": "guru@demo.com", "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_me(self, demo_headers):
        r = requests.get(f"{API}/auth/me", headers=demo_headers, timeout=15)
        assert r.status_code == 200
        u = r.json()
        assert u["email"] == "guru@demo.com"
        assert "password_hash" not in u
        assert "_id" not in u

    def test_me_unauth(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_register_and_login(self):
        email = f"TEST_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{API}/auth/register", json={"name": "Test User", "email": email, "password": "pass1234"}, timeout=15)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["user"]["email"] == email.lower()
        assert "token" in d
        # duplicate
        r2 = requests.post(f"{API}/auth/register", json={"name": "X", "email": email, "password": "pass1234"}, timeout=15)
        assert r2.status_code == 400

    def test_update_profile(self, demo_headers):
        r = requests.put(f"{API}/auth/profile", headers=demo_headers, json={"jabatan": "Guru Kelas"}, timeout=15)
        assert r.status_code == 200
        assert r.json()["jabatan"] == "Guru Kelas"


# ---------- Documents ----------
class TestDocuments:
    def test_stats(self, demo_headers):
        r = requests.get(f"{API}/documents/stats", headers=demo_headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "total" in d and "by_type" in d

    def test_crud_flow(self, demo_headers):
        payload = {
            "type": "rpp",
            "title": "TEST RPP Doc",
            "meta": {"note": "t"},
            "fields": {"mataPelajaran": "IPA", "kelas": "5"},
            "content_html": "<p>hi</p>",
        }
        r = requests.post(f"{API}/documents", headers=demo_headers, json=payload, timeout=15)
        assert r.status_code == 200, r.text
        doc = r.json()
        assert doc["title"] == payload["title"]
        assert doc["fields"]["mataPelajaran"] == "IPA"
        assert "_id" not in doc
        did = doc["id"]

        # GET
        r = requests.get(f"{API}/documents/{did}", headers=demo_headers, timeout=15)
        assert r.status_code == 200
        assert r.json()["title"] == "TEST RPP Doc"

        # LIST
        r = requests.get(f"{API}/documents", headers=demo_headers, timeout=15)
        assert r.status_code == 200
        assert any(x["id"] == did for x in r.json())

        # UPDATE
        payload["title"] = "TEST RPP Doc Updated"
        r = requests.put(f"{API}/documents/{did}", headers=demo_headers, json=payload, timeout=15)
        assert r.status_code == 200
        assert r.json()["title"] == "TEST RPP Doc Updated"

        # DELETE
        r = requests.delete(f"{API}/documents/{did}", headers=demo_headers, timeout=15)
        assert r.status_code == 200
        r = requests.get(f"{API}/documents/{did}", headers=demo_headers, timeout=15)
        assert r.status_code == 404

    def test_doc_unauth(self):
        r = requests.get(f"{API}/documents", timeout=15)
        assert r.status_code == 401


# ---------- AI ----------
class TestAI:
    def test_generate_atp(self, demo_headers):
        payload = {
            "type": "atp",
            "inputs": {
                "mataPelajaran": "IPA",
                "kelas": "5",
                "fase": "C",
                "capaianPembelajaran": "Peserta didik memahami siklus air.",
                "materi": "Siklus air dan pemanfaatannya",
            },
        }
        r = requests.post(f"{API}/ai/generate", headers=demo_headers, json=payload, timeout=90)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "content_html" in d and len(d["content_html"]) > 50

    def test_generate_bad_type(self, demo_headers):
        r = requests.post(f"{API}/ai/generate", headers=demo_headers, json={"type": "unknown", "inputs": {}}, timeout=15)
        assert r.status_code == 400
