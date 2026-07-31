const nextButton = document.getElementById("nextButton");
const videoBox = document.querySelector(".video-box");

nextButton?.addEventListener("click", () => {
  if (!videoBox) return;
  videoBox.animate(
    [
      { transform: "scale(1)", opacity: 1 },
      { transform: "scale(0.985)", opacity: 0.82 },
      { transform: "scale(1)", opacity: 1 },
    ],
    {
      duration: 220,
      easing: "ease-in-out",
    }
  );
});
