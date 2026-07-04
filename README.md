# 今天在大学会发生什么？

英文名：What Happens on Campus Today?

这是一款基于 HTML5、CSS3、JavaScript ES6 和 Phaser 3 的 2D 俯视角校园生活模拟小游戏。玩家扮演一名大学生，在校园、宿舍、教室、食堂、图书馆、体育场之间探索，触发地点事件，与 NPC 对话，积累属性、好感和日记记录，并在第 16 天结束后获得不同结局。

项目用于课程设计展示，重点是数据驱动、多场景地图、随机事件、NPC 互动、8 分钟一天的时间系统，以及可选的 AI 事件/对话/日记生成。

## 运行方式

项目是纯前端静态项目，不需要 Node.js 或后端框架。由于浏览器会限制本地 JSON 读取，推荐使用本地静态服务运行。

在项目根目录执行：

```powershell
python -m http.server 8000
```

然后访问：

```text
http://localhost:8000
```

助教或测试者第一次下载运行时直接访问上面的地址即可；`index.html` 内部已经带有资源版本号，避免旧缓存影响。

## 操作说明

- `WASD` / 方向键：移动
- `E`：靠近门区域时进入/返回地图
- `F`：触发当前地点随机事件，或触发地图交互点事件
- `Q`：靠近 NPC 时对话
- `T`：测试用时间推进
- `Esc`：打开存档与设置面板

## 当前功能

- 6 个 Phaser Scene：校园、宿舍、教室、食堂、图书馆、体育场
- 玩家移动、碰撞、摄像机跟随、场景淡入淡出切换
- 图片地图背景和角色/NPC 图片素材
- JSON 数据驱动地图、事件、NPC、时间、UI、结局
- 8 分钟为 1 天，自动划分上午、下午、晚上
- 事件完成只结算属性、冷却和记录，不直接推进时间
- 属性系统：体力、精力、学业、心情、社交、金钱
- 每 4 天发放一次生活费，每次 80
- NPC 概率出现、关键 NPC 好感度
- 随机事件、交互点事件、事件链 `next_event`
- 每日校园日记和第 16 天最终结局
- LocalStorage 本地存档、日记、结局保存
- 可选 AI 事件、AI 对话、AI 日记生成，失败时自动回退本地内容

## 场景尺寸与素材

当前地图已经使用 `assets/image/` 下的图片素材，同时保留 JSON 碰撞、门区域和交互区域配置。

| 场景 | 尺寸 | 主要内容 |
| --- | --- | --- |
| 校园 | 2200 x 1600 | 宿舍、教室、图书馆、食堂、体育场、中央区域、公告栏、快递站 |
| 宿舍 | 1280 x 900 | 4 张床、公共书桌、衣柜、阳台、室友 NPC |
| 教室 | 1280 x 900 | 讲台、黑板、课桌、老师和学生 NPC |
| 食堂 | 1320 x 920 | 打饭窗口、桌椅、饮水区、食堂阿姨和学生 NPC |
| 图书馆 | 1320 x 920 | 书架、阅览桌、管理员服务台、读者 NPC |
| 体育场 | 1400 x 960 | 篮球区、羽毛球区、器材区、教练和运动 NPC |

## 时间、生活费与事件

- 游戏采用真实计时制，每 `480000ms`，也就是 `8` 分钟推进 1 天。
- 一天自动分为上午、下午、晚上。
- 完成事件不会直接推进时间。
- 每 4 天发放一次生活费，每次 `80`。
- 每个地点配置多个事件，事件放在 `assets/json/events/`。
- 事件支持：
  - `condition` 条件判断
  - `periodWeights` 时间段权重
  - `effects` 属性变化
  - `npcFavor` 好感度变化
  - `progress` 进度变化
  - `next_event` 事件链
  - `cooldownMs` 事件冷却

## 项目结构

```text
peking/
├─ index.html
├─ css/
├─ docs/
├─ scripts/
│  ├─ ai_proxy.py
│  └─ generate_events_dashscope.py
├─ generated/
│  └─ ai_runtime/
├─ assets/
│  ├─ image/
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

## AI 运行时接入

AI 功能是可选功能。不开启 AI 代理时，游戏仍然可以正常运行，并自动使用本地 JSON 事件、本地 NPC 对话和本地日记模板。

如果希望运行时生成 AI 事件、AI 对话和 AI 日记，请额外打开一个终端：

```powershell
$env:DASHSCOPE_API_KEY="你的 DashScope Key"
$env:DASHSCOPE_MODEL="qwen3.7-plus"
python scripts/ai_proxy.py
```

代理默认地址：

```text
http://localhost:8765
```

前端配置位于：

```text
src/config/GameSettings.js
```

当前 AI 逻辑：

- 按 `F` 触发事件时，有概率尝试生成 AI 即时事件
- 按 `Q` 与 NPC 对话时，有概率尝试生成 AI 即兴对话
- 每天结束时，优先尝试生成 AI 校园日记
- 模型失败、代理未启动或返回格式不合格时自动回退本地内容
- 成功生成的内容会记录到 `generated/ai_runtime/`

## 课程设计说明

详细设计文档见：

```text
docs/course_design.md
```
