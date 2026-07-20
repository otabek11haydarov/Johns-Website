const lessonPageParams = new URLSearchParams(window.location.search);
const lessonPageGroup = window.TaskManagerPage.resolveGroup(lessonPageParams.get("level"));

(function () {
  const CATEGORY_ORDER = window.TaskManagerPage.CATEGORY_ORDER;
  const GROUP_PROFILES = window.TaskManagerPage.GROUP_PROFILES;
  const TASK_TEMPLATES = window.TaskManagerPage.createSeedTasks(lessonPageGroup);
  const STORAGE_KEY = `johns-lessons:${lessonPageGroup}`;

  const elements = {
    title: document.getElementById("taskPageTitle"),
    groupBadge: document.getElementById("groupBadge"),
    activeCategoryLabel: document.getElementById("activeCategoryLabel"),
    addLessonButton: document.getElementById("add-task-btn"),
    heroChip: document.getElementById("heroChip"),
    heroTitle: document.getElementById("heroTitle"),
    heroDescription: document.getElementById("heroDescription"),
    metricTotal: document.getElementById("metricTotal"),
    metricActive: document.getElementById("metricActive"),
    metricDraft: document.getElementById("metricDraft"),
    resultsSummary: document.getElementById("resultsSummary"),
    categoryTabs: document.getElementById("categoryTabs"),
    lessonGrid: document.getElementById("taskGrid"),
    lessonEmpty: document.getElementById("taskEmpty"),
    lessonCardTemplate: document.getElementById("taskCardTemplate"),
    lessonModal: document.getElementById("task-modal"),
    lessonModalTitle: document.getElementById("taskModalTitle"),
    lessonForm: document.getElementById("taskForm"),
    lessonTitleInput: document.getElementById("taskTitleInput"),
    lessonDescriptionInput: document.getElementById("taskDescriptionInput"),
    quickFilterSelect: document.getElementById("taskCategorySelect"),
    selectedSummary: document.getElementById("lessonSelectedSummary"),
    lessonSubmitButton: document.getElementById("taskSubmitButton"),
    lessonTaskOptions: document.getElementById("lessonTaskOptions"),
    deleteLessonModal: document.getElementById("delete-task-modal"),
    confirmDeleteLessonButton: document.getElementById("confirmDeleteTaskBtn"),
  };

  let lessons = loadLessons();
  let currentCategory = "video";
  let pickerCategory = currentCategory;
  let selectedTaskIds = new Set();
  let editingLessonId = null;
  let pendingDeleteLessonId = null;

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function createStarterLessons() {
    return [
      {
        id: `${lessonPageGroup.toLowerCase()}-lesson-${Date.now()}`,
        group: lessonPageGroup,
        title: `${lessonPageGroup} Starter Lesson`,
        description: "A first lesson built from selected video and vocabulary practice tasks.",
        status: "Active",
        taskIds: TASK_TEMPLATES.filter((task) => ["Video", "Vocabulary"].includes(task.type))
          .slice(0, 2)
          .map((task) => task.id),
      },
    ];
  }

  function loadLessons() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(saved) ? saved : createStarterLessons();
    } catch (error) {
      return createStarterLessons();
    }
  }

  function saveLessons() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
  }

  function getTaskById(taskId) {
    return TASK_TEMPLATES.find((task) => task.id === taskId);
  }

  function getLessonTasks(lesson) {
    return (lesson.taskIds || []).map(getTaskById).filter(Boolean);
  }

  function lessonHasCategory(lesson, category) {
    return getLessonTasks(lesson).some((task) => task.type.toLowerCase() === category);
  }

  function getLessonsByCategory(category) {
    return lessons.filter((lesson) => lessonHasCategory(lesson, category));
  }

  function countByStatus(status) {
    return lessons.filter((lesson) => lesson.status === status).length;
  }

  function setStatusClass(node, status) {
    node.classList.remove("is-active", "is-draft");
    node.classList.add(status === "Active" ? "is-active" : "is-draft");
  }

  function renderTaskPicker(nextSelectedTaskIds = null, nextPickerCategory = pickerCategory) {
    if (Array.isArray(nextSelectedTaskIds)) {
      selectedTaskIds = new Set(nextSelectedTaskIds);
    }

    pickerCategory = nextPickerCategory || currentCategory;

    const activeCategoryName = capitalize(pickerCategory);
    const activeTasks = TASK_TEMPLATES.filter((task) => task.type === activeCategoryName);
    const tabMarkup = CATEGORY_ORDER.map((category) => {
      const selectedTask = TASK_TEMPLATES.find((task) => task.type === category && selectedTaskIds.has(task.id));
      const categoryTaskCount = TASK_TEMPLATES.filter((task) => task.type === category).length;
      const isActive = category.toLowerCase() === pickerCategory;

      return `
        <button
          class="lesson-picker-tab ${isActive ? "is-active" : ""} ${selectedTask ? "has-selected" : ""}"
          type="button"
          data-picker-category="${category.toLowerCase()}"
          aria-pressed="${isActive}"
        >
          <span>${category}</span>
          <strong>${categoryTaskCount}</strong>
        </button>
      `;
    }).join("");

    const taskRows = activeTasks
      .map((task) => {
        const isSelected = selectedTaskIds.has(task.id);

        return `
          <button
            class="lesson-task-option ${isSelected ? "is-selected" : ""}"
            type="button"
            data-select-task="${task.id}"
            aria-pressed="${isSelected}"
          >
            <span class="lesson-task-option__radio"></span>
            <span class="lesson-task-option__copy">
              <strong>${task.title}</strong>
              <small>${lessonPageGroup} group &middot; ${task.type}</small>
              <em>${task.description}</em>
            </span>
          </button>
        `;
      })
      .join("");

    const selectedSummary = getSelectedTasks()
      .map((task) => `<span class="lesson-selected-chip">${task.type}: ${task.title}</span>`)
      .join("");

    if (elements.selectedSummary) {
      elements.selectedSummary.innerHTML =
        selectedSummary || `<span class="lesson-selected-empty">No tasks selected yet.</span>`;
    }

    elements.lessonTaskOptions.innerHTML = `
      <div class="lesson-picker-tabs" role="tablist" aria-label="Lesson task filters">
        ${tabMarkup}
      </div>
      <div class="lesson-task-group">
        <div class="lesson-task-group__header">
          <h4>${activeCategoryName} tasks for ${lessonPageGroup}</h4>
          <button class="lesson-picker-clear" type="button" data-clear-category="${pickerCategory}">Clear ${activeCategoryName}</button>
        </div>
        <div class="lesson-task-options">
          ${taskRows || `<div class="lesson-task-empty">No ${activeCategoryName.toLowerCase()} tasks for this group.</div>`}
        </div>
      </div>
    `;
  }

  function getSelectedTaskIds() {
    return Array.from(selectedTaskIds);
  }

  function getSelectedTasks() {
    return getSelectedTaskIds().map(getTaskById).filter(Boolean);
  }

  function selectTaskForCategory(taskId) {
    const task = getTaskById(taskId);

    if (!task) {
      return;
    }

    const isAlreadySelected = selectedTaskIds.has(taskId);
    TASK_TEMPLATES.filter((item) => item.type === task.type).forEach((item) => {
      selectedTaskIds.delete(item.id);
    });

    if (!isAlreadySelected) {
      selectedTaskIds.add(taskId);
    }

    renderTaskPicker();
  }

  function clearTaskCategory(category) {
    const normalizedCategory = capitalize(category);

    TASK_TEMPLATES.filter((task) => task.type === normalizedCategory).forEach((task) => {
      selectedTaskIds.delete(task.id);
    });

    renderTaskPicker();
  }

  function updatePageCopy() {
    const profile = GROUP_PROFILES[lessonPageGroup];
    const pageTitle = `${lessonPageGroup} Lesson Planning`;

    document.title = pageTitle;
    elements.title.textContent = pageTitle;
    elements.groupBadge.textContent = lessonPageGroup;
    elements.heroChip.textContent = profile.chip;
    elements.heroTitle.textContent = `Lesson planning for ${lessonPageGroup} learners`;
    elements.heroDescription.textContent =
      "Create group-specific lessons by selecting only the tasks that belong in each lesson.";
    elements.metricTotal.textContent = lessons.length;
    elements.metricActive.textContent = countByStatus("Active");
    elements.metricDraft.textContent = countByStatus("Draft");
  }

  function updateCategoryCounts() {
    if (!elements.categoryTabs) {
      return;
    }

    CATEGORY_ORDER.forEach((category) => {
      const countNode = elements.categoryTabs.querySelector(`[data-count-for="${category}"]`);

      if (countNode) {
        countNode.textContent = getLessonsByCategory(category.toLowerCase()).length;
      }
    });
  }

  function syncActiveTab() {
    if (!elements.categoryTabs) {
      return;
    }

    elements.categoryTabs.querySelectorAll("[data-category]").forEach((button) => {
      const isActive = button.dataset.category === currentCategory;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-selected", String(isActive));
    });
  }

  function createLessonCard(lesson) {
    const fragment = elements.lessonCardTemplate.content.cloneNode(true);
    const card = fragment.querySelector(".task-card");
    const titleNode = fragment.querySelector(".task-card__title");
    const typeNode = fragment.querySelector(".task-card__type");
    const descriptionNode = fragment.querySelector(".task-card__description");
    const groupNode = fragment.querySelector(".task-card__group");
    const statusNode = fragment.querySelector(".task-card__status");
    const editButton = fragment.querySelector("[data-action='edit']");
    const deleteButton = fragment.querySelector("[data-action='delete']");
    const lessonTasks = getLessonTasks(lesson);
    const taskTypes = [...new Set(lessonTasks.map((task) => task.type))];

    card.dataset.taskId = lesson.id;
    titleNode.textContent = lesson.title;
    typeNode.textContent = `${lessonTasks.length} task${lessonTasks.length === 1 ? "" : "s"}`;
    descriptionNode.textContent = lesson.description;
    groupNode.textContent = `${lesson.group} group`;
    statusNode.textContent = lesson.status === "Active" ? "Published" : "Draft";
    setStatusClass(statusNode, lesson.status);

    const taskList = document.createElement("div");
    taskList.className = "lesson-task-tags";
    taskTypes.forEach((type) => {
      const tag = document.createElement("span");
      tag.className = "lesson-task-tag";
      tag.textContent = type;
      taskList.appendChild(tag);
    });

    descriptionNode.insertAdjacentElement("afterend", taskList);
    editButton.dataset.id = lesson.id;
    deleteButton.dataset.id = lesson.id;

    return fragment;
  }

  function renderLessons() {
    const filteredLessons = lessons;
    elements.lessonGrid.innerHTML = "";

    syncActiveTab();
    if (elements.activeCategoryLabel) {
      elements.activeCategoryLabel.textContent = capitalize(currentCategory);
    }
    elements.resultsSummary.textContent = `${filteredLessons.length} lesson${filteredLessons.length === 1 ? "" : "s"}`;
    elements.addLessonButton.innerHTML = "<span>+</span> Add Lesson";

    if (!filteredLessons.length) {
      elements.lessonEmpty.hidden = false;
      return;
    }

    elements.lessonEmpty.hidden = true;

    const fragment = document.createDocumentFragment();
    filteredLessons.forEach((lesson) => {
      fragment.appendChild(createLessonCard(lesson));
    });
    elements.lessonGrid.appendChild(fragment);
  }

  function refreshUI() {
    updatePageCopy();
    updateCategoryCounts();
    renderLessons();
  }

  function resetLessonForm() {
    editingLessonId = null;
    elements.lessonForm.reset();
    elements.quickFilterSelect.value = capitalize(currentCategory);
    renderTaskPicker([], currentCategory);
    elements.lessonModalTitle.textContent = "Create Lesson";
    elements.lessonSubmitButton.textContent = "Create Lesson";
  }

  function openLessonModal() {
    bootstrap.Modal.getOrCreateInstance(elements.lessonModal).show();
  }

  function openCreateLessonModal() {
    resetLessonForm();
    openLessonModal();
  }

  function openEditLessonModal(lessonId) {
    const lesson = lessons.find((item) => item.id === lessonId);

    if (!lesson) {
      return;
    }

    editingLessonId = lessonId;
    elements.lessonTitleInput.value = lesson.title;
    elements.lessonDescriptionInput.value = lesson.description;
    const firstTask = (lesson.taskIds || []).map(getTaskById).find(Boolean);
    pickerCategory = firstTask ? firstTask.type.toLowerCase() : currentCategory;
    elements.quickFilterSelect.value = capitalize(pickerCategory);
    renderTaskPicker(lesson.taskIds || [], pickerCategory);
    elements.lessonModalTitle.textContent = "Edit Lesson";
    elements.lessonSubmitButton.textContent = "Save Changes";
    openLessonModal();
  }

  function createLesson(payload) {
    lessons = [
      {
        id: `${lessonPageGroup.toLowerCase()}-lesson-${Date.now()}`,
        group: lessonPageGroup,
        ...payload,
      },
      ...lessons,
    ];
  }

  function updateLesson(payload) {
    lessons = lessons.map((lesson) =>
      lesson.id === editingLessonId
        ? {
            ...lesson,
            ...payload,
          }
        : lesson,
    );
  }

  function handleLessonSubmit(event) {
    event.preventDefault();

    const title = elements.lessonTitleInput.value.trim();
    const description = elements.lessonDescriptionInput.value.trim() || "No lesson description added yet.";
    const taskIds = getSelectedTaskIds();

    if (!title) {
      elements.lessonTitleInput.focus();
      return;
    }

    if (!taskIds.length) {
      elements.lessonTaskOptions.querySelector("input")?.focus();
      return;
    }

    const payload = { title, description, status: "Active", taskIds };
    const firstTask = getTaskById(taskIds[0]);

    if (firstTask) {
      currentCategory = firstTask.type.toLowerCase();
    }

    if (editingLessonId) {
      updateLesson(payload);
    } else {
      createLesson(payload);
    }

    saveLessons();
    bootstrap.Modal.getOrCreateInstance(elements.lessonModal).hide();
    refreshUI();
  }

  function handleCategoryClick(event) {
    const button = event.target.closest("[data-category]");

    if (!button) {
      return;
    }

    currentCategory = button.dataset.category;
    renderLessons();
  }

  function handleQuickFilterChange() {
    pickerCategory = elements.quickFilterSelect.value.toLowerCase();
    renderTaskPicker();
  }

  function handleTaskPickerClick(event) {
    const categoryButton = event.target.closest("[data-picker-category]");
    const taskButton = event.target.closest("[data-select-task]");
    const clearButton = event.target.closest("[data-clear-category]");

    if (categoryButton) {
      pickerCategory = categoryButton.dataset.pickerCategory;
      elements.quickFilterSelect.value = capitalize(pickerCategory);
      renderTaskPicker();
      return;
    }

    if (taskButton) {
      selectTaskForCategory(taskButton.dataset.selectTask);
      return;
    }

    if (clearButton) {
      clearTaskCategory(clearButton.dataset.clearCategory);
    }
  }

  function openDeleteLessonModal(lessonId) {
    pendingDeleteLessonId = lessonId;
    bootstrap.Modal.getOrCreateInstance(elements.deleteLessonModal).show();
  }

  function deleteLesson() {
    if (!pendingDeleteLessonId) {
      return;
    }

    lessons = lessons.filter((lesson) => lesson.id !== pendingDeleteLessonId);
    pendingDeleteLessonId = null;
    saveLessons();
    bootstrap.Modal.getOrCreateInstance(elements.deleteLessonModal).hide();
    refreshUI();
  }

  function handleDocumentClick(event) {
    const editButton = event.target.closest("[data-action='edit']");
    const deleteButton = event.target.closest("[data-action='delete']");

    if (editButton) {
      openEditLessonModal(editButton.dataset.id);
      return;
    }

    if (deleteButton) {
      openDeleteLessonModal(deleteButton.dataset.id);
    }
  }

  function init() {
    refreshUI();
    renderTaskPicker();
    elements.categoryTabs?.addEventListener("click", handleCategoryClick);
    elements.addLessonButton.addEventListener("click", openCreateLessonModal);
    elements.quickFilterSelect.addEventListener("change", handleQuickFilterChange);
    elements.lessonTaskOptions.addEventListener("click", handleTaskPickerClick);
    elements.lessonForm.addEventListener("submit", handleLessonSubmit);
    elements.confirmDeleteLessonButton.addEventListener("click", deleteLesson);
    elements.lessonModal.addEventListener("hidden.bs.modal", resetLessonForm);
    elements.deleteLessonModal.addEventListener("hidden.bs.modal", () => {
      pendingDeleteLessonId = null;
    });
    document.addEventListener("click", handleDocumentClick);
  }

  init();
})();
