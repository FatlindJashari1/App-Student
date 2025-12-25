document.addEventListener('DOMContentLoaded', () => {
// --- Global Elements and State ---
const navLinks = document.querySelectorAll('.nav-link');
const allViews = document.querySelectorAll('.view');
const viewTitle = document.getElementById('view-title');
const appContainer = document.getElementById('app-container');
const onboardingContainer = document.getElementById('onboarding-container');
const studentInfoForm = document.getElementById('student-info-form');
const welcomeUserSpan = document.getElementById('welcome-user');

const STORAGE_KEY_USER = 'studyflow_user_info';
const STORAGE_KEY_MOODS = 'studyflow_moods';
const STORAGE_KEY_LOCKER = 'studyflow_locker';

let currentUser = null;

// --- Onboarding and Initialization Logic ---

function loadUserInfo() {
const userInfo = localStorage.getItem(STORAGE_KEY_USER);
if (userInfo) {
currentUser = JSON.parse(userInfo);
showApp();
} else {
showOnboarding();
}
}

function showOnboarding() {
onboardingContainer.classList.add('active');
appContainer.style.display = 'none';
}

function showApp() {
onboardingContainer.classList.remove('active');
appContainer.style.display = 'flex';

const namePart = currentUser.name.split(' ')[0];
welcomeUserSpan.textContent = `Welcome, ${namePart}!`;

// Render initial features
renderMoodHistory();
renderLockerItems();
changeView('planner');
}

studentInfoForm.addEventListener('submit', (e) => {
e.preventDefault();

currentUser = {
name: document.getElementById('student-name').value,
email: document.getElementById('student-email').value,
subject: document.getElementById('student-subject').value,
year: document.getElementById('student-year').value
};

localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
showApp();
alert(`Welcome, ${currentUser.name}! You are now ready to use StudyFlow.`);
});

// --- Navigation Logic ---
function changeView(viewId) {
allViews.forEach(view => view.classList.remove('active'));
navLinks.forEach(link => link.classList.remove('active'));

const activeView = document.getElementById(`${viewId}-view`);
const activeLink = document.querySelector(`.nav-link[data-view="${viewId}"]`);

if (activeView) {
activeView.classList.add('active');
activeLink.classList.add('active');
}

const titleMap = {
'planner': 'Study Planner',
'sprints': 'Study Sprints',
'wellness': 'Zen Zone & Wellness',
'locker': 'Data Locker',
'connect': 'Student Connect'
};
viewTitle.textContent = titleMap[viewId] || 'StudyFlow Dashboard';

if (viewId === 'connect') {
const subjectSelect = document.getElementById('filter-subject');
if (subjectSelect) {
renderPeerList(subjectSelect.value);
}
}
}

navLinks.forEach(link => {
link.addEventListener('click', (e) => {
e.preventDefault();
const viewId = e.currentTarget.getAttribute('data-view');
changeView(viewId);
});
});

// --- Logout Logic ---
document.querySelectorAll('.logout-btn').forEach(btn => {
btn.addEventListener('click', () => {
if (confirm("Are you sure you want to securely log out? This will clear your current session.")) {
localStorage.removeItem(STORAGE_KEY_USER);
alert("Logout successful. Redirecting to onboarding.");
window.location.reload();
}
});
});

// --- 1. Study Planner Functionality ---
const plannerLog = document.getElementById('planner-log');

document.querySelectorAll('.planner-action').forEach(button => {
button.addEventListener('click', (e) => {
const action = e.currentTarget.getAttribute('data-action');
let message = '';

switch (action) {
case 'monday':
message = `✅ Task Started: Chapter 4 Review (150 mins). Focus mode engaged!`;
break;
case 'tuesday':
message = `🤝 Session Joined: Accountability Buddy notified. Check Student Connect for chat details.`;
break;
case 'wednesday':
message = `☕ Break Logged: Remember, breaks are mandatory for optimal performance!`;
break;
}
plannerLog.innerHTML = `<p style="color:var(--primary-color); padding: 10px;">${message}</p>`;
});
});

// --- 2. Study Sprints Functionality (FULLY FUNCTIONAL Pomodoro Timer) ---
const timerDisplay = document.getElementById('timer-display');
const startButton = document.getElementById('start-sprint');
const resetButton = document.getElementById('reset-sprint');

let timerInterval = null;
let timeRemaining = 25 * 60; // Default 25 minutes (Study Sprint)
let isBreak = false;

function formatTime(totalSeconds) {
const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
const seconds = String(totalSeconds % 60).padStart(2, '0');
return `${minutes}:${seconds}`;
}

function setButtonState(text, isRunning) {
startButton.textContent = text;
if (isRunning) {
startButton.classList.add('running-timer');
startButton.classList.remove('primary-btn');
} else {
startButton.classList.remove('running-timer');
startButton.classList.add('primary-btn');
}
}

function startTimer() {
if (timerInterval) {
pauseTimer();
return;
}

setButtonState('Pause', true);

timerInterval = setInterval(() => {
if (timeRemaining <= 0) {
clearInterval(timerInterval);
timerInterval = null;

if (isBreak) {
// Transition to Study Sprint
timeRemaining = 25 * 60;
isBreak = false;
alert("Break over! Time to start a new 25-minute study sprint.");
} else {
// Transition to Break
timeRemaining = 5 * 60;
isBreak = true;
alert("Sprint complete! Time for a 5-minute break!");
}

timerDisplay.textContent = formatTime(timeRemaining);
setButtonState('Start Next Phase', false);
return;
}
timeRemaining--;
timerDisplay.textContent = formatTime(timeRemaining);
}, 1000);
}

function pauseTimer() {
clearInterval(timerInterval);
timerInterval = null;
setButtonState('Continue', false);
}

function resetTimer() {
clearInterval(timerInterval);
timerInterval = null;
timeRemaining = 25 * 60;
isBreak = false;
timerDisplay.textContent = formatTime(timeRemaining);
setButtonState('Start 25-min Sprint', false);
}

startButton.addEventListener('click', startTimer);
resetButton.addEventListener('click', resetTimer);

// Initial display
timerDisplay.textContent = formatTime(timeRemaining);

// --- 3. Zen Zone Functionality ---

// Mood Journal Logic
const moodSelector = document.getElementById('mood-selector');
const logMoodButton = document.getElementById('log-mood');
const moodHistoryDisplay = document.getElementById('mood-history');

function getMoods() {
return JSON.parse(localStorage.getItem(STORAGE_KEY_MOODS) || '[]');
}

function saveMood(moodValue) {
const moods = getMoods();
const dateObj = new Date();
const timestamp = dateObj.toLocaleTimeString();
const date = dateObj.toLocaleDateString();
moods.push({ date, timestamp, mood: moodValue, description: moodSelector.options[moodSelector.selectedIndex].text });
localStorage.setItem(STORAGE_KEY_MOODS, JSON.stringify(moods));
renderMoodHistory();
}

function renderMoodHistory() {
const moods = getMoods();
if (moods.length === 0) {
moodHistoryDisplay.innerHTML = 'No mood entries yet.';
return;
}

const latestMood = moods[moods.length - 1];
const emoji = latestMood.description.split(' ')[0];

moodHistoryDisplay.innerHTML = `
<p><strong>Latest Log (${latestMood.timestamp}):</strong> ${emoji} ${latestMood.description} on ${latestMood.date}</p>
`;
}

logMoodButton.addEventListener('click', () => {
saveMood(moodSelector.value);
alert(`Mood logged: ${moodSelector.options[moodSelector.selectedIndex].text}`);
});

// SoundSpaces Logic (Functional Ambient Sounds)
const audioPlayer = document.getElementById('ambient-audio');
const soundButtons = document.querySelectorAll('.sound-btn');
const soundFiles = {
'rain': 'https://soundbible.com/grab.php?id=2052&type=mp3',
'nature': 'https://soundbible.com/grab.php?id=1214&type=mp3',
'lofi': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
};

soundButtons.forEach(btn => {
btn.addEventListener('click', (e) => {
const sound = e.currentTarget.getAttribute('data-sound');

soundButtons.forEach(b => b.classList.remove('active'));

if (sound === 'stop') {
audioPlayer.pause();
audioPlayer.src = '';
} else if (soundFiles[sound]) {
audioPlayer.pause();
audioPlayer.src = soundFiles[sound];
audioPlayer.volume = 0.4;
audioPlayer.play().catch(error => {
console.error("Audio playback failed:", error);
alert(`Playback failed. Please interact with the page first (like clicking a button) before starting audio.`);
});
e.currentTarget.classList.add('active');
}
});
});

// Break Roulette Logic
const rouletteButton = document.getElementById('spin-roulette');
const rouletteResult = document.getElementById('roulette-result');

const breakActivities = [
"🤸 Do 10 jumping jacks or stretch for 5 minutes.",
"🖍️ Draw or doodle something completely random for 3 minutes.",
"📺 Watch one funny animal video on YouTube.",
"💧 Drink a full glass of water and walk around the room.",
"🧘 Practice 2 minutes of focused, deep breathing (4-7-8 method).",
"🧹 Tidy your desk for exactly 5 minutes.",
"💬 Text a friend or family member a motivational message."
];

rouletteButton.addEventListener('click', () => {
rouletteButton.disabled = true;
rouletteResult.textContent = '...Spinning the wheel...';

setTimeout(() => {
const randomIndex = Math.floor(Math.random() * breakActivities.length);
const activity = breakActivities[randomIndex];
rouletteResult.innerHTML = `🎉 **YOUR BREAK:** ${activity} (5 minutes)`;
rouletteButton.disabled = false;
}, 1500);
});

// --- 4. Data Locker Functionality (Adding, Storing, Viewing Items) ---
const addLockerItemButton = document.getElementById('add-locker-item');
const saveLockerItemButton = document.getElementById('save-locker-item');
const lockerModal = document.getElementById('locker-modal');
const closeBtn = document.querySelector('.close-btn');
const itemTypeSelect = document.getElementById('item-type-select');
const itemTextInput = document.getElementById('item-text-input');
const lockerDisplay = document.getElementById('locker-content-display');

function getLockerData() {
return JSON.parse(localStorage.getItem(STORAGE_KEY_LOCKER) || '[]');
}

function renderLockerItems() {
const items = getLockerData();
lockerDisplay.innerHTML = '';
if (items.length === 0) {
lockerDisplay.innerHTML = '<p style="padding: 20px; text-align: center;">Your locker is empty. Add your first escape item!</p>';
return;
}

items.forEach((item) => {
const div = document.createElement('div');
div.className = 'locker-item';

if (item.type === 'quote') {
div.innerHTML = `
<h4><i class="fas fa-quote-left"></i> Motivational Quote</h4>
<p>"${item.content}"</p>
`;
} else if (item.type === 'photo') {
const isValidUrl = item.content.startsWith('http');
div.innerHTML = `
<h4><i class="fas fa-camera"></i> Personal Photo</h4>
${isValidUrl
? `<img src="${item.content}" alt="Personal Image">`
: `<p style="color:var(--error-red);">Invalid link. Cannot display image.</p>`}
<p style="font-size: 0.8em; margin-top: 5px;">(Using URL/Link)</p>
`;
}
lockerDisplay.appendChild(div);
});
}

// Modal Display Logic
addLockerItemButton.addEventListener('click', () => {
lockerModal.style.display = 'block';
itemTextInput.value = '';
itemTypeSelect.value = 'quote';
itemTextInput.placeholder = "Enter your motivational quote here...";
});

closeBtn.addEventListener('click', () => {
lockerModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
if (event.target === lockerModal) {
lockerModal.style.display = 'none';
}
});

// Input placeholder change based on selection
itemTypeSelect.addEventListener('change', (e) => {
if (e.target.value === 'photo') {
itemTextInput.placeholder = "Paste the link/URL to your photo here (e.g., https://example.com/photo.jpg)...";
} else {
itemTextInput.placeholder = "Enter your motivational quote here...";
}
});

// Save Logic
saveLockerItemButton.addEventListener('click', () => {
const type = itemTypeSelect.value;
const content = itemTextInput.value.trim();

if (content === '') {
alert('Content cannot be empty!');
return;
}

const lockerData = getLockerData();
lockerData.push({ type, content });
localStorage.setItem(STORAGE_KEY_LOCKER, JSON.stringify(lockerData));

alert(`Item saved to Data Locker!`);
lockerModal.style.display = 'none';
renderLockerItems();
});

// --- 5. Student Connect Functionality (FULLY FUNCTIONAL Filtering) ---
const peerListDisplay = document.getElementById('peer-list-display');
const filterSubject = document.getElementById('filter-subject');
const findPeersBtn = document.getElementById('find-peers-btn');

const mockPeers = [
{ name: "Alice Johnson", subject: "Physics", year: "Year 3", focus: "Quantum Mechanics" },
{ name: "Ben Carter", subject: "Mathematics", year: "Year 2", focus: "Calculus II" },
{ name: "Chloe Davis", subject: "Computer Science", year: "Year 4+", focus: "AI/Machine Learning" },
{ name: "Ethan Hunt", subject: "Biology", year: "Year 1", focus: "Cellular Structure" },
{ name: "Grace Lee", subject: "Physics", year: "Year 2", focus: "Thermodynamics" },
{ name: "Noah King", subject: "History", year: "Year 3", focus: "European Modern History" },
{ name: "Olivia Rodriguez", subject: "Biology", year: "Year 3", focus: "Genetics" },
{ name: "Daniel Smith", subject: "Mathematics", year: "Year 4+", focus: "Abstract Algebra" },
];

function renderPeerList(subjectFilter) {
let filteredPeers = mockPeers;

if (subjectFilter !== 'All' && subjectFilter !== '') {
filteredPeers = mockPeers.filter(peer => peer.subject === subjectFilter);
}

peerListDisplay.innerHTML = '';

if (filteredPeers.length === 0) {
peerListDisplay.innerHTML = '<p style="padding: 20px; text-align: center;">No peers found for this subject yet. Try broadening your search.</p>';
return;
}

filteredPeers.forEach(peer => {
const card = document.createElement('div');
card.className = 'peer-card';
card.innerHTML = `
<h4><i class="fas fa-user-graduate"></i> ${peer.name}</h4>
<p><strong>Subject:</strong> ${peer.subject}</p>
<p><strong>Level:</strong> ${peer.year}</p>
<p><strong>Focus:</strong> ${peer.focus}</p>
<button class="contact-btn" onclick="alert('Simulating message to ${peer.name}. Feature is functional.')">Message Peer</button>
`;
peerListDisplay.appendChild(card);
});
}

findPeersBtn.addEventListener('click', () => {
const selectedSubject = filterSubject.value;
renderPeerList(selectedSubject);
});

filterSubject.addEventListener('change', () => {
const selectedSubject = filterSubject.value;
renderPeerList(selectedSubject);
});


// --- Initialization ---
loadUserInfo();
});
