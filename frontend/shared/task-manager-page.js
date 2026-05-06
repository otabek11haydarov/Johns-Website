(function () {
  const CATEGORY_ORDER = ["Video", "Writing", "Listening", "Reading", "Speaking", "Vocabulary"];

  const GROUP_PROFILES = {
    A1: {
      chip: "A1 Foundations",
      title: "Task planning for A1 learners",
      description:
        "Curate beginner-friendly activities with short instructions, strong scaffolding, and high-confidence practice flows.",
    },
    A2: {
      chip: "A2 Progression",
      title: "Task planning for A2 learners",
      description:
        "Balance structure and autonomy with practical tasks that strengthen everyday language, accuracy, and consistency.",
    },
    B1: {
      chip: "B1 Independence",
      title: "Task planning for B1 learners",
      description:
        "Manage richer content tasks that build fluency, deeper comprehension, and independent language production.",
    },
    B2: {
      chip: "B2 Performance",
      title: "Task planning for B2 learners",
      description:
        "Coordinate analytical and output-focused activities that challenge learners with clearer expectations and higher complexity.",
    },
    C1: {
      chip: "C1 Advanced",
      title: "Task planning for C1 learners",
      description:
        "Organize polished, high-level tasks with nuanced input, strong critical thinking, and advanced production goals.",
    },
    C2: {
      chip: "C2 Mastery",
      title: "Task planning for C2 learners",
      description:
        "Shape mastery-level tasks that reward precision, flexibility, and highly refined comprehension across formats.",
    },
  };

  const TASK_TEMPLATES = [
    {
      id: "video-lesson-overview",
      type: "Video",
      status: "Active",
      title: "Lesson overview video",
      description:
        "A concise walkthrough that introduces the weekly topic, learning objective, and expected learner outcome for {group}.",
    },
    {
      id: "video-pronunciation-replay",
      type: "Video",
      status: "Draft",
      title: "Pronunciation replay studio",
      description:
        "A reusable video practice task focused on repetition, sound awareness, and speaking confidence for the {group} track.",
    },
    {
      id: "writing-guided-response",
      type: "Writing",
      status: "Active",
      title: "Guided writing response",
      description:
        "A scaffolded written task with prompts, structure hints, and a clear success target tailored to {group} learners.",
    },
    {
      id: "writing-reflection-board",
      type: "Writing",
      status: "Draft",
      title: "Weekly reflection board",
      description:
        "A softer writing activity that encourages learners to summarize progress and practice new language with intention.",
    },
    {
      id: "listening-dialogue-check",
      type: "Listening",
      status: "Active",
      title: "Dialogue comprehension check",
      description:
        "A focused listening task with quick prompts that verifies whether {group} learners can identify the main meaning and detail.",
    },
    {
      id: "listening-dictation-lab",
      type: "Listening",
      status: "Draft",
      title: "Dictation and note lab",
      description:
        "A draft listening workflow that supports accuracy, rhythm awareness, and follow-up review through captured notes.",
    },
    {
      id: "reading-skim-scan",
      type: "Reading",
      status: "Active",
      title: "Skim and scan practice",
      description:
        "A fast reading card designed to improve confidence with locating key information before detailed task work begins.",
    },
    {
      id: "reading-inference-pack",
      type: "Reading",
      status: "Draft",
      title: "Inference practice pack",
      description:
        "A flexible reading block that trains learners to infer tone, meaning, and purpose from short curated texts.",
    },
    {
      id: "speaking-pair-mission",
      type: "Speaking",
      status: "Active",
      title: "Pair speaking mission",
      description:
        "A turn-based speaking activity that keeps participation high while helping {group} learners stay on-topic and fluent.",
    },
    {
      id: "speaking-feedback-loop",
      type: "Speaking",
      status: "Active",
      title: "Feedback loop checkpoint",
      description:
        "A structured speaking review task where learners retry key answers after receiving lightweight coaching prompts.",
    },
    {
      id: "vocabulary-theme-sprint",
      type: "Vocabulary",
      status: "Draft",
      title: "Theme vocabulary sprint",
      description:
        "A category-based task that clusters new words into practical themes for stronger recall and cleaner weekly planning.",
    },
    {
      id: "vocabulary-retention-cycle",
      type: "Vocabulary",
      status: "Active",
      title: "Retention cycle review",
      description:
        "A spaced review task that reinforces previously taught language and supports longer-term retention for {group}.",
    },
  ];

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function resolveGroup(level) {
    const normalizedLevel = (level || "A1").toUpperCase();
    return GROUP_PROFILES[normalizedLevel] ? normalizedLevel : "A1";
  }

  function createSeedTasks(groupLevel) {
    return TASK_TEMPLATES.map((task) => ({
      ...task,
      id: `${groupLevel.toLowerCase()}-${task.id}`,
      group: groupLevel,
      title: task.title.replaceAll("{group}", groupLevel),
      description: task.description.replaceAll("{group}", groupLevel),
    }));
  }

  function createTaskManagerPage(options) {
    const currentGroup = resolveGroup(options.currentGroup);
    const pageTitleSuffix = options.pageTitleSuffix || "Task Manager";
    const pageTitle = `${currentGroup} ${pageTitleSuffix}`;

    const elements = {
      title: document.getElementById("taskPageTitle"),
      groupBadge: document.getElementById("groupBadge"),
      activeCategoryLabel: document.getElementById("activeCategoryLabel"),
      addTaskButton: document.getElementById("add-task-btn"),
      heroChip: document.getElementById("heroChip"),
      heroTitle: document.getElementById("heroTitle"),
      heroDescription: document.getElementById("heroDescription"),
      metricTotal: document.getElementById("metricTotal"),
      metricActive: document.getElementById("metricActive"),
      metricDraft: document.getElementById("metricDraft"),
      resultsSummary: document.getElementById("resultsSummary"),
      categoryTabs: document.getElementById("categoryTabs"),
      taskGrid: document.getElementById("taskGrid"),
      taskEmpty: document.getElementById("taskEmpty"),
      taskCardTemplate: document.getElementById("taskCardTemplate"),
      taskModal: document.getElementById("task-modal"),
      taskModalTitle: document.getElementById("taskModalTitle"),
      taskForm: document.getElementById("taskForm"),
      taskTitleInput: document.getElementById("taskTitleInput"),
      taskDescriptionInput: document.getElementById("taskDescriptionInput"),
      taskCategorySelect: document.getElementById("taskCategorySelect"),
      taskStatusSelect: document.getElementById("taskStatusSelect"),
      taskSubmitButton: document.getElementById("taskSubmitButton"),
      videoSourceRow: document.getElementById("videoTaskSourceRow"),
      videoSourceType: document.getElementById("video-source-type"),
      videoUpload: document.getElementById("video-upload"),
      videoLink: document.getElementById("video-link"),
      deleteTaskModal: document.getElementById("delete-task-modal"),
      confirmDeleteTaskButton: document.getElementById("confirmDeleteTaskBtn"),
    };

    let tasks = createSeedTasks(currentGroup);
    let currentCategory = "video";
    let editingTaskId = null;
    let pendingDeleteTaskId = null;

    function countByStatus(status) {
      return tasks.filter((task) => task.status === status).length;
    }

    function getTasksByCategory(category) {
      return tasks.filter((task) => task.type.toLowerCase() === category);
    }

    function updatePageCopy() {
      const profile = GROUP_PROFILES[currentGroup];

      document.title = pageTitle;
      elements.title.textContent = pageTitle;
      elements.groupBadge.textContent = currentGroup;
      elements.heroChip.textContent = profile.chip;
      elements.heroTitle.textContent = profile.title;
      elements.heroDescription.textContent = profile.description;
      elements.metricTotal.textContent = tasks.length;
      elements.metricActive.textContent = countByStatus("Active");
      elements.metricDraft.textContent = countByStatus("Draft");
    }

    function updateCategoryCounts() {
      CATEGORY_ORDER.forEach((category) => {
        const countNode = elements.categoryTabs.querySelector(`[data-count-for="${category}"]`);

        if (countNode) {
          countNode.textContent = getTasksByCategory(category.toLowerCase()).length;
        }
      });
    }

    function syncActiveTab() {
      const tabButtons = elements.categoryTabs.querySelectorAll("[data-category]");

      tabButtons.forEach((button) => {
        const isActive = button.dataset.category === currentCategory;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-selected", String(isActive));
      });
    }

    function setStatusClass(node, status) {
      node.classList.remove("is-active", "is-draft");
      node.classList.add(status.toLowerCase() === "active" ? "is-active" : "is-draft");
    }

    function createTaskCard(task) {
      const fragment = elements.taskCardTemplate.content.cloneNode(true);
      const card = fragment.querySelector(".task-card");
      const titleNode = fragment.querySelector(".task-card__title");
      const typeNode = fragment.querySelector(".task-card__type");
      const descriptionNode = fragment.querySelector(".task-card__description");
      const groupNode = fragment.querySelector(".task-card__group");
      const statusNode = fragment.querySelector(".task-card__status");
      const editButton = fragment.querySelector("[data-action='edit']");
      const deleteButton = fragment.querySelector("[data-action='delete']");

      card.dataset.taskId = task.id;
      titleNode.textContent = task.title;
      typeNode.textContent = task.type;
      descriptionNode.textContent = task.description;
      groupNode.textContent = `${task.group} group`;
      statusNode.textContent = task.status;
      setStatusClass(statusNode, task.status);

      if (editButton) {
        editButton.dataset.id = task.id;
      }

      if (deleteButton) {
        deleteButton.dataset.id = task.id;
      }

      return fragment;
    }

    function renderTasks() {
      const filteredTasks = getTasksByCategory(currentCategory);
      elements.taskGrid.innerHTML = "";

      syncActiveTab();
      elements.activeCategoryLabel.textContent = capitalize(currentCategory);
      elements.resultsSummary.textContent = `${filteredTasks.length} ${capitalize(currentCategory)} task${filteredTasks.length === 1 ? "" : "s"}`;
      elements.addTaskButton.textContent = `+ Add ${capitalize(currentCategory)} Task`;

      if (!filteredTasks.length) {
        elements.taskEmpty.hidden = false;
        return;
      }

      elements.taskEmpty.hidden = true;

      const fragment = document.createDocumentFragment();
      filteredTasks.forEach((task) => {
        fragment.appendChild(createTaskCard(task));
      });

      elements.taskGrid.appendChild(fragment);
    }

    function refreshUI() {
      updatePageCopy();
      updateCategoryCounts();
      renderTasks();
    }

    function syncVideoSourceInput() {
      if (!elements.videoSourceRow || !elements.videoSourceType || !elements.videoUpload || !elements.videoLink) {
        return;
      }

      const isVideoCategory = elements.taskCategorySelect.value === "Video";
      elements.videoSourceRow.hidden = !isVideoCategory;

      if (!isVideoCategory) {
        elements.videoUpload.style.display = "none";
        elements.videoLink.style.display = "none";
        return;
      }

      if (elements.videoSourceType.value === "upload") {
        elements.videoUpload.style.display = "block";
        elements.videoLink.style.display = "none";
        return;
      }

      elements.videoUpload.style.display = "none";
      elements.videoLink.style.display = "block";
    }

    function setModalMode() {
      const isEditing = Boolean(editingTaskId);
      elements.taskModalTitle.textContent = isEditing ? "Edit Task" : "Create Task";
      elements.taskSubmitButton.textContent = isEditing ? "Save Changes" : "Create Task";
    }

    function resetTaskForm() {
      editingTaskId = null;
      elements.taskForm.reset();
      elements.taskCategorySelect.value = capitalize(currentCategory);
      elements.taskStatusSelect.value = "Active";

      if (elements.videoSourceType) {
        elements.videoSourceType.value = "upload";
      }

      syncVideoSourceInput();
      setModalMode();
    }

    function openTaskModal() {
      syncVideoSourceInput();
      setModalMode();
      bootstrap.Modal.getOrCreateInstance(elements.taskModal).show();
    }

    function openCreateTaskModal() {
      resetTaskForm();
      openTaskModal();
    }

    function openEditTaskModal(taskId) {
      const task = tasks.find((item) => item.id === taskId);

      if (!task) {
        return;
      }

      editingTaskId = taskId;
      elements.taskTitleInput.value = task.title;
      elements.taskDescriptionInput.value = task.description;
      elements.taskCategorySelect.value = task.type;
      elements.taskStatusSelect.value = task.status;

      if (elements.videoSourceType) {
        elements.videoSourceType.value = "upload";
      }

      syncVideoSourceInput();
      openTaskModal();
    }

    function handleCategoryClick(event) {
      const button = event.target.closest("[data-category]");

      if (!button) {
        return;
      }

      currentCategory = button.dataset.category;
      renderTasks();
    }

    function openDeleteTaskModal(taskId) {
      pendingDeleteTaskId = taskId;
      bootstrap.Modal.getOrCreateInstance(elements.deleteTaskModal).show();
    }

    function createTask(payload) {
      tasks = [
        {
          id: `${currentGroup.toLowerCase()}-${Date.now()}`,
          group: currentGroup,
          ...payload,
        },
        ...tasks,
      ];
    }

    function updateTask(payload) {
      const index = tasks.findIndex((task) => task.id === editingTaskId);

      if (index === -1) {
        return;
      }

      tasks[index] = {
        ...tasks[index],
        ...payload,
      };
    }

    function deleteTask() {
      if (!pendingDeleteTaskId) {
        return;
      }

      tasks = tasks.filter((task) => task.id !== pendingDeleteTaskId);
      pendingDeleteTaskId = null;
      bootstrap.Modal.getOrCreateInstance(elements.deleteTaskModal).hide();
      refreshUI();
    }

    function handleTaskSubmit(event) {
      event.preventDefault();

      const title = elements.taskTitleInput.value.trim();
      const description = elements.taskDescriptionInput.value.trim() || "No description added yet.";
      const type = elements.taskCategorySelect.value;
      const status = elements.taskStatusSelect.value;

      if (!title) {
        elements.taskTitleInput.focus();
        return;
      }

      const payload = {
        title,
        description,
        type,
        status,
      };

      currentCategory = type.toLowerCase();

      if (editingTaskId) {
        updateTask(payload);
        editingTaskId = null;
      } else {
        createTask(payload);
      }

      bootstrap.Modal.getOrCreateInstance(elements.taskModal).hide();
      refreshUI();
    }

    function handleDocumentClick(event) {
      const editButton = event.target.closest("[data-action='edit']");
      const deleteButton = event.target.closest("[data-action='delete']");

      if (editButton) {
        openEditTaskModal(editButton.dataset.id);
        return;
      }

      if (deleteButton) {
        openDeleteTaskModal(deleteButton.dataset.id);
      }
    }

    function init() {
      refreshUI();
      elements.categoryTabs.addEventListener("click", handleCategoryClick);
      elements.addTaskButton.addEventListener("click", openCreateTaskModal);
      elements.taskCategorySelect.addEventListener("change", syncVideoSourceInput);
      elements.videoSourceType?.addEventListener("change", syncVideoSourceInput);
      elements.taskForm.addEventListener("submit", handleTaskSubmit);
      elements.confirmDeleteTaskButton.addEventListener("click", deleteTask);
      elements.taskModal.addEventListener("hidden.bs.modal", resetTaskForm);
      elements.deleteTaskModal.addEventListener("hidden.bs.modal", () => {
        pendingDeleteTaskId = null;
      });
      document.addEventListener("click", handleDocumentClick);
      syncVideoSourceInput();
    }

    init();
  }

  window.TaskManagerPage = {
    CATEGORY_ORDER,
    GROUP_PROFILES,
    TASK_TEMPLATES,
    resolveGroup,
    createSeedTasks,
    createPage: createTaskManagerPage,
  };
})();
