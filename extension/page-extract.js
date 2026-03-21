// =============================================================================
// Cambly Transcript Scraper — Page-level script (MAIN world)
// Extracts lesson data from React fiber props. Switches to Speech-to-Text tab
// only when needed. Communicates with content.js (ISOLATED world) via CustomEvents.
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
  };

  const TAB_STT = 1;

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
  // Date extraction — React props (language-independent, primary method)
  // ---------------------------------------------------------------------------

  function extractDateFromReactProps() {
    // Find any element with a React fiber to reach the root
    const seed = document.querySelector('[class*="_tab_"]') || document.querySelector(SEL.tab);
    if (!seed) return null;

    const fiberKey = Object.keys(seed).find(
      (k) => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance')
    );
    if (!fiberKey) return null;

    // Walk up to the root fiber
    let root = seed[fiberKey];
    while (root.return) root = root.return;

    // BFS down looking for scheduledStartAt in lesson participant props
    const queue = [root];
    let visited = 0;
    while (queue.length > 0 && visited < 600) {
      const f = queue.shift();
      if (!f) continue;
      visited++;

      const props = f.memoizedProps || {};
      const lp = props.myLessonParticipant || props.lessonParticipant;
      if (lp && lp.scheduledStartAt && lp.scheduledStartAt.$date) {
        const d = new Date(lp.scheduledStartAt.$date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }

      if (f.child) queue.push(f.child);
      if (f.sibling) queue.push(f.sibling);
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // React fiber extraction (transcript, names, duration)
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
        const tutorDisplayName = props.tutor?.displayName || '';

        // Speaker names from DOM avatars (fallback for tutor, primary for student)
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

        // Prefer React props for tutor name, fall back to avatar
        teacherName = teacherName || tutorDisplayName;

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
      // Step 1: Extract date from React props (language-independent, no tab switch)
      const lessonDate = extractDateFromReactProps();

      // Step 2: Ensure Speech-to-Text tab is active (transcript data only exists
      //         in the fiber tree when this tab is rendered)
      if (getActiveTabIndex() !== TAB_STT) {
        await clickTab(TAB_STT);
        // Wait for React to render transcript rows
        await new Promise((r) => setTimeout(r, 800));
      }

      // Step 3: Extract transcript, names, and duration from React fiber
      const reactData = extractTranscriptFromReact();
      if (!reactData || reactData.transcript.length === 0) {
        respond(null, 'No transcript data found.');
        return;
      }

      // Step 4: Build final result
      respond({
        transcript: reactData.transcript,
        teacherName: reactData.teacherName || 'Unknown Teacher',
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
