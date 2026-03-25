import importlib
import json
import os
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

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


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, directory=None, **kwargs):
        super().__init__(*args, directory=str(PROJECT_DIR), **kwargs)

    def do_GET(self):
        parsed_url = urlparse(self.path)

        if parsed_url.path == "/health":
            self._send_json(
                HTTPStatus.OK,
                {
                    "status": "ok",
                    "service": "attendance-calculator",
                    "database_health_endpoint": "/health/db"
                }
            )
            return

        if parsed_url.path == "/health/db":
            db_health = check_database_health()
            status_code = HTTPStatus.OK if db_health["status"] in {"ok", "not_configured"} else HTTPStatus.SERVICE_UNAVAILABLE
            self._send_json(status_code, db_health)
            return

        if parsed_url.path == "/":
            self.path = "/index.html"

        super().do_GET()

    def _send_json(self, status_code, payload):
        response = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(response)))
        self.end_headers()
        self.wfile.write(response)


if __name__ == "__main__":
    server = ThreadingHTTPServer((HOST, PORT), AppHandler)
    print(f"Attendance calculator running at http://{HOST}:{PORT}/")
    print(f"App health check: http://{HOST}:{PORT}/health")
    print(f"Database health check: http://{HOST}:{PORT}/health/db")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        server.server_close()
