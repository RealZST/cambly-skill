// =============================================================================
// Cambly Transcript Scraper — Page-level script (MAIN world)
// Handles ALL DOM interaction: tab switching, date extraction, React fiber read.
// Communicates with content.js (ISOLATED world) via CustomEvents.
// =============================================================================

(function () {
  const REQ_EVENT = 'cambly-scraper-request';
  const RES_EVENT = 'cambly-scraper-response';

  // ---------------------------------------------------------------------------
  // Selectors & constants
  // ---------------------------------------------------------------------------
  const SEL = {
    tab: '[class*="_tab_b6c60"]',
    tabButton: '[role="button"][class*="_tapArea"]',
    selectedTabClass: '_selectedTab',
    messageRow:
      'div[class*="_alignItemsstart"][class*="_row"][class*="_flex"][class*="_marginTop"]',
    teacherLink: 'a[href*="/student/tutors/"]',
  };

  const TAB = { FEEDBACK: 0, STT: 1 };

  // ---------------------------------------------------------------------------
  // Tab helpers
  // ---------------------------------------------------------------------------

  function getReplayTabs() {
    return Array.from(document.querySelectorAll(SEL.tab)).slice(0, 4);
  }

  function getActiveTabIndex() {
    const tabs = getReplayTabs();
    for (let i = 0; i < tabs.length; i++) {
      if (tabs[i].className.includes(SEL.selectedTabClass)) return i;
    }
    return -1;
  }

  function clickTab(index) {
    return new Promise((resolve) => {
      const tabs = getReplayTabs();
      if (index < 0 || index >= tabs.length) { resolve(false); return; }
      const btn = tabs[index].querySelector(SEL.tabButton);
      if (btn) btn.click();
      else tabs[index].click();
      setTimeout(() => resolve(true), 1200);
    });
  }

  // ---------------------------------------------------------------------------
  // Date extraction (feedback tab)
  // ---------------------------------------------------------------------------

  function parseDateString(text) {
    if (!text) return null;

    const zh = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
    if (zh)
      return `${zh[1]}-${String(zh[2]).padStart(2, '0')}-${String(zh[3]).padStart(2, '0')}`;

    const en = text.match(
      /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{1,2}),?\s+(\d{4})/i
    );
    if (en) {
      const d = new Date(text);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }

    const enRev = text.match(
      /(\d{1,2})\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(\d{4})/i
    );
    if (enRev) {
      const d = new Date(text);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }

    const iso = text.match(/(\d{4}-\d{2}-\d{2})/);
    if (iso) return iso[1];

    const slash = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (slash)
      return `${slash[3]}-${String(slash[1]).padStart(2, '0')}-${String(slash[2]).padStart(2, '0')}`;

    return null;
  }

  function extractDateFromFeedback() {
    const link = document.querySelector(SEL.teacherLink);
    if (!link) return null;

    let container = link.parentElement;
    for (let i = 0; i < 3 && container; i++) container = container.parentElement;
    if (!container) return null;

    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const date = parseDateString(walker.currentNode.textContent.trim());
      if (date) return date;
    }

    return null;
  }

  function extractTeacherNameFromFeedback() {
    const link = document.querySelector(SEL.teacherLink);
    return link ? link.textContent.trim() : '';
  }

  // ---------------------------------------------------------------------------
  // React fiber extraction
  // ---------------------------------------------------------------------------

  function extractName(alt) {
    if (!alt) return '';
    return alt
      .replace(/\s*的头像\s*$/i, '')
      .replace(/\s*'?s?\s*avatar$/i, '')
      .replace(/\s*avatar$/i, '')
      .trim();
  }

  function formatTs(seconds) {
    if (seconds == null || !isFinite(seconds)) return '';
    const total = Math.floor(seconds);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
  }

  function extractTranscriptFromReact() {
    const row = document.querySelector(SEL.messageRow);
    if (!row) return null;

    const fiberKey = Object.keys(row).find(
      (k) => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
    );
    if (!fiberKey) return null;

    let fiber = row[fiberKey];
    for (let i = 0; i < 25 && fiber; i++) {
      const props = fiber.memoizedProps || {};
      if (Array.isArray(props.transcript) && props.transcript.length > 0) {
        const tutorId = props.tutor?.userId || props.tutor?.id || '';

        // Speaker names from DOM avatars
        const rows = document.querySelectorAll(SEL.messageRow);
        let teacherName = '';
        let studentName = '';
        for (const r of rows) {
          const img =
            r.querySelector('img[class*="_avatarImage"]') ||
            r.querySelector('img[alt*="的头像"], img[alt*="avatar" i]');
          if (!img) continue;
          const name = extractName(img.getAttribute('alt'));
          const src = img.getAttribute('src') || '';
          if (src.includes('camblyavatars.s3.amazonaws.com') && !teacherName)
            teacherName = name;
          if (src.includes('/static/images/') && !studentName)
            studentName = name;
          if (teacherName && studentName) break;
        }

        const transcript = props.transcript.map((e) => ({
          speaker: e.userId === tutorId ? 'teacher' : 'student',
          name: e.userId === tutorId ? teacherName : studentName,
          text: e.text,
          timestamp: formatTs(e.startOffsetSeconds),
        }));

        const video = document.querySelector('video');
        const duration =
          video && video.duration && isFinite(video.duration)
            ? formatTs(video.duration)
            : '';

        return { transcript, teacherName, studentName, duration };
      }
      fiber = fiber.return;
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Main handler — orchestrates the full extraction flow
  // ---------------------------------------------------------------------------

  async function handleRequest() {
    try {
      // Step 1: Go to feedback tab to get date & teacher name
      const originalTab = getActiveTabIndex();
      if (originalTab !== TAB.FEEDBACK) {
        await clickTab(TAB.FEEDBACK);
      }

      const lessonDate = extractDateFromFeedback();
      const feedbackTeacher = extractTeacherNameFromFeedback();

      // Step 2: Go to speech-to-text tab
      await clickTab(TAB.STT);
      // Extra wait for React to render rows
      await new Promise((r) => setTimeout(r, 800));

      // Step 3: Extract transcript from React fiber
      const reactData = extractTranscriptFromReact();
      if (!reactData || reactData.transcript.length === 0) {
        respond(null, 'No transcript data found.');
        return;
      }

      // Step 4: Build final result
      respond({
        transcript: reactData.transcript,
        teacherName: reactData.teacherName || feedbackTeacher || 'Unknown Teacher',
        studentName: reactData.studentName || 'Unknown Student',
        duration: reactData.duration,
        date: lessonDate,
      });
    } catch (err) {
      respond(null, err.message || String(err));
    }
  }

  function respond(data, error) {
    document.dispatchEvent(
      new CustomEvent(RES_EVENT, { detail: { data, error: error || null } })
    );
  }

  // Listen for requests from content.js
  document.addEventListener(REQ_EVENT, () => handleRequest());
})();
