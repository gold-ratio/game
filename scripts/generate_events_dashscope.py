import json
import os
from pathlib import Path

try:
    from openai import OpenAI
except ImportError as exc:
    raise SystemExit("Please install openai first: pip install openai") from exc


BASE_URL = "https://ws-c275f4kyscml8jv2.cn-beijing.maas.aliyuncs.com/compatible-mode/v1"
MODEL = "qwen3.7-plus"
OUTPUT_DIR = Path("generated/events")

LOCATIONS = {
    "campus": "校园",
    "dorm": "宿舍",
    "classroom": "教室",
    "cafeteria": "食堂",
    "library": "图书馆",
    "stadium": "体育场",
}


def build_messages(location_id, location_name):
    schema = {
        "location": location_id,
        "events": [
            {
                "id": f"{location_id}_example",
                "title": "事件标题",
                "location": location_id,
                "condition": {},
                "description": "事件描述",
                "choices": [
                    {
                        "text": "选项文字",
                        "effects": {
                            "health": 0,
                            "energy": 0,
                            "knowledge": 0,
                            "mood": 0,
                            "relationship": 0,
                            "money": 0,
                        },
                        "next_event": None,
                    }
                ],
                "effects": {},
                "next_event": None,
                "weight": 1,
            }
        ],
    }
    return [
        {
            "role": "system",
            "content": (
                "You generate valid JSON only. No markdown. No comments. "
                "All text content must be Chinese. Keep events suitable for a light campus-life simulation game."
            ),
        },
        {
            "role": "user",
            "content": (
                f"Generate 4 random events for location {location_id} ({location_name}). "
                "Return exactly one JSON object matching this schema: "
                f"{json.dumps(schema, ensure_ascii=False)}. "
                "Rules: each event must have 2 choices; effects keys may include health, energy, "
                "knowledge, mood, relationship, money; attribute effects should be between -15 and 15; "
                "money effects should be between -30 and 30; each id must be unique; "
                "condition can be empty object or simple minimum requirements; weight must be 1 to 3."
            ),
        },
    ]


def extract_json(text):
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("No JSON object found in model output.")
    return json.loads(text[start : end + 1])


def validate_payload(payload, location_id):
    required = {"id", "title", "location", "condition", "description", "choices", "effects", "next_event", "weight"}
    if payload.get("location") != location_id:
        payload["location"] = location_id
    events = payload.get("events")
    if not isinstance(events, list) or not events:
        raise ValueError(f"{location_id}: events must be a non-empty list.")
    for event in events:
        missing = required - set(event.keys())
        if missing:
            raise ValueError(f"{location_id}: event missing keys {sorted(missing)}")
        event["location"] = location_id
        if not isinstance(event.get("choices"), list) or len(event["choices"]) < 2:
            raise ValueError(f"{location_id}: event {event.get('id')} must have at least 2 choices.")
    return payload


def generate_for_location(client, location_id, location_name):
    completion = client.chat.completions.create(
        model=MODEL,
        messages=build_messages(location_id, location_name),
        extra_body={"enable_thinking": True},
        stream=False,
    )
    content = completion.choices[0].message.content
    payload = validate_payload(extract_json(content), location_id)
    output_path = OUTPUT_DIR / f"{location_id}.json"
    output_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {output_path}")


def main():
    api_key = os.getenv("DASHSCOPE_API_KEY")
    if not api_key:
        raise SystemExit("Please set DASHSCOPE_API_KEY before running this script.")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    client = OpenAI(api_key=api_key, base_url=BASE_URL)
    for location_id, location_name in LOCATIONS.items():
        generate_for_location(client, location_id, location_name)


if __name__ == "__main__":
    main()
