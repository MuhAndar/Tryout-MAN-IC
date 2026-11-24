/**
 * CBT Simulator MAN Insan Cendekia
 * 100% Client-side, static JSON based, GitHub Pages & Netlify ready.
 */

const App = (() => {
  // --- Constants & Config ---
  const STORAGE_KEYS = {
    HISTORY: 'cbt_man_ic_history',
    THEME: 'cbt_man_ic_theme',
    FONT_SIZE: 'cbt_man_ic_font_size'
  };

  const CATEGORY_PROPORTIONS = {
    "Kemampuan Verbal": 40 / 274,
    "Literasi Bahasa Indonesia": 26 / 274,
    "Bahasa Inggris": 20 / 274,
    "Keislaman": 25 / 274,
    "Matematika": 58 / 274,
    "Moderasi Beragama dan Sikap": 70 / 274,
    "Angket Sikap": 35 / 274,
  };

  // --- Internal State ---
  let summaryData = null;
  const packageCache = {}; // cached raw package data

  let currentExam = {
    mode: 'tryout', // 'tryout' | 'quick_quiz' | 'drill'
    packageName: '',
    questions: [], // shuffled questions array
    currentIndex: 0,
    answers: {}, // index -> 'A' | 'B' | 'C' | 'D'
    flagged: {}, // index -> boolean
    timeRemaining: 0, // seconds
    timerInterval: null,
    totalDuration: 0,
    startTime: null
  };

  let currentReviewSession = null;
  let currentReviewFilter = 'all';
  let quickQuizCount = 20;

  // --- Utility: Fisher-Yates Shuffle ---
  function shuffleArray(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  // --- Initialization ---
  async function init() {
    loadTheme();
    loadFontSize();
    await loadSummary();
    updateDashboardStats();
    renderHistoryTable();

    // Re-render lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // --- Data Loading ---
  async function loadSummary() {
    try {
      const res = await fetch('data/summary.json');
      if (!res.ok) throw new Error('Gagal memuat data/summary.json');
      summaryData = await res.json();
      renderPackagesList(summaryData.packages);
    } catch (err) {
      console.error(err);
      const pkgListEl = document.getElementById('packages-list');
      if (pkgListEl) {
        pkgListEl.innerHTML = `
          <div class="col-span-full p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-center">
            Gagal memuat ringkasan paket soal. Pastikan file JSON berada pada folder <code>data/</code>.
          </div>
        `;
      }
    }
  }

  async function getPackageQuestions(packageId) {
    if (packageCache[packageId]) {
      return packageCache[packageId];
    }
    const res = await fetch(`data/paket${packageId}.json`);
    if (!res.ok) throw new Error(`Gagal memuat paket${packageId}.json`);
    const data = await res.json();
    packageCache[packageId] = data.questions;
    return data.questions;
  }

  async function getAllQuestions() {
    const all = [];
    for (let i = 1; i <= 5; i++) {
      const qList = await getPackageQuestions(i);
      all.push(...qList);
    }
    return all;
  }

  // --- Render Dashboard Packages ---
  function renderPackagesList(packages) {
    const container = document.getElementById('packages-list');
    if (!container) return;

    container.innerHTML = packages.map(pkg => `
      <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-5">
        <div>
          <div class="flex items-center justify-between gap-2">
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
              Paket Resmi
            </span>
            <span class="text-xs font-semibold text-slate-500">${pkg.totalQuestions} Soal</span>
          </div>

          <h3 class="font-bold text-lg text-slate-900 dark:text-white mt-3">${pkg.packageName}</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Standar Seleksi Nasional Peserta Didik Baru (SNPDB) MAN IC.</p>

          <!-- Category Tags preview -->
          <div class="mt-4 flex flex-wrap gap-1.5">
            <span class="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Verbal (40)</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Literasi (26)</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">B. Inggris (20)</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Keislaman (25)</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Matematika (58)</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Moderasi (70)</span>
            <span class="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Sikap (35)</span>
          </div>
        </div>

        <div class="pt-4 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-2">
          <button onclick="App.startFullTryout(${pkg.packageId})" class="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5">
            <i data-lucide="play" class="w-3.5 h-3.5 fill-current"></i> Tryout Penuh
          </button>
          <button onclick="App.openQuickQuizForPackage(${pkg.packageId})" class="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all flex items-center gap-1" title="Kuis Cepat dari paket ini">
            <i data-lucide="zap" class="w-3.5 h-3.5 text-amber-500"></i> Kuis
          </button>
        </div>
      </div>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // --- View Switcher ---
  function navigate(viewName) {
    const views = ['view-home', 'view-exam', 'view-result', 'view-history', 'view-review'];
    views.forEach(v => {
      const el = document.getElementById(v);
      if (el) el.classList.add('hidden');
    });

    const targetEl = document.getElementById(`view-${viewName}`);
    if (targetEl) {
      targetEl.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (viewName === 'home') {
      updateDashboardStats();
    } else if (viewName === 'history') {
      renderHistoryTable();
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // --- Start Full Tryout ---
  async function startFullTryout(packageId) {
    try {
      const questions = await getPackageQuestions(packageId);
      // Randomize questions for tryout session
      const shuffled = shuffleArray(questions);

      currentExam = {
        mode: 'tryout',
        packageName: `Paket ${packageId} MAN IC (Lengkap)`,
        questions: shuffled,
        currentIndex: 0,
        answers: {},
        flagged: {},
        totalDuration: 120 * 60, // 120 minutes standard CAT
        timeRemaining: 120 * 60,
        timerInterval: null,
        startTime: new Date().toISOString()
      };

      launchExamSession();
    } catch (err) {
      alert('Terjadi kesalahan saat memuat soal: ' + err.message);
    }
  }

  // --- Quick Quiz Modal & Launch ---
  function openQuickQuizModal() {
    updateQQDistributionPreview();
    document.getElementById('modal-quick-quiz').classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  function closeQuickQuizModal() {
    document.getElementById('modal-quick-quiz').classList.add('hidden');
  }

  function openQuickQuizForPackage(pkgId) {
    document.getElementById('qq-source-package').value = String(pkgId);
    openQuickQuizModal();
  }

  function setQQCount(count) {
    quickQuizCount = count;
    document.querySelectorAll('.qq-count-opt').forEach(btn => {
      btn.className = 'qq-count-opt p-3 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-center text-slate-700 dark:text-slate-300 text-sm';
    });
    const activeBtn = document.getElementById(`qq-btn-${count}`);
    if (activeBtn) {
      activeBtn.className = 'qq-count-opt p-3 rounded-xl border-2 border-amber-500 bg-amber-50 dark:bg-amber-950/40 font-bold text-center text-amber-700 dark:text-amber-300 text-sm';
    }
    updateQQDistributionPreview();
  }

  function calculateProportionalCounts(targetTotal) {
    const counts = {};
    let allocated = 0;
    const cats = Object.keys(CATEGORY_PROPORTIONS);

    // Initial floor distribution
    cats.forEach(cat => {
      const count = Math.max(1, Math.floor(targetTotal * CATEGORY_PROPORTIONS[cat]));
      counts[cat] = count;
      allocated += count;
    });

    // Distribute remainder or adjust to exact targetTotal
    while (allocated < targetTotal) {
      // Add to highest proportion category (Matematika or Moderasi)
      counts["Matematika"]++;
      allocated++;
    }
    while (allocated > targetTotal) {
      // Deduct from highest count category
      let highestCat = cats.reduce((a, b) => counts[a] > counts[b] ? a : b);
      if (counts[highestCat] > 1) {
        counts[highestCat]--;
        allocated--;
      } else {
        break;
      }
    }

    return counts;
  }

  function updateQQDistributionPreview() {
    const counts = calculateProportionalCounts(quickQuizCount);
    const summaryEl = document.getElementById('qq-distribution-summary');
    if (summaryEl) {
      summaryEl.innerHTML = `
        Verbal: <b>${counts["Kemampuan Verbal"]}</b> • 
        Literasi: <b>${counts["Literasi Bahasa Indonesia"]}</b> • 
        B. Inggris: <b>${counts["Bahasa Inggris"]}</b> • 
        Keislaman: <b>${counts["Keislaman"]}</b> • 
        Matematika: <b>${counts["Matematika"]}</b> • 
        Moderasi: <b>${counts["Moderasi Beragama dan Sikap"]}</b> • 
        Sikap: <b>${counts["Angket Sikap"]}</b>
      `;
    }
  }

  async function launchQuickQuiz() {
    const sourcePkg = document.getElementById('qq-source-package').value;
    closeQuickQuizModal();

    let pool = [];
    if (sourcePkg === 'all') {
      pool = await getAllQuestions();
    } else {
      pool = await getPackageQuestions(Number(sourcePkg));
    }

    // Group pool by category
    const byCategory = {};
    pool.forEach(q => {
      if (!byCategory[q.category]) byCategory[q.category] = [];
      byCategory[q.category].push(q);
    });

    const targetCounts = calculateProportionalCounts(quickQuizCount);
    const selectedQuestions = [];

    // Select random sample per category
    Object.keys(targetCounts).forEach(cat => {
      const available = byCategory[cat] || [];
      const shuffledCat = shuffleArray(available);
      const needed = targetCounts[cat];
      selectedQuestions.push(...shuffledCat.slice(0, needed));
    });

    // Shuffle the final assembled quiz questions
    const finalShuffled = shuffleArray(selectedQuestions);

    // Dynamic duration: ~1.2 minutes per question
    const durationSeconds = Math.round(quickQuizCount * 70);

    const sourceName = sourcePkg === 'all' ? 'Seluruh Paket' : `Paket ${sourcePkg}`;
    currentExam = {
      mode: 'quick_quiz',
      packageName: `Kuis Cepat (${quickQuizCount} Soal • ${sourceName})`,
      questions: finalShuffled,
      currentIndex: 0,
      answers: {},
      flagged: {},
      totalDuration: durationSeconds,
      timeRemaining: durationSeconds,
      timerInterval: null,
      startTime: new Date().toISOString()
    };

    launchExamSession();
  }

  // --- Category Drill Modal & Launch ---
  function openDrillModal() {
    document.getElementById('modal-drill').classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  function closeDrillModal() {
    document.getElementById('modal-drill').classList.add('hidden');
  }

  async function launchDrill() {
    const category = document.getElementById('drill-category-select').value;
    const count = Number(document.getElementById('drill-count-select').value);
    closeDrillModal();

    const allQuestions = await getAllQuestions();
    const filtered = allQuestions.filter(q => q.category === category);
    const shuffled = shuffleArray(filtered).slice(0, count);

    const durationSeconds = count * 90; // 1.5 min per question

    currentExam = {
      mode: 'drill',
      packageName: `Latihan: ${category} (${count} Soal)`,
      questions: shuffled,
      currentIndex: 0,
      answers: {},
      flagged: {},
      totalDuration: durationSeconds,
      timeRemaining: durationSeconds,
      timerInterval: null,
      startTime: new Date().toISOString()
    };

    launchExamSession();
  }

  // --- Launch Exam Session & Timer ---
  function launchExamSession() {
    navigate('exam');

    document.getElementById('exam-package-title').textContent = currentExam.packageName;
    document.getElementById('exam-mode-subtitle').textContent = `Total ${currentExam.questions.length} Soal • Soal Teracak`;

    renderQuestionGrid();
    loadQuestion(0);
    startTimer();
  }

  function startTimer() {
    if (currentExam.timerInterval) {
      clearInterval(currentExam.timerInterval);
    }

    updateTimerDisplay();
    currentExam.timerInterval = setInterval(() => {
      currentExam.timeRemaining--;
      updateTimerDisplay();

      if (currentExam.timeRemaining <= 0) {
        clearInterval(currentExam.timerInterval);
        alert('Waktu ujian telah habis! Jawaban Anda akan otomatis dikumpulkan.');
        finalizeExam();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const timerEl = document.getElementById('exam-timer-display');
    if (!timerEl) return;

    const mins = Math.floor(currentExam.timeRemaining / 60);
    const secs = currentExam.timeRemaining % 60;
    timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

    if (currentExam.timeRemaining <= 300) { // 5 minutes warning
      timerEl.classList.add('timer-warning');
    } else {
      timerEl.classList.remove('timer-warning');
    }
  }

  // --- Render Question & Navigation ---
  function loadQuestion(index) {
    if (index < 0 || index >= currentExam.questions.length) return;
    currentExam.currentIndex = index;

    const q = currentExam.questions[index];
    const userAns = currentExam.answers[index];
    const isFlagged = Boolean(currentExam.flagged[index]);

    // Update Question Meta
    document.getElementById('exam-q-number-badge').textContent = `Soal No. ${index + 1} dari ${currentExam.questions.length}`;
    document.getElementById('exam-q-category-badge').textContent = q.category;

    // Update Question Stem
    document.getElementById('exam-question-body').textContent = q.question;

    // Update Flag Button state
    const flagBtn = document.getElementById('btn-flag-q');
    if (isFlagged) {
      flagBtn.className = 'px-4 py-2.5 rounded-xl border-2 border-amber-500 bg-amber-500 text-white font-semibold flex items-center gap-2 shadow-sm';
    } else {
      flagBtn.className = 'px-4 py-2.5 rounded-xl border border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold hover:bg-amber-100 flex items-center gap-2';
    }

    // Render Options A, B, C, D
    const optionsContainer = document.getElementById('exam-options-container');
    const opts = q.options || {};
    const letters = ['A', 'B', 'C', 'D'];

    optionsContainer.innerHTML = letters.map(letter => {
      const optText = opts[letter] || '';
      const isSelected = userAns === letter;
      return `
        <div onclick="App.selectOption('${letter}')" class="option-card ${isSelected ? 'selected' : ''} flex items-start gap-3">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 transition-all ${
            isSelected ? 'bg-blue-600 text-white shadow' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
          }">
            ${letter}
          </div>
          <div class="text-sm sm:text-base text-slate-800 dark:text-slate-200 pt-0.5 leading-normal flex-1">
            ${optText || '(Pilihan Kosong)'}
          </div>
        </div>
      `;
    }).join('');

    // Previous / Next button states
    document.getElementById('btn-prev-q').disabled = (index === 0);
    document.getElementById('btn-prev-q').style.opacity = (index === 0) ? '0.4' : '1';

    updateQuestionGridActive();
  }

  function selectOption(letter) {
    const idx = currentExam.currentIndex;
    currentExam.answers[idx] = letter;
    loadQuestion(idx);
    updateQuestionGridStatus(idx);
    updateNavProgress();
  }

  function toggleFlagCurrent() {
    const idx = currentExam.currentIndex;
    currentExam.flagged[idx] = !currentExam.flagged[idx];
    loadQuestion(idx);
    updateQuestionGridStatus(idx);
  }

  function prevQuestion() {
    if (currentExam.currentIndex > 0) {
      loadQuestion(currentExam.currentIndex - 1);
    }
  }

  function nextQuestion() {
    if (currentExam.currentIndex < currentExam.questions.length - 1) {
      loadQuestion(currentExam.currentIndex + 1);
    }
  }

  // --- Question Number Navigation Grid ---
  function renderQuestionGrid() {
    const container = document.getElementById('exam-number-grid');
    if (!container) return;

    container.innerHTML = currentExam.questions.map((q, idx) => `
      <button onclick="App.loadQuestion(${idx})" id="q-nav-btn-${idx}" class="q-btn q-btn-unanswered">
        ${idx + 1}
      </button>
    `).join('');

    updateNavProgress();
  }

  function updateQuestionGridStatus(index) {
    const btn = document.getElementById(`q-nav-btn-${index}`);
    if (!btn) return;

    const hasAnswer = Boolean(currentExam.answers[index]);
    const isFlagged = Boolean(currentExam.flagged[index]);

    btn.className = 'q-btn';
    if (isFlagged) {
      btn.classList.add('q-btn-flagged');
    } else if (hasAnswer) {
      btn.classList.add('q-btn-answered');
    } else {
      btn.classList.add('q-btn-unanswered');
    }

    if (index === currentExam.currentIndex) {
      btn.classList.add('q-btn-active');
    }
  }

  function updateQuestionGridActive() {
    currentExam.questions.forEach((_, idx) => {
      updateQuestionGridStatus(idx);
    });
  }

  function updateNavProgress() {
    const answeredCount = Object.keys(currentExam.answers).length;
    const progressEl = document.getElementById('exam-nav-progress');
    if (progressEl) {
      progressEl.textContent = `${answeredCount}/${currentExam.questions.length} Terjawab`;
    }
  }

  // --- Submit & Result Finalization ---
  function promptSubmitExam() {
    const answered = Object.keys(currentExam.answers).length;
    const flagged = Object.values(currentExam.flagged).filter(Boolean).length;
    const unanswered = currentExam.questions.length - answered;

    document.getElementById('confirm-answered-count').textContent = answered;
    document.getElementById('confirm-flagged-count').textContent = flagged;
    document.getElementById('confirm-unanswered-count').textContent = unanswered;

    const warningEl = document.getElementById('confirm-unanswered-warning');
    if (unanswered > 0 || flagged > 0) {
      warningEl.classList.remove('hidden');
    } else {
      warningEl.classList.add('hidden');
    }

    document.getElementById('modal-submit-confirm').classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  function closeSubmitModal() {
    document.getElementById('modal-submit-confirm').classList.add('hidden');
  }

  function finalizeExam() {
    closeSubmitModal();
    if (currentExam.timerInterval) {
      clearInterval(currentExam.timerInterval);
    }

    const durationTaken = currentExam.totalDuration - currentExam.timeRemaining;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const categoryStats = {};

    const reviewQuestions = currentExam.questions.map((q, idx) => {
      const userAns = currentExam.answers[idx] || null;
      const key = q.answerKey;
      const isCorrect = (userAns === key);

      // Track Category Stats
      if (!categoryStats[q.category]) {
        categoryStats[q.category] = { total: 0, correct: 0 };
      }
      categoryStats[q.category].total++;

      if (userAns) {
        if (isCorrect) {
          correctCount++;
          categoryStats[q.category].correct++;
        } else {
          incorrectCount++;
        }
      } else {
        unansweredCount++;
      }

      return {
        ...q,
        userAnswer: userAns,
        isCorrect: isCorrect,
        flagged: Boolean(currentExam.flagged[idx])
      };
    });

    const scorePercentage = Math.round((correctCount / currentExam.questions.length) * 100);

    const sessionRecord = {
      id: 'tryout_' + Date.now(),
      date: new Date().toISOString(),
      displayDate: new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date()),
      packageName: currentExam.packageName,
      mode: currentExam.mode,
      durationSeconds: durationTaken,
      score: scorePercentage,
      totalQuestions: currentExam.questions.length,
      correctCount: correctCount,
      incorrectCount: incorrectCount,
      unansweredCount: unansweredCount,
      categoryStats: categoryStats,
      questions: reviewQuestions
    };

    // Save to localStorage history
    saveHistoryRecord(sessionRecord);

    // Present Result
    showResultScreen(sessionRecord);
  }

  function showResultScreen(record) {
    currentReviewSession = record;
    navigate('result');

    document.getElementById('result-package-name').textContent = record.packageName;
    document.getElementById('result-date-time').textContent = record.displayDate;
    document.getElementById('result-score-val').textContent = record.score;
    document.getElementById('result-score-percent').textContent = `Akurasi ${record.score}% • ${record.correctCount} dari ${record.totalQuestions} Benar`;

    document.getElementById('result-total-q').textContent = record.totalQuestions;
    document.getElementById('result-correct-q').textContent = record.correctCount;
    document.getElementById('result-incorrect-q').textContent = record.incorrectCount;
    document.getElementById('result-unanswered-q').textContent = record.unansweredCount;

    // Render Diagnostic Category Breakdown
    const breakdownContainer = document.getElementById('result-category-breakdown');
    if (breakdownContainer && record.categoryStats) {
      breakdownContainer.innerHTML = Object.keys(record.categoryStats).map(cat => {
        const item = record.categoryStats[cat];
        const pct = Math.round((item.correct / item.total) * 100);
        let colorClass = 'bg-emerald-500';
        if (pct < 50) colorClass = 'bg-rose-500';
        else if (pct < 75) colorClass = 'bg-amber-500';

        return `
          <div class="space-y-1">
            <div class="flex items-center justify-between text-xs font-semibold">
              <span class="text-slate-700 dark:text-slate-300">${cat}</span>
              <span class="text-slate-500">${item.correct}/${item.total} Benar (${pct}%)</span>
            </div>
            <div class="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full ${colorClass} transition-all duration-500 rounded-full" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // Trigger celebration confetti if score is great
    if (record.score >= 70 && window.confetti) {
      window.confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    }

    if (window.lucide) window.lucide.createIcons();
  }

  function reviewCurrentResult() {
    if (currentReviewSession) {
      openReview(currentReviewSession);
    }
  }

  // --- Review Mode ---
  function openReview(sessionRecord) {
    currentReviewSession = sessionRecord;
    currentReviewFilter = 'all';
    navigate('review');

    document.getElementById('review-header-title').textContent = `Review: ${sessionRecord.packageName}`;
    document.getElementById('review-header-subtitle').textContent = `${sessionRecord.displayDate} • Skor: ${sessionRecord.score} (${sessionRecord.correctCount}/${sessionRecord.totalQuestions} Benar)`;
    document.getElementById('review-filter-select').value = 'all';

    renderReviewQuestions();
  }

  function applyReviewFilter(filterValue) {
    currentReviewFilter = filterValue;
    renderReviewQuestions();
  }

  function renderReviewQuestions() {
    const container = document.getElementById('review-questions-list');
    if (!container || !currentReviewSession) return;

    let filtered = currentReviewSession.questions;
    if (currentReviewFilter === 'correct') {
      filtered = filtered.filter(q => q.isCorrect);
    } else if (currentReviewFilter === 'incorrect') {
      filtered = filtered.filter(q => q.userAnswer && !q.isCorrect);
    } else if (currentReviewFilter === 'unanswered') {
      filtered = filtered.filter(q => !q.userAnswer || q.flagged);
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="p-8 text-center text-sm text-slate-500 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          Tidak ada soal yang sesuai dengan filter ini.
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map((q, idx) => {
      const isCorrect = q.isCorrect;
      const userAns = q.userAnswer || 'Tidak Dijawab';
      const key = q.answerKey;

      let statusBadge = '';
      if (!q.userAnswer) {
        statusBadge = '<span class="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 font-bold text-xs">Kosong</span>';
      } else if (isCorrect) {
        statusBadge = '<span class="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 font-bold text-xs flex items-center gap-1"><i data-lucide="check" class="w-3.5 h-3.5"></i> Benar</span>';
      } else {
        statusBadge = '<span class="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 font-bold text-xs flex items-center gap-1"><i data-lucide="x" class="w-3.5 h-3.5"></i> Salah</span>';
      }

      return `
        <div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 shadow-sm">
          <div class="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-700/60">
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-slate-900 dark:text-white">Soal #${idx + 1} (${q.id})</span>
              <span class="text-xs text-slate-500 font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700">${q.category}</span>
            </div>
            ${statusBadge}
          </div>

          <div class="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-medium">
            ${q.question}
          </div>

          <!-- Options comparison -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
            ${['A', 'B', 'C', 'D'].map(l => {
              const text = q.options[l] || '';
              const isKey = (l === key);
              const isChosen = (l === q.userAnswer);

              let optClass = 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300';
              if (isKey) {
                optClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-semibold';
              } else if (isChosen && !isCorrect) {
                optClass = 'border-rose-400 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200';
              }

              return `
                <div class="p-2.5 rounded-xl border text-xs sm:text-sm flex items-start gap-2 ${optClass}">
                  <span class="font-bold">${l}.</span>
                  <span class="flex-1">${text}</span>
                  ${isKey ? '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500 text-white">KUNCI</span>' : ''}
                  ${(isChosen && !isCorrect) ? '<span class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500 text-white">JAWABANMU</span>' : ''}
                </div>
              `;
            }).join('')}
          </div>

          <!-- Explanation box -->
          <div class="rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 p-4 space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
            <div class="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
              <i data-lucide="info" class="w-4 h-4"></i>
              Kunci Jawaban & Pembahasan Lengkap:
            </div>
            <div class="leading-relaxed whitespace-pre-line text-slate-600 dark:text-slate-400">
              ${q.explanation || 'Pembahasan tidak tersedia.'}
            </div>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  // --- History LocalStorage Management ---
  function getHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveHistoryRecord(record) {
    const list = getHistory();
    list.unshift(record);
    // keep max 50 recent records to prevent storage quota issues
    const trimmed = list.slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmed));
  }

  function renderHistoryTable() {
    const history = getHistory();
    const emptyState = document.getElementById('history-empty-state');
    const tableWrapper = document.getElementById('history-table-wrapper');
    const tbody = document.getElementById('history-table-body');

    if (!tbody) return;

    if (history.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      if (tableWrapper) tableWrapper.classList.add('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    if (tableWrapper) tableWrapper.classList.remove('hidden');

    tbody.innerHTML = history.map(item => `
      <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
        <td class="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
          ${item.displayDate}
          <div class="text-[11px] text-slate-400 font-normal">${Math.round(item.durationSeconds / 60)} menit</div>
        </td>
        <td class="px-6 py-4">
          <span class="font-bold text-slate-900 dark:text-white">${item.packageName}</span>
          <span class="block text-xs text-slate-400 capitalize">${item.mode.replace('_', ' ')}</span>
        </td>
        <td class="px-6 py-4">${item.totalQuestions} Soal</td>
        <td class="px-6 py-4">
          <span class="text-emerald-600 dark:text-emerald-400 font-bold">${item.correctCount} B</span> / 
          <span class="text-rose-600 dark:text-rose-400 font-bold">${item.incorrectCount} S</span>
        </td>
        <td class="px-6 py-4">
          <span class="px-2.5 py-1 rounded-lg font-black text-xs ${
            item.score >= 70 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'
          }">
            ${item.score}%
          </span>
        </td>
        <td class="px-6 py-4 text-right space-x-2">
          <button onclick="App.openReviewById('${item.id}')" class="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 text-blue-600 dark:text-blue-300 font-semibold text-xs transition-colors">
            Review
          </button>
          <button onclick="App.deleteHistoryById('${item.id}')" class="px-2 py-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors" title="Hapus sesi ini">
            <i data-lucide="trash" class="w-4 h-4"></i>
          </button>
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  function openReviewById(id) {
    const history = getHistory();
    const found = history.find(item => item.id === id);
    if (found) {
      openReview(found);
    }
  }

  function deleteHistoryById(id) {
    if (!confirm('Hapus sesi tryout ini dari riwayat?')) return;
    const history = getHistory().filter(item => item.id !== id);
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    renderHistoryTable();
    updateDashboardStats();
  }

  function clearAllHistory() {
    if (!confirm('Apakah Anda yakin ingin menghapus SELURUH riwayat tryout? Tindakan ini tidak dapat dibatalkan.')) return;
    localStorage.removeItem(STORAGE_KEYS.HISTORY);
    renderHistoryTable();
    updateDashboardStats();
  }

  function exportHistoryJSON() {
    const history = getHistory();
    if (history.length === 0) {
      alert('Belum ada data riwayat untuk di-backup.');
      return;
    }
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_riwayat_cbt_man_ic_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importHistoryJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        if (!Array.isArray(imported)) throw new Error('Format file JSON tidak sesuai.');
        const existing = getHistory();
        // merge unique by id
        const map = new Map();
        [...imported, ...existing].forEach(item => {
          if (item && item.id) map.set(item.id, item);
        });
        const merged = Array.from(map.values()).slice(0, 50);
        localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(merged));
        alert('Berhasil me-restore riwayat tryout!');
        renderHistoryTable();
        updateDashboardStats();
      } catch (err) {
        alert('Gagal membaca file: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  function updateDashboardStats() {
    const history = getHistory();
    const countEl = document.getElementById('stat-tryouts-count');
    const avgScoreEl = document.getElementById('stat-avg-score');

    if (countEl) countEl.textContent = history.length;
    if (avgScoreEl) {
      if (history.length === 0) {
        avgScoreEl.textContent = '0%';
      } else {
        const totalScore = history.reduce((acc, h) => acc + (h.score || 0), 0);
        const avg = Math.round(totalScore / history.length);
        avgScoreEl.textContent = `${avg}%`;
      }
    }
  }

  // --- Theme Toggle ---
  function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
    if (window.lucide) window.lucide.createIcons();
  }

  function loadTheme() {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  // --- Font Size Adjustment ---
  function setFontSize(size) {
    const target = document.querySelector('.exam-font-target');
    if (!target) return;
    target.classList.remove('font-size-sm', 'font-size-md', 'font-size-lg');
    target.classList.add(`font-size-${size}`);
    localStorage.setItem(STORAGE_KEYS.FONT_SIZE, size);

    ['sm', 'md', 'lg'].forEach(s => {
      const btn = document.getElementById(`btn-font-${s}`);
      if (btn) {
        if (s === size) {
          btn.className = 'px-2 py-0.5 rounded bg-white dark:bg-slate-700 shadow-sm font-semibold';
        } else {
          btn.className = 'px-2 py-0.5 rounded hover:bg-white dark:hover:bg-slate-700 font-semibold';
        }
      }
    });
  }

  function loadFontSize() {
    const saved = localStorage.getItem(STORAGE_KEYS.FONT_SIZE) || 'md';
    setFontSize(saved);
  }

  function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    if (menu) menu.classList.toggle('hidden');
  }

  // --- Public API ---
  return {
    init,
    navigate,
    toggleTheme,
    toggleMobileMenu,
    setFontSize,
    startFullTryout,
    openQuickQuizModal,
    closeQuickQuizModal,
    openQuickQuizForPackage,
    setQQCount,
    launchQuickQuiz,
    openDrillModal,
    closeDrillModal,
    launchDrill,
    loadQuestion,
    selectOption,
    toggleFlagCurrent,
    prevQuestion,
    nextQuestion,
    promptSubmitExam,
    closeSubmitModal,
    finalizeExam,
    reviewCurrentResult,
    openReview,
    openReviewById,
    applyReviewFilter,
    deleteHistoryById,
    clearAllHistory,
    exportHistoryJSON,
    importHistoryJSON
  };
})();

// Initialize application on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
