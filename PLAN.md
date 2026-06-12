# 🎂 Ling Birthday — 生日纪念网站 设计规划文档

---

## 第一部分：原始构想（用户原文）

> 你在这个项目中先写一个计划文档，我把我的思路告诉你，你生成具体流程架构。然后我看着去修改。你再根
  据我修改过后的文档干活。 我想做的项目是关于一个主播的生日纪念网站的，第一部分  划火柴 网站交互，
  划完火柴之后室内渐渐显露出来，左上角一个文字路径动画 happy birthday to ling 第二部分 汇聚心意
  火柴划动之后，火焰爆开了，然后网站界面洒满粒子效果，像是火光或者萤火虫的感觉，点击火光的粒子效果
  就会搜集，收集的动画体现是这个例子会像萤火虫一样飞向蛋糕上的蜡烛。随后弹出一个贺卡样式的卡片，上
  面写了生日祝福，这一块我会收集粉丝的生日祝福，有语音或者文字，到时候做好样式。右上角点击关闭，直
  到收集完所有的心意之后，蛋糕亮起，触发光亮背景。 第三部分 吹蜡烛 等到场景变成亮堂堂的背景之后
  吹蜡烛 此时请求访问麦克风，根据分贝来触发蜡烛吹灭效果。
  火光被吹散，吹成包含祝福的卡片，然后散落满屏的感觉
  这个要做好视觉效果，或者是粒子效果凑到一起，组成了一个生日快乐。第四部分
  时光长廊。就是横向滑动的图片配文字
  最终就是谢幕，然后有再来一次。还有一点，就是这个肯定有很多的图片啥的，到时候会放在cdn里面。但是还
  是要等待网页把资源加载好。所以需要一个loading。你思考一下这个构想。然后写在文档里面
  第一部分是我的原文，第二部分是你的思考，流程和架构。

### 一、划火柴
网站交互：划完火柴之后室内渐渐显露出来，左上角一个文字路径动画 "happy birthday to ling"。

### 二、汇聚心意
火柴划动之后，火焰爆开，网站界面洒满粒子效果（像是火光或者萤火虫的感觉）。点击火光的粒子效果就会收集，收集的动画体现是这个粒子会像萤火虫一样飞向蛋糕上的蜡烛。随后弹出一个贺卡样式的卡片，上面写了生日祝福。这一块我会收集粉丝的生日祝福，有语音或者文字，到时候做好样式。右上角点击关闭。直到收集完所有的心意之后，蛋糕亮起，触发光亮背景。

### 三、吹蜡烛
等到场景变成亮堂堂的背景之后，吹蜡烛。此时请求访问麦克风，根据分贝来触发蜡烛吹灭效果。火光被吹散，吹成包含祝福的卡片，然后散落满屏的感觉——这个要做好视觉效果，或者是粒子效果凑到一起，组成了"生日快乐"。

### 四、时光长廊
横向滑动的图片配文字。

### 最终
谢幕，然后有"再来一次"。

### 其他
肯定有很多的图片，到时候会放在 CDN 里面。但是还是要等待网页把资源加载好，所以需要一个 loading。

---

## 第二部分：技术分析 & 流程架构

### 2.1 整体状态机设计

整个网站是一个**线性的、多阶段的交互动画体验**，适合用有限状态机管理：

```
[Loading] → [Stage1: 划火柴] → [Stage2: 汇聚心意] → [Stage3: 吹蜡烛] → [Stage4: 时光长廊] → [Ending: 谢幕]
```

每个 Stage 之间有明确的过渡条件和动画衔接。

### 2.2 技术分工策略

| 技术 | 负责内容 |
|------|---------|
| **PixiJS** | 核心渲染引擎：火柴、火焰粒子、萤火虫粒子、蜡烛火焰、吹散粒子、时光长廊滚动 |
| **GSAP** | 复杂补间动画：火柴划动轨迹、贺卡弹入弹出、文字路径动画、UI 过渡 |
| **Howler.js** | 音频管理：背景音乐、火柴音效、收集音效、粉丝语音播放 |
| **Vue 3** | 应用框架：状态管理、UI 层（贺卡、文字、按钮）、组件生命周期 |
| **TailwindCSS** | 贺卡样式、文字排版、按钮、叠加层 UI |

**核心原则：PixiJS 管 Canvas 动画，Vue 管 DOM UI，GSAP 两头都管，Howler 管声音。**

### 2.3 项目目录结构

```
src/
├── main.ts                      # 入口
├── App.vue                      # 根组件：状态机调度
├── style.css                    # 全局样式 + TailwindCSS
│
├── stages/                      # 各阶段主组件
│   ├── StageLoading.vue         # Loading 阶段
│   ├── StageMatch.vue           # 第一阶段：划火柴
│   ├── StageWishes.vue          # 第二阶段：汇聚心意
│   ├── StageBlowCandle.vue      # 第三阶段：吹蜡烛
│   ├── StageTimeline.vue        # 第四阶段：时光长廊
│   └── StageEnding.vue          # 谢幕
│
├── game/                        # PixiJS 游戏/动画逻辑
│   ├── GameApp.ts               # PixiJS Application 单例管理
│   ├── scenes/                  # 各场景（对应 stage）
│   │   ├── MatchScene.ts        # 火柴场景
│   │   ├── WishesScene.ts       # 粒子收集场景
│   │   ├── CandleScene.ts       # 吹蜡烛场景
│   │   └── TimelineScene.ts     # 时光长廊场景（若用 PixiJS 做）
│   ├── objects/                 # 可复用游戏对象
│   │   ├── Match.ts             # 火柴对象
│   │   ├── FireParticle.ts      # 火焰/萤火虫粒子
│   │   ├── Candle.ts            # 蛋糕蜡烛
│   │   └── BlessingCard.ts      # 祝福卡片粒子
│   └── utils/                   # 工具
│       ├── ParticlePool.ts      # 粒子对象池
│       └── audioAnalyzer.ts     # 麦克风分贝分析
│
├── components/                  # Vue UI 组件
│   ├── GreetingCard.vue         # 贺卡弹窗组件
│   ├── LoadingScreen.vue        # Loading 进度组件
│   ├── CursorOverlay.vue        # 自定义光标/火柴头
│   └── AudioPlayer.vue          # 音频播放控件
│
├── composables/                 # Vue Composables（状态逻辑）
│   ├── useGameState.ts          # 全局游戏状态机
│   ├── useAudio.ts              # 音频管理
│   ├── useAssetLoader.ts        # 资源预加载
│   └── useMicrophone.ts         # 麦克风权限 & 分贝检测
│
├── data/                        # 数据配置
│   ├── blessings.ts             # 粉丝祝福数据（文字/语音URL）
│   ├── timeline.ts              # 时光长廊图片+文字数据
│   └── config.ts                # 全局配置（CDN前缀等）
│
└── types/                       # TypeScript 类型
    └── index.ts
```

### 2.4 各阶段详细流程

---

#### Stage 0: Loading 资源预加载

**目标**：确保所有 CDN 资源就绪后再进入体验。

**流程**：
1. 展示 Loading 画面（可以是暗色背景 + 一根未点燃的火柴静态图）
2. 使用 PixiJS `Assets.load()` 预加载所有纹理/图片/音频
3. 加载进度条（基于 `Assets.loader` 的 progress 事件）
4. 加载完成后，显示"划动火柴开始"引导文字
5. 用户交互后进入 Stage 1

**资源清单**：
- 火柴杆纹理
- 火焰序列帧 / 粒子纹理
- 房间背景图（暗/亮两态）
- 蛋糕图
- 粉丝语音音频文件
- 时光长廊图片
- 背景音乐 & 音效
- 字体文件（如需自定义）

**CDN 策略**：所有静态资源路径通过 `config.ts` 中的 `ASSET_BASE_URL` 拼接，方便切换。

---

#### Stage 1: 划火柴

**交互**：用户在屏幕上划动（模拟划火柴动作）。

**视觉层次**：
```
┌─────────────────────────────────┐
│  [暗色遮罩层]                     │
│                                  │
│   ★ 火柴头（跟随光标/手指）        │
│   火柴杆（随拖拽旋转）             │
│   划痕轨迹（PixiJS 粒子拖尾）      │
│                                  │
│   左上角：文字路径动画              │
│   "Happy Birthday to Ling"       │
│   （笔画逐步显现）                 │
│                                  │
│  [房间背景 — 被暗色遮罩覆盖]       │
└─────────────────────────────────┘
```

**交互细节**：
1. 用户 mousedown/touchstart → 火柴出现，跟随光标
2. 用户拖动 → 火柴头在"擦条"区域（屏幕底部固定区域）滑动
3. 滑动速度/距离达标 → 火柴点燃（火焰动画出现）
4. 火焰燃烧 → 暗色遮罩从中间向外径向消散（GSAP + PixiJS mask/blend）
5. 房间背景渐渐显露（从暗到亮的渐变过渡）
6. 左上角文字 "Happy Birthday to Ling" 使用 SVG 笔画动画（stroke-dasharray/dashoffset 或 PixiJS 路径绘制）

**技术实现**：
- 火柴本体：PixiJS Container，杆是旋转的 Sprite，火光是粒子发射器或序列帧
- 划痕检测：监听 pointermove，计算速度向量，速度达标 + 在热区 = 点燃
- 火焰出现后触发 GSAP timeline：
  - 遮罩径向扩张消失
  - 背景 brightness 从 0→1
  - 文字路径动画播放

**状态转移条件**：火焰动画完成 + 房间完全亮起 → 自动过渡到 Stage 2（火焰爆开）。

---

#### Stage 2: 汇聚心意

**交互**：点击飘散的粒子，收集祝福。

**视觉层次**：
```
┌─────────────────────────────────┐
│  [明亮房间背景]                   │
│                                  │
│   ✨ 飘散的火光粒子（全屏）        │
│   🕯️ 蛋糕在画面中央/下方           │
│   蜡烛未点燃（等待收集）           │
│                                  │
│   📮 贺卡弹窗（居中，点击关闭）    │
│      左上角 "X" 关闭按钮          │
│      祝福文字 / 语音播放按钮      │
│                                  │
│   右上角：收集进度 X/N            │
└─────────────────────────────────┘
```

**详细流程**：

1. **火焰爆开**（进入动画）：
   - 上一个阶段的火柴火焰 → 爆发成 N 个粒子（约 20-40 个）
   - 粒子使用 PixiJS ParticleContainer 高性能渲染
   - 粒子在屏幕空间内缓慢漂移（模拟萤火虫飞行 —— 缓动 + 随机偏移 + 发光滤镜）

2. **点击收集**：
   - 用户点击/触摸粒子 → 触发收集动画
   - 粒子从当前位置 → 贝塞尔曲线飞向蛋糕蜡烛（GSAP motionPath）
   - 飞行过程中粒子缩小 + 光晕加强
   - 到达蜡烛后消失，蜡烛亮度 +1/N

3. **贺卡弹出**：
   - 每收集到一个粒子 → 弹出 GreetingCard 组件（Vue DOM 层）
   - 卡片包含：粉丝名字、祝福文字、语音播放按钮（如有）
   - 右上角关闭按钮 → 关闭卡片
   - 卡片进出动画使用 GSAP（scale 0→1, spring easing）

4. **收集完成**：
   - 所有粒子收集完毕 → 蛋糕蜡烛全部亮起
   - 背景亮度提升，整体场景变亮堂
   - 自动过渡到 Stage 3

**数据设计**（`blessings.ts`）：
```ts
interface Blessing {
  id: string
  from: string          // 粉丝昵称
  text: string           // 文字祝福
  audioUrl?: string      // 语音祝福 URL（可选）
  avatar?: string        // 粉丝头像（可选）
}
```

**技术要点**：
- 粒子点击检测：PixiJS EventSystem（设置 `eventMode = 'static'`）
- 萤火虫飞行算法：Perlin noise 或 sin/cos 叠加的缓动
- 每个粒子有唯一 ID，与 blessings 数据一一对应（保证每个贺卡对应一个粉丝祝福）
- 收集进度由 `useGameState` 管理，Vue 响应式驱动 UI 进度条

---

#### Stage 3: 吹蜡烛

**交互**：用户对着麦克风吹气（检测分贝）。

**视觉层次**：
```
┌─────────────────────────────────┐
│  [明亮背景]                      │
│                                  │
│   🎂 蛋糕 + 燃烧的蜡烛            │
│   🎤 麦克风权限提示（首次）        │
│                                  │
│   [吹灭后]                       │
│   💨 火焰粒子被吹散               │
│   💌 变成祝福卡片散落全屏          │
│   或粒子汇聚成 "生日快乐" 文字     │
└─────────────────────────────────┘
```

**详细流程**：

1. **麦克风初始化**：
   - 进入阶段时弹出浏览器权限请求
   - 使用 Web Audio API（`AudioContext` + `AnalyserNode`）
   - 实时读取音量分贝值
   - 显示"吹气力度"指示器（视觉反馈）

2. **吹蜡烛检测**：
   - 分贝阈值判断（如 > 某个 dB 值持续 0.5 秒 = 有效吹气）
   - 可以设多档：轻吹 → 火焰摇曳，重吹 → 火焰熄灭
   - 火焰摇曳动画：PixiJS 对火焰 sprite 做 scaleX + skewX 抖动

3. **吹灭效果**：
   - 火焰缩放着色 → alpha 0
   - 同时爆出粒子（火星飞散）
   - 粒子飞散后变换为卡片形状（或携带文字）

4. **最终祝福展现**（两种方案可选）：
   - **方案 A**：粒子散落后重新聚合，拼成"生日快乐"四个大字
   - **方案 B**：粒子变成祝福卡片，像雪花一样散落满屏

**技术要点**：
- 麦克风分贝计算逻辑封装在 `useMicrophone` composable / `audioAnalyzer.ts`
- PixiJS 粒子系统处理火焰吹散 + 重组动画
- 两阶段粒子动画：散开（explode） → 聚合（converge to target positions）

---

#### Stage 4: 时光长廊

**交互**：横向滑动浏览图片。

**视觉层次**：
```
┌─────────────────────────────────┐
│  ← 横向滚动容器 →                 │
│  ┌──────┐ ┌──────┐ ┌──────┐     │
│  │ 照片1 │ │ 照片2 │ │ 照片3 │     │
│  │ 文字1 │ │ 文字2 │ │ 文字3 │     │
│  └──────┘ └──────┘ └──────┘     │
│                                  │
│  滚动指示器 / 进度点              │
└─────────────────────────────────┘
```

**实现方案**（两种可选）：
- **CSS 方案**：使用 Vue + CSS scroll-snap + GSAP ScrollTrigger（更简单，DOM 天然支持）
- **PixiJS 方案**：完全 Canvas 内实现（更丝滑，但复杂度高）

**推荐 CSS 方案**：照片元素用 Vue 渲染，横向滚动容器 + `scroll-snap-type: x mandatory`，配合 GSAP ScrollTrigger 做视差和入场动画。

**数据设计**（`timeline.ts`）：
```ts
interface TimelineItem {
  imageUrl: string
  title: string
  description: string
  date?: string
}
```

**注意**：这是唯一一个主要用 Vue DOM 而非 PixiJS 的阶段，因为横向滚动 + 图片 + 文字用原生 DOM 更自然，且支持无障碍访问。

---

#### Stage 5: 谢幕（Ending）

**内容**：
1. 所有阶段走完，画面渐暗
2. 中央出现感谢文字（或制作团队/粉丝名单）
3. "🎂 生日快乐 由川伶" 大字
4. "再来一次" 按钮

**"再来一次"按钮**：
- 点击后重置 `useGameState` 状态机回 `loading`
- 清空所有 PixiJS 场景
- 重新开始

---

### 2.5 全局状态管理（`useGameState.ts`）

```ts
type GameStage = 'loading' | 'match' | 'wishes' | 'blow-candle' | 'timeline' | 'ending'

interface GameState {
  currentStage: Ref<GameStage>
  loadingProgress: Ref<number>        // 0-100
  wishesCollected: Ref<number>        // 已收集祝福数
  totalWishes: Ref<number>            // 总祝福数
  candleLit: Ref<boolean>             // 蛋糕是否点亮
  isBlown: Ref<boolean>               // 蜡烛是否吹灭
}
```

所有阶段通过 `currentStage` 切换，`App.vue` 根据 stage 值渲染对应组件。

---

### 2.6 PixiJS 架构设计

**单例 Application**（`GameApp.ts`）：
- 全局一个 PixiJS Application 实例
- Canvas 覆盖全屏（`position: fixed; inset: 0; pointer-events: none; z-index: 1`）
- 不同 Stage 切换时，通过 `removeChildren()` + 挂载对应 Scene

**Scene 模式**：
```
GameApp
  └── app.stage
        ├── MatchScene (Container)
        ├── WishesScene (Container)
        ├── CandleScene (Container)
        └── TimelineScene (Container)  // 仅 PixiJS 方案时使用
```

每次切换 Stage：
1. `app.stage.removeChildren()`
2. `app.stage.addChild(newScene)`
3. 旧 Scene 调用 `destroy()` 清理

---

### 2.7 资源加载策略

**Loading 阶段分两步**：

1. **关键资源**（首屏必须，优先加载）：
   - 火柴纹理
   - 火焰粒子纹理
   - 房间暗色背景
   - 基础音效

2. **次级资源**（后台加载）：
   - 粉丝语音文件（可能很多，懒加载）
   - 时光长廊图片（可以在 Stage 2/3 时预加载）

**加载实现**：
```ts
// useAssetLoader.ts
const manifest = {
  bundles: [
    { name: 'critical', assets: [...] },   // 关键资源
    { name: 'stage2', assets: [...] },     // Stage2 资源
    { name: 'voices', assets: [...] },     // 语音文件
  ]
}
// 使用 PIXI.Assets.loadBundle() 分批加载
```

---

### 2.8 响应式 & 移动端适配

- PixiJS Canvas 使用 `app.renderer.resize(window.innerWidth, window.innerHeight)` 响应窗口变化
- 火柴划动热区适配触摸和鼠标事件
- 贺卡在移动端全屏显示
- 时光长廊支持触摸滑动和鼠标拖拽/滚轮
- 麦克风功能在移动端需要 HTTPS + 用户手势触发

---

### 2.9 性能优化考虑

1. **ParticleContainer** 用于大量粒子（限制纹理数量，换取高性能）
2. **对象池**（`ParticlePool`）复用粒子对象，避免频繁 GC
3. **纹理图集**（Texture Atlas）：将小纹理打包到大图中，减少 draw call
4. **图片懒加载**：时光长廊图片使用 Intersection Observer 懒加载
5. **语音文件**：使用 Howler.js 的流式播放，不预加载所有音频
6. **requestAnimationFrame** 统一驱动 PixiJS ticker + GSAP ticker

---

### 2.10 关键风险 & 待确认项

| 风险/问题 | 说明 | 建议 |
|-----------|-----|------|
| 麦克风兼容性 | iOS Safari 限制多，HTTP 不允许 | 需要 HTTPS 部署；降级方案：提供"点击吹灭"按钮 |
| 大量语音文件 | 粉丝语音可能几十上百条 | 懒加载 + 流式播放，不一次性加载 |
| 粒子数量 & 性能 | 移动端 GPU 性能有限 | ParticleContainer + 对象池 + 限制同屏粒子数 |
| 图片资源大小 | CDN 图片可能很大 | 提供缩略图 + 原图两层；时光长廊用缩略图 |
| 划火柴手势识别 | 不同设备触摸差异 | 用速度/距离双重判断，而非精确路径 |

---

## 下一步

请审阅以上架构设计，特别是：
1. 各阶段的视觉流程是否符合你的想象？
2. 目录结构是否合理？
3. 技术方案选择（如 Stage 3 粒子聚合方案 A/B，Stage 4 PixiJS vs CSS）
4. 有什么需要补充或修改的地方？

我会根据你的反馈调整后开始编码实现。


🎂 Ling Birthday — 生日纪念网站设计规划方案说明书 (Claude Code 协同版)
一、 原始插图深度分析与视觉世界观确立
您提供的两张核心插图确立了整个生日纪念网站的视觉灵魂。这两张图展示了同一种空间在“熄灯/点灯”状态下的动态对比，是设计网页的核心线索：

人物与核心意象：粉发双马尾猫耳、带有爱心饰品与医疗十字元素的少女（主播 由川伶/ling），以及蛋糕中央极其抢眼的粉色“腮红小猪”核心小蛋糕。

光影对比（重中之重）：

图一（暗室烛光态）：点燃的蜡烛散发着浓郁、温暖的琥珀金色强光，将角色面部、双手及小猪蛋糕渲染得极其明亮。而远景（游戏PC、小熊、窗外星空）则沉浸在静谧、冷调的深紫蓝色中。冷暖对比带来了极强的治愈感与奇幻感。

图二（吹灭冷调态）：蜡烛熄灭后的房间完全被窗外的冷蓝色星光与室内蓝紫色氛围灯包裹。原本温暖的金色光源消失，画面整体呈现出纯净、深邃的ACG深夜质感。

设计决议：网站整体风格全面采用“奇幻新海诚式光影” + “赛博粉蓝治愈系”。将这两张图的“暗室烛光”与“深夜冷蓝”作为网站两个主交互阶段的背景核心，让粉丝经历一次从暗夜到微光、再到星空的沉浸式视觉旅程。

二、 网页设计语言规范 (Design System Specification)
2.1 色彩矩阵 (Color System)
为完美还原插图质感，网页端基础 UI 与 Canvas 粒子将严格执行以下色系约束：

背景主色（深邃夜蓝）：#0B0F19（用于 Loading 及全暗基础背景，承托星空与暗室）

核心品牌色（Ling粉）：#FF7B9F（还原插图中 Ling 的发色与蝴蝶结，用于核心 UI、高亮文字与主按钮）

微光主题色（琥珀金）：#FFB03A（还原图一强烈的烛光，用于火柴、火焰粒子与蜡烛高光）

星空辅助色（晴空蓝）：#63B3ED（还原图二窗外的星光，用于冷调文字与漫反射投影）

2.2 文字与排版规范 (Typography)
中文字体：优先调用 system-ui, -apple-system, 'PingFang SC', 'Microsoft YaHei'。在贺卡内页可局部调用手写风或硬笔楷体，以体现粉丝祝福的“纯手工温度”。



字体层级：主标题 24pt（带文字粉色光晕），二级标题 14pt（带左侧粉色高亮条），正文 10.5pt，辅助说明文字 9pt。

2.3 视觉质感 (UI Texture)
毛玻璃层 (Glassmorphism)：所有弹出的贺卡与浮动 UI 元素均采用半透明磨砂玻璃特效（background: rgba(19, 26, 38, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 123, 159, 0.2);），营造卡片漂浮在 Canvas 动态粒子之上的空间感。

高光溢出滤镜 (Bloom Effect)：在 PixiJS 中对火柴头和萤火虫粒子应用 BloomFilter，使其具有如同原图插画般空气中蕴含水汽的雾化扩散光芒。

三、 优化后的线性状态机流程 (State Machine Optimization)
整个体验转场以用户的交互来严格对齐声音与画面变化，流程优化调整如下：

Stage 0: 孤灯长夜 (Loading 资源预加载)
画面：全黑屏幕，只有一根静态未点燃的火柴横卧中央。进度条创造性地采用“火柴盒侧边擦条”的颗粒感视觉。背景音乐（BGM）此时只是隐约的深夜环境音（细微虫鸣与远方风声）。

逻辑：PixiJS 预加载核心纹理（火柴、插画重构切片、首批音效）。加载到 100% 后，火柴产生轻微的频率呼吸抖动，并浮现一行日系手写字：“擦亮火柴，唤醒长夜”。用户点击或滑动即进入 Stage 1。

Stage 1: 微光破晓 (划火柴转场)
动作：用户按住光标（光标变为插图同款的医疗粉色十字）在屏幕固定热区横向快速滑过。

视觉高潮：滑动达到速度阈值时，伴随猛烈的火柴擦拭声（Howler.js），火柴头爆开强烈的琥珀金光。利用 PixiJS 的 BlendMode.ADD 极度提亮。此时，房间暗色遮罩层以火柴头为圆心，进行径向羽化消散 (Radial Blur Mask 扩张)。图二（冷调暗室）作为背景底图渐渐显露，随之房间亮起。左上角开始以粉色流光手写播放 "Happy Birthday to Ling" 的 SVG 路径笔画动画。

Stage 2: 星火汇聚 (集心意与贺卡弹窗)
转场过渡：Stage 1 结束时，火柴火焰发生一次柔和的爆裂，分裂成 20~40 个呈“忽明忽暗、无规则慢速漂移”的萤火虫粒子。此时中央渐渐浮现出核心插图中的主角 Ling 与未点燃的腮红小猪蛋糕。

交互细节：用户点击全屏任意一个萤火虫粒子，伴随清脆的八音盒叮咚声，该粒子拉出一条优雅的贝塞尔曲线轨迹（利用 GSAP MotionPath）飞向小猪蛋糕周围的蜡烛。粒子触碰蜡烛的瞬间，蜡烛微微亮起（但未完全点燃），同时 Vue 3 DOM 层弹出一张毛玻璃贺卡。卡片展示粉丝昵称、祝福语、或点击播放粉丝的 5 秒语音，卡片带有柔和的缩放弹簧入场特效。右上角点击关闭后，方可寻找下一个粒子，确保每条心意都被认真阅读。

Stage 3: 逆光高潮 (分贝吹蜡烛与文字聚散)
状态突变：当所有粒子收集完毕，场景瞬间切入插图一（烛光大亮状态）。房间被极其浓郁的琥珀金色暖光包围。屏幕弹出温和的麦克风访问请求，并伴有视觉化的空气波纹指示器，提示：“对着麦克风吹气，或者用手扇风吧”。

文字聚散核心优化（决议）：实时计算用户麦克风输入的分贝值（AudioContext）。当持续 0.5 秒大于预设阈值时，触发吹灭。

高潮效果：画面在一瞬间切回插图二（熄灯冷蓝星空态），冷暖产生极大的视觉冲击。被吹散的蜡烛火焰瞬间化为成千上万个细小的金色光斑粒子，它们在屏幕正中央发生一次向内凝聚 (Converge)，组合拼写成巨大的花体艺术字：「生日快乐 🎂 Ling」。文字停留 3 秒（留出完美的粉丝截图时间），随后字形如烟花般碎裂，化为无数张带有爱心与猫耳装饰的复古明信片纸屑，如雪花般从天而降，铺满全屏。

Stage 4: 时光长廊 (电影胶片横向视差)
方案决议：满屏落下的卡片逐渐淡出，无缝过渡到时光长廊。为了最佳的图文排版、丝滑的移动端惯性滚动以及极佳的性能，此阶段确立采用 Vue 3 DOM + CSS Scroll-snap + GSAP ScrollTrigger 的联合方案。

视觉风格：整个页面进入横向无限水平滚动状态。背景为原图暗室的柔焦化模糊形态，重叠一层动态斑驳的光斑滤镜。每一张照片外框做成日系复古电影胶片带（Filmstrip）样式，照片本身叠加大规模的胶片噪点与微弱的色差滤镜（Chromatic Aberration）。粉丝在左右滚动时，文字、日期、照片本体三者产生轻微的视差错位移动 (Parallax Scrolling)，极具故事感。

Stage 5: 逆光谢幕
时光长廊拉到最右侧后，画面逐渐拉远淡入一个极致纯净的冷蓝色深夜星空大特写，浮现鸣谢名单与制作组信息。中央浮现极简设计的“再来一次”复古霓虹灯质感按钮。点击后，系统无缝调用初始化状态函数，清空 Pixi 场景缓存，状态机跳转回 loading，可反复体验。

四、 前端现代化技术栈与工程分工
为了让 Claude Code 能够精准生成没有任何技术冲突的高质量代码，特明确每一层的核心职责：

Vue 3 (SFC)：全局状态机调度、UI组件层（贺卡组件、语音播放控件按钮、进度条、Loading文本遮罩）、数据分发。

开发提示：让 Claude 优先编写基于 reactive 的状态机控制文件 useGameState.ts，所有阶段组件（如 StageWishes.vue）通过 v-if 挂载。

PixiJS v8：全屏高性能 Canvas 渲染。负责火柴、火焰粒子发射器、Perlin噪声萤火虫、Stage3粒子向内凝聚聚合字、背景底图高光滤镜切换。

开发提示：要求 Claude 建立唯一的 GameApp.ts 单例管理类，Canvas 采用固定定位居于底层（z-index: 1; pointer-events: none;），粒子交互由 Pixi 自身的 EventSystem 独立捕获。

GSAP 3：负责两端的动画纽带。一方面驱动 Vue DOM 贺卡的弹簧缩放、文字逐字淡入；另一方面驱动 Pixi 粒子沿着贝塞尔曲线路径运动。

开发提示：统一使用 GSAP Timeline 进行编排。注意在组件卸载（onUnmounted）时，调用 gsap.killTweensOf 防止内存泄漏。

Howler.js：全局立体声音频管理、BGM 播放控制、划火柴爆裂声、音效与卡片点击声同步。

开发提示：BGM 务必让 Claude 配置 html5: true 启用流式音频加载。粉丝语音文件一律懒加载，点击特定卡片时传入 URL 实例化播放。

TailwindCSS：负责网页全端响应式、毛玻璃 UI 布局、复古胶片长廊文本排版。

开发提示：严格使用 Tailwind 提供的半透明类名 bg-opacity 以及 backdrop-blur-md，杜绝任何复杂的原生 CSS。

五、 核心体验优化与优雅降级防御 (本地开发填坑指南)
在交付给本地 Claude Code 实施前，必须将以下面向生产环境的降级方案写入提示词：

麦克风权限死局防御（核心修改项）：由于 iOS 微信内置浏览器或部分移动端浏览器对 Web Audio API 限制极严（尤其是非 HTTPS 域名下直接禁用）。开发时，必须要求 Claude 编写超时检测：当进入 Stage 3 超过 3秒 未成功获取麦克风流，或者触发 catch 错误时，网页绝对不能卡死。此时，在蛋糕下方应立刻利用 GSAP 渐显淡入一个带有空气波纹特效的「用手扇风（点击吹灭）」SVG 按钮。用户点击该按钮，亦可完美无缝触发 Stage 3 粒子吹散与聚合的高潮全套动画。

多设备高刷新率 Retina 屏适配：由于插图细节极为精致，为避免在 iPhone、MacBook 等高分屏上出现粒子边缘模糊锯齿，初始化 PixiJS 时，必须在配置项中明确强制写入：

TypeScript
resolution: Math.max(1, window.devicePixelRatio || 1),
autoDensity: true
这样可以让 Canvas 渲染的分辨率与视网膜屏幕完美像素对齐，确保 Ling 的猫耳和腮红小猪蛋糕保持极高画质。

粒子池与内存垃圾回收 (GC) 优化：Stage 3 粒子由字形聚合到明信片散落同屏粒子数极高。开发 Pixi 粒子发射器时，强制 Claude Code 使用对象池模式（ParticlePool）进行 Sprite 复用。当粒子飞出屏幕或 alpha 降为 0 时，立刻收回池中，严禁频繁执行 new PIXI.Sprite() 导致移动端浏览器因 GC 卡顿爆显存。

六、 核心配置与数据契约设计
为了让项目数据与核心代码完全解耦，未来您只需要修改 blessings.ts 和 timeline.ts，即可随时更换粉丝祝福和时光长廊的图片。数据契约格式定义如下：

6.1 粉丝祝福数据契约 (src/data/blessings.ts)
TypeScript
export interface Blessing {
  id: string;
  from: string;      // 粉丝昵称
  text: string;      // 祝福文字内容
  audioUrl?: string; // 粉丝语音CDN直链（可选，支持MP3）
  // 核心视觉新增：赋予贺卡不同的日系复古信纸或UI主题样式，让每个粉丝的信件具有独特性
  styleType: 'classic-letter' | 'cherry-blossom' | 'city-pop-vinyl'; 
}

export const blessingsData: Blessing[] = [
  {
    id: "wish_001",
    from: "猫耳守护骑士",
    text: "祝Ling生日快乐！从最初的小直播间一路陪伴走到今天，看到你越来越闪耀，真的太感动了。新的一岁也要天天开心，医疗包和糖果都给你准备好啦！",
    audioUrl: "https://cdn.example.com/audio/wish001.mp3",
    styleType: "cherry-blossom"
  },
  {
    id: "wish_002",
    from: "腮红小猪守护者",
    text: "生日快乐鸭！这个纪念网站是我们所有粉丝送给你的礼物。希望你喜欢蛋糕上的那只小猪，它代表我们一直陪在你身边！",
    styleType: "classic-letter"
  }
];
6.2 时光长廊历史数据契约 (src/data/timeline.ts)
TypeScript
export interface TimelineItem {
  id: string;
  date: string;         // 事件发生时间节点
  title: string;        // 历史大事件标题
  description: string;  // 详细回忆文本
  imageUrl: string;     // 该回忆对应的插画/截图CDN直链
}

export const timelineData: TimelineItem[] = [
  {
    id: "time_001",
    date: "2024.10.15",
    title: "初次相遇的起点",
    description: "那是第一次开播的日子，虽然有些青涩和紧张，但是那份治愈全场的笑容，从一开始就深深印在了每个人的心里。",
    imageUrl: "https://cdn.example.com/images/timeline1.jpg"
  },
  {
    id: "time_002",
    date: "2025.06.01",
    title: "万人瞩目的里程碑",
    description: "达成了万人关注！直播间里飘满了粉色的医疗十字和爱心，那一晚我们一起听你唱了好多首歌，通宵庆祝。",
    imageUrl: "https://cdn.example.com/images/timeline2.jpg"
  }
];
💡 交付给 Claude Code 的推荐操作方式：
本地启动 Claude Code 后，先让他看下这个整体设计大纲。

指令示例：“请阅读这个生日纪念网站的设计大纲，根据‘四、前端现代化技术栈与工程分工’建立 Vue 3 项目结构，并优先编写 src/data/blessings.ts 数据层与 useGameState.ts 状态机逻辑。”

在开始 PixiJS 编写时，重点提醒它实现“Stage 3 的兜底手动吹灭按钮方案”，避免移动端由于麦克风报错产生阻塞。