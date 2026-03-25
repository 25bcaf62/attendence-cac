const authGate = document.getElementById("authGate");
const appShell = document.getElementById("appShell");
const loginForm = document.getElementById("login-form");
const loginEmailInput = document.getElementById("loginEmail");
const loginPasswordInput = document.getElementById("loginPassword");
const loginStatusOutput = document.getElementById("loginStatus");
const loggedInNameOutput = document.getElementById("loggedInName");
const logoutButton = document.getElementById("logoutButton");

const form = document.getElementById("attendance-form");
const totalClassesInput = document.getElementById("totalClasses");
const attendedClassesInput = document.getElementById("attendedClasses");
const targetPercentageInput = document.getElementById("targetPercentage");
const resetButton = document.getElementById("resetButton");

const currentAttendanceOutput = document.getElementById("currentAttendance");
const attendanceStatusOutput = document.getElementById("attendanceStatus");
const canMissOutput = document.getElementById("canMiss");
const needToAttendOutput = document.getElementById("needToAttend");
const errorMessageOutput = document.getElementById("errorMessage");
const progressFill = document.getElementById("progressFill");
const revealCards = document.querySelectorAll(".reveal-card");
const feedbackForm = document.getElementById("feedback-form");
const feedbackNameInput = document.getElementById("feedbackName");
const feedbackEmailInput = document.getElementById("feedbackEmail");
const feedbackMessageInput = document.getElementById("feedbackMessage");
const feedbackStatusOutput = document.getElementById("feedbackStatus");
const feedbackStorageKey = "attendanceFeedbackEntries";
const leaveForm = document.getElementById("leave-form");
const leaveStartDateInput = document.getElementById("leaveStartDate");
const leaveDaysInput = document.getElementById("leaveDays");
const leaveClassDaysOutput = document.getElementById("leaveClassDays");
const projectedAttendanceOutput = document.getElementById("projectedAttendance");
const attendanceDropOutput = document.getElementById("attendanceDrop");
const maintainSeventyFiveOutput = document.getElementById("maintainSeventyFive");
const leaveStatusOutput = document.getElementById("leaveStatus");
const heavyClassWeekday = 2;
const usersStorageKey = "attendancePortalUsers";
const sessionStorageKey = "attendancePortalSession";
const defaultUsers = [
  {
    name: "Admin",
    email: "admin@gmail.com",
    course: "Administrator",
    password: "Admin@123"
  }
];

function formatPercentage(value) {
  return `${value.toFixed(2).replace(/\.00$/, "")}%`;
}

function getStoredUsers() {
  try {
    const rawUsers = localStorage.getItem(usersStorageKey);
    const savedUsers = rawUsers ? JSON.parse(rawUsers) : [];
    const mergedUsers = [...defaultUsers];

    savedUsers.forEach((savedUser) => {
      if (!mergedUsers.some((user) => user.email === savedUser.email)) {
        mergedUsers.push(savedUser);
      }
    });

    return mergedUsers;
  } catch {
    return [...defaultUsers];
  }
}

function getStoredSession() {
  try {
    const rawSession = localStorage.getItem(sessionStorageKey);
    return rawSession ? JSON.parse(rawSession) : null;
  } catch {
    return null;
  }
}

function saveSession(session) {
  localStorage.setItem(sessionStorageKey, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(sessionStorageKey);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setLoginStatus(message, type) {
  loginStatusOutput.textContent = message;
  loginStatusOutput.classList.remove("is-error", "is-success");

  if (type) {
    loginStatusOutput.classList.add(type);
  }
}

function unlockApp(session) {
  if (loggedInNameOutput) {
    loggedInNameOutput.textContent = session.name || "Student";
  }

  if (authGate) {
    authGate.hidden = true;
  }

  if (appShell) {
    appShell.classList.remove("is-locked");
  }
}

function lockApp() {
  if (authGate) {
    authGate.hidden = false;
  }

  if (appShell) {
    appShell.classList.add("is-locked");
  }
}

function handleLoginSubmit(event) {
  event.preventDefault();

  const email = loginEmailInput.value.trim().toLowerCase();
  const password = loginPasswordInput.value.trim();
  const users = getStoredUsers();

  setLoginStatus("", "");

  if (!email || !password) {
    setLoginStatus("Please enter both your email and password.", "is-error");
    return;
  }

  if (!isValidEmail(email)) {
    setLoginStatus("Please enter a valid email address.", "is-error");
    return;
  }

  const matchedUser = users.find((user) => user.email === email && user.password === password);

  if (!matchedUser) {
    setLoginStatus("Account not found or password is incorrect. Please sign up first if needed.", "is-error");
    return;
  }

  saveSession({
    name: matchedUser.name,
    email: matchedUser.email,
    course: matchedUser.course
  });
  unlockApp(matchedUser);
  setLoginStatus("Login successful.", "is-success");
  loginForm.reset();
}

function handleLogout() {
  clearSession();
  lockApp();
  setLoginStatus("You have been logged out.", "is-success");
}

function initializeAuthGate() {
  const session = getStoredSession();
  if (session && isValidEmail(session.email || "")) {
    unlockApp(session);
  } else {
    lockApp();
  }
}

function clearError() {
  errorMessageOutput.textContent = "";
}

function showError(message) {
  errorMessageOutput.textContent = message;
}

function revealResultCards() {
  revealCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.12}s`;
    card.classList.add("is-visible");
  });
}

function updateProgressFill(currentPercentage, targetPercentage) {
  const fillPercentage = Math.min((currentPercentage / targetPercentage) * 100, 100);
  progressFill.style.width = `${Math.max(fillPercentage, 0)}%`;
}

function setFeedbackStatus(message, type) {
  feedbackStatusOutput.textContent = message;
  feedbackStatusOutput.classList.remove("is-error", "is-success");

  if (type) {
    feedbackStatusOutput.classList.add(type);
  }
}

function getStoredFeedbackEntries() {
  try {
    const rawEntries = localStorage.getItem(feedbackStorageKey);
    return rawEntries ? JSON.parse(rawEntries) : [];
  } catch {
    return [];
  }
}

function saveFeedbackEntries(entries) {
  localStorage.setItem(feedbackStorageKey, JSON.stringify(entries));
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function setLeaveStatus(message, type) {
  leaveStatusOutput.textContent = message;
  leaveStatusOutput.classList.remove("is-error", "is-success");

  if (type) {
    leaveStatusOutput.classList.add(type);
  }
}

function countMissedClasses(startDate, totalDays) {
  let missedClasses = 0;
  const currentDate = new Date(startDate);

  for (let index = 0; index < totalDays; index += 1) {
    const day = currentDate.getDay();
    if (day !== 0 && day !== 6) {
      missedClasses += day === heavyClassWeekday ? 5 : 4;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return missedClasses;
}

function handleFeedbackSubmit(event) {
  event.preventDefault();

  const name = feedbackNameInput.value.trim();
  const email = feedbackEmailInput.value.trim().toLowerCase();
  const message = feedbackMessageInput.value.trim();
  const wordCount = countWords(message);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  setFeedbackStatus("", "");

  if (!name || !email || !message) {
    setFeedbackStatus("Please complete all feedback fields before submitting.", "is-error");
    return;
  }

  if (!emailPattern.test(email)) {
    setFeedbackStatus("Please enter a valid email address.", "is-error");
    return;
  }

  if (wordCount < 20) {
    setFeedbackStatus(`Feedback must contain at least 20 words. You currently have ${wordCount}.`, "is-error");
    return;
  }

  const storedEntries = getStoredFeedbackEntries();
  const alreadySubmitted = storedEntries.some((entry) => entry.name === name.toLowerCase() && entry.email === email);

  if (alreadySubmitted) {
    setFeedbackStatus("Only one feedback entry is allowed for this name and email combination.", "is-error");
    return;
  }

  storedEntries.push({
    name: name.toLowerCase(),
    email,
    message
  });
  saveFeedbackEntries(storedEntries);

  feedbackForm.reset();
  setFeedbackStatus("Feedback submitted successfully. This name and email can only be used once on this browser.", "is-success");
}

function handleLeavePlannerSubmit(event) {
  event.preventDefault();
  setLeaveStatus("", "");

  const totalValue = totalClassesInput.value.trim();
  const attendedValue = attendedClassesInput.value.trim();
  const leaveDaysValue = leaveDaysInput.value.trim();
  const startDateValue = leaveStartDateInput.value;

  if (!totalValue || !attendedValue) {
    setLeaveStatus("Enter your current attendance details first so the leave impact can be calculated.", "is-error");
    return;
  }

  if (!startDateValue || !leaveDaysValue) {
    setLeaveStatus("Choose a leave start date and number of days.", "is-error");
    return;
  }

  const totalClasses = Number(totalValue);
  const attendedClasses = Number(attendedValue);
  const leaveDays = Number(leaveDaysValue);

  if (
    Number.isNaN(totalClasses) ||
    Number.isNaN(attendedClasses) ||
    Number.isNaN(leaveDays) ||
    totalClasses < 0 ||
    attendedClasses < 0 ||
    leaveDays <= 0
  ) {
    setLeaveStatus("Use valid non-negative attendance numbers and at least 1 leave day.", "is-error");
    return;
  }

  if (attendedClasses > totalClasses) {
    setLeaveStatus("Classes attended cannot be more than total classes held.", "is-error");
    return;
  }

  const classesMissed = countMissedClasses(startDateValue, leaveDays);
  const projectedTotalClasses = totalClasses + classesMissed;
  const currentAttendance = totalClasses === 0 ? 0 : (attendedClasses / totalClasses) * 100;
  const projectedAttendance = projectedTotalClasses === 0 ? 0 : (attendedClasses / projectedTotalClasses) * 100;
  const attendanceDrop = Math.max(currentAttendance - projectedAttendance, 0);
  const targetRatio = 0.75;

  let classesToMaintainSeventyFive = 0;
  if (projectedTotalClasses > 0 && attendedClasses / projectedTotalClasses < targetRatio) {
    classesToMaintainSeventyFive = Math.ceil((targetRatio * projectedTotalClasses - attendedClasses) / (1 - targetRatio));
  }

  leaveClassDaysOutput.textContent = String(classesMissed);
  projectedAttendanceOutput.textContent = formatPercentage(projectedAttendance);
  attendanceDropOutput.textContent = formatPercentage(attendanceDrop);
  maintainSeventyFiveOutput.textContent = String(Math.max(classesToMaintainSeventyFive, 0));

  if (classesMissed === 0) {
    setLeaveStatus("These selected days fall fully on Saturday and Sunday, so your attendance will not drop.", "is-success");
  } else {
    setLeaveStatus(`You would miss ${classesMissed} classes. Tuesday is counted as the 5-class day, the other weekdays are counted as 4 classes, and the planner also shows how many more classes must be attended to stay at 75%.`, "is-success");
  }
}

function calculateAttendance(event) {
  event.preventDefault();
  clearError();

  const totalValue = totalClassesInput.value.trim();
  const attendedValue = attendedClassesInput.value.trim();
  const targetValue = targetPercentageInput.value.trim();

  if (!totalValue || !attendedValue || !targetValue) {
    showError("Please fill in all fields before calculating.");
    return;
  }

  const totalClasses = Number(totalValue);
  const attendedClasses = Number(attendedValue);
  const targetPercentage = Number(targetValue);

  if (
    Number.isNaN(totalClasses) ||
    Number.isNaN(attendedClasses) ||
    Number.isNaN(targetPercentage)
  ) {
    showError("Please enter valid numbers in all fields.");
    return;
  }

  if (totalClasses < 0 || attendedClasses < 0 || targetPercentage <= 0 || targetPercentage > 100) {
    showError("Use non-negative values and keep the target percentage between 1 and 100.");
    return;
  }

  if (attendedClasses > totalClasses) {
    showError("Classes attended cannot be more than total classes held.");
    return;
  }

  if (totalClasses === 0) {
    currentAttendanceOutput.textContent = "0%";
    attendanceStatusOutput.textContent = "No classes have been held yet.";
    canMissOutput.textContent = "0";
    needToAttendOutput.textContent = "0";
    return;
  }

  const currentPercentage = (attendedClasses / totalClasses) * 100;
  const targetRatio = targetPercentage / 100;

  let canMiss = 0;
  if (attendedClasses / totalClasses >= targetRatio) {
    canMiss = Math.floor(attendedClasses / targetRatio - totalClasses);
  }

  let needToAttend = 0;
  if (attendedClasses / totalClasses < targetRatio) {
    if (targetPercentage === 100) {
      needToAttend = Infinity;
    } else {
      needToAttend = Math.ceil((targetRatio * totalClasses - attendedClasses) / (1 - targetRatio));
    }
  }

  currentAttendanceOutput.textContent = formatPercentage(currentPercentage);
  canMissOutput.textContent = String(Math.max(0, canMiss));
  needToAttendOutput.textContent = Number.isFinite(needToAttend) ? String(Math.max(0, needToAttend)) : "Impossible";
  updateProgressFill(currentPercentage, targetPercentage);
  revealResultCards();

  if (currentPercentage >= targetPercentage) {
    attendanceStatusOutput.textContent = "You are currently on track and above your target.";
  } else if (targetPercentage === 100) {
    attendanceStatusOutput.textContent = "A perfect 100% target cannot be reached once any class has been missed.";
  } else {
    attendanceStatusOutput.textContent = "You are below your target right now, but you can recover from here.";
  }
}

function resetCalculator() {
  form.reset();
  targetPercentageInput.value = "75";
  clearError();
  currentAttendanceOutput.textContent = "0%";
  attendanceStatusOutput.textContent = "Enter your details to see your status.";
  canMissOutput.textContent = "0";
  needToAttendOutput.textContent = "0";
  progressFill.style.width = "0%";
  leaveClassDaysOutput.textContent = "0";
  projectedAttendanceOutput.textContent = "0%";
  attendanceDropOutput.textContent = "0%";
  maintainSeventyFiveOutput.textContent = "0";
  setLeaveStatus("", "");
}

if (loginForm) {
  loginForm.addEventListener("submit", handleLoginSubmit);
}

if (logoutButton) {
  logoutButton.addEventListener("click", handleLogout);
}

if (form) {
  form.addEventListener("submit", calculateAttendance);
}

if (resetButton) {
  resetButton.addEventListener("click", resetCalculator);
}

revealResultCards();

if (feedbackForm) {
  feedbackForm.addEventListener("submit", handleFeedbackSubmit);
}

if (leaveForm) {
  leaveForm.addEventListener("submit", handleLeavePlannerSubmit);
}

initializeAuthGate();
