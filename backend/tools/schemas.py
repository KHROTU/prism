from pydantic import BaseModel, Field
from typing import List, Optional

class WebSearchInput(BaseModel):
    query: str = Field(description="The search query.")
    max_results: int = Field(5, description="The maximum number of results to return.")
    region: str = Field("us-en", description="The region for the search, e.g., 'us-en', 'de-de'.")

class WebSearchResult(BaseModel):
    title: str
    link: str
    snippet: str

class WebReaderInput(BaseModel):
    url: str = Field(description="The URL of the webpage to read.")

class WebReaderResult(BaseModel):
    url: str
    title: str
    content: str = Field(description="The cleaned article content in Markdown format.")

class ImageSearchInput(BaseModel):
    query: str = Field(description="The image search query.")
    max_results: int = Field(4, description="The number of images to return. Google max is 10.")

class ImageSearchResult(BaseModel):
    title: str
    link: str
    source_link: str
    thumbnail_link: str