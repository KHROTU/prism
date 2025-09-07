import json
import logging
import time
from curl_cffi import requests
from exceptions import RateLimitException, ServiceUnavailableException, ExternalApiException

class PollinationsClient:
    def __init__(self):
        self.api_url = "https://text.pollinations.ai/openai"
        self.headers = {"Content-Type": "application/json"}
        self.max_retries = 3

    def chat_completion_sync(self, model: str, messages: list[dict]) -> str:
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "referrer": "tgpt",
            "temperature": 1.0,
            "top_p": 1.0,
        }
        
        last_exception = None
        for attempt in range(self.max_retries):
            try:
                response = requests.post(
                    self.api_url,
                    headers=self.headers,
                    json=payload,
                    impersonate="chrome120",
                    timeout=120
                )
                response.raise_for_status()
                data = response.json()
                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                if not content:
                    raise Exception("LLM response was empty or malformed.")
                return content
            except requests.errors.HttpError as e:
                last_exception = e
                logging.warning(f"PollinationsClient attempt {attempt + 1}/{self.max_retries} failed with HTTP error: {e}")
                if e.response.status_code == 429:
                    raise RateLimitException("The default LLM provider has rate limited your IP. Please try again later or configure a custom model in Settings.")
                elif e.response.status_code >= 500:
                    raise ServiceUnavailableException("The default LLM provider is currently unavailable. Please try again later.")
                else:
                    raise ExternalApiException(f"The default LLM provider returned an unexpected error: {e.response.status_code}")
            except Exception as e:
                last_exception = e
                logging.warning(f"PollinationsClient attempt {attempt + 1}/{self.max_retries} failed: {e}")
                if attempt < self.max_retries - 1:
                    time.sleep(2 ** attempt)
                else:
                    logging.error(f"Error in PollinationsClient after {self.max_retries} retries: {e}")
                    if 'response' in locals() and response:
                        logging.error(f"Raw Error Response: {response.text}")
                    raise last_exception

pollinations_client = PollinationsClient()