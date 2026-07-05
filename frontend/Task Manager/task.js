const taskPageParams = new URLSearchParams(window.location.search);
const taskPageGroup = window.TaskManagerPage.resolveGroup(taskPageParams.get("level"));

window.TaskManagerPage.createPage({
  currentGroup: taskPageGroup,
  pageTitleSuffix: "Task Manager",
});
