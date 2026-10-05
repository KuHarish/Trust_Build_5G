"""
TrustChain-5G Global Enterprise Error Handling & Exception Resolution Middleware.

Catches unhandled exceptions, database communication failures, and validation conflicts,
converting them into consistent, sanitized, user-friendly JSON API error responses.
"""

import logging
from typing import Union
from fastapi import Request, status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

logger = logging.getLogger("trustchain.error_handler")


class GlobalErrorHandlingMiddleware(BaseHTTPMiddleware):
    """
    Global defensive middleware ensuring no unhandled Python traceback leak to unauthorized clients.
    """
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> JSONResponse:
        try:
            response = await call_next(request)
            return response
        except HTTPException as http_err:
            return JSONResponse(
                status_code=http_err.status_code,
                content={
                    "success": False,
                    "error": {
                        "code": http_err.status_code,
                        "type": "HTTPException",
                        "message": http_err.detail,
                        "request_id": getattr(request.state, "request_id", "N/A")
                    }
                }
            )
        except Exception as exc:
            logger.exception(f"Unhandled system exception during {request.method} {request.url.path}: {str(exc)}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "success": False,
                    "error": {
                        "code": 500,
                        "type": "InternalServerException",
                        "message": "An unexpected server fault occurred in the TrustChain-5G backend. Please examine telemetry logs.",
                        "request_id": getattr(request.state, "request_id", "N/A")
                    }
                }
            )


def setup_exception_handlers(app):
    """
    Attach custom Pydantic input validation failure handler to FastAPI app.
    """
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        errors = []
        for error in exc.errors():
            field = " -> ".join([str(loc) for loc in error.get("loc", [])])
            msg = error.get("msg", "Invalid input value")
            errors.append({"field": field, "message": msg})
            
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "error": {
                    "code": 422,
                    "type": "ValidationException",
                    "message": "Payload schema validation failed.",
                    "details": errors,
                    "request_id": getattr(request.state, "request_id", "N/A")
                }
            }
        )
