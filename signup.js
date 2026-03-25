const signupForm = document.getElementById("signup-form");
const signupNameInput = document.getElementById("signupName");
const signupEmailInput = document.getElementById("signupEmail");
const signupCourseInput = document.getElementById("signupCourse");
const signupPasswordInput = document.getElementById("signupPassword");
const signupStatusOutput = document.getElementById("signupStatus");
const generatePasswordButton = document.getElementById("generatePasswordButton");

const usersStorageKey = "attendancePortalUsers";
const sessionStorageKey = "attendancePortalSession";

function setSignupStatus(message, type) {
  signupStatusOutput.textContent = message;
  signupStatusOutput.classList.remove("is-error", "is-success");

  if (type) {
    signupStatusOutput.classList.add(type);
  }
}

function getStoredUsers() {
  try {
    const rawUsers = localStorage.getItem(usersStorageKey);
    return rawUsers ? JSON.parse(rawUsers) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users) {
  localStorage.setItem(usersStorageKey, JSON.stringify(users));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function generateStrongPassword(length = 12) {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
  const all = upper + lower + numbers + symbols;

  const required = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)]
  ];

  while (required.length < length) {
    required.push(all[Math.floor(Math.random() * all.length)]);
  }

  for (let index = required.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [required[index], required[randomIndex]] = [required[randomIndex], required[index]];
  }

  return required.join("");
}

function handleSignupSubmit(event) {
  event.preventDefault();

  const name = signupNameInput.value.trim();
  const email = signupEmailInput.value.trim().toLowerCase();
  const course = signupCourseInput.value.trim();
  const password = signupPasswordInput.value.trim();

  setSignupStatus("", "");

  if (!name || !email || !course || !password) {
    setSignupStatus("Please complete every field before creating the account.", "is-error");
    return;
  }

  if (!isValidEmail(email)) {
    setSignupStatus("Please enter a valid email address.", "is-error");
    return;
  }

  if (!isStrongPassword(password)) {
    setSignupStatus("Password must be at least 8 characters and include uppercase, lowercase, number, and special character.", "is-error");
    return;
  }

  const users = getStoredUsers();
  const alreadyExists = users.some((user) => user.email === email);

  if (alreadyExists) {
    setSignupStatus("An account with this email already exists. Please log in instead.", "is-error");
    return;
  }

  users.push({
    name,
    email,
    course,
    password
  });
  saveStoredUsers(users);
  localStorage.setItem(sessionStorageKey, JSON.stringify({ name, email, course }));

  setSignupStatus("Account created successfully. Redirecting you to the dashboard...", "is-success");
  window.setTimeout(() => {
    window.location.href = "index.html";
  }, 900);
}

signupForm.addEventListener("submit", handleSignupSubmit);
generatePasswordButton.addEventListener("click", () => {
  const generatedPassword = generateStrongPassword();
  signupPasswordInput.value = generatedPassword;
  setSignupStatus("A strong password has been generated. You can use it as-is or edit it while keeping the rules.", "is-success");
});
