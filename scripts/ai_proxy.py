import json
import os
import re
import time
import traceback
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

try:
    from openai import OpenAI
except ImportError as exc:
    raise SystemExit("Please install openai first: pip install openai") from exc


BASE_URL = "https://ws-c275f4kyscml8jv2.cn-beijing.maas.aliyuncs.com/compatible-mode/v1"
MODEL = os.getenv("DASHSCOPE_MODEL", "qwen3.7-plus")
HOST = os.getenv("CAMPUS_AI_HOST", "127.0.0.1")
PORT = int(os.getenv("CAMPUS_AI_PORT", "8765"))
OUTPUT_DIR = Path("generated/ai_runtime")
EFFECT_KEYS = ("health", "energy", "knowledge", "mood", "relationship", "money")
PERIODS = ("上午", "下午", "晚上")
LOCATIONS = {
    "campus": "校园",
    "dorm": "宿舍",
    "classroom": "教室",
    "cafeteria": "食堂",
    "library": "图书馆",
    "stadium": "体育场",
}


def clamp(value, low, high):
    try:
      number = int(round(float(value)))
    except (TypeError, ValueError):
      return 0
    return max(low, min(high, number))


def extract_json(text):
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?", "", text).strip()
        text = re.sub(r"```$", "", text).strip()

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("model output does not contain a JSON object")
    return json.loads(text[start : end + 1])


def safe_id(text, fallback):
    text = re.sub(r"[^a-zA-Z0-9_]+", "_", str(text or "")).strip("_").lower()
    return text[:60] or fallback


def normalize_effects(effects):
    result = {}
    if not isinstance(effects, dict):
        return result
    for key in EFFECT_KEYS:
        if key in effects:
            limit = 40 if key == "money" else 15
            value = clamp(effects[key], -limit, limit)
            if value:
                result[key] = value
    return result


def normalize_event(payload, context):
    if not isinstance(payload, dict):
        raise ValueError("event must be an object")

    location_id = context.get("locationId") or payload.get("location") or "campus"
    if location_id not in LOCATIONS:
        location_id = "campus"

    choices = []
    for choice in payload.get("choices", [])[:3]:
        if not isinstance(choice, dict) or not choice.get("text"):
            continue
        choices.append({
            "text": str(choice["text"])[:36],
            "effects": normalize_effects(choice.get("effects")),
            "next_event": None,
        })

    if len(choices) < 2:
        raise ValueError("event must contain at least 2 choices")

    title = str(payload.get("title") or "AI 校园插曲")[:24]
    event_id = safe_id(payload.get("id"), f"ai_{location_id}_{int(time.time())}")
    if not event_id.startswith("ai_"):
        event_id = f"ai_{location_id}_{event_id}"

    return {
        "id": event_id,
        "title": title,
        "location": location_id,
        "condition": payload.get("condition") if isinstance(payload.get("condition"), dict) else {},
        "description": str(payload.get("description") or "校园里发生了一件意料之外的小事。")[:220],
        "choices": choices,
        "effects": {},
        "next_event": None,
        "weight": 1,
        "periodWeights": payload.get("periodWeights") if isinstance(payload.get("periodWeights"), dict) else {
            "上午": 0.34,
            "下午": 0.33,
            "晚上": 0.33,
        },
        "generatedBy": f"ai-{MODEL}",
    }


def normalize_dialogue(payload, context):
    lines = payload.get("lines") or payload.get("dialogues")
    if not isinstance(lines, list):
        raise ValueError("dialogue lines must be a list")

    normalized = [str(line).strip()[:90] for line in lines if str(line).strip()]
    if not normalized:
        raise ValueError("dialogue lines are empty")

    return {
        "lines": normalized[:4],
        "generatedBy": f"ai-{MODEL}",
    }


def normalize_diary(payload, context):
    title = str(payload.get("title") or f"今日校园日记 第 {context.get('finishedDay', '?')} 天")[:40]
    content = str(payload.get("content") or "").strip()
    if not content:
        raise ValueError("diary content is empty")

    return {
        "day": context.get("finishedDay"),
        "title": title,
        "content": content[:900],
        "endingNote": str(payload.get("endingNote") or "今天也留下了新的校园痕迹。")[:80],
        "generatedBy": f"ai-{MODEL}",
    }


def build_event_messages(context):
    location_id = context.get("locationId", "campus")
    location_name = context.get("locationName") or LOCATIONS.get(location_id, location_id)
    period = context.get("period", "上午")
    existing = context.get("existingEvents", [])
    state = context.get("state", {})
    recent = context.get("recentRecords", [])
    schema = {
        "id": f"ai_{location_id}_short_slug",
        "title": "中文事件标题",
        "location": location_id,
        "condition": {},
        "description": "中文事件描述",
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
            },
            {
                "text": "另一个选项",
                "effects": {
                    "mood": 0,
                },
                "next_event": None,
            },
        ],
        "effects": {},
        "next_event": None,
        "weight": 1,
        "periodWeights": {"上午": 0.34, "下午": 0.33, "晚上": 0.33},
    }
    return [
        {
            "role": "system",
            "content": (
                "你是一个中文校园生活模拟游戏的事件导演。只输出一个合法 JSON 对象，不要 Markdown。"
                "内容要有想象力，可以轻微荒诞、幽默或意外，适合大学校园，不能血腥、政治化或违法。"
            ),
        },
        {
            "role": "user",
            "content": (
                f"地点：{location_name}({location_id})。时间段：{period}。\n"
                f"玩家状态：{json.dumps(state, ensure_ascii=False)}\n"
                f"今日已发生：{json.dumps(recent, ensure_ascii=False)}\n"
                f"已有本地事件：{json.dumps(existing, ensure_ascii=False)}\n"
                "请生成 1 个新的即时事件，避免和已有事件重复。"
                "事件要像大学生活里的一个小插曲，最好有一点新奇感。"
                "必须有 2 个选项，每个选项的 effects 只能使用 health, energy, knowledge, mood, relationship, money。"
                "属性变化范围 -15 到 15，money 范围 -40 到 40。"
                f"严格匹配这个 JSON 结构：{json.dumps(schema, ensure_ascii=False)}"
            ),
        },
    ]


def build_dialogue_messages(context):
    npc = context.get("npc", {})
    state = context.get("state", {})
    return [
        {
            "role": "system",
            "content": "你是校园 NPC 即兴对话生成器。只输出 JSON 对象，不要 Markdown。",
        },
        {
            "role": "user",
            "content": (
                f"地点：{context.get('locationName')}。时间段：{context.get('period')}。\n"
                f"NPC：{json.dumps(npc, ensure_ascii=False)}\n"
                f"玩家状态：{json.dumps(state, ensure_ascii=False)}\n"
                "请生成 2 到 4 句中文对话。语气要符合 NPC 身份和当前地点，带一点生活感或幽默感。"
                "不要说自己是 AI。返回格式：{\"lines\":[\"第一句\",\"第二句\"]}"
            ),
        },
    ]


def build_diary_messages(context):
    records = context.get("records", [])
    state = context.get("state", {})
    day = context.get("finishedDay")
    return [
        {
            "role": "system",
            "content": "你是校园生活游戏的日记作者。只输出 JSON 对象，不要 Markdown。",
        },
        {
            "role": "user",
            "content": (
                f"这是第 {day} 天结束后的总结。\n"
                f"今日事件记录：{json.dumps(records, ensure_ascii=False)}\n"
                f"玩家最终状态：{json.dumps(state, ensure_ascii=False)}\n"
                "请写一篇 120 到 220 字的中文校园日记，语气自然，有一点反思和画面感。"
                "不要夸张成史诗，不要脱离今日记录。"
                "返回格式：{\"title\":\"今日校园日记 第 X 天\",\"content\":\"正文\",\"endingNote\":\"一句短评\"}"
            ),
        },
    ]


def call_model_json(messages):
    api_key = os.getenv("DASHSCOPE_API_KEY")
    if not api_key:
        raise RuntimeError("DASHSCOPE_API_KEY is not set")

    client = OpenAI(api_key=api_key, base_url=BASE_URL)
    kwargs = {
        "model": MODEL,
        "messages": messages,
        "temperature": 0.85,
    }
    if os.getenv("DASHSCOPE_ENABLE_THINKING") == "1":
        kwargs["extra_body"] = {"enable_thinking": True}

    if os.getenv("DASHSCOPE_STREAM") == "1":
        chunks = client.chat.completions.create(stream=True, **kwargs)
        content_parts = []
        for chunk in chunks:
            if not getattr(chunk, "choices", None):
                continue
            delta = chunk.choices[0].delta
            if getattr(delta, "content", None):
                content_parts.append(delta.content)
        content = "".join(content_parts)
    else:
        completion = client.chat.completions.create(stream=False, **kwargs)
        content = completion.choices[0].message.content or ""

    if not content.strip():
        raise ValueError("model returned empty content")
    return extract_json(content)


def write_runtime_log(kind, payload):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    location = payload.get("location") or payload.get("locationId") or "global"
    path = OUTPUT_DIR / f"{kind}_{location}.jsonl"
    with path.open("a", encoding="utf-8") as file:
        file.write(json.dumps(payload, ensure_ascii=False) + "\n")


class CampusAIHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.add_cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self.send_json({
                "ok": True,
                "model": MODEL,
                "hasKey": bool(os.getenv("DASHSCOPE_API_KEY")),
            })
            return
        self.send_json({"error": "not found"}, status=404)

    def do_POST(self):
        try:
            context = self.read_json()
            if self.path == "/api/event":
                event = normalize_event(call_model_json(build_event_messages(context)), context)
                write_runtime_log("event", event)
                self.send_json({"event": event})
                return
            if self.path == "/api/dialogue":
                dialogue = normalize_dialogue(call_model_json(build_dialogue_messages(context)), context)
                write_runtime_log("dialogue", {"location": context.get("locationId"), **dialogue})
                self.send_json(dialogue)
                return
            if self.path == "/api/diary":
                diary = normalize_diary(call_model_json(build_diary_messages(context)), context)
                write_runtime_log("diary", {"location": "global", **diary})
                self.send_json({"diary": diary})
                return

            self.send_json({"error": "not found"}, status=404)
        except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError) as error:
            print(f"Client disconnected before AI response was delivered: {error}", flush=True)
        except Exception as error:
            print("\nAI proxy request failed:", flush=True)
            print(f"path: {self.path}", flush=True)
            print(f"error: {error}", flush=True)
            traceback.print_exc()
            try:
                self.send_json({"error": str(error)}, status=500)
            except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
                print("Client disconnected before error response was delivered.", flush=True)

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length > 1024 * 1024:
            raise ValueError("request too large")
        raw = self.rfile.read(length).decode("utf-8")
        return json.loads(raw or "{}")

    def send_json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        try:
            self.send_response(status)
            self.add_cors_headers()
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionAbortedError, ConnectionResetError):
            raise

    def add_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, format, *args):
        print("[%s] %s" % (self.log_date_time_string(), format % args))


def main():
    server = ThreadingHTTPServer((HOST, PORT), CampusAIHandler)
    print(f"Campus AI proxy listening on http://{HOST}:{PORT}")
    print(f"Model: {MODEL}")
    print(f"Has DASHSCOPE_API_KEY: {bool(os.getenv('DASHSCOPE_API_KEY'))}")
    print("Frontend endpoint should match src/config/GameSettings.js")
    server.serve_forever()


if __name__ == "__main__":
    main()
