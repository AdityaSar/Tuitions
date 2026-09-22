# Tuition Class Tracker

A clean, responsive, mobile-first static web application for tracking tuition classes, fee blocks, and fee payments across multiple subjects (**Maths, Physics, Chemistry, Computers**).

Hosted on **GitHub Pages** with zero backend, zero build steps, and zero frameworks (built with vanilla HTML, CSS, and JavaScript, plus Chart.js via CDN).

---

## Features

- 📑 **Subject Navigation Tabs**: Switch seamlessly between **All Subjects Overview**, **Maths**, **Physics**, **Chemistry**, and **Computers**.
- 📊 **All Subjects Summary**: View combined totals (attended classes, total hours) and separate currency fee totals (INR for Maths/Physics/Chemistry, AED for Computers).
- 📦 **Subject-Specific Fee Block Tracker**:
  - **Maths**: 10-class blocks (INR), with progress bar and `Payment due` banner.
  - **Physics**: 8-class blocks (INR), with progress bar and `Payment due` banner.
  - **Chemistry**: Variable block sizes (10 / 12 classes), tracked per payment.
  - **Computers**: Irregular block sizes (AED), tracked per payment.
- 📋 **Class Log Table**:
  - Auto-calculates Class Number (`#`) and Day of Week (`Monday`, `Tuesday`, etc.).
  - Handles legacy `null` dates cleanly under an `Undated` category.
  - Color-coded rows by Fee Block.
  - Interactive search filter across dates, times, and status.
  - Filter log by specific month.
- 📈 **Monthly Chart**: Visual bar chart powered by Chart.js showing attended classes per month.
- ➕ **Add Class Form & JSON Generator**:
  - Form to log new classes per subject in-memory.
  - **Copy Updated JSON**: Generates updated JSON formatting to commit directly into `/data/classes-{subject}.json` on GitHub.
  - **CSV Import**: Easily upload CSV logs per subject.
- 📤 **Exporting**:
  - **Download CSV**: Download full class history (single subject or all combined).
  - **Print Summary**: Dedicated print stylesheet formatted for clean paper/PDF reporting.
- 🌙 **Dark Mode**: Automatic dark mode based on system preferences.

---

## File Structure

```text
├── index.html                  # Main HTML page structure with tabbed layout
├── style.css                   # Clean, responsive CSS with dark mode
├── script.js                   # Multi-subject JavaScript application logic
├── data/
│   ├── classes-maths.json      # Maths class records
│   ├── payments-maths.json     # Maths payment records
│   ├── classes-physics.json    # Physics class records
│   ├── payments-physics.json   # Physics payment records
│   ├── classes-chemistry.json  # Chemistry class records
│   ├── payments-chemistry.json# Chemistry payment records
│   ├── classes-computers.json  # Computers class records
│   └── payments-computers.json# Computers payment records
├── .github/
│   └── workflows/
│       └── pages.yml           # GitHub Actions workflow for deployment
└── README.md                   # Setup and usage documentation
```

---

## Data Schemas

### Classes File (`/data/classes-{subject}.json`)
```json
{
  "id": 1,
  "date": "2026-03-24",
  "time": "7 PM - 8:30 PM IST",
  "hours": 1.5,
  "attended": "Yes"
}
```
*Note: Day of week and class numbers (`#`) are NOT stored in JSON; they are dynamically computed in JavaScript.*

### Payments File (`/data/payments-{subject}.json`)
```json
{
  "date": "2026-04-26",
  "amount": 1100,
  "currency": "AED",
  "note": "Paid fees of AED 1100 till 26th April on 11th May"
}
```
*Note: Entries with `amount: null` are rendered with their raw note text and excluded from numeric fee sums.*

---

## How to Add a Class (Updating Data on GitHub)

1. Select the relevant subject tab (e.g. **Maths**).
2. Scroll to **Add New Class** form.
3. Fill in date, time, hours, and attendance status, then click **Add Class**.
4. Click **Copy Updated JSON**.
5. Navigate to your GitHub repository: `data/classes-{subject}.json`.
6. Click the edit (pencil) icon, replace file contents with copied JSON, and click **Commit changes**.

---

## Running Locally

Because the application uses `fetch()` to load the JSON files from `/data/`, serve the directory using a local HTTP server:

```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000` in your web browser.
