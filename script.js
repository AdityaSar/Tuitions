/**
 * Tuition Class Tracker - Multi-Subject Core Script
 * Clean Vanilla JS structured for clarity and maintainability.
 */

// ==========================================
// 1. STATE & GLOBAL CONFIGURATION
// ==========================================
const SUBJECTS = ['maths', 'physics', 'chemistry', 'computers'];

const SUBJECT_CONFIG = {
  maths: {
    name: 'Maths',
    currency: 'INR',
    blockSize: 10,
    hasFixedBlock: true,
    bannerAmount: 'Rs. 11,250'
  },
  physics: {
    name: 'Physics',
    currency: 'INR',
    blockSize: 8,
    hasFixedBlock: true,
    bannerAmount: 'Rs. 12,000'
  },
  chemistry: {
    name: 'Chemistry',
    currency: 'INR',
    hasFixedBlock: false
  },
  computers: {
    name: 'Computers',
    currency: 'AED',
    hasFixedBlock: false
  }
};

// Global data store per subject
const store = {
  maths: { classes: [], payments: [] },
  physics: { classes: [], payments: [] },
  chemistry: { classes: [], payments: [] },
  computers: { classes: [], payments: [] }
};

let currentTab = 'all'; // Active tab: 'all' or subject key
let monthlyChart = null; // Chart.js instance reference

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ==========================================
// 2. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

/**
 * Initializes the app by fetching JSON files for all subjects concurrently.
 */
async function initApp() {
  try {
    const fetchPromises = [];

    SUBJECTS.forEach((sub) => {
      fetchPromises.push(
        fetch(`data/classes-${sub}.json`).then(res => res.json()).then(data => { store[sub].classes = data; }),
        fetch(`data/payments-${sub}.json`).then(res => res.json()).then(data => { store[sub].payments = data; })
      );
    });

    await Promise.all(fetchPromises);

    setupEventListeners();
    renderTab(currentTab);
  } catch (err) {
    console.error('Error initializing multi-subject data:', err);
  }
}

// ==========================================
// 3. TAB SWITCHING LOGIC
// ==========================================

function setupEventListeners() {
  // Tab buttons click listener
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const tab = e.target.getAttribute('data-tab');
      switchTab(tab);
    });
  });

  // Table search input filter
  document.getElementById('searchInput').addEventListener('input', () => {
    if (currentTab !== 'all') {
      const processed = getProcessedClasses(currentTab);
      renderClassesTable(processed);
    }
  });

  // Table month filter dropdown
  document.getElementById('monthFilter').addEventListener('change', () => {
    if (currentTab !== 'all') {
      const processed = getProcessedClasses(currentTab);
      renderClassesTable(processed);
    }
  });

  // Add Class Form submission
  document.getElementById('addClassForm').addEventListener('submit', handleAddClassSubmit);

  // Copy JSON button
  document.getElementById('copyJsonBtn').addEventListener('click', handleCopyJson);

  // Download CSV button
  document.getElementById('downloadCsvBtn').addEventListener('click', handleDownloadCsv);

  // CSV file import
  document.getElementById('csvFileInput').addEventListener('change', handleCsvImport);

  // Print button
  document.getElementById('printBtn').addEventListener('click', () => {
    window.print();
  });
}

function switchTab(tab) {
  currentTab = tab;

  // Update tab buttons visual active state
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    if (btn.getAttribute('data-tab') === tab) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  renderTab(tab);
}

function renderTab(tab) {
  const viewAll = document.getElementById('viewAllSubjects');
  const viewSubject = document.getElementById('viewSubjectTracker');

  if (tab === 'all') {
    viewAll.classList.remove('hidden');
    viewSubject.classList.add('hidden');
    renderAllSubjectsSummary();
  } else {
    viewAll.classList.add('hidden');
    viewSubject.classList.remove('hidden');

    // Update JSON file label in form preview
    document.getElementById('jsonFileName').textContent = `classes-${tab}.json`;

    populateMonthFilterOptions(tab);
    renderSubjectTracker(tab);
  }
}

// ==========================================
// 4. DATA COMPUTATION & ENRICHMENT
// ==========================================

/**
 * Calculates Day of Week string from ISO Date (YYYY-MM-DD). Handles null date cleanly.
 */
function getDayOfWeek(dateStr) {
  if (!dateStr) return 'Undated';
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  return DAYS_OF_WEEK[dateObj.getDay()];
}

/**
 * Enriches class entries for a subject with class numbers (`#`), day of week, and fee block assignment.
 * Handles null dates by sorting dated entries chronologically first, followed by undated entries.
 */
function getProcessedClasses(subjectKey) {
  const rawClasses = store[subjectKey].classes || [];
  const cfg = SUBJECT_CONFIG[subjectKey];

  // Separate dated and undated classes
  const dated = rawClasses.filter(c => c.date).sort((a, b) => a.date.localeCompare(b.date));
  const undated = rawClasses.filter(c => !c.date);
  const sortedClasses = [...dated, ...undated];

  let attendedCounter = 0;

  return sortedClasses.map((item) => {
    const day = getDayOfWeek(item.date);
    let classNum = null;
    let feeBlock = null;

    if (item.attended === 'Yes') {
      attendedCounter++;
      classNum = attendedCounter;

      if (cfg.hasFixedBlock) {
        feeBlock = Math.ceil(classNum / cfg.blockSize);
      }
    }

    return {
      ...item,
      classNum,
      day,
      feeBlock
    };
  });
}

/**
 * Calculates sum of fees paid for a subject, ignoring null amounts.
 */
function calculateSubjectFeesPaid(subjectKey) {
  const payments = store[subjectKey].payments || [];
  return payments.reduce((sum, p) => {
    return sum + (typeof p.amount === 'number' && !isNaN(p.amount) ? p.amount : 0);
  }, 0);
}

// ==========================================
// 5. ALL SUBJECTS OVERVIEW RENDER
// ==========================================

function renderAllSubjectsSummary() {
  let totalAttended = 0;
  let totalLogged = 0;
  let totalHours = 0;
  let totalInr = 0;
  let totalAed = 0;

  const breakdownGrid = document.getElementById('summaryBreakdownGrid');
  breakdownGrid.innerHTML = '';

  SUBJECTS.forEach((subKey) => {
    const processed = getProcessedClasses(subKey);
    const attendedClasses = processed.filter(c => c.attended === 'Yes');
    const attendedCount = attendedClasses.length;
    const loggedCount = processed.length;

    const hours = attendedClasses.reduce((sum, c) => sum + (Number(c.hours) || 0), 0);
    const feesPaid = calculateSubjectFeesPaid(subKey);
    const cfg = SUBJECT_CONFIG[subKey];

    totalAttended += attendedCount;
    totalLogged += loggedCount;
    totalHours += hours;

    if (cfg.currency === 'INR') {
      totalInr += feesPaid;
    } else if (cfg.currency === 'AED') {
      totalAed += feesPaid;
    }

    // Build subject summary card
    const card = document.createElement('div');
    card.className = 'card subject-summary-card';
    card.innerHTML = `
      <h3>${cfg.name}</h3>
      <div class="summary-details-list">
        <div class="summary-details-item">
          <span>Attended Classes:</span>
          <strong>${attendedCount} / ${loggedCount} logged</strong>
        </div>
        <div class="summary-details-item">
          <span>Total Hours:</span>
          <strong>${hours} hrs</strong>
        </div>
        <div class="summary-details-item">
          <span>Total Fees Paid:</span>
          <strong>${cfg.currency === 'INR' ? 'Rs. ' + feesPaid.toLocaleString() : 'AED ' + feesPaid.toLocaleString()}</strong>
        </div>
        <div class="summary-details-item">
          <span>Avg. Cost / Class:</span>
          <strong>${attendedCount > 0 ? (cfg.currency === 'INR' ? 'Rs. ' : 'AED ') + Math.round(feesPaid / attendedCount).toLocaleString() : 'N/A'}</strong>
        </div>
      </div>
    `;
    breakdownGrid.appendChild(card);
  });

  document.getElementById('summaryTotalAttended').textContent = totalAttended;
  document.getElementById('summaryTotalLogged').textContent = `${totalLogged} total logged across 4 subjects`;
  document.getElementById('summaryTotalHours').textContent = `${totalHours} hrs`;
  document.getElementById('summaryInrPaid').textContent = `Rs. ${totalInr.toLocaleString()}`;
  document.getElementById('summaryAedPaid').textContent = `AED ${totalAed.toLocaleString()}`;
}

// ==========================================
// 6. SINGLE SUBJECT TRACKER RENDER
// ==========================================

function renderSubjectTracker(subjectKey) {
  const cfg = SUBJECT_CONFIG[subjectKey];
  const processedClasses = getProcessedClasses(subjectKey);

  renderSubjectMetrics(subjectKey, processedClasses);
  renderSubjectBlockTracker(subjectKey, processedClasses);
  renderPaymentsTable(subjectKey);
  renderMonthlyChart(processedClasses);
  renderClassesTable(processedClasses);
  updateJsonPreviewTextArea(subjectKey);
}

function renderSubjectMetrics(subjectKey, processedClasses) {
  const cfg = SUBJECT_CONFIG[subjectKey];
  const attendedClasses = processedClasses.filter(c => c.attended === 'Yes');
  const attendedCount = attendedClasses.length;
  const totalHours = attendedClasses.reduce((sum, c) => sum + (Number(c.hours) || 0), 0);

  const totalFees = calculateSubjectFeesPaid(subjectKey);
  const avgCost = attendedCount > 0 ? Math.round(totalFees / attendedCount) : 0;
  const currPrefix = cfg.currency === 'INR' ? 'Rs. ' : 'AED ';

  document.getElementById('metricClassesAttended').textContent = attendedCount;
  document.getElementById('metricClassesSubtext').textContent = `${processedClasses.length} total logged`;
  document.getElementById('metricTotalHours').textContent = `${totalHours} hrs`;
  document.getElementById('metricTotalFees').textContent = `${currPrefix}${totalFees.toLocaleString()}`;
  document.getElementById('metricPaymentsCount').textContent = `${(store[subjectKey].payments || []).length} payment record(s)`;
  document.getElementById('metricAvgCost').textContent = `${currPrefix}${avgCost.toLocaleString()}`;
}

function renderSubjectBlockTracker(subjectKey, processedClasses) {
  const cfg = SUBJECT_CONFIG[subjectKey];
  const attendedCount = processedClasses.filter(c => c.attended === 'Yes').length;
  const banner = document.getElementById('paymentDueBanner');
  const progressBarWrapper = document.getElementById('progressBarWrapper');

  if (cfg.hasFixedBlock) {
    // Maths (10) and Physics (8)
    progressBarWrapper.classList.remove('hidden');
    const blockSize = cfg.blockSize;
    const currentBlockNum = attendedCount === 0 ? 1 : Math.ceil(attendedCount / blockSize);
    const usedInCurrentBlock = attendedCount === 0 ? 0 : (attendedCount % blockSize === 0 ? blockSize : attendedCount % blockSize);

    document.getElementById('blockTrackerTitle').textContent = `${cfg.name} Fee Block Status`;
    document.getElementById('blockTrackerSubtext').textContent = `Block ${currentBlockNum} Progress (${blockSize} classes / block)`;
    document.getElementById('blockBadge').textContent = `${usedInCurrentBlock} / ${blockSize} used`;

    const percentage = (usedInCurrentBlock / blockSize) * 100;
    document.getElementById('blockProgressBar').style.width = `${percentage}%`;

    // Check if payment is due
    const totalPaymentsRecorded = (store[subjectKey].payments || []).length;
    const isPaymentDue = (usedInCurrentBlock === blockSize && totalPaymentsRecorded < currentBlockNum) ||
                         (attendedCount > 0 && attendedCount % blockSize === 0 && totalPaymentsRecorded < Math.ceil(attendedCount / blockSize));

    if (isPaymentDue) {
      banner.classList.remove('hidden');
      document.getElementById('bannerTitle').textContent = `Payment Due: ${cfg.bannerAmount}`;
      document.getElementById('bannerText').textContent = `Current fee block of ${blockSize} classes has been reached for ${cfg.name}. Please record payment in data/payments-${subjectKey}.json.`;
    } else {
      banner.classList.add('hidden');
    }
  } else {
    // Chemistry & Computers: Variable / Irregular block sizes
    progressBarWrapper.classList.add('hidden');
    banner.classList.add('hidden');

    document.getElementById('blockTrackerTitle').textContent = `${cfg.name} Fee Tracker Status`;
    document.getElementById('blockTrackerSubtext').textContent = `Total Attended: ${attendedCount} classes`;
    document.getElementById('blockBadge').textContent = `${attendedCount} classes total`;
  }
}

function renderPaymentsTable(subjectKey) {
  const tbody = document.getElementById('paymentsTableBody');
  tbody.innerHTML = '';
  const payments = store[subjectKey].payments || [];
  const cfg = SUBJECT_CONFIG[subjectKey];

  if (payments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:1rem; color:var(--text-muted);">No payment records found.</td></tr>`;
    return;
  }

  payments.forEach((p) => {
    const tr = document.createElement('tr');
    const dateVal = p.date || 'Undated';
    const amountVal = (typeof p.amount === 'number' && !isNaN(p.amount))
      ? (cfg.currency === 'INR' ? 'Rs. ' : 'AED ') + p.amount.toLocaleString()
      : '-';

    tr.innerHTML = `
      <td><strong>${dateVal}</strong></td>
      <td>${amountVal}</td>
      <td>${escapeHtml(p.note || '')}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderClassesTable(processedClasses) {
  const tbody = document.getElementById('classesTableBody');
  tbody.innerHTML = '';

  const selectedMonth = document.getElementById('monthFilter').value;
  const searchQuery = document.getElementById('searchInput').value.trim().toLowerCase();

  const filtered = processedClasses.filter((item) => {
    if (selectedMonth !== 'all') {
      if (selectedMonth === 'undated') {
        if (item.date !== null && item.date !== undefined && item.date !== '') return false;
      } else if (!item.date || !item.date.startsWith(selectedMonth)) {
        return false;
      }
    }

    if (searchQuery) {
      const matchDate = (item.date || 'undated').toLowerCase().includes(searchQuery);
      const matchDay = (item.day || '').toLowerCase().includes(searchQuery);
      const matchAttended = (item.attended || '').toLowerCase().includes(searchQuery);
      const matchTime = (item.time || '').toLowerCase().includes(searchQuery);
      if (!matchDate && !matchDay && !matchAttended && !matchTime) {
        return false;
      }
    }

    return true;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 1.5rem; color: var(--text-muted);">No classes found matching criteria.</td></tr>`;
    return;
  }

  filtered.forEach((item) => {
    const tr = document.createElement('tr');

    if (item.feeBlock) {
      const blockStyleIndex = (item.feeBlock - 1) % 5;
      tr.classList.add(`block-row-${blockStyleIndex}`);
    }

    let statusClass = 'status-yes';
    if (item.attended === 'No') statusClass = 'status-no';
    if (item.attended === 'Rescheduled') statusClass = 'status-rescheduled';

    const dateDisplay = item.date ? `<strong>${item.date}</strong>` : '<span class="text-muted">Undated</span>';
    const hoursDisplay = item.hours !== null && item.hours !== undefined ? `${item.hours} hrs` : '-';
    const attendedDisplay = item.attended ? `<span class="status-pill ${statusClass}">${item.attended}</span>` : '-';

    tr.innerHTML = `
      <td>${item.classNum !== null ? item.classNum : '-'}</td>
      <td>${dateDisplay}</td>
      <td>${item.day}</td>
      <td>${item.time || '-'}</td>
      <td>${hoursDisplay}</td>
      <td>${attendedDisplay}</td>
      <td>${item.feeBlock ? 'Block ' + item.feeBlock : '-'}</td>
    `;

    tbody.appendChild(tr);
  });
}

function populateMonthFilterOptions(subjectKey) {
  const select = document.getElementById('monthFilter');
  const currentValue = select.value;
  select.innerHTML = '<option value="all">All Months</option>';

  const rawClasses = store[subjectKey].classes || [];
  let hasUndated = false;
  const monthsSet = new Set();

  rawClasses.forEach((c) => {
    if (c.date) {
      monthsSet.add(c.date.substring(0, 7));
    } else {
      hasUndated = true;
    }
  });

  const sortedMonths = Array.from(monthsSet).sort();

  sortedMonths.forEach((m) => {
    const [year, monthNum] = m.split('-');
    const monthName = new Date(year, monthNum - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    const option = document.createElement('option');
    option.value = m;
    option.textContent = monthName;
    select.appendChild(option);
  });

  if (hasUndated) {
    const option = document.createElement('option');
    option.value = 'undated';
    option.textContent = 'Undated Classes';
    select.appendChild(option);
  }

  select.value = currentValue;
}

function renderMonthlyChart(processedClasses) {
  const ctx = document.getElementById('monthlyChart').getContext('2d');
  const monthlyCounts = {};

  processedClasses.forEach((c) => {
    if (c.attended === 'Yes') {
      const monthKey = c.date ? c.date.substring(0, 7) : 'Undated';
      monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
    }
  });

  const sortedKeys = Object.keys(monthlyCounts).sort((a, b) => {
    if (a === 'Undated') return 1;
    if (b === 'Undated') return -1;
    return a.localeCompare(b);
  });

  const labels = sortedKeys.map((m) => {
    if (m === 'Undated') return 'Undated';
    const [year, monthNum] = m.split('-');
    return new Date(year, monthNum - 1, 1).toLocaleString('default', { month: 'short', year: 'numeric' });
  });

  const counts = sortedKeys.map(m => monthlyCounts[m]);

  if (monthlyChart) {
    monthlyChart.destroy();
  }

  const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const textColor = isDark ? '#cbd5e1' : '#475569';
  const gridColor = isDark ? '#334155' : '#e2e8f0';

  monthlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Attended Classes',
        data: counts,
        backgroundColor: '#2563eb',
        borderRadius: 4,
        maxBarThickness: 40
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          ticks: { color: textColor },
          grid: { display: false }
        },
        y: {
          ticks: { color: textColor, stepSize: 1 },
          grid: { color: gridColor },
          beginAtZero: true
        }
      }
    }
  });
}

function updateJsonPreviewTextArea(subjectKey) {
  const textarea = document.getElementById('jsonOutput');
  textarea.value = JSON.stringify(store[subjectKey].classes, null, 2);
}

// ==========================================
// 7. FORM & ACTION HANDLERS
// ==========================================

function handleAddClassSubmit(e) {
  e.preventDefault();
  if (currentTab === 'all') return;

  const rawClasses = store[currentTab].classes;

  // Auto increment ID if present
  const maxId = rawClasses.reduce((max, c) => (typeof c.id === 'number' ? Math.max(max, c.id) : max), 0);

  const newClass = {
    id: maxId + 1,
    date: document.getElementById('inputDate').value || null,
    time: document.getElementById('inputTime').value.trim() || null,
    hours: parseFloat(document.getElementById('inputHours').value) || 1.0,
    attended: document.getElementById('inputAttended').value
  };

  rawClasses.push(newClass);

  populateMonthFilterOptions(currentTab);
  renderSubjectTracker(currentTab);

  document.getElementById('inputTime').value = '';
}

function handleCopyJson() {
  const jsonText = document.getElementById('jsonOutput').value;

  navigator.clipboard.writeText(jsonText).then(() => {
    const toast = document.getElementById('copyToast');
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 2500);
  }).catch((err) => {
    console.error('Failed to copy JSON to clipboard:', err);
  });
}

function handleDownloadCsv() {
  if (currentTab === 'all') {
    // Export all subjects combined CSV
    let allRows = [['Subject', '#', 'Date', 'Day', 'Time', 'Hours', 'Attended', 'Fee Block']];

    SUBJECTS.forEach((subKey) => {
      const processed = getProcessedClasses(subKey);
      processed.forEach((c) => {
        allRows.push([
          SUBJECT_CONFIG[subKey].name,
          c.classNum || '',
          c.date || 'Undated',
          c.day,
          `"${(c.time || '').replace(/"/g, '""')}"`,
          c.hours !== null && c.hours !== undefined ? c.hours : '',
          c.attended || '',
          c.feeBlock || ''
        ]);
      });
    });

    const csvContent = allRows.map(r => r.join(',')).join('\n');
    downloadCsvFile(csvContent, 'all_subjects_tuition_classes.csv');
  } else {
    // Export single subject CSV
    const processed = getProcessedClasses(currentTab);
    const headers = ['#', 'Date', 'Day', 'Time', 'Hours', 'Attended', 'Fee Block'];
    const rows = processed.map(c => [
      c.classNum || '',
      c.date || 'Undated',
      c.day,
      `"${(c.time || '').replace(/"/g, '""')}"`,
      c.hours !== null && c.hours !== undefined ? c.hours : '',
      c.attended || '',
      c.feeBlock || ''
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadCsvFile(csvContent, `${currentTab}_tuition_classes.csv`);
  }
}

function downloadCsvFile(content, fileName) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function handleCsvImport(e) {
  if (currentTab === 'all') {
    alert('Please select a specific subject tab (Maths, Physics, Chemistry, Computers) before importing a CSV.');
    return;
  }

  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(evt) {
    const text = evt.target.result;
    const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');

    if (lines.length < 2) {
      alert('CSV file appears empty or lacks data rows.');
      return;
    }

    const parseCsvLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const header = parseCsvLine(lines[0]).map(h => h.toLowerCase());
    const importedClasses = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCsvLine(lines[i]);
      if (cols.length === 0) continue;

      const dateIdx = header.findIndex(h => h.includes('date'));
      const timeIdx = header.findIndex(h => h.includes('time'));
      const hoursIdx = header.findIndex(h => h.includes('hour'));
      const attendedIdx = header.findIndex(h => h.includes('attend'));

      const dateVal = dateIdx !== -1 ? cols[dateIdx] : null;

      importedClasses.push({
        id: i,
        date: dateVal && dateVal !== 'Undated' ? dateVal : null,
        time: timeIdx !== -1 && cols[timeIdx] ? cols[timeIdx] : null,
        hours: hoursIdx !== -1 && cols[hoursIdx] ? parseFloat(cols[hoursIdx]) || 1.0 : 1.0,
        attended: attendedIdx !== -1 && cols[attendedIdx] ? cols[attendedIdx] : 'Yes'
      });
    }

    if (importedClasses.length > 0) {
      store[currentTab].classes = importedClasses;
      populateMonthFilterOptions(currentTab);
      renderSubjectTracker(currentTab);
      alert(`Successfully imported ${importedClasses.length} class(es) into ${SUBJECT_CONFIG[currentTab].name}!`);
    } else {
      alert('Failed to parse valid class records from CSV.');
    }
  };

  reader.readAsText(file);
  e.target.value = '';
}

function escapeHtml(str) {
  return str.replace(/[&<>"']/g, function(m) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[m];
  });
}
