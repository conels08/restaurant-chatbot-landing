// Auto-update footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Show success message if redirected back from Netlify Forms
const params = new URLSearchParams(window.location.search);
if (params.get("success") === "true") {
  document.getElementById("form-success").style.display = "block";

  // Optional: remove the query param so it doesn't persist on refresh
  window.history.replaceState({}, document.title, window.location.pathname);
}
