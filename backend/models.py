from pydantic import BaseModel
from typing import List, Dict, Optional, Union
import time

class ModelInfo(BaseModel):
    id: str
    object: str = "model"
    created: int = int(time.time())
    owned_by: str = "Prism"