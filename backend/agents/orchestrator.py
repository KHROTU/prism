import logging
import asyncio
from typing import List, Dict, Any

from llm_client import llm_client
from .schemas import PlanStep, ResearcherOutput, CodeExecutorOutput
from .utils import extract_json_from_string

class ChiefOrchestrator:
    async def get_next_step(self, user_query: str, history: List[Dict[str, Any]], model_config: Dict[str, Any]) -> PlanStep:
        logging.info("Orchestrator: Determining next step...")
        
        prompt = self._get_planner_prompt(user_query, history)
        messages = [{"role": "user", "content": prompt}]
        
        try:
            response_str = await llm_client.chat_completion(model_config, messages)
            step_json = extract_json_from_string(response_str)
            validated_step = PlanStep.model_validate(step_json)
            logging.info(f"Orchestrator: Next step is '{validated_step.agent}' with prompt: '{validated_step.prompt}'")
            return validated_step
        except Exception as e:
            raise Exception(f"The orchestrator LLM failed to determine the next step: {e}")

    def _get_planner_prompt(self, user_query: str, history: List[Dict[str, Any]]) -> str:
        history_str = self._format_history(history)
        return f"""
You are a world-class research director. Your task is to analyze a user's query and a history of previous research steps to decide the single next action to take.

**User Query:** "{user_query}"

**Research History (Full Summaries):**
---
{history_str}
---

**Available Agents:**
- "ResearcherAgent": Use this to find new information on the web. This agent performs a search, reads the content, and returns summaries all in one step.
- "CodeExecutor": Use this for precise calculations.
- "LeadSynthesizer": Use this ONLY when all research is complete.

**Your Task:**
Based on the user query and the detailed history, decide the single next step. Your output MUST be a single, valid JSON object for the PlanStep.

**CRITICAL DECISION LOGIC:**
1.  **Is more information needed?** If the history does not contain the answer, use `ResearcherAgent` to find it.
2.  **Is a calculation needed AND the data is available?** If the history now contains the specific numbers needed for a calculation, you MUST use `CodeExecutor`. Your prompt for the `CodeExecutor` must contain the actual numbers you extracted from the history.
3.  **Is all research complete?** If you have gathered all necessary facts and performed all calculations, the final step is `LeadSynthesizer`.

**Example `CodeExecutor` Task:**
If the history contains "Mars orbital period is 687 Earth days" and "Jupiter's is 4333 days", your JSON output should be:
```json
{{
  "task_id": {len(history) + 1},
  "agent": "CodeExecutor",
  "prompt": "Calculate 4333 / 687",
  "dependencies": [3]
}}
```

**JSON Schema:**
```json
{{
  "task_id": {len(history) + 1},
  "agent": "Name of the agent for the next step",
  "prompt": "The detailed prompt for that agent",
  "dependencies": []
}}
```

**YOUR RESPONSE (JSON only):**
"""

    def _format_history(self, history: List[Dict[str, Any]]) -> str:
        if not history:
            return "No steps have been taken yet."
        
        formatted_history = []
        for item in history:
            task_id = item.get("task_id", "N/A")
            agent = item.get("agent", "Unknown")
            output = item.get("output", {})
            
            entry = f"Step {task_id}: {agent}"
            if isinstance(output, ResearcherOutput):
                summaries = [f"- Source: {s.url}\\n  Summary: {s.summary}" for s in output.summaries]
                entry += f"\\n  - Found {len(summaries)} relevant sources:\\n  " + "\\n  ".join(summaries)
            elif isinstance(output, CodeExecutorOutput):
                entry += f"\\n  - Executed code and got result: {output.result}"
            
            formatted_history.append(entry)
            
        return "\\n\\n".join(formatted_history)