# 《今天在大学会发生什么？》课程设计说明

## 1. 项目概述

本项目是一款 2D Top-down 校园生活模拟小游戏。玩家扮演一名大学生，在一天中的上午、下午、晚上自由探索校园，进入不同地点，触发随机事件，与 NPC 对话，积累属性成长，并在第 16 天结束后根据属性获得不同结局。

项目重点不是战斗，而是探索、成长、选择、随机事件和沉浸式校园生活。

## 2. 技术栈

- HTML5
- CSS3
- JavaScript ES6
- Phaser 3
- LocalStorage
- JSON 数据驱动

项目不使用 React、Vue、Node.js 等框架。所有数据保存在浏览器 LocalStorage 中。

## 3. 运行方式

在项目根目录运行：

```powershell
python -m http.server 8000
```

打开浏览器访问：

```text
http://localhost:8000
```

## 4. 操作说明

- `WASD` / 方向键：玩家移动
- `E`：靠近门区域时切换地图
- `F`：触发当前地点随机事件
- `Q`：靠近 NPC 时对话
- `T`：测试用时间推进
- `Esc`：打开存档与设置面板

## 5. 模块划分

### 5.1 Core

`src/core/` 保存项目启动核心。

- `Namespace.js`：统一创建全局命名空间
- `Game.js`：创建 Phaser 游戏实例

### 5.2 Scene

`src/scene/` 保存所有 Phaser Scene。

- `BootScene.js`：启动场景
- `BaseMapScene.js`：通用地图父类
- `CampusScene.js`：校园
- `DormScene.js`：宿舍
- `ClassroomScene.js`：教室
- `CafeteriaScene.js`：食堂
- `LibraryScene.js`：图书馆
- `StadiumScene.js`：体育场

每个地图都是独立 Scene，地图切换通过门区域和 `SceneTransitionManager` 完成。

### 5.3 Entity

`src/entity/` 保存游戏实体。

- `Player.js`：玩家移动、碰撞体、键盘输入
- `NPC.js`：NPC 矩形占位、姓名标签、交互范围

### 5.4 Manager

`src/manager/` 保存业务管理器。

- `GameStateManager.js`：游戏状态、属性、金钱、时间保存
- `EventManager.js`：事件抽取与结算
- `DiaryManager.js`：每日事件记录与日记保存
- `EndingManager.js`：结局判断与保存
- `NPCManager.js`：NPC 创建与交互检测
- `SaveManager.js`：存档信息、重置、清除日记
- `SceneTransitionManager.js`：场景淡入淡出切换

### 5.5 System

`src/system/` 保存可扩展系统。

- `TimeSystem.js`：上午、下午、晚上、第二天推进
- `AIEventGenerator.js`：AI 事件生成接口预留
- `AIDialogGenerator.js`：AI 对话生成接口预留
- `AIDiaryGenerator.js`：日记生成接口，当前使用本地模板

### 5.6 UI

`src/ui/` 保存界面组件。

- `HUD.js`：顶部状态栏、左下属性、右下提示
- `EventModal.js`：事件选择弹窗
- `DialogueModal.js`：NPC 对话弹窗
- `DailySummaryModal.js`：每日校园日记弹窗
- `EndingModal.js`：最终结局弹窗
- `SettingsModal.js`：存档与设置弹窗

## 6. 数据驱动设计

项目遵循 Data-Driven Design。玩法数据尽量放在 JSON 中，代码负责读取和执行。

### 6.1 地图数据

路径：

```text
assets/json/maps/
```

地图 JSON 保存：

- 地图 id
- 地图名称
- 背景色
- 世界尺寸
- 出生点
- 障碍物
- 门区域

当前场景尺寸：

| 场景 | 尺寸 | 占位内容 |
| --- | --- | --- |
| 校园 | 2200 x 1600 | 宿舍、教室、图书馆、食堂、体育场、中央草坪、公告栏、快递站 |
| 宿舍 | 1280 x 900 | 4 张床、公共书桌、衣柜、阳台 |
| 教室 | 1280 x 900 | 讲台、黑板、2 行 2 列课桌、教具柜 |
| 食堂 | 1320 x 920 | 打饭窗口、6 组桌椅组合、饮水区 |
| 图书馆 | 1320 x 920 | 左右各 2 列书架、阅览桌、管理员服务前台 |
| 体育场 | 1400 x 960 | 篮球区、羽毛球区、篮球架、羽毛球网、器材区 |

### 6.1.1 替换 AI 生成背景图

如果后续要把纯色背景替换成 AI 生成图片，建议将图片放入：

```text
assets/images/maps/
```

推荐命名：

```text
assets/images/maps/campus.png
assets/images/maps/dorm.png
assets/images/maps/classroom.png
assets/images/maps/cafeteria.png
assets/images/maps/library.png
assets/images/maps/stadium.png
```

图片尺寸最好与对应 JSON 的 `world.width` 和 `world.height` 一致。例如校园背景图建议为 `2200 x 1600`，宿舍背景图建议为 `1280 x 900`。

当前代码仍使用 JSON 中的 `backgroundColor` 绘制纯色背景。替换为图片时，可以在地图 JSON 中新增字段：

```json
{
  "backgroundImage": "assets/images/maps/campus.png"
}
```

然后在 `BaseMapScene.createMap()` 中优先读取 `backgroundImage`，如果存在则加载图片；否则继续使用 `backgroundColor`。这样可以保持数据驱动结构不变。

### 6.2 事件数据

路径：

```text
assets/json/events/
```

事件 JSON 保存：

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

玩家按 `F` 触发事件后，系统根据权重随机抽取事件。选择选项后，属性变化由 JSON 中的 `effects` 决定。

当前版本事件使用 `periodWeights` 控制不同时间段发生概率：

```json
{
  "periodWeights": {
    "上午": 0.25,
    "下午": 0.30,
    "晚上": 0.45
  }
}
```

同一地点在同一时间段下，所有事件概率和为 `1`。

### 6.3 NPC 数据

路径：

```text
assets/json/npc/
```

NPC JSON 保存：

- NPC id
- 名称
- 位置
- 颜色
- 尺寸
- 交互范围
- 对话文本

### 6.4 结局数据

路径：

```text
assets/json/endings.json
```

结局配置包含：

- 目标天数：16
- 默认结局
- 多个结局条件
- 结局标题和描述

第 16 天结束时，系统根据玩家最终属性选择结局。

## 7. 游戏流程

1. 启动游戏
2. 进入校园
3. 玩家自由移动
4. 进入不同建筑
5. 触发随机事件
6. 选择事件选项
7. 属性变化
8. 时间推进
9. 晚上结束后生成今日校园日记
10. 进入第二天
11. 第 16 天结束后生成最终结局

## 8. LocalStorage 数据

项目使用以下 LocalStorage 键：

- `campusGameState`：当前日期、时间、地点、属性、金钱
- `campusDiaryRecords`：当天事件记录
- `campusDiaries`：已生成的校园日记
- `campusEnding`：最终结局

## 9. AI 接口预留

项目预留了三个 AI 生成模块：

- `AIEventGenerator`
- `AIDialogGenerator`
- `AIDiaryGenerator`

当前版本不直接调用 API。原因是本项目为纯前端项目，如果把 API Key 写入浏览器代码，会造成密钥泄露。未来如需接入大模型，推荐增加后端代理，由后端读取环境变量并调用模型 API，前端只请求自己的后端接口。

## 10. 可扩展方向

- 替换矩形占位为正式地图素材和角色素材
- 增加更多地点
- 增加 NPC 分支对话
- 增加事件链和 `next_event`
- 增加背包、课程表、社团系统
- 增加多周目结局收集
- 使用后端代理接入 AI 事件、对话、日记生成

## 11. 项目特点

- 模块化结构清晰
- 单文件代码量控制在 500 行以内
- 地图、事件、NPC、结局均数据驱动
- 每个功能模块可独立维护
- 适合课程设计展示和继续扩展
