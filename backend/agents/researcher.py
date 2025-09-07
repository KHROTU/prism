import logging
import asyncio
from typing import List, Any, AsyncGenerator, Dict
import httpx

from llm_client import llm_client
from .schemas import SummarizedContent, ResearcherOutput
from .utils import extract_json_from_string
from tools.schemas import WebSearchResult

class ResearcherAgent:
    def __init__(self):
        self.api_base_url = "http://localhost:8000"
        self.semaphore = asyncio.Semaphore(5)

    async def run(self, task_id: int, research_prompt: str, search_model_config: Dict[str, Any], summarize_model_config: Dict[str, Any]) -> AsyncGenerator[Dict[str, Any], None]:
        logging.info(f"ResearcherAgent (Task {task_id}): Starting deep dive research for prompt: '{research_prompt}'")
        
        messages = [{"role": "user", "content": self._get_query_generation_prompt(research_prompt)}]
        try:
            llm_response = await llm_client.chat_completion(search_model_config, messages)
            search_queries = extract_json_from_string(llm_response).get("queries", [])
            if not search_queries: raise ValueError("LLM failed to generate search queries.")
            yield {"event": "queries_generated", "data": {"queries": search_queries}}
        except Exception as e:
            logging.error(f"ResearcherAgent (Task {task_id}): Failed to generate queries, falling back. Error: {e}")
            search_queries = [research_prompt]

        async with httpx.AsyncClient() as client:
            search_tasks = [self._execute_search(client, query) for query in search_queries]
            search_results_lists = await asyncio.gather(*search_tasks)
        
        all_results = [item for sublist in search_results_lists for item in sublist]
        unique_urls = {res.link: res for res in all_results}
        unique_search_results = list(unique_urls.values())
        
        yield {"event": "urls_found", "data": {"urls": list(unique_urls.keys())}}
        
        successful_summaries = []
        if unique_search_results:
            summary_queue = asyncio.Queue()
            async with httpx.AsyncClient() as client:
                summary_tasks = [
                    asyncio.create_task(self._summarize_and_queue(client, research_prompt, result, summary_queue, summarize_model_config))
                    for result in unique_search_results
                ]
                
                completed_count = 0
                while completed_count < len(unique_search_results):
                    summary = await summary_queue.get()
                    completed_count += 1
                    if summary:
                        successful_summaries.append(summary)
                        yield {"event": "summary_complete", "data": summary.model_dump()}

                await asyncio.gather(*summary_tasks)
        
        highly_relevant_summaries = [summary for summary in successful_summaries if summary.relevance_score >= 7]
        logging.info(f"ResearcherAgent (Task {task_id}): Successfully summarized {len(successful_summaries)} URLs.")
        yield {"event": "agent_stop", "data": ResearcherOutput(task_id=task_id, summaries=highly_relevant_summaries).model_dump()}

    async def _execute_search(self, client: httpx.AsyncClient, query: str) -> List[WebSearchResult]:
        try:
            res = await client.post(f"{self.api_base_url}/v1/tools/web_search", json={"query": query, "max_results": 5}, timeout=60.0)
            res.raise_for_status()
            return [WebSearchResult.model_validate(item) for item in res.json()]
        except Exception as e:
            logging.error(f"ResearcherAgent: Search failed for query '{query}'. Error: {e}")
            return []

    async def _summarize_and_queue(self, client: httpx.AsyncClient, research_prompt: str, result: WebSearchResult, queue: asyncio.Queue, model_config: Dict[str, Any]):
        summary = await self._summarize_single_url(client, research_prompt, result.link, result.title, model_config)
        await queue.put(summary)

    async def _summarize_single_url(self, client: httpx.AsyncClient, research_prompt: str, url: str, title: str, model_config: Dict[str, Any]) -> SummarizedContent | None:
        async with self.semaphore:
            try:
                res = await client.post(f"{self.api_base_url}/v1/tools/read_website", json={"url": url}, timeout=60.0)
                res.raise_for_status()
                web_content = res.json()
                if not web_content.get("content") or "Error" in web_content.get("title", ""): return None

                messages = [{"role": "user", "content": self._get_summarization_prompt(research_prompt, web_content["content"])}]
                llm_output = await llm_client.chat_completion(model_config, messages)
                summary_json = extract_json_from_string(llm_output)
                return SummarizedContent.model_validate({"url": url, "title": title, **summary_json})
            except Exception as e:
                logging.error(f"ResearcherAgent: Failed to process URL {url}. Error: {e}")
                return None

    def _get_query_generation_prompt(self, research_prompt: str) -> str: return f'You are a search strategist. Generate a JSON object with a "queries" key, containing a list of 3-5 diverse search queries for the given task.\n\nTASK: "{research_prompt}"'
    
    def _get_summarization_prompt(self, research_prompt: str, article_text: str) -> str: return f'You are a Research Analyst. Read the article and determine its relevance to the research prompt. Your output must be a single JSON object with two keys: "summary" (a concise, fact-based summary) and "relevance_score" (an integer from 0-10).\n\nPROMPT: "{research_prompt}"\n\nARTICLE: "{article_text[:15000]}"'