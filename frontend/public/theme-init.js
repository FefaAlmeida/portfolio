try {
  const savedTheme = localStorage.getItem("portfolio-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (savedTheme === "dark" || (savedTheme === null && prefersDark)) {
    document.documentElement.classList.add("dark");
  }
} catch {
  // The portfolio remains in its default light theme if storage is unavailable.
}
