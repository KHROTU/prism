import asyncio
import json
from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any, Optional
import logging
import sys
import os
from pydantic import BaseModel

sys.path.append(os.path.join(os.path.dirname(__file__)))

from models import ModelInfo
from config import DEFAULT_MODEL_MAPPING
from tools import search, web_reader, schemas as tool_schemas
from exceptions import ExternalApiException, RateLimitException, ServiceUnavailableException
from agents.schemas import FinalReport, CodeExecutorOutput, PlanStep, ResearcherOutput
from agents.orchestrator import ChiefOrchestrator
from agents.synthesizer import LeadSynthesizer
from agents.code_executor import CodeExecutor
from agents.researcher import ResearcherAgent
from pollinations_client import pollinations_client
from llm_client import llm_client

app = FastAPI(
    title="PRISM Backend API",
    description="Orchestrates a high-performance, pure Python multi-agent research workflow.",
    version="2.4.0"
)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"]
)

orchestrator = ChiefOrchestrator()
researcher_agent = ResearcherAgent()
code_executor = CodeExecutor()
lead_synthesizer = LeadSynthesizer()

AVAILABLE_TOOLS = {
    "web_search": {"function": search.web_search, "input_schema": tool_schemas.WebSearchInput},
    "read_website": {"function": web_reader.read_website, "input_schema": tool_schemas.WebReaderInput},
    "image_search": {"function": search.image_search, "input_schema": tool_schemas.ImageSearchInput}
}

class ApiKeys(BaseModel):
    google_api_key: str
    google_cx_id: str

class ModelConfig(BaseModel):
    provider: str
    model: Optional[str] = None
    apiKey: Optional[str] = None
    baseUrl: Optional[str] = None

class ResearchRequest(BaseModel):
    query: str
    model_configs: Dict[str, ModelConfig]

async def research_event_stream(user_query: str, model_configs: Dict[str, ModelConfig]):
    research_history = []
    max_steps = 10

    final_configs = {}
    for agent_name, defaults in DEFAULT_MODEL_MAPPING.items():
        user_config = model_configs.get(agent_name)
        if user_config and user_config.provider != "default":
            final_configs[agent_name] = user_config.model_dump()
        else:
            final_configs[agent_name] = {"provider": "default", **defaults}


    try:
        logging.info("--- STARTING DYNAMIC AGENT EXECUTION (STREAM) ---")
        for i in range(max_steps):
            yield json.dumps({"event": "log", "data": {"message": "Orchestrator is planning the next step..."}})
            next_step: PlanStep = await orchestrator.get_next_step(user_query, research_history, final_configs["prism-reasoning-core"])
            yield json.dumps({"event": "agent_start", "data": next_step.model_dump()})

            agent_output = None
            agent_runner = None

            if next_step.agent == "ResearcherAgent":
                agent_runner = researcher_agent.run(next_step.task_id, next_step.prompt, final_configs["prism-researcher-default"], final_configs["prism-summarizer-large-context"])
            elif next_step.agent == "CodeExecutor":
                agent_runner = code_executor.run(next_step.task_id, next_step.prompt, final_configs["prism-coder-agent"])
            elif next_step.agent == "LeadSynthesizer":
                all_context_parts = []
                for hist_item in research_history:
                    output = hist_item.get("output")
                    if isinstance(output, ResearcherOutput):
                        summaries_str = "\n".join([f"Source: {s.url}\nTitle: {s.title}\nSummary: {s.summary}" for s in output.summaries])
                        all_context_parts.append(f"**Web Research Summaries:**\n{summaries_str}")
                    elif isinstance(output, CodeExecutorOutput):
                        code_str = f"**Calculation Result:**\nTask: {hist_item['prompt']}\nResult:\n```\n{output.result}\n```"
                        all_context_parts.append(code_str)
                context_str = "\n\n---\n\n".join(all_context_parts)
                image_results = await AVAILABLE_TOOLS["image_search"]["function"](query=user_query)
                image_urls = [res.link for res in image_results]
                final_report_output = await lead_synthesizer.run(next_step.task_id, user_query, context_str, final_configs["prism-reasoning-core"])
                final_report_output.image_urls = image_urls
                
                logging.info("--- AGENT EXECUTION COMPLETE (STREAM) ---")
                yield json.dumps({"event": "complete", "data": final_report_output.model_dump()})
                return

            if agent_runner:
                async for event in agent_runner:
                    if event.get("event") == "agent_stop":
                        output_data = event.get("data", {})
                        if next_step.agent == "ResearcherAgent":
                            agent_output = ResearcherOutput.model_validate(output_data)
                        elif next_step.agent == "CodeExecutor":
                            agent_output = CodeExecutorOutput.model_validate(output_data)
                        break
                    else:
                        yield json.dumps(event)

            if agent_output:
                history_entry = {"task_id": next_step.task_id, "agent": next_step.agent, "prompt": next_step.prompt, "output": agent_output}
                research_history.append(history_entry)
            elif next_step.agent != "LeadSynthesizer":
                raise Exception(f"Agent {next_step.agent} failed to produce output.")

        raise Exception("Research process exceeded maximum step limit.")
    except ExternalApiException as e:
        logging.error(f"Stopping research due to external API error: {e}")
        yield json.dumps({"event": "error", "data": {"detail": str(e)}})
    except Exception as e:
        logging.error(f"An error occurred during the research stream: {e}", exc_info=True)
        yield json.dumps({"event": "error", "data": {"detail": f"A critical error occurred: {e}"}})

@app.get("/health")
async def health_check(): return {"status": "ok"}

@app.post("/v1/config/keys")
async def update_api_keys(keys: ApiKeys):
    search.IN_MEMORY_API_KEY, search.IN_MEMORY_CX_ID = keys.google_api_key, keys.google_cx_id
    logging.info("Google API keys have been updated in memory for this session.")
    return {"message": "API keys updated successfully."}

@app.get("/v1/models", response_model=Dict)
async def list_models():
    models = [ModelInfo(id=model_id) for model_id in DEFAULT_MODEL_MAPPING.keys()]
    return {"data": models, "object": "list"}
    
class PollinationsRequest(BaseModel):
    model: str
    messages: List[Dict[str, Any]]

@app.post("/v1/internal/pollinations")
async def proxy_pollinations(request: PollinationsRequest):
    try:
        response = await asyncio.to_thread(
            pollinations_client.chat_completion_sync, request.model, request.messages
        )
        return JSONResponse(content=response)
    except RateLimitException as e:
        raise HTTPException(status_code=429, detail=str(e))
    except ServiceUnavailableException as e:
        raise HTTPException(status_code=503, detail=str(e))
    except ExternalApiException as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/tools/{tool_name}")
async def use_tool(tool_name: str, payload: Dict[str, Any] = Body(...)):
    if tool_name not in AVAILABLE_TOOLS: raise HTTPException(status_code=404, detail=f"Tool '{tool_name}' not found.")
    tool_info = AVAILABLE_TOOLS[tool_name]
    try:
        validated_input = tool_info["input_schema"](**payload)
        return await tool_info["function"](**validated_input.model_dump())
    except RateLimitException as e:
        raise HTTPException(status_code=429, detail=str(e))
    except ServiceUnavailableException as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logging.error(f"Error using tool {tool_name}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/v1/prism/research/stream")
async def start_research_stream(request: ResearchRequest):
    async def event_generator():
        async for event_data in research_event_stream(request.query, request.model_configs):
            yield f"data: {event_data}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)