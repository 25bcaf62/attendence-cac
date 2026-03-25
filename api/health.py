from app import app as root_app


def app(environ, start_response):
    environ["PATH_INFO"] = "/health"
    return root_app(environ, start_response)
