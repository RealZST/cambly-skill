# Cambly 课后复习

保存 Cambly 课程对话记录到本地，再用 AI Skill 复习老师说过的实用短语、习语和词汇。

> **English →** [README.md](../README.md)

## 这个项目是做什么的

项目分两部分：

1. **Chrome 扩展** — 从 Cambly 课程回放页面抓取对话记录，保存为本地 JSON 文件。
2. **复习 Skill** — 一个 AI 技能（适用于 OpenClaw、Claude Code、Codex、Gemini CLI 等），读取保存的对话记录，帮你复习老师说过的实用表达——习语、短语动词、地道搭配。

## 第一部分：Chrome 扩展

### 安装

1. 克隆或下载本仓库
2. 在 Chrome 中打开 `chrome://extensions/`
3. 开启右上角的**开发者模式**
4. 点击**加载已解压的扩展程序**，选择 `extension/` 文件夹

### 使用方法

1. 登录 [Cambly](https://www.cambly.com)，打开一节课的**回放页面**
2. 点击浏览器工具栏中的扩展图标
3. 点击 **Scrape & Save**
4. JSON 文件会保存到「下载」文件夹下的 `cambly-transcripts/` 目录

文件名格式为 `cambly-2026-03-15-jane_tutor.json`，上课日期和老师名会自动提取。

### 注意：文件夹名称与 Skill 同步

文件默认保存到 `~/Downloads/cambly-transcripts/`。你可以在扩展弹窗中修改文件夹名称，但如果修改了，需要同步更新 `skill/cambly-review.md` 中的路径，否则复习 Skill 将无法找到你的文件。

### 已知问题：Chrono 下载管理器

如果你安装了 **Chrono 下载管理器**扩展，下载的文件名会变成 UUID 格式（例如 `a57ec8de-c1d2-4c67-a60c-7781de56d48b.json`），而不是预期的格式。

**解决方法：** 使用本扩展前先禁用 Chrono，用完后可以重新启用。

## 第二部分：复习 Skill

保存对话记录后，你可以用 AI Skill 来复习。用自然语言提问即可：

- *"Review my Cambly lesson from yesterday"*
- *"昨天 Cambly 的课我该记哪些短语？"*
- *"帮我复习一下 3 月 15 号的课"*

Skill 会：

1. 根据日期找到对应的对话记录文件
2. 从你的发言评估你的英语水平
3. 从**老师的发言**中挑出值得学习的表达——习语、短语动词、实用搭配
4. 展示每个表达的原句、时间戳、对话上下文和例句
5. 用**你的母语**解释含义——根据你提问时使用的语言自动识别

### Skill 安装

各主流 Code Agent 都遵循相同的规范：在 skill 目录下创建一个以技能名命名的文件夹，放入 `SKILL.md` 文件。根据你使用的工具选择对应命令：

**OpenClaw**
```bash
mkdir -p ~/.openclaw/skills/cambly-review
cp skill/cambly-review.md ~/.openclaw/skills/cambly-review/SKILL.md
```

**Claude Code**
```bash
mkdir -p ~/.claude/skills/cambly-review
cp skill/cambly-review.md ~/.claude/skills/cambly-review/SKILL.md
```

**Codex CLI**
```bash
mkdir -p ~/.codex/skills/cambly-review
cp skill/cambly-review.md ~/.codex/skills/cambly-review/SKILL.md
```

**Gemini CLI**
```bash
mkdir -p ~/.gemini/skills/cambly-review
cp skill/cambly-review.md ~/.gemini/skills/cambly-review/SKILL.md
```

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

*释义语言会自动适配——用英语提问显示 `> Meaning: ...`，用西班牙语提问显示 `> Explicación: ...`，以此类推。*

## 许可证

MIT
