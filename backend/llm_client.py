import logging
import asyncio
from typing import Dict, Any

import httpx
import openai
import anthropic
import google.genai as genai

from exceptions import RateLimitException, ServiceUnavailableException, ExternalApiException

class LLMClient:
    def __init__(self):
        self.max_retries = 3

    async def _call_openai_compatible(self, model_config: Dict[str, Any], messages: list[dict]) -> str:
        provider = model_config.get("provider")
        api_key = model_config.get("apiKey")
        model_name = model_config.get("model")
        base_url = model_config.get("baseUrl")

        if not base_url:
            if provider == "openrouter":
                base_url = "https://openrouter.ai/api/v1"
            elif provider == "openai":
                base_url = "https://api.openai.com/v1"

        client = openai.AsyncOpenAI(api_key=api_key, base_url=base_url)
        try:
            response = await client.chat.completions.create(model=model_name, messages=messages, timeout=120)
            content = response.choices[0].message.content
            if not content:
                raise Exception("LLM response was empty or malformed.")
            return content
        except openai.RateLimitError as e:
            raise RateLimitException(f"The '{provider}' API rate limit was exceeded. Please check your plan and quota.")
        except openai.APIStatusError as e:
            if e.status_code >= 500:
                raise ServiceUnavailableException(f"The '{provider}' API is currently unavailable (Status: {e.status_code}). Please try again later.")
            raise ExternalApiException(f"The '{provider}' API returned an unexpected error: {e.status_code}")
        except openai.APIError as e:
            raise ExternalApiException(f"The '{provider}' API returned an unexpected error: {e}")

    async def _call_anthropic(self, model_config: Dict[str, Any], messages: list[dict]) -> str:
        api_key = model_config.get("apiKey")
        model_name = model_config.get("model")

        client = anthropic.AsyncAnthropic(api_key=api_key)
        try:
            response = await client.messages.create(model=model_name, messages=messages, max_tokens=4096, timeout=120)
            content = response.content[0].text
            if not content:
                raise Exception("LLM response was empty or malformed.")
            return content
        except anthropic.RateLimitError as e:
            raise RateLimitException("The 'anthropic' API rate limit was exceeded. Please check your plan and quota.")
        except anthropic.APIStatusError as e:
            if e.status_code >= 500:
                raise ServiceUnavailableException(f"The 'anthropic' API is currently unavailable (Status: {e.status_code}). Please try again later.")
            raise ExternalApiException(f"The 'anthropic' API returned an unexpected error: {e.status_code}")
        except anthropic.APIError as e:
            raise ExternalApiException(f"The 'anthropic' API returned an unexpected error: {e}")

    async def _call_google(self, model_config: Dict[str, Any], messages: list[dict]) -> str:
        api_key = model_config.get("apiKey")
        model_name = model_config.get("model")

        def sync_google_call():
            client = genai.Client(api_key=api_key)
            
            gemini_messages = [
                {"role": "model" if m["role"] == "assistant" else "user", "parts": [m["content"]]}
                for m in messages
            ]
            
            response = client.models.generate_content(
                model=model_name,
                contents=gemini_messages
            )
            
            content = response.text
            if not content:
                raise Exception("LLM response was empty or malformed.")
            return content

        try:
            return await asyncio.to_thread(sync_google_call)
        except Exception as e:
            error_str = str(e).lower()
            if "resource has been exhausted" in error_str or "rate limit" in error_str:
                 raise RateLimitException(f"The 'google' API rate limit was exceeded. Please check your plan and quota. Details: {e}")
            elif "service unavailable" in error_str:
                 raise ServiceUnavailableException(f"The 'google' API is currently unavailable. Please try again later. Details: {e}")
            else:
                 raise ExternalApiException(f"The 'google' API returned an unexpected error: {e}")

    async def chat_completion(self, model_config: Dict[str, Any], messages: list[dict]) -> str:
        provider = model_config.get("provider", "default")

        if provider in ["default", "pollinations"]:
            model_name = model_config.get("model")
            async with httpx.AsyncClient(timeout=120) as client:
                response = await client.post(
                    "http://localhost:8000/v1/internal/pollinations", 
                    json={"model": model_name, "messages": messages}
                )
                response.raise_for_status()
                return response.json()

        if not model_config.get("apiKey") or not model_config.get("model"):
            raise ValueError(f"Missing api_key or model for '{provider}' provider.")
        
        provider_map = {
            "openai": self._call_openai_compatible,
            "openrouter": self._call_openai_compatible,
            "openai_compatible": self._call_openai_compatible,
            "anthropic": self._call_anthropic,
            "google": self._call_google,
        }

        call_func = provider_map.get(provider)
        if not call_func:
            raise ValueError(f"Unsupported provider: '{provider}'.")

        last_exception = None
        for attempt in range(self.max_retries):
            try:
                return await call_func(model_config, messages)
            except (RateLimitException, ServiceUnavailableException, ExternalApiException) as e:
                logging.error(f"LLM call to {provider} failed with a definitive API error: {e}")
                raise e
            except Exception as e:
                last_exception = e
                logging.warning(f"LLMClient attempt {attempt + 1}/{self.max_retries} for {provider} failed: {e}")
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(2 ** attempt)
                else:
                    logging.error(f"Error in LLMClient for {provider} after {self.max_retries} retries: {e}", exc_info=True)
                    raise last_exception
        
        raise last_exception if last_exception else Exception("LLM call failed after all retries.")

llm_client = LLMClient()