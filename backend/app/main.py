"""
Abstrat — Multi-Workspace Document Assistant
Main FastAPI application with lifecycle management.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.db.client import db
from app.db.queries import MIGRATION_SQL
from app.routers import workspaces, documents, chat, dashboard
from app.services.tools.registry import tool_registry, ToolDefinition
from app.services.tools.save_task import SAVE_TASK_DEFINITION
from app.services.tools.send_discord import SEND_DISCORD_DEFINITION

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def _register_tools():
    """Register all available tools."""
    for defn in [SAVE_TASK_DEFINITION, SEND_DISCORD_DEFINITION]:
        tool = ToolDefinition(
            name=defn["name"],
            description=defn["description"],
            parameters=defn["parameters"],
            execute_fn=defn["execute_fn"],
            required_params=defn.get("required_params", []),
        )
        tool_registry.register(tool)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle — startup and shutdown."""
    logger.info("Starting Abstrat Document Assistant...")

    # Connect to database
    await db.connect()
    logger.info("Database connected")

    # Run migrations
    try:
        async with db.pool.acquire() as conn:
            await conn.execute(MIGRATION_SQL)
        logger.info("Database migrations applied")
    except Exception as e:
        logger.warning(f"Migration note: {e}")

    # Register tools
    _register_tools()
    logger.info(f"Registered {len(tool_registry.list_tools())} tools")

    yield

    # Shutdown
    await db.disconnect()
    logger.info("Database disconnected. Goodbye!")


# Create FastAPI app
app = FastAPI(
    title="Abstrat Document Assistant",
    description="Multi-workspace RAG-powered document assistant with tool calling",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(workspaces.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(dashboard.router)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    try:
        await db.fetchval("SELECT 1")
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    return {
        "status": "healthy",
        "database": db_status,
        "tools": [t.name for t in tool_registry.list_tools()],
    }
