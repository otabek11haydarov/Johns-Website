const audioButton = document.getElementById("audioButton");

audioButton?.addEventListener("click", () => {
  audioButton.textContent = audioButton.textContent.trim() === "Audio" ? "Audio selected" : "Audio";
});
