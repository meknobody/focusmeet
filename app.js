/* Safe DOM manipulation helpers */
    function safeSetText(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
    function safeSetHTML(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
    function safeSetWidth(id, width) { const el = document.getElementById(id); if (el) el.style.width = width; }

    /* ==========================================================================
       AUTHENTICATION & USER PROFILE ENGINE (NO AUTO-LOGIN BY DEFAULT)
       ========================================================================== */
    const AUTH_USERS_KEY = 'focusmeet_registered_users_v2';
    const AUTH_SESSION_KEY = 'focusmeet_active_session_v3';

    function initAuth() {
      // Purge any legacy session tokens from earlier testing so user arrives as Guest
      ['focusmeet_logged_in_user', 'focusmeet_logged_in_user_v2'].forEach(k => {
        try { localStorage.removeItem(k); } catch (e) {}
      });

      let users = getRegisteredUsers();
      if (!users['aditya@focusmeet.in']) {
        users['aditya@focusmeet.in'] = {
          name: 'Aditya Rathore',
          email: 'aditya@focusmeet.in',
          password: 'password123',
          dailyGoal: 120,
          level: 2,
          levelTitle: 'Apprentice Mind',
          totalXp: 210,
          currentXp: 110,
          xpForNextLevel: 200,
          streakDays: 1
        };
        localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
      }

      // Check if URL has deep-link hash (e.g. #settings, #timer, #tasks)
      const hashView = window.location.hash ? window.location.hash.replace('#', '') : null;
      const validViews = ['landing', 'dashboard', 'tasks', 'timer', 'subjects', 'goals', 'meet', 'messages', 'settings'];

      // Check if user has an active session from an EXPLICIT previous login
      const activeEmail = localStorage.getItem(AUTH_SESSION_KEY);
      if (activeEmail && users[activeEmail]) {
        loadUserWorkspace(users[activeEmail], false);
        if (hashView && validViews.includes(hashView)) {
          switchView(hashView);
        }
      } else {
        // ALWAYS DEFAULT: Not logged in! Arrives as Guest Learner on Interactive Landing Page
        setGuestMode();
        if (hashView && validViews.includes(hashView)) {
          switchView(hashView);
        } else {
          switchView('landing');
        }
      }

      window.addEventListener('hashchange', () => {
        const h = window.location.hash.replace('#', '');
        if (validViews.includes(h)) switchView(h);
      });
    }

    function getRegisteredUsers() {
      try {
        return JSON.parse(localStorage.getItem(AUTH_USERS_KEY)) || {};
      } catch (e) {
        return {};
      }
    }

    function getCurrentUser() {
      const email = localStorage.getItem(AUTH_SESSION_KEY);
      if (!email) return null;
      const users = getRegisteredUsers();
      return users[email] || null;
    }

    function toggleUserMenu() {
      document.getElementById('user-dropdown-menu').classList.toggle('hidden');
    }

    document.addEventListener('click', (e) => {
      const pill = document.getElementById('auth-user-pill');
      const menu = document.getElementById('user-dropdown-menu');
      if (menu && pill && !pill.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add('hidden');
      }
    });

    function openAuthModal(tab = 'login') {
      const menu = document.getElementById('user-dropdown-menu');
      if (menu) menu.classList.add('hidden');
      switchAuthTab(tab);
      document.getElementById('modal-auth').classList.remove('hidden');
      document.getElementById('modal-auth').classList.add('flex');
    }

    function switchAuthTab(tab) {
      const formLogin = document.getElementById('form-login');
      const formSignup = document.getElementById('form-signup');
      const tabLogin = document.getElementById('tab-auth-login');
      const tabSignup = document.getElementById('tab-auth-signup');
      const title = document.getElementById('auth-modal-title');
      const sub = document.getElementById('auth-modal-subtitle');

      if (tab === 'login') {
        formLogin.classList.remove('hidden');
        formSignup.classList.add('hidden');
        tabLogin.className = 'py-2 rounded-xl theme-card shadow-xs transition';
        tabSignup.className = 'py-2 rounded-xl opacity-75 hover:opacity-100 transition';
        title.textContent = 'Welcome Back to FocusMeet';
        sub.textContent = 'Sign in to access your student workspace';
      } else {
        formSignup.classList.remove('hidden');
        formLogin.classList.add('hidden');
        tabSignup.className = 'py-2 rounded-xl theme-card shadow-xs transition';
        tabLogin.className = 'py-2 rounded-xl opacity-75 hover:opacity-100 transition';
        title.textContent = 'Join FocusMeet';
        sub.textContent = 'Create your personalized student account';
      }
    }

    function handleLoginSubmit(e) {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim().toLowerCase();
      const pass = document.getElementById('login-password').value;
      const users = getRegisteredUsers();

      if (users[email] && users[email].password === pass) {
        localStorage.setItem(AUTH_SESSION_KEY, email);
        closeModal('modal-auth');
        loadUserWorkspace(users[email], false);
        alert(`🎉 Welcome back, ${users[email].name}!`);
      } else if (users[email]) {
        alert('Incorrect password. Please try again.');
      } else {
        alert('No account found with this email. Click "Create Account" to sign up!');
      }
    }

    function handleSignupSubmit(e) {
      e.preventDefault();
      const name = document.getElementById('signup-name').value.trim();
      const email = document.getElementById('signup-email').value.trim().toLowerCase();
      const pass = document.getElementById('signup-password').value;
      const goal = parseInt(document.getElementById('signup-goal').value) || 120;

      if (!name || !email || !pass) return;

      const users = getRegisteredUsers();
      if (users[email]) {
        alert('An account with this email already exists. Please sign in!');
        switchAuthTab('login');
        return;
      }

      users[email] = {
        name: name,
        email: email,
        password: pass,
        dailyGoal: goal,
        level: 1,
        levelTitle: 'Curious Mind',
        totalXp: 50,
        currentXp: 50,
        xpForNextLevel: 100,
        streakDays: 1
      };

      localStorage.setItem(AUTH_USERS_KEY, JSON.stringify(users));
      localStorage.setItem(AUTH_SESSION_KEY, email);

      closeModal('modal-auth');
      loadUserWorkspace(users[email], true);
      alert(`🎉 Account created! Welcome to FocusMeet, ${name}! You earned +50 Welcome XP!`);
    }

    function loginDemoUser() {
      localStorage.setItem(AUTH_SESSION_KEY, 'aditya@focusmeet.in');
      closeModal('modal-auth');
      const users = getRegisteredUsers();
      loadUserWorkspace(users['aditya@focusmeet.in'], false);
    }

    function handleLogout() {
      if (confirm('Are you sure you want to sign out?')) {
        localStorage.removeItem(AUTH_SESSION_KEY);
        setGuestMode();
        alert('You have signed out. You are now exploring as a Guest Learner.');
      }
    }

    function setGuestMode() {
      const pill = document.getElementById('auth-user-pill');
      const loginBtn = document.getElementById('auth-login-btn');
      const heroAuthBtn = document.getElementById('hero-auth-btn');
      const menu = document.getElementById('user-dropdown-menu');
      if (menu) menu.classList.add('hidden');

      if (pill) pill.classList.add('hidden');
      if (loginBtn) loginBtn.classList.remove('hidden');
      if (heroAuthBtn) heroAuthBtn.classList.remove('hidden');

      safeSetText('hero-greeting-prefix', 'Welcome to FocusMeet');
      safeSetText('hero-greeting-name', 'Guest Learner');
      safeSetText('hero-auth-prompt', 'Sign in or create an account to save your study streaks, earn XP, and track subjects.');

      // Reset guest display metrics
      appState.user.name = 'Guest Learner';
      appState.user.level = 1;
      appState.user.levelTitle = 'Curious Mind';
      appState.user.totalXp = 0;
      appState.user.currentXp = 0;
      appState.user.xpForNextLevel = 100;
      appState.user.streakDays = 0;
      appState.user.dailyTargetMinutes = 120;
      appState.user.todayStudiedMinutes = 0;
      saveState();
      renderUI();
    }

    function loadUserWorkspace(user, isNew = false) {
      const pill = document.getElementById('auth-user-pill');
      const loginBtn = document.getElementById('auth-login-btn');
      const heroAuthBtn = document.getElementById('hero-auth-btn');
      const menu = document.getElementById('user-dropdown-menu');
      if (menu) menu.classList.add('hidden');

      if (pill) pill.classList.remove('hidden');
      if (loginBtn) loginBtn.classList.add('hidden');
      if (heroAuthBtn) heroAuthBtn.classList.add('hidden');

      const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
      safeSetText('user-avatar-initials', initial);
      safeSetText('menu-avatar-circle', initial);
      safeSetText('user-navbar-name', user.name.split(' ')[0]);
      safeSetText('menu-user-fullname', user.name);
      safeSetText('menu-user-email', user.email);

      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
      safeSetText('hero-greeting-prefix', greeting);
      safeSetText('hero-greeting-name', user.name);
      safeSetHTML('hero-auth-prompt', `You're <span id="study-target-pct" class="font-bold theme-accent-soft px-1.5 py-0.5 rounded">0%</span> toward today's study target. Ready to focus?`);

      appState.user.name = user.name;
      appState.user.dailyTargetMinutes = user.dailyGoal || 120;
      appState.user.level = user.level || 1;
      appState.user.levelTitle = user.levelTitle || 'Curious Mind';
      appState.user.totalXp = user.totalXp || 0;
      appState.user.currentXp = user.currentXp || 0;
      appState.user.xpForNextLevel = user.xpForNextLevel || 100;
      appState.user.streakDays = user.streakDays || 1;

      saveState();
      renderUI();
      switchView('dashboard');
    }


    /* ==========================================================================
       THEME MANAGER (DARK & LIGHT MODE WITH CINEMATIC SWITCHER)
       ========================================================================== */
    const THEME_STORAGE_KEY = 'focusmeet_theme_mode_v1';

    function initTheme() {
      const urlParams = new URLSearchParams(window.location.search);
      const paramTheme = urlParams.get('theme');
      const saved = paramTheme || localStorage.getItem(THEME_STORAGE_KEY) || 'dark';
      applyTheme(saved, false);
    }

    function applyTheme(mode, persist = true) {
      const isLight = mode === 'light';
      if (isLight) {
        document.body.classList.add('theme-light');
        document.documentElement.classList.add('theme-light');
      } else {
        document.body.classList.remove('theme-light');
        document.documentElement.classList.remove('theme-light');
      }

      if (persist) {
        try {
          localStorage.setItem(THEME_STORAGE_KEY, mode);
        } catch (e) {}
      }

      // Update theme status text in Settings
      const statusEl = document.getElementById('theme-mode-status-text');
      if (statusEl) {
        statusEl.textContent = isLight ? 'Soft Slate (Light Mode)' : 'Obsidian Void (Dark Mode)';
      }

      // Update radio buttons in Settings if present
      const radioLight = document.getElementById('theme-radio-light');
      const radioDark = document.getElementById('theme-radio-dark');
      if (radioLight) radioLight.checked = isLight;
      if (radioDark) radioDark.checked = !isLight;

      // Update floating quick theme button
      const floatLabel = document.getElementById('floating-theme-label');
      const floatSunIcon = document.querySelector('.theme-float-icon-sun');
      const floatMoonIcon = document.querySelector('.theme-float-icon-moon');
      if (floatLabel) floatLabel.textContent = isLight ? 'Light Mode' : 'Dark Mode';
      if (floatSunIcon && floatMoonIcon) {
        if (isLight) {
          floatSunIcon.classList.remove('hidden');
          floatSunIcon.classList.add('inline');
          floatMoonIcon.classList.add('hidden');
          floatMoonIcon.classList.remove('inline');
        } else {
          floatSunIcon.classList.add('hidden');
          floatSunIcon.classList.remove('inline');
          floatMoonIcon.classList.remove('hidden');
          floatMoonIcon.classList.add('inline');
        }
      }

      // Update navbar switcher tooltip
      const navSwitcher = document.getElementById('nav-theme-switcher');
      if (navSwitcher) {
        navSwitcher.setAttribute('title', isLight ? 'Current: Light Mode (Click to switch to Dark)' : 'Current: Dark Mode (Click to switch to Light)');
      }

      // Redraw dotted grid canvas immediately
      if (typeof resizeDottedGrid === 'function') resizeDottedGrid();
    }

    function toggleTheme() {
      const isCurrentlyLight = document.body.classList.contains('theme-light');
      const next = isCurrentlyLight ? 'dark' : 'light';
      applyTheme(next, true);
      if (typeof playChime === 'function') playChime();
    }

    function setThemeMode(mode) {
      applyTheme(mode, true);
      if (typeof playChime === 'function') playChime();
    }

    /* ==========================================================================
       VIEW ROUTING & SWITCHING
       ========================================================================== */
    function switchView(viewName) {
      document.querySelectorAll('.view-panel').forEach(panel => panel.classList.add('hidden'));
      const target = document.getElementById(`view-${viewName}`);
      if (target) target.classList.remove('hidden');

      const tabs = ['landing', 'dashboard', 'tasks', 'timer', 'subjects', 'goals', 'meet', 'messages', 'settings'];
      tabs.forEach(tab => {
        const deskBtn = document.getElementById(`nav-${tab}`);
        const mobBtn = document.getElementById(`mob-nav-${tab}`);
        const bottomBtn = document.getElementById(`bottom-tab-${tab}`);
        if (tab === viewName) {
          if (deskBtn) deskBtn.className = 'pill-nav-item active';
          if (mobBtn) mobBtn.className = 'px-2.5 py-1 rounded-lg theme-card shadow-xs flex items-center gap-1';
          if (bottomBtn) {
            bottomBtn.classList.add('active');
            bottomBtn.setAttribute('aria-selected', 'true');
          }
        } else {
          if (deskBtn) deskBtn.className = 'pill-nav-item';
          if (mobBtn) mobBtn.className = 'px-2.5 py-1 rounded-lg opacity-75 flex items-center gap-1';
          if (bottomBtn) {
            bottomBtn.classList.remove('active');
            bottomBtn.setAttribute('aria-selected', 'false');
          }
        }
      });

      // Highlight quick settings gear icon button when settings view is active
      const settingsBtn = document.getElementById('nav-settings-btn');
      if (settingsBtn) {
        if (viewName === 'settings') {
          settingsBtn.classList.add('bg-white/20', 'text-white', 'border-white/40', 'shadow-xs');
          settingsBtn.classList.remove('text-neutral-300', 'border-white/10');
        } else {
          settingsBtn.classList.remove('bg-white/20', 'text-white', 'border-white/40', 'shadow-xs');
          settingsBtn.classList.add('text-neutral-300', 'border-white/10');
        }
      }

      if (viewName === 'landing') {
        setTimeout(resizeDottedGrid, 50);
      }
      if (viewName === 'timer') {
        if (typeof renderTimetable === 'function') renderTimetable();
      }
      if (viewName === 'settings') {
        if (typeof populateSettingsUI === 'function') populateSettingsUI();
      }
      if (viewName === 'meet') {
        if (typeof renderLoungeMessages === 'function') renderLoungeMessages();
        if (typeof renderLoungePeers === 'function') renderLoungePeers();
        if (typeof updateLoungeHeaderUI === 'function') updateLoungeHeaderUI();
        setTimeout(() => {
          const chatBox = document.getElementById('lounge-chat-messages');
          if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
        }, 80);
      }
      if (viewName === 'messages') {
        if (typeof renderDMConversations === 'function') renderDMConversations();
        if (typeof renderCurrentDMMessages === 'function') renderCurrentDMMessages();
        if (typeof clearDMUnreadBadge === 'function') clearDMUnreadBadge();
        setTimeout(() => {
          const dmBox = document.getElementById('dm-messages-container');
          if (dmBox) dmBox.scrollTop = dmBox.scrollHeight;
        }, 80);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /* ==========================================================================
       APP STATE ENGINE
       ========================================================================== */
    const STORAGE_KEY = 'focusmeet_student_state_v4';

    const defaultState = {
      user: {
        name: 'Guest Learner',
        level: 1,
        levelTitle: 'Curious Mind',
        currentXp: 0,
        xpForNextLevel: 100,
        totalXp: 0,
        streakDays: 0,
        dailyTargetMinutes: 120,
        todayStudiedMinutes: 0
      },
      tasks: [
        { id: '1', title: 'Calculus: Differential Equations Problem Set 4', category: 'Mathematics', priority: 'High', pomosEstimated: 3, pomosDone: 1, completed: false, time: '14:30' },
        { id: '2', title: 'Physics: Review Electromagnetism formulas & notes', category: 'Physics', priority: 'Medium', pomosEstimated: 2, pomosDone: 2, completed: true, time: '11:00' },
        { id: '3', title: 'Data Structures: Implement Dijkstra in Python', category: 'Computer Science', priority: 'High', pomosEstimated: 2, pomosDone: 0, completed: false, time: '16:00' },
        { id: '4', title: 'Chemistry: Organic Reaction Mechanisms Flashcards', category: 'Chemistry', priority: 'Low', pomosEstimated: 1, pomosDone: 0, completed: false, time: '18:00' }
      ],
      timetable: [
        { id: 'b1', day: 'Monday', title: 'Mathematics Lecture', tag: 'Lecture', start: '09:00', end: '10:30' },
        { id: 'b2', day: 'Monday', title: 'Physics Lab Practicals', tag: 'Work', start: '11:00', end: '12:30' },
        { id: 'b3', day: 'Monday', title: 'Algorithms Deep Study', tag: 'Study', start: '14:00', end: '16:00' },
        { id: 'b4', day: 'Tuesday', title: 'CS Workshop', tag: 'Lecture', start: '10:00', end: '12:00' },
        { id: 'b5', day: 'Wednesday', title: 'Chemistry Seminar', tag: 'Lecture', start: '13:00', end: '14:30' }
      ],
      activeTaskId: '1'
    };

    let appState = loadState();

    function loadState() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (!localStorage.getItem(AUTH_SESSION_KEY)) {
            parsed.user = JSON.parse(JSON.stringify(defaultState.user));
          }
          return parsed;
        }
      } catch (e) {}
      return JSON.parse(JSON.stringify(defaultState));
    }

    function saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
      } catch (e) {}
      renderUI();
    }

    function awardXP(points, reason) {
      appState.user.totalXp += points;
      appState.user.currentXp += points;

      if (appState.user.currentXp >= appState.user.xpForNextLevel) {
        appState.user.level += 1;
        appState.user.currentXp = appState.user.currentXp - appState.user.xpForNextLevel;
        appState.user.xpForNextLevel = Math.round(appState.user.xpForNextLevel * 1.5);
        if (appState.user.level === 2) appState.user.levelTitle = 'Apprentice Mind';
        else if (appState.user.level >= 3) appState.user.levelTitle = 'Dedicated Learner';
        alert(`🌟 LEVEL UP! You reached Level ${appState.user.level} (${appState.user.levelTitle})!`);
      }
      saveState();
    }

    /* ==========================================================================
       TIMER ENGINE & HIGH-FIDELITY SYNTHESIZED SOUNDS
       ========================================================================== */
    let timerDuration = 25 * 60;
    let timerTimeLeft = 25 * 60;
    let timerIsRunning = false;
    let timerInterval = null;

    function setFocusPreset(minutes) {
      if (timerIsRunning) {
        clearInterval(timerInterval);
        timerIsRunning = false;
      }
      timerDuration = minutes * 60;
      timerTimeLeft = minutes * 60;

      const tab25 = document.getElementById('timer-tab-25');
      const tab50 = document.getElementById('timer-tab-50');
      const tabShort = document.getElementById('timer-tab-short');
      const tabLong = document.getElementById('timer-tab-long');

      const activeTabStyle = 'px-4 py-2 rounded-xl bg-white/15 text-white font-bold border border-white/20 shadow-xs transition';
      const inactiveTabStyle = 'px-4 py-2 rounded-xl text-neutral-400 hover:text-white transition';

      [tab25, tab50, tabShort, tabLong].forEach(t => { if(t) t.className = inactiveTabStyle; });
      if (minutes === 25 && tab25) tab25.className = activeTabStyle;
      if (minutes === 50 && tab50) tab50.className = activeTabStyle;

      updateTimerUI();
    }

    function setBreakMode(minutes) {
      if (timerIsRunning) {
        clearInterval(timerInterval);
        timerIsRunning = false;
      }
      timerDuration = minutes * 60;
      timerTimeLeft = minutes * 60;

      const tab25 = document.getElementById('timer-tab-25');
      const tab50 = document.getElementById('timer-tab-50');
      const tabShort = document.getElementById('timer-tab-short');
      const tabLong = document.getElementById('timer-tab-long');

      const activeTabStyle = 'px-4 py-2 rounded-xl bg-white/15 text-white font-bold border border-white/20 shadow-xs transition';
      const inactiveTabStyle = 'px-4 py-2 rounded-xl text-neutral-400 hover:text-white transition';

      [tab25, tab50, tabShort, tabLong].forEach(t => { if(t) t.className = inactiveTabStyle; });
      if (minutes === 5 && tabShort) tabShort.className = activeTabStyle;
      if (minutes === 15 && tabLong) tabLong.className = activeTabStyle;

      updateTimerUI();
    }

    function toggleTimer() {
      if (timerIsRunning) {
        clearInterval(timerInterval);
        timerIsRunning = false;
        updateTimerUI();
      } else {
        timerIsRunning = true;
        updateTimerUI();
        timerInterval = setInterval(() => {
          if (timerTimeLeft > 0) {
            timerTimeLeft--;
            updateTimerUI();
          } else {
            handleTimerComplete();
          }
        }, 1000);
      }
    }

    function resetTimer() {
      clearInterval(timerInterval);
      timerIsRunning = false;
      timerTimeLeft = timerDuration;
      updateTimerUI();
    }

    function handleTimerComplete() {
      clearInterval(timerInterval);
      timerIsRunning = false;
      const minutesSpent = Math.round(timerDuration / 60);

      appState.user.todayStudiedMinutes += minutesSpent;
      const xpEarned = minutesSpent * 2;
      awardXP(xpEarned, 'Completed focus session');

      if (appState.activeTaskId) {
        const task = appState.tasks.find(t => t.id === appState.activeTaskId);
        if (task) {
          task.pomosDone++;
          if (task.pomosDone >= task.pomosEstimated) task.completed = true;
        }
      }

      saveState();
      alert(`🎉 Focus Session Complete! You logged ${minutesSpent}m of study and earned +${xpEarned} XP!`);
      resetTimer();
    }

    function updateTimerUI() {
      const mins = Math.floor(timerTimeLeft / 60);
      const secs = timerTimeLeft % 60;
      const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      
      document.title = `${formatted} — FocusMeet`;
      
      const dashClock = document.getElementById('dashboard-timer-display');
      if (dashClock) dashClock.textContent = formatted;

      const heroClock = document.getElementById('timer-hero-clock');
      if (heroClock) heroClock.textContent = formatted;

      const ring = document.getElementById('timer-hero-progress-ring');
      if (ring) {
        const circumference = 2 * Math.PI * 44;
        const fraction = timerTimeLeft / timerDuration;
        ring.style.strokeDashoffset = circumference * (1 - fraction);
      }

      const dashBtn = document.getElementById('dash-timer-btn-text');
      if (dashBtn) dashBtn.textContent = timerIsRunning ? 'PAUSE TIMER' : (timerTimeLeft === timerDuration ? 'START TIMER' : 'RESUME');

      const heroBtn = document.getElementById('timer-hero-toggle-text');
      if (heroBtn) heroBtn.textContent = timerIsRunning ? 'PAUSE FOCUS' : (timerTimeLeft === timerDuration ? 'START FOCUS' : 'RESUME');

      const heroState = document.getElementById('timer-hero-state-label');
      if (heroState) heroState.textContent = timerIsRunning ? 'Flow State Active' : 'Ready';

      const zenClock = document.getElementById('zen-timer-clock');
      if (zenClock) zenClock.textContent = formatted;
      const zenBtn = document.getElementById('btn-zen-timer-toggle');
      if (zenBtn) zenBtn.textContent = timerIsRunning ? 'PAUSE' : (timerTimeLeft === timerDuration ? 'START' : 'RESUME');
    }

    /* ==========================================================================
       HIGH-FIDELITY AMBIENT SOUND SYNTHESIZER (WEB AUDIO API)
       ========================================================================== */
    let audioCtx = null;
    let currentSoundNodes = [];
    let masterGainNode = null;
    let ambientVolume = 0.45; // 45% default

    function ensureAudioContext() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGainNode = audioCtx.createGain();
        masterGainNode.gain.setValueAtTime(ambientVolume, audioCtx.currentTime);
        masterGainNode.connect(audioCtx.destination);
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    }

    function setAmbientVolume(val) {
      ambientVolume = val / 100;
      document.getElementById('ambient-volume-label').textContent = `${val}%`;
      if (masterGainNode && audioCtx) {
        masterGainNode.gain.setTargetAtTime(ambientVolume, audioCtx.currentTime, 0.05);
      }
    }

    function stopAllAmbientSounds() {
      currentSoundNodes.forEach(node => {
        try {
          if (node.stop) node.stop();
          node.disconnect();
        } catch (e) {}
      });
      currentSoundNodes = [];
    }

    function setAmbientSound(type) {
      ensureAudioContext();
      stopAllAmbientSounds();

      // UI button state update
      ['off', 'rain', 'waves'].forEach(s => {
        const b = document.getElementById(`sound-${s}`);
        if (b) {
          if (s === type) b.className = 'px-2.5 py-1 rounded-lg bg-white text-black font-bold shadow-xs';
          else b.className = 'px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/10 border border-white/10 opacity-75 hover:opacity-100 font-semibold transition';
        }
      });

      const volumeContainer = document.getElementById('ambient-volume-container');
      if (type === 'off') {
        if (volumeContainer) volumeContainer.classList.add('hidden');
        return;
      }
      if (volumeContainer) {
        volumeContainer.classList.remove('hidden');
        volumeContainer.classList.add('flex');
      }

      if (type === 'rain') {
        startRainSound();
      } else if (type === 'waves') {
        startOceanWavesSound();
      }
    }

    // 🌧️ REALISTIC TRIPLE-LAYER RAINFALL: Deep ambient body + droplet patter + soft mist sizzle
    function startRainSound() {
      const bufferLength = audioCtx.sampleRate * 6; // 6-second seamless loop buffer
      const buffer = audioCtx.createBuffer(2, bufferLength, audioCtx.sampleRate);
      
      // Authentic Kellet pink-noise generator across stereo channels
      for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferLength; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.12;
          b6 = white * 0.115926;
        }
      }

      const rainSource = audioCtx.createBufferSource();
      rainSource.buffer = buffer;
      rainSource.loop = true;

      // Layer 1: Warm ambient rainfall body (Low roar)
      const lowFilter = audioCtx.createBiquadFilter();
      lowFilter.type = 'lowpass';
      lowFilter.frequency.setValueAtTime(850, audioCtx.currentTime);
      const lowGain = audioCtx.createGain();
      lowGain.gain.setValueAtTime(0.85, audioCtx.currentTime);

      // Layer 2: Roof & window droplet patter (Crisp mid texture)
      const patterFilter = audioCtx.createBiquadFilter();
      patterFilter.type = 'bandpass';
      patterFilter.frequency.setValueAtTime(1750, audioCtx.currentTime);
      patterFilter.Q.setValueAtTime(1.4, audioCtx.currentTime);
      const patterGain = audioCtx.createGain();
      patterGain.gain.setValueAtTime(0.40, audioCtx.currentTime);

      // Layer 3: Airy mist / high-frequency gentle drizzle
      const mistFilter = audioCtx.createBiquadFilter();
      mistFilter.type = 'highpass';
      mistFilter.frequency.setValueAtTime(3200, audioCtx.currentTime);
      const mistGain = audioCtx.createGain();
      mistGain.gain.setValueAtTime(0.06, audioCtx.currentTime);

      // Parallel node connections to master
      rainSource.connect(lowFilter);
      lowFilter.connect(lowGain);
      lowGain.connect(masterGainNode);

      rainSource.connect(patterFilter);
      patterFilter.connect(patterGain);
      patterGain.connect(masterGainNode);

      rainSource.connect(mistFilter);
      mistFilter.connect(mistGain);
      mistGain.connect(masterGainNode);

      rainSource.start();
      currentSoundNodes.push(rainSource, lowFilter, lowGain, patterFilter, patterGain, mistFilter, mistGain);
    }

    // 🌊 RHYTHMIC OCEAN WAVES: Dual-layer swell with rolling deep water & shore foam wash
    function startOceanWavesSound() {
      const bufferLength = audioCtx.sampleRate * 8; // 8-second seamless swell
      const buffer = audioCtx.createBuffer(2, bufferLength, audioCtx.sampleRate);
      
      // Brownian/Pink noise generator for heavy oceanic body
      for (let channel = 0; channel < 2; channel++) {
        const data = buffer.getChannelData(channel);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferLength; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.992 * b0 + white * 0.04;
          b1 = 0.96 * b1 + white * 0.12;
          b2 = 0.85 * b2 + white * 0.28;
          data[i] = (b0 + b1 + b2) * 0.45;
        }
      }

      const waveSource = audioCtx.createBufferSource();
      waveSource.buffer = buffer;
      waveSource.loop = true;

      // 1. Rolling Deep Wave Swell
      const waveFilter = audioCtx.createBiquadFilter();
      waveFilter.type = 'lowpass';
      waveFilter.frequency.setValueAtTime(420, audioCtx.currentTime);

      const waveGain = audioCtx.createGain();
      waveGain.gain.setValueAtTime(0.38, audioCtx.currentTime);

      // Wave Period: 0.10 Hz (~10-second natural ocean swell)
      const lfo = audioCtx.createOscillator();
      lfo.frequency.setValueAtTime(0.10, audioCtx.currentTime);

      // Sweeps cutoff cleanly between 120Hz and 720Hz (never goes negative)
      const lfoFilterGain = audioCtx.createGain();
      lfoFilterGain.gain.setValueAtTime(300, audioCtx.currentTime);
      lfo.connect(lfoFilterGain);
      lfoFilterGain.connect(waveFilter.frequency);

      // Sweeps gain cleanly between 0.08 and 0.68
      const lfoVolumeGain = audioCtx.createGain();
      lfoVolumeGain.gain.setValueAtTime(0.30, audioCtx.currentTime);
      lfo.connect(lfoVolumeGain);
      lfoVolumeGain.connect(waveGain.gain);

      waveSource.connect(waveFilter);
      waveFilter.connect(waveGain);
      waveGain.connect(masterGainNode);

      // 2. Shore Foam / Surf Wash (Whitecap spray on sand)
      const foamFilter = audioCtx.createBiquadFilter();
      foamFilter.type = 'bandpass';
      foamFilter.frequency.setValueAtTime(1450, audioCtx.currentTime);
      foamFilter.Q.setValueAtTime(1.1, audioCtx.currentTime);

      const foamGain = audioCtx.createGain();
      foamGain.gain.setValueAtTime(0.12, audioCtx.currentTime);

      // Foam swells naturally as the wave crests
      const lfoFoamGain = audioCtx.createGain();
      lfoFoamGain.gain.setValueAtTime(0.10, audioCtx.currentTime);
      lfo.connect(lfoFoamGain);
      lfoFoamGain.connect(foamGain.gain);

      waveSource.connect(foamFilter);
      foamFilter.connect(foamGain);
      foamGain.connect(masterGainNode);

      waveSource.start();
      lfo.start();
      currentSoundNodes.push(waveSource, lfo, waveFilter, waveGain, lfoFilterGain, lfoVolumeGain, foamFilter, foamGain, lfoFoamGain);
    }

    /* ==========================================================================
       TASK MANAGEMENT
       ========================================================================== */
    let currentFilter = 'all';

    function setTaskFilter(filter) {
      currentFilter = filter;
      renderTasks();
    }

    function renderTasks() {
      const dashContainer = document.getElementById('tasks-container');
      const fullContainer = document.getElementById('full-tasks-container');

      let filtered = appState.tasks;
      if (currentFilter === 'active') filtered = filtered.filter(t => !t.completed);
      else if (currentFilter === 'completed') filtered = filtered.filter(t => t.completed);
      else if (currentFilter !== 'all') filtered = filtered.filter(t => t.category === currentFilter);

      document.getElementById('priority-tasks-count').textContent = appState.tasks.filter(t => !t.completed).length;

      const taskHtml = filtered.length === 0 ? `
        <div class="py-8 text-center text-slate-500 dark:text-slate-400">
          <p class="text-xs font-semibold">No tasks found</p>
          <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Add a task to earn XP and stay on target.</p>
        </div>
      ` : filtered.map(task => {
        const isActive = task.id === appState.activeTaskId;
        const subjectPill = {
          Mathematics: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
          Physics: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
          'Computer Science': 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
          Chemistry: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
        }[task.category] || 'bg-slate-500/10 text-slate-600 border-slate-500/20';

        return `
          <div class="flex items-center justify-between p-3 rounded-xl border transition ${
            isActive ? 'bg-white/10 border-white/30 text-white shadow-xs' : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10'
          }">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <input type="checkbox" onchange="toggleTaskDone('${task.id}')" ${task.completed ? 'checked' : ''} class="w-4 h-4 rounded accent-indigo-600 cursor-pointer">
              <div class="flex-1 min-w-0">
                <p onclick="setActiveTask('${task.id}')" class="text-xs sm:text-sm font-semibold cursor-pointer truncate ${task.completed ? 'line-through opacity-50' : 'text-inherit'}">
                  ${task.title}
                </p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-[10px] px-2 py-0.5 rounded border font-semibold ${subjectPill}">${task.category}</span>
                  <span class="text-[10px] opacity-75 font-mono">🍅 ${task.pomosDone}/${task.pomosEstimated}</span>
                  ${task.time ? `<span class="text-[10px] opacity-60">⏰ ${task.time}</span>` : ''}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-1.5 ml-2">
              <button onclick="setActiveTask('${task.id}')" title="Focus This" class="p-1.5 rounded-lg ${isActive ? 'theme-accent-btn' : 'opacity-60 hover:opacity-100'} transition">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              </button>
              <button onclick="deleteTask('${task.id}')" title="Delete" class="p-1.5 rounded-lg opacity-50 hover:opacity-100 hover:text-rose-500 transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          </div>
        `;
      }).join('');

      if (dashContainer) dashContainer.innerHTML = taskHtml;
      if (fullContainer) fullContainer.innerHTML = taskHtml;
    }

    function toggleTaskDone(id) {
      const task = appState.tasks.find(t => t.id === id);
      if (task) {
        task.completed = !task.completed;
        if (task.completed) awardXP(30, 'Completed task');
        saveState();
      }
    }

    function setActiveTask(id) {
      appState.activeTaskId = id;
      saveState();
      switchView('timer');
    }

    function deleteTask(id) {
      appState.tasks = appState.tasks.filter(t => t.id !== id);
      if (appState.activeTaskId === id) appState.activeTaskId = appState.tasks[0]?.id || null;
      saveState();
    }

    function quickAddTask(e) {
      e.preventDefault();
      const input = document.getElementById('quick-task-title') || document.getElementById('quick-task-full');
      const title = input.value.trim();
      if (!title) return;

      const newTask = {
        id: Date.now().toString(),
        title,
        category: 'Mathematics',
        priority: 'Medium',
        pomosEstimated: 2,
        pomosDone: 0,
        completed: false,
        time: ''
      };
      appState.tasks.unshift(newTask);
      appState.activeTaskId = newTask.id;
      input.value = '';
      awardXP(10, 'Created new task');
      saveState();
    }

    function handleSaveTask(e) {
      e.preventDefault();
      const title = document.getElementById('task-input-title').value.trim();
      const category = document.getElementById('task-input-category').value;
      const priority = document.getElementById('task-input-priority').value;
      const pomosEstimated = parseInt(document.getElementById('task-input-pomos').value) || 2;
      const time = document.getElementById('task-input-time').value;

      if (!title) return;
      const newTask = {
        id: Date.now().toString(),
        title,
        category,
        priority,
        pomosEstimated,
        pomosDone: 0,
        completed: false,
        time
      };
      appState.tasks.unshift(newTask);
      appState.activeTaskId = newTask.id;
      closeModal('modal-task');
      awardXP(15, 'Created new task');
      saveState();
    }

    /* ==========================================================================
       TIMETABLE LOGIC
       ========================================================================== */
    let selectedDay = 'Monday';

    function changeScheduleDay(day) {
      selectedDay = day;
      renderTimetable();
    }

    function renderTimetable() {
      const container = document.getElementById('timetable-slots-container');
      if (!container) return;

      const dayBlocks = appState.timetable
        .filter(b => b.day.toLowerCase() === selectedDay.toLowerCase())
        .sort((a, b) => a.start.localeCompare(b.start));

      if (dayBlocks.length === 0) {
        container.innerHTML = `
          <div class="p-6 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl">
            <p class="text-xs font-semibold">No schedule slots for ${selectedDay}</p>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Click "+ Add Timetable Block" to add your classes.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = dayBlocks.map(b => `
        <div class="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 transition">
          <div class="flex items-center gap-3">
            <div class="flex flex-col font-mono text-center min-w-[65px]">
              <span class="text-xs font-bold">${b.start}</span>
              <span class="text-[10px] text-slate-500 dark:text-slate-400">${b.end}</span>
            </div>
            <div class="border-l border-slate-300 dark:border-slate-700 pl-3">
              <p class="text-xs font-bold text-neutral-100">${b.title}</p>
              <span class="text-[10px] font-semibold opacity-75">${b.tag}</span>
            </div>
          </div>
          <div class="flex items-center gap-1.5">
            <button onclick="setTimerTargetFromSchedule('${b.title.replace(/'/g, "\\'")}')" title="Set as Active Focus Session Target" class="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold text-[10px] transition border border-indigo-500/30 flex items-center gap-1">
              <span>🎯</span><span>Focus</span>
            </button>
            <button onclick="deleteTimetableBlock('${b.id}')" title="Delete" class="p-1 rounded-lg opacity-40 hover:opacity-100 hover:text-rose-500 transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      `).join('');
    }

    function setTimerTargetFromSchedule(title) {
      const targetEl = document.getElementById('timer-hero-target-task');
      if (targetEl) {
        targetEl.textContent = title;
        targetEl.classList.add('text-amber-300', 'font-black');
        setTimeout(() => {
          targetEl.classList.remove('text-amber-300', 'font-black');
        }, 1500);
      }
      switchView('timer');
    }

    function deleteTimetableBlock(id) {
      if (confirm('Delete this timetable slot?')) {
        appState.timetable = appState.timetable.filter(b => b.id !== id);
        saveState();
        renderTimetable();
      }
    }

    function handleSaveBlock(e) {
      e.preventDefault();
      const title = document.getElementById('block-input-title').value.trim();
      const day = document.getElementById('block-input-day').value;
      const tag = document.getElementById('block-input-tag').value;
      const start = document.getElementById('block-input-start').value;
      const end = document.getElementById('block-input-end').value;

      if (!title || !start || !end) return;

      const newBlock = { id: 'b_' + Date.now(), day, title, tag, start, end };
      appState.timetable.push(newBlock);
      saveState();
      closeModal('modal-block');
      selectedDay = day;
      document.getElementById('schedule-day-select').value = day;
      renderTimetable();
    }

    /* MODAL CONTROLS */
    function openNewTaskModal() {
      document.getElementById('modal-task').classList.remove('hidden');
      document.getElementById('modal-task').classList.add('flex');
    }

    function openAddBlockModal() {
      document.getElementById('modal-block').classList.remove('hidden');
      document.getElementById('modal-block').classList.add('flex');
    }

    function closeModal(id) {
      document.getElementById(id).classList.add('hidden');
      document.getElementById(id).classList.remove('flex');
    }

    /* 3D SANCTUARY ZEN CONTROLS */
    function open3DZenModal() {
      const modal = document.getElementById('modal-3d-zen');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.classList.add('overflow-hidden');
      }
    }

    function close3DZenModal() {
      const modal = document.getElementById('modal-3d-zen');
      if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.classList.remove('overflow-hidden');
      }
    }

    function reload3DScene() {
      const viewer = document.getElementById('spline-hero-viewer');
      if (viewer) {
        const url = viewer.getAttribute('url');
        viewer.removeAttribute('url');
        setTimeout(() => {
          viewer.setAttribute('url', url);
        }, 50);
      }
    }

    function initSplineViewer() {
      const viewer = document.getElementById('spline-hero-viewer');
      const skeleton = document.getElementById('spline-loading-skeleton');
      if (viewer) {
        viewer.addEventListener('load-complete', () => {
          if (skeleton) {
            skeleton.classList.add('opacity-0');
            setTimeout(() => {
              if (skeleton && skeleton.parentNode) skeleton.remove();
            }, 700);
          }
          try {
            const logo = viewer.shadowRoot?.querySelector('#logo') || viewer.shadowRoot?.querySelector('a[href*="spline"]');
            if (logo) logo.remove();
          } catch (e) {}
        });
      }

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          close3DZenModal();
          closeModal('modal-legal-reader');
        }
      });
    }

    /* ==========================================================================
       LEGAL COMPLIANCE & PRIVACY ENGINE
       ========================================================================== */
    function openLegalModal(tab = 'privacy') {
      const modal = document.getElementById('modal-legal-reader');
      if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        switchLegalTab(tab);
      }
    }

    function switchLegalTab(tab) {
      const tabs = ['privacy', 'terms', 'cookies'];
      tabs.forEach(t => {
        const btn = document.getElementById(`tab-legal-${t}`);
        const content = document.getElementById(`legal-content-${t}`);
        if (t === tab) {
          if (btn) btn.className = 'py-2 rounded-xl theme-card shadow-xs transition';
          if (content) content.classList.remove('hidden');
        } else {
          if (btn) btn.className = 'py-2 rounded-xl opacity-75 hover:opacity-100 transition';
          if (content) content.classList.add('hidden');
        }
      });
      const scrollable = document.querySelector('#modal-legal-reader .overflow-y-auto');
      if (scrollable) scrollable.scrollTop = 0;
    }

    /* COOKIE & LOCAL STORAGE CONSENT ENGINE */
    const COOKIE_CONSENT_KEY = 'focusmeet_cookie_consent';

    function initCookieConsent() {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!consent) {
        setTimeout(() => {
          const banner = document.getElementById('cookie-consent-banner');
          if (banner) banner.classList.remove('hidden');
        }, 1200);
      }
    }

    function acceptCookieConsent() {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
      dismissCookieConsent();
    }

    function dismissCookieConsent() {
      const banner = document.getElementById('cookie-consent-banner');
      if (banner) banner.classList.add('hidden');
    }

    /* ==========================================================================
       PROCEDURAL DOTTED GRID INTERACTIVE LANDING ENGINE
       ========================================================================== */
    const DOTTED_GRID_SPACING = 24;
    const DOTTED_GRID_BASE_RADIUS = 2.0;
    const DOTTED_GRID_MOUSE_RADIUS = 380;
    const DOTTED_GRID_TRAIL_LENGTH = 456;
    const DOTTED_GRID_TRAIL_RADIUS = 230;
    const DOTTED_GRID_TRAIL_FADE_MS = 1200;
    const DG_RANDOM_TIME = 0.6;
    const DG_COLLECT_TIME = 1.1;
    const DG_TOTAL_SHAPES = 5;

    const DG_SHAPE_NAMES = [
      "Harmonic Star",
      "Orthogonal Square",
      "Orbital Ring",
      "Cartesian Cross",
      "Kinetic Triangle"
    ];

    const dgLerp = (a, b, t) => a + (b - a) * t;
    const dgClamp01 = (v) => Math.max(0, Math.min(1, v));
    const dgSmoothstep = (e0, e1, v) => {
      const t = dgClamp01((v - e0) / (e1 - e0));
      return t * t * (3 - 2 * t);
    };

    const dgGetStarStrength = (x, y, time, width, height) => {
      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height) * 0.44;
      const nx = (x - cx) / scale;
      const ny = (y - cy) / scale;
      const r = Math.sqrt(nx * nx + ny * ny);
      const angle = Math.atan2(ny, nx);
      const spikes = 5;
      const star = Math.cos(spikes * angle);
      const radius = 0.56 + 0.28 * star;
      return dgClamp01(1 - dgSmoothstep(radius - 0.05, radius + 0.05, r));
    };

    const dgGetSquareStrength = (x, y, width, height) => {
      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height) * 0.40;
      const rx = (x - cx) / scale;
      const ry = (y - cy) / scale;
      const d = Math.max(Math.abs(rx), Math.abs(ry));
      return dgClamp01(1 - dgSmoothstep(0.78, 0.84, d));
    };

    const dgGetCircleRingStrength = (x, y, width, height) => {
      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height) * 0.44;
      const r = Math.sqrt(((x - cx) / scale) ** 2 + ((y - cy) / scale) ** 2);
      return dgClamp01(1 - dgSmoothstep(0.12, 0.18, Math.abs(r - 0.74)));
    };

    const dgGetPlusStrength = (x, y, width, height) => {
      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height) * 0.42;
      const rx = (x - cx) / scale;
      const ry = (y - cy) / scale;
      const thickness = 0.20;
      const length = 0.80;
      const vertical = Math.abs(rx) < thickness && Math.abs(ry) < length;
      const horizontal = Math.abs(ry) < thickness && Math.abs(rx) < length;
      const d = Math.min(
        Math.max(Math.abs(rx) - thickness, Math.abs(ry) - length),
        Math.max(Math.abs(ry) - thickness, Math.abs(rx) - length)
      );
      return vertical || horizontal ? 1 : dgClamp01(1 - dgSmoothstep(0, 0.06, d));
    };

    const dgGetTriangleStrength = (x, y, time, width, height) => {
      const cx = width / 2;
      const cy = height / 2;
      const scale = Math.min(width, height) * 0.46;
      const rotation = Math.sin(time * 0.3) * 0.12;
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      const rx = ((x - cx) * cos - (y - cy) * sin) / scale;
      const ry = ((x - cx) * sin + (y - cy) * cos) / scale;
      const a = Math.abs(rx) * 0.9 + ry * 0.52;
      const b = -ry * 0.95;
      return dgClamp01(1 - dgSmoothstep(0.40, 0.52, Math.max(a, b)));
    };

    const dgGetRawShapeStrength = (shapeIndex, x, y, time, width, height) => {
      const i = shapeIndex % DG_TOTAL_SHAPES;
      if (i === 0) return dgGetStarStrength(x, y, time, width, height);
      if (i === 1) return dgGetSquareStrength(x, y, width, height);
      if (i === 2) return dgGetCircleRingStrength(x, y, width, height);
      if (i === 3) return dgGetPlusStrength(x, y, width, height);
      return dgGetTriangleStrength(x, y, time, width, height);
    };

    let dgCanvas = null;
    let dgCtx = null;
    let dgWidth = 0;
    let dgHeight = 0;
    let dgDpr = 1;
    let dgDots = [];

    const dgPatternState = {
      currentShapeIndex: 0,
      transitionStartTime: null
    };

    const dgMouse = {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      active: false,
      trail: []
    };

    function dgGetShapeData(x, y, time) {
      const { currentShapeIndex, transitionStartTime } = dgPatternState;
      const shapeStrength = dgGetRawShapeStrength(currentShapeIndex, x, y, time, dgWidth, dgHeight);

      if (transitionStartTime === null) {
        return { shapeStrength, randomStrength: 0, grayDisperseStrength: 0 };
      }

      const cyclePosition = time - transitionStartTime;

      if (cyclePosition < DG_RANDOM_TIME) {
        return { shapeStrength: 0, randomStrength: 1, grayDisperseStrength: 0.35 };
      }

      if (cyclePosition < DG_RANDOM_TIME + DG_COLLECT_TIME) {
        const eased = dgSmoothstep(0, 1, (cyclePosition - DG_RANDOM_TIME) / DG_COLLECT_TIME);
        return {
          shapeStrength: shapeStrength * eased,
          randomStrength: 1 - eased,
          grayDisperseStrength: 0.35 * (1 - eased)
        };
      }

      return { shapeStrength, randomStrength: 0, grayDisperseStrength: 0 };
    }

function dgDrawDot(x, y, radius, brightness, grayDisperseStrength, trailStrength, mouseStrength, shapeStrength = 0) {
      const isLight = document.body.classList.contains('theme-light');
      let alpha, hue, saturation, finalLightness;

      if (isLight) {
        // High-contrast clean rendering for Light Mode
        const mouseGlow = mouseStrength * 0.40;
        const trailGlow = trailStrength * 0.35;
        const baseAlpha = dgLerp(0.22, 0.94, shapeStrength);
        alpha = dgClamp01(baseAlpha + brightness * 0.15 + mouseGlow + trailGlow);

        const hoverTint = Math.max(shapeStrength, mouseStrength * 0.75, trailStrength * 0.60);
        hue = dgLerp(215, 36, hoverTint);
        saturation = dgLerp(15, 100, hoverTint);
        finalLightness = dgLerp(62, 22, hoverTint);
      } else {
        const mouseGlow = mouseStrength * 0.35;
        const trailGlow = trailStrength * 0.28;

        const baseAlpha = dgLerp(0.36, 0.98, shapeStrength);
        alpha = dgClamp01(baseAlpha + brightness * 0.22 + mouseGlow + trailGlow);

        const normalL = 26 + brightness * 36;
        const disperseL = 20 + brightness * 30 + grayDisperseStrength * 20;
        const bgLightness = dgLerp(normalL, disperseL, grayDisperseStrength);
        const shapeLightness = 62 + brightness * 8;
        const lightness = dgLerp(bgLightness, shapeLightness, shapeStrength);

        const mouseLift = mouseStrength * 36;
        const trailLift = trailStrength * 38;
        finalLightness = dgClamp01((lightness + mouseLift + trailLift) / 100) * 100;

        const hoverTint = Math.max(shapeStrength, mouseStrength * 0.75, trailStrength * 0.60);
        hue = dgLerp(215, 48, hoverTint);
        saturation = dgLerp(10, 100, hoverTint);
      }

      dgCtx.beginPath();
      dgCtx.fillStyle = `hsla(${hue}, ${saturation}%, ${finalLightness}%, ${alpha})`;
      dgCtx.arc(x, y, radius, 0, Math.PI * 2);
      dgCtx.fill();
    }

    function createDgDots() {
      dgDots = [];
      const time = performance.now() * 0.001;
      for (let y = DOTTED_GRID_SPACING / 2; y < dgHeight; y += DOTTED_GRID_SPACING) {
        for (let x = DOTTED_GRID_SPACING / 2; x < dgWidth; x += DOTTED_GRID_SPACING) {
          const { shapeStrength } = dgGetShapeData(x, y, time);
          dgDots.push({
            x,
            y,
            phase: Math.random() * Math.PI * 2,
            speed: 0.3 + Math.random() * 1.0,
            randomOffset: Math.random() * 10,
            currentShapeStrength: shapeStrength,
            currentRandomStrength: 0,
            currentMouseStrength: 0,
            currentTrailStrength: 0,
            currentGrayDisperseStrength: 0
          });
        }
      }
    }

    function resizeDottedGrid() {
      if (!dgCanvas) dgCanvas = document.getElementById('dotted-grid-canvas');
      if (!dgCanvas) return;
      if (!dgCtx) dgCtx = dgCanvas.getContext('2d', { alpha: false });

      dgWidth = window.innerWidth;
      dgHeight = window.innerHeight;
      dgDpr = Math.min(window.devicePixelRatio || 1, 2);
      dgCanvas.width = Math.floor(dgWidth * dgDpr);
      dgCanvas.height = Math.floor(dgHeight * dgDpr);
      dgCtx.setTransform(dgDpr, 0, 0, dgDpr, 0, 0);
      createDgDots();
    }

    function initDottedGrid() {
      dgCanvas = document.getElementById('dotted-grid-canvas');
      if (!dgCanvas) return;
      dgCtx = dgCanvas.getContext('2d', { alpha: false });

      window.addEventListener('resize', resizeDottedGrid);

      // Global window-wide cursor tracking for full-site background interactivity
      window.addEventListener('pointermove', (e) => {
        dgMouse.targetX = e.clientX;
        dgMouse.targetY = e.clientY;
        dgMouse.active = true;
        dgMouse.trail.push({ x: e.clientX, y: e.clientY, t: performance.now() });
        if (dgMouse.trail.length > DOTTED_GRID_TRAIL_LENGTH) {
          dgMouse.trail.shift();
        }
      });

      window.addEventListener('pointerleave', () => {
        dgMouse.active = false;
      });

      // Native mobile touch tracking for fluid interactive ripple effects on mobile screens
      window.addEventListener('touchstart', (e) => {
        if (e.touches && e.touches.length > 0) {
          const t = e.touches[0];
          dgMouse.targetX = t.clientX;
          dgMouse.targetY = t.clientY;
          dgMouse.active = true;
          dgMouse.trail.push({ x: t.clientX, y: t.clientY, t: performance.now() });
          if (dgMouse.trail.length > DOTTED_GRID_TRAIL_LENGTH) dgMouse.trail.shift();
        }
      }, { passive: true });

      window.addEventListener('touchmove', (e) => {
        if (e.touches && e.touches.length > 0) {
          const t = e.touches[0];
          dgMouse.targetX = t.clientX;
          dgMouse.targetY = t.clientY;
          dgMouse.active = true;
          dgMouse.trail.push({ x: t.clientX, y: t.clientY, t: performance.now() });
          if (dgMouse.trail.length > DOTTED_GRID_TRAIL_LENGTH) dgMouse.trail.shift();
        }
      }, { passive: true });

      window.addEventListener('touchend', () => {
        setTimeout(() => { dgMouse.active = false; }, 350);
      }, { passive: true });

      // Global click on empty page backdrop morphs procedural geometry!
      window.addEventListener('click', (e) => {
        if (e.target.closest('button, a, input, select, textarea, [data-interactive], form')) {
          return;
        }
        morphNextShape();
      });

      resizeDottedGrid();
      dgRenderLoop(performance.now());
    }

    function morphNextShape() {
      dgPatternState.currentShapeIndex = (dgPatternState.currentShapeIndex + 1) % DG_TOTAL_SHAPES;
      dgPatternState.transitionStartTime = performance.now() * 0.001;
      updateShapeUIIndicators();
    }

    function setSpecificShape(idx) {
      dgPatternState.currentShapeIndex = idx % DG_TOTAL_SHAPES;
      dgPatternState.transitionStartTime = performance.now() * 0.001;
      updateShapeUIIndicators();
    }

    function updateShapeUIIndicators() {
      const cur = dgPatternState.currentShapeIndex;
      const indicator = document.getElementById('active-shape-indicator');
      if (indicator) indicator.textContent = DG_SHAPE_NAMES[cur];
      const counter = document.getElementById('shape-counter-badge');
      if (counter) counter.textContent = cur + 1;

      const navIndicator = document.getElementById('nav-active-shape-name');
      if (navIndicator) {
        navIndicator.textContent = DG_SHAPE_NAMES[cur].replace(/^(Harmonic |Orthogonal |Orbital |Cartesian |Kinetic )/, '');
      }

      for (let i = 0; i < 5; i++) {
        const pill = document.getElementById(`shape-pill-${i}`);
        if (pill) {
          if (i === cur) {
            pill.className = "cursor-pointer p-2.5 rounded-xl border transition-all duration-300 bg-amber-400/20 border-amber-400/50 shadow-[0_0_15px_rgba(250,204,21,0.25)] text-amber-300";
          } else {
            pill.className = "cursor-pointer p-2.5 rounded-xl border transition-all duration-300 bg-white/[0.03] border-white/10 text-neutral-400 hover:text-neutral-200 hover:border-white/20";
          }
        }
      }
    }

    function dgRenderLoop(ms) {
      const time = (ms || performance.now()) * 0.001;
      const now = performance.now();

      dgMouse.x = dgLerp(dgMouse.x, dgMouse.targetX, 0.12);
      dgMouse.y = dgLerp(dgMouse.y, dgMouse.targetY, 0.12);

      const isLight = document.body.classList.contains("theme-light");
      dgCtx.fillStyle = isLight ? "#eaedf1" : "#000000";
      dgCtx.fillRect(0, 0, dgWidth, dgHeight);

      for (let i = 0; i < dgDots.length; i++) {
        const dot = dgDots[i];
        const { shapeStrength, randomStrength, grayDisperseStrength } = dgGetShapeData(dot.x, dot.y, time);

        dot.currentShapeStrength = dgLerp(dot.currentShapeStrength, shapeStrength, 0.12);
        dot.currentRandomStrength = dgLerp(dot.currentRandomStrength, randomStrength, 0.14);
        dot.currentGrayDisperseStrength = dgLerp(dot.currentGrayDisperseStrength, grayDisperseStrength, 0.14);

        let targetMouseStrength = 0;
        if (dgMouse.active) {
          const dx = dot.x - dgMouse.x;
          const dy = dot.y - dgMouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < DOTTED_GRID_MOUSE_RADIUS) {
            const norm = dist / DOTTED_GRID_MOUSE_RADIUS;
            targetMouseStrength = (1 - norm) * (1 - norm) * (1 - norm);
          }
        }
        dot.currentMouseStrength = dgLerp(dot.currentMouseStrength, targetMouseStrength, 0.12);

        let targetTrailStrength = 0;
        for (let j = 0; j < dgMouse.trail.length; j++) {
          const pt = dgMouse.trail[j];
          const age = (now - pt.t) / DOTTED_GRID_TRAIL_FADE_MS;
          if (age >= 1) continue;
          const ageFade = (1 - age) * (1 - age) * (1 - age);
          const positionFade = (j + 1) / dgMouse.trail.length;
          const fade = ageFade * positionFade;
          const dx = dot.x - pt.x;
          const dy = dot.y - pt.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < DOTTED_GRID_TRAIL_RADIUS) {
            const proximity = 1 - dgSmoothstep(0, 1, dist / DOTTED_GRID_TRAIL_RADIUS);
            targetTrailStrength = Math.max(targetTrailStrength, (proximity ** 3) * fade);
          }
        }
        dot.currentTrailStrength = dgLerp(dot.currentTrailStrength, targetTrailStrength, 0.08);

        const randomBlink = Math.sin(time * (1.2 + dot.speed * 1.2) + dot.phase + dot.randomOffset + dot.x * 0.02 + dot.y * 0.016) ** 2;
        const softPulse = Math.sin(time * 1.4 + dot.phase + dot.x * 0.015) ** 2;

        const stableBrightness = dgClamp01(0.20 + dot.currentShapeStrength * 0.80 + softPulse * 0.04);
        const randomBrightness = dgClamp01(0.20 + randomBlink * 0.30);
        const brightness = dgLerp(stableBrightness, randomBrightness, dot.currentRandomStrength);

        const grayDisperseBlink = dgClamp01(dot.currentGrayDisperseStrength * (0.45 + randomBlink * 0.55));
        const mouseLiftRadius = 1 + dot.currentMouseStrength * 0.45;
        const trailLiftRadius = 1 + dot.currentTrailStrength * 0.35;

        // Base radius: idle dots are crisp 2.0px; yellow shape dots expand to 3.6px with radiant presence
        const stableRadius = (DOTTED_GRID_BASE_RADIUS + dot.currentShapeStrength * 1.6);
        const randomRadius = DOTTED_GRID_BASE_RADIUS + randomBlink * 0.5;
        const radius = dgLerp(stableRadius, randomRadius, dot.currentRandomStrength) * mouseLiftRadius * trailLiftRadius;

        dgDrawDot(dot.x, dot.y, radius, brightness, grayDisperseBlink, dot.currentTrailStrength, dot.currentMouseStrength, dot.currentShapeStrength);
      }

      requestAnimationFrame(dgRenderLoop);
    }

    /* Interactive Landing Timer Engine */
    let landingTimerTotal = 25 * 60;
    let landingTimerRemaining = 25 * 60;
    let landingTimerRunning = false;
    let landingTimerInterval = null;

    function updateLandingClockDisplay() {
      const elem = document.getElementById('landing-timer-clock');
      if (!elem) return;
      const mins = Math.floor(landingTimerRemaining / 60).toString().padStart(2, '0');
      const secs = (landingTimerRemaining % 60).toString().padStart(2, '0');
      elem.textContent = `${mins}:${secs}`;
    }

    function toggleLandingTimer() {
      const btn = document.getElementById('btn-landing-timer-toggle');
      if (landingTimerRunning) {
        clearInterval(landingTimerInterval);
        landingTimerRunning = false;
        if (btn) btn.textContent = 'Resume Focus Session';
      } else {
        landingTimerRunning = true;
        if (btn) btn.textContent = 'Pause Interval';
        landingTimerInterval = setInterval(() => {
          if (landingTimerRemaining > 0) {
            landingTimerRemaining--;
            updateLandingClockDisplay();
          } else {
            clearInterval(landingTimerInterval);
            landingTimerRunning = false;
            if (btn) btn.textContent = 'Interval Complete!';
            awardXP(25, 'Completed landing focus interval');
          }
        }, 1000);
      }
    }

    function resetLandingTimer() {
      clearInterval(landingTimerInterval);
      landingTimerRunning = false;
      landingTimerRemaining = landingTimerTotal;
      updateLandingClockDisplay();
      const btn = document.getElementById('btn-landing-timer-toggle');
      if (btn) btn.textContent = 'Start Focus Session';
    }

    function setLandingTimerPreset(mins) {
      clearInterval(landingTimerInterval);
      landingTimerRunning = false;
      landingTimerTotal = mins * 60;
      landingTimerRemaining = landingTimerTotal;
      updateLandingClockDisplay();
      const btn = document.getElementById('btn-landing-timer-toggle');
      if (btn) btn.textContent = 'Start Focus Session';

      ['25', '5', '15'].forEach(m => {
        const b = document.getElementById(`landing-mode-${m}`);
        if (b) {
          if (m === String(mins)) {
            b.className = "px-3 py-1 rounded-lg bg-white text-black font-bold shadow-xs transition";
          } else {
            b.className = "px-3 py-1 rounded-lg text-neutral-400 hover:text-white transition";
          }
        }
      });
    }

    /* RENDER FULL UI */
    function renderUI() {
      const u = appState.user;

      const dateElem = document.getElementById('current-date-display');
      if (dateElem) {
        const now = new Date();
        dateElem.textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
      }

      const quickStreak = document.getElementById('hero-quick-streak');
      if (quickStreak) quickStreak.textContent = `🔥 ${u.streakDays} Days`;
      const quickMins = document.getElementById('hero-quick-mins');
      if (quickMins) quickMins.textContent = `${u.todayStudiedMinutes} / ${u.dailyTargetMinutes}m`;
      const quickXp = document.getElementById('hero-quick-xp');
      if (quickXp) quickXp.textContent = `⚡ ${u.totalXp} XP`;

      safeSetText('badge-lvl', `Lvl ${u.level}`);
      safeSetText('badge-xp', `${u.totalXp} XP`);

      safeSetText('streak-days', `${u.streakDays} day`);
      safeSetText('card-streak-val', `${u.streakDays} Days`);

      safeSetText('menu-user-rank', `${u.levelTitle} (Lvl ${u.level})`);
      safeSetText('menu-user-xp', `${u.totalXp} XP`);

      const pct = Math.min(100, Math.round((u.todayStudiedMinutes / u.dailyTargetMinutes) * 100));
      safeSetText('study-target-pct', `${pct}%`);
      safeSetText('card-study-mins', `${u.todayStudiedMinutes}m`);
      safeSetText('card-study-goal-label', `/ ${u.dailyTargetMinutes}m goal`);
      safeSetWidth('study-progress-bar', `${pct}%`);
      safeSetText('study-progress-label', `${pct}% accomplished`);
      safeSetText('study-mins-left', `${Math.max(0, u.dailyTargetMinutes - u.todayStudiedMinutes)}m left`);

      safeSetWidth('goal-progress-daily', `${pct}%`);
      safeSetText('goal-daily-status', `${u.todayStudiedMinutes} / ${u.dailyTargetMinutes} minutes logged today`);

      safeSetText('gamification-level-title', `Level ${u.level} • ${u.levelTitle}`);
      safeSetText('gamification-total-xp', `${u.totalXp} XP Total`);
      const xpNeeded = u.xpForNextLevel - u.currentXp;
      safeSetText('gamification-xp-next', `${xpNeeded} XP needed to reach Level ${u.level + 1}`);
      const lvlPct = Math.min(100, Math.round((u.currentXp / u.xpForNextLevel) * 100));
      safeSetWidth('gamification-xp-bar', `${lvlPct}%`);
      safeSetText('gamification-xp-stat', `${lvlPct}% (${u.currentXp} / ${u.xpForNextLevel} XP)`);

      const doneCount = appState.tasks.filter(t => t.completed).length;
      const totalCount = appState.tasks.length;
      safeSetText('card-tasks-done', doneCount);
      safeSetText('card-tasks-total', `/ ${totalCount} total today`);
      safeSetText('card-tasks-pending', `${totalCount - doneCount} pending tasks remaining today.`);

      const active = appState.tasks.find(t => t.id === appState.activeTaskId);
      const activeTitle = active ? active.title : 'Free flow focus';
      safeSetText('focus-station-task-name', activeTitle);
      safeSetText('timer-hero-target-task', activeTitle);

      renderTasks();
      renderTimetable();
    }

        /* ==========================================================================
       FOCUSMEET STUDY LOUNGE & REAL-TIME COMMUNITY CHAT ENGINE
       ========================================================================== */
    const LOUNGE_STORAGE_PREFIX = 'focusmeet_lounge_messages_v1_';
    const LOUNGE_STATUS_KEY = 'focusmeet_lounge_my_status_v1';
    const LOUNGE_SOUND_KEY = 'focusmeet_lounge_sound_v1';

    const LOUNGE_ROOMS = {
      'silent-library': {
        id: 'silent-library',
        name: 'Silent Library',
        emoji: '☕',
        badge: 'Deep Quiet Zone',
        desc: 'Strictly quiet co-working. Share your active focus task and send 1-click cheers.',
        timerDesc: '25m Silent Sprint',
        onlineCount: 8,
        peers: [
          { name: 'Maya Lin', level: 4, rank: 'Task Architect', subject: 'Linear Algebra: Eigenvalues & Vector Spaces', status: 'Focusing', minsLeft: 14, avatarColor: 'from-purple-500 to-indigo-600' },
          { name: 'David Kim', level: 3, rank: 'Consistent Scholar', subject: 'Python Data Structures: Trie Search', status: 'Focusing', minsLeft: 21, avatarColor: 'from-emerald-500 to-teal-600' },
          { name: 'Elena Rostova', level: 6, rank: 'Deep Sage', subject: 'Biochemistry: Krebs Cycle Pathways', status: 'Break', minsLeft: 3, avatarColor: 'from-amber-500 to-orange-600' },
          { name: 'Samir Patel', level: 2, rank: 'Focused Learner', subject: 'Microeconomics: Market Equilibrium', status: 'Focusing', minsLeft: 8, avatarColor: 'from-blue-500 to-cyan-600' },
          { name: 'Amara Okafor', level: 5, rank: 'Pomodoro Pro', subject: 'AP History: European Industrial Revolution', status: 'Focusing', minsLeft: 17, avatarColor: 'from-rose-500 to-pink-600' }
        ],
        seedMessages: [
          { id: 'm1', sender: 'David Kim', level: 3, isMe: false, text: 'Starting sprint 3 on Trie structures. 25 mins no distractions! 🎯', isCheer: true, emoji: '🎯', topic: 'Python Data Structures', time: '10:42 PM' },
          { id: 'm2', sender: 'Maya Lin', level: 4, isMe: false, text: 'Stay locked in everyone! Linear algebra proofs almost done. 💪', isCheer: true, emoji: '💪', topic: 'Linear Algebra', time: '10:48 PM' },
          { id: 'm3', sender: 'Elena Rostova', level: 6, isMe: false, text: 'Just crushed a 50-minute double pomodoro! Quick tea break now. ☕', isCheer: false, emoji: '', topic: 'Biochemistry', time: '10:55 PM' }
        ]
      },
      'stem-code': {
        id: 'stem-code',
        name: 'STEM & Problem Solving',
        emoji: '📐',
        badge: 'Logic & Code Lab',
        desc: 'Mathematics, Computer Science, Physics and Engineering problem sets.',
        timerDesc: 'Deep Problem Solving',
        onlineCount: 6,
        peers: [
          { name: 'Kenji Sato', level: 5, rank: 'Code Master', subject: 'LeetCode Dynamic Programming (Hard)', status: 'Focusing', minsLeft: 19, avatarColor: 'from-cyan-500 to-blue-600' },
          { name: 'Priya Sharma', level: 4, rank: 'Math Solver', subject: 'Calculus III: Triple Integrals', status: 'Focusing', minsLeft: 11, avatarColor: 'from-violet-500 to-purple-600' },
          { name: 'Marcus Vance', level: 3, rank: 'Physics Fellow', subject: 'Quantum Mechanics: Wave Equations', status: 'Focusing', minsLeft: 24, avatarColor: 'from-amber-500 to-yellow-600' },
          { name: 'Lucas Silva', level: 2, rank: 'Systems Builder', subject: 'Rust: Concurrency & Rayon Pipeline', status: 'Break', minsLeft: 4, avatarColor: 'from-emerald-500 to-green-600' }
        ],
        seedMessages: [
          { id: 'sc1', sender: 'Kenji Sato', level: 5, isMe: false, text: 'Finally nailed the memoization state transition for the DP knapsack! 🚀', isCheer: false, emoji: '', topic: 'LeetCode DP', time: '10:30 PM' },
          { id: 'sc2', sender: 'Priya Sharma', level: 4, isMe: false, text: "Working on spherical coordinate transforms. Let's conquer these integrals!", isCheer: false, emoji: '', topic: 'Calculus III', time: '10:51 PM' }
        ]
      },
      'pomo-sprint': {
        id: 'pomo-sprint',
        name: 'Pomodoro Sprint Club',
        emoji: '⚡',
        badge: 'High-Velocity Sprints',
        desc: 'Strict 25-minute study sprints synchronized together. Check in during breaks!',
        timerDesc: '25m Active Sprint',
        onlineCount: 7,
        peers: [
          { name: 'Jordan Lee', level: 7, rank: 'Sprint Master', subject: 'Sprint 3: Research Paper Abstract & Intro', status: 'Focusing', minsLeft: 9, avatarColor: 'from-red-500 to-orange-600' },
          { name: 'Chloe Martin', level: 4, rank: 'Pomo Veteran', subject: 'Sprint 2: Organic Chemistry Flashcards', status: 'Focusing', minsLeft: 9, avatarColor: 'from-pink-500 to-rose-600' },
          { name: "Liam O'Connor", level: 3, rank: 'Focus Sprinter', subject: 'Sprint 4: ML Data Preprocessing', status: 'Focusing', minsLeft: 9, avatarColor: 'from-teal-500 to-emerald-600' },
          { name: 'Sophie Dubois', level: 5, rank: 'Streak Leader', subject: 'Sprint 1: Italian Grammar & Vocabulary', status: 'Focusing', minsLeft: 9, avatarColor: 'from-indigo-500 to-blue-600' }
        ],
        seedMessages: [
          { id: 'ps1', sender: 'Jordan Lee', level: 7, isMe: false, text: 'Starting Sprint 3 synchronized clock! 25 minutes of zero phone, pure focus. 🎯', isCheer: true, emoji: '🎯', topic: 'Research Paper', time: '10:35 PM' },
          { id: 'ps2', sender: 'Chloe Martin', level: 4, isMe: false, text: "Got my water, timer ticking. Let's get this done! 💪", isCheer: true, emoji: '💪', topic: 'Organic Chem', time: '10:36 PM' }
        ]
      },
      'late-night': {
        id: 'late-night',
        name: 'Late Night Grinders',
        emoji: '🌙',
        badge: 'Nocturnal Focus',
        desc: 'For midnight oil burners, evening students, and exam preparation sessions.',
        timerDesc: 'Late Night Session',
        onlineCount: 5,
        peers: [
          { name: 'Alex Chen', level: 4, rank: 'Night Owl', subject: 'Final Exam Review: Organic Reactions', status: 'Focusing', minsLeft: 16, avatarColor: 'from-indigo-600 to-violet-800' },
          { name: 'Zainab Khan', level: 6, rank: 'Midnight Scholar', subject: 'Literature Review: Chapter 2 Drafting', status: 'Focusing', minsLeft: 22, avatarColor: 'from-purple-600 to-fuchsia-700' },
          { name: 'Ryan Miller', level: 2, rank: 'Nocturnal Mind', subject: 'Calculus: Integration by Parts', status: 'Break', minsLeft: 2, avatarColor: 'from-slate-600 to-zinc-700' }
        ],
        seedMessages: [
          { id: 'ln1', sender: 'Alex Chen', level: 4, isMe: false, text: 'Coffee brewed, headphones on. The quiet of the night is the best focus zone. 🌙', isCheer: false, emoji: '', topic: 'Organic Reactions', time: '11:02 PM' },
          { id: 'ln2', sender: 'Zainab Khan', level: 6, isMe: false, text: 'Entering flow state! Sending good focus energy to everyone grinding late. ✨', isCheer: true, emoji: '🧠', topic: 'Literature Review', time: '11:14 PM' }
        ]
      }
    };

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    }

    let activeLoungeRoom = 'silent-library';
    let loungeSoundEnabled = true;
    let loungeBroadcastChannel = null;
    let loungeAmbientTimer = null;

    function initStudyLounge() {
      // Load saved sound preference
      const savedSound = localStorage.getItem(LOUNGE_SOUND_KEY);
      if (savedSound !== null) {
        loungeSoundEnabled = savedSound === 'true';
      }
      updateLoungeSoundButtonUI();

      // Load saved study topic
      const savedTopic = localStorage.getItem(LOUNGE_STATUS_KEY);
      const statusInput = document.getElementById('lounge-status-input');
      if (statusInput) {
        statusInput.value = savedTopic || getActiveTaskTitle();
      }

      // Initialize BroadcastChannel
      initLoungeBroadcast();

      // Render initial room
      switchLoungeRoom('silent-library', false);

      // Start ambient peers simulation
      startAmbientPeersSimulation();
    }

    function initLoungeBroadcast() {
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          loungeBroadcastChannel = new BroadcastChannel('focusmeet_lounge_channel');
          loungeBroadcastChannel.onmessage = (event) => {
            const data = event.data;
            if (!data) return;
            if (data.type === 'CHAT_MESSAGE' && data.room) {
              appendReceivedLoungeMessage(data.room, data.message);
            }
          };
        }
      } catch (e) {}

      // Fallback cross-tab storage listener
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith(LOUNGE_STORAGE_PREFIX)) {
          const roomId = e.key.replace(LOUNGE_STORAGE_PREFIX, '');
          if (roomId === activeLoungeRoom) {
            renderLoungeMessages();
          }
        }
      });
    }

    function switchLoungeRoom(roomId, shouldScroll = true) {
      if (!LOUNGE_ROOMS[roomId]) return;
      activeLoungeRoom = roomId;

      // Update room tab styles
      document.querySelectorAll('.lounge-room-tab').forEach(tab => {
        tab.classList.remove('active-room', 'bg-white/10', 'border-white/30', 'text-white', 'shadow-xs');
        tab.classList.add('bg-white/[0.03]', 'border-white/10', 'text-neutral-400');
      });

      const activeTab = document.getElementById(`room-tab-${roomId}`);
      if (activeTab) {
        activeTab.classList.remove('bg-white/[0.03]', 'border-white/10', 'text-neutral-400');
        activeTab.classList.add('active-room', 'bg-white/10', 'border-white/30', 'text-white', 'shadow-xs');
      }

      // Update room banner
      const room = LOUNGE_ROOMS[roomId];
      const bannerAvatar = document.getElementById('room-banner-avatar');
      const bannerTitle = document.getElementById('room-banner-title');
      const bannerBadge = document.getElementById('room-banner-badge');
      const bannerDesc = document.getElementById('room-banner-desc');
      const bannerTimer = document.getElementById('room-banner-timer');
      const msgInput = document.getElementById('lounge-msg-input');

      if (bannerAvatar) bannerAvatar.textContent = room.emoji;
      if (bannerTitle) bannerTitle.textContent = room.name;
      if (bannerBadge) bannerBadge.textContent = room.badge;
      if (bannerDesc) bannerDesc.textContent = room.desc;
      if (bannerTimer) bannerTimer.textContent = room.timerDesc;
      if (msgInput) msgInput.placeholder = `Message peers in ${room.name}...`;

      renderLoungeMessages();
      renderLoungePeers();
      updateLoungeHeaderUI();

      if (shouldScroll) {
        const chatBox = document.getElementById('lounge-chat-messages');
        if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
      }
    }

    function getLoungeRoomMessages(roomId) {
      try {
        const key = LOUNGE_STORAGE_PREFIX + roomId;
        const stored = localStorage.getItem(key);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}

      // Fallback to room seed messages
      const room = LOUNGE_ROOMS[roomId];
      if (room && room.seedMessages) {
        return JSON.parse(JSON.stringify(room.seedMessages));
      }
      return [];
    }

    function saveLoungeRoomMessages(roomId, messages) {
      try {
        const key = LOUNGE_STORAGE_PREFIX + roomId;
        localStorage.setItem(key, JSON.stringify(messages));
      } catch (e) {}
    }

    function getMyStudyTopic() {
      const statusInput = document.getElementById('lounge-status-input');
      if (statusInput && statusInput.value.trim()) {
        return statusInput.value.trim();
      }
      return getActiveTaskTitle();
    }

    function getActiveTaskTitle() {
      if (appState && appState.tasks && appState.activeTaskId) {
        const t = appState.tasks.find(x => x.id === appState.activeTaskId);
        if (t && t.title) return t.title;
      }
      return 'General Focus & Problem Solving';
    }

    function handleLoungeFormSubmit(e) {
      if (e) e.preventDefault();
      const input = document.getElementById('lounge-msg-input');
      if (!input) return;
      const text = input.value.trim();
      if (!text) return;
      sendLoungeMessage(text, false, '');
      input.value = '';
    }

    function insertEmojiToLoungeInput(emoji) {
      const input = document.getElementById('lounge-msg-input');
      if (input) {
        input.value += (input.value ? ' ' : '') + emoji;
        input.focus();
      }
    }

    function sendQuickCheer(cheerText, emoji) {
      sendLoungeMessage(cheerText, true, emoji);
    }

    function sendPeerCheer(peerName) {
      const cheers = [
        `Cheering for ${peerName}! You got this! 💪`,
        `High five to ${peerName} — keep that focus streak going! 🔥`,
        `Rooting for ${peerName} on their study session! 🚀`
      ];
      const text = cheers[Math.floor(Math.random() * cheers.length)];
      sendLoungeMessage(text, true, '👏');
    }

    function sendLoungeMessage(rawText, isCheer = false, emoji = '') {
      const text = (rawText || '').trim();
      if (!text) return;

      const userName = (appState && appState.user && appState.user.name) ? appState.user.name : 'Guest Learner';
      const userLevel = (appState && appState.user && appState.user.level) ? appState.user.level : 1;
      const myTopic = getMyStudyTopic();

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const msgObj = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        sender: userName,
        level: userLevel,
        isMe: true,
        text: text,
        isCheer: Boolean(isCheer),
        emoji: emoji || '',
        topic: myTopic,
        time: timeStr,
        timestamp: Date.now()
      };

      // Save to localStorage
      const history = getLoungeRoomMessages(activeLoungeRoom);
      history.push(msgObj);
      if (history.length > 100) history.shift();
      saveLoungeRoomMessages(activeLoungeRoom, history);

      // Render locally
      renderLoungeMessages();
      playChatChime();

      // Award XP for participating (+5 XP)
      if (typeof addXp === 'function') {
        addXp(5, 'Study Lounge Contribution');
      }

      // Broadcast to other tabs/windows
      if (loungeBroadcastChannel) {
        try {
          const broadcastCopy = Object.assign({}, msgObj, { isMe: false });
          loungeBroadcastChannel.postMessage({
            type: 'CHAT_MESSAGE',
            room: activeLoungeRoom,
            message: broadcastCopy
          });
        } catch (e) {}
      }

      // Scroll to bottom
      const chatBox = document.getElementById('lounge-chat-messages');
      if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
    }

    function appendReceivedLoungeMessage(roomId, message) {
      if (roomId === activeLoungeRoom) {
        const history = getLoungeRoomMessages(roomId);
        if (!history.some(m => m.id === message.id)) {
          history.push(message);
          if (history.length > 100) history.shift();
          saveLoungeRoomMessages(roomId, history);
          renderLoungeMessages();
          playChatChime();
        }
      }
    }

    function renderLoungeMessages() {
      const container = document.getElementById('lounge-chat-messages');
      if (!container) return;

      const messages = getLoungeRoomMessages(activeLoungeRoom);
      if (messages.length === 0) {
        container.innerHTML = `
          <div class="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
            <span class="text-3xl mb-2">💬</span>
            <p class="text-xs font-semibold text-neutral-300">Welcome to this Study Circle!</p>
            <p class="text-[11px] text-slate-400 mt-1">Be the first to say hello or send a study cheer.</p>
          </div>
        `;
        return;
      }

      const currentUserName = (appState && appState.user && appState.user.name) ? appState.user.name : 'Guest Learner';

      container.innerHTML = messages.map(msg => {
        const isMine = msg.isMe || (msg.sender === currentUserName);
        const initials = (msg.sender || 'ST').split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();
        
        // Gradient color for avatar based on name hash
        let hash = 0;
        for (let i = 0; i < (msg.sender || '').length; i++) {
          hash = msg.sender.charCodeAt(i) + ((hash << 5) - hash);
        }
        const colors = [
          'from-indigo-500 to-purple-600',
          'from-emerald-500 to-teal-600',
          'from-amber-500 to-orange-600',
          'from-blue-500 to-cyan-600',
          'from-rose-500 to-pink-600',
          'from-violet-500 to-fuchsia-600'
        ];
        const color = colors[Math.abs(hash) % colors.length];

        if (msg.isCheer) {
          return `
            <div class="flex items-start gap-2.5 p-3 rounded-2xl border ${isMine ? 'bg-amber-400/[0.07] border-amber-400/25' : 'bg-white/[0.03] border-white/10'} transition">
              <div class="w-8 h-8 rounded-xl bg-gradient-to-tr ${color} flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm">
                ${initials}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex flex-wrap items-center gap-1.5 mb-1">
                  <span class="text-xs font-bold ${isMine ? 'text-amber-300' : 'text-neutral-200'}">${escapeHtml(msg.sender)}</span>
                  ${isMine ? '<span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 font-bold">YOU</span>' : ''}
                  <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-neutral-400">Lvl ${msg.level || 1}</span>
                  ${msg.topic ? `<span class="text-[10px] text-slate-400 truncate max-w-[180px]">• ${escapeHtml(msg.topic)}</span>` : ''}
                  <span class="text-[10px] text-slate-500 ml-auto">${msg.time}</span>
                </div>
                <div class="text-xs ${isMine ? 'text-amber-100 font-medium' : 'text-neutral-200'} flex items-center gap-1.5">
                  <span class="text-base">${msg.emoji || '⚡'}</span>
                  <span>${escapeHtml(msg.text)}</span>
                </div>
              </div>
            </div>
          `;
        }

        return `
          <div class="flex items-start gap-2.5 p-3 rounded-2xl border ${isMine ? 'bg-white/[0.06] border-white/20' : 'bg-white/[0.02] border-white/5'} transition">
            <div class="w-8 h-8 rounded-xl bg-gradient-to-tr ${color} flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow-sm">
              ${initials}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-center gap-1.5 mb-1">
                <span class="text-xs font-bold ${isMine ? 'text-indigo-300' : 'text-neutral-200'}">${escapeHtml(msg.sender)}</span>
                ${isMine ? '<span class="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold">YOU</span>' : ''}
                <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-neutral-400">Lvl ${msg.level || 1}</span>
                ${msg.topic ? `<span class="text-[10px] text-slate-400 truncate max-w-[180px]">• ${escapeHtml(msg.topic)}</span>` : ''}
                <span class="text-[10px] text-slate-500 ml-auto">${msg.time}</span>
              </div>
              <p class="text-xs text-neutral-200 leading-relaxed break-words">${escapeHtml(msg.text)}</p>
            </div>
          </div>
        `;
      }).join('');
    }

    function renderLoungePeers() {
      const container = document.getElementById('lounge-peers-list');
      const countElem = document.getElementById('lounge-room-peer-count');
      if (!container) return;

      const room = LOUNGE_ROOMS[activeLoungeRoom];
      if (!room || !room.peers) return;

      if (countElem) {
        countElem.textContent = `${room.peers.length + 1} Active`;
      }

      const peersHtml = room.peers.map(peer => {
        const initials = peer.name.split(' ').map(w => w[0]).join('').substring(0, 2);
        const isFocusing = peer.status === 'Focusing';

        return `
          <div class="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start justify-between gap-2.5 transition hover:bg-white/[0.06]">
            <div class="flex items-start gap-2.5 min-w-0 flex-1">
              <div class="relative shrink-0">
                <div class="w-8 h-8 rounded-xl bg-gradient-to-tr ${peer.avatarColor} flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
                  ${initials}
                </div>
                <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ${isFocusing ? 'bg-emerald-500' : 'bg-amber-400'} ring-2 ring-black"></span>
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5">
                  <span class="text-xs font-bold text-neutral-200 truncate">${escapeHtml(peer.name)}</span>
                  <span class="text-[9px] font-mono px-1 py-0.2 rounded bg-white/10 text-neutral-400 shrink-0">Lvl ${peer.level}</span>
                </div>
                <p class="text-[10px] text-slate-400 truncate mt-0.5" title="${escapeHtml(peer.subject)}">${escapeHtml(peer.subject)}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${isFocusing ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}">
                    ${isFocusing ? `🟢 Sprint (${peer.minsLeft}m)` : `☕ Break (${peer.minsLeft}m)`}
                  </span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <button onclick="openDirectMessageWithPeer('${escapeHtml(peer.name)}')" title="Direct message ${escapeHtml(peer.name)}" class="px-2.5 py-1 rounded-xl border border-indigo-400/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-xs text-indigo-300 font-bold transition shrink-0 transform active:scale-95 flex items-center gap-1">
                <span>💬</span><span class="text-[10px] hidden sm:inline">DM</span>
              </button>
              <button onclick="sendPeerCheer('${escapeHtml(peer.name)}')" title="Send a cheer to ${escapeHtml(peer.name)}" class="px-2 py-1 rounded-xl border border-white/10 bg-white/5 hover:bg-white/15 text-xs text-neutral-300 hover:text-white transition shrink-0 transform active:scale-95">
                👏
              </button>
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = peersHtml;
    }

    function updateLoungeHeaderUI() {
      // Update User Status & Rank Card
      const userRankBadge = document.getElementById('lounge-my-rank-badge');
      const syncedTaskElem = document.getElementById('lounge-synced-task-title');
      
      if (userRankBadge && appState && appState.user) {
        userRankBadge.textContent = `Lvl ${appState.user.level} • ${appState.user.levelTitle}`;
      }

      if (syncedTaskElem) {
        syncedTaskElem.textContent = getActiveTaskTitle();
      }

      // Update room online counters
      let totalGlobalOnline = 0;
      Object.keys(LOUNGE_ROOMS).forEach(rId => {
        const r = LOUNGE_ROOMS[rId];
        const el = document.getElementById(`room-online-${rId}`);
        if (el && r) {
          el.textContent = `${r.onlineCount} online`;
          totalGlobalOnline += r.onlineCount;
        }
      });

      const globalCount = document.getElementById('lounge-global-online-count');
      if (globalCount) {
        globalCount.textContent = `${totalGlobalOnline} Students Co-Working Live`;
      }
    }

    function handleUpdateMyStatus() {
      const input = document.getElementById('lounge-status-input');
      if (!input) return;
      const val = input.value.trim();
      if (!val) return;
      localStorage.setItem(LOUNGE_STATUS_KEY, val);
      
      const userName = (appState && appState.user && appState.user.name) ? appState.user.name : 'Learner';
      sendLoungeMessage(`Updated study goal: "${val}" 🎯`, true, '🎯');
    }

    function syncTaskToLoungeStatus() {
      const activeTitle = getActiveTaskTitle();
      const statusInput = document.getElementById('lounge-status-input');
      if (statusInput) {
        statusInput.value = activeTitle;
      }
      localStorage.setItem(LOUNGE_STATUS_KEY, activeTitle);
      sendLoungeMessage(`Now tackling: "${activeTitle}" 🎯`, true, '🎯');
    }

    function toggleLoungeSound() {
      loungeSoundEnabled = !loungeSoundEnabled;
      localStorage.setItem(LOUNGE_SOUND_KEY, loungeSoundEnabled);
      updateLoungeSoundButtonUI();
      if (loungeSoundEnabled) playChatChime();
    }

    function updateLoungeSoundButtonUI() {
      const icon = document.getElementById('lounge-sound-icon');
      const text = document.getElementById('lounge-sound-text');
      if (icon) icon.textContent = loungeSoundEnabled ? '🔔' : '🔕';
      if (text) text.textContent = loungeSoundEnabled ? 'Chime On' : 'Chime Muted';
    }

    function playChatChime() {
      if (!loungeSoundEnabled) return;
      try {
        const AudioCtor = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtor) return;
        const ctx = new AudioCtor();
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;
        
        // Two-tone gentle marimba chime (587.33Hz D5 -> 880Hz A5)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, now);
        gain1.gain.setValueAtTime(0.08, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.23);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(880, now + 0.08);
        gain2.gain.setValueAtTime(0.06, now + 0.08);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.08);
        osc2.stop(now + 0.33);
      } catch (e) {}
    }

    function startAmbientPeersSimulation() {
      if (loungeAmbientTimer) clearInterval(loungeAmbientTimer);
      loungeAmbientTimer = setInterval(() => {
        const room = LOUNGE_ROOMS[activeLoungeRoom];
        if (!room || !room.peers || room.peers.length === 0) return;
        
        // 35% chance to post an ambient cheer from an active peer
        if (Math.random() < 0.35) {
          const peer = room.peers[Math.floor(Math.random() * room.peers.length)];
          const peerCheers = [
            { text: `Crushed another 25m sprint on ${peer.subject}! Taking a quick water break. ☕`, isCheer: false, emoji: '' },
            { text: `Focus momentum is high! Keep pushing everyone. 🔥`, isCheer: true, emoji: '🔥' },
            { text: `Finished my revision checklist! Onto the problem set. 💪`, isCheer: true, emoji: '💪' },
            { text: `Deep into flow state right now. ✨`, isCheer: true, emoji: '🧠' }
          ];
          const choice = peerCheers[Math.floor(Math.random() * peerCheers.length)];
          
          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const msgObj = {
            id: 'ambient_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            sender: peer.name,
            level: peer.level,
            isMe: false,
            text: choice.text,
            isCheer: choice.isCheer,
            emoji: choice.emoji,
            topic: peer.subject,
            time: timeStr,
            timestamp: Date.now()
          };

          const history = getLoungeRoomMessages(activeLoungeRoom);
          history.push(msgObj);
          if (history.length > 100) history.shift();
          saveLoungeRoomMessages(activeLoungeRoom, history);

          renderLoungeMessages();
          playChatChime();
        }

        // Randomly decrement peer timer to show realistic live progress
        room.peers.forEach(p => {
          if (p.minsLeft > 1) {
            p.minsLeft -= 1;
          } else {
            p.status = p.status === 'Focusing' ? 'Break' : 'Focusing';
            p.minsLeft = p.status === 'Focusing' ? 25 : 5;
          }
        });
        renderLoungePeers();

      }, 45000);
    }

        /* ==========================================================================
       FOCUSMEET DIRECT MESSAGES (DMs) & STUDY BUDDY CHAT ENGINE
       ========================================================================== */
    const DM_STORAGE_THREADS_KEY = 'focusmeet_dm_threads_v1';
    const DM_STORAGE_ACTIVE_KEY = 'focusmeet_dm_active_peer_v1';

    const DM_REGISTERED_STUDENTS = [
      { name: 'Maya Lin', level: 4, rank: 'Task Architect', subject: 'Linear Algebra: Eigenvalues & Vector Spaces', avatarColor: 'from-purple-500 to-indigo-600', isOnline: true },
      { name: 'Kenji Sato', level: 5, rank: 'Code Master', subject: 'LeetCode Dynamic Programming (Hard)', avatarColor: 'from-cyan-500 to-blue-600', isOnline: true },
      { name: 'David Kim', level: 3, rank: 'Consistent Scholar', subject: 'Python Data Structures: Trie Search', avatarColor: 'from-emerald-500 to-teal-600', isOnline: true },
      { name: 'Elena Rostova', level: 6, rank: 'Deep Sage', subject: 'Biochemistry: Krebs Cycle Pathways', avatarColor: 'from-amber-500 to-orange-600', isOnline: true },
      { name: 'Jordan Lee', level: 7, rank: 'Sprint Master', subject: 'Sprint 3: Research Paper Abstract & Intro', avatarColor: 'from-red-500 to-orange-600', isOnline: true },
      { name: 'Priya Sharma', level: 4, rank: 'Math Solver', subject: 'Calculus III: Triple Integrals', avatarColor: 'from-violet-500 to-purple-600', isOnline: true },
      { name: 'Zainab Khan', level: 6, rank: 'Midnight Scholar', subject: 'Literature Review: Chapter 2 Drafting', avatarColor: 'from-purple-600 to-fuchsia-700', isOnline: true }
    ];

    let activeDMPeerName = 'Maya Lin';
    let dmSearchFilter = '';
    let dmBroadcastChannel = null;

    function initDirectMessages() {
      // Initialize BroadcastChannel for DMs
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          dmBroadcastChannel = new BroadcastChannel('focusmeet_dm_channel');
          dmBroadcastChannel.onmessage = (event) => {
            const data = event.data;
            if (!data) return;
            if (data.type === 'DM_MESSAGE' && data.peerName && data.message) {
              const threads = getDMThreads();
              if (threads[data.peerName]) {
                threads[data.peerName].messages.push(data.message);
                threads[data.peerName].lastMessage = data.message.text;
                threads[data.peerName].lastTime = data.message.time;
                saveDMThreads(threads);
                renderDMConversations();
                if (activeDMPeerName === data.peerName) {
                  renderCurrentDMMessages();
                } else {
                  showDMUnreadBadge();
                }
                playChatChime();
              }
            }
          };
        }
      } catch (e) {}

      // Seed default threads if empty
      const threads = getDMThreads();
      if (Object.keys(threads).length === 0) {
        seedInitialDMThreads();
      }

      // Restore active peer
      const savedPeer = localStorage.getItem(DM_STORAGE_ACTIVE_KEY);
      if (savedPeer && threads[savedPeer]) {
        activeDMPeerName = savedPeer;
      } else {
        const firstKey = Object.keys(threads)[0];
        if (firstKey) activeDMPeerName = firstKey;
      }

      renderDMConversations();
      renderCurrentDMMessages();
    }

    function seedInitialDMThreads() {
      const now = new Date();
      const time1 = new Date(now.getTime() - 15 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const time2 = new Date(now.getTime() - 5 * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const initial = {
        'Maya Lin': {
          peer: DM_REGISTERED_STUDENTS[0],
          lastMessage: 'If you want to sync up a 25-minute Pomodoro sprint, send me an invite! 🎯',
          lastTime: time2,
          unread: 1,
          messages: [
            { id: 'dm_m1', sender: 'Maya Lin', isMe: false, text: 'Hey! Saw you in the Silent Library earlier. Working on any Calculus today?', time: time1, timestamp: Date.now() - 900000 },
            { id: 'dm_m2', sender: 'Maya Lin', isMe: false, text: 'If you want to sync up a 25-minute Pomodoro sprint, send me an invite! 🎯', time: time2, timestamp: Date.now() - 300000 }
          ]
        },
        'Kenji Sato': {
          peer: DM_REGISTERED_STUDENTS[1],
          lastMessage: 'Just finished the LeetCode daily DP problem! How is your study session going?',
          lastTime: time1,
          unread: 0,
          messages: [
            { id: 'dm_k1', sender: 'Kenji Sato', isMe: false, text: 'Just finished the LeetCode daily DP problem! How is your study session going?', time: time1, timestamp: Date.now() - 900000 }
          ]
        }
      };

      saveDMThreads(initial);
      showDMUnreadBadge();
    }

    function getDMThreads() {
      try {
        const stored = localStorage.getItem(DM_STORAGE_THREADS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') return parsed;
        }
      } catch (e) {}
      return {};
    }

    function saveDMThreads(threads) {
      try {
        localStorage.setItem(DM_STORAGE_THREADS_KEY, JSON.stringify(threads));
      } catch (e) {}
    }

    function openDirectMessageWithPeer(peerName) {
      const threads = getDMThreads();
      
      // If thread does not exist yet, initialize it from registered students
      if (!threads[peerName]) {
        let studentObj = DM_REGISTERED_STUDENTS.find(s => s.name === peerName);
        if (!studentObj) {
          studentObj = {
            name: peerName,
            level: 3,
            rank: 'Focused Scholar',
            subject: 'Active Study Sprint',
            avatarColor: 'from-indigo-500 to-purple-600',
            isOnline: true
          };
        }
        threads[peerName] = {
          peer: studentObj,
          lastMessage: 'Conversation started',
          lastTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          unread: 0,
          messages: [
            {
              id: 'dm_init_' + Date.now(),
              sender: peerName,
              isMe: false,
              text: 'Hey there! Ready to co-work and stay accountable. Feel free to invite me to a sprint! 👋',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: Date.now()
            }
          ]
        };
        saveDMThreads(threads);
      }

      activeDMPeerName = peerName;
      localStorage.setItem(DM_STORAGE_ACTIVE_KEY, peerName);
      
      switchView('messages');
      renderDMConversations();
      renderCurrentDMMessages();

      setTimeout(() => {
        const input = document.getElementById('dm-input-text');
        if (input) input.focus();
      }, 100);
    }

    function promptNewConversation() {
      const available = DM_REGISTERED_STUDENTS.filter(s => s.name !== activeDMPeerName);
      if (available.length === 0) return;
      
      const chosen = available[Math.floor(Math.random() * available.length)];
      openDirectMessageWithPeer(chosen.name);
    }

    function selectDMConversation(peerName) {
      activeDMPeerName = peerName;
      localStorage.setItem(DM_STORAGE_ACTIVE_KEY, peerName);
      
      const threads = getDMThreads();
      if (threads[peerName]) {
        threads[peerName].unread = 0;
        saveDMThreads(threads);
      }

      renderDMConversations();
      renderCurrentDMMessages();
      clearDMUnreadBadge();

      setTimeout(() => {
        const input = document.getElementById('dm-input-text');
        if (input) input.focus();
      }, 50);
    }

    function handleDMSearchInput(val) {
      dmSearchFilter = (val || '').toLowerCase().trim();
      renderDMConversations();
    }

    function renderDMConversations() {
      const container = document.getElementById('dm-conversation-list');
      const countElem = document.getElementById('dm-active-threads-count');
      if (!container) return;

      const threads = getDMThreads();
      const peerKeys = Object.keys(threads);

      if (countElem) {
        countElem.textContent = `${peerKeys.length} threads`;
      }

      if (peerKeys.length === 0) {
        container.innerHTML = `
          <div class="p-6 text-center text-slate-500 text-xs">
            <span class="text-2xl mb-2 block">💬</span>
            <p>No conversations yet.</p>
            <button onclick="promptNewConversation()" class="mt-2 text-indigo-400 font-bold hover:underline">Start a New DM</button>
          </div>
        `;
        return;
      }

      let filteredKeys = peerKeys;
      if (dmSearchFilter) {
        filteredKeys = peerKeys.filter(k => {
          const t = threads[k];
          return k.toLowerCase().includes(dmSearchFilter) || 
                 (t.peer && t.peer.subject && t.peer.subject.toLowerCase().includes(dmSearchFilter)) ||
                 (t.lastMessage && t.lastMessage.toLowerCase().includes(dmSearchFilter));
        });
      }

      container.innerHTML = filteredKeys.map(k => {
        const thread = threads[k];
        const peer = thread.peer || { name: k, level: 1, avatarColor: 'from-indigo-500 to-purple-600', subject: 'Focus' };
        const isActive = (k === activeDMPeerName);
        const initials = k.split(' ').map(w => w[0]).join('').substring(0, 2);

        return `
          <div onclick="selectDMConversation('${escapeHtml(k)}')" class="cursor-pointer p-3 rounded-2xl border transition-all duration-200 flex items-start gap-3 ${isActive ? 'bg-indigo-600/15 border-indigo-400/40 text-white shadow-xs' : 'bg-white/[0.03] border-white/10 text-neutral-300 hover:bg-white/[0.06] hover:border-white/20'}">
            <div class="relative shrink-0">
              <div class="w-10 h-10 rounded-xl bg-gradient-to-tr ${peer.avatarColor || 'from-indigo-500 to-purple-600'} flex items-center justify-center text-white text-xs font-bold shadow-sm">
                ${initials}
              </div>
              <span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-black"></span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1 mb-0.5">
                <span class="text-xs font-bold truncate text-white">${escapeHtml(k)}</span>
                <span class="text-[10px] text-slate-500 shrink-0 font-mono">${thread.lastTime || ''}</span>
              </div>
              <p class="text-[11px] text-slate-400 truncate">${escapeHtml(thread.lastMessage || 'No messages')}</p>
              ${peer.subject ? `<span class="text-[9px] text-indigo-300/80 truncate block mt-1">• ${escapeHtml(peer.subject)}</span>` : ''}
            </div>
            ${thread.unread > 0 ? `<span class="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-indigo-500 text-white font-bold shrink-0 self-center">${thread.unread}</span>` : ''}
          </div>
        `;
      }).join('');
    }

    function renderCurrentDMMessages() {
      const container = document.getElementById('dm-messages-container');
      if (!container) return;

      const threads = getDMThreads();
      const currentThread = threads[activeDMPeerName];

      // Update header
      const peer = (currentThread && currentThread.peer) ? currentThread.peer : DM_REGISTERED_STUDENTS.find(s => s.name === activeDMPeerName) || { name: activeDMPeerName, level: 3, rank: 'Scholar', subject: 'Active Focus', avatarColor: 'from-indigo-500 to-purple-600' };

      const nameElem = document.getElementById('dm-active-name');
      const levelElem = document.getElementById('dm-active-level');
      const statusElem = document.getElementById('dm-active-status');
      const avatarElem = document.getElementById('dm-active-avatar');
      const inputElem = document.getElementById('dm-input-text');

      if (nameElem) nameElem.textContent = peer.name;
      if (levelElem) levelElem.textContent = `Lvl ${peer.level || 1} • ${peer.rank || 'Scholar'}`;
      if (statusElem) statusElem.textContent = `🟢 Online • Studying ${peer.subject || 'General Focus'}`;
      if (avatarElem) {
        avatarElem.className = `w-11 h-11 rounded-2xl bg-gradient-to-tr ${peer.avatarColor || 'from-indigo-500 to-purple-600'} flex items-center justify-center text-white text-xs font-bold shadow-md`;
        avatarElem.textContent = peer.name.split(' ').map(w => w[0]).join('').substring(0, 2);
      }
      if (inputElem) inputElem.placeholder = `Message ${peer.name}... (Enter to send)`;

      if (!currentThread || !currentThread.messages || currentThread.messages.length === 0) {
        container.innerHTML = `
          <div class="h-full flex flex-col items-center justify-center text-center p-8 opacity-60">
            <span class="text-3xl mb-2">💬</span>
            <p class="text-xs font-semibold text-neutral-200">Start a study conversation with ${escapeHtml(peer.name)}</p>
            <p class="text-[11px] text-slate-400 mt-1">Send a message, share your active task, or invite them to a 25m Pomodoro sprint!</p>
          </div>
        `;
        return;
      }

      container.innerHTML = currentThread.messages.map(msg => {
        const isMine = msg.isMe;

        // Custom Sprint Invite card
        if (msg.isSprintInvite) {
          return `
            <div class="flex flex-col ${isMine ? 'items-end' : 'items-start'}">
              <div class="max-w-md p-4 rounded-2xl border ${isMine ? 'bg-amber-400/10 border-amber-400/30' : 'bg-white/[0.05] border-white/20'} space-y-2">
                <div class="flex items-center gap-2">
                  <span class="text-lg">🍅</span>
                  <span class="text-xs font-bold text-amber-300">Pomodoro Sprint Challenge</span>
                </div>
                <p class="text-xs text-neutral-200 leading-relaxed">${escapeHtml(msg.text)}</p>
                <div class="pt-2 border-t border-white/10 flex items-center justify-between gap-3">
                  <span class="text-[10px] text-slate-400 font-mono">${msg.time}</span>
                  ${!isMine ? `
                    <button onclick="acceptSprintInviteAndStartTimer()" class="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs transition shadow-sm">
                      Accept &amp; Start Timer ⏱️
                    </button>
                  ` : '<span class="text-[10px] text-amber-300/80 font-bold">Invite Sent</span>'}
                </div>
              </div>
            </div>
          `;
        }

        // Custom Task Share card
        if (msg.isTaskShare) {
          return `
            <div class="flex flex-col ${isMine ? 'items-end' : 'items-start'}">
              <div class="max-w-md p-4 rounded-2xl border ${isMine ? 'bg-indigo-600/20 border-indigo-400/30' : 'bg-white/[0.05] border-white/20'} space-y-1.5">
                <div class="flex items-center gap-2">
                  <span class="text-base">📚</span>
                  <span class="text-xs font-bold text-indigo-300">${isMine ? 'You shared your focus task' : `${escapeHtml(msg.sender)} shared a focus task`}</span>
                </div>
                <div class="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-semibold text-white">
                  "${escapeHtml(msg.taskTitle || msg.text)}"
                </div>
                <div class="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>Target: 25m Focus Sprint</span>
                  <span class="font-mono">${msg.time}</span>
                </div>
              </div>
            </div>
          `;
        }

        // Standard chat bubble
        return `
          <div class="flex flex-col ${isMine ? 'items-end' : 'items-start'}">
            <div class="max-w-md px-4 py-2.5 rounded-2xl text-xs ${isMine ? 'bg-indigo-600 text-white rounded-br-xs shadow-sm' : 'bg-white/10 text-neutral-200 border border-white/10 rounded-bl-xs'} break-words">
              ${escapeHtml(msg.text)}
            </div>
            <span class="text-[10px] text-slate-500 mt-1 px-1 font-mono">${msg.time} ${isMine ? '✓✓' : ''}</span>
          </div>
        `;
      }).join('');

      container.scrollTop = container.scrollHeight;
    }

    function handleDMSendSubmit(e) {
      if (e) e.preventDefault();
      const input = document.getElementById('dm-input-text');
      if (!input) return;
      const text = input.value.trim();
      if (!text) return;
      
      sendDirectMessage(text);
      input.value = '';
    }

    function insertEmojiToDMInput(emoji) {
      const input = document.getElementById('dm-input-text');
      if (input) {
        input.value += (input.value ? ' ' : '') + emoji;
        input.focus();
      }
    }

    function sendQuickDMMessage(text) {
      sendDirectMessage(text);
    }

    function sendDMSprintInvite() {
      const inviteText = `I'm starting a 25-minute Pomodoro focus sprint! Want to sync our clocks and co-work together? 🍅`;
      sendDirectMessage(inviteText, { isSprintInvite: true });
    }

    function shareActiveTaskInDM() {
      const activeTitle = getActiveTaskTitle();
      const text = `Currently working on: "${activeTitle}". Let's stay focused! 📚`;
      sendDirectMessage(text, { isTaskShare: true, taskTitle: activeTitle });
    }

    function sendDirectMessage(text, extraOpts = {}) {
      if (!text || !activeDMPeerName) return;

      const userName = (appState && appState.user && appState.user.name) ? appState.user.name : 'Guest Learner';
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const msgObj = Object.assign({
        id: 'dm_msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        sender: userName,
        isMe: true,
        text: text,
        time: timeStr,
        timestamp: Date.now()
      }, extraOpts);

      const threads = getDMThreads();
      if (!threads[activeDMPeerName]) {
        threads[activeDMPeerName] = {
          peer: DM_REGISTERED_STUDENTS.find(s => s.name === activeDMPeerName) || { name: activeDMPeerName },
          messages: [],
          lastMessage: text,
          lastTime: timeStr,
          unread: 0
        };
      }

      threads[activeDMPeerName].messages.push(msgObj);
      threads[activeDMPeerName].lastMessage = text;
      threads[activeDMPeerName].lastTime = timeStr;
      saveDMThreads(threads);

      renderCurrentDMMessages();
      renderDMConversations();
      playChatChime();

      // Award XP for collaborating
      if (typeof addXp === 'function') {
        addXp(5, 'Study Buddy Direct Collaboration');
      }

      // Broadcast to other tabs/windows
      if (dmBroadcastChannel) {
        try {
          dmBroadcastChannel.postMessage({
            type: 'DM_MESSAGE',
            peerName: activeDMPeerName,
            message: Object.assign({}, msgObj, { isMe: false })
          });
        } catch (e) {}
      }

      // Schedule realistic peer reply
      schedulePeerReply(activeDMPeerName, text, extraOpts);
    }

    function schedulePeerReply(peerName, userText, extraOpts) {
      const peer = DM_REGISTERED_STUDENTS.find(s => s.name === peerName) || { name: peerName, subject: 'Studies' };

      // Show typing indicator after 1.2s
      setTimeout(() => {
        if (activeDMPeerName === peerName) {
          const indicator = document.getElementById('dm-typing-indicator');
          const typingName = document.getElementById('dm-typing-name');
          if (indicator && typingName) {
            typingName.textContent = `${peer.name} is typing...`;
            indicator.classList.remove('hidden');
          }
        }
      }, 1200);

      // Send reply after 3.2s
      setTimeout(() => {
        const indicator = document.getElementById('dm-typing-indicator');
        if (indicator) indicator.classList.add('hidden');

        let replyText = `Thanks for checking in! Really helps with the accountability. Let's keep pushing! ✨`;

        if (extraOpts.isSprintInvite) {
          replyText = `Accepted! Starting my 25-minute Pomodoro timer right now. Let's lock in and get this done! 🍅💪`;
        } else if (extraOpts.isTaskShare) {
          replyText = `That sounds like a solid objective! Lock in and let me know once you complete that milestone. 🎯`;
        } else if (userText.toLowerCase().includes('break') || userText.toLowerCase().includes('coffee')) {
          replyText = `Enjoy your break! Hydrate and stretch. I'll be right here when you start the next sprint. ☕`;
        } else if (userText.toLowerCase().includes('how') || userText.toLowerCase().includes('going')) {
          replyText = `Session is going great! Making solid progress on ${peer.subject || 'my coursework'}. How is your focus today? 🔥`;
        } else if (userText.toLowerCase().includes('help') || userText.toLowerCase().includes('question')) {
          replyText = `Happy to help bounce ideas! Drop the question right here once you finish this section. 💡`;
        }

        const replyTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const replyObj = {
          id: 'dm_reply_' + Date.now(),
          sender: peer.name,
          isMe: false,
          text: replyText,
          time: replyTime,
          timestamp: Date.now()
        };

        const currentThreads = getDMThreads();
        if (currentThreads[peerName]) {
          currentThreads[peerName].messages.push(replyObj);
          currentThreads[peerName].lastMessage = replyText;
          currentThreads[peerName].lastTime = replyTime;
          
          if (activeDMPeerName !== peerName) {
            currentThreads[peerName].unread = (currentThreads[peerName].unread || 0) + 1;
            showDMUnreadBadge();
          }

          saveDMThreads(currentThreads);
          renderDMConversations();
          
          if (activeDMPeerName === peerName) {
            renderCurrentDMMessages();
          }

          playChatChime();
        }

      }, 3400);
    }

    function acceptSprintInviteAndStartTimer() {
      switchView('timer');
      setTimeout(() => {
        if (typeof toggleTimer === 'function' && !timerState.running) {
          toggleTimer();
        }
      }, 200);
    }

    function clearCurrentDMHistory() {
      if (!confirm(`Clear message history with ${activeDMPeerName}?`)) return;
      
      const threads = getDMThreads();
      if (threads[activeDMPeerName]) {
        threads[activeDMPeerName].messages = [];
        threads[activeDMPeerName].lastMessage = 'Chat cleared';
        saveDMThreads(threads);
        renderCurrentDMMessages();
        renderDMConversations();
      }
    }

    function showDMUnreadBadge() {
      const deskBadge = document.getElementById('nav-unread-badge');
      const bottomBadge = document.getElementById('bottom-unread-badge');
      if (deskBadge) deskBadge.classList.remove('hidden');
      if (bottomBadge) bottomBadge.classList.remove('hidden');
    }

    function clearDMUnreadBadge() {
      const deskBadge = document.getElementById('nav-unread-badge');
      const bottomBadge = document.getElementById('bottom-unread-badge');
      if (deskBadge) deskBadge.classList.add('hidden');
      if (bottomBadge) bottomBadge.classList.add('hidden');
    }

        /* ==========================================================================
       FLOATING PILL NAVBAR SCROLL DYNAMICS & FRAMER MOTION EXPAND/COLLAPSE
       ========================================================================== */
    let isNavPillCollapsed = false;
    let userManuallyToggledPill = false;

    function initFloatingNavbar() {
      window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        // Auto collapse when scrolled down > 60px unless manually expanded by user
        if (currentScrollY > 60 && !isNavPillCollapsed && !userManuallyToggledPill) {
          collapseNavPill();
        } else if (currentScrollY <= 25 && (isNavPillCollapsed || userManuallyToggledPill)) {
          expandNavPill();
          userManuallyToggledPill = false;
        }
      }, { passive: true });
    }

    function collapseNavPill() {
      const pill = document.getElementById('floating-nav-pill');
      if (!pill) return;
      isNavPillCollapsed = true;
      pill.classList.add('pill-collapsed');
      pill.setAttribute('title', 'Click the circle to expand navigation');
    }

    function expandNavPill(fromManualClick = false) {
      const pill = document.getElementById('floating-nav-pill');
      if (!pill) return;
      isNavPillCollapsed = false;
      pill.classList.remove('pill-collapsed');
      pill.removeAttribute('title');
      if (fromManualClick) {
        userManuallyToggledPill = true;
      }
    }

    function toggleNavPill() {
      if (isNavPillCollapsed) {
        expandNavPill(true);
      } else {
        collapseNavPill();
        userManuallyToggledPill = false;
      }
    }

    function handlePillContainerClick(e) {
      if (isNavPillCollapsed) {
        expandNavPill(true);
      }
    }

    function handlePillLogoClick(e) {
      e.stopPropagation();
      toggleNavPill();
    }

    /* ==========================================================================
       SETTINGS & PREFERENCES ENGINE
       ========================================================================== */
    const DEFAULT_SETTINGS = {
      focusDuration: 25,
      shortBreak: 5,
      longBreak: 15,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      startingShape: 0,
      glowIntensity: 'radiant',
      ambientSound: 'off',
      ambientVolume: 45,
      cheerToasts: true
    };

    function initSettings() {
      if (!appState.settings) {
        appState.settings = Object.assign({}, DEFAULT_SETTINGS);
      } else {
        appState.settings = Object.assign({}, DEFAULT_SETTINGS, appState.settings);
      }
      populateSettingsUI();
    }

    function populateSettingsUI() {
      if (!appState.settings) initSettings();
      const s = appState.settings;

      const focusDur = document.getElementById('setting-focus-duration');
      if (focusDur) focusDur.value = s.focusDuration;

      const shortBrk = document.getElementById('setting-short-break');
      if (shortBrk) shortBrk.value = s.shortBreak;

      const longBrk = document.getElementById('setting-long-break');
      if (longBrk) longBrk.value = s.longBreak;

      const autoBrk = document.getElementById('setting-auto-breaks');
      if (autoBrk) autoBrk.checked = !!s.autoStartBreaks;

      const autoPomo = document.getElementById('setting-auto-pomos');
      if (autoPomo) autoPomo.checked = !!s.autoStartPomodoros;

      const shapeSel = document.getElementById('setting-default-shape');
      if (shapeSel) shapeSel.value = typeof s.startingShape === 'number' ? s.startingShape : activeShapeIndex;

      const glowSel = document.getElementById('setting-glow-intensity');
      if (glowSel) glowSel.value = s.glowIntensity || 'radiant';

      const cheerAud = document.getElementById('setting-cheer-audio');
      if (cheerAud) cheerAud.checked = s.cheerToasts !== false;

      const defSnd = document.getElementById('setting-default-sound');
      if (defSnd) defSnd.value = s.ambientSound || currentAmbientSound;

      const volSlider = document.getElementById('setting-volume-slider');
      const volNum = document.getElementById('setting-volume-num');
      if (volSlider) volSlider.value = s.ambientVolume || 45;
      if (volNum) volNum.textContent = (s.ambientVolume || 45) + '%';
    }

    function saveSetting(key, value) {
      if (!appState.settings) initSettings();
      appState.settings[key] = value;
      saveState();

      // Live updates
      if (key === 'focusDuration' && !isTimerRunning && timerMode === 'focus') {
        totalDuration = value * 60;
        timeRemaining = totalDuration;
        updateTimerUI();
      }

      // Show toast feedback
      const toast = document.getElementById('settings-save-toast');
      if (toast) {
        toast.classList.remove('hidden');
        toast.classList.add('flex');
        clearTimeout(window._settingsToastTimer);
        window._settingsToastTimer = setTimeout(() => {
          toast.classList.remove('flex');
          toast.classList.add('hidden');
        }, 1800);
      }
    }

    function setShapeIndex(idx) {
      if (idx >= 0 && idx < PROCEDURAL_SHAPES.length) {
        activeShapeIndex = idx;
        const name = PROCEDURAL_SHAPES[activeShapeIndex].name;
        safeSetText('nav-active-shape-name', name);
        safeSetText('active-shape-indicator', name);
        safeSetText('shape-counter-badge', `${activeShapeIndex + 1}/${PROCEDURAL_SHAPES.length}`);
        dgRenderLoop(performance.now());
      }
    }

    function playAmbientChime() {
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
      } catch (e) {}
    }

    function exportWorkspaceData() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(appState, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `focusmeet-backup-${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }

    function importWorkspaceData(event) {
      const file = event.target.files && event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const imported = JSON.parse(e.target.result);
          if (imported && (imported.tasks || imported.timetable || imported.user)) {
            appState = Object.assign(appState, imported);
            saveState();
            populateSettingsUI();
            alert('✓ Workspace backup successfully restored!');
            location.reload();
          } else {
            alert('Invalid FocusMeet backup JSON file.');
          }
        } catch (err) {
          alert('Error parsing JSON backup file.');
        }
      };
      reader.readAsText(file);
    }

    function resetWorkspaceData() {
      if (confirm('Are you sure you want to reset all your tasks, schedule, and preferences? This cannot be undone.')) {
        localStorage.removeItem(STORAGE_KEY);
        appState = JSON.parse(JSON.stringify(defaultState));
        saveState();
        alert('Workspace reset to defaults.');
        location.reload();
      }
    }

    window.addEventListener('DOMContentLoaded', () => {
      initTheme();
      initAuth();
      initSplineViewer();
      initDottedGrid();
      initCookieConsent();
      initStudyLounge();
      initDirectMessages();
      initFloatingNavbar();
      initSettings();
      renderUI();
      updateTimerUI();
    });
