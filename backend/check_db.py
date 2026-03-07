from session_memory import get_db 
db = get_db() 
print('sessions:', db.sessions.count_documents({})) 
print('api_key_profiles:', db.api_key_profiles.count_documents({})) 
print('audit_log:', db.audit_log.count_documents({})) 
