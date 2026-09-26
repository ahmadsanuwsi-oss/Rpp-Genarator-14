"""Backend tests for new-feature round: roles, options, duplicate, DOCX, poster image."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
API = f"{BASE_URL}/api"

SUPERADMIN = ("mifjan@madrasahebat.com", "B1smill@h")
GURU = ("guru@demo.com", "guru123")


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=30)
    assert r.status_code == 200, f"login {email}: {r.status_code} {r.text}"
    return r.json()


def _headers(token):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def sa():
    d = _login(*SUPERADMIN)
    assert d["user"]["role"] == "superadmin"
    return d


@pytest.fixture(scope="module")
def sa_headers(sa):
    return _headers(sa["token"])


@pytest.fixture(scope="module")
def admin_creds(sa_headers):
    """Create an admin under superadmin, return (email, password, token)."""
    email = f"TEST_admin_{uuid.uuid4().hex[:6]}@example.com"
    password = "adminpass123"
    r = requests.post(
        f"{API}/admin/users",
        headers=sa_headers,
        json={"name": "Test Admin", "email": email, "password": password},
        timeout=15,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["role"] == "admin"
    tok = _login(email, password)["token"]
    return {"email": email, "password": password, "token": tok, "id": body["id"]}


@pytest.fixture(scope="module")
def guru_under_admin(admin_creds):
    email = f"TEST_guru_{uuid.uuid4().hex[:6]}@example.com"
    password = "gurupass123"
    r = requests.post(
        f"{API}/admin/users",
        headers=_headers(admin_creds["token"]),
        json={"name": "Test Guru", "email": email, "password": password},
        timeout=15,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["role"] == "guru"
    assert body["admin_id"] == admin_creds["id"]
    tok = _login(email, password)["token"]
    return {"email": email, "password": password, "token": tok, "id": body["id"]}


# ---------- Access control ----------
class TestAccessControl:
    def test_guru_cannot_list_admin_users(self):
        tok = _login(*GURU)["token"]
        r = requests.get(f"{API}/admin/users", headers=_headers(tok), timeout=15)
        assert r.status_code == 403

    def test_guru_cannot_create_users(self):
        tok = _login(*GURU)["token"]
        r = requests.post(
            f"{API}/admin/users",
            headers=_headers(tok),
            json={"name": "x", "email": "x@x.com", "password": "yyyyyyyy"},
            timeout=15,
        )
        assert r.status_code == 403

    def test_superadmin_lists_admins(self, sa_headers, admin_creds):
        r = requests.get(f"{API}/admin/users", headers=sa_headers, timeout=15)
        assert r.status_code == 200
        emails = [u["email"].lower() for u in r.json()]
        assert admin_creds["email"].lower() in emails

    def test_admin_lists_only_their_gurus(self, admin_creds, guru_under_admin):
        r = requests.get(f"{API}/admin/users", headers=_headers(admin_creds["token"]), timeout=15)
        assert r.status_code == 200
        users = r.json()
        assert all(u["role"] == "guru" for u in users)
        assert guru_under_admin["email"].lower() in [u["email"].lower() for u in users]


# ---------- Role visibility of documents ----------
class TestRoleVisibility:
    @pytest.fixture(scope="class")
    def guru_doc(self, guru_under_admin):
        payload = {
            "type": "rpp",
            "title": "TEST role-visibility doc",
            "fields": {"mataPelajaran": "IPA", "kelas": "5", "namaSekolah": "SD Test", "alamatSekolah": "Jl. Testing 1"},
            "content_html": "<p>x</p>",
        }
        r = requests.post(f"{API}/documents", headers=_headers(guru_under_admin["token"]), json=payload, timeout=15)
        assert r.status_code == 200, r.text
        return r.json()

    def test_admin_sees_guru_doc_with_owner_name(self, admin_creds, guru_doc):
        r = requests.get(f"{API}/documents", headers=_headers(admin_creds["token"]), timeout=15)
        assert r.status_code == 200
        docs = r.json()
        found = [d for d in docs if d["id"] == guru_doc["id"]]
        assert found, "Admin should see the guru's doc"
        assert found[0].get("owner_name")

    def test_superadmin_sees_guru_doc(self, sa_headers, guru_doc):
        r = requests.get(f"{API}/documents", headers=sa_headers, timeout=15)
        assert r.status_code == 200
        assert any(d["id"] == guru_doc["id"] for d in r.json())

    def test_other_guru_cannot_see_doc(self, guru_doc):
        # demo guru is NOT under our test admin, so should not see
        tok = _login(*GURU)["token"]
        r = requests.get(f"{API}/documents/{guru_doc['id']}", headers=_headers(tok), timeout=15)
        assert r.status_code in (403, 404)


# ---------- Options endpoint ----------
class TestOptions:
    def test_options_defaults(self, sa_headers):
        r = requests.get(f"{API}/options", headers=sa_headers, timeout=15)
        assert r.status_code == 200
        d = r.json()
        assert "mataPelajaran" in d and len(d["mataPelajaran"]) >= 13
        assert set(["1", "12"]).issubset(set(d["kelas"]))
        assert "Ganjil" in d["semester"] and "Genap" in d["semester"]


# ---------- Duplicate ----------
class TestDuplicate:
    def test_duplicate_creates_salinan(self, sa_headers):
        # create a doc as superadmin
        r = requests.post(
            f"{API}/documents",
            headers=sa_headers,
            json={"type": "rpp", "title": "TEST dup src", "fields": {"mataPelajaran": "IPA"}, "content_html": "<p>hi</p>"},
            timeout=15,
        )
        assert r.status_code == 200
        did = r.json()["id"]
        r2 = requests.post(f"{API}/documents/{did}/duplicate", headers=sa_headers, timeout=15)
        assert r2.status_code == 200, r2.text
        dup = r2.json()
        assert dup["id"] != did
        assert "Salinan" in dup["title"]
        assert dup["fields"].get("mataPelajaran") == "IPA"


# ---------- DOCX export ----------
class TestDocx:
    def test_docx_rpp(self, sa_headers):
        r = requests.post(
            f"{API}/documents",
            headers=sa_headers,
            json={
                "type": "rpp",
                "title": "TEST docx rpp",
                "fields": {"mataPelajaran": "IPA", "kelas": "5", "namaSekolah": "SD Test", "alamatSekolah": "Jl. Test 1"},
                "content_html": "<p>Hello</p>",
            },
            timeout=15,
        )
        did = r.json()["id"]
        r2 = requests.get(f"{API}/documents/{did}/docx", headers=sa_headers, timeout=30)
        assert r2.status_code == 200
        assert "wordprocessingml" in r2.headers.get("content-type", "")
        assert len(r2.content) > 2000
        # DOCX is a zip, magic bytes PK
        assert r2.content[:2] == b"PK"

    def test_docx_generator_atp(self, sa_headers):
        html = "<h2>ATP</h2><table><tr><th>a</th></tr><tr><td>b</td></tr></table>"
        r = requests.post(
            f"{API}/documents",
            headers=sa_headers,
            json={"type": "atp", "title": "TEST docx atp", "fields": {}, "content_html": html},
            timeout=15,
        )
        did = r.json()["id"]
        r2 = requests.get(f"{API}/documents/{did}/docx", headers=sa_headers, timeout=30)
        assert r2.status_code == 200
        assert r2.content[:2] == b"PK"


# ---------- Poster with image (slow) ----------
class TestPoster:
    def test_poster_returns_image(self):
        tok = _login(*GURU)["token"]
        payload = {
            "type": "poster",
            "inputs": {
                "judul": "Hemat Air",
                "mataPelajaran": "IPA",
                "kelas": "5",
                "materi": "Menghemat air di rumah",
                "pesan": "Ayo hemat air!",
            },
        }
        r = requests.post(f"{API}/ai/generate", headers=_headers(tok), json=payload, timeout=180)
        assert r.status_code == 200, r.text
        html = r.json().get("content_html", "")
        assert "<img" in html.lower()
        assert "data:image" in html
