// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------

const saveFolderInput = document.getElementById("saveFolder");
const scrapeBtn = document.getElementById("scrapeBtn");
const statusEl = document.getElementById("status");

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

function showStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = type;
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

function saveSettings() {
  chrome.storage.local.set({ saveFolder: saveFolderInput.value.trim() });
}

function restoreSettings() {
  chrome.storage.local.get(["saveFolder"], (result) => {
    if (result.saveFolder != null) saveFolderInput.value = result.saveFolder;
  });
}

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
    showStatus("Please open a Cambly lesson replay page.", "warning");
    scrapeBtn.disabled = true;
    return;
  }

  if (!/\/student\/progress\/past-lesson\b/.test(tab.url) || tab.url.includes("/past-lessons")) {
    showStatus("This is not a replay page. Please open a lesson replay detail page.", "warning");
    scrapeBtn.disabled = true;
    return;
  }

  try {
    chrome.tabs.sendMessage(tab.id, { action: "checkPage" }, (response) => {
      if (chrome.runtime.lastError) {
        showStatus("Cannot connect to page. Please refresh and try again.", "warning");
        scrapeBtn.disabled = true;
        return;
      }
      if (!response || !response.isReplayPage) {
        showStatus("This is not a replay page. Please open a lesson replay detail page.", "warning");
        scrapeBtn.disabled = true;
      } else {
        showStatus("Ready! Click Scrape & Save.", "info");
      }
    });
  } catch {
    showStatus("Cannot connect to page. Please refresh and try again.", "error");
    scrapeBtn.disabled = true;
  }
}

// ---------------------------------------------------------------------------
// Scrape
// ---------------------------------------------------------------------------

function sendScrape() {
  return new Promise((resolve, reject) => {
    getActiveTab().then((tab) => {
      chrome.tabs.sendMessage(tab.id, { action: "scrape" }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error("Cannot connect to page. Please refresh and try again."));
          return;
        }
        if (!response) {
          reject(new Error("Content script not responding."));
          return;
        }
        if (!response.success) {
          reject(new Error(response.error || "Scrape failed."));
          return;
        }
        resolve(response);
      });
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

// ---------------------------------------------------------------------------
// Download with confirmation
// ---------------------------------------------------------------------------

function downloadFile(content, filename, mimeType) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    chrome.downloads.download(
      { url, filename, saveAs: false, conflictAction: "uniquify" },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          URL.revokeObjectURL(url);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (downloadId == null) {
          URL.revokeObjectURL(url);
          reject(new Error("Download failed."));
          return;
        }
        // Delay revocation so Chrome finishes reading the blob
        const onChanged = (delta) => {
          if (delta.id !== downloadId) return;
          if (delta.state && delta.state.current === "complete") {
            URL.revokeObjectURL(url);
            chrome.downloads.onChanged.removeListener(onChanged);
            resolve(downloadId);
          } else if (delta.state && delta.state.current === "interrupted") {
            URL.revokeObjectURL(url);
            chrome.downloads.onChanged.removeListener(onChanged);
            reject(new Error("Download interrupted."));
          }
        };
        chrome.downloads.onChanged.addListener(onChanged);
        // Safety fallback: revoke after 30s regardless
        setTimeout(() => URL.revokeObjectURL(url), 30000);
      }
    );
  });
}

// ---------------------------------------------------------------------------
// Button handler
// ---------------------------------------------------------------------------

scrapeBtn.addEventListener("click", async () => {
  showStatus("Scraping transcript...", "info");
  scrapeBtn.disabled = true;

  try {
    const result = await sendScrape();
    const { meta, transcript } = result.data;
    const date = formatDate(meta.date);
    const teacher = (meta.teacher || "unknown").replace(/[\/\\:*?"<>|]/g, "_");
    const folder = saveFolderInput.value.trim() || "cambly-scripts";
    const baseName = `cambly-${date}-${teacher}`;
    const prefix = `${folder}/${baseName}`;

    const jsonContent = JSON.stringify(result.data, null, 2);

    showStatus("Saving file...", "info");

    await downloadFile(jsonContent, `${prefix}.json`, "application/json");

    showStatus(
      `Saved! ${transcript.length} messages scraped.\n` +
      `File: ${baseName}.json`,
      "success"
    );
  } catch (err) {
    showStatus(err.message || "Scrape failed. Please try again.", "error");
  } finally {
    scrapeBtn.disabled = false;
  }
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  restoreSettings();
  checkPage();
});
