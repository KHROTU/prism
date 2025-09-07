import os
import httpx
import logging
from dotenv import load_dotenv
from .schemas import WebSearchResult, ImageSearchResult
from exceptions import RateLimitException, ServiceUnavailableException

load_dotenv()

IN_MEMORY_API_KEY = os.getenv("GOOGLE_API_KEY")
IN_MEMORY_CX_ID = os.getenv("GOOGLE_CX_ID")

def _check_api_credentials():
    if not IN_MEMORY_API_KEY or not IN_MEMORY_CX_ID:
        logging.error("Missing GOOGLE_API_KEY or GOOGLE_CX_ID. Configure them in the UI or a .env file.")
        raise RuntimeError("Search API is not configured. Please check your settings.")

API_ENDPOINT = "https://www.googleapis.com/customsearch/v1"

async def web_search(query: str, max_results: int = 5, region: str = "us-en") -> list[WebSearchResult]:
    _check_api_credentials()
    logging.info(f"Performing async Google web search for: '{query}'")
    
    params = {
        "key": IN_MEMORY_API_KEY,
        "cx": IN_MEMORY_CX_ID,
        "q": query,
        "num": max_results,
        "gl": region.split('-')[0],
        "safe": "active"
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(API_ENDPOINT, params=params)
            response.raise_for_status()
            data = response.json()

        results = [
            WebSearchResult(
                title=item.get("title", ""),
                link=item.get("link", ""),
                snippet=item.get("snippet", "")
            )
            for item in data.get("items", [])
        ]
        logging.info(f"Google web search returned {len(results)} results.")
        return results
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            logging.error("Google Search API rate limit exceeded.")
            raise RateLimitException("Google Search API rate limit exceeded. Please check your quota and try again later.")
        else:
            logging.error(f"An unexpected HTTP error occurred during Google web search: {e}", exc_info=True)
            raise ServiceUnavailableException(f"Google Search API returned an error: {e.response.status_code}")
    except Exception as e:
        logging.error(f"An unexpected error occurred during Google web search: {e}", exc_info=True)
        raise ServiceUnavailableException(f"An unexpected error occurred during Google web search: {e}")

async def image_search(query: str, max_results: int = 4) -> list[ImageSearchResult]:
    _check_api_credentials()
    logging.info(f"Performing async Google image search for: '{query}'")
    
    params = {
        "key": IN_MEMORY_API_KEY,
        "cx": IN_MEMORY_CX_ID,
        "q": query,
        "num": max_results,
        "searchType": "image",
        "safe": "active"
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(API_ENDPOINT, params=params)
            response.raise_for_status()
            data = response.json()

        results = [
            ImageSearchResult(
                title=item.get("title", ""),
                link=item.get("link", ""),
                source_link=item.get("image", {}).get("contextLink", ""),
                thumbnail_link=item.get("image", {}).get("thumbnailLink", "")
            )
            for item in data.get("items", [])
        ]
        logging.info(f"Google image search returned {len(results)} results.")
        return results
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 429:
            logging.error("Google Image Search API rate limit exceeded.")
            raise RateLimitException("Google Image Search API rate limit exceeded. Please check your quota and try again later.")
        else:
            logging.error(f"An unexpected HTTP error occurred during Google image search: {e}", exc_info=True)
            raise ServiceUnavailableException(f"Google Image Search API returned an error: {e.response.status_code}")
    except Exception as e:
        logging.error(f"An unexpected error occurred during Google image search: {e}", exc_info=True)
        raise ServiceUnavailableException(f"An unexpected error occurred during Google image search: {e}")