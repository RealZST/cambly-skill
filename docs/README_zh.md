# Cambly 课程录音转文字抓取器

一个 Chrome 扩展，用于从 [Cambly](https://www.cambly.com) 课程回放页面提取对话记录，并保存为结构化的 JSON 文件。

> **English →** [README.md](../README.md)

## 功能特点

- **一键抓取** — 从任意 Cambly 课程回放页面提取完整对话记录
- **自动提取元数据** — 自动获取上课日期、老师名、学生名和课程时长，无需手动输入
- **说话人识别** — 通过头像 URL 自动区分老师和学生
- **时间戳** — 保留课程中每条消息的时间戳
- **结构化 JSON 输出** — 干净、可机器读取的格式，方便后续处理

## 工作原理

1. 打开 Cambly 课程回放页面（`/student/progress/past-lesson?lessonV2Id=...`）
2. 点击浏览器工具栏中的扩展图标
3. 点击 **Scrape & Save**
4. 扩展会自动执行以下操作：
   - 切换到**反馈**标签页，提取上课日期和老师名
   - 切换到**语音转文字**标签页，通过 React fiber 内部数据提取完整对话记录
   - 将 JSON 文件下载到 `~/Downloads/cambly-scripts/`

### 输出格式

**文件名：** `cambly-{日期}-{老师名}.json`（例如 `cambly-2026-03-15-sabley01.json`）

```json
{
  "meta": {
    "date": "2026-03-15",
    "teacher": "sabley01",
    "student": "John",
    "duration": "28:45",
    "url": "https://www.cambly.com/..."
  },
  "transcript": [
    {
      "speaker": "teacher",
      "name": "sabley01",
      "text": "Hi, how are you today?",
      "timestamp": "0:03"
    },
    {
      "speaker": "student",
      "name": "John",
      "text": "I'm doing great, thanks!",
      "timestamp": "0:07"
    }
  ]
}
```

## 安装方法

1. 克隆或下载本仓库
2. 在 Chrome 中打开 `chrome://extensions/`
3. 开启右上角的**开发者模式**
4. 点击**加载已解压的扩展程序**，选择 `extension/` 文件夹

## 已知问题

### Chrono 下载管理器兼容性问题

如果你安装了 **Chrono 下载管理器**扩展，下载的文件名会变成 **UUID 格式**（例如 `a57ec8de-c1d2-4c67-a60c-7781de56d48b.json`），而不是预期的 `cambly-{日期}-{老师名}.json` 格式。

**原因：** Chrono 会拦截 Chrome 的 `chrome.downloads.download()` API 调用，但无法读取其中的 `filename` 参数。它只能从 blob URL 中提取文件名，而 blob URL 的标识符是一个 UUID。

**解决方法：** 在使用本扩展前，请先禁用 Chrono（或其他第三方下载管理器扩展）。使用完毕后可以重新启用。

## 技术栈

| 组件 | 说明 |
|---|---|
| 平台 | Chrome 扩展（Manifest V3） |
| Content Script | 运行在 ISOLATED 环境 — 负责与 popup 通信 |
| Page Script | 运行在 MAIN 环境 — 访问 React fiber 树和 DOM |
| 通信方式 | ISOLATED 与 MAIN 环境之间通过 CustomEvent 通信 |
| 数据提取 | 遍历 React fiber 树获取 transcript 数据 |

## 许可证

MIT
