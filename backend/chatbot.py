import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

model = genai.GenerativeModel("models/gemini-1.5-pro")

async def generate_chat_response(prompt: str):
    try:
        response = model.generate_content(prompt)

        return {
            "reply": response.text
        }

    except Exception as e:
        return {
            "error": str(e)
        }