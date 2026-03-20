// =============================================================================
// Cambly Transcript Scraper — Content Script
// Runs on: https://www.cambly.com/en/student/replay/*
// =============================================================================

// ---------------------------------------------------------------------------
// DOM selectors — update these when Cambly changes their markup
// ---------------------------------------------------------------------------
const SELECTORS = {
  // Row containers for each message
  messageRow:
    'div[class*="_alignItemsstart"][class*="_row"][class*="_flex"][class*="_marginTop"]',
  // Avatar image within a row
  avatarImg: 'img[class*="_avatarImage"]',
  // Text content paragraph
  textContent: 'p[class*="_typography"][class*="_size200"]',
  // Fallback selectors
  fallbackRow: 'div[class*="_box"][class*="_row"]',
  fallbackText: 'div[role="button"] > p',
  // Transcript container (the scrollable area containing all messages)
  transcriptContainer: 'div[class*="_box"][class*="_column"]',
};

// ---------------------------------------------------------------------------
// Scroll configuration
// ---------------------------------------------------------------------------
const SCROLL_STEP_PX = 600;
const SCROLL_PAUSE_MS = 800;
const MAX_IDLE_ATTEMPTS = 3; // stop after this many scrolls with no new content

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Return the name embedded in an avatar alt-text.
 * Example: "Tracie can Teach 的头像" → "Tracie can Teach"
 */
function extractNameFromAlt(altText) {
  if (!altText) return '';
  return altText.replace(/\s*的头像\s*$/, '').trim();
}

/**
 * Determine whether a given name belongs to the student.
 * We do a case-insensitive check: if the avatar name *contains* the
 * configured student name (or vice-versa) it is the student.
 */
function isStudent(avatarName, studentName) {
  if (!avatarName || !studentName) return false;
  const a = avatarName.toLowerCase();
  const s = studentName.toLowerCase();
  return a.includes(s) || s.includes(a);
}

/**
 * Determine speaker role using the avatar image source as a secondary signal.
 * Teacher avatars are hosted on camblyavatars.s3.amazonaws.com.
 * Student avatars use /static/images/ paths.
 */
function roleFromImgSrc(imgEl) {
  if (!imgEl) return null;
  const src = imgEl.getAttribute('src') || '';
  if (src.includes('camblyavatars.s3.amazonaws.com')) return 'teacher';
  if (src.includes('/static/images/')) return 'student';
  return null;
}

/**
 * Try to find the scrollable transcript container.
 * We look for the deepest scrollable ancestor of the first message row.
 */
function findScrollableContainer() {
  // Strategy 1: find a container that is actually scrollable
  const rows = document.querySelectorAll(SELECTORS.messageRow);
  if (rows.length > 0) {
    let el = rows[0].parentElement;
    while (el && el !== document.body) {
      if (el.scrollHeight > el.clientHeight + 10) {
        return el;
      }
      el = el.parentElement;
    }
  }

  // Strategy 2: broadest matching container selector
  const containers = document.querySelectorAll(SELECTORS.transcriptContainer);
  for (const c of containers) {
    if (c.scrollHeight > c.clientHeight + 10) {
      return c;
    }
  }

  return null;
}

/**
 * Scroll the container to the bottom, waiting for lazy-loaded content.
 * Resolves when no new children appear after MAX_IDLE_ATTEMPTS scrolls.
 */
function scrollToLoadAll(container) {
  return new Promise((resolve) => {
    if (!container) {
      resolve();
      return;
    }

    let idleCount = 0;
    let previousChildCount = container.querySelectorAll(SELECTORS.messageRow).length ||
                             container.querySelectorAll(SELECTORS.fallbackRow).length;

    function step() {
      container.scrollTop += SCROLL_STEP_PX;

      setTimeout(() => {
        const currentCount = container.querySelectorAll(SELECTORS.messageRow).length ||
                             container.querySelectorAll(SELECTORS.fallbackRow).length;

        if (currentCount > previousChildCount) {
          idleCount = 0;
          previousChildCount = currentCount;
        } else {
          idleCount++;
        }

        // Check if we have reached the bottom or exhausted idle attempts
        const atBottom =
          Math.abs(container.scrollHeight - container.scrollTop - container.clientHeight) < 5;

        if (idleCount >= MAX_IDLE_ATTEMPTS || atBottom) {
          // Scroll back to top so the user sees the beginning
          container.scrollTop = 0;
          resolve();
        } else {
          step();
        }
      }, SCROLL_PAUSE_MS);
    }

    step();
  });
}

/**
 * Try to extract the video duration from the page's video player.
 * Returns a string like "30:23" or "" if unavailable.
 */
function extractDuration() {
  // Look for a <video> element
  const video = document.querySelector('video');
  if (video && video.duration && isFinite(video.duration)) {
    const total = Math.floor(video.duration);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  }

  // Look for a visible duration string on the page (e.g. "30:23 / 30:23")
  const timeEls = document.querySelectorAll(
    'span, div, p'
  );
  for (const el of timeEls) {
    const text = (el.textContent || '').trim();
    // Match patterns like "30:23" or "1:02:45"
    const match = text.match(/(\d{1,2}:\d{2}(?::\d{2})?)\s*\/\s*(\d{1,2}:\d{2}(?::\d{2})?)/);
    if (match) {
      return match[2]; // total duration
    }
  }

  return '';
}

/**
 * Try to extract the lesson date from the page URL or visible elements.
 */
function extractDate() {
  // Check URL for date-like segments (e.g. /replay/2026-03-20-...)
  const urlMatch = window.location.href.match(/(\d{4}-\d{2}-\d{2})/);
  if (urlMatch) return urlMatch[1];

  // Look for a date string on the page
  const candidates = document.querySelectorAll('h1, h2, h3, h4, span, div, p');
  for (const el of candidates) {
    const text = (el.textContent || '').trim();
    // Match YYYY-MM-DD or Month DD, YYYY
    const iso = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
    if (iso) return iso[1];

    const english = text.match(
      /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/i
    );
    if (english) {
      const d = new Date(english[1]);
      if (!isNaN(d.getTime())) {
        return d.toISOString().slice(0, 10);
      }
    }
  }

  // Fallback: today's date
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

/**
 * Best-effort timestamp extraction for a single message row.
 */
function extractTimestamp(rowEl) {
  // Look for time-like text siblings or children (e.g. "12:34")
  const walker = document.createTreeWalker(rowEl, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const txt = walker.currentNode.textContent.trim();
    if (/^\d{1,2}:\d{2}$/.test(txt)) {
      return txt;
    }
  }
  return '';
}

// ---------------------------------------------------------------------------
// Main scraping logic
// ---------------------------------------------------------------------------

async function scrapeTranscript(studentName) {
  // 1. Find and scroll the transcript container to load all messages
  const container = findScrollableContainer();
  await scrollToLoadAll(container);

  // 2. Gather message rows (try primary selector, then fallback)
  let rows = Array.from(document.querySelectorAll(SELECTORS.messageRow));
  if (rows.length === 0) {
    rows = Array.from(document.querySelectorAll(SELECTORS.fallbackRow));
  }
  if (rows.length === 0) {
    return { success: false, error: 'No transcript rows found on this page.' };
  }

  // 3. Parse each row
  const transcript = [];
  let teacherName = '';

  for (const row of rows) {
    // --- avatar / speaker ---
    const avatarImg =
      row.querySelector(SELECTORS.avatarImg) ||
      row.querySelector('img[alt*="的头像"]');

    let name = '';
    let role = '';

    if (avatarImg) {
      name = extractNameFromAlt(avatarImg.getAttribute('alt'));
      // Determine role by name match first, then by image source
      if (isStudent(name, studentName)) {
        role = 'student';
      } else {
        const srcRole = roleFromImgSrc(avatarImg);
        role = srcRole || (name ? 'teacher' : 'unknown');
      }
    }

    if (role === 'teacher' && name && !teacherName) {
      teacherName = name;
    }

    // --- text content ---
    const textEl =
      row.querySelector(SELECTORS.textContent) ||
      row.querySelector(SELECTORS.fallbackText);
    const text = textEl ? textEl.textContent.trim() : '';

    if (!text) continue; // skip empty rows

    // --- timestamp ---
    const timestamp = extractTimestamp(row);

    transcript.push({
      speaker: role || 'unknown',
      name: name || (role === 'student' ? studentName : teacherName) || '',
      text,
      timestamp,
    });
  }

  // 4. Build metadata
  const meta = {
    date: extractDate(),
    teacher: teacherName || 'Unknown Teacher',
    student: studentName || 'Unknown Student',
    duration: extractDuration(),
    url: window.location.href,
  };

  return { success: true, data: { meta, transcript } };
}

// ---------------------------------------------------------------------------
// Page validity check
// ---------------------------------------------------------------------------

function checkPage() {
  const onReplayPage = /cambly\.com\/.*\/student\/replay\//i.test(
    window.location.href
  );
  const hasRows =
    document.querySelectorAll(SELECTORS.messageRow).length > 0 ||
    document.querySelectorAll(SELECTORS.fallbackRow).length > 0;

  return {
    success: true,
    isReplayPage: onReplayPage,
    hasTranscript: hasRows,
  };
}

// ---------------------------------------------------------------------------
// Message listener — communicates with the popup / background script
// ---------------------------------------------------------------------------

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'checkPage') {
    sendResponse(checkPage());
    return false; // synchronous
  }

  if (message.action === 'scrape') {
    const studentName = message.studentName || '';

    // scrapeTranscript is async (scrolling), so we must return true and call
    // sendResponse later.
    scrapeTranscript(studentName)
      .then((result) => sendResponse(result))
      .catch((err) =>
        sendResponse({ success: false, error: err.message || String(err) })
      );

    return true; // keep the message channel open for async response
  }

  return false;
});
