# Cambly 课后复习

用 Chrome 扩展保存 Cambly 课程对话记录，再用 Skill 分析老师的发言，帮你整理值得记住的习语、短语动词和实用表达。

> **English →** [README.md](../README.md)

---

## 工作流程

```
Cambly 回放页面  ──>  Chrome 扩展  ──>  JSON 对话记录  ──>  复习 Skill  ──>  词汇报告
```

1. **保存** — Chrome 扩展从课程回放页面抓取对话记录，保存为结构化的 JSON 文件。
2. **复习** — Skill 读取对话记录，评估你的英语水平，从老师的发言中推荐实用表达——附带上下文、例句和母语释义。

---

## 📥 第一部分：Chrome 扩展

### 安装

1. 克隆或下载本仓库
2. 在 Chrome 中打开 `chrome://extensions/`
3. 开启右上角的**开发者模式**
4. 点击**加载已解压的扩展程序**，选择 `extension/` 文件夹

### 使用方法

1. 登录 [Cambly](https://www.cambly.com)，打开一节课的**回放页面**
2. 点击浏览器工具栏中的扩展图标
3. 点击 **Scrape & Save**
4. JSON 文件会保存到 `~/Downloads/cambly-transcripts/`

文件自动命名为：`cambly-2026-03-15-tutor_name.json`

> **注意：** 你可以在扩展弹窗中修改保存文件夹，但需要同步更新 `skill/cambly-review.md` 中的路径，否则 Skill 无法找到你的文件。

> **已知问题：** [Chrono 下载管理器](https://chromewebstore.google.com/detail/chrono-download-manager/mciiogijehkdemklbdcbfkefimifhecn)扩展会导致下载的文件名变成 UUID 格式。使用本扩展前请先禁用 Chrono。

---

## 📝 第二部分：复习 Skill

保存对话记录后，用任何语言向你的 coding agent 提问即可：

- *"Review my Cambly lesson from yesterday"*
- *"昨天 Cambly 的课我该记哪些短语？"*
- *"帮我复习一下 3 月 15 号的课"*

### Skill 做了什么

| 步骤 | 说明 |
|------|------|
| **查找** | 根据日期、老师或时间范围定位对应的对话记录 |
| **评估** | 阅读你的发言，判断你的英语水平 |
| **提取** | 从**老师的发言**中挑出习语、短语动词和实用搭配 |
| **展示** | 展示每个表达的原句、上下文、例句和母语释义 |

Skill 会过滤掉对你来说太简单的表达，但不会跳过高级的。

### Skill 安装

将 skill 文件复制到你使用的 coding agent 目录：

<details>
<summary><strong>OpenClaw</strong></summary>

```bash
mkdir -p ~/.openclaw/skills/cambly-review
cp skill/cambly-review.md ~/.openclaw/skills/cambly-review/SKILL.md
```
</details>

<details>
<summary><strong>Claude Code</strong></summary>

```bash
mkdir -p ~/.claude/skills/cambly-review
cp skill/cambly-review.md ~/.claude/skills/cambly-review/SKILL.md
```
</details>

<details>
<summary><strong>Codex CLI</strong></summary>

```bash
mkdir -p ~/.codex/skills/cambly-review
cp skill/cambly-review.md ~/.codex/skills/cambly-review/SKILL.md
```
</details>

<details>
<summary><strong>Gemini CLI</strong></summary>

```bash
mkdir -p ~/.gemini/skills/cambly-review
cp skill/cambly-review.md ~/.gemini/skills/cambly-review/SKILL.md
```
</details>

### 输出示例

> **1. hit the ground running**
> - **Original sentence**: "You really hit the ground running with that project."
> - **Timestamp**: 12:34
> - **Context**: Discussing how the student started a new job and adapted quickly.
> - **Examples**:
>   1. She hit the ground running in her new role and impressed everyone.
>   2. We need someone who can hit the ground running without much training.
>   3. After the onboarding, he hit the ground running on the first day.
>
> > 中文释义：形容某人很快适应新环境并开始高效工作。

释义语言会自动适配——用英语提问显示英文释义，用西班牙语提问显示西班牙语释义，以此类推。

---

## 许可证

MIT
