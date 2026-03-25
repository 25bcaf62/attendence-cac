import importlib
import json
import mimetypes
import os
from pathlib import Path
from wsgiref.simple_server import make_server

try:
    psycopg = importlib.import_module("psycopg")
except ImportError:
    psycopg = None


HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "5000"))
DATABASE_URL = os.getenv("DATABASE_URL", "")
PROJECT_DIR = Path(__file__).resolve().parent


def get_db_connection():
    if psycopg is None:
        raise RuntimeError("psycopg is not installed. Run: pip install -r requirements.txt")
    if not DATABASE_URL:
        raise RuntimeError("DATABASE_URL is not configured.")
    return psycopg.connect(DATABASE_URL, connect_timeout=5)


def check_database_health():
    if not DATABASE_URL:
        return {
            "status": "not_configured",
            "database": "postgresql",
            "message": "Set DATABASE_URL to enable PostgreSQL health checks."
        }

    try:
        with get_db_connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        return {
            "status": "ok",
            "database": "postgresql"
        }
    except Exception as error:
        return {
            "status": "error",
            "database": "postgresql",
            "message": str(error)
        }


def json_response(start_response, status, payload):
    response = json.dumps(payload).encode("utf-8")
    headers = [
        ("Content-Type", "application/json; charset=utf-8"),
        ("Content-Length", str(len(response)))
    ]
    start_response(status, headers)
    return [response]


def serve_file(start_response, relative_path):
    requested_path = (PROJECT_DIR / relative_path.lstrip("/")).resolve()

    if PROJECT_DIR not in requested_path.parents and requested_path != PROJECT_DIR:
        start_response("403 Forbidden", [("Content-Type", "text/plain; charset=utf-8")])
        return [b"Forbidden"]

    if not requested_path.exists() or requested_path.is_dir():
        start_response("404 Not Found", [("Content-Type", "text/plain; charset=utf-8")])
        return [b"Not Found"]

    content_type, _ = mimetypes.guess_type(str(requested_path))
    body = requested_path.read_bytes()
    headers = [
        ("Content-Type", content_type or "application/octet-stream"),
        ("Content-Length", str(len(body)))
    ]
    start_response("200 OK", headers)
    return [body]


def app(environ, start_response):
    path = environ.get("PATH_INFO", "/")

    if path == "/health":
        return json_response(
            start_response,
            "200 OK",
            {
                "status": "ok",
                "service": "attendance-calculator",
                "database_health_endpoint": "/health/db"
            }
        )

    if path == "/health/db":
        db_health = check_database_health()
        status = "200 OK" if db_health["status"] in {"ok", "not_configured"} else "503 Service Unavailable"
        return json_response(start_response, status, db_health)

    if path == "/":
        return serve_file(start_response, "index.html")

    return serve_file(start_response, path)


if __name__ == "__main__":
    print(f"Attendance calculator running at http://{HOST}:{PORT}/")
    print(f"App health check: http://{HOST}:{PORT}/health")
    print(f"Database health check: http://{HOST}:{PORT}/health/db")
    with make_server(HOST, PORT, app) as server:
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
