let classData = {};

// Weekdays excluding Sunday
const shortDays = ["MON", "TUE", "WED", "THU", "FRI"];

// On page load
document.addEventListener("DOMContentLoaded", () => {
  setupCustomDropdown();
  applySavedTheme();
  loadClassData();
});

// 🌐 Load and process JSON class data
function loadClassData() {
  fetch('classes.json')
    .then(response => response.json())
    .then(data => {
      classData = data;

      const roll = localStorage.getItem("lastRoll") || "";
      const todayIndex = new Date().getDay(); // 0 = Sunday

      if (roll) document.getElementById('rollInput').value = roll;

      const mappedIndex = todayIndex === 0 ? 0 : todayIndex - 1;
      setDropdownValue(shortDays[mappedIndex]);

      if (roll) lookupClass();
    })
    .catch(error => {
      console.error("Error loading JSON:", error);
      document.getElementById("result").innerHTML = `
        <p class="error">Failed to load class schedule. Please try again later.</p>`;
    });
}

// 📅 Set value in custom dropdown
function setDropdownValue(value) {
  const dropdown = document.querySelector('.dropdown');
  const selected = dropdown.querySelector('.selected');
  selected.textContent = value;

  dropdown.dataset.value = value;
}

// 📋 Get selected day value from custom dropdown
function getSelectedDay() {
  const dropdown = document.querySelector('.dropdown');
  return dropdown.dataset.value;
}

// 🔍 Show class info
function lookupClass() {
  const roll = document.getElementById('rollInput').value.trim().toUpperCase();
  const selectedDay = getSelectedDay();
  const resultDiv = document.getElementById('result');

  if (!roll) {
    resultDiv.innerHTML = `<p class="error">Please enter your Roll Number.</p>`;
    return;
  }

  localStorage.setItem("lastRoll", roll);
  const schedule = classData[roll];

  if (!schedule) {
    resultDiv.innerHTML = `<p class="error">Roll number not found.</p>`;
    return;
  }

  const dayIndex = shortDays.indexOf(selectedDay);
  const nextClassInfo = getNextAvailableClass(schedule, dayIndex);

  if (!nextClassInfo) {
    resultDiv.innerHTML = `<p class="info">No upcoming classes found this week.</p>`;
    return;
  }

  const { day, classes } = nextClassInfo;
  setDropdownValue(day);

  let output = `
    <h2>Schedule for <span class="roll">${roll}</span> on 
    <span class="day">${day}</span></h2>
    <table><tr><th>Time</th><th>Room Subject</th></tr>`;

  const orderedTimes = Object.keys(classes).sort((a, b) => {
    const toNum = t => parseFloat(t.split('-')[0].replace(':', '.'));
    return toNum(a) - toNum(b);
  });

  for (const time of orderedTimes) {
    const subject = classes[time];
    if (subject !== "X") {
      output += `<tr><td>${time}</td><td>${subject}</td></tr>`;
    }
  }

  output += `</table>`;

  // 📆 Full week schedule
  output += `<details style="margin-top:20px;">
    <summary style="cursor:pointer;">📅 View Full Week's Schedule</summary>
    <div style="margin-top: 12px;">`;

  shortDays.forEach(day => {
    if (schedule[day] && Object.values(schedule[day]).some(s => s !== "X")) {
      output += `<h3 class="day">${day}</h3>`;
      output += `<table><tr><th>Time</th><th>Subject</th></tr>`;
      const times = Object.keys(schedule[day]).sort((a, b) => {
        const toNum = t => parseFloat(t.split('-')[0].replace(':', '.'));
        return toNum(a) - toNum(b);
      });

      times.forEach(time => {
        const subject = schedule[day][time];
        if (subject !== "X") {
          output += `<tr><td>${time}</td><td>${subject}</td></tr>`;
        }
      });

      output += `</table>`;
    }
  });

  output += `</div></details>`;

  resultDiv.innerHTML = output;
}

// 🔄 Get next available class
function getNextAvailableClass(schedule, startIndex) {
  for (let i = 0; i < shortDays.length; i++) {
    const index = (startIndex + i) % shortDays.length;
    const day = shortDays[index];
    const classes = schedule[day];

    if (classes && Object.values(classes).some(sub => sub !== "X")) {
      return { day, classes };
    }
  }
  return null;
}

// 🌙 Dark Mode Toggle
function toggleTheme() {
  const html = document.documentElement;
  const isDark = html.getAttribute("data-theme") === "dark";
  const newTheme = isDark ? "light" : "dark";

  html.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);

  const btn = document.querySelector(".theme-toggle");
  if (btn) btn.textContent = newTheme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
}

// 💾 Apply saved theme on load
function applySavedTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  const btn = document.querySelector(".theme-toggle");
  if (btn) btn.textContent = savedTheme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";
}

// ⬇️ Setup custom dropdown
function setupCustomDropdown() {
  const selectEl = document.getElementById('daySelect');
  const container = document.createElement('div');
  container.className = 'dropdown';
  container.setAttribute('tabindex', '0');

  const selected = document.createElement('div');
  selected.className = 'selected';
  selected.textContent = selectEl.options[0].value;
  container.dataset.value = selectEl.options[0].value;

  const optionsContainer = document.createElement('div');
  optionsContainer.className = 'options';

  shortDays.forEach(day => {
    const opt = document.createElement('div');
    opt.className = 'option';
    opt.textContent = day;
    opt.addEventListener('click', () => {
      setDropdownValue(day);
      optionsContainer.classList.remove('show');
    });
    optionsContainer.appendChild(opt);
  });

  selected.addEventListener('click', () => {
    optionsContainer.classList.toggle('show');
  });

  container.appendChild(selected);
  container.appendChild(optionsContainer);

  selectEl.parentNode.insertBefore(container, selectEl);
  selectEl.remove(); // Remove native <select>
}


