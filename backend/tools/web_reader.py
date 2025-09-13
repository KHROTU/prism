import httpx
from bs4 import BeautifulSoup
from readability import Document
from .schemas import WebReaderResult
import logging
import io
from pypdf import PdfReader
from fake_useragent import UserAgent
import asyncio

ua = UserAgent()

async def read_website(url: str) -> WebReaderResult:
    logging.info(f"Reading website content from: {url}")
    headers = {'User-Agent': ua.random}
    
    try:
        async with httpx.AsyncClient(headers=headers, follow_redirects=True, timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()

        content_type = response.headers.get("content-type", "").lower()
        is_pdf = "application/pdf" in content_type

        if is_pdf:
            logging.info(f"PDF content type detected. Parsing with pypdf: {url}")
            
            def sync_parse_pdf(pdf_content: bytes) -> WebReaderResult:
                pdf_stream = io.BytesIO(pdf_content)
                reader = PdfReader(pdf_stream)
                title = "PDF Document"
                if reader.metadata and reader.metadata.title:
                    title = reader.metadata.title
                content_text = "\n\n".join(page.extract_text() for page in reader.pages if page.extract_text())
                return WebReaderResult(url=url, title=title, content=content_text.strip())
                
            return await asyncio.to_thread(sync_parse_pdf, response.content)
        else:
            logging.info(f"HTML content type detected. Parsing with readability: {url}")
            doc = Document(response.text)
            title = doc.title()
            content_html = doc.summary()
            soup = BeautifulSoup(content_html, 'html.parser')
            
            content_text_parts = []
            for element in soup.find_all(['h1', 'h2', 'p', 'li']):
                if element.name == 'h1':
                    content_text_parts.append(f"# {element.get_text()}\n")
                elif element.name == 'h2':
                    content_text_parts.append(f"## {element.get_text()}\n")
                else:
                    content_text_parts.append(f"{element.get_text()}\n")

            return WebReaderResult(url=url, title=title, content="\n".join(content_text_parts).strip())

    except Exception as e:
        logging.error(f"Failed to read and parse URL {url}: {e}")
        return WebReaderResult(url=url, title="Error", content=f"Could not retrieve content from URL. Reason: {e}")