# Number Extractor Pro

> **Enterprise-Grade Phone Number Extraction, Country Separation, Smart OTP Filtering & Deduplication Engine**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAtiar594i%2Fnumber-extractor-pro)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-emerald.svg)]()
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Client--Side-green.svg)]()

**Number Extractor Pro** is a high-performance web application designed for telecom engineers, digital marketers, and SMS aggregator operators. It is purpose-built to parse messy SMS panel reports—such as **Flex SMS Failed SMS Reports**, delivery status dumps, and marketing spreadsheets—and accurately extract international phone numbers while strictly filtering out OTP codes, Telegram verification codes, and metadata noise.

---

## 🌟 Key Features

### 1. Smart Phone Number Detection Engine
- **International Dial Code Validation**: Powered by Google's `libphonenumber` metadata. Validates real subscriber number structures, mobile prefixes, and country codes worldwide.
- **Prefix Agnostic**: Identifies numbers whether they start with `+`, `00`, or raw country codes without signs (e.g. `96891234567` for Oman, `2250708091011` for Ivory Coast, `998901234567` for Uzbekistan).
- **String Preservation**: SheetJS is configured with text-cell parsing (`t: 's'`) to ensure leading zeros (`0171...`) and long numbers are never corrupted by Excel scientific notation.

### 2. Smart OTP & Message Filter (Zero False Positives)
- **Telegram & SMS Code Rejection**: Automatically excludes patterns like `Telegram code: 12345`, `Your verification code is 67890`, `Login code: 54321`, `Telegram 5-digit code: 12345`.
- **4–8 Digit Auth Code Exclusion**: Standalone short numeric codes, message IDs, and timestamps (`172900...`) are never mistaken for phone numbers.
- **Needs Review Quarantine**: Borderline or ambiguous numbers (e.g., national numbers without international dial codes) are isolated in a dedicated Review tab.

### 3. Country-Wise Extraction & Dedicated Views
- Automatically categorizes numbers into country collections:
  - **Oman (+968)**
  - **Ivory Coast (+225)**
  - **Uzbekistan (+998)**
  - **Ukraine (+380)**
  - **Israel (+972)**
  - **Libya (+218)**, **Algeria (+213)**, **Belarus (+375)**, **Sudan (+249)**, **Kenya (+254)**, **Indonesia (+62)**, **Madagascar (+261)**, **Azerbaijan (+994)**, **Kyrgyzstan (+996)**, **Benin (+229)**, **Gabon (+241)**, **Hong Kong (+852)**, **United States (+1)**, **United Kingdom (+44)**, **Bangladesh (+880)**, and all other worldwide nations.
- Click any country card to view its numbers, search within the country, copy with 1 click, or export individual country `.txt` or `.xlsx` files.

### 4. Advanced Cross-File Deduplication
- Normalizes phone numbers to standard E.164 (`+968XXXXXXXX`) before comparing.
- Accurately tracks original occurrences vs duplicates.
- View and export duplicates separately, or purge all duplicates with one click.

### 5. Multi-Format Export Suite
- **Country-Wise ZIP Package**: Exports a single `.zip` archive containing separate `.txt` files for every country (e.g., `Oman (+968) - 250 numbers.txt`), along with a `Summary_Report.csv`.
- **Clean TXT**: Pure phone numbers formatted one per line with zero extra characters or OTP noise.
- **Excel (.xlsx)**: Preserves phone numbers as string cells to prevent spreadsheet corruption.
- **CSV & Clipboard**: Instant copy of single numbers, selected subsets, or entire filtered tables.

### 6. Privacy & Performance
- **100% Client-Side**: All parsing and extraction happens in your browser memory. No data is sent to external servers or third parties.
- **IndexedDB Session History**: Processing history is saved locally in browser IndexedDB (bypassing 5MB localStorage limits) so you can reopen past sessions anytime.
- **Chunked Asynchronous Processing**: Processes tens of thousands of rows smoothly without freezing the UI.

---

## 🛠️ Tech Stack

- **Framework**: React 19 + TypeScript
- **Bundler & Build Tool**: Vite 8
- **Styling**: Tailwind CSS v4 (with Dark & Light mode)
- **Icons**: Lucide React
- **Excel & Spreadsheet Processing**: SheetJS (`xlsx`)
- **CSV Processing**: PapaParse
- **Phone Number Parsing & Validation**: `libphonenumber-js` (full metadata bundle)
- **Archive Generation**: JSZip & FileSaver
- **Storage**: Browser IndexedDB API

---

## 📂 Project Structure

```text
number-extractor-pro/
├── index.html                  # HTML entry point with meta & typography
├── package.json                # Dependencies and build scripts
├── vite.config.ts              # Vite & Tailwind CSS v4 configuration
├── tsconfig.json               # TypeScript project references
├── tsconfig.app.json           # Application TypeScript options
├── public/                     # Static assets
└── src/
    ├── main.tsx                # React application entry
    ├── App.tsx                 # Root layout and view switcher
    ├── index.css               # Tailwind CSS v4 directives
    ├── types/
    │   └── index.ts            # ExtractedNumber, AppSettings, Session types
    ├── constants/
    │   └── countries.ts        # Flags, ISO codes, dial codes & names
    ├── utils/
    │   ├── phoneExtractor.ts   # Core extraction engine & OTP regex filters
    │   ├── fileParser.ts       # Excel (xlsx/xls), CSV & TXT chunked reader
    │   ├── exportUtils.ts      # TXT, CSV, Excel & Country ZIP generators
    │   ├── historyStorage.ts   # IndexedDB local session storage
    │   └── sampleData.ts       # Flex SMS Failed Report generator & exporter
    ├── context/
    │   └── AppContext.tsx      # Global React state & action handlers
    └── components/
        ├── Navbar.tsx          # Top bar with status & quick actions
        ├── Sidebar.tsx         # Responsive sidebar navigation
        ├── DashboardView.tsx   # Overview statistics & country charts
        ├── ExtractorView.tsx   # Drag & drop upload & progress bars
        ├── NumberTableView.tsx # Master data table with search & bulk copy
        ├── CountryView.tsx     # Dedicated country grid & country drawer
        ├── DuplicateView.tsx   # Duplicate detection, view & purge
        ├── ReviewView.tsx      # Quarantined ambiguous/OTP items
        ├── HistoryView.tsx     # Past session manager from IndexedDB
        ├── SettingsView.tsx    # Validation rules, formats & reset
        └── Toast.tsx           # Floating notifications
```

---

## 🚀 Installation & Local Development

### Prerequisites
- Node.js (v18.0.0 or higher recommended, tested on Node v24)
- npm or yarn

### 1. Clone or Open Project Directory
```bash
cd "c:\Users\mdkha\Desktop\Number Extractor"
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open your browser and navigate to the local URL (usually `http://localhost:5173`).

---

## 🏗️ Production Build

To build the optimized production assets:

```bash
npm run build
```

This compiles TypeScript and generates a minified, tree-shaken static bundle in the `dist/` directory.

To test the production build locally:

```bash
npm run preview
```

---

## 🌐 Deployment Instructions

### Option 1: Deploy on Vercel (Recommended)

1. **Via Vercel CLI**:
   ```bash
   npm install -g vercel
   vercel
   ```
2. **Via Git / GitHub**:
   - Push your repository to GitHub.
   - Go to [vercel.com](https://vercel.com) and click **"Add New Project"**.
   - Select your repository.
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Click **Deploy**.

### Option 2: Deploy on Netlify

1. Drag and drop the `dist/` folder into [app.netlify.com/drop](https://app.netlify.com/drop).
2. Or connect your repository with:
   - Build command: `npm run build`
   - Publish directory: `dist`

### Option 3: Deploy on a Linux VPS (Ubuntu / Debian + Nginx)

1. Build the production files:
   ```bash
   npm run build
   ```
2. Copy the contents of the `dist/` folder to your VPS web root:
   ```bash
   scp -r dist/* user@your-server-ip:/var/www/number-extractor/
   ```
3. Configure Nginx:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;

       root /var/www/number-extractor;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```
4. Reload Nginx:
   ```bash
   sudo systemctl reload nginx
   ```

---

## 🧪 Verification & Testing

The app includes built-in real-world SMS test data:

1. Click **"Load Sample Report"** on the Dashboard or Extractor screen.
2. The application will immediately parse a realistic Flex SMS Failed SMS Report containing:
   - **Oman (+968)** numbers
   - **Ivory Coast (+225)** numbers
   - **Uzbekistan (+998)** numbers
   - **Ukraine (+380)** numbers
   - **Israel (+972)** numbers
   - Multiple other nations (+218, +213, +375, +249, +254, +62, +261, +994, +996, +229, +241, +852, +1, +44, +880)
   - Real duplicates
   - Telegram demo OTP codes (`Telegram code: 82910`, `Your verification code is 49281`, etc.)
3. Verify that:
   - Numbers are grouped accurately by country.
   - Demo OTP codes are strictly rejected from phone number columns.
   - Duplicates are detected and flagged.
   - Downloading a TXT file produces clean numbers, one per line.
   - Downloading the Country ZIP Package extracts individual `.txt` files per country.

---

## 📄 License

MIT License. Designed and built for high-throughput telecom and SMS processing workflows.
