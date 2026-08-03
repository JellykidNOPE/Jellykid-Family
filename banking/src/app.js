const STORAGE_KEY = "sprout-bank-state-v1";
const colors = ["#1fa6a0", "#f06464", "#ffc857", "#69b578", "#8f63d8", "#4b8fda"];
const laughMascots = ["./assets/mascot-laugh.png", "./assets/mascot-laugh-back.png"];
const defaultMascot = "./assets/mascot.png";
const grumpyMascot = "./assets/mascot-grumpy.png";
const friendMascots = {
  sunny: { name: "Sunny", image: "./assets/mascot-friend-yellow.png" },
  berry: { name: "Berry", image: "./assets/mascot-friend-red.png" }
};
const mascotTeam = [
  { name: "Sprout", image: defaultMascot },
  friendMascots.sunny,
  friendMascots.berry
];
const milestoneLevels = [10, 20, 30, 40, 50, 60];
const learningRewardAmount = 0.25;
const learningRewardTarget = 10;
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const phonics = {
  A: "ah",
  B: "buh",
  C: "kuh",
  D: "duh",
  E: "eh",
  F: "fff",
  G: "guh",
  H: "huh",
  I: "ih",
  J: "juh",
  K: "kuh",
  L: "lll",
  M: "mmm",
  N: "nnn",
  O: "oh",
  P: "puh",
  Q: "kwuh",
  R: "rrr",
  S: "sss",
  T: "tuh",
  U: "uh",
  V: "vvv",
  W: "wuh",
  X: "ks",
  Y: "yuh",
  Z: "zzz"
};
const learningScreens = ["home", "math-menu", "letters-menu", "addition", "subtraction", "counting", "alphabet", "words"];
const learningWords = [
  { word: "CAT", icon: "C", hint: "Cat" },
  { word: "SUN", icon: "S", hint: "Sun" },
  { word: "BUG", icon: "B", hint: "Bug" },
  { word: "HAT", icon: "H", hint: "Hat" },
  { word: "DOG", icon: "D", hint: "Dog" },
  { word: "MAP", icon: "M", hint: "Map" }
];
const shopItems = [
  { id: "classic", name: "Classic Sprout", cost: 0, image: defaultMascot, detail: "The original helper." },
  { id: "hotdog", name: "Hotdog Suit", cost: 1, image: "./assets/mascot-hotdog.png", detail: "A snack parade legend." },
  { id: "princess", name: "Royal Sprout", cost: 1, image: "./assets/mascot-princess.png", detail: "Sparkly, brave, and fancy." },
  { id: "space", name: "Space Sprout", cost: 1, image: "./assets/mascot-space.png", detail: "Ready for moon missions." },
  { id: "wizard", name: "Wizard Sprout", cost: 1, image: "./assets/mascot-wizard.png", detail: "Turns chores into magic." }
];
const recurrenceOptions = {
  multi: { label: "Multi-complete", days: 0, multi: true },
  daily: { label: "Daily", days: 1 },
  weekly: { label: "Weekly", days: 7 },
  biweekly: { label: "Bi-weekly", days: 14 },
  learning: { label: "Learning", days: 0, learning: true }
};

function makeId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const sampleState = {
  childName: "",
  adultMode: false,
  soundOn: true,
  useTokenCurrency: false,
  chores: [
    { id: makeId(), title: "Make the bed", amount: 1.25, category: "Bedroom", recurrence: "daily", status: "open", completedAt: null, paidAt: null, nextDue: null },
    { id: makeId(), title: "Clear the table", amount: 1.5, category: "Kitchen", recurrence: "daily", status: "open", completedAt: null, paidAt: null, nextDue: null },
    { id: makeId(), title: "Brush teeth", amount: 0.5, category: "Bathroom", recurrence: "multi", status: "open", completedAt: null, paidAt: null, nextDue: null },
    { id: makeId(), title: "Feed the pet", amount: 2, category: "Pets", recurrence: "weekly", status: "open", completedAt: null, paidAt: null, nextDue: null },
    { id: makeId(), title: "Read for 20 minutes", amount: 2.5, category: "Homework", recurrence: "weekly", status: "open", completedAt: null, paidAt: null, nextDue: null }
  ],
  transactions: [],
  rewards: {
    tokens: 0,
    claimedMilestones: [],
    ownedOutfits: ["classic"],
    activeOutfit: "classic",
    purchaseOrder: []
  },
  learning: {
    screen: "home",
    additionProblem: null,
    subtractionProblem: null,
    countingProblem: null,
    countMixProblem: null,
    countingMode: null,
    currentLetter: "A",
    currentWord: "CAT",
    wordLetters: [],
    wordPlaced: [],
    selectedWordIndex: null,
    wordComplete: false,
    writingCheckOpen: false,
    wordWritingCheckOpen: false,
    correctCount: 0,
    feedback: "Complete 10 practice wins to send a reward for approval.",
    feedbackMood: "ready"
  }
};

let state = loadState();
let chartMode = "bar";
let parentMode = "approvals";
let audioContext = null;
let lastHoverTarget = null;
let lastHoverSoundAt = 0;
let trailOpen = false;
let shopOpen = false;
let settingsOpen = false;
let undoSnapshot = null;
let writingActive = false;
let sproutVoice = null;

const els = {
  tabs: document.querySelectorAll(".tab"),
  chartTabs: document.querySelectorAll(".chart-tab"),
  parentTabs: document.querySelectorAll(".parent-tab"),
  panels: document.querySelectorAll("[data-view-panel]"),
  parentPanels: document.querySelectorAll("[data-parent-panel]"),
  childName: document.querySelector("#childName"),
  adultMode: document.querySelector("#adultMode"),
  soundEffects: document.querySelector("#soundEffects"),
  tokenCurrency: document.querySelector("#tokenCurrency"),
  settingsPanel: document.querySelector("#settingsPanel"),
  settingsToggle: document.querySelector("[data-toggle-settings]"),
  greeting: document.querySelector("#greeting"),
  todayDate: document.querySelector("#todayDate"),
  balance: document.querySelector("#balance"),
  bankBalance: document.querySelector("#bankBalance"),
  pendingTotal: document.querySelector("#pendingTotal"),
  streakCount: document.querySelector("#streakCount"),
  tokenCount: document.querySelector("#tokenCount"),
  shopTokenCount: document.querySelector("#shopTokenCount"),
  trailPanel: document.querySelector("#trailPanel"),
  trailBody: document.querySelector("#trailBody"),
  trailToggle: document.querySelector("[data-toggle-trail]"),
  shopPanel: document.querySelector("#shopPanel"),
  shopBody: document.querySelector("#shopBody"),
  shopToggle: document.querySelector("[data-toggle-shop]"),
  milestoneTrail: document.querySelector("#milestoneTrail"),
  outfitShop: document.querySelector("#outfitShop"),
  choreList: document.querySelector("#choreList"),
  missionList: document.querySelector("#missionList"),
  approvalList: document.querySelector("#approvalList"),
  approvalBadge: document.querySelector("#approvalBadge"),
  approvalShortcut: document.querySelector("#approvalShortcut"),
  approvalShortcutText: document.querySelector("#approvalShortcutText"),
  choreForm: document.querySelector("#choreForm"),
  missionSubmit: document.querySelector("#missionSubmit"),
  cancelEdit: document.querySelector("#cancelEdit"),
  missionFormTitle: document.querySelector("#add-chore-title"),
  purchaseForm: document.querySelector("#purchaseForm"),
  transactions: document.querySelector("#transactions"),
  goalMeter: document.querySelector("#goalMeter"),
  goalText: document.querySelector("#goalText"),
  moneyChart: document.querySelector("#moneyChart"),
  learningPanels: document.querySelectorAll("[data-learn-panel]"),
  learningRewardLabel: document.querySelector("#learningRewardLabel"),
  learningCoachImage: document.querySelector("#learningCoachImage"),
  learningCoachMessage: document.querySelector("#learningCoachMessage"),
  learningProgressText: document.querySelector("#learningProgressText"),
  learningProgressFill: document.querySelector("#learningProgressFill"),
  additionProblem: document.querySelector("#additionProblem"),
  additionVisuals: document.querySelector("#additionVisuals"),
  additionAnswers: document.querySelector("#additionAnswers"),
  subtractionProblem: document.querySelector("#subtractionProblem"),
  subtractionVisuals: document.querySelector("#subtractionVisuals"),
  subtractionAnswers: document.querySelector("#subtractionAnswers"),
  countingDots: document.querySelector("#countingDots"),
  countingAnswers: document.querySelector("#countingAnswers"),
  mixedCounting: document.querySelector(".mixed-counting"),
  mixedCountingQuestion: document.querySelector("#mixedCountingQuestion"),
  mixedCountingBoard: document.querySelector("#mixedCountingBoard"),
  mixedCountingProgress: document.querySelector("#mixedCountingProgress"),
  letterDisplay: document.querySelector("#letterDisplay"),
  writingPad: document.querySelector("#writingPad"),
  clearWriting: document.querySelector("#clearWriting"),
  wordPicture: document.querySelector("#wordPicture"),
  wordSlots: document.querySelector("#wordSlots"),
  wordLetterBank: document.querySelector("#wordLetterBank"),
  wordWritingPrompt: document.querySelector("#wordWritingPrompt"),
  wordWritingPad: document.querySelector("#wordWritingPad"),
  clearWordWriting: document.querySelector("#clearWordWriting"),
  writingCheck: document.querySelector("#writingCheck"),
  wordWritingCheck: document.querySelector("#wordWritingCheck"),
  heroMascot: document.querySelector("#heroMascot"),
  spendBadges: document.querySelector("#spendBadges"),
  toast: document.querySelector("#toast"),
  toastMessage: document.querySelector("#toastMessage"),
  undoButton: document.querySelector("#undoButton"),
  undoLastAction: document.querySelector("#undoLastAction"),
  confetti: document.querySelector("#confetti"),
  resetDemo: document.querySelector("#resetDemo")
};

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(sampleState);

  try {
    return sanitizeState(JSON.parse(saved));
  } catch {
    return structuredClone(sampleState);
  }
}

function sanitizeState(loadedState) {
  const cleaned = { ...structuredClone(sampleState), ...loadedState };
  cleaned.adultMode = false;
  if (cleaned.childName === "Jamie") cleaned.childName = "";
  cleaned.chores = (cleaned.chores || []).map((chore) => ({
    ...chore,
    learningReward: Boolean(chore.learningReward),
    recurrence: chore.learningReward ? "learning" : normalizedRecurrence(chore.recurrence),
    paidAt: chore.paidAt || null,
    nextDue: chore.nextDue || null
  }));
  cleaned.transactions = (cleaned.transactions || []).filter((tx) => {
    const isDemoDeposit = tx.title === "Welcome bonus" && tx.note === "Starting balance";
    const isDemoPurchase = tx.title === "Sticker pack" && tx.location === "Craft shop";
    return !isDemoDeposit && !isDemoPurchase;
  }).map((tx) => ({ ...tx, voidedAt: tx.voidedAt || null }));
  cleaned.soundOn = cleaned.soundOn !== false;
  cleaned.useTokenCurrency = Boolean(cleaned.useTokenCurrency);
  cleaned.rewards = sanitizeRewards(cleaned.rewards);
  cleaned.learning = sanitizeLearning(cleaned.learning);
  return cleaned;
}

function sanitizeLearning(learning = {}) {
  const screen = learningScreens.includes(learning.screen) ? learning.screen : "home";
  const currentLetter = alphabet.includes(learning.currentLetter) ? learning.currentLetter : "A";
  const word = learningWords.some((item) => item.word === learning.currentWord) ? learning.currentWord : learningWords[0].word;
  const wordLetters = Array.isArray(learning.wordLetters) && learning.wordLetters.length ? learning.wordLetters : shuffleLetters(word.split(""));
  const wordPlaced = Array.isArray(learning.wordPlaced) && learning.wordPlaced.length === word.length ? learning.wordPlaced : Array(word.length).fill(null);
  const correctCount = Math.min(Math.max(Number(learning.correctCount) || 0, 0), learningRewardTarget - 1);
  return {
    screen,
    additionProblem: sanitizeProblem(learning.additionProblem || (learning.mathProblem?.operator === "+" ? learning.mathProblem : null), () => createMathProblem("+")),
    subtractionProblem: sanitizeProblem(learning.subtractionProblem || (learning.mathProblem?.operator === "-" ? learning.mathProblem : null), () => createMathProblem("-")),
    countingProblem: sanitizeProblem(learning.countingProblem, createCountingProblem),
    countMixProblem: sanitizeCountMixProblem(learning.countMixProblem),
    countingMode: ["simple", "mixed"].includes(learning.countingMode) ? learning.countingMode : randomCountingMode(),
    currentLetter,
    currentWord: word,
    wordLetters,
    wordPlaced,
    selectedWordIndex: Number.isInteger(learning.selectedWordIndex) ? learning.selectedWordIndex : null,
    wordComplete: Boolean(learning.wordComplete),
    writingCheckOpen: false,
    wordWritingCheckOpen: false,
    correctCount,
    feedback: typeof learning.feedback === "string" ? learning.feedback : "Complete 10 practice wins to send a reward for approval.",
    feedbackMood: ["ready", "hype", "bummed", "reward"].includes(learning.feedbackMood) ? learning.feedbackMood : "ready"
  };
}

function sanitizeProblem(problem, factory) {
  if (!problem || !Number.isFinite(Number(problem.answer)) || !Array.isArray(problem.options)) return factory();
  const answer = Number(problem.answer);
  const counted = Array.isArray(problem.counted) && problem.counted.length === answer
    ? problem.counted.map(Boolean)
    : Array(answer).fill(false);
  return {
    ...problem,
    answer,
    options: problem.options.map(Number).filter(Number.isFinite).slice(0, 4),
    counted,
    countedTotal: Math.min(Math.max(Number(problem.countedTotal) || counted.filter(Boolean).length, 0), answer)
  };
}

function sanitizeRewards(rewards = {}) {
  const owned = Array.isArray(rewards.ownedOutfits) ? rewards.ownedOutfits : ["classic"];
  const claimed = Array.isArray(rewards.claimedMilestones) ? rewards.claimedMilestones : [];
  const active = shopItems.some((item) => item.id === rewards.activeOutfit) ? rewards.activeOutfit : "classic";
  const purchased = Array.isArray(rewards.purchaseOrder) ? rewards.purchaseOrder : [];
  const ownedPurchased = owned.filter((id) => id !== "classic" && shopItems.some((item) => item.id === id));
  const purchaseOrder = [
    ...purchased.filter((id) => ownedPurchased.includes(id)),
    ...ownedPurchased.filter((id) => !purchased.includes(id))
  ];
  return {
    tokens: Math.max(Number(rewards.tokens) || 0, 0),
    claimedMilestones: [...new Set(claimed.map(Number).filter((level) => milestoneLevels.includes(level)))],
    ownedOutfits: [...new Set(["classic", ...owned.filter((id) => shopItems.some((item) => item.id === id))])],
    activeOutfit: owned.includes(active) || active === "classic" ? active : "classic",
    purchaseOrder: [...new Set(purchaseOrder)]
  };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function money(value) {
  if (state?.useTokenCurrency) return tokenCurrency(value);
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value || 0);
}

function tokenCurrency(value) {
  const numeric = Number(value) || 0;
  const formatted = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: Number.isInteger(numeric) ? 0 : 2
  }).format(numeric);
  return `${formatted} ${Math.abs(numeric) === 1 ? "token" : "tokens"}`;
}

function currencyIcon() {
  return state.useTokenCurrency ? "T" : "$";
}

function currencyLabel() {
  return state.useTokenCurrency ? "tokens" : "money";
}

function shortDate(iso) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso));
}

function totalBalance() {
  return activeTransactions().reduce((sum, tx) => sum + Number(tx.amount), 0);
}

function activeTransactions() {
  return state.transactions.filter((tx) => !tx.voidedAt);
}

function pendingValue() {
  return pendingApprovals().reduce((sum, chore) => sum + Number(chore.amount), 0);
}

function pendingApprovals() {
  return state.chores.filter((chore) => chore.status === "pending");
}

function approvedTodayCount() {
  const today = new Date().toDateString();
  return activeTransactions().filter((tx) => tx.type === "earn" && new Date(tx.date).toDateString() === today).length;
}

function render() {
  refreshRecurringMissions();
  const balance = totalBalance();
  syncMilestoneRewards(balance);
  const pending = pendingValue();
  const firstName = state.childName.trim() || "kiddo";

  if (!els.heroMascot.classList.contains("celebrating")) {
    els.heroMascot.src = currentMascotImage();
  }
  els.childName.value = state.childName;
  els.adultMode.checked = state.adultMode;
  els.soundEffects.checked = state.soundOn;
  els.tokenCurrency.checked = state.useTokenCurrency;
  els.todayDate.textContent = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  els.greeting.textContent = `Ready for today's wins, ${firstName}?`;
  els.balance.textContent = money(balance);
  els.bankBalance.textContent = money(balance);
  els.pendingTotal.textContent = money(pending);
  els.streakCount.textContent = `${Math.max(approvedTodayCount(), 0)} today`;
  els.tokenCount.textContent = String(state.rewards.tokens);
  els.shopTokenCount.textContent = String(state.rewards.tokens);
  els.goalMeter.style.width = `${Math.min(Math.max((balance / 25) * 100, 3), 100)}%`;
  els.goalText.textContent = balance >= 25 ? `Goal unlocked: the ${money(25)} milestone is glowing.` : `${money(Math.max(25 - balance, 0))} until the ${money(25)} milestone.`;

  renderChores();
  renderMissionManager();
  renderApprovalSignals();
  renderApprovals();
  renderTransactions();
  renderBadges();
  renderMilestones(balance);
  renderTrailPanel();
  renderShop();
  renderShopPanel();
  renderSettingsPanel();
  renderAdultControls();
  drawChart();
  renderLearning();
  setupWritingPad();
  saveState();
}

function syncMilestoneRewards(balance) {
  const previouslyClaimed = state.rewards.claimedMilestones.length;
  const earnedMilestones = milestoneLevels.filter((level) => balance >= level);
  const earnedTokens = earnedMilestones.length;
  let purchaseOrder = normalizePurchaseOrder();
  let spentTokens = tokenCostFor(purchaseOrder);

  while (spentTokens > earnedTokens && purchaseOrder.length) {
    purchaseOrder.pop();
    spentTokens = tokenCostFor(purchaseOrder);
  }

  state.rewards.claimedMilestones = earnedMilestones;
  state.rewards.purchaseOrder = purchaseOrder;
  state.rewards.ownedOutfits = ["classic", ...purchaseOrder];
  state.rewards.tokens = Math.max(earnedTokens - spentTokens, 0);

  if (!state.rewards.ownedOutfits.includes(state.rewards.activeOutfit)) {
    state.rewards.activeOutfit = "classic";
  }

  if (earnedTokens > previouslyClaimed) {
    const count = earnedTokens - previouslyClaimed;
    celebrate(`${count} closet token${count === 1 ? "" : "s"} unlocked.`, { undo: Boolean(undoSnapshot) });
  }
}

function normalizePurchaseOrder() {
  const purchased = Array.isArray(state.rewards.purchaseOrder) ? state.rewards.purchaseOrder : [];
  const ownedPurchased = state.rewards.ownedOutfits.filter((id) => id !== "classic" && shopItems.some((item) => item.id === id));
  return [...new Set([
    ...purchased.filter((id) => ownedPurchased.includes(id)),
    ...ownedPurchased.filter((id) => !purchased.includes(id))
  ])];
}

function tokenCostFor(ids) {
  return ids.reduce((sum, id) => sum + Number(shopItems.find((item) => item.id === id)?.cost || 0), 0);
}

function renderChores() {
  const sorted = state.chores.filter((chore) => !chore.learningReward).sort((a, b) => statusRank(a.status) - statusRank(b.status));

  if (!sorted.length) {
    els.choreList.innerHTML = `<div class="empty-state">No missions yet.</div>`;
    return;
  }

  els.choreList.innerHTML = sorted
    .map((chore, index) => {
      const isPending = chore.status === "pending";
      const isPaid = chore.status === "paid";
      const isMulti = chore.recurrence === "multi";
      const multiCount = multiCompleteCountToday(chore);
      const isMultiCapped = isMulti && multiCount >= 3 && !isPending;
      const label = chore.status === "open" ? "Check done" : isPending ? "Waiting for adult" : isMultiCapped ? "Done today" : "Deposited";
      const actionAttribute = chore.status === "open" ? `data-complete="${chore.id}"` : "";
      const isLocked = chore.status !== "open";
      const duePill = isPaid && chore.nextDue ? `<span class="pill">${nextDueLabel(chore.nextDue)}</span>` : "";
      const multiPill = isMulti ? `<span class="pill">${multiCount}/3 today</span>` : "";
      return `
        <article class="chore-card" style="--card-color: ${colors[index % colors.length]}">
          <small>${chore.category}</small>
          <h3>${escapeHtml(chore.title)}</h3>
          <div class="chore-meta">
            <span class="pill">${money(chore.amount)}</span>
            <span class="pill">${recurrenceLabel(chore.recurrence)}</span>
            ${multiPill}
            <span class="pill">${statusText(chore.status)}</span>
            ${duePill}
          </div>
          <div class="chore-actions">
            <button class="check-action ${isLocked ? "done" : ""}" type="button" ${actionAttribute} ${isLocked ? "disabled" : ""}>${label}</button>
            ${state.adultMode ? `<button class="small-action light" type="button" data-delete="${chore.id}">Remove</button>` : ""}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderApprovals() {
  const pending = pendingApprovals();
  if (!state.adultMode) {
    els.approvalList.innerHTML = `<div class="empty-state">Adult mode is off.</div>`;
    return;
  }
  if (!pending.length) {
    els.approvalList.innerHTML = `<div class="empty-state">Nothing waiting right now.</div>`;
    return;
  }

  els.approvalList.innerHTML = pending
    .map(
      (chore) => `
      <article class="approval-card">
        <div>
          <strong>${escapeHtml(chore.title)}</strong>
          <small>${money(chore.amount)} - ${chore.category} - ${recurrenceLabel(chore.recurrence)}</small>
        </div>
        <div class="approval-buttons">
          <button class="small-action" type="button" data-approve="${chore.id}">Approve</button>
          <button class="small-action light" type="button" data-decline="${chore.id}">Send back</button>
        </div>
      </article>
    `
    )
    .join("");
}

function renderApprovalSignals() {
  const count = pendingApprovals().length;
  const shouldShowShortcut = state.adultMode && count > 0;
  const noun = count === 1 ? "mission needs" : "missions need";

  if (els.approvalBadge) {
    els.approvalBadge.textContent = String(count);
    els.approvalBadge.classList.toggle("hidden", count === 0);
  }

  if (els.approvalShortcut && els.approvalShortcutText) {
    els.approvalShortcut.classList.toggle("hidden", !shouldShowShortcut);
    els.approvalShortcutText.textContent = `${count} ${noun} review`;
  }
}

function renderMissionManager() {
  if (!els.missionList) return;

  if (!state.adultMode) {
    els.missionList.innerHTML = `<div class="empty-state">Adult mode is off.</div>`;
    return;
  }

  const manageableChores = state.chores.filter((chore) => !chore.learningReward);
  if (!manageableChores.length) {
    els.missionList.innerHTML = `<div class="empty-state">No missions to manage yet.</div>`;
    return;
  }

  els.missionList.innerHTML = manageableChores
    .map(
      (chore) => `
      <article class="approval-card mission-card">
        <div>
          <strong>${escapeHtml(chore.title)}</strong>
          <small>${money(chore.amount)} - ${escapeHtml(chore.category)} - ${recurrenceLabel(chore.recurrence)} - ${statusText(chore.status)}</small>
        </div>
        <div class="approval-buttons">
          <button class="small-action" type="button" data-edit="${chore.id}">Edit</button>
          <button class="small-action light" type="button" data-delete="${chore.id}">Remove</button>
        </div>
      </article>
    `
    )
    .join("");
}

function renderTransactions() {
  const history = [...state.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (!history.length) {
    els.transactions.innerHTML = `<div class="empty-state">No transactions yet.</div>`;
    return;
  }

  els.transactions.innerHTML = history
    .map((tx) => {
      const isVoided = Boolean(tx.voidedAt);
      const amountClass = tx.amount >= 0 ? "amount-plus" : "amount-minus";
      const amountText = tx.amount >= 0 ? `+${money(tx.amount)}` : money(tx.amount);
      return `
      <article class="transaction ${tx.type} ${isVoided ? "voided" : ""}">
        <div>
          <strong>${escapeHtml(tx.title)}</strong>
          <small>${escapeHtml(tx.location || "Home")} - ${shortDate(tx.date)}${tx.note ? ` - ${escapeHtml(tx.note)}` : ""}${isVoided ? ` - Voided ${shortDate(tx.voidedAt)}` : ""}</small>
        </div>
        <div class="transaction-actions">
          <strong class="${isVoided ? "amount-void" : amountClass}">${isVoided ? "Voided" : amountText}</strong>
          ${state.adultMode && !isVoided ? `<button class="void-action" type="button" data-void-tx="${tx.id}">Void</button>` : ""}
        </div>
      </article>
    `;
    })
    .join("");
}

function renderBadges() {
  const transactions = activeTransactions();
  const purchases = transactions.filter((tx) => tx.type === "spend");
  const earned = transactions.filter((tx) => tx.type === "earn").reduce((sum, tx) => sum + Number(tx.amount), 0);
  const spent = Math.abs(purchases.reduce((sum, tx) => sum + Number(tx.amount), 0));
  const biggest = purchases.reduce((best, tx) => (Math.abs(Number(tx.amount)) > Math.abs(Number(best?.amount || 0)) ? tx : best), null);
  const badges = [
    { icon: currencyIcon(), title: "Earned", detail: money(earned), color: "#ffc857" },
    { icon: "-", title: "Spent", detail: money(spent), color: "#f06464" },
    { icon: "*", title: "Biggest buy", detail: biggest ? `${biggest.title} (${money(Math.abs(biggest.amount))})` : "None yet", color: "#8f63d8" }
  ];

  els.spendBadges.innerHTML = badges
    .map(
      (badge) => `
      <div class="badge">
        <span class="badge-icon" style="background:${badge.color}">${badge.icon}</span>
        <strong>${badge.title}</strong>
        <span>${escapeHtml(badge.detail)}</span>
      </div>
    `
    )
    .join("");
}

function renderMilestones(balance) {
  if (!els.milestoneTrail) return;

  els.milestoneTrail.innerHTML = milestoneLevels
    .map((level, index) => {
      const claimed = state.rewards.claimedMilestones.includes(level);
      const current = !claimed && balance < level && milestoneLevels.find((item) => !state.rewards.claimedMilestones.includes(item)) === level;
      const progress = Math.min(Math.max((balance / level) * 100, 0), 100);
      return `
        <article class="milestone ${claimed ? "claimed" : ""} ${current ? "current" : ""}">
          <span class="map-dot">${claimed ? "*" : index + 1}</span>
          <div>
            <strong>${money(level)}</strong>
            <small>${claimed ? "Closet token earned" : `${money(Math.max(level - balance, 0))} to go`}</small>
            <div class="mini-progress" aria-hidden="true"><i style="width:${progress}%"></i></div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderShop() {
  if (!els.outfitShop) return;

  els.outfitShop.innerHTML = shopItems
    .map((item) => {
      const owned = state.rewards.ownedOutfits.includes(item.id);
      const active = state.rewards.activeOutfit === item.id;
      const canBuy = state.rewards.tokens >= item.cost;
      const button = active
        ? `<button class="small-action light" type="button" disabled>Wearing</button>`
        : owned
          ? `<button class="small-action" type="button" data-equip-outfit="${item.id}">Wear</button>`
          : `<button class="small-action" type="button" data-buy-outfit="${item.id}" ${canBuy ? "" : "disabled"}>Buy ${item.cost}</button>`;
      return `
        <article class="shop-card ${active ? "active" : ""}">
          <img src="${item.image}" alt="${escapeHtml(item.name)} mascot outfit" />
          <div>
            <strong>${escapeHtml(item.name)}</strong>
            <small>${escapeHtml(item.detail)}</small>
          </div>
          ${button}
        </article>
      `;
    })
    .join("");
}

function ensureLearningState() {
  state.learning ||= sanitizeLearning();
  if (!learningScreens.includes(state.learning.screen)) state.learning.screen = "home";
  if (!state.learning.additionProblem) state.learning.additionProblem = createMathProblem("+");
  if (!state.learning.subtractionProblem) state.learning.subtractionProblem = createMathProblem("-");
  if (!state.learning.countingProblem) state.learning.countingProblem = createCountingProblem();
  if (!state.learning.countMixProblem) state.learning.countMixProblem = createCountingMixProblem();
  if (!["simple", "mixed"].includes(state.learning.countingMode)) state.learning.countingMode = randomCountingMode();
  if (!learningWords.some((item) => item.word === state.learning.currentWord)) {
    state.learning.currentWord = learningWords[0].word;
  }
  if (!Array.isArray(state.learning.wordPlaced) || state.learning.wordPlaced.length !== state.learning.currentWord.length) {
    state.learning.wordPlaced = Array(state.learning.currentWord.length).fill(null);
  }
  const hasPlacedLetters = state.learning.wordPlaced.some(Boolean);
  if (!Array.isArray(state.learning.wordLetters) || (!state.learning.wordLetters.length && !hasPlacedLetters)) {
    state.learning.wordLetters = shuffleLetters(state.learning.currentWord.split(""));
  }
}

function renderLearning() {
  if (!els.learningRewardLabel) return;
  ensureLearningState();

  els.learningRewardLabel.textContent = `Earn ${money(learningRewardAmount)} after ${learningRewardTarget} practice wins. Adult approval required.`;
  renderLearningCoach();
  els.learningPanels.forEach((panel) => panel.classList.toggle("active", panel.dataset.learnPanel === state.learning.screen));
  renderMathPractice("addition");
  renderMathPractice("subtraction");
  renderCountingPractice();
  renderLetterPractice();
  renderWordPractice();
  renderWritingChecks();
}

function renderLearningCoach() {
  const count = Math.min(state.learning.correctCount, learningRewardTarget);
  if (els.learningCoachMessage) els.learningCoachMessage.textContent = state.learning.feedback;
  if (els.learningCoachImage) {
    const coach = learningCoach();
    els.learningCoachImage.src = coach.image;
    els.learningCoachImage.alt = `${coach.name} coach`;
  }
  if (els.learningProgressText) els.learningProgressText.textContent = `${count}/${learningRewardTarget} correct`;
  if (els.learningProgressFill) els.learningProgressFill.style.width = `${Math.min((count / learningRewardTarget) * 100, 100)}%`;
}

function learningCoach() {
  if (state.learning.feedbackMood === "reward") return { name: "Sprout", image: "./assets/mascot-celebrate.png" };
  if (state.learning.feedbackMood === "bummed") return { name: "Sprout", image: grumpyMascot };
  if (state.learning.feedbackMood === "hype") return teamHelperFor(state.learning.correctCount);
  if (["addition", "counting", "math-menu"].includes(state.learning.screen)) return friendMascots.sunny;
  if (["subtraction", "words"].includes(state.learning.screen)) return friendMascots.berry;
  return { name: "Sprout", image: currentMascotImage() };
}

function teamHelperFor(seed = 0) {
  return mascotTeam[Math.abs(Number(seed) || 0) % mascotTeam.length];
}

function taskHelperImage(kind = "complete") {
  if (kind === "approve") return friendMascots.berry.image;
  return friendMascots.sunny.image;
}

function teamIcon(index = 0) {
  return mascotTeam[index % mascotTeam.length].image;
}

function renderMathPractice(kind = "addition") {
  const problem = kind === "subtraction" ? state.learning.subtractionProblem : state.learning.additionProblem;
  const problemEl = kind === "subtraction" ? els.subtractionProblem : els.additionProblem;
  const visualsEl = kind === "subtraction" ? els.subtractionVisuals : els.additionVisuals;
  const answersEl = kind === "subtraction" ? els.subtractionAnswers : els.additionAnswers;
  if (!problemEl || !problem || !answersEl) return;

  ensureMathCountState(problem);
  problemEl.textContent = `${problem.left} ${problem.operator} ${problem.right} = ?`;
  if (visualsEl) {
    visualsEl.innerHTML = `
      ${renderSproutGroup(problem.left, `${problem.left}`, kind, 0, problem)}
      <span class="math-operator">${problem.operator}</span>
      ${renderSproutGroup(problem.right, `${problem.right}`, kind, problem.left, problem)}
    `;
  }
  answersEl.innerHTML = problem.options
    .map((option) => `<button class="number-choice" type="button" data-math-answer="${option}" data-math-kind="${kind}">${option}</button>`)
    .join("");
}

function ensureMathCountState(problem) {
  const totalSprites = Number(problem.left) + Number(problem.right);
  if (!Array.isArray(problem.counted) || problem.counted.length !== totalSprites) {
    problem.counted = Array(totalSprites).fill(false);
    problem.countedTotal = 0;
  } else {
    problem.countedTotal = Math.min(Math.max(Number(problem.countedTotal) || problem.counted.filter(Boolean).length, 0), totalSprites);
  }
}

function renderSproutGroup(count, label, kind = "addition", startIndex = 0, problem = null) {
  return `
    <div class="sprout-count-group" aria-label="${escapeHtml(label)} sprouts">
      <span class="sprout-count-label">${escapeHtml(label)}</span>
      <div class="sprout-count-icons">
        ${Array.from({ length: count }, (_, index) => {
          const countIndex = startIndex + index;
          const counted = problem?.counted?.[countIndex] ? "counted" : "";
          return `<button class="sprout-count-button ${counted}" type="button" data-math-count-kind="${kind}" data-math-count-index="${countIndex}" aria-label="Count math helper ${countIndex + 1}"><img src="${teamIcon(countIndex)}" alt="" aria-hidden="true" /></button>`;
        }).join("")}
      </div>
    </div>
  `;
}

function renderCountingPractice() {
  const problem = state.learning.countingProblem;
  if (!els.countingDots || !problem || !els.countingAnswers) return;
  const isSimple = state.learning.countingMode !== "mixed";
  els.countingDots.classList.toggle("hidden", !isSimple);
  els.countingAnswers.classList.toggle("hidden", !isSimple);
  els.mixedCounting?.classList.toggle("hidden", isSimple);

  els.countingDots.innerHTML = Array.from({ length: problem.answer }, (_, index) => `<button class="count-sprout ${problem.counted?.[index] ? "counted" : ""}" type="button" style="--dot-index:${index}" data-count-step="${index}" aria-label="Count friend ${index + 1}"><img src="${teamIcon(index)}" alt="" aria-hidden="true" /></button>`).join("");
  els.countingAnswers.innerHTML = problem.options
    .map((option) => `<button class="number-choice" type="button" data-count-answer="${option}">${option}</button>`)
    .join("");
  renderMixedCountingPractice();
}

function renderMixedCountingPractice() {
  const problem = state.learning.countMixProblem;
  if (!els.mixedCountingQuestion || !els.mixedCountingBoard || !els.mixedCountingProgress || !problem) return;
  els.mixedCountingQuestion.innerHTML = `How many <span>${escapeHtml(problem.targetName)}</span> <img src="${problem.targetImage}" alt="${escapeHtml(problem.targetName)}" /> do we see?`;
  els.mixedCountingProgress.textContent = `${problem.counted}/${problem.answer} ${problem.targetName} found`;
  els.mixedCountingBoard.innerHTML = problem.items
    .map(
      (item, index) => `<button class="mix-sprout ${item.counted ? "counted" : ""} ${item.hidden ? "gone" : ""}" type="button" data-mix-count-id="${item.id}" aria-label="${escapeHtml(item.name)} in spot ${index + 1}"><img src="${item.image}" alt="" aria-hidden="true" /></button>`
    )
    .join("");
}

function renderLetterPractice() {
  if (!els.letterDisplay) return;
  const upper = state.learning.currentLetter;
  const lower = upper.toLowerCase();
  els.letterDisplay.innerHTML = `
    <span class="letter-upper">${upper}</span>
    <span class="letter-lower">${lower}</span>
  `;
}

function renderWordPractice() {
  if (!els.wordPicture || !els.wordSlots || !els.wordLetterBank) return;
  const word = state.learning.currentWord;
  const wordInfo = learningWords.find((item) => item.word === word) || learningWords[0];
  els.wordPicture.innerHTML = `
    <span>${escapeHtml(wordInfo.icon)}</span>
    <strong>${escapeHtml(wordInfo.hint)}</strong>
  `;
  els.wordSlots.innerHTML = word.split("")
    .map((letter, index) => {
      const placed = state.learning.wordPlaced[index];
      return `<button class="word-slot ${placed ? "filled" : ""}" type="button" data-word-slot="${index}" data-letter="${letter}" aria-label="Letter spot ${index + 1}, ${letter}"><span class="slot-guide" aria-hidden="true">${letter}</span><span class="slot-letter">${placed || ""}</span></button>`;
    })
    .join("");
  els.wordLetterBank.innerHTML = state.learning.wordLetters
    .map((letter, index) => `<button class="word-letter ${state.learning.selectedWordIndex === index ? "selected" : ""}" type="button" draggable="true" data-word-letter="${index}" aria-label="Letter ${letter}">${letter}</button>`)
    .join("");
  if (els.wordWritingPrompt) els.wordWritingPrompt.textContent = word;
}

function renderWritingChecks() {
  els.writingCheck?.classList.toggle("hidden", !state.learning.writingCheckOpen);
  els.wordWritingCheck?.classList.toggle("hidden", !state.learning.wordWritingCheckOpen);
}

function renderShopPanel() {
  if (!els.shopPanel || !els.shopBody || !els.shopToggle) return;
  els.shopPanel.classList.toggle("collapsed", !shopOpen);
  els.shopBody.classList.toggle("hidden", !shopOpen);
  els.shopToggle.setAttribute("aria-expanded", String(shopOpen));
}

function renderTrailPanel() {
  if (!els.trailPanel || !els.trailBody || !els.trailToggle) return;
  els.trailPanel.classList.toggle("collapsed", !trailOpen);
  els.trailBody.classList.toggle("hidden", !trailOpen);
  els.trailToggle.setAttribute("aria-expanded", String(trailOpen));
}

function renderSettingsPanel() {
  if (!els.settingsPanel || !els.settingsToggle) return;
  els.settingsPanel.classList.toggle("hidden", !settingsOpen);
  els.settingsToggle.setAttribute("aria-expanded", String(settingsOpen));
  if (els.tokenCurrency) {
    els.tokenCurrency.disabled = !state.adultMode;
  }
  if (els.undoLastAction) {
    els.undoLastAction.disabled = !undoSnapshot;
  }
}

function drawChart() {
  const transactions = activeTransactions();
  const earned = transactions.filter((tx) => tx.type === "earn").reduce((sum, tx) => sum + Number(tx.amount), 0);
  const spent = Math.abs(transactions.filter((tx) => tx.type === "spend").reduce((sum, tx) => sum + Number(tx.amount), 0));

  els.chartTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.chart === chartMode));
  if (chartMode === "line") {
    drawLineChart();
    return;
  }

  const max = Math.max(earned, spent, 1);
  const bars = [
    { label: "Earned", value: earned, color: "#69b578" },
    { label: "Spent", value: spent, color: "#f06464" }
  ];

  els.moneyChart.className = "bar-chart";
  els.moneyChart.setAttribute("aria-label", `Bar chart of ${currencyLabel()} earned and spent`);
  els.moneyChart.innerHTML = bars
    .map((bar) => {
      const height = Math.max((bar.value / max) * 100, 4);
      return `
        <div class="chart-bar" style="--bar-color: ${bar.color}">
          <strong class="chart-value">${money(bar.value)}</strong>
          <div class="chart-track" aria-hidden="true">
            <span class="chart-fill" style="height: ${height}%"></span>
          </div>
          <span class="chart-label">${bar.label}</span>
        </div>
      `;
    })
    .join("");
}

function drawLineChart() {
  const transactions = activeTransactions().sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!transactions.length) {
    els.moneyChart.className = "line-chart empty-chart";
    els.moneyChart.setAttribute("aria-label", `Line chart of ${currencyLabel()} earned and spent with no transactions yet`);
    els.moneyChart.innerHTML = `<div class="empty-state">No ${currencyLabel()} moves yet. Approved missions and purchases will draw the lines.</div>`;
    return;
  }

  let earnedTotal = 0;
  let spentTotal = 0;
  const points = transactions.map((tx) => {
    earnedTotal += tx.type === "earn" ? Number(tx.amount) : 0;
    spentTotal += tx.type === "spend" ? Math.abs(Number(tx.amount)) : 0;
    return {
      label: shortDate(tx.date),
      earned: earnedTotal,
      spent: spentTotal
    };
  });
  const max = Math.max(...points.flatMap((point) => [point.earned, point.spent]), 1);
  const width = 520;
  const height = 230;
  const pad = { left: 44, right: 24, top: 28, bottom: 42 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const xFor = (index) => pad.left + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth);
  const yFor = (value) => pad.top + plotHeight - (value / max) * plotHeight;
  const lineFor = (key) => points.map((point, index) => `${xFor(index)},${yFor(point[key])}`).join(" ");
  const last = points[points.length - 1];

  els.moneyChart.className = "line-chart";
  els.moneyChart.setAttribute("aria-label", `Line chart of cumulative ${currencyLabel()} earned and spent`);
  els.moneyChart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="presentation" aria-hidden="true">
      <line class="chart-axis" x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${height - pad.bottom}"></line>
      <line class="chart-axis" x1="${pad.left}" y1="${height - pad.bottom}" x2="${width - pad.right}" y2="${height - pad.bottom}"></line>
      <polyline class="earned-line" points="${lineFor("earned")}"></polyline>
      <polyline class="spent-line" points="${lineFor("spent")}"></polyline>
      ${points
        .map(
          (point, index) => `
          <circle class="earned-dot" cx="${xFor(index)}" cy="${yFor(point.earned)}" r="5"></circle>
          <circle class="spent-dot" cx="${xFor(index)}" cy="${yFor(point.spent)}" r="5"></circle>
        `
        )
        .join("")}
    </svg>
    <div class="line-legend">
      <span><i class="earned-key"></i>Earned ${money(last.earned)}</span>
      <span><i class="spent-key"></i>Spent ${money(last.spent)}</span>
    </div>
  `;
}

function completeChore(id) {
  const chore = state.chores.find((item) => item.id === id);
  if (!chore || chore.status !== "open") return;
  if (chore.recurrence === "multi" && multiCompleteCountToday(chore) >= 3) {
    captureUndo("Mission check");
    chore.status = "paid";
    chore.nextDue = startOfTomorrowIso();
    showToast("This mission is maxed for today.", { undo: true });
    render();
    return;
  }
  captureUndo("Mission check");
  chore.status = "pending";
  chore.completedAt = new Date().toISOString();
  showCelebrationMascot(taskHelperImage("complete"));
  playSound("complete");
  celebrate("Nice work. Sunny sent it for adult approval.", { undo: true });
  render();
}

function approveChore(id) {
  if (!state.adultMode) {
    showToast("Turn on adult mode to approve missions.");
    return;
  }

  const chore = state.chores.find((item) => item.id === id);
  if (!chore || chore.status !== "pending") return;
  captureUndo("Approval");
  chore.paidAt = new Date().toISOString();
  state.transactions.unshift({
    id: makeId(),
    choreId: chore.id,
    type: "earn",
    title: chore.title,
    amount: Number(chore.amount),
    location: "Home",
    note: "Adult approved",
    recurrence: chore.recurrence,
    date: new Date().toISOString(),
    voidedAt: null
  });
  if (chore.learningReward) {
    chore.status = "paid";
    chore.nextDue = null;
  } else if (chore.recurrence === "multi") {
    const countToday = multiCompleteCountToday(chore);
    chore.completedAt = null;
    if (countToday >= 3) {
      chore.status = "paid";
      chore.nextDue = startOfTomorrowIso();
    } else {
      chore.status = "open";
      chore.nextDue = null;
    }
  } else {
    chore.status = "paid";
    chore.nextDue = nextDueDate(chore.recurrence, chore.paidAt);
  }
  showCelebrationMascot(taskHelperImage("approve"), 3200);
  playSound("cash");
  celebrate(`Approved. Berry helped deposit ${money(chore.amount)}.`, { undo: true });
  render();
}

function declineChore(id) {
  if (!state.adultMode) {
    showToast("Turn on adult mode to send missions back.");
    return;
  }

  const chore = state.chores.find((item) => item.id === id);
  if (!chore) return;
  captureUndo("Send back");
  if (chore.learningReward) {
    state.chores = state.chores.filter((item) => item.id !== id);
    showToast("Learning reward sent back.", { undo: true });
  } else {
    chore.status = "open";
    chore.completedAt = null;
    showToast("Sent back to the chore board.", { undo: true });
  }
  render();
}

function deleteChore(id) {
  if (!state.adultMode) {
    showToast("Turn on adult mode to remove missions.");
    return;
  }

  captureUndo("Mission removal");
  state.chores = state.chores.filter((item) => item.id !== id);
  if (els.choreForm.elements.editId.value === id) resetMissionForm();
  showToast("Mission removed.", { undo: true });
  render();
}

function addChore(form) {
  if (!state.adultMode) {
    showToast("Turn on adult mode to manage missions.");
    return;
  }

  const data = new FormData(form);
  const amount = Number(data.get("amount"));
  const editId = data.get("editId");
  if (!Number.isFinite(amount) || amount <= 0) return;
  captureUndo(editId ? "Mission update" : "Mission add");

  if (editId) {
    const chore = state.chores.find((item) => item.id === editId);
    if (!chore) return;
    chore.title = data.get("title").trim();
    chore.amount = amount;
    chore.category = data.get("category");
    chore.recurrence = normalizedRecurrence(data.get("recurrence"));
    if (chore.status === "paid") {
      if (chore.recurrence === "multi") {
        chore.status = "open";
        chore.completedAt = null;
        chore.nextDue = null;
      } else {
        chore.nextDue = nextDueDate(chore.recurrence, chore.paidAt || new Date().toISOString());
      }
    }
    resetMissionForm();
    showToast("Mission updated.", { undo: true });
    render();
    return;
  }

  state.chores.unshift({
    id: makeId(),
    title: data.get("title").trim(),
    amount,
    category: data.get("category"),
    recurrence: normalizedRecurrence(data.get("recurrence")),
    status: "open",
    completedAt: null,
    paidAt: null,
    nextDue: null
  });
  form.reset();
  celebrate("New mission added to the board.", { undo: true });
  render();
}

function editChore(id) {
  if (!state.adultMode) {
    showToast("Turn on adult mode to edit missions.");
    return;
  }

  const chore = state.chores.find((item) => item.id === id);
  if (!chore) return;
  els.choreForm.elements.editId.value = chore.id;
  els.choreForm.elements.title.value = chore.title;
  els.choreForm.elements.amount.value = chore.amount;
  els.choreForm.elements.category.value = chore.category;
  els.choreForm.elements.recurrence.value = normalizedRecurrence(chore.recurrence);
  els.missionSubmit.textContent = "Save mission";
  els.missionFormTitle.textContent = "Edit mission";
  els.cancelEdit.classList.remove("hidden");
  switchView("parent", { preserveParentMode: true });
  switchParentMode("missions");
  els.choreForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetMissionForm() {
  els.choreForm.reset();
  els.choreForm.elements.editId.value = "";
  els.missionSubmit.textContent = "Add mission";
  els.missionFormTitle.textContent = "Add a mission";
  els.cancelEdit.classList.add("hidden");
}

function addPurchase(form) {
  if (!state.adultMode) {
    showToast("Turn on adult mode to post purchases.");
    return;
  }

  const data = new FormData(form);
  const cost = Number(data.get("cost"));
  if (!Number.isFinite(cost) || cost <= 0) return;
  if (cost > totalBalance()) {
    showCelebrationMascot(grumpyMascot, 3000);
    playSound("low");
    showToast("Not enough funds for that purchase.");
    return;
  }

  captureUndo("Purchase");
  state.transactions.unshift({
    id: makeId(),
    type: "spend",
    title: data.get("product").trim(),
    amount: -cost,
    location: data.get("location").trim(),
    note: data.get("notes").trim(),
    date: new Date().toISOString(),
    voidedAt: null
  });
  form.reset();
  showToast(`${money(cost)} purchase posted.`, { undo: true });
  render();
}

function buyOutfit(id) {
  const item = shopItems.find((shopItem) => shopItem.id === id);
  if (!item || state.rewards.ownedOutfits.includes(id) || state.rewards.tokens < item.cost) return;

  captureUndo("Outfit purchase");
  state.rewards.tokens -= item.cost;
  state.rewards.ownedOutfits.push(id);
  state.rewards.purchaseOrder = [...normalizePurchaseOrder(), id].filter((itemId, index, list) => list.indexOf(itemId) === index);
  state.rewards.activeOutfit = id;
  showCelebrationMascot(item.image);
  celebrate(`${item.name} unlocked.`, { undo: true });
  render();
}

function equipOutfit(id) {
  if (!state.rewards.ownedOutfits.includes(id)) return;
  captureUndo("Outfit change");
  state.rewards.activeOutfit = id;
  showCelebrationMascot(currentMascotImage());
  showToast("Mascot outfit changed.", { undo: true });
  render();
}

function switchLearningScreen(screen) {
  state.learning.screen = learningScreens.includes(screen) ? screen : "home";
  state.learning.feedbackMood = "ready";
  state.learning.feedback = learningScreenMessage(state.learning.screen);
  render();
  setupWritingPad();
}

function learningScreenMessage(screen) {
  if (screen === "math-menu") return "Pick addition, subtraction, or counting.";
  if (screen === "letters-menu") return "Pick alphabet practice or word building.";
  if (screen === "addition") return "Add the Sprout groups, then tap the answer.";
  if (screen === "subtraction") return "Take away the second group and find what is left.";
  if (screen === "counting") return "Count each Sprout friend, then tap the number.";
  if (screen === "alphabet") return "Say the letter, hear the sound, then write it.";
  if (screen === "words") return "Tap or drag each letter into the matching spot.";
  return "Choose Math & Numbers or Letters & Writing.";
}

function answerMath(value, kind = "addition") {
  const problem = kind === "subtraction" ? state.learning.subtractionProblem : state.learning.additionProblem;
  const answer = Number(value);
  if (!problem || answer !== problem.answer) {
    handleLearningMiss("Oops, not that one. Sprout says try again.");
    return;
  }

  if (kind === "subtraction") {
    state.learning.subtractionProblem = createMathProblem("-");
    handleLearningWin("Subtraction practice", "Yes! Sprout saw what was left.");
    return;
  }

  state.learning.additionProblem = createMathProblem("+");
  handleLearningWin("Addition practice", "Yes! Sprout is cheering. Keep going.");
}

function answerCounting(value) {
  const answer = Number(value);
  if (answer !== state.learning.countingProblem.answer) {
    handleLearningMiss("Almost. Count each little sprout one more time.");
    return;
  }

  state.learning.countingProblem = createCountingProblem();
  state.learning.countingMode = randomCountingMode();
  handleLearningWin("Counting practice", "Great counting. Sprout knew you had it.");
}

function countAlong(value) {
  const index = Number(value);
  const problem = state.learning.countingProblem;
  if (!problem || !Number.isInteger(index) || index < 0 || index >= problem.answer) return;
  problem.counted ||= Array(problem.answer).fill(false);
  if (problem.counted[index]) return;

  problem.counted[index] = true;
  problem.countedTotal = (Number(problem.countedTotal) || 0) + 1;
  speakText(String(problem.countedTotal), { pitch: 1.48, rate: 0.78 });
  renderCountingPractice();
}

function countMathHelper(kind, value) {
  const problem = kind === "subtraction" ? state.learning.subtractionProblem : state.learning.additionProblem;
  const index = Number(value);
  if (!problem || !Number.isInteger(index)) return;
  ensureMathCountState(problem);
  if (index < 0 || index >= problem.counted.length || problem.counted[index]) return;

  problem.counted[index] = true;
  problem.countedTotal = (Number(problem.countedTotal) || 0) + 1;
  speakText(String(problem.countedTotal), { pitch: 1.48, rate: 0.78 });
  renderMathPractice(kind);
}

function countMixedFriend(id) {
  const problem = state.learning.countMixProblem;
  if (!problem) return;
  const item = problem.items.find((entry) => entry.id === id);
  if (!item || item.counted || item.hidden) return;

  if (item.name !== problem.targetName) {
    item.hidden = true;
    state.learning.feedbackMood = "ready";
    state.learning.feedback = `${item.name} disappears. Keep looking for ${problem.targetName}.`;
    playSound("low");
    render();
    return;
  }

  item.counted = true;
  problem.counted += 1;
  speakText(String(problem.counted), { pitch: 1.48, rate: 0.78 });

  if (problem.counted >= problem.answer) {
    state.learning.countMixProblem = createCountingMixProblem();
    state.learning.countingMode = randomCountingMode();
    handleLearningWin(`${problem.targetName} counting practice`, `You found all the ${problem.targetName} friends.`);
    return;
  }

  state.learning.feedbackMood = "hype";
  state.learning.feedback = `${problem.counted} ${problem.targetName} counted. Keep going.`;
  render();
}

function newCountingMix() {
  state.learning.countMixProblem = createCountingMixProblem();
  state.learning.countingMode = "mixed";
  state.learning.feedbackMood = "ready";
  state.learning.feedback = "A new friend mix is ready. Tap only the named friend.";
  render();
}

function speakText(text, options = {}) {
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    showToast("Voice is not available in this browser.");
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = sproutVoice || chooseSproutVoice();
  if (voice) utterance.voice = voice;
  utterance.rate = options.rate || 0.9;
  utterance.pitch = options.pitch || 1.45;
  utterance.volume = 0.92;
  window.speechSynthesis.speak(utterance);
}

function chooseSproutVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  if (!voices.length) return null;

  const englishVoices = voices.filter((voice) => voice.lang?.toLowerCase().startsWith("en"));
  const candidates = englishVoices.length ? englishVoices : voices;
  const friendlyNames = ["jenny", "aria", "zira", "samantha", "susan", "female", "google us english", "google uk english female"];
  sproutVoice = candidates.find((voice) => friendlyNames.some((name) => voice.name.toLowerCase().includes(name)))
    || candidates.find((voice) => !/david|mark|male|daniel/i.test(voice.name))
    || candidates[0];
  return sproutVoice;
}

if (window.speechSynthesis) {
  window.speechSynthesis.addEventListener?.("voiceschanged", () => {
    sproutVoice = null;
    chooseSproutVoice();
  });
}

function sayCurrentLetter() {
  const letter = state.learning.currentLetter;
  speakText(letter, { pitch: 1.55, rate: 0.86 });
  state.learning.feedbackMood = "hype";
  state.learning.feedback = `Sprout says ${letter}.`;
  render();
}

function sayCurrentPhonics() {
  const letter = state.learning.currentLetter;
  speakText(phonics[letter] || letter, { pitch: 1.6, rate: 0.82 });
  state.learning.feedbackMood = "hype";
  state.learning.feedback = phonics[letter] || letter;
  render();
}

function newLetter() {
  state.learning.currentLetter = nextLetter(state.learning.currentLetter);
  state.learning.writingCheckOpen = false;
  state.learning.feedbackMood = "ready";
  state.learning.feedback = `New letter: ${state.learning.currentLetter} and ${state.learning.currentLetter.toLowerCase()}. Try saying it, then write it.`;
  render();
  clearWritingPad("alphabet");
}

function checkWritingPractice() {
  state.learning.writingCheckOpen = true;
  state.learning.feedbackMood = "ready";
  state.learning.feedback = "Check the writing, then choose Correct or Try again.";
  render();
}

function markWritingCorrect(kind = "alphabet") {
  if (kind === "word") {
    const word = state.learning.currentWord;
    state.learning.wordWritingCheckOpen = false;
    handleLearningWin(`${word} writing practice`, `Nice writing. Sprout loved that ${word}.`);
    clearWritingPad("word");
    return;
  }

  const practiced = state.learning.currentLetter;
  state.learning.currentLetter = nextLetter(practiced);
  state.learning.writingCheckOpen = false;
  handleLearningWin(`Letter ${practiced} writing practice`, `Nice writing. Sprout loved that ${practiced}.`);
  clearWritingPad("alphabet");
}

function markWritingIncorrect(kind = "alphabet") {
  if (kind === "word") state.learning.wordWritingCheckOpen = false;
  else state.learning.writingCheckOpen = false;
  handleLearningMiss("Good try. Clear the pad and give it another go.");
}

function selectWordLetter(index) {
  const letterIndex = Number(index);
  const letter = state.learning.wordLetters[letterIndex];
  if (!letter) return;
  state.learning.selectedWordIndex = letterIndex;
  speakLetterName(letter);
  render();
}

function placeSelectedWordLetter(slotIndex) {
  if (state.learning.selectedWordIndex === null) return;
  placeWordLetter(state.learning.selectedWordIndex, slotIndex);
}

function placeWordLetter(letterIndex, slotIndex) {
  const parsedSource = Number(letterIndex);
  const sourceIndex = Number.isInteger(parsedSource) && parsedSource >= 0 ? parsedSource : state.learning.selectedWordIndex;
  const targetIndex = Number(slotIndex);
  const letter = state.learning.wordLetters[sourceIndex];
  const expected = state.learning.currentWord[targetIndex];
  if (!letter || !expected) return;

  speakLetterName(letter);
  if (letter !== expected) {
    state.learning.selectedWordIndex = null;
    handleLearningMiss("That letter wants a different spot. Try again.");
    return;
  }

  state.learning.wordPlaced[targetIndex] = letter;
  state.learning.wordLetters.splice(sourceIndex, 1);
  state.learning.selectedWordIndex = null;
  checkWordCompletion();
}

function checkWordCompletion() {
  if (state.learning.wordPlaced.join("") !== state.learning.currentWord) {
    state.learning.feedbackMood = "hype";
    state.learning.feedback = "Nice match. Keep building the word.";
    render();
    return;
  }

  state.learning.wordComplete = true;
  speakText(state.learning.currentWord.toLowerCase(), { pitch: 1.42, rate: 0.86 });
  handleLearningWin(`${state.learning.currentWord} word building`, `You built ${state.learning.currentWord}. Sprout shouted the whole word.`);
}

function newWord() {
  const currentIndex = learningWords.findIndex((item) => item.word === state.learning.currentWord);
  const next = learningWords[(currentIndex + 1) % learningWords.length];
  state.learning.currentWord = next.word;
  state.learning.wordLetters = shuffleLetters(next.word.split(""));
  state.learning.wordPlaced = Array(next.word.length).fill(null);
  state.learning.selectedWordIndex = null;
  state.learning.wordComplete = false;
  state.learning.wordWritingCheckOpen = false;
  state.learning.feedbackMood = "ready";
  state.learning.feedback = `New word: ${next.hint}. Put the letters in order.`;
  render();
  clearWritingPad("word");
}

function checkWordWritingPractice() {
  state.learning.wordWritingCheckOpen = true;
  state.learning.feedbackMood = "ready";
  state.learning.feedback = "Check the word writing, then choose Correct or Try again.";
  render();
}

function speakLetterName(letter) {
  speakText(letter, { pitch: 1.55, rate: 0.86 });
}

function speakLetterSound(letter) {
  speakText(phonics[letter] || letter, { pitch: 1.6, rate: 0.82 });
}

function handleLearningWin(title, message) {
  state.learning.correctCount += 1;
  state.learning.feedbackMood = "hype";
  state.learning.feedback = `${message} ${learningRewardTarget - state.learning.correctCount} more until reward time.`;
  showCelebrationMascot(teamHelperFor(state.learning.correctCount).image, 1600);
  playSound("complete");

  if (state.learning.correctCount >= learningRewardTarget) {
    awardLearningReward(title);
    return;
  }

  showToast(`${state.learning.correctCount}/${learningRewardTarget} practice wins.`);
  render();
}

function handleLearningMiss(message) {
  state.learning.feedbackMood = "bummed";
  state.learning.feedback = message;
  showCelebrationMascot(grumpyMascot, 1800);
  playSound("low");
  showToast("Try again. No reward progress lost.");
  render();
}

function awardLearningReward(title) {
  captureUndo("Learning reward");
  state.learning.correctCount = 0;
  state.learning.feedbackMood = "reward";
  state.learning.feedback = `10 practice wins complete. ${money(learningRewardAmount)} is waiting for adult approval.`;
  state.chores.unshift({
    id: makeId(),
    title: `${title} round`,
    amount: learningRewardAmount,
    category: "Learning",
    recurrence: "learning",
    status: "pending",
    completedAt: new Date().toISOString(),
    paidAt: null,
    nextDue: null,
    learningReward: true
  });
  showCelebrationMascot(friendMascots.sunny.image);
  playSound("complete");
  celebrate(`10 practice wins. ${money(learningRewardAmount)} sent for adult approval.`, { undo: true });
  render();
}

function createMathProblem(operator = "+") {
  const resolvedOperator = operator === "-" ? "-" : "+";
  let left = randomInt(1, 10);
  let right = randomInt(1, resolvedOperator === "+" ? Math.max(1, 10 - left) : 10);
  if (resolvedOperator === "+") {
    while (left + right > 10) {
      left = randomInt(1, 9);
      right = randomInt(1, 10 - left);
    }
  }
  if (resolvedOperator === "-" && right > left) [left, right] = [right, left];
  const answer = resolvedOperator === "+" ? left + right : left - right;
  return { left, right, operator: resolvedOperator, answer, options: answerOptions(answer, 0, 10), counted: Array(left + right).fill(false), countedTotal: 0 };
}

function createCountingProblem() {
  const answer = randomInt(1, 10);
  return { answer, options: answerOptions(answer, 1, 12), counted: Array(answer).fill(false), countedTotal: 0 };
}

function createCountingMixProblem() {
  const target = mascotTeam[randomInt(0, mascotTeam.length - 1)];
  const targetCount = randomInt(2, 5);
  const total = randomInt(Math.max(targetCount + 3, 7), 10);
  const items = [];

  for (let index = 0; index < targetCount; index += 1) {
    items.push({ id: makeId(), name: target.name, image: target.image, counted: false, hidden: false });
  }

  while (items.length < total) {
    const helper = mascotTeam[randomInt(0, mascotTeam.length - 1)];
    if (helper.name === target.name) continue;
    items.push({ id: makeId(), name: helper.name, image: helper.image, counted: false, hidden: false });
  }

  return {
    targetName: target.name,
    targetImage: target.image,
    answer: targetCount,
    counted: 0,
    items: shuffleItems(items)
  };
}

function sanitizeCountMixProblem(problem) {
  if (!problem || !mascotTeam.some((helper) => helper.name === problem.targetName) || !Array.isArray(problem.items)) {
    return createCountingMixProblem();
  }

  const sanitizedItems = problem.items
    .map((item) => {
      const helper = mascotTeam.find((entry) => entry.name === item.name);
      if (!helper) return null;
      return {
        id: typeof item.id === "string" ? item.id : makeId(),
        name: helper.name,
        image: helper.image,
        counted: Boolean(item.counted),
        hidden: Boolean(item.hidden)
      };
    })
    .filter(Boolean);
  const target = mascotTeam.find((helper) => helper.name === problem.targetName);
  const answer = sanitizedItems.filter((item) => item.name === problem.targetName).length;
  if (!answer || !target) return createCountingMixProblem();
  const counted = sanitizedItems.filter((item) => item.name === problem.targetName && item.counted).length;
  return {
    targetName: problem.targetName,
    targetImage: target.image,
    answer,
    counted: Math.min(counted, answer),
    items: sanitizedItems
  };
}

function answerOptions(answer, min, max) {
  const options = new Set([answer]);
  while (options.size < 4) {
    const offset = randomInt(-3, 3) || 1;
    const candidate = Math.min(Math.max(answer + offset, min), max);
    options.add(candidate);
    if (options.size < 4) options.add(randomInt(min, max));
  }
  return [...options].sort(() => Math.random() - 0.5);
}

function shuffleLetters(letters) {
  const shuffled = [...letters];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  if (shuffled.join("") === letters.join("") && shuffled.length > 1) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }
  return shuffled;
}

function randomCountingMode() {
  return Math.random() > 0.5 ? "mixed" : "simple";
}

function shuffleItems(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(0, index);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function nextLetter(letter) {
  const index = alphabet.indexOf(letter);
  return alphabet[(index + 1) % alphabet.length];
}

function voidTransaction(id) {
  if (!state.adultMode) {
    showToast("Turn on adult mode to void a transaction.");
    return;
  }

  const tx = state.transactions.find((item) => item.id === id);
  if (!tx || tx.voidedAt) return;

  const projectedBalance = totalBalance() - Number(tx.amount);
  if (projectedBalance < 0) {
    showCelebrationMascot(grumpyMascot, 3000);
    playSound("low");
    showToast("That void would make the account go negative.");
    return;
  }

  const confirmed = window.confirm("Void this transaction? It will stop counting toward the balance but stay in the history.");
  if (!confirmed) return;

  captureUndo("Void");
  tx.voidedAt = new Date().toISOString();
  reopenChoreAfterVoidedEarn(tx);
  showToast("Transaction voided. Milestones and outfits were rechecked.", { undo: true });
  render();
}

function reopenChoreAfterVoidedEarn(tx) {
  if (tx.type !== "earn" || !tx.choreId) return;

  const chore = state.chores.find((item) => item.id === tx.choreId);
  if (!chore) return;

  if (chore.learningReward) {
    chore.status = "pending";
    chore.nextDue = null;
    chore.paidAt = null;
    return;
  }

  if (chore.recurrence === "multi") {
    const countToday = multiCompleteCountToday(chore);
    if (countToday < 3 && chore.status === "paid") {
      chore.status = "open";
      chore.nextDue = null;
      chore.completedAt = null;
      chore.paidAt = null;
    }
    return;
  }

  if (chore.status === "paid") {
    chore.status = "open";
    chore.nextDue = null;
    chore.completedAt = null;
    chore.paidAt = null;
  }
}

function setupWritingPad() {
  document.querySelectorAll(".writing-pad").forEach((canvas) => {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const width = Math.max(Math.floor(rect.width * ratio), 320);
    const height = Math.max(Math.floor(rect.height * ratio), 220);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      clearSingleWritingPad(canvas);
    }
    if (canvas.dataset.ready === "true") return;
    canvas.dataset.ready = "true";
    canvas.addEventListener("pointerdown", startWriting);
    canvas.addEventListener("pointermove", drawWriting);
    canvas.addEventListener("pointerup", stopWriting);
    canvas.addEventListener("pointerleave", stopWriting);
    canvas.addEventListener("pointercancel", stopWriting);
    clearSingleWritingPad(canvas);
  });
}

function clearWritingPad(kind = "alphabet") {
  const selector = kind === "word" ? "#wordWritingPad" : "#writingPad";
  const canvas = document.querySelector(selector);
  if (!canvas) return;
  clearSingleWritingPad(canvas);
}

function clearSingleWritingPad(canvas) {
  const context = canvas.getContext("2d");
  const ratio = window.devicePixelRatio || 1;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.scale(ratio, ratio);
  const width = canvas.width / ratio;
  const height = canvas.height / ratio;
  const prompt = canvas.dataset.writingPad === "word"
    ? state.learning.currentWord
    : `${state.learning.currentLetter} ${state.learning.currentLetter.toLowerCase()}`;
  context.fillStyle = "rgba(255, 255, 255, 0.72)";
  context.fillRect(0, 0, width, height);
  context.setLineDash([12, 12]);
  context.strokeStyle = "rgba(101, 113, 132, 0.28)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(24, height * 0.32);
  context.lineTo(width - 24, height * 0.32);
  context.moveTo(24, height * 0.68);
  context.lineTo(width - 24, height * 0.68);
  context.stroke();
  context.setLineDash([]);
  context.font = `900 ${Math.min(height * 0.58, 190)}px Inter, sans-serif`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "rgba(31, 166, 160, 0.15)";
  context.fillText(prompt, width / 2, height / 2 + 6);
  context.restore();
}

function startWriting(event) {
  const canvas = event.currentTarget;
  writingActive = canvas;
  canvas.setPointerCapture(event.pointerId);
  drawWriting.lastPoint = null;
  drawWriting(event);
}

function drawWriting(event) {
  const canvas = event.currentTarget;
  if (writingActive !== canvas) return;
  const context = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  const x = (event.clientX - rect.left) * ratio;
  const y = (event.clientY - rect.top) * ratio;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = "#8f63d8";
  context.lineWidth = 12 * ratio;
  if (!drawWriting.lastPoint) drawWriting.lastPoint = { x, y };
  context.beginPath();
  context.moveTo(drawWriting.lastPoint.x, drawWriting.lastPoint.y);
  context.lineTo(x, y);
  context.stroke();
  drawWriting.lastPoint = { x, y };
}

function stopWriting() {
  writingActive = false;
  drawWriting.lastPoint = null;
}

function renderAdultControls() {
  setFormDisabled(els.choreForm, !state.adultMode);
  setFormDisabled(els.purchaseForm, !state.adultMode);
}

function setFormDisabled(form, disabled) {
  if (!form) return;
  form.classList.toggle("locked", disabled);
  Array.from(form.elements).forEach((field) => {
    field.disabled = disabled;
  });
}

function switchView(view, options = {}) {
  const resolvedView = view === "approvals" || view === "chores" ? "parent" : view;

  els.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.view === resolvedView));
  els.panels.forEach((panel) => panel.classList.toggle("active", panel.dataset.viewPanel === resolvedView));

  if (resolvedView === "learn" && !options.preserveLearningScreen) {
    state.learning.screen = "home";
    renderLearning();
    setupWritingPad();
  }

  if (resolvedView === "parent" && !options.preserveParentMode) {
    switchParentMode("approvals");
  }
}

function switchParentMode(mode) {
  parentMode = mode === "missions" ? "missions" : "approvals";
  els.parentTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.parentMode === parentMode));
  els.parentPanels.forEach((panel) => panel.classList.toggle("active", panel.dataset.parentPanel === parentMode));
}

function toggleShop() {
  shopOpen = !shopOpen;
  renderShopPanel();
}

function toggleTrail() {
  trailOpen = !trailOpen;
  renderTrailPanel();
}

function toggleSettings() {
  settingsOpen = !settingsOpen;
  renderSettingsPanel();
}

function buttonSoundKind(button) {
  if (!state.soundOn || button.disabled) return null;
  if (button.dataset.view || button.dataset.parentMode || button.dataset.chart || button.dataset.learnScreen || button.dataset.toggleShop !== undefined || button.dataset.toggleTrail !== undefined || button.dataset.toggleSettings !== undefined) return "switch";
  if (button.dataset.complete || button.dataset.approve) return null;
  if (button.dataset.buyOutfit || button.dataset.equipOutfit || button.dataset.sayLetter !== undefined || button.dataset.sayPhonics !== undefined) return "success";
  if (button.dataset.decline || button.dataset.delete || button.dataset.voidTx) return "low";
  return "tap";
}

function playButtonSound(button) {
  const kind = buttonSoundKind(button);
  if (kind) playSound(kind);
}

function playHoverSound(button, event) {
  if (!state.soundOn || button.disabled || event.pointerType === "touch") return;
  if (button.contains(event.relatedTarget)) return;

  const now = Date.now();
  if (button === lastHoverTarget && now - lastHoverSoundAt < 300) return;
  if (now - lastHoverSoundAt < 45) return;

  lastHoverTarget = button;
  lastHoverSoundAt = now;
  playSound("hover");
}

function playSound(kind = "tap") {
  if (!state.soundOn) return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  audioContext ||= new AudioContextClass();
  if (audioContext.state === "suspended") audioContext.resume().catch(() => {});

  const now = audioContext.currentTime;
  const sequences = {
    hover: [{ frequency: 720, delay: 0, duration: 0.026, gain: 0.012 }],
    tap: [{ frequency: 560, delay: 0, duration: 0.045, gain: 0.026 }],
    switch: [
      { frequency: 420, delay: 0, duration: 0.04, gain: 0.022 },
      { frequency: 620, delay: 0.045, duration: 0.055, gain: 0.024 }
    ],
    complete: [
      { frequency: 523.25, delay: 0, duration: 0.055, gain: 0.026 },
      { frequency: 659.25, delay: 0.055, duration: 0.06, gain: 0.028 },
      { frequency: 783.99, delay: 0.115, duration: 0.07, gain: 0.026 },
      { frequency: 1046.5, delay: 0.19, duration: 0.09, gain: 0.02 }
    ],
    cash: [
      { frequency: 1567.98, delay: 0, duration: 0.04, gain: 0.024, type: "triangle" },
      { frequency: 1975.53, delay: 0.045, duration: 0.045, gain: 0.022, type: "triangle" },
      { frequency: 392, delay: 0.095, duration: 0.08, gain: 0.026, type: "sine" },
      { frequency: 1046.5, delay: 0.13, duration: 0.07, gain: 0.018, type: "triangle" }
    ],
    success: [
      { frequency: 620, delay: 0, duration: 0.05, gain: 0.026 },
      { frequency: 820, delay: 0.055, duration: 0.06, gain: 0.028 },
      { frequency: 1040, delay: 0.12, duration: 0.075, gain: 0.022 }
    ],
    low: [
      { frequency: 260, delay: 0, duration: 0.05, gain: 0.022 },
      { frequency: 210, delay: 0.055, duration: 0.06, gain: 0.018 }
    ]
  };

  (sequences[kind] || sequences.tap).forEach((note) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const start = now + note.delay;
    const end = start + note.duration;

    oscillator.type = note.type || "sine";
    oscillator.frequency.setValueAtTime(note.frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(note.gain, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(end + 0.025);
  });
}

function captureUndo(label) {
  undoSnapshot = {
    label,
    state: structuredClone(state)
  };
}

function undoLastAction() {
  if (!undoSnapshot) return;

  const label = undoSnapshot.label;
  state = structuredClone(undoSnapshot.state);
  undoSnapshot = null;
  render();
  showToast(`${label} undone.`);
}

function showToast(message, options = {}) {
  const canUndo = Boolean(options.undo && undoSnapshot);
  if (els.toastMessage) {
    els.toastMessage.textContent = message;
  } else {
    els.toast.textContent = message;
  }
  if (els.undoButton) {
    els.undoButton.classList.toggle("hidden", !canUndo);
  }
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove("show"), 2400);
}

function celebrate(message, options = {}) {
  showToast(message, options);
  els.confetti.innerHTML = "";
  for (let i = 0; i < 72; i += 1) {
    const piece = document.createElement("i");
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.width = `${6 + Math.random() * 8}px`;
    piece.style.height = `${8 + Math.random() * 12}px`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 0.45}s`;
    piece.style.animationDuration = `${0.85 + Math.random() * 0.7}s`;
    piece.style.transform = `rotate(${Math.random() * 180}deg)`;
    els.confetti.append(piece);
  }
  window.setTimeout(() => {
    els.confetti.innerHTML = "";
  }, 1500);
}

function showCelebrationMascot(imagePath, duration = 2600) {
  if (!els.heroMascot) return;
  window.clearTimeout(showCelebrationMascot.timer);
  els.heroMascot.src = imagePath;
  els.heroMascot.classList.remove("celebrating");
  void els.heroMascot.offsetWidth;
  els.heroMascot.classList.add("celebrating");
  showCelebrationMascot.timer = window.setTimeout(() => {
    els.heroMascot.src = currentMascotImage();
    els.heroMascot.classList.remove("celebrating");
  }, duration);
}

function isNeutralMascot() {
  return els.heroMascot?.getAttribute("src") === currentMascotImage() && !els.heroMascot.classList.contains("celebrating");
}

function showLaughingMascot() {
  if (!isNeutralMascot()) return;
  const imagePath = laughMascots[Math.floor(Math.random() * laughMascots.length)];
  showCelebrationMascot(imagePath, 2600);
}

function confirmAdultMode() {
  const first = 2 + Math.floor(Math.random() * 8);
  const second = 2 + Math.floor(Math.random() * 8);
  const answer = window.prompt(`Adult check: what is ${first} x ${second}?`);
  if (answer === null) return false;
  return Number(answer.trim()) === first * second;
}

function statusRank(status) {
  return { open: 0, pending: 1, paid: 2 }[status] || 3;
}

function statusText(status) {
  return { open: "Ready", pending: "Pending", paid: "Deposited" }[status] || status;
}

function currentMascotImage() {
  return shopItems.find((item) => item.id === state.rewards.activeOutfit)?.image || defaultMascot;
}

function recurrenceLabel(recurrence) {
  return recurrenceOptions[recurrence]?.label || "Daily";
}

function normalizedRecurrence(recurrence) {
  if (recurrence === "bidaily") return "multi";
  return recurrenceOptions[recurrence] ? recurrence : "daily";
}

function nextDueLabel(iso) {
  const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso));
  return `Back ${date}`;
}

function nextDueDate(recurrence, fromIso) {
  const option = recurrenceOptions[recurrence] || recurrenceOptions.daily;
  if (option.multi) return null;
  const next = new Date(fromIso);
  next.setDate(next.getDate() + option.days);
  next.setHours(0, 0, 0, 0);
  return next.toISOString();
}

function startOfTomorrowIso() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.toISOString();
}

function multiCompleteCountToday(chore) {
  if (chore.recurrence !== "multi") return 0;
  const today = new Date().toDateString();
  return state.transactions.filter((tx) => {
    if (tx.voidedAt) return false;
    if (tx.type !== "earn") return false;
    if (new Date(tx.date).toDateString() !== today) return false;
    return tx.choreId === chore.id || (!tx.choreId && tx.title === chore.title && tx.note === "Adult approved");
  }).length;
}

function refreshRecurringMissions() {
  const now = Date.now();
  state.chores.forEach((chore) => {
    if (chore.learningReward) return;
    if (chore.recurrence === "multi" && chore.status === "open" && multiCompleteCountToday(chore) >= 3) {
      chore.status = "paid";
      chore.completedAt = null;
      chore.nextDue = startOfTomorrowIso();
    }
    if (chore.status === "paid" && chore.nextDue && new Date(chore.nextDue).getTime() <= now) {
      chore.status = "open";
      chore.completedAt = null;
      chore.paidAt = null;
      chore.nextDue = null;
    }
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

document.body.addEventListener("click", (event) => {
  const target = event.target.closest("button");
  if (!target) return;

  playButtonSound(target);
  if (target.dataset.view) switchView(target.dataset.view, { preserveParentMode: Boolean(target.dataset.parentMode) });
  if (target.dataset.parentMode) switchParentMode(target.dataset.parentMode);
  if (target.dataset.chart) {
    chartMode = target.dataset.chart;
    drawChart();
  }
  if (target.dataset.learnScreen) switchLearningScreen(target.dataset.learnScreen);
  if (target.dataset.mathAnswer) answerMath(target.dataset.mathAnswer, target.dataset.mathKind);
  if (target.dataset.mathCountKind) countMathHelper(target.dataset.mathCountKind, target.dataset.mathCountIndex);
  if (target.dataset.countStep) countAlong(target.dataset.countStep);
  if (target.dataset.mixCountId) countMixedFriend(target.dataset.mixCountId);
  if (target.dataset.newCountMix !== undefined) newCountingMix();
  if (target.dataset.countAnswer) answerCounting(target.dataset.countAnswer);
  if (target.dataset.sayLetter !== undefined) sayCurrentLetter();
  if (target.dataset.sayPhonics !== undefined) sayCurrentPhonics();
  if (target.dataset.newLetter !== undefined) newLetter();
  if (target.dataset.checkWriting !== undefined) checkWritingPractice();
  if (target.dataset.writingCorrect !== undefined) markWritingCorrect("alphabet");
  if (target.dataset.writingIncorrect !== undefined) markWritingIncorrect("alphabet");
  if (target.dataset.wordLetter !== undefined) selectWordLetter(target.dataset.wordLetter);
  if (target.dataset.wordSlot !== undefined) placeSelectedWordLetter(target.dataset.wordSlot);
  if (target.dataset.newWord !== undefined) newWord();
  if (target.dataset.checkWordWriting !== undefined) checkWordWritingPractice();
  if (target.dataset.wordWritingCorrect !== undefined) markWritingCorrect("word");
  if (target.dataset.wordWritingIncorrect !== undefined) markWritingIncorrect("word");
  if (target.dataset.toggleShop !== undefined) toggleShop();
  if (target.dataset.toggleTrail !== undefined) toggleTrail();
  if (target.dataset.toggleSettings !== undefined) toggleSettings();
  if (target.dataset.complete) completeChore(target.dataset.complete);
  if (target.dataset.approve) approveChore(target.dataset.approve);
  if (target.dataset.decline) declineChore(target.dataset.decline);
  if (target.dataset.delete) deleteChore(target.dataset.delete);
  if (target.dataset.edit) editChore(target.dataset.edit);
  if (target.dataset.voidTx) voidTransaction(target.dataset.voidTx);
  if (target.dataset.buyOutfit) buyOutfit(target.dataset.buyOutfit);
  if (target.dataset.equipOutfit) equipOutfit(target.dataset.equipOutfit);
});

document.body.addEventListener("pointerover", (event) => {
  const target = event.target.closest("button");
  if (!target) return;
  playHoverSound(target, event);
});


document.body.addEventListener("dragstart", (event) => {
  const target = event.target.closest("[data-word-letter]");
  if (!target) return;
  const index = Number(target.dataset.wordLetter);
  const letter = state.learning.wordLetters[index];
  event.dataTransfer.setData("text/plain", String(index));
  event.dataTransfer.effectAllowed = "move";
  state.learning.selectedWordIndex = index;
  if (letter) speakLetterName(letter);
});

document.body.addEventListener("dragover", (event) => {
  if (!event.target.closest("[data-word-slot]")) return;
  event.preventDefault();
});

document.body.addEventListener("drop", (event) => {
  const slot = event.target.closest("[data-word-slot]");
  if (!slot) return;
  event.preventDefault();
  const draggedIndex = event.dataTransfer.getData("text/plain");
  placeWordLetter(draggedIndex === "" ? state.learning.selectedWordIndex : draggedIndex, slot.dataset.wordSlot);
});

els.childName.addEventListener("input", (event) => {
  state.childName = event.target.value;
  render();
});

els.adultMode.addEventListener("change", (event) => {
  if (!event.target.checked) {
    state.adultMode = false;
    showToast("Kid mode on.");
    render();
    return;
  }

  if (confirmAdultMode()) {
    state.adultMode = true;
    playSound("success");
    showToast("Adult mode on.");
  } else {
    state.adultMode = false;
    event.target.checked = false;
    playSound("low");
    showToast("Not quite. Staying in kid mode.");
  }
  render();
});

els.soundEffects.addEventListener("change", (event) => {
  state.soundOn = event.target.checked;
  if (state.soundOn) playSound("success");
  render();
});

els.tokenCurrency.addEventListener("change", (event) => {
  if (!state.adultMode) {
    event.target.checked = state.useTokenCurrency;
    showToast("Turn on adult mode to change currency.");
    return;
  }

  captureUndo("Currency setting");
  state.useTokenCurrency = event.target.checked;
  showToast(state.useTokenCurrency ? "Account currency changed to tokens." : "Account currency changed to dollars.", { undo: true });
  render();
});

els.choreForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addChore(event.currentTarget);
});

els.cancelEdit.addEventListener("click", resetMissionForm);
els.clearWriting?.addEventListener("click", () => clearWritingPad("alphabet"));
els.clearWordWriting?.addEventListener("click", () => clearWritingPad("word"));
els.undoButton?.addEventListener("click", undoLastAction);
els.undoLastAction?.addEventListener("click", undoLastAction);

els.heroMascot.addEventListener("click", showLaughingMascot);

els.heroMascot.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    showLaughingMascot();
  }
});

els.purchaseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addPurchase(event.currentTarget);
});

els.resetDemo.addEventListener("click", () => {
  captureUndo("Reset");
  state = structuredClone(sampleState);
  celebrate("Mission board reset.", { undo: true });
  render();
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("./service-worker.js").catch(() => {});
}

render();






