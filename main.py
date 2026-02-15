from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import sqlite3
from contextlib import contextmanager
import requests
import json

app = FastAPI(title="Real Estate AI Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_URL = "real_estate.db"
GOOGLE_API_KEY = "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"

@contextmanager
def get_db():
    conn = sqlite3.connect(DATABASE_URL)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    with get_db() as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                full_name TEXT NOT NULL,
                phone TEXT NOT NULL,
                location TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.execute('''
            CREATE TABLE IF NOT EXISTS buyers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                budget TEXT NOT NULL,
                location TEXT NOT NULL,
                property_type TEXT NOT NULL,
                contact TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.execute('''
            CREATE TABLE IF NOT EXISTS sellers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                property_type TEXT NOT NULL,
                location TEXT NOT NULL,
                price TEXT NOT NULL,
                contact TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM buyers")
        if cursor.fetchone()[0] == 0:
            conn.execute('''
                INSERT INTO buyers (name, budget, location, property_type, contact)
                VALUES (?, ?, ?, ?, ?)
            ''', ('Rahul', '50L', 'Bangalore', '2BHK', '+91 98765 43210'))
            conn.execute('''
                INSERT INTO buyers (name, budget, location, property_type, contact)
                VALUES (?, ?, ?, ?, ?)
            ''', ('Anita', '80L', 'Bangalore', '3BHK', '+91 98765 43211'))
        
        cursor.execute("SELECT COUNT(*) FROM sellers")
        if cursor.fetchone()[0] == 0:
            conn.execute('''
                INSERT INTO sellers (name, property_type, location, price, contact)
                VALUES (?, ?, ?, ?, ?)
            ''', ('Mr. Sharma', '2BHK', 'Whitefield', '45L', '+91 98765 43210'))
            conn.execute('''
                INSERT INTO sellers (name, property_type, location, price, contact)
                VALUES (?, ?, ?, ?, ?)
            ''', ('Priya', '3BHK', 'Indiranagar', '75L', '+91 98765 43211'))
        
        conn.commit()

init_db()

class ChatRequest(BaseModel):
    message: str

class BuyerRequest(BaseModel):
    name: str
    budget: str
    location: str
    property_type: str
    contact: str

class SellerRequest(BaseModel):
    name: str
    property_type: str
    location: str
    price: str
    contact: str

class AssistantResponse(BaseModel):
    intent: str
    reply: str
    automation: str

def generate_ai_response(message: str) -> str:
    try:
        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"
        
        headers = {"Content-Type": "application/json"}
        
        data = {
            "contents": [{
                "parts": [{
                    "text": f"You are a helpful real estate assistant. Please respond to this user message: {message}"
                }]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 1024,
            }
        }
        
        response = requests.post(
            f"{url}?key={GOOGLE_API_KEY}",
            headers=headers,
            json=data,
            timeout=10
        )
        
        if response.status_code == 200:
            result = response.json()
            if 'candidates' in result and len(result['candidates']) > 0:
                return result['candidates'][0]['content']['parts'][0]['text']
        
        return "I'm here to help with real estate! Are you looking to buy a property, sell one, or need information?"
        
    except Exception as e:
        print(f"Error calling Google API: {e}")
        return "I'm here to help with real estate! Are you looking to buy a property, sell one, or need information?"

def detect_intent(message: str) -> str:
    message_lower = message.lower()
    buying_keywords = ["buy", "looking for", "want to buy", "interested in", "searching"]
    selling_keywords = ["sell", "selling", "list my property", "want to sell", "put house for sale"]
    
    for keyword in buying_keywords:
        if keyword in message_lower:
            return "BUYER"
    
    for keyword in selling_keywords:
        if keyword in message_lower:
            return "SELLER"
    
    return "UNKNOWN"

def simulate_automation(intent: str) -> str:
    if intent == "BUYER":
        return "Notified available sellers"
    elif intent == "SELLER":
        return "Notified interested buyers"
    else:
        return "No automation triggered"

@app.get("/")
async def root():
    return {"status": "running"}

@app.get("/api/buyers")
async def get_buyers():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM buyers ORDER BY created_at DESC")
        buyers = [dict(row) for row in cursor.fetchall()]
        return {"buyers": buyers}

@app.post("/api/buyers")
async def add_buyer(buyer: BuyerRequest):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO buyers (name, budget, location, property_type, contact)
            VALUES (?, ?, ?, ?, ?)
        ''', (buyer.name, buyer.budget, buyer.location, buyer.property_type, buyer.contact))
        
        buyer_id = cursor.lastrowid
        cursor.execute("SELECT * FROM buyers WHERE id = ?", (buyer_id,))
        new_buyer = dict(cursor.fetchone())
        
        conn.commit()
        return {"message": "Buyer added successfully", "buyer": new_buyer}

@app.get("/api/sellers")
async def get_sellers():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM sellers ORDER BY created_at DESC")
        sellers = [dict(row) for row in cursor.fetchall()]
        return {"sellers": sellers}

@app.post("/api/sellers")
async def add_seller(seller: SellerRequest):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO sellers (name, property_type, location, price, contact)
            VALUES (?, ?, ?, ?, ?)
        ''', (seller.name, seller.property_type, seller.location, seller.price, seller.contact))
        
        seller_id = cursor.lastrowid
        cursor.execute("SELECT * FROM sellers WHERE id = ?", (seller_id,))
        new_seller = dict(cursor.fetchone())
        
        conn.commit()
        return {"message": "Seller added successfully", "seller": new_seller}

@app.post("/chat", response_model=AssistantResponse)
async def chat_endpoint(request: ChatRequest):
    ai_response = generate_ai_response(request.message)
    intent = detect_intent(request.message)
    automation = simulate_automation(intent)
    
    return AssistantResponse(
        intent=intent,
        reply=ai_response,
        automation=automation
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
