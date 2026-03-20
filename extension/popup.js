// ---------------------------------------------------------------------------
// i18n — follow browser language
// ---------------------------------------------------------------------------

const I18N = {
  zh: {
    labelStudentName: "学生姓名",
    placeholderStudentName: "请输入你的名字",
    labelSaveFolder: "保存文件夹",
    hintSaveFolder: "Downloads 中的子文件夹，留空则保存到 Downloads 根目录",
    btnScrape: "抓取并保存",
    btnCopy: "复制到剪贴板",
    statusNotCambly: "请先打开 Cambly 课程回放页面",
    statusNotReplay: "当前页面不是 Cambly 回放页面",
    statusNoTranscript: "请先点击「语音转文字」标签",
    statusCannotConnect: "无法连接到页面内容脚本",
    statusScraping: "正在抓取…",
    statusSaveSuccess: (n) => `保存成功！共抓取 ${n} 条消息`,
    statusCopied: "已复制到剪贴板！",
    statusNoName: "请输入学生姓名",
    statusConnectError: "无法连接到页面，请刷新后重试",
    statusNoResponse: "内容脚本无响应",
    statusScrapeFail: "抓取失败",
    statusSaveFail: "抓取失败，请重试",
    statusCopyFail: "复制失败，请重试",
  },
  en: {
    labelStudentName: "Student Name",
    placeholderStudentName: "Enter your name",
    labelSaveFolder: "Save Folder",
    hintSaveFolder: "Subfolder in Downloads. Leave empty to save to Downloads root.",
    btnScrape: "Scrape & Save",
    btnCopy: "Copy to Clipboard",
    statusNotCambly: "Please open a Cambly lesson replay page",
    statusNotReplay: "This is not a Cambly replay page",
    statusNoTranscript: "Please click the Speech-to-Text tab first",
    statusCannotConnect: "Cannot connect to page content script",
    statusScraping: "Scraping…",
    statusSaveSuccess: (n) => `Saved! ${n} messages scraped.`,
    statusCopied: "Copied to clipboard!",
    statusNoName: "Please enter student name",
    statusConnectError: "Cannot connect to page. Please refresh and try again.",
    statusNoResponse: "Content script not responding",
    statusScrapeFail: "Scrape failed",
    statusSaveFail: "Scrape failed. Please try again.",
    statusCopyFail: "Copy failed. Please try again.",
  },
};

const lang = navigator.language.startsWith("zh") ? "zh" : "en";
const t = I18N[lang];

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) el.textContent = t[key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (t[key]) el.placeholder = t[key];
  });
}

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------

const studentNameInput = document.getElementById("studentName");
const saveFolderInput = document.getElementById("saveFolder");
const scrapeBtn = document.getElementById("scrapeBtn");
const copyBtn = document.getElementById("copyBtn");
const statusEl = document.getElementById("status");

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = type; // "success" | "error" | "info" | "warning"
}

function clearStatus() {
  statusEl.textContent = "";
  statusEl.className = "";
  statusEl.style.display = "none";
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

function saveSettings() {
  chrome.storage.local.set({
    studentName: studentNameInput.value.trim(),
    saveFolder: saveFolderInput.value.trim(),
  });
}

function restoreSettings() {
  chrome.storage.local.get(["studentName", "saveFolder"], (result) => {
    if (result.studentName) studentNameInput.value = result.studentName;
    if (result.saveFolder) saveFolderInput.value = result.saveFolder;
  });
}

studentNameInput.addEventListener("input", saveSettings);
saveFolderInput.addEventListener("input", saveSettings);

// ---------------------------------------------------------------------------
// Page check
// ---------------------------------------------------------------------------

function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0]);
    });
  });
}

async function checkPage() {
  const tab = await getActiveTab();

  if (!tab || !tab.url || !tab.url.includes("cambly.com")) {
    showStatus(t.statusNotCambly, "warning");
    scrapeBtn.disabled = true;
    copyBtn.disabled = true;
    return;
  }

  try {
    chrome.tabs.sendMessage(tab.id, { action: "checkPage" }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus(t.statusNotCambly, "warning");
        scrapeBtn.disabled = true;
        copyBtn.disabled = true;
        return;
      }
      if (!response || !response.isReplayPage) {
        showStatus(t.statusNotReplay, "warning");
        scrapeBtn.disabled = true;
        copyBtn.disabled = true;
      } else if (!response.hasTranscript) {
        showStatus(t.statusNoTranscript, "warning");
      }
    });
  } catch {
    showStatus(t.statusCannotConnect, "error");
    scrapeBtn.disabled = true;
    copyBtn.disabled = true;
  }
}

// ---------------------------------------------------------------------------
// Scrape helpers
// ---------------------------------------------------------------------------

function sendScrape(studentName) {
  return new Promise((resolve, reject) => {
    getActiveTab().then((tab) => {
      chrome.tabs.sendMessage(
        tab.id,
        { action: "scrape", studentName },
        (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(t.statusConnectError));
            return;
          }
          if (!response) {
            reject(new Error(t.statusNoResponse));
            return;
          }
          if (!response.success) {
            reject(new Error(response.error || t.statusScrapeFail));
            return;
          }
          resolve(response);
        }
      );
    });
  });
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function formatDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function generateMarkdown(meta, transcript) {
  const date = formatDate(meta.date);
  const teacher = meta.teacher || "Unknown";
  const student = meta.student || "Unknown";
  const duration = meta.duration || "N/A";

  let md = `# Cambly Lesson — ${date}\n`;
  md += `Teacher: ${teacher} | Student: ${student} | Duration: ${duration}\n\n`;
  md += `---\n\n`;

  for (const msg of transcript) {
    const ts = msg.timestamp ? `[${msg.timestamp}] ` : "";
    const role = msg.speaker === "teacher" ? "Teacher" : "Student";
    md += `${ts}**[${role}]** ${msg.text}\n\n`;
  }

  return md;
}

function generatePlainText(transcript) {
  return transcript
    .map((msg) => {
      const role = msg.speaker === "teacher" ? "Teacher" : "Student";
      return `[${role}] ${msg.text}`;
    })
    .join("\n");
}

// ---------------------------------------------------------------------------
// Download
// ---------------------------------------------------------------------------

function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  chrome.downloads.download(
    { url, filename, saveAs: false },
    () => {
      URL.revokeObjectURL(url);
    }
  );
}

// ---------------------------------------------------------------------------
// Button handlers
// ---------------------------------------------------------------------------

scrapeBtn.addEventListener("click", async () => {
  const studentName = studentNameInput.value.trim();
  if (!studentName) {
    showStatus(t.statusNoName, "error");
    return;
  }

  clearStatus();
  showStatus(t.statusScraping, "info");
  scrapeBtn.disabled = true;
  copyBtn.disabled = true;

  try {
    const result = await sendScrape(studentName);
    const { meta, transcript } = result.data;
    const date = formatDate(meta.date);
    const folder = saveFolderInput.value.trim();
    const prefix = folder ? `${folder}/cambly-${date}` : `cambly-${date}`;

    const jsonContent = JSON.stringify(result.data, null, 2);
    const mdContent = generateMarkdown(meta, transcript);

    downloadFile(jsonContent, `${prefix}.json`, "application/json");
    downloadFile(mdContent, `${prefix}.md`, "text/markdown");

    showStatus(t.statusSaveSuccess(transcript.length), "success");
  } catch (err) {
    showStatus(err.message || t.statusSaveFail, "error");
  } finally {
    scrapeBtn.disabled = false;
    copyBtn.disabled = false;
  }
});

copyBtn.addEventListener("click", async () => {
  const studentName = studentNameInput.value.trim();

  clearStatus();
  showStatus(t.statusScraping, "info");
  scrapeBtn.disabled = true;
  copyBtn.disabled = true;

  try {
    const result = await sendScrape(studentName);
    const text = generatePlainText(result.data.transcript);

    await navigator.clipboard.writeText(text);
    showStatus(t.statusCopied, "success");
  } catch (err) {
    showStatus(err.message || t.statusCopyFail, "error");
  } finally {
    scrapeBtn.disabled = false;
    copyBtn.disabled = false;
  }
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  applyI18n();
  restoreSettings();
  checkPage();
});
