// Auto-update footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Show success message if redirected back from Netlify Forms
// Show success message if redirected back from Netlify Forms
const params = new URLSearchParams(window.location.search);
if (params.get("success") === "true") {
  document.getElementById("form-success").style.display = "block";

  // Keep the user on the contact section (Netlify may not always keep the hash)
  document.getElementById("contact").scrollIntoView({ behavior: "smooth" });

  // Remove the query param but KEEP the hash so the page doesn't jump to the top
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname + window.location.hash
  );
}
