const groupPageParams = new URLSearchParams(window.location.search);
const groupPageLevel = window.TaskManagerPage.resolveGroup(groupPageParams.get("level"));

window.TaskManagerPage.createPage({
  currentGroup: groupPageLevel,
  pageTitleSuffix: "Task Planning",
});
