/**
 * Enterprise Lesson Library Module
 * Manages lessons for the currently selected CEFR group.
 * All operations happen in Bootstrap modals — no page navigation.
 */
(function () {
  'use strict';

  const API_BASE = 'http://localhost:5000/api';
  const PAGE_SIZE = 9;

  let TASK_META = {};

  async function loadTaskTypes() {
    try {
      const res = await fetch(`${API_BASE}/task-types`);
      if (!res.ok) throw new Error('Failed to load task types');
      const json = await res.json();
      TASK_META = {};
      json.forEach(t => {
        TASK_META[t.code] = {
          icon: `<i class="bi ${t.icon}" style="color: ${t.color}"></i>`,
          label: t.name,
          color: t.color,
          summary: buildSummaryFn(t.code)
        };
      });
    } catch (err) {
      console.error('[LessonLibrary] Error loading task types:', err);
      // Fallback
      TASK_META = {
        VIDEO: { icon: '🎬', label: 'Video', summary: (t) => t.videoTask ? `${t.videoTask.duration || '—'} min video` : 'Video lesson' },
        VOCABULARY: { icon: '📖', label: 'Vocabulary', summary: (t) => t.flashcardTask ? `${t.flashcardTask.cards?.length || 0} words` : 'Vocabulary deck' },
        GRAMMAR: { icon: '📝', label: 'Grammar', summary: (t) => t.grammarTest ? `${t.grammarTest.questions?.length || 0} questions` : 'Grammar test' },
      };
    }
  }

  function buildSummaryFn(code) {
    switch (code) {
      case 'VIDEO':      return (t) => t.videoTask ? `🎬 ${t.videoTask.duration || 5} min video` : 'Video lesson';
      case 'VOCABULARY': return (t) => t.flashcardTask ? `🎴 ${t.flashcardTask.cards?.length || 0} words • ⏱ 10-25 min study` : 'Vocabulary deck • ⏱ 10-25 min study';
      case 'FLASHCARD':  return (t) => t.flashcardTask ? `🎴 ${t.flashcardTask.cards?.length || 0} cards • ⏱ 10-25 min study` : 'Flashcard deck • ⏱ 10-25 min study';
      case 'READING':    return (t) => t.readingTask ? `📖 ${t.readingTask.wordCount || 0} words • ⏱ 10 min` : 'Reading text • ⏱ 10 min';
      case 'LISTENING':  return () => '🎧 Audio task • ⏱ 10 min';
      case 'WRITING':    return (t) => t.writingTask?.wordLimit ? `✍️ Limit: ${t.writingTask.wordLimit} words • ⏱ 15 min` : 'Writing prompt • ⏱ 15 min';
      case 'SPEAKING':   return (t) => t.speakingTask?.prompt ? `🎙️ ${t.speakingTask.prompt.slice(0, 40)}… • ⏱ 5-10 min (A1)` : 'Record yourself • ⏱ 5-10 min (A1)';
      case 'GRAMMAR':    return (t) => t.grammarTest ? `📝 ${t.grammarTest.questions?.length || 0} questions • ⏱ 45 min test limit` : 'Grammar test • ⏱ 45 min test limit';
      case 'TEST':       return (t) => t.testTask ? `📝 ${t.testTask.questions?.length || 0} questions • ⏱ 45 min limit` : 'Test • ⏱ 45 min limit';
      default:           return () => `${code} task`;
    }
  }


  // State
  let allLessons = [];
  let filteredLessons = [];
  let currentPage = 1;
  let currentGroup = 'A1';
  let activeLessonId = null;

  // DOM references
  const grid       = document.getElementById('lessonCardsGrid');
  const pagination = document.getElementById('lessonPagination');
  const searchIn   = document.getElementById('lessonSearchInput');
  const filterSel  = document.getElementById('lessonStatusFilter');
  const sortSel    = document.getElementById('lessonSortSelect');
  const groupChip  = document.getElementById('lessonGroupChip');

  // Stats elements
  const elTotal       = document.getElementById('lessonStatTotal');
  const elAvgTasks    = document.getElementById('lessonStatAvgTasks');
  const elAvgDuration = document.getElementById('lessonStatAvgDuration');

  // Preview modal elements
  const previewModal       = document.getElementById('lessonPreviewModal');
  const previewModalBS     = previewModal ? new bootstrap.Modal(previewModal) : null;
  const deleteModal        = document.getElementById('deleteLessonModal');
  const deleteModalBS      = deleteModal ? new bootstrap.Modal(deleteModal) : null;

  // ─── Utility ────────────────────────────────────────────────────────

  function formatDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function estimateDurationDetailed(tasks) {
    if (!tasks || !tasks.length) return { totalStr: '—', breakdownHtml: '' };

    let totalMins = 0;
    let items = [];

    tasks.forEach(t => {
      const type = (t.type || '').toUpperCase();
      let mins = 0;
      let label = '';
      let icon = '📋';

      if (type === 'GRAMMAR' || type === 'TEST') {
        mins = parseInt(t.grammarTest?.timeLimit || t.testTask?.timeLimit || 45, 10);
        label = `Grammar Test: ${mins} min limit`;
        icon = '📝';
      } else if (type === 'VIDEO') {
        mins = parseInt(t.videoTask?.duration || 5, 10);
        label = `Video Lesson: ${mins} min`;
        icon = '🎬';
      } else if (type === 'VOCABULARY' || type === 'FLASHCARD') {
        mins = 15;
        label = `Vocabulary: 10-25 min`;
        icon = '🎴';
      } else if (type === 'SPEAKING') {
        const lim = Math.ceil(parseInt(t.speakingTask?.durationLimit || 300, 10) / 60) || 5;
        mins = Math.max(5, Math.min(lim, 10));
        label = `Speaking (A1): 5-10 min limit`;
        icon = '🎙️';
      } else if (type === 'WRITING') {
        mins = 15;
        label = `Writing: 15 min`;
        icon = '✍️';
      } else if (type === 'READING') {
        mins = 10;
        label = `Reading: 10 min`;
        icon = '📖';
      } else if (type === 'LISTENING') {
        mins = parseInt(t.listeningTask?.duration || 10, 10);
        label = `Listening: ${mins} min`;
        icon = '🎧';
      } else {
        mins = 5;
        label = `${type}: ${mins} min`;
      }

      totalMins += mins;
      items.push({ icon, label });
    });

    let totalStr = `~${totalMins} min`;
    if (totalMins >= 60) {
      const hrs = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      totalStr = mins > 0 ? `~${hrs} hr ${mins} min` : `~${hrs} hr`;
    }

    const breakdownHtml = items.map(item => `<div class="small text-muted" style="font-size:0.75rem; opacity:0.9; line-height:1.3; margin-top:3px;">${item.icon} ${item.label}</div>`).join('');

    return { totalStr, breakdownHtml };
  }

  function estimateDuration(tasks) {
    return estimateDurationDetailed(tasks).totalStr;
  }

  function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) { alert(msg); return; }
    const el = document.createElement('div');
    el.className = `toast align-items-center text-bg-${type === 'success' ? 'success' : 'danger'} border-0 show`;
    el.setAttribute('role', 'alert');
    el.innerHTML = `<div class="d-flex"><div class="toast-body">${msg}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3500);
  }

  // ─── Load & Refresh ──────────────────────────────────────────────────

  async function loadLessons() {
    if (!grid) return;

    // Show skeleton loading state
    grid.innerHTML = `
      <div class="lesson-library-empty">
        <div class="lesson-library-empty__icon">⏳</div>
        <p>Loading lessons…</p>
      </div>`;

    try {
      const res = await fetch(`${API_BASE}/lessons/group/${currentGroup}`);
      if (!res.ok) throw new Error('Network error');
      const json = await res.json();
      allLessons = json.data || [];
    } catch (err) {
      console.error('[LessonLibrary] Load error:', err);
      grid.innerHTML = `
        <div class="lesson-library-empty">
          <div class="lesson-library-empty__icon">⚠️</div>
          <p>Could not load lessons. Check your connection.</p>
        </div>`;
      return;
    }

    applyFiltersAndSort();
    updateStats();
  }

  function applyFiltersAndSort() {
    const query  = (searchIn?.value || '').toLowerCase().trim();

    filteredLessons = allLessons.filter(l => {
      return !query ||
        l.title.toLowerCase().includes(query) ||
        String(l.lessonNumber).includes(query);
    });

    // Sort by lesson number implicitly since they are returned ordered by 'order'
    // Search results are basically just filtered version of the already ordered array.

    currentPage = 1;
    renderCards();
    renderPagination();
  }

  function updateStats() {
    const total     = allLessons.length;
    const avgTasks  = total > 0
      ? Math.round(allLessons.reduce((s, l) => s + l.taskCount, 0) / total * 10) / 10
      : 0;

    let totalDurationMins = 0;
    allLessons.forEach(l => {
      if (Array.isArray(l.tasks) && l.tasks.length > 0) {
        l.tasks.forEach(t => {
          const type = (t.type || '').toUpperCase();
          if (type === 'GRAMMAR' || type === 'TEST') totalDurationMins += (t.grammarTest?.timeLimit || 45);
          else if (type === 'VIDEO') totalDurationMins += (t.videoTask?.duration || 5);
          else if (type === 'VOCABULARY' || type === 'FLASHCARD') totalDurationMins += 8;
          else if (type === 'SPEAKING') totalDurationMins += (Math.ceil((t.speakingTask?.durationLimit || 300) / 60) || 5);
          else totalDurationMins += 5;
        });
      } else {
        totalDurationMins += (l.taskCount * 5);
      }
    });

    const avgDurationMins = total > 0 ? Math.round(totalDurationMins / total) : 0;

    if (elTotal)       elTotal.textContent       = total;
    if (elAvgTasks)    elAvgTasks.textContent    = avgTasks;
    if (elAvgDuration) elAvgDuration.textContent = total > 0 ? `~${avgDurationMins} min` : '—';
  }

  // ─── Render Lesson Cards ─────────────────────────────────────────────

  function renderCards() {
    if (!grid) return;
    grid.innerHTML = '';

    if (!filteredLessons.length) {
      grid.innerHTML = `
        <div class="lesson-library-empty">
          <div class="lesson-library-empty__icon">📭</div>
          <p style="font-size:1.05rem; font-weight:500;">No lessons found</p>
          <p style="font-size:0.85rem;">Try adjusting your search or filters.</p>
        </div>`;
      return;
    }

    const start = (currentPage - 1) * PAGE_SIZE;
    const page  = filteredLessons.slice(start, start + PAGE_SIZE);

    const fragment = document.createDocumentFragment();
    page.forEach(lesson => {
      fragment.appendChild(buildCard(lesson));
    });
    grid.appendChild(fragment);
  }

  function buildCard(lesson) {
    const isPublished = lesson.status === 'PUBLISHED';
    const stats = lesson.stats || {};
    const avgPct = stats.avgScore || 0;
    const hasStudents = stats.completedCount > 0;

    const card = document.createElement('div');
    card.className = 'lesson-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Open lesson ${lesson.lessonNumber}: ${lesson.title}`);
    card.dataset.lessonId = lesson.id;

    card.innerHTML = `
      <div class="lesson-card__top">
        <span class="lesson-card__number">Lesson ${lesson.lessonNumber}</span>
      </div>

      <h3 class="lesson-card__title">${escHtml(lesson.title)}</h3>

      <div class="lesson-card__meta">
        <span class="lesson-card__meta-item">📋 ${lesson.taskCount} task${lesson.taskCount !== 1 ? 's' : ''}</span>
        <span class="lesson-card__meta-item">⏱ ${estimateDuration(lesson.tasks)}</span>
      </div>

      <div class="lesson-card__divider"></div>

      <div class="lesson-card__stats">
        <div class="lesson-card__stats-row">
          <span>👥 ${hasStudents ? stats.completedCount + ' student' + (stats.completedCount !== 1 ? 's' : '') + ' completed' : 'No completions yet'}</span>
          ${hasStudents ? `<div class="lesson-card__stats-scores">
            <span class="score-avg">Avg: ${avgPct}%</span>
          </div>` : ''}
        </div>
        ${hasStudents ? `
        <div class="lesson-card__stats-scores" style="justify-content:flex-end; gap:14px;">
          <span class="score-high">▲ ${stats.maxScore}%</span>
          <span class="score-low">▼ ${stats.minScore}%</span>
        </div>
        <div class="lesson-card__progress">
          <div class="lesson-card__progress-fill" style="width:${Math.min(avgPct, 100)}%"></div>
        </div>` : ''}
      </div>
    `;

    card.addEventListener('click', () => openPreviewModal(lesson.id));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPreviewModal(lesson.id); }
    });

    return card;
  }

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ─── Pagination ──────────────────────────────────────────────────────

  function renderPagination() {
    if (!pagination) return;
    pagination.innerHTML = '';

    const totalPages = Math.ceil(filteredLessons.length / PAGE_SIZE);
    if (totalPages <= 1) return;

    const prev = makePagBtn('‹ Prev', currentPage === 1);
    prev.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderCards(); renderPagination(); } });
    pagination.appendChild(prev);

    for (let i = 1; i <= totalPages; i++) {
      const btn = makePagBtn(String(i), false);
      if (i === currentPage) btn.classList.add('is-active');
      btn.addEventListener('click', () => { currentPage = i; renderCards(); renderPagination(); });
      pagination.appendChild(btn);
    }

    const next = makePagBtn('Next ›', currentPage === totalPages);
    next.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; renderCards(); renderPagination(); } });
    pagination.appendChild(next);
  }

  function makePagBtn(label, disabled) {
    const btn = document.createElement('button');
    btn.className = 'lesson-pagination__btn';
    btn.textContent = label;
    btn.disabled = disabled;
    return btn;
  }

  // ─── Preview Modal ───────────────────────────────────────────────────

  async function openPreviewModal(lessonId) {
    if (!previewModalBS) return;
    activeLessonId = lessonId;

    // Show modal with loading state
    document.getElementById('previewModalTitle').textContent = 'Loading…';
    document.getElementById('previewModalDescription').textContent = '';
    document.getElementById('previewModalTaskFlow').innerHTML = '<p style="color:var(--muted);">Loading…</p>';
    previewModalBS.show();

    try {
      const res = await fetch(`${API_BASE}/lessons/${lessonId}`);
      if (!res.ok) throw new Error('Not found');
      const json = await res.json();
      populatePreviewModal(json.data);
    } catch (err) {
      console.error('[LessonLibrary] Preview error:', err);
      document.getElementById('previewModalTitle').textContent = 'Error loading lesson';
    }
  }

  function populatePreviewModal(lesson) {
    const isPublished = lesson.status === 'PUBLISHED';

    // Find lesson number from allLessons
    const found = allLessons.find(l => l.id === lesson.id);
    const num = found ? found.lessonNumber : '?';

    document.getElementById('previewLessonNumber').textContent = `Lesson ${num}`;
    document.getElementById('previewModalTitle').textContent = lesson.title;
    document.getElementById('previewModalDescription').textContent = lesson.description || 'No description provided.';

    const statusEl = document.getElementById('previewModalStatus');
    statusEl.textContent = isPublished ? '● Published' : '◌ Draft';
    statusEl.className = `lesson-card__status ${isPublished ? 'is-published' : 'is-draft'}`;

    document.getElementById('previewModalGroup').textContent = lesson.groupLevel;
    document.getElementById('previewModalTaskCount').textContent = lesson.taskCount + ' task' + (lesson.taskCount !== 1 ? 's' : '');
    document.getElementById('previewModalCreated').textContent = formatDate(lesson.createdAt);

    const detailedDur = estimateDurationDetailed(lesson.tasks);
    const durationEl = document.getElementById('previewModalDuration');
    if (durationEl) {
      durationEl.innerHTML = `
        <div class="fw-bold" style="font-size:1.1rem; color:var(--title, #fff);">${detailedDur.totalStr}</div>
        <div class="mt-2 pt-2 border-top border-secondary text-start">${detailedDur.breakdownHtml}</div>
      `;
    }

    // Student stats
    const stats = lesson.stats || {};
    document.getElementById('previewStatCompleted').textContent = stats.completedCount || 0;
    document.getElementById('previewStatAvg').textContent  = (stats.avgScore || 0) + '%';
    document.getElementById('previewStatHigh').textContent = (stats.maxScore || 0) + '%';
    document.getElementById('previewStatLow').textContent  = (stats.minScore || 0) + '%';

    // Task flow
    const flowContainer = document.getElementById('previewModalTaskFlow');
    flowContainer.innerHTML = '';

    if (!lesson.tasks || lesson.tasks.length === 0) {
      flowContainer.innerHTML = '<p style="color:var(--muted);">No tasks in this lesson.</p>';
      return;
    }

    lesson.tasks.forEach((task, index) => {
      const meta = TASK_META[task.type] || { icon: '📋', label: task.type, summary: () => '' };

      if (index > 0) {
        const arrow = document.createElement('div');
        arrow.className = 'lesson-preview-flow-arrow';
        arrow.textContent = '↓';
        flowContainer.appendChild(arrow);
      }

      const item = document.createElement('div');
      item.className = 'lesson-preview-flow-item';
      item.innerHTML = `
        <div class="lesson-preview-flow-num">${index + 1}</div>
        <div style="flex:1;">
          <div class="lesson-preview-flow-type">${meta.icon} ${meta.label}</div>
          <div class="lesson-preview-flow-summary">${escHtml(meta.summary(task))}</div>
        </div>
      `;
      flowContainer.appendChild(item);
    });
  }

  // ─── Edit Lesson (Wizard) ────────────────────────────────────────────

  async function openEditWizard(lessonId) {
    if (!previewModalBS) return;

    // Hide the preview modal first
    previewModalBS.hide();

    try {
      const res = await fetch(`${API_BASE}/lessons/${lessonId}`);
      if (!res.ok) throw new Error('Not found');
      const json = await res.json();

      if (window.LessonWizard && typeof window.LessonWizard.openForEdit === 'function') {
        window.LessonWizard.openForEdit(json.data);
      } else {
        // Fallback: just open the wizard fresh
        const wizardModal = document.getElementById('lessonWizardModal');
        if (wizardModal) {
          bootstrap.Modal.getOrCreateInstance(wizardModal).show();
        }
      }
    } catch (err) {
      console.error('[LessonLibrary] Edit load error:', err);
      showToast('Could not load lesson for editing.', 'danger');
    }
  }

  // ─── Event Listeners ──────────────────────────────────────────────────

  document.addEventListener('DOMContentLoaded', () => {
    // URL params
    const params = new URLSearchParams(window.location.search);
    const urlGroup = params.get('level');
    if (urlGroup) {
      currentGroup = urlGroup.toUpperCase();
      if (groupChip) groupChip.textContent = currentGroup;
    }

    loadTaskTypes().then(() => {
      loadLessons();
    });

    // Toolbar
    searchIn?.addEventListener('input', applyFiltersAndSort);

    // Grid clicks (delegated)
    grid?.addEventListener('click', (e) => {
      const card = e.target.closest('.lesson-card');
      if (card) {
        const id = card.dataset.lessonId;
        openPreviewModal(id);
      }
    });

    // Modals
    document.getElementById('previewEditLessonBtn')?.addEventListener('click', () => {
      if (!activeLessonId) return;
      if (window.openEditWizard) {
        window.openEditWizard(activeLessonId);
      } else {
        openEditWizard(activeLessonId);
      }
    });

    document.getElementById('previewDeleteLessonBtn')?.addEventListener('click', () => {
      if (!activeLessonId) return;
      if (previewModalBS) previewModalBS.hide();
      if (deleteModalBS) deleteModalBS.show();
    });

    document.getElementById('confirmDeleteLessonBtn')?.addEventListener('click', async (e) => {
      if (!activeLessonId) return;
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = 'Deleting...';
      try {
        const res = await fetch(`${API_BASE}/lessons/${activeLessonId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        if (deleteModalBS) deleteModalBS.hide();
        showToast('Lesson deleted.');
        loadLessons();
      } catch (err) {
        alert(err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Delete';
      }
    });

    // Reorder Modal Logic
    const reorderModalEl = document.getElementById('reorderLessonsModal');
    const reorderModalBS = reorderModalEl ? new bootstrap.Modal(reorderModalEl) : null;
    const reorderList = document.getElementById('reorderLessonsList');
    const reorderPagination = document.getElementById('reorderPagination');
    const reorderPageInfo = document.getElementById('reorderPageInfo');
    const btnReorderPrev = document.getElementById('btnReorderPrev');
    const btnReorderNext = document.getElementById('btnReorderNext');
    
    let reorderWorkingList = [];
    let reorderCurrentPage = 1;
    const REORDER_PAGE_SIZE = 7;
    
    document.getElementById('btnOpenReorderModal')?.addEventListener('click', () => {
        if (!reorderModalBS) return;
        reorderWorkingList = [...allLessons];
        reorderCurrentPage = 1;
        renderReorderPage();
        reorderModalBS.show();
    });

    btnReorderPrev?.addEventListener('click', () => {
        if (reorderCurrentPage > 1) {
            reorderCurrentPage--;
            renderReorderPage();
        }
    });

    btnReorderNext?.addEventListener('click', () => {
        const maxPage = Math.ceil(reorderWorkingList.length / REORDER_PAGE_SIZE);
        if (reorderCurrentPage < maxPage) {
            reorderCurrentPage++;
            renderReorderPage();
        }
    });

    function renderReorderPage() {
        if (!reorderList) return;
        reorderList.innerHTML = '';
        
        const totalItems = reorderWorkingList.length;
        const maxPage = Math.ceil(totalItems / REORDER_PAGE_SIZE) || 1;
        if (reorderCurrentPage > maxPage) reorderCurrentPage = maxPage;
        
        const startIndex = (reorderCurrentPage - 1) * REORDER_PAGE_SIZE;
        const pageItems = reorderWorkingList.slice(startIndex, startIndex + REORDER_PAGE_SIZE);
        
        pageItems.forEach((lesson, localIndex) => {
            const globalIndex = startIndex + localIndex;
            const item = document.createElement('div');
            item.className = 'selected-task-item d-flex align-items-center justify-content-between p-3 border border-secondary rounded mb-2';
            item.style.backgroundColor = 'var(--surface-color)';
            item.dataset.globalIndex = globalIndex;
            
            item.innerHTML = `
                <div class="selected-task-info d-flex align-items-center gap-3">
                    <span class="badge bg-primary px-3 py-2 fs-6 rounded-pill">Lesson ${globalIndex + 1}</span>
                    <span class="fs-6 fw-medium" style="color: var(--title);">${escHtml(lesson.title)}</span>
                </div>
                <div class="selected-task-actions">
                    <button type="button" class="btn btn-sm btn-outline-secondary reorder-up" ${globalIndex === 0 ? 'disabled' : ''}>↑</button>
                    <button type="button" class="btn btn-sm btn-outline-secondary reorder-down" ${globalIndex === totalItems - 1 ? 'disabled' : ''}>↓</button>
                </div>
            `;
            reorderList.appendChild(item);
        });

        if (totalItems > REORDER_PAGE_SIZE) {
            if (reorderPagination) {
                reorderPagination.style.setProperty('display', 'flex', 'important');
                if (reorderPageInfo) reorderPageInfo.textContent = `Page ${reorderCurrentPage} of ${maxPage}`;
                if (btnReorderPrev) btnReorderPrev.disabled = reorderCurrentPage === 1;
                if (btnReorderNext) btnReorderNext.disabled = reorderCurrentPage === maxPage;
            }
        } else {
            if (reorderPagination) {
                reorderPagination.style.setProperty('display', 'none', 'important');
            }
        }

        // Add event listeners to buttons
        reorderList.querySelectorAll('.reorder-up').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gIndex = parseInt(e.target.closest('.selected-task-item').dataset.globalIndex, 10);
                if (gIndex > 0) {
                    const temp = reorderWorkingList[gIndex - 1];
                    reorderWorkingList[gIndex - 1] = reorderWorkingList[gIndex];
                    reorderWorkingList[gIndex] = temp;
                    
                    if (gIndex % REORDER_PAGE_SIZE === 0) {
                        reorderCurrentPage--;
                    }
                    renderReorderPage();
                }
            });
        });

        reorderList.querySelectorAll('.reorder-down').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gIndex = parseInt(e.target.closest('.selected-task-item').dataset.globalIndex, 10);
                if (gIndex < totalItems - 1) {
                    const temp = reorderWorkingList[gIndex + 1];
                    reorderWorkingList[gIndex + 1] = reorderWorkingList[gIndex];
                    reorderWorkingList[gIndex] = temp;
                    
                    if ((gIndex + 1) % REORDER_PAGE_SIZE === 0) {
                        reorderCurrentPage++;
                    }
                    renderReorderPage();
                }
            });
        });
    }

    document.getElementById('btnSaveLessonSequence')?.addEventListener('click', async (e) => {
        if (!reorderList) return;
        const btn = e.currentTarget;
        const orderedIds = reorderWorkingList.map(lesson => lesson.id);
        
        btn.disabled = true;
        btn.textContent = 'Saving...';
        
        try {
            const res = await fetch(`${API_BASE}/lessons/reorder`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderedIds })
            });
            if (!res.ok) throw new Error('Failed to save sequence');
            
            showToast('Lesson sequence updated successfully!');
            reorderModalBS.hide();
            loadLessons(); // Reload from DB to get new order
        } catch (err) {
            alert(err.message);
        } finally {
            btn.disabled = false;
            btn.textContent = 'Save Sequence';
        }
    });

  });

  // ─── Delete Lesson ───────────────────────────────────────────────────

  function requestDeleteLesson(lessonId) {
    activeLessonId = lessonId;

    // Hide preview modal first
    if (previewModalBS) {
      previewModalBS.hide();
      previewModal.addEventListener('hidden.bs.modal', function onHidden() {
        previewModal.removeEventListener('hidden.bs.modal', onHidden);
        if (deleteModalBS) deleteModalBS.show();
      }, { once: true });
    } else if (deleteModalBS) {
      deleteModalBS.show();
    }
  }

  async function confirmDeleteLesson() {
    if (!activeLessonId) return;

    const btn = document.getElementById('confirmDeleteLessonBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Deleting…';
    }

    try {
      const res = await fetch(`${API_BASE}/lessons/${activeLessonId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');

      if (deleteModalBS) deleteModalBS.hide();
      showToast('Lesson deleted successfully.');
      activeLessonId = null;
      await loadLessons();
    } catch (err) {
      console.error('[LessonLibrary] Delete error:', err);
      showToast('Failed to delete lesson.', 'danger');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Delete';
      }
    }
  }

  // ─── Init ────────────────────────────────────────────────────────────

  async function init() {
    // Wait for dynamic task types to load
    await loadTaskTypes();

    // Determine group from URL or TaskManagerPage
    const params = new URLSearchParams(window.location.search);
    const urlLevel = params.get('level');
    if (window.TaskManagerPage && window.TaskManagerPage.resolveGroup) {
      currentGroup = window.TaskManagerPage.resolveGroup(urlLevel) || 'A1';
    } else {
      currentGroup = (urlLevel || 'A1').toUpperCase();
    }

    if (groupChip) groupChip.textContent = currentGroup;

    // Wire toolbar controls
    searchIn?.addEventListener('input', debounce(applyFiltersAndSort, 280));
    filterSel?.addEventListener('change', applyFiltersAndSort);
    sortSel?.addEventListener('change', applyFiltersAndSort);

    // Wire preview modal action buttons
    document.getElementById('previewEditLessonBtn')?.addEventListener('click', () => {
      if (activeLessonId) openEditWizard(activeLessonId);
    });
    document.getElementById('previewDeleteLessonBtn')?.addEventListener('click', () => {
      if (activeLessonId) requestDeleteLesson(activeLessonId);
    });
    document.getElementById('confirmDeleteLessonBtn')?.addEventListener('click', confirmDeleteLesson);

    // After wizard saves, refresh the library
    const wizardModal = document.getElementById('lessonWizardModal');
    if (wizardModal) {
      wizardModal.addEventListener('hidden.bs.modal', () => {
        // Reload lessons whenever wizard closes (in case a new lesson was saved)
        loadLessons();
      });
    }

    // Initial load
    loadLessons();
  }


  function debounce(fn, delay) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // ─── Public API ──────────────────────────────────────────────────────

  window.LessonLibrary = {
    refresh: loadLessons,
    openPreview: openPreviewModal
  };

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
