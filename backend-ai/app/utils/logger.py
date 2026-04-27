"""
Structured logging configuration using structlog.

All logs include: timestamp, level, logger name, message, and context fields.
No sensitive data (tokens, passwords) should be logged.
"""

import logging
from typing import Any

import structlog


def setup_logging(name: str) -> structlog.BoundLogger:
    """
    Initialize and return a structured logger instance.

    Args:
        name: Logger name (usually __name__ from calling module)

    Returns:
        structlog.BoundLogger: Configured logger instance
    """
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer(),
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    return structlog.get_logger(name)


def get_logger(name: str) -> structlog.BoundLogger:
    """
    Get or create a logger instance.

    Args:
        name: Logger name (usually __name__)

    Returns:
        structlog.BoundLogger: Logger instance
    """
    return structlog.get_logger(name)


def bind_context(**context: Any) -> None:
    """
    Bind context variables to all subsequent logs in this context.

    Example:
        bind_context(request_id="req-123", tenant_id="builder-1")
        logger.info("processing_message", whatsapp_number="1234567890")
        # Output includes: request_id, tenant_id, whatsapp_number

    Args:
        **context: Key-value pairs to bind to logger context
    """
    structlog.contextvars.clear_contextvars()
    for key, value in context.items():
        structlog.contextvars.bind_contextvars(**{key: value})


def unbind_context(*context_keys: str) -> None:
    """
    Remove context variables from logger.

    Args:
        *context_keys: Keys to remove from context
    """
    for key in context_keys:
        structlog.contextvars.unbind_contextvars(key)
