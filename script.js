// Auto-update footer year
document.getElementById("year").textContent = new Date().getFullYear();
// Default animation states
document.getElementById("form-success").classList.add("is-hidden");
document.getElementById("contact-form").classList.add("is-visible");

// Show success message if redirected back from Netlify Forms
// Show success message if redirected back from Netlify Forms
const params = new URLSearchParams(window.location.search);
if (params.get("success") === "true") {
  const successEl = document.getElementById("form-success");
  const formEl = document.getElementById("contact-form");

  // Show success, hide form (animated)
  successEl.classList.remove("is-hidden");
  successEl.classList.add("is-visible");

  formEl.classList.remove("is-visible");
  formEl.classList.add("is-hidden");

  // Remove the query param but keep hash
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname + window.location.hash
  );

  // After 6 seconds, bring the form back (animated)
  setTimeout(() => {
    successEl.classList.remove("is-visible");
    successEl.classList.add("is-hidden");

    formEl.classList.remove("is-hidden");
    formEl.classList.add("is-visible");
  }, 6000);
}
