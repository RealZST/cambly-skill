// =============================================================================
// Cambly Transcript Scraper — Content Script (ISOLATED world)
// Handles popup messages. Delegates all extraction to page-extract.js (MAIN).
// =============================================================================

const REQ_EVENT = 'cambly-scraper-request';
const RES_EVENT = 'cambly-scraper-response';

// ---------------------------------------------------------------------------
// Request data from page-extract.js (MAIN world)
// ---------------------------------------------------------------------------

function requestExtraction() {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      resolve({ data: null, error: 'Extraction timed out.' });
    }, 15000);

    document.addEventListener(
      RES_EVENT,
      (e) => {
        clearTimeout(timeout);
        resolve(e.detail || { data: null, error: 'Empty response.' });
      },
      { once: true }
    );

    document.dispatchEvent(new CustomEvent(REQ_EVENT));
  });
}

// ---------------------------------------------------------------------------
// Scrape
// ---------------------------------------------------------------------------

async function scrapeTranscript() {
  const result = await requestExtraction();

  if (result.error || !result.data) {
    return {
      success: false,
      error: result.error || 'No transcript data found on this page.',
    };
  }

  const { transcript, teacherName, studentName, duration, date } = result.data;

  if (!transcript || transcript.length === 0) {
    return { success: false, error: 'Transcript is empty.' };
  }

  const meta = {
    date: date || new Date().toISOString().slice(0, 10),
    teacher: teacherName || 'Unknown Teacher',
    student: studentName || 'Unknown Student',
    duration: duration || '',
    url: window.location.href,
  };

  return { success: true, data: { meta, transcript } };
}

// ---------------------------------------------------------------------------
// Page validity check
// ---------------------------------------------------------------------------

function checkPage() {
  const url = window.location.href;
  const onReplayPage =
    /cambly\.com\/.*\/student\/progress\/past-lesson\b/i.test(url) &&
    !/\/past-lessons\b/i.test(url);

  return { success: true, isReplayPage: onReplayPage };
}

// ---------------------------------------------------------------------------
// Message listener (from popup)
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'checkPage') {
    sendResponse(checkPage());
    return false;
  }

  if (message.action === 'scrape') {
    scrapeTranscript()
      .then((result) => sendResponse(result))
      .catch((err) =>
        sendResponse({ success: false, error: err.message || String(err) })
      );
    return true;
  }

  return false;
});
