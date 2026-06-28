# Scripts

## Generate Events With DashScope

This project is a pure frontend game, so API keys must not be written into browser JavaScript.

Use this script to generate event JSON files locally:

```powershell
$env:DASHSCOPE_API_KEY="your-key"
python scripts/generate_events_dashscope.py
```

Generated files are written to:

```text
generated/events/
```

After checking the generated JSON, copy the files you want into:

```text
assets/json/events/
```

The generated schema matches the current event system:

- `id`
- `title`
- `location`
- `condition`
- `description`
- `choices`
- `effects`
- `next_event`
- `weight`


并不是我设想的：我的想法是每次抽取事，有50%概率抽到ai生成的事件，之后ai随机生成一些奇怪的，直接写入json/events