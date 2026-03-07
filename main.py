from fastapi import FastAPI
from models import PromptRequest
from capability_graph import analyze_prompt

app = FastAPI()

@app.get("/")
def root():
    return {"message": "CONVERGENCE API running"}

@app.post("/analyze")
def analyze(request: PromptRequest):
    result = analyze_prompt(request.prompt)
    return result