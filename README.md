# 今天在大学会发生什么？

英文名：What Happens on Campus Today?

这是一个基于 HTML5、CSS3、JavaScript ES6 和 Phaser 3 的 2D 俯视角校园生活模拟小游戏。玩家扮演大学生，在校园、宿舍、教室、食堂、图书馆、体育场之间探索，触发事件、与 NPC 对话、推进时间，并在第 16 天结束后获得不同结局。

除了README，还要看docs\course_design.md

## 运行方式

项目不依赖后端服务器，但由于浏览器会限制本地 JSON 读取，推荐使用本地静态服务运行。

```powershell
python -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

## 操作说明

- `WASD` / 方向键：移动
- `E`：靠近门区域时进入/返回地图
- `F`：触发当前地点随机事件
- `Q`：靠近 NPC 时对话
- `T`：测试用时间推进
- `Esc`：打开存档与设置面板

## 当前功能

- 多 Scene 地图：校园、宿舍、教室、食堂、图书馆、体育场
- 玩家移动、碰撞、摄像机跟随
- JSON 数据驱动地图、事件、NPC、结局
- 顶部/角落 HUD
- 时间系统：上午、下午、晚上
- 属性系统：体力、精力、学业、心情、社交、金钱
- 随机事件和选项结算
- NPC 对话系统
- 每日校园日记
- LocalStorage 存档、重置、清除日记
- 第 16 天最终结局
- AI 事件、AI 对话、AI 日记接口预留

## 场景尺寸与占位设计

当前 6 个场景均使用纯色矩形占位，后续可替换为 AI 生成背景图和正式素材。

| 场景 | 尺寸 | 当前占位设计 |
| --- | --- | --- |
| 校园 | 2200 x 1600 | 宿舍、教室、图书馆、食堂、体育场、中央草坪、公告栏、快递站 |
| 宿舍 | 1280 x 900 | 4 张床、公共书桌、衣柜、阳台 |
| 教室 | 1280 x 900 | 讲台、黑板、2 行 2 列课桌、教具柜 |
| 食堂 | 1320 x 920 | 打饭窗口、6 组桌椅组合、饮水区 |
| 图书馆 | 1320 x 920 | 左右各 2 列书架、2 张阅览桌、管理员服务前台 |
| 体育场 | 1400 x 960 | 篮球区、羽毛球区、篮球架、羽毛球网、器材区 |

## 生活费与事件概率

- 每 4 天发放一次生活费，每次 `80`。
- 生活费在第 4、8、12、16 天上午进入新一天时自动发放。
- 每个地点至少 4 个事件。
- 每个事件都有 `periodWeights`，分别控制上午、下午、晚上出现概率。
- 同一地点同一时间段内，所有事件的 `periodWeights` 概率和为 `1`。

## 项目结构

```text
peking/
├─ index.html
├─ css/
├─ docs/
├─ assets/
│  └─ json/
│     ├─ events/
│     ├─ maps/
│     ├─ npc/
│     ├─ system/
│     └─ ui/
└─ src/
   ├─ config/
   ├─ core/
   ├─ entity/
   ├─ manager/
   ├─ scene/
   ├─ system/
   └─ ui/
```

## 课程设计说明

详细设计文档见：

```text
docs/course_design.md
```

## AI 事件生成

项目提供本地生成脚本，不会把 API Key 写进前端代码。

```powershell
$env:DASHSCOPE_API_KEY="你的 DashScope Key"
python scripts/generate_events_dashscope.py
```

生成结果会写入：

```text
generated/events/
```

确认内容后，再复制到：

```text
assets/json/events/
```
