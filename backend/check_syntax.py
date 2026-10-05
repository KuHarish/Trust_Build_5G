import sys
try:
    from app.main import app
    print("SUCCESS: No syntax or import errors in FastAPI application!")
except Exception as e:
    import traceback
    print("FAILED: Application has an error!")
    traceback.print_exc()
