from __future__ import annotations

import requests
from typing import Any
from tools._shared import err

def get_weather(location: str = "") -> dict[str, Any]:
    """
    Tra cứu thời tiết hiện tại của một địa điểm cụ thể sử dụng dịch vụ wttr.in.
    """
    try:
        if not location:
            return {
                "tool": "weather",
                "location": "",
                "weather_info": "Vui lòng cung cấp tên địa điểm cần tra cứu thời tiết."
            }
        
        # Call wttr.in with the format flag for simple 1-line description
        # We replace spaces with pluses for URL compatibility
        clean_location = location.strip().replace(" ", "+")
        url = f"https://wttr.in/{clean_location}?format=3"
        
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        weather_text = response.text.strip()
        
        return {
            "tool": "weather",
            "location": location,
            "weather_info": weather_text
        }
    except Exception as exc:
        return err("weather", exc)
