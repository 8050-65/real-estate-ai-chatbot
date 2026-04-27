"""
Custom application exceptions.

All exceptions inherit from AppException for consistent error handling.
"""


class AppException(Exception):
    """Base application exception."""

    def __init__(self, message: str, code: str = "INTERNAL_ERROR", status_code: int = 500):
        """
        Initialize application exception.

        Args:
            message: Human-readable error message
            code: Machine-readable error code
            status_code: HTTP status code (400, 401, 403, 404, 500, etc.)
        """
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code

    def to_dict(self) -> dict:
        """Return exception as dictionary for JSON response."""
        return {
            "error": self.code,
            "message": self.message,
            "status_code": self.status_code,
        }


class ValidationException(AppException):
    """Raised when input validation fails."""

    def __init__(self, message: str):
        super().__init__(message, code="VALIDATION_ERROR", status_code=400)


class AuthenticationException(AppException):
    """Raised when authentication fails."""

    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, code="AUTH_ERROR", status_code=401)


class PermissionException(AppException):
    """Raised when user lacks required permissions."""

    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(message, code="PERMISSION_ERROR", status_code=403)


class ResourceNotFoundException(AppException):
    """Raised when requested resource is not found."""

    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, code="NOT_FOUND", status_code=404)


class ConflictException(AppException):
    """Raised when request conflicts with existing state."""

    def __init__(self, message: str):
        super().__init__(message, code="CONFLICT", status_code=409)


class LLMException(AppException):
    """Raised when LLM operation fails."""

    def __init__(self, message: str, provider: str = "unknown"):
        full_message = f"LLM error ({provider}): {message}"
        super().__init__(full_message, code="LLM_ERROR", status_code=503)


class LeadratException(AppException):
    """Raised when Leadrat API call fails."""

    def __init__(self, message: str, endpoint: str = "unknown"):
        full_message = f"Leadrat API error ({endpoint}): {message}"
        super().__init__(full_message, code="LEADRAT_ERROR", status_code=502)


class EngagetoException(AppException):
    """Raised when Engageto API call fails."""

    def __init__(self, message: str):
        super().__init__(message, code="ENGAGETO_ERROR", status_code=502)


class RedisException(AppException):
    """Raised when Redis operation fails."""

    def __init__(self, message: str):
        super().__init__(message, code="REDIS_ERROR", status_code=503)


class DatabaseException(AppException):
    """Raised when database operation fails."""

    def __init__(self, message: str):
        super().__init__(message, code="DATABASE_ERROR", status_code=503)


class TimeoutException(AppException):
    """Raised when operation times out."""

    def __init__(self, message: str = "Operation timed out"):
        super().__init__(message, code="TIMEOUT", status_code=504)
