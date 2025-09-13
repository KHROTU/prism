from pydantic import BaseModel, Field
from typing import List, Literal, Optional, Union

AgentType = Literal[
    "ResearcherAgent",
    "LeadSynthesizer",
    "CodeExecutor",
    "UserClarificationAgent"
]

class PlanStep(BaseModel):
    task_id: int
    agent: AgentType
    prompt: str
    dependencies: List[int] = Field(default_factory=list)

class ImageSearchResult(BaseModel):
    title: str
    link: str
    source_link: str
    thumbnail_link: str

class SummarizedContent(BaseModel):
    url: str
    title: str
    summary: str = Field(description="A concise, fact-based summary of the article's key points.")
    relevance_score: int = Field(description="A score from 0-10 indicating how relevant the content is to the original research prompt.", ge=0, le=10)

class ResearcherOutput(BaseModel):
    task_id: int
    summaries: List[SummarizedContent]

class CodeExecutorOutput(BaseModel):
    task_id: int
    code: str = Field(description="The Python code that was executed.")
    result: str = Field(description="The captured output (stdout) from the code execution.")

class FinalReport(BaseModel):
    report: str = Field(description="The final, synthesized report in Markdown format.")
    image_urls: List[str] = Field(description="A list of relevant image URLs found during research.")