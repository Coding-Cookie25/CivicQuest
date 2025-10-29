// --- DOM Elements (Navigation) ---
let navLinks, mainNav, authNav, navUsername, navHighscore, logoutButton, navLogin, navSignup;

// --- DOM Elements (Main) ---
let loadingSpinner, appContent;

// --- DOM Elements (Views) ---
let views;
let viewReport, viewFeed, viewGames, viewLeaderboard, viewLogin, viewSignup;

// --- DOM Elements (Report Form) ---
let reportForm, reportSubmitButton, formMessage;

// --- DOM Elements (Feed) ---
let issueFeedContainer;

// --- DOM Elements (Game 1: Clean-Up) ---
let gameArea, gameStartButton, gameScoreEl, gameTimerEl;
let binCompost, binTrash, binRecycling;

// --- DOM Elements (Game 2: Quiz) ---
let quizContainer, quizStartScreen, quizGameScreen, quizEndScreen;
let quizStartButton, quizNextButton, quizRestartButton;
let quizQuestion, quizAnswers, quizFeedback;
let quizScoreEl, quizQuestionNumberEl, quizTotalQuestionsEl;
let quizFinalScoreEl, quizFinalMessageEl;

// --- DOM Elements (Leaderboard) ---
let leaderboardListContainer;

// --- DOM Elements (Auth Forms) ---
let loginForm, loginMessage, loginSubmitButton;
let signupForm, signupMessage, signupSubmitButton;

// --- NEW DROPDOWN ELEMENT ---
let userDropdown;

// --- App State ---
let currentView = 'report';
let currentUser = null;
let gameInterval = null;
let gameTimer = 30;
let gameScore = 0;
let gameIsRunning = false;
let draggedItem = null;
let bins = [];

// --- NEW GAME STATE ---
let gameLoopId = null; // ID for requestAnimationFrame
const GRAVITY = 1.5; // Pixels per frame for falling items. You can adjust this!

// --- Quiz State ---
let quizScore = 0;
let currentQuestionIndex = 0;
const quizQuestions = [
    {
        question: "You see a pothole on your street. What's the best action to take?",
        answers: [
            "Ignore it, someone else will report it.",
            "Report it to the local city council or public works department.",
            "Post about it on social media and tag the mayor.",
            "Try to fill it with gravel yourself."
        ],
        correct: 1 // index of the correct answer
    },
    {
        question: "A streetlight on your block is broken. Why is it important to report?",
        answers: [
            "It makes the street too dark and spooky.",
            "It wastes a small amount of electricity.",
            "It's a safety hazard and can increase crime.",
            "It's not important, it's just one light."
        ],
        correct: 2
    },
    {
        question: "You notice graffiti on a park bench. What should you do?",
        answers: [
            "Report it to the parks department for cleanup.",
            "Try to scrub it off yourself with soap.",
            "Take a picture for your art blog.",
            "Nothing, it's just street art."
        ],
        correct: 0
    },
    {
        question: "Your neighbor's trash cans are overflowing every week. What's a constructive first step?",
        answers: [
            "Report them to the city immediately for a fine.",
            "Leave an anonymous angry note on their door.",
            "Politely ask if they're aware of recycling/compost options.",
            "Post a picture of their trash on the neighborhood app."
        ],
        correct: 2
    },
    {
        question: "What is the *primary* purpose of a local library?",
        answers: [
            "A quiet place to take a nap.",
            "Free Wi-Fi and computer access.",
            "Providing free access to information, books, and community programs.",
            "A place to borrow movies and video games."
        ],
        correct: 2
    }
];

// --- App Initialization ---
async function initApp() {
    console.log("Initializing CivicQuest...");
    
    // --- Get All DOM Elements ---
    navLinks = document.querySelectorAll('.nav-link');
    mainNav = document.getElementById('main-nav');
    authNav = document.getElementById('auth-nav');
    navUsername = document.getElementById('nav-username');
    navHighscore = document.getElementById('nav-highscore');
    logoutButton = document.getElementById('logout-button');
    navLogin = document.getElementById('nav-login');
    navSignup = document.getElementById('nav-signup');

    // --- FIX: Get the user dropdown menu ---
    if (logoutButton) {
        userDropdown = logoutButton.closest('.absolute'); // Find the dropdown parent
        if (userDropdown) {
            userDropdown.classList.remove('group-hover:block'); // Remove the CSS hover behavior
        }
    }
    
    loadingSpinner = document.getElementById('loading-spinner');
    appContent = document.getElementById('app-content');
    
    views = document.querySelectorAll('[id^="view-"]');
    viewReport = document.getElementById('view-report');
    viewFeed = document.getElementById('view-feed');
    viewGames = document.getElementById('view-games');
    viewLeaderboard = document.getElementById('view-leaderboard');
    viewLogin = document.getElementById('view-login');
    viewSignup = document.getElementById('view-signup');
    
    reportForm = document.getElementById('report-form');
    reportSubmitButton = document.getElementById('report-submit-button');
    formMessage = document.getElementById('form-message');
    
    issueFeedContainer = document.getElementById('issue-feed-container');
    
    gameArea = document.getElementById('game-area');
    gameStartButton = document.getElementById('game-start-button');
    gameScoreEl = document.getElementById('game-score');
    gameTimerEl = document.getElementById('game-timer');
    binCompost = document.getElementById('bin-compost');
    binTrash = document.getElementById('bin-trash');
    binRecycling = document.getElementById('bin-recycling');
    
    quizContainer = document.getElementById('quiz-container');
    quizStartScreen = document.getElementById('quiz-start-screen');
    quizGameScreen = document.getElementById('quiz-game-screen');
    quizEndScreen = document.getElementById('quiz-end-screen');
    quizStartButton = document.getElementById('quiz-start-button');
    quizNextButton = document.getElementById('quiz-next-button');
    quizRestartButton = document.getElementById('quiz-restart-button');
    quizQuestion = document.getElementById('quiz-question');
    quizAnswers = document.getElementById('quiz-answers');
    quizFeedback = document.getElementById('quiz-feedback');
    quizScoreEl = document.getElementById('quiz-score');
    quizQuestionNumberEl = document.getElementById('quiz-question-number');
    quizTotalQuestionsEl = document.getElementById('quiz-total-questions');
    quizFinalScoreEl = document.getElementById('quiz-final-score');
    quizFinalMessageEl = document.getElementById('quiz-final-message');
    
    leaderboardListContainer = document.getElementById('leaderboard-list-container');
    
    loginForm = document.getElementById('login-form');
    loginMessage = document.getElementById('login-message');
    loginSubmitButton = document.getElementById('login-submit-button');
    signupForm = document.getElementById('signup-form');
    signupMessage = document.getElementById('signup-message');
    signupSubmitButton = document.getElementById('signup-submit-button');

    // --- Add Event Listeners ---
    
    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewId = link.dataset.view;
            if (viewId) {
                navigate(viewId);
            }
        });
    });

    // --- FIX: Add click listener for username dropdown ---
    if (navUsername) {
        navUsername.addEventListener('click', (e) => {
            e.preventDefault();
            if (userDropdown) {
                userDropdown.classList.toggle('hidden');
            }
        });
    }

    // --- FIX: Add global click listener to close dropdown ---
    document.addEventListener('click', (e) => {
        if (!userDropdown) return;

        // If the click is NOT on the username button AND NOT inside the dropdown
        if (!navUsername.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.add('hidden'); // Hide it
        }
    });

    // Auth Forms
    if(loginForm) loginForm.addEventListener('submit', handleLogin);
    if(signupForm) signupForm.addEventListener('submit', handleSignup);
    if(logoutButton) logoutButton.addEventListener('click', handleLogout);
    
    // Report Form
    if(reportForm) reportForm.addEventListener('submit', handleReportSubmit);
    
    // --- Game 1 Event Listeners ---
    if(gameStartButton) gameStartButton.addEventListener('click', startGame);
    if(gameArea) {
        // We use mousedown/touchstart to be inclusive
        gameArea.addEventListener('mousedown', startDrag);
        gameArea.addEventListener('touchstart', startDrag, { passive: false });
    }
    // Listen on the whole document for move/end
    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);

    // --- Game 2 (Quiz) Event Listeners ---
    if (quizStartButton) quizStartButton.addEventListener('click', startQuiz);
    if (quizAnswers) quizAnswers.addEventListener('click', handleAnswerClick);
    if (quizNextButton) quizNextButton.addEventListener('click', nextQuestion);
    if (quizRestartButton) quizRestartButton.addEventListener('click', startQuiz);

    // --- Check Login Status ---
    await checkCurrentUser();
    
    // --- Show Initial View ---
    const initialView = currentUser ? (window.location.hash.substring(1) || 'report') : 'login';
    navigate(initialView);
    
    // Show app, hide spinner
    loadingSpinner.classList.add('hidden');
    appContent.classList.remove('hidden');
}

// --- Navigation ---
function navigate(viewId) {
    console.log(`Navigating to: ${viewId}`);
    // If user is not logged in, force login/signup view
    if (!currentUser && viewId !== 'login' && viewId !== 'signup') {
        navigate('login');
        return;
    }
    
    // If user IS logged in, don't show login/signup
    if (currentUser && (viewId === 'login' || viewId === 'signup')) {
        navigate('report');
        return;
    }

    currentView = viewId;
    
    // Hide all views
    views.forEach(view => view.classList.add('hidden'));
    
    // Show the target view
    const targetView = document.getElementById(`view-${viewId}`);
    if (targetView) {
        targetView.classList.remove('hidden');
    }

    // Update active nav link
    navLinks.forEach(link => {
        if (link.dataset.view === viewId) {
            link.classList.add('border-blue-600', 'text-blue-600');
            link.classList.remove('border-transparent', 'text-gray-700');
        } else {
            link.classList.add('border-transparent', 'text-gray-700');
            link.classList.remove('border-blue-600', 'text-blue-600');
        }
    });
    
    // Special actions on view change
    if (viewId === 'feed') {
        loadIssues();
    }
    
    if (viewId === 'leaderboard') {
        loadLeaderboard();
    }
    
    // If switching away from the game, stop it
    if (viewId !== 'games' && gameIsRunning) {
        stopGame(false); // Stop game without showing final score
    }

    // --- FIX: Hide dropdown on navigation ---
    if (userDropdown) {
        userDropdown.classList.add('hidden');
    }
}

// --- Auth Logic ---
async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const data = Object.fromEntries(formData.entries());
    
    setFormLoading(loginSubmitButton, loginMessage, true);
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Login failed');
        }
        
        currentUser = result;
        updateUserUI();
        navigate('report');
        
    } catch (error) {
        showFormMessage(loginMessage, error.message, 'error');
    } finally {
        setFormLoading(loginSubmitButton, loginMessage, false);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const formData = new FormData(signupForm);
    const data = Object.fromEntries(formData.entries());

    setFormLoading(signupSubmitButton, signupMessage, true);

    try {
        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Signup failed');
        }

        currentUser = result;
        updateUserUI();
        navigate('report');

    } catch (error) {
        showFormMessage(signupMessage, error.message, 'error');
    } finally {
        setFormLoading(signupSubmitButton, signupMessage, false);
    }
}

async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' });
    currentUser = null;
    updateUserUI();
    navigate('login');

    // --- FIX: Ensure dropdown is hidden after logout ---
    if (userDropdown) {
        userDropdown.classList.add('hidden');
    }
}

async function checkCurrentUser() {
    try {
        const response = await fetch('/api/me');
        if (response.ok) {
            currentUser = await response.json();
        } else {
            currentUser = null;
        }
    } catch (error) {
        currentUser = null;
    }
    updateUserUI();
}

function updateUserUI() {
    if (currentUser) {
        mainNav.classList.remove('hidden');
        authNav.classList.add('hidden');
        navUsername.textContent = currentUser.username;
        navHighscore.textContent = currentUser.high_score;
    } else {
        mainNav.classList.add('hidden');
        authNav.classList.remove('hidden');
    }
}

// --- Issue Reporting ---
async function handleReportSubmit(e) {
    e.preventDefault();
    const formData = new FormData(reportForm);
    // We don't convert to JSON here because we are sending FormData
    
    setFormLoading(reportSubmitButton, formMessage, true, "Submitting...");

    try {
        const response = await fetch('/api/report', {
            method: 'POST',
            // No 'Content-Type' header, browser sets it for FormData
            body: formData, 
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to submit report');
        }
        
        showFormMessage(formMessage, 'Report submitted! +10 points (demo)', 'success');
        reportForm.reset();
        
        // Note: In a real app, you might add points to the user's score here
        // For now, we just show a message.

    } catch (error) {
        showFormMessage(formMessage, error.message, 'error');
    } finally {
        setFormLoading(reportSubmitButton, formMessage, false, "Submit Report");
    }
}

// --- Issue Feed ---
async function loadIssues() {
    if (!issueFeedContainer) return;
    issueFeedContainer.innerHTML = '<p class="text-gray-500 text-center">Loading issues...</p>';

    try {
        const response = await fetch('/api/issues');
        if (!response.ok) {
            throw new Error('Failed to fetch issues');
        }
        const issues = await response.json();
        renderIssues(issues);
    } catch (error) {
        issueFeedContainer.innerHTML = `<div class="text-red-600 text-center">${error.message}</div>`;
    }
}

function renderIssues(issues) {
    if (!issueFeedContainer) return;

    if (issues.length === 0) {
        issueFeedContainer.innerHTML = '<p class="text-gray-600 text-center">No issues reported yet. Be the first!</p>';
        return;
    }

    issueFeedContainer.innerHTML = ''; // Clear existing content
    issues.forEach(issue => {
        const issueEl = document.createElement('div');
        issueEl.className = 'bg-white p-6 rounded-lg shadow-md border border-gray-200';
        
        const date = new Date(issue.createdAt * 1000).toLocaleString();
        const typeColor = getIssueTypeColor(issue.type);
        
        // --- FIX 2 (Part 1) ---
        // Check for a photoUrl and create an img tag if it exists.
        // Added onerror to hide the img tag if the link is broken.
        const photoHtml = issue.photoUrl ? `<img src="${issue.photoUrl}" alt="Issue photo" class="mt-4 rounded-lg w-full max-w-sm mx-auto" onerror="this.style.display='none'">` : '';
        
        issueEl.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <span class="px-3 py-1 text-sm font-medium rounded-full ${typeColor}">
                    ${issue.type}
                </span>
                <span class="text-sm text-gray-500">Reported by: <strong>${issue.username || 'Unknown'}</strong></span>
            </div>
            <h3 class="text-xl font-semibold text-gray-800 mb-2">${issue.location}</h3>
            <p class="text-gray-600 mb-4">${issue.description}</p>
            
            <!-- --- FIX 2 (Part 2) --- -->
            <!-- The photoHtml variable is inserted here -->
            ${photoHtml} 
            
            <div class="flex justify-between items-center text-sm text-gray-500 mt-4">
                <span>Status: <strong class="text-orange-600">${issue.status}</strong></span>
                <span>${date}</span>
            </div>
        `;
        issueFeedContainer.appendChild(issueEl);
    });
}

function getIssueTypeColor(type) {
     switch(type) {
        case 'Pothole': return 'bg-gray-200 text-gray-800';
        case 'Broken Streetlight': return 'bg-yellow-100 text-yellow-800';
        case 'Graffiti': return 'bg-purple-100 text-purple-800';
        case 'Illegal Dumping': return 'bg-red-100 text-red-800';
        case 'Other': return 'bg-blue-100 text-blue-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// --- LEADERBOARD LOGIC ---
async function loadLeaderboard() {
    if (!leaderboardListContainer) return;
    leaderboardListContainer.innerHTML = '<p class="text-gray-500 text-center">Loading leaderboard...</p>';
    
    try {
        const response = await fetch('/api/leaderboard');
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to fetch leaderboard');
        }
        
        const users = await response.json();
        renderLeaderboard(users);
        
    } catch (error) {
        console.error("Error loading leaderboard:", error);
        if(leaderboardListContainer) leaderboardListContainer.innerHTML = `<div class="text-red-600 text-center">${error.message}</div>`;
    }
}

function renderLeaderboard(users) {
    if (!leaderboardListContainer) return;

    if (users.length === 0) {
        leaderboardListContainer.innerHTML = '<p class="text-gray-600 text-center">No one is on the leaderboard yet. Be the first!</p>';
        return;
    }

    leaderboardListContainer.innerHTML = ''; // Clear existing content
    
    // Create an ordered list
    const ol = document.createElement('ol');
    ol.className = 'divide-y divide-gray-200';
    
    users.forEach((user, index) => {
        const li = document.createElement('li');
        li.className = 'p-4 flex justify-between items-center';
        
        let rankBadge = '';
        if (index === 0) {
            rankBadge = '<span class="text-3xl" title="1st Place">🥇</span>'; // Gold
        } else if (index === 1) {
            rankBadge = '<span class="text-2xl" title="2nd Place">🥈</span>'; // Silver
        } else if (index === 2) {
            rankBadge = '<span class="text-xl" title="3rd Place">🥉</span>'; // Bronze
        } else {
            rankBadge = `<span class="font-bold text-gray-500 w-6 text-center">${index + 1}</span>`;
        }
        
        li.innerHTML = `
            <div class="flex items-center space-x-4">
                ${rankBadge}
                <span class="text-lg font-medium text-gray-800">${user.username}</span>
            </div>
            <span class="text-xl font-bold text-blue-600">${user.high_score} pts</span>
        `;
        ol.appendChild(li);
    });
    
    leaderboardListContainer.appendChild(ol);
}

// --- GAME 1 LOGIC (Clean-Up) ---

function resetGameUI() {
    gameScore = 0;
    gameTimer = 30;
    gameScoreEl.textContent = gameScore;
    gameTimerEl.textContent = gameTimer;
    gameArea.innerHTML = '';
    gameStartButton.disabled = false;
    gameStartButton.textContent = "Start Game";
    // Get bin positions
    bins = [
        { el: binCompost, rect: binCompost.getBoundingClientRect(), type: 'compost' },
        { el: binTrash, rect: binTrash.getBoundingClientRect(), type: 'trash' },
        { el: binRecycling, rect: binRecycling.getBoundingClientRect(), type: 'recycling' },
    ];
}

function startGame() {
    if (gameIsRunning) return;
    
    gameIsRunning = true;
    resetGameUI();
    gameStartButton.disabled = true;
    gameStartButton.textContent = "Playing...";

    // Start game timer
    gameInterval = setInterval(() => {
        gameTimer--;
        gameTimerEl.textContent = gameTimer;
        
        if (gameTimer <= 0) {
            stopGame(true);
        }
    }, 1000);
    
    // Start spawning items
    spawnItem();

    // --- CHANGE: Start the game loop ---
    gameLoopId = requestAnimationFrame(gameLoop);
}

function stopGame(showScore) {
    gameIsRunning = false;

    // --- CHANGE: Stop the game loop ---
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }

    clearInterval(gameInterval);
    gameStartButton.disabled = false;
    gameStartButton.textContent = "Start Game";
    
    if (showScore) {
        gameArea.innerHTML = `<div class="p-4 text-center">
            <h4 class="text-2xl font-bold">Game Over!</h4>
            <p class="text-lg">Your score: ${gameScore}</p>
        </div>`;
        
        // Update user's high score if this is a new best
        if (currentUser && gameScore > currentUser.high_score) {
            updateUserScore(gameScore);
        }
    } else {
        gameArea.innerHTML = '';
    }
}

// --- NEW FUNCTION: Game Loop ---
// This function moves all the items down the screen
function gameLoop() {
    if (!gameIsRunning) return; // Stop loop if game ended

    const gameRect = gameArea.getBoundingClientRect();
    const items = gameArea.querySelectorAll('.game-item');
    
    items.forEach(item => {
        // Only move items that are NOT being dragged
        if (!item.classList.contains('dragging')) {
            let top = parseFloat(item.style.top) || 0;
            top += GRAVITY;
            
            // Check if item reached the bottom
            if (top > gameRect.height - 40) { // 40 is item height
                item.remove();
                // Penalize for missing
                gameScore -= 2; 
                gameScoreEl.textContent = gameScore;
            } else {
                item.style.top = `${top}px`;
            }
        }
    });

    gameLoopId = requestAnimationFrame(gameLoop); // Continue the loop
}


async function updateUserScore(newScore) {
    if (!currentUser) return;
    
    console.log(`Submitting new high score: ${newScore}`);
    try {
        const response = await fetch('/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ score: newScore }),
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.error || 'Failed to update score');
        }
        
        // Update local user object
        currentUser.high_score = result.high_score;
        updateUserUI();
        console.log("High score updated successfully.");

    } catch (error) {
        console.error("Error updating high score:", error.message);
    }
}

function spawnItem() {
    if (!gameIsRunning) return;

    const items = [
        { type: 'compost', icon: '🍎' },
        { type: 'compost', icon: '🍌' },
        // --- FIX 1 ---
        // Replaced ' wrappers_ ' with a trash can emoji '🗑️'
        { type: 'trash', icon: '🗑️' }, 
        { type: 'trash', icon: '☕' },
        { type: 'recycling', icon: '🍾' },
        { type: 'recycling', icon: '🥫' },
    ];
    
    const item = items[Math.floor(Math.random() * items.length)];
    const itemEl = document.createElement('div');
    itemEl.className = 'game-item';
    itemEl.textContent = item.icon;
    itemEl.dataset.type = item.type;
    
    // Position randomly at the top
    const gameRect = gameArea.getBoundingClientRect();
    const x = Math.random() * (gameRect.width - 40);
    // --- CHANGE: Start items at the top ---
    const y = 0; 
    itemEl.style.left = `${x}px`;
    itemEl.style.top = `${y}px`;
    
    gameArea.appendChild(itemEl);
    
    // Spawn next item
    setTimeout(spawnItem, 1500); // Spawn a new item every 1.5 seconds
}

// --- Drag and Drop Logic ---

function getEventCoords(e) {
    if (e.touches) {
        return e.touches[0];
    }
    return e;
}

function startDrag(e) {
    if (!gameIsRunning) return;
    
    const target = e.target.closest('.game-item');
    if (target) {
        // Prevent default for touch events
        if (e.touches) e.preventDefault();
        
        draggedItem = target;
        draggedItem.classList.add('dragging');
        
        // Calculate offset from click/touch to top-left corner
        const coords = getEventCoords(e);
        const rect = draggedItem.getBoundingClientRect();
        const gameRect = gameArea.getBoundingClientRect();
        
        draggedItem.offset = {
            x: coords.clientX - (rect.left - gameRect.left),
            y: coords.clientY - (rect.top - gameRect.top)
        };
        
        // Initial move to position item under cursor/finger
        moveItem(coords);
    }
}

function drag(e) {
    if (draggedItem) {
        if (e.touches) e.preventDefault();
        moveItem(getEventCoords(e));
    }
}

function moveItem(coords) {
    if (!draggedItem) return;
    
    const gameRect = gameArea.getBoundingClientRect();
    // Calculate new top/left relative to the gameArea
    let x = coords.clientX - gameRect.left - draggedItem.offset.x;
    let y = coords.clientY - gameRect.top - draggedItem.offset.y;
    
    // Constrain to gameArea bounds
    x = Math.max(0, Math.min(x, gameRect.width - 40));
    y = Math.max(0, Math.min(y, gameRect.height - 40));
    
    draggedItem.style.left = `${x}px`;
    draggedItem.style.top = `${y}px`;
    
    // Check for bin hover
    checkBinHover(coords.clientX, coords.clientY);
}

function checkBinHover(clientX, clientY) {
    // Reset all bins
    bins.forEach(bin => {
        bin.el.classList.remove('hover-valid', 'hover-invalid');
    });
    
    // Find the bin we are hovering over
    const hoveredBin = bins.find(bin => 
        clientX >= bin.rect.left &&
        clientX <= bin.rect.right &&
        clientY >= bin.rect.top &&
        clientY <= bin.rect.bottom
    );
    
    if (hoveredBin) {
        if (hoveredBin.type === draggedItem.dataset.type) {
            hoveredBin.el.classList.add('hover-valid');
        } else {
            hoveredBin.el.classList.add('hover-invalid');
        }
    }
}

function endDrag(e) {
    if (!draggedItem) return;
    
    const coords = getEventCoords(e) || e; // Use changedTouches for touchend
    let clientX, clientY;
    
    if (e.type === 'touchend' && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    // Check if we dropped it in a bin
    const droppedBin = bins.find(bin => 
        clientX >= bin.rect.left &&
        clientX <= bin.rect.right &&
        clientY >= bin.rect.top &&
        clientY <= bin.rect.bottom
    );
    
    if (droppedBin) {
        if (droppedBin.type === draggedItem.dataset.type) {
            // Correct bin!
            gameScore += 10;
            draggedItem.remove(); // Remove item from game
        } else {
            // Wrong bin!
            gameScore -= 5;
            // Snap back (by just removing dragging class)
        }
        gameScoreEl.textContent = gameScore;
    }
    
    // Reset item style
    bins.forEach(bin => bin.el.classList.remove('hover-valid', 'hover-invalid'));
    draggedItem.classList.remove('dragging');
    draggedItem = null;
}

// --- GAME 2 LOGIC (Quiz) ---

function startQuiz() {
    quizScore = 0;
    currentQuestionIndex = 0;
    quizScoreEl.textContent = quizScore;
    
    quizStartScreen.classList.add('hidden');
    quizEndScreen.classList.add('hidden');
    quizGameScreen.classList.remove('hidden');
    
    if(quizTotalQuestionsEl) quizTotalQuestionsEl.textContent = quizQuestions.length;
    
    showQuestion();
}

function showQuestion() {
    // Reset UI
    quizFeedback.classList.add('hidden');
    quizNextButton.classList.add('hidden');
    quizAnswers.innerHTML = '';
    
    // Get question
    const q = quizQuestions[currentQuestionIndex];
    quizQuestion.textContent = q.question;
    quizQuestionNumberEl.textContent = currentQuestionIndex + 1;
    
    // Create answer buttons
    q.answers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.className = 'quiz-answer-btn';
        button.textContent = answer;
        button.dataset.index = index;
        quizAnswers.appendChild(button);
    });
}

function handleAnswerClick(e) {
    const selectedButton = e.target.closest('.quiz-answer-btn');
    if (!selectedButton) return; // Didn't click a button
    
    // Disable all buttons
    const buttons = quizAnswers.querySelectorAll('.quiz-answer-btn');
    buttons.forEach(btn => btn.disabled = true);
    
    // Check answer
    const selectedIndex = parseInt(selectedButton.dataset.index);
    const correctIndex = quizQuestions[currentQuestionIndex].correct;
    
    if (selectedIndex === correctIndex) {
        // Correct
        quizScore += 10;
        quizScoreEl.textContent = quizScore;
        selectedButton.classList.add('quiz-correct');
        quizFeedback.textContent = "Correct! +10 points";
        quizFeedback.className = 'mt-4 p-3 rounded-lg text-center font-medium bg-green-100 text-green-800';
    } else {
        // Incorrect
        selectedButton.classList.add('quiz-incorrect');
        buttons[correctIndex].classList.add('quiz-correct'); // Show the right answer
        quizFeedback.textContent = "Not quite. The correct answer is highlighted.";
        quizFeedback.className = 'mt-4 p-3 rounded-lg text-center font-medium bg-red-100 text-red-800';
    }
    
    quizFeedback.classList.remove('hidden');
    quizNextButton.classList.remove('hidden');
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < quizQuestions.length) {
        showQuestion();
    } else {
        endQuiz();
    }
}

function endQuiz() {
    quizGameScreen.classList.add('hidden');
    quizEndScreen.classList.remove('hidden');
    
    quizFinalScoreEl.textContent = quizScore;
    const totalPossible = quizQuestions.length * 10;
    let message = "";
    
    if (quizScore === totalPossible) {
        message = "Perfect score! You're a true Civic Champion!";
    } else if (quizScore >= totalPossible * 0.7) {
        message = "Great job! You really know your stuff.";
    } else {
        message = "Good try! Every question is a learning opportunity.";
    }
    quizFinalMessageEl.textContent = message;
    
    // Update user's high score if this is a new best
    // This combines scores from both games.
    const finalGameScore = gameScore + quizScore; // Combine scores
    
    // Alert user of combined score
    quizFinalMessageEl.textContent += ` (Total game score: ${finalGameScore})`;
    
    if (currentUser && finalGameScore > currentUser.high_score) {
        updateUserScore(finalGameScore);
    }
}

// --- Utility Functions ---

function showFormMessage(el, message, type = 'error') {
    if (!el) return;
    el.textContent = message;
    el.className = `text-center p-3 rounded-lg ${type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`;
    el.classList.remove('hidden');
}

function setFormLoading(button, messageEl, isLoading, defaultText = 'Submit') {
    if (isLoading) {
        if(button) button.disabled = true;
        if(button) button.textContent = 'Loading...';
        if(messageEl) messageEl.classList.add('hidden');
    } else {
        if(button) button.disabled = false;
        if(button) button.textContent = defaultText;
    }
}

// --- Start App ---
window.onload = initApp;
