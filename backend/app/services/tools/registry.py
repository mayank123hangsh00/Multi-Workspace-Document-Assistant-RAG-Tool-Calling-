"""
Tool registry for managing available tools and validating tool calls.
Each tool has a name, description, JSON schema for arguments, and an execute function.
"""
import json
import logging
from typing import Any, Callable, Optional
from uuid import UUID
from pydantic import BaseModel, ValidationError

logger = logging.getLogger(__name__)


class ToolDefinition:
    """Defines a callable tool with its schema and execution logic."""

    def __init__(
        self,
        name: str,
        description: str,
        parameters: dict,
        execute_fn: Callable,
        required_params: list[str] = None,
    ):
        self.name = name
        self.description = description
        self.parameters = parameters
        self.execute_fn = execute_fn
        self.required_params = required_params or []

    def validate_arguments(self, arguments: dict) -> dict:
        """Validate tool arguments against the schema."""
        # Check required parameters
        for param in self.required_params:
            if param not in arguments:
                raise ValueError(f"Missing required parameter: '{param}'")

        # Validate enum values
        properties = self.parameters.get("properties", {})
        for key, value in arguments.items():
            if key in properties:
                prop_schema = properties[key]
                if "enum" in prop_schema and value not in prop_schema["enum"]:
                    raise ValueError(
                        f"Invalid value for '{key}': '{value}'. "
                        f"Must be one of: {prop_schema['enum']}"
                    )
                if prop_schema.get("type") == "string" and not isinstance(value, str):
                    raise ValueError(f"Parameter '{key}' must be a string")

        return arguments

    def to_groq_format(self) -> dict:
        """Convert to Groq's tool/function calling format."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }

    async def execute(self, workspace_id: UUID, session_id: UUID, **kwargs) -> dict:
        """Execute the tool with validated arguments."""
        return await self.execute_fn(
            workspace_id=workspace_id, session_id=session_id, **kwargs
        )


class ToolRegistry:
    """Registry of all available tools. Handles lookup and validation."""

    def __init__(self):
        self._tools: dict[str, ToolDefinition] = {}

    def register(self, tool: ToolDefinition):
        """Register a tool."""
        self._tools[tool.name] = tool
        logger.info(f"Registered tool: {tool.name}")

    def get(self, name: str) -> Optional[ToolDefinition]:
        """Get a tool by name. Returns None if not found."""
        return self._tools.get(name)

    def list_tools(self) -> list[ToolDefinition]:
        """List all registered tools."""
        return list(self._tools.values())

    def get_groq_tools(self) -> list[dict]:
        """Get all tools in Groq's expected format."""
        return [tool.to_groq_format() for tool in self._tools.values()]

    def validate_and_execute_call(
        self, tool_name: str, arguments: dict
    ) -> tuple[bool, str]:
        """
        Validate a tool call from the model.
        Returns (is_valid, error_message).
        """
        tool = self.get(tool_name)
        if not tool:
            return False, f"Unknown tool: '{tool_name}'"

        try:
            tool.validate_arguments(arguments)
            return True, ""
        except ValueError as e:
            return False, str(e)


# Global registry instance
tool_registry = ToolRegistry()
