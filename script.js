/**
 * Tuition Class Tracker - Core Script
 * Designed with plain Vanilla JS and clearly structured for educational purposes.
 */

// ==========================================
// 1. STATE & GLOBAL VARIABLES
// ==========================================
let classesData = [];  // Array of class objects loaded from JSON / user additions
let paymentsData = []; // Array of payment objects loaded from payments.json
let monthlyChart = null; // Chart.js instance reference

// Day names lookup array for calculating day of week from ISO date string
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ==========================================
// 2. INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

/**
 * Initializes the application by fetching JSON data and setting up event listeners.
 */
async function initApp() {
  try {
    // Fetch data concurrently from JSON files
    const [classesRes, paymentsRes] = await Promise.all([
      fetch('data/classes.json'),
      fetch('data/payments.json')
    ]);

    if (!classesRes.ok) throw new Error('Failed to fetch data/classes.json');
    if (!paymentsRes.ok) throw new Error('Failed to fetch data/payments.json');

    classesData = await classesRes.json();
    paymentsData = await paymentsRes.json();

    // Setup UI event listeners
    setupEventListeners();

    // Populate month filter dropdown choices
    populateMonthFilterOptions();

    // Initial render of dashboard, table, chart, and JSON output
    renderAll();
  } catch (err) {
    console.error('Error initializing application:', err);
  }
}

// ==========================================
// 3. DATA COMPUTATIONS & LOGIC
// ==========================================

/**
 * Helper to calculate the Day of Week string (e.g., "Monday") from an ISO date string ("YYYY-MM-DD").
 * Avoids timezone offsets by parsing date components directly.
 * @param {string} dateStr - ISO Date string YYYY-MM-DD
 * @returns {string} Day of week name
 */
function getDayOfWeek(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  // Month in JS Date constructor is 0-indexed
  const dateObj = new Date(year, month - 1, day);
  return DAYS_OF_WEEK[dateObj.getDay()];
}

/**
 * Enriches classesData with calculated fields (class number '#', day of week, fee block number).
 * Sorts classes chronologically by date.
 * @returns {Array} Enriched classes array
 */
function getProcessedClasses() {
  // Sort classes chronologically by date
  const sortedClasses = [...classesData].sort((a, b) => a.date.localeCompare(b.date));

  let classNumCounter = 0;

  return sortedClasses.map((item) => {
    // Day of the week is calculated dynamically
    const day = getDayOfWeek(item.date);

    let classNum = null;
    let feeBlock = null;

    // Only classes marked as 'Yes' increment the class number and fee block assignment
    if (item.attended === 'Yes') {
      classNumCounter++;
      classNum = classNumCounter;
      // Block calculation: e.g., class #1..10 -> Block 1, #11..20 -> Block 2
      feeBlock = Math.ceil(classNum / 10);
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
 * Computes dashboard metric summaries:
 * Total Attended Classes, Total Hours, Total Fees Paid, and Average Cost Per Class.
 */
function computeMetrics(processedClasses) {
  // Count classes attended ("Yes")
  const attendedClasses = processedClasses.filter(c => c.attended === 'Yes');
  const totalAttendedCount = attendedClasses.length;

  // Sum hours for attended classes
  const totalHours = attendedClasses.reduce((sum, c) => sum + (Number(c.hours) || 0), 0);

  // Sum fees paid from paymentsData
  const totalFeesPaid = paymentsData.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Calculate average cost per class
  const avgCostPerClass = totalAttendedCount > 0 ? Math.round(totalFeesPaid / totalAttendedCount) : 0;

  return {
    totalAttendedCount,
    totalHours,
    totalFeesPaid,
    avgCostPerClass,
    totalLoggedClasses: processedClasses.length
  };
}

/**
 * Computes current fee block status (progress bar & payment due alert banner).
 */
function computeBlockStatus(processedClasses) {
  const attendedClasses = processedClasses.filter(c => c.attended === 'Yes');
  const count = attendedClasses.length;

  const currentBlockNum = count === 0 ? 1 : Math.ceil(count / 10);
  const usedInCurrentBlock = count === 0 ? 0 : (count % 10 === 0 ? 10 : count % 10);

  // Check if current block has reached 10 and if payment has been recorded for this block
  const totalPaymentsExpected = currentBlockNum; // Assuming each block is Rs. 11,250
  const totalPaymentsRecorded = paymentsData.length;

  // Payment is due if 10/10 classes used in current block and payment count is less than block count
  const isPaymentDue = (usedInCurrentBlock === 10 && totalPaymentsRecorded < totalPaymentsExpected) ||
                       (count > 0 && count % 10 === 0 && totalPaymentsRecorded < Math.ceil(count / 10));

  return {
    currentBlockNum,
    usedInCurrentBlock,
    isPaymentDue
  };
}

// ==========================================
// 4. DISPLAY & RENDERING LOGIC
// ==========================================

/**
 * Master render function that updates all UI components based on current state.
 */
function renderAll() {
  const processedClasses = getProcessedClasses();

  renderDashboardMetrics(processedClasses);
  renderBlockTracker(processedClasses);
  renderClassesTable(processedClasses);
  renderMonthlyChart(processedClasses);
  updateJsonPreviewTextArea();
}

/**
 * Renders top metric cards.
 */
function renderDashboardMetrics(processedClasses) {
  const metrics = computeMetrics(processedClasses);

  document.getElementById('metricClassesAttended').textContent = metrics.totalAttendedCount;
  document.getElementById('metricClassesSubtext').textContent = `${metrics.totalLoggedClasses} total logged`;

  document.getElementById('metricTotalHours').textContent = `${metrics.totalHours} hrs`;

  document.getElementById('metricTotalFees').textContent = `Rs. ${metrics.totalFeesPaid.toLocaleString()}`;
  document.getElementById('metricPaymentsCount').textContent = `${paymentsData.length} payment record(s)`;

  document.getElementById('metricAvgCost').textContent = `Rs. ${metrics.avgCostPerClass.toLocaleString()}`;
}

/**
 * Renders current block progress bar and due payment alert banner.
 */
function renderBlockTracker(processedClasses) {
  const status = computeBlockStatus(processedClasses);

  document.getElementById('blockTrackerSubtext').textContent = `Block ${status.currentBlockNum} Progress`;
  document.getElementById('blockBadge').textContent = `${status.usedInCurrentBlock} / 10 used`;

  const percentage = (status.usedInCurrentBlock / 10) * 100;
  document.getElementById('blockProgressBar').style.width = `${percentage}%`;

  const banner = document.getElementById('paymentDueBanner');
  if (status.isPaymentDue) {
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
}

/**
 * Renders the class log table based on current filters (month and search input).
 */
function renderClassesTable(processedClasses) {
  const tbody = document.getElementById('classesTableBody');
  tbody.innerHTML = '';

  const selectedMonth = document.getElementById('monthFilter').value;
  const searchQuery = document.getElementById('searchInput').value.trim().toLowerCase();

  // Filter classes according to month and search term
  const filtered = processedClasses.filter((item) => {
    // Month filter check (item.date is YYYY-MM-DD)
    if (selectedMonth !== 'all' && !item.date.startsWith(selectedMonth)) {
      return false;
    }

    // Search query check
    if (searchQuery) {
      const matchDate = item.date.toLowerCase().includes(searchQuery);
      const matchDay = item.day.toLowerCase().includes(searchQuery);
      const matchAttended = item.attended.toLowerCase().includes(searchQuery);
      const matchNotes = (item.notes || '').toLowerCase().includes(searchQuery);
      const matchTime = (item.time || '').toLowerCase().includes(searchQuery);
      if (!matchDate && !matchDay && !matchAttended && !matchNotes && !matchTime) {
        return false;
      }
    }

    return true;
  });

  if (filtered.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="8" style="text-align:center; padding: 1.5rem; color: var(--text-muted);">No classes found matching criteria.</td>`;
    tbody.appendChild(tr);
    return;
  }

  filtered.forEach((item) => {
    const tr = document.createElement('tr');

    // Color code row by fee block index (cycle through 5 distinct block styles)
    if (item.feeBlock) {
      const blockStyleIndex = (item.feeBlock - 1) % 5;
      tr.classList.add(`block-row-${blockStyleIndex}`);
    }

    // Status pill style mapping
    let statusClass = 'status-yes';
    if (item.attended === 'No') statusClass = 'status-no';
    if (item.attended === 'Rescheduled') statusClass = 'status-rescheduled';

    const timeDisplay = item.time ? `${item.time}${item.timezone ? ' (' + item.timezone + ')' : ''}` : '-';

    tr.innerHTML = `
      <td>${item.classNum !== null ? item.classNum : '-'}</td>
      <td><strong>${item.date}</strong></td>
      <td>${item.day}</td>
      <td>${timeDisplay}</td>
      <td>${item.hours} hrs</td>
      <td><span class="status-pill ${statusClass}">${item.attended}</span></td>
      <td>${item.feeBlock ? 'Block ' + item.feeBlock : '-'}</td>
      <td>${escapeHtml(item.notes || '')}</td>
    `;

    tbody.appendChild(tr);
  });
}

/**
 * Populates month filter options dynamically based on available class dates.
 */
function populateMonthFilterOptions() {
  const select = document.getElementById('monthFilter');
  const currentValue = select.value;
  select.innerHTML = '<option value="all">All Months</option>';

  // Extract unique YYYY-MM strings
  const monthsSet = new Set(classesData.map(c => c.date.substring(0, 7)));
  const sortedMonths = Array.from(monthsSet).sort();

  sortedMonths.forEach((m) => {
    const [year, monthNum] = m.split('-');
    const monthName = new Date(year, monthNum - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
    const option = document.createElement('option');
    option.value = m;
    option.textContent = monthName;
    select.appendChild(option);
  });

  select.value = currentValue;
}

/**
 * Renders Chart.js Monthly Classes bar chart.
 */
function renderMonthlyChart(processedClasses) {
  const ctx = document.getElementById('monthlyChart').getContext('2d');

  // Group attended classes per month (YYYY-MM)
  const monthlyCounts = {};

  processedClasses.forEach((c) => {
    if (c.attended === 'Yes') {
      const monthKey = c.date.substring(0, 7);
      monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
    }
  });

  const sortedMonths = Object.keys(monthlyCounts).sort();
  const labels = sortedMonths.map((m) => {
    const [year, monthNum] = m.split('-');
    return new Date(year, monthNum - 1, 1).toLocaleString('default', { month: 'short', year: 'numeric' });
  });
  const counts = sortedMonths.map(m => monthlyCounts[m]);

  if (monthlyChart) {
    monthlyChart.destroy(); // Destroy previous instance to avoid canvas reuse error
  }

  // Get theme colors from computed styles
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

/**
 * Updates the JSON output textarea for user copy-pasting.
 */
function updateJsonPreviewTextArea() {
  const textarea = document.getElementById('jsonOutput');
  // Format JSON array with 2-space indentation
  textarea.value = JSON.stringify(classesData, null, 2);
}

// ==========================================
// 5. EVENT HANDLERS & ACTIONS
// ==========================================

/**
 * Registers all DOM event listeners.
 */
function setupEventListeners() {
  // Table search input filter
  document.getElementById('searchInput').addEventListener('input', () => {
    const processedClasses = getProcessedClasses();
    renderClassesTable(processedClasses);
  });

  // Table month dropdown filter
  document.getElementById('monthFilter').addEventListener('change', () => {
    const processedClasses = getProcessedClasses();
    renderClassesTable(processedClasses);
  });

  // Form submission (Add new class)
  document.getElementById('addClassForm').addEventListener('submit', handleAddClassSubmit);

  // Copy JSON button
  document.getElementById('copyJsonBtn').addEventListener('click', handleCopyJson);

  // Download CSV button
  document.getElementById('downloadCsvBtn').addEventListener('click', handleDownloadCsv);

  // CSV file input import
  document.getElementById('csvFileInput').addEventListener('change', handleCsvImport);

  // Print Summary button
  document.getElementById('printBtn').addEventListener('click', () => {
    window.print();
  });
}

/**
 * Handles adding a new class entry from the form into in-memory classesData.
 */
function handleAddClassSubmit(e) {
  e.preventDefault();

  const newClass = {
    date: document.getElementById('inputDate').value,
    time: document.getElementById('inputTime').value.trim(),
    timezone: document.getElementById('inputTimezone').value,
    hours: parseFloat(document.getElementById('inputHours').value) || 1.5,
    attended: document.getElementById('inputAttended').value,
    notes: document.getElementById('inputNotes').value.trim()
  };

  classesData.push(newClass);

  // Re-populate month options in case a new month was added
  populateMonthFilterOptions();

  // Re-render dashboard, table, chart, and JSON preview
  renderAll();

  // Reset optional fields in form
  document.getElementById('inputNotes').value = '';
  document.getElementById('inputTime').value = '';
}

/**
 * Copies the current JSON preview content to the user's clipboard.
 */
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

/**
 * Exports current processed classes as a CSV download file.
 */
function handleDownloadCsv() {
  const processedClasses = getProcessedClasses();

  const headers = ['#', 'Date', 'Day', 'Time', 'Timezone', 'Hours', 'Attended', 'Fee Block', 'Notes'];
  const rows = processedClasses.map(c => [
    c.classNum || '',
    c.date,
    c.day,
    `"${(c.time || '').replace(/"/g, '""')}"`,
    c.timezone || '',
    c.hours,
    c.attended,
    c.feeBlock || '',
    `"${(c.notes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'tuition_classes.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Handles CSV import: converts imported CSV rows into classes JSON array format.
 */
function handleCsvImport(e) {
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

    // Simple CSV parser supporting quotes
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

      // Find column indices
      const dateIdx = header.findIndex(h => h.includes('date'));
      const timeIdx = header.findIndex(h => h.includes('time') && !h.includes('zone'));
      const tzIdx = header.findIndex(h => h.includes('zone'));
      const hoursIdx = header.findIndex(h => h.includes('hour'));
      const attendedIdx = header.findIndex(h => h.includes('attend'));
      const notesIdx = header.findIndex(h => h.includes('note'));

      if (dateIdx === -1) continue; // Date is required

      const dateVal = cols[dateIdx] || '';
      if (!dateVal) continue;

      importedClasses.push({
        date: dateVal,
        time: timeIdx !== -1 ? cols[timeIdx] : '',
        timezone: tzIdx !== -1 ? cols[tzIdx] : 'IST',
        hours: hoursIdx !== -1 ? parseFloat(cols[hoursIdx]) || 1.5 : 1.5,
        attended: attendedIdx !== -1 ? cols[attendedIdx] : 'Yes',
        notes: notesIdx !== -1 ? cols[notesIdx] : ''
      });
    }

    if (importedClasses.length > 0) {
      classesData = importedClasses;
      populateMonthFilterOptions();
      renderAll();
      alert(`Successfully imported ${importedClasses.length} class(es) from CSV!`);
    } else {
      alert('Failed to parse valid class records from CSV.');
    }
  };

  reader.readAsText(file);
  e.target.value = ''; // Reset file input
}

// ==========================================
// 6. UTILITY FUNCTIONS
// ==========================================

/**
 * Helper to escape HTML to prevent XSS.
 */
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
