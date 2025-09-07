import json
import logging
import re

def extract_json_from_string(text: str) -> dict:
    try:
        match = re.search(r"```(json)?\s*({.*?})\s*```", text, re.DOTALL)
        if match:
            json_str = match.group(2)
            return json.loads(json_str)

        start_index = text.find('{')
        end_index = text.rfind('}')
        if start_index != -1 and end_index != -1:
            json_str = text[start_index:end_index+1]
            return json.loads(json_str)
        
        raise json.JSONDecodeError("No JSON object found in the string.", text, 0)
    except Exception as e:
        logging.error(f"Failed to extract JSON from text: {text}. Error: {e}")
        raise