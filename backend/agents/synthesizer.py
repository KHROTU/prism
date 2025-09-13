import logging
import asyncio
from typing import Dict, Any

from llm_client import llm_client
from .schemas import FinalReport

class LeadSynthesizer:
    def __init__(self):
        self.context_char_limit = 16000

    async def run(self, task_id: int, synthesis_prompt: str, collected_data: str, model_config: Dict[str, Any]) -> FinalReport:
        logging.info(f"LeadSynthesizer (Task {task_id}): Starting final synthesis.")
        
        if len(collected_data) > self.context_char_limit:
            logging.warning(f"LeadSynthesizer: Context length ({len(collected_data)}) exceeds limit ({self.context_char_limit}). Truncating.")
            collected_data = collected_data[:self.context_char_limit]

        final_prompt = self._get_synthesis_prompt(synthesis_prompt, collected_data)
        messages = [{"role": "user", "content": final_prompt}]
        
        try:
            final_report_text = await llm_client.chat_completion(model_config, messages)
            return FinalReport(report=final_report_text, image_urls=[])

        except Exception as e:
            logging.error(f"LeadSynthesizer (Task {task_id}): Failed to generate final report. Error: {e}", exc_info=True)
            return FinalReport(report="An error occurred during the final synthesis.", image_urls=[])

    def _get_synthesis_prompt(self, original_prompt: str, context: str) -> str:
        return f"""
You are the Lead Synthesizer, an expert research analyst and writer. Your task is to take a user's original query and a body of collected research data (including text summaries and image URLs), and synthesize them into a single, comprehensive, and well-written final report in Markdown format.

**USER'S ORIGINAL QUERY:**
"{original_prompt}"

**COLLECTED RESEARCH DATA:**
---
{context}
---

**YOUR TASK:**
Carefully review all the collected research data provided above. Synthesize this information to generate a final, high-quality report that directly and completely answers the user's original query. The report should be structured, coherent, and written in clear, professional language. Use Markdown for formatting (headings, bold text, lists, etc.) where appropriate. DO NOT invent or hallucinate information; base your report strictly on the provided data.

**IMPORTANT:** If the collected data presents multiple viewpoints on a topic, ensure your final report reflects this by neutrally presenting the different perspectives. Your goal is a balanced and comprehensive overview, not to take a side.
"""