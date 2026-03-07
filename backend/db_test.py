# backend/db_test.py
from session_memory import get_db

def check_mongo_connection():
    try:
        db = get_db()
        db.command("ping")  # MongoDB ping command
        return {
            "status": "ok",
            "database": db.name,
            "message": "MongoDB connection successful"
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }