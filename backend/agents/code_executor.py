import logging
import asyncio
import docker
import sys
from docker.errors import ContainerError, ImageNotFound
from typing import Any, AsyncGenerator, Dict

from llm_client import llm_client
from .schemas import CodeExecutorOutput

DOCKER_IMAGE = "python:3.11-slim"
EXECUTION_TIMEOUT_SECONDS = 10
MAX_MEMORY_MB = 128
DOCKER_NETWORK = "prism-sandbox-net"

class CodeExecutor:
    def __init__(self):
        self.docker_client = None
        try:
            if sys.platform == "win32":
                self.docker_client = docker.DockerClient(base_url='npipe:////./pipe/docker_engine')
            else:
                self.docker_client = docker.from_env()

            self.docker_client.ping()
            logging.info("Docker client initialized successfully.")
            self._setup_docker_environment()
        except Exception as e:
            logging.error(f"Failed to initialize Docker client. Please ensure Docker is running. Error: {e}")
            self.docker_client = None
    
    def _setup_docker_environment(self):
        try:
            self.docker_client.images.get(DOCKER_IMAGE)
        except docker.errors.ImageNotFound:
            logging.warning(f"Image '{DOCKER_IMAGE}' not found. Pulling from Docker Hub...")
            try:
                self.docker_client.images.pull(DOCKER_IMAGE)
            except Exception as e:
                logging.error(f"CRITICAL: Failed to pull '{DOCKER_IMAGE}'. Run 'docker pull {DOCKER_IMAGE}' manually. Error: {e}")
                self.docker_client = None 
                return
        try:
            self.docker_client.networks.get(DOCKER_NETWORK)
        except docker.errors.NotFound:
            self.docker_client.networks.create(DOCKER_NETWORK, internal=True)
        
    async def run(self, task_id: int, prompt: str, model_config: Dict[str, Any]) -> AsyncGenerator[Dict[str, Any], None]:
        output = None
        if not self.docker_client:
            output = CodeExecutorOutput(task_id=task_id, code="# Docker client not available.", result="Error: Code execution environment not configured.")
        else:
            logging.info(f"CodeExecutor (Task {task_id}): Starting code generation for prompt: '{prompt}'")
            messages = [{"role": "user", "content": self._get_code_generation_prompt(prompt)}]
            try:
                llm_response = await llm_client.chat_completion(model_config, messages)
                generated_code = self._extract_python_code(llm_response)
                if not generated_code: raise ValueError("LLM failed to produce a valid Python code block.")
                
                yield {"event": "code_executing", "data": {"code": generated_code}}
                execution_result = await self._run_in_docker(generated_code)

                output = CodeExecutorOutput(task_id=task_id, code=generated_code, result=execution_result.strip())
            except Exception as e:
                logging.error(f"CodeExecutor (Task {task_id}): Error: {e}", exc_info=True)
                output = CodeExecutorOutput(task_id=task_id, code="# Error during generation.", result=f"Failed to generate or execute code: {e}")
        
        yield {"event": "agent_stop", "data": output.model_dump()}

    async def _run_in_docker(self, code: str) -> str:
        def sync_docker_run():
            container = None
            try:
                container = self.docker_client.containers.create(
                    image=DOCKER_IMAGE,
                    command=["python", "-c", code],
                    mem_limit=f"{MAX_MEMORY_MB}m",
                    network=DOCKER_NETWORK
                )
                container.start()
                result = container.wait(timeout=EXECUTION_TIMEOUT_SECONDS)
                stdout = container.logs(stdout=True, stderr=False).decode('utf-8')
                stderr = container.logs(stdout=False, stderr=True).decode('utf-8')
                return stdout if result['StatusCode'] == 0 else f"Execution Error:\n{stderr}"
            except docker.errors.Timeout: return f"Execution Error: Timeout after {EXECUTION_TIMEOUT_SECONDS} seconds."
            except ContainerError as e: return f"Container Error: {e.stderr.decode('utf-8') if e.stderr else 'Unknown'}"
            except Exception as e: return f"Docker Infrastructure Error: {e}"
            finally:
                if container: container.remove(force=True)
        return await asyncio.to_thread(sync_docker_run)

    def _extract_python_code(self, response: str) -> str:
        if "```python" in response: return response.split("```python")[1].split("```")[0].strip()
        if "```" in response: return response.split("```")[1].split("```")[0].strip()
        return response.strip()

    def _get_code_generation_prompt(self, task_prompt: str) -> str: return f'You are an expert Python programmer. Write a simple, one-line script to solve the problem. Your response MUST be ONLY raw Python code in a ```python ... ``` block. The script must be self-contained and print the final result to standard output.\n\nTASK: "{task_prompt}"'