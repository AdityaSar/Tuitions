# Tuition Class Tracker

A clean, responsive, mobile-first static web application for tracking tuition classes, fee blocks, fee payments, and monthly attendance statistics.

Hosted on **GitHub Pages** with zero backend, zero build steps, and zero frameworks (built with vanilla HTML, CSS, and JavaScript, plus Chart.js via CDN).

---

## Features

- 📊 **Dashboard Cards**: Track total classes attended, total hours, total fees paid, and average cost per class.
- 📦 **Fee Block Tracker**: Group attended classes into blocks of 10. Displays progress bar (`X / 10 used`) and alerts when payment is due (`Payment due: Rs. 11,250`).
- 📋 **Class Log Table**:
  - Auto-calculates Class Number (`#`) and Day of Week (`Monday`, `Tuesday`, etc.).
  - Color-coded rows by Fee Block.
  - Interactive search filter across notes, status, dates, and times.
  - Filter log by specific month.
- 📈 **Monthly Chart**: Visual bar chart powered by Chart.js showing attended classes per month.
- ➕ **Add Class Form & JSON Generator**:
  - Form to log new classes in-memory.
  - **Copy Updated JSON**: Generates updated JSON formatting so you can copy and commit directly into `data/classes.json` on GitHub.
  - **CSV Import**: Easily upload CSV logs and convert them to the JSON tracking format.
- 📤 **Exporting**:
  - **Download CSV**: Download full class history as CSV.
  - **Print Summary**: Dedicated print stylesheet formatted for clean paper/PDF reporting.
- 🌙 **Dark Mode**: Automatic dark mode based on system preferences.

---

## File Structure

```text
├── index.html               # Main HTML page structure
├── style.css                # Clean, responsive CSS with automatic dark mode
├── script.js                # Well-commented vanilla JavaScript application logic
├── data/
│   ├── classes.json         # Single source of truth for class entries
│   └── payments.json        # Single source of truth for fee payment records
├── .github/
│   └── workflows/
│       └── pages.yml        # GitHub Actions workflow for deployment
└── README.md                # Project setup and usage documentation
```

---

## Data Model

### Classes Data (`/data/classes.json`)
Each entry in `classes.json`:
```json
{
  "date": "2026-03-24",
  "time": "7:00 PM - 8:30 PM",
  "timezone": "IST",
  "hours": 1.5,
  "attended": "Yes",
  "notes": "Calculus fundamentals"
}
```
*Note: Day of week and class numbers (`#`) are NOT stored in JSON; they are dynamically computed in JavaScript.*

### Payment Data (`/data/payments.json`)
Each entry in `payments.json`:
```json
{
  "date": "2026-03-24",
  "amount": 11250,
  "classes": 10,
  "note": "Paid in advance"
}
```

---

## How to Add a Class (Updating Data on GitHub)

Since this site is fully static with no backend database, follow these simple steps to add a new class:

1. Open the website and scroll down to the **Add New Class** form.
2. Enter the date, time, timezone, hours, status, and optional notes. Click **Add Class**.
3. Click the **Copy Updated JSON** button.
4. Navigate to your repository on GitHub: `data/classes.json`.
5. Click the edit (pencil) icon, replace the file content with the copied JSON, and click **Commit changes**.
6. GitHub Actions will automatically rebuild and deploy the updated site!

---

## How to Enable GitHub Pages

1. Push this repository to GitHub on the `main` branch.
2. Go to your repository **Settings** tab.
3. On the left sidebar, click **Pages** (under Code and automation).
4. Under **Build and deployment**:
   - Set **Source** to **GitHub Actions**.
5. Once configured, pushing commits to `main` will trigger the GitHub Actions workflow in `.github/workflows/pages.yml` and publish your site!

---

## Running Locally

Because the application uses `fetch()` to load `/data/classes.json` and `/data/payments.json`, serve the files using a local HTTP server:

Using Python:
```bash
python3 -m http.server 8000
```
Then open `http://localhost:8000` in your web browser.
