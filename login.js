import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/*
  SETUP:
  1. Buat project di Supabase.
  2. Buka Project Settings > API.
  3. Isi URL dan publishable key di bawah.
  Jangan pernah memasukkan service_role / secret key ke file browser.
*/
const SUPABASE_URL = "PASTE_SUPABASE_PROJECT_URL";
const SUPABASE_PUBLISHABLE_KEY = "PASTE_SUPABASE_PUBLISHABLE_KEY";

const form = document.querySelector("#auth-form");
const nameField = document.querySelector("#name-field");
const nameInput = document.querySelector("#display-name");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const message = document.querySelector("#message");
const submitButton = document.querySelector("#submit-btn");
const loginTab = document.querySelector("#login-tab");
const signupTab = document.querySelector("#signup-tab");
const guestButton = document.querySelector("#guest-btn");

let mode = "login";
let supabase = null;

document.querySelector("#year").textContent = new Date().getFullYear();

function showMessage(text, isError = false) {
  message.textContent = text;
  message.classList.toggle("error", isError);
}

function setMode(nextMode) {
  mode = nextMode;
  const registering = mode === "signup";
  nameField.hidden = !registering;
  nameInput.required = registering;
  passwordInput.autocomplete = registering ? "new-password" : "current-password";
  submitButton.textContent = registering ? "Buat akun anggota" : "Masuk";
  loginTab.classList.toggle("active", !registering);
  signupTab.classList.toggle("active", registering);
  loginTab.setAttribute("aria-selected", String(!registering));
  signupTab.setAttribute("aria-selected", String(registering));
  showMessage("");
}

loginTab.addEventListener("click", () => setMode("login"));
signupTab.addEventListener("click", () => setMode("signup"));

function readyClient() {
  if (SUPABASE_URL.startsWith("PASTE_") || SUPABASE_PUBLISHABLE_KEY.startsWith("PASTE_")) {
    showMessage("Konfigurasi belum diisi. Ikuti tutorial Supabase di file README.", true);
    return false;
  }
  if (!supabase) supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  return true;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showMessage("");
  if (!readyClient()) return;

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  submitButton.disabled = true;

  try {
    if (mode === "signup") {
      const displayName = nameInput.value.trim();
      if (!displayName) throw new Error("Masukkan nama anggota.");
      if (password.length < 8) throw new Error("Password minimal 8 karakter.");

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
          emailRedirectTo: `${window.location.origin}${window.location.pathname.replace(/Login\.html$/i, "index.html")}`
        }
      });
      if (error) throw error;

      if (data.session) {
        showMessage("Pendaftaran berhasil. Mengalihkan ke halaman utama...");
        window.location.href = "index.html";
      } else {
        showMessage("Akun dibuat. Periksa email untuk verifikasi, lalu login kembali.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      showMessage("Login berhasil. Mengalihkan...");
      window.location.href = "index.html";
    }
  } catch (error) {
    showMessage(error.message || "Terjadi kesalahan. Coba lagi.", true);
  } finally {
    submitButton.disabled = false;
  }
});

guestButton.addEventListener("click", () => {
  window.location.href = "index.html?guest=1";
});

// Jika sesi masih aktif, langsung masuk ke halaman utama.
if (readyClient()) {
  supabase.auth.getSession().then(({ data }) => {
    if (data.session) window.location.replace("index.html");
  });
}
