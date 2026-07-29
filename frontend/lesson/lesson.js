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
    deleteLessonModal: document.getElementById("delete-task-modal"),
    confirmDeleteLessonButton: document.getElementById("confirmDeleteTaskBtn"),
  };

  let lessons = loadLessons();
  let currentCategory = "video";
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

  function openCreateLessonModal() {
    window.location.href = `lesson-wizard.html?level=${lessonPageGroup}`;
  }

  function openEditLessonModal(lessonId) {
    window.location.href = `lesson-wizard.html?level=${lessonPageGroup}&editId=${lessonId}`;
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
    elements.categoryTabs?.addEventListener("click", handleCategoryClick);
    elements.addLessonButton.addEventListener("click", openCreateLessonModal);
    elements.confirmDeleteLessonButton.addEventListener("click", deleteLesson);
    elements.deleteLessonModal.addEventListener("hidden.bs.modal", () => {
      pendingDeleteLessonId = null;
    });
    document.addEventListener("click", handleDocumentClick);
  }

  init();
})();
