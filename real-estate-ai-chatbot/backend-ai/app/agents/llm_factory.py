"""
LLM Provider Factory with Multi-Provider Support.

Switch between 4 LLM providers with a single .env variable change.
Supported providers:
- ollama: Local LLM (default, free, production)
- groq: Cloud LLM (free tier, fast)
- openai: Cloud LLM (paid, testing)
- gemini: Cloud LLM (free tier, testing)

Usage:
    from app.agents.llm_factory import get_llm
    llm = get_llm()  # Returns configured provider instance

No code changes needed to switch providers - only edit .env:
    LLM_PROVIDER=ollama    # or: groq, openai, gemini
"""

from langchain_core.language_models import BaseLLM

from app.config import settings
from app.utils.logger import get_logger
from app.utils.exceptions import LLMException

logger = get_logger(__name__)


def get_llm() -> BaseLLM:
    """
    Factory function to instantiate LLM based on settings.llm_provider.

    Automatically selects and initializes the correct LLM provider.
    Provider is controlled by LLM_PROVIDER environment variable in .env.

    Returns:
        BaseLLM: Configured language model instance (ChatOllama, ChatGroq, etc.)

    Raises:
        LLMException: If provider initialization fails
        ValueError: If provider is not supported
    """
    provider = settings.llm_provider.lower()
    logger.info("llm_factory_initialize", provider=provider, model=_get_model_for_provider(provider))

    try:
        if provider == "ollama":
            return _initialize_ollama()
        elif provider == "groq":
            return _initialize_groq()
        elif provider == "openai":
            return _initialize_openai()
        elif provider == "gemini":
            return _initialize_gemini()
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}. "
                           f"Supported: ollama, groq, openai, gemini")
    except LLMException:
        raise
    except Exception as e:
        logger.error("llm_factory_error", provider=provider, error=str(e), exc_info=True)
        raise LLMException(str(e), provider=provider)


def _get_model_for_provider(provider: str) -> str:
    """Get model name for given provider."""
    if provider == "ollama":
        return settings.ollama_model
    elif provider == "groq":
        return settings.groq_model
    elif provider == "openai":
        return settings.openai_model
    elif provider == "gemini":
        return settings.gemini_model
    return "unknown"


def _initialize_ollama() -> BaseLLM:
    """
    Initialize Ollama LLM (local, default, free).

    Connects to local Ollama server running on ollama_base_url.

    Returns:
        ChatOllama: Ollama language model instance

    Raises:
        LLMException: If connection fails
    """
    try:
        from langchain_ollama import ChatOllama
    except ImportError:
        raise LLMException(
            "langchain-ollama not installed. Install: pip install langchain-ollama",
            provider="ollama"
        )

    try:
        logger.debug("ollama_connecting", base_url=settings.ollama_base_url, model=settings.ollama_model)

        llm = ChatOllama(
            model=settings.ollama_model,
            base_url=settings.ollama_base_url,
            temperature=settings.llm_temperature,
            num_predict=settings.llm_max_tokens,
            timeout=settings.llm_timeout_seconds,
        )

        logger.info("ollama_initialized", base_url=settings.ollama_base_url, model=settings.ollama_model)
        return llm

    except Exception as e:
        logger.error("ollama_init_failed", error=str(e), base_url=settings.ollama_base_url, exc_info=True)
        raise LLMException(f"Failed to initialize Ollama: {str(e)}", provider="ollama")


def _initialize_groq() -> BaseLLM:
    """
    Initialize Groq LLM (cloud, free tier, fast).

    Requires GROQ_API_KEY environment variable.

    Returns:
        ChatGroq: Groq language model instance

    Raises:
        LLMException: If initialization fails or API key missing
    """
    if not settings.groq_api_key:
        raise LLMException(
            "GROQ_API_KEY not set in .env - required for Groq provider",
            provider="groq"
        )

    try:
        from langchain_groq import ChatGroq
    except ImportError:
        raise LLMException(
            "langchain-groq not installed. Install: pip install langchain-groq",
            provider="groq"
        )

    try:
        logger.debug("groq_initializing", model=settings.groq_model)

        llm = ChatGroq(
            api_key=settings.groq_api_key,
            model=settings.groq_model,
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
            timeout=settings.llm_timeout_seconds,
        )

        logger.info("groq_initialized", model=settings.groq_model)
        return llm

    except Exception as e:
        logger.error("groq_init_failed", error=str(e), exc_info=True)
        raise LLMException(f"Failed to initialize Groq: {str(e)}", provider="groq")


def _initialize_openai() -> BaseLLM:
    """
    Initialize OpenAI LLM (cloud, paid, testing).

    Requires OPENAI_API_KEY environment variable.

    Returns:
        ChatOpenAI: OpenAI language model instance

    Raises:
        LLMException: If initialization fails or API key missing
    """
    if not settings.openai_api_key:
        raise LLMException(
            "OPENAI_API_KEY not set in .env - required for OpenAI provider",
            provider="openai"
        )

    try:
        from langchain_openai import ChatOpenAI
    except ImportError:
        raise LLMException(
            "langchain-openai not installed. Install: pip install langchain-openai",
            provider="openai"
        )

    try:
        logger.debug("openai_initializing", model=settings.openai_model)

        llm = ChatOpenAI(
            api_key=settings.openai_api_key,
            model=settings.openai_model,
            temperature=settings.llm_temperature,
            max_tokens=settings.llm_max_tokens,
            timeout=settings.llm_timeout_seconds,
            base_url=settings.openai_base_url,
        )

        logger.info("openai_initialized", model=settings.openai_model)
        return llm

    except Exception as e:
        logger.error("openai_init_failed", error=str(e), exc_info=True)
        raise LLMException(f"Failed to initialize OpenAI: {str(e)}", provider="openai")


def _initialize_gemini() -> BaseLLM:
    """
    Initialize Google Gemini LLM (cloud, free tier, testing).

    Requires GOOGLE_API_KEY environment variable.

    Returns:
        ChatGoogleGenerativeAI: Google Gemini language model instance

    Raises:
        LLMException: If initialization fails or API key missing
    """
    if not settings.google_api_key:
        raise LLMException(
            "GOOGLE_API_KEY not set in .env - required for Gemini provider",
            provider="gemini"
        )

    try:
        from langchain_google_genai import ChatGoogleGenerativeAI
    except ImportError:
        raise LLMException(
            "langchain-google-genai not installed. Install: pip install langchain-google-genai",
            provider="gemini"
        )

    try:
        logger.debug("gemini_initializing", model=settings.gemini_model)

        llm = ChatGoogleGenerativeAI(
            api_key=settings.google_api_key,
            model=settings.gemini_model,
            temperature=settings.llm_temperature,
            max_output_tokens=settings.llm_max_tokens,
            timeout=settings.llm_timeout_seconds,
        )

        logger.info("gemini_initialized", model=settings.gemini_model)
        return llm

    except Exception as e:
        logger.error("gemini_init_failed", error=str(e), exc_info=True)
        raise LLMException(f"Failed to initialize Gemini: {str(e)}", provider="gemini")


async def get_llm_async() -> BaseLLM:
    """
    Async wrapper for get_llm().

    Provides consistency with async FastAPI code patterns.
    In reality, LLM instantiation is fast, so async wrapper is simple passthrough.

    Returns:
        BaseLLM: Configured language model instance
    """
    return get_llm()
