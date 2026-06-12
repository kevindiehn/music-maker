from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import synastry, transits

app = FastAPI(title="Astro Companion API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(synastry.router, tags=["Synastry"])
app.include_router(transits.router, tags=["Transits"])


@app.get("/health")
def health():
    return {"status": "ok"}
