"""
TrustChain-5G Enterprise Asynchronous Request Logging Middleware.

Captures inbound API requests, monitors execution latency, correlates unique tracing IDs,
and produces standardized structured cybersecurity logs for audit capabilities.
"""

import time
import uuid
import logging
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

# Configure structured enterprise logger
logger = logging.getLogger("trustchain.access")
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | [%(name)s] | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to intercept, meter, and log HTTP transactions through the platform.
    """
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = str(uuid.uuid4())[:8]
        start_time = time.perf_counter()
        
        # Attach request ID for downstream tracing
        request.state.request_id = request_id
        
        client_ip = request.client.host if request.client else "unknown"
        logger.info(f"[ReqID: {request_id}] START {request.method} {request.url.path} from IP {client_ip}")
        
        try:
            response = await call_next(request)
            duration = (time.perf_counter() - start_time) * 1000  # in ms
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Process-Time-Ms"] = f"{duration:.2f}"
            
            logger.info(f"[ReqID: {request_id}] COMPLETED {response.status_code} in {duration:.2f}ms")
            return response
            
        except Exception as exc:
            duration = (time.perf_counter() - start_time) * 1000
            logger.error(f"[ReqID: {request_id}] FAILED with exception after {duration:.2f}ms: {str(exc)}")
            raise exc
