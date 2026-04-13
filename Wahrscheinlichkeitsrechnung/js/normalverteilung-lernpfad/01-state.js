// ══════════════════════════════════════════════
// GLOBAL STATE
// ══════════════════════════════════════════════
const TOTAL_SECTIONS = 7;
let completedSections = new Set();
let mainChart = null;
let currentTab = 0;
let chartInitialized = false;

let station6Count = 0;
let currentFQ = 0;
let fqAnswers = [];
