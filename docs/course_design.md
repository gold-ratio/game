# 《今天在大学会发生什么？》课程设计说明

## 1. 项目概述

《今天在大学会发生什么？》是一款 2D Top-down 校园生活模拟小游戏。玩家扮演一名大学生，在校园、宿舍、教室、食堂、图书馆、体育场之间探索，触发随机事件，与 NPC 对话，并在 16 天校园生活结束后，根据属性、选择和成长情况获得最终结局。

项目重点不是战斗，而是校园日常体验：探索、选择、随机事件、人物互动、属性成长和日记记录。游戏采用数据驱动设计，地图、事件、NPC、时间、UI、结局等内容尽量放入 JSON，代码负责读取和执行。

## 2. 技术栈

- HTML5
- CSS3
- JavaScript ES6
- Phaser 3
- JSON 数据驱动
- LocalStorage 本地存档
- Python 静态服务
- 可选 DashScope / OpenAI-compatible AI 代理

项目不使用 React、Vue、Node.js 等前端框架，不需要安装 npm 依赖。

## 3. 运行方式

在项目根目录运行：

```powershell
python -m http.server 8000
```

浏览器访问：

```text
http://localhost:8000
```

如果希望测试 AI 生成内容，额外启动：

```powershell
$env:DASHSCOPE_API_KEY="你的 DashScope Key"
$env:DASHSCOPE_MODEL="qwen3.7-plus"
python scripts/ai_proxy.py
```

AI 代理不是必需项。不开启代理时，游戏会使用本地数据正常运行。

## 4. 操作说明

- `WASD` / 方向键：玩家移动
- `E`：靠近门区域时切换地图
- `F`：触发当前地点随机事件或交互点事件
- `Q`：靠近 NPC 时对话
- `T`：测试用时间推进
- `Esc`：打开存档与设置面板

## 5. 游戏流程

1. 打开游戏，进入校园主地图
2. 玩家移动探索，进入不同建筑
3. 根据地点、时间段和条件触发事件
4. 选择事件选项，改变属性、进度或 NPC 好感
5. 与 NPC 对话，获得固定或 AI 即兴文本
6. 真实时间自动流逝，每 8 分钟进入下一天
7. 每天结束后生成校园日记
8. 第 16 天结束后，根据最终状态显示结局

## 6. 时间系统

游戏采用真实计时制，而不是每完成事件就推进时间。

- 1 天 = 8 分钟
- 每天自动划分为上午、下午、晚上
- 事件完成只结算属性和记录，不直接推进时间
- `T` 键仅作为测试工具，用来快速推进时间
- 每 4 天发放一次生活费 80

时间配置位于：

```text
assets/json/system/time.json
```

核心字段：

```json
{
  "advanceOnEventComplete": false,
  "realTimeDayMs": 480000,
  "allowance": {
    "intervalDays": 4,
    "amount": 80
  }
}
```

## 7. 模块划分

### 7.1 Core

路径：`src/core/`

- `Namespace.js`：创建统一全局命名空间
- `Game.js`：创建 Phaser 游戏实例

### 7.2 Scene

路径：`src/scene/`

- `BootScene.js`：启动场景
- `BaseMapScene.js`：通用地图父类，负责地图、玩家、NPC、事件、UI、AI 接入和时间同步
- `CampusScene.js`：校园
- `DormScene.js`：宿舍
- `ClassroomScene.js`：教室
- `CafeteriaScene.js`：食堂
- `LibraryScene.js`：图书馆
- `StadiumScene.js`：体育场

每个地点都是独立 Scene，通过门区域和 `SceneTransitionManager` 切换。

### 7.3 Entity

路径：`src/entity/`

- `Player.js`：玩家移动、碰撞体、键盘输入、行走动画
- `NPC.js`：NPC 显示、姓名标签、交互距离

### 7.4 Manager

路径：`src/manager/`

- `GameStateManager.js`：游戏状态、属性、金钱、时间、好感、进度、事件冷却
- `EventManager.js`：事件抽取、条件判断、冷却判断
- `DiaryManager.js`：每日事件记录和日记保存
- `EndingManager.js`：结局判断与保存
- `NPCManager.js`：NPC 概率出现、创建、碰撞和交互检测
- `SaveManager.js`：存档信息、重置、清除日记
- `SceneTransitionManager.js`：场景淡入淡出切换

### 7.5 System

路径：`src/system/`

- `TimeSystem.js`：8 分钟一天的真实计时系统
- `AIEventGenerator.js`：AI 事件生成前端请求模块
- `AIDialogGenerator.js`：AI 对话生成前端请求模块
- `AIDiaryGenerator.js`：AI 日记生成和本地模板兜底

### 7.6 UI

路径：`src/ui/`

- `HUD.js`：地点、日期、时间、倒计时、属性和操作提示
- `EventModal.js`：事件选择弹窗
- `DialogueModal.js`：NPC 对话弹窗
- `DailySummaryModal.js`：每日校园日记弹窗
- `EndingModal.js`：最终结局弹窗
- `SettingsModal.js`：存档与设置弹窗

## 8. 数据驱动设计

项目遵循 Data-Driven Design。地图、事件、NPC、时间、UI 和结局均由 JSON 文件配置，代码负责解释数据。

### 8.1 地图数据

路径：

```text
assets/json/maps/
```

地图 JSON 包含：

- 地图 id 和名称
- 背景色和背景图
- 世界尺寸
- 出生点
- 障碍物
- 门区域
- 交互点

当前场景：

| 场景 | 尺寸 | 内容 |
| --- | --- | --- |
| 校园 | 2200 x 1600 | 校园主地图、建筑入口、公告栏、快递站 |
| 宿舍 | 1280 x 900 | 床位、公共书桌、衣柜、阳台 |
| 教室 | 1280 x 900 | 讲台、黑板、课桌、老师和学生 |
| 食堂 | 1320 x 920 | 打饭窗口、桌椅、饮水区 |
| 图书馆 | 1320 x 920 | 书架、阅览区、服务前台 |
| 体育场 | 1400 x 960 | 篮球区、羽毛球区、器材区 |

图片素材位于：

```text
assets/image/
```

### 8.2 事件数据

路径：

```text
assets/json/events/
```

事件 JSON 支持：

- `id`
- `title`
- `location`
- `condition`
- `description`
- `choices`
- `effects`
- `next_event`
- `weight`
- `periodWeights`
- `cooldownMs`

事件可以根据日期、时间段、属性、NPC 好感、进度、flag 等条件出现。玩家选择后，系统会修改属性、金钱、好感或进度，并记录到当日日记。

### 8.3 NPC 数据

路径：

```text
assets/json/npc/
```

NPC JSON 支持：

- id 和名称
- 坐标
- 图片或颜色占位
- 交互范围
- 出现概率 `spawnRate`
- 固定对话
- 关键 NPC 标记
- 对话好感增量

NPC 会根据日期、地点和时间段概率出现，使场景更有变化。

### 8.4 结局数据

路径：

```text
assets/json/endings.json
```

结局配置包含：

- 目标天数：16
- 默认结局
- 多个结局条件
- 结局标题和描述

第 16 天结束时，系统根据玩家最终状态选择结局。

## 9. AI 设计

项目提供运行时 AI 代理，不把 API Key 写入前端代码。

代理脚本：

```text
scripts/ai_proxy.py
```

前端通过 `http://localhost:8765` 请求代理，代理从环境变量读取 `DASHSCOPE_API_KEY` 并调用兼容 OpenAI 的 DashScope 接口。

AI 生成模块：

- `AIEventGenerator`：生成即时校园事件
- `AIDialogGenerator`：生成 NPC 即兴对话
- `AIDiaryGenerator`：生成每日校园日记

AI 失败时，游戏自动回退到本地 JSON 和本地模板，保证课程展示时不会因为网络或模型问题而无法运行。

成功生成的 AI 内容会写入：

```text
generated/ai_runtime/
```

## 10. LocalStorage 数据

项目使用浏览器 LocalStorage 保存本地状态：

- `campusGameState`：当前日期、时间、地点、属性、金钱、好感、进度、事件冷却
- `campusDiaryRecords`：当天事件记录
- `campusDiaries`：已生成的校园日记
- `campusEnding`：最终结局

设置面板中可以重置游戏状态或清除日记。

## 11. 完成程度

当前项目已经形成完整闭环：

- 可以启动和游玩
- 可以在 6 个场景间移动
- 可以触发本地事件和交互点事件
- 可以与 NPC 对话
- 可以记录日记
- 可以按真实时间进入下一天
- 可以在第 16 天获得结局
- 可以选择性启用 AI 内容生成
- 图片素材、碰撞区域和 UI 弹窗已经接入

## 12. 后续计划

- 优化地图碰撞和交互点位置
- 扩展更多事件链和关键 NPC 剧情
- 增加背包、课程表、社团系统
- 增加音乐和音效
- 增加结局收集页面
- 将 AI 代理部署为正式后端服务

## 13. 项目特点

- 模块结构清晰
- 玩法数据高度 JSON 化
- 本地模式和 AI 模式都可运行
- 适合课程设计演示
- 后续扩展成本较低
