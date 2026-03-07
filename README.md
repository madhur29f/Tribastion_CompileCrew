# SecureData – PII Data Sanitization & DPDP Compliance Platform

SecureData is a **privacy-focused data sanitization platform** that detects and protects sensitive information in datasets before sharing or processing. It automatically identifies **Personally Identifiable Information (PII)** and applies **masking, redaction, and tokenization**, with full compliance features for the **Digital Personal Data Protection (DPDP) Act(VirusTotal Support, SHA-256 Hashing)**. It is compliant with the following formats: SQL, JSON, CSV, TXT, PDF, DOCX, PNG, JPG.

## Sample Application Screenshots - Video Covers entire Platform in Detail (Installation Instructions are below)
1) Sanitize CSV
<img width="2128" height="831" alt="image" src="https://github.com/user-attachments/assets/4107526a-043b-451f-9693-7996b04ec04e" />

2) Sanitize Image
<img width="2101" height="945" alt="image" src="https://github.com/user-attachments/assets/9faedbaf-516b-4df7-b617-972b733b6168" />

3) SIEM-Compatible Audit Logs
<img width="2559" height="1233" alt="image" src="https://github.com/user-attachments/assets/568d277c-fbdd-4543-a6d6-f1d85e60ca98" />


---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Installation & Setup](#installation--setup)
   - [1. Clone the Repository](#1-clone-the-repository)
   - [2. Backend Setup (FastAPI)](#2-backend-setup-fastapi)
   - [3. Frontend Setup (Vite + React)](#3-frontend-setup-vite--react)
4. [Environment Variables](#environment-variables)
5. [Running the Application](#running-the-application)
6. [Demo Credentials](#demo-credentials)
7. [Key Features](#key-features)
8. [Redaction Pipeline](#redaction-pipeline)
9. [Supported File Formats](#supported-file-formats)
10. [Technology Stack](#technology-stack)
11. [API Overview](#api-overview)
12. [Troubleshooting](#troubleshooting)
13. [License](#license)

---

## Prerequisites

Ensure the following are installed on your system before proceeding:

| Tool        | Minimum Version | Download Link                                       |
| ----------- | --------------- | --------------------------------------------------- |
| **Python**  | 3.10+           | [python.org](https://www.python.org/downloads/)     |
| **Node.js** | 18+             | [nodejs.org](https://nodejs.org/)                   |
| **npm**     | 9+ (bundled)    | Installed with Node.js                              |
| **Git**     | Any recent      | [git-scm.com](https://git-scm.com/)                |

> **Note:** The backend uses SQLite by default — no external database installation is required. PostgreSQL (via Supabase) is optional.

---

## Project Structure

```
Tribastion_CompileCrew/
├── backend/                  # FastAPI backend (Python)
│   ├── main.py               # Application entry point
│   ├── config.py             # Environment configuration
│   ├── database.py           # Database engine (SQLite / PostgreSQL)
│   ├── models.py             # SQLAlchemy ORM models
│   ├── auth.py               # Password hashing & JWT utilities
│   ├── seed.py               # Seed script for demo users
│   ├── siem_logger.py        # SIEM-compatible audit logging
│   ├── requirements.txt      # Python dependencies
│   ├── .env                  # Backend environment variables
│   ├── routers/              # API route handlers
│   │   ├── auth_router.py
│   │   ├── users_router.py
│   │   ├── files_router.py
│   │   ├── logs_router.py
│   │   └── stats_router.py
│   └── services/             # Business logic services
│       ├── pii_engine.py     # PII detection & sanitization engine
│       ├── virustotal_client.py  # VirusTotal hash-based scanning
│       └── cdr_service.py    # Content Disarm & Reconstruction
│
├── SecureData/               # Vite + React frontend (TypeScript)
│   ├── index.html            # HTML entry point
│   ├── package.json          # Node.js dependencies & scripts
│   ├── vite.config.ts        # Vite dev server config (proxy to backend)
│   ├── tailwind.config.ts    # Tailwind CSS configuration
│   ├── tsconfig.json         # TypeScript configuration
│   ├── .env                  # Frontend environment variables
│   └── client/               # React source code
│       ├── App.tsx
│       ├── pages/            # Page components
│       ├── components/       # Reusable UI components
│       └── lib/              # Utilities, API client, auth context
│
└── .gitignore
```

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/madhur29f/Tribastion_CompileCrew.git
cd Tribastion_CompileCrew
```

---

### 2. Backend Setup (FastAPI)

#### a) Create a Python virtual environment

**Windows (PowerShell):**
```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

**macOS / Linux:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
```

#### b) Install Python dependencies

```bash
pip install -r requirements.txt
```

#### c) Download the spaCy language model

The PII detection engine (Presidio) requires a spaCy NLP model:

```bash
python -m spacy download en_core_web_lg
```

#### d) Configure environment variables

Create or verify the `.env` file inside `backend/`:

```env
# JWT Configuration
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# File Storage (local directory)
LOCAL_UPLOAD_DIR=uploads

# VirusTotal API (optional — hash-check only, never uploads files)
VIRUSTOTAL_API_KEY=your-virustotal-api-key

# Zero-Trust file quarantine directories
QUARANTINE_DIR=uploads/quarantine
CLEAN_DIR=uploads/clean

# Supabase PostgreSQL (optional — falls back to SQLite if omitted)
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_KEY=your-anon-key
# SUPABASE_DB_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

> **Tip:** If you omit `SUPABASE_DB_URL`, the backend automatically uses a local SQLite database (`backend/data/securedata.db`) — no additional setup needed.

#### e) Seed demo users

Run the seed script to create default Admin and Standard user accounts:

```bash
python seed.py
```

This creates:

| Username   | Email                    | Role     | Password     |
| ---------- | ------------------------ | -------- | ------------ |
| `admin1`   | admin@securedata.com     | Admin    | `secure@123` |
| `john_doe` | john@securedata.com      | Standard | `secure@123` |

---

### 3. Frontend Setup (Vite + React)

#### a) Install Node.js dependencies

Open a **new terminal** (keep the backend terminal open):

```bash
cd SecureData
npm install
```

> **Note:** The project specifies `pnpm` as the package manager. If you have `pnpm` installed, you can use `pnpm install` instead.

#### b) Frontend environment variables

The frontend `.env` file is pre-configured. No changes are typically needed.

The Vite dev server is pre-configured to proxy `/api` requests to `http://localhost:8000` (the backend), so the frontend and backend communicate seamlessly during development.

---

## Running the Application

You need **two terminals** running simultaneously:

### Terminal 1 — Start the Backend

```bash
cd backend
.\venv\Scripts\Activate.ps1   # Windows
# source venv/bin/activate    # macOS/Linux

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The backend starts at: **http://localhost:8000**

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Database tables created/verified successfully.
INFO:     Storage directory ensured: uploads
```

### Terminal 2 — Start the Frontend

```bash
cd SecureData
npm run dev
```

The frontend starts at: **http://localhost:8080**

### Open the Application

Navigate to **http://localhost:8080** in your browser.

---

## Demo Credentials

| Role     | Username   | Password     |
| -------- | ---------- | ------------ |
| Admin    | `admin1`   | `secure@123` |
| Standard | `john_doe` | `secure@123` |

> **Note:** Make sure you have run `python seed.py` in the backend directory before logging in.

---

## Key Features

## Data Flow Diagram
<img width="1226" height="675" alt="image" src="https://github.com/user-attachments/assets/49ea4e00-2458-4c60-aaf8-91be3ddff7c3" />

## Architecture
<img width="845" height="708" alt="image" src="https://github.com/user-attachments/assets/fbf3c863-edd0-4c72-8aad-76466d980bb1" />

### PII Detection & Sanitization
- Automated PII detection using Microsoft Presidio NLP engine
- Supports **masking**, **redaction**, and **tokenization**
- Side-by-side raw vs. sanitized data comparison viewer

### DPDP Act Compliance
- **Granular consent management** with cryptographic audit trail (SHA-256 hashed)
- **Right to be Forgotten** — automated data erasure pipeline with Certificate of Deletion
- PII risk scoring and data classification tiers

### Zero-Trust File Security
- **VirusTotal integration** — hash-based file scanning (privacy-first, no file upload)
- **Content Disarm & Reconstruction (CDR)** for PDF and DOCX files
- File quarantine and clean workflow

### SIEM-Compatible Audit Logging
- All actions logged: logins, uploads, downloads, PII detection events
- Exportable SIEM-compatible audit logs
- Tamper-proof consent audit trail

### Role-Based Access Control
- **Admin**: Full system access, user management, raw data viewing, audit logs
- **Standard User**: Upload files, view sanitized results, manage consent preferences

---
## Redaction Pipeline
<img width="2076" height="1163" alt="image" src="https://github.com/user-attachments/assets/1bc2e43d-998b-4529-a0ad-3d7dc148db04" />


## Supported File Formats

| Format | Extensions       |
| ------ | ---------------- |
| Text   | `.txt`           |
| CSV    | `.csv`           |
| JSON   | `.json`          |
| SQL    | `.sql`           |
| PDF    | `.pdf`           |
| Word   | `.docx`          |
| Images | `.png`, `.jpg`   |

---

## Technology Stack

### Backend
| Component          | Technology                           |
| ------------------ | ------------------------------------ |
| Framework          | FastAPI (Python)                     |
| Database ORM       | SQLAlchemy                           |
| Database           | SQLite (default) / PostgreSQL        |
| Authentication     | JWT (python-jose) + bcrypt           |
| PII Detection      | Microsoft Presidio + spaCy           |
| PDF Processing     | PyMuPDF (fitz)                       |
| DOCX Processing    | python-docx                          |
| Image OCR          | EasyOCR                              |
| File Scanning      | VirusTotal API (httpx)               |
| CDR                | pikepdf + Pillow                     |

### Frontend
| Component          | Technology                           |
| ------------------ | ------------------------------------ |
| Framework          | React 18 + TypeScript                |
| Build Tool         | Vite                                 |
| Styling            | Tailwind CSS                         |
| UI Components      | shadcn/ui + Radix UI                 |
| Icons              | Lucide React                         |
| Animations         | Framer Motion                        |
| Routing            | React Router v6                      |
| Data Fetching      | Axios + React Query                  |
| Charts             | Recharts                             |

<img width="1024" height="559" alt="image" src="https://github.com/user-attachments/assets/70475b64-9478-4550-ac7b-65957c66171a" />


---

## API Overview

All API endpoints are mounted under `/api`. Key routes:

| Method | Endpoint                     | Description                         |
| ------ | ---------------------------- | ----------------------------------- |
| POST   | `/api/auth/login`            | User login (returns JWT)            |
| POST   | `/api/auth/register`         | User registration                   |
| GET    | `/api/users/`                | List users (Admin only)             |
| GET    | `/api/users/me`              | Current user profile                |
| POST   | `/api/files/upload`          | Upload file for PII processing      |
| GET    | `/api/files/`                | List uploaded files                 |
| GET    | `/api/files/{id}/download`   | Download sanitized file             |
| GET    | `/api/logs/`                 | Audit logs                          |
| GET    | `/api/stats/`                | Dashboard statistics                |
| GET    | `/api/users/me/consent`      | Get DPDP consent preferences        |
| PUT    | `/api/users/me/consent`      | Update consent preferences          |
| DELETE | `/api/users/me/forget`       | Right to be Forgotten erasure       |

Full interactive API docs are available at **http://localhost:8000/docs** (Swagger UI) when the backend is running.



---

## Troubleshooting

### Backend won't start
- **`ModuleNotFoundError`**: Make sure your virtual environment is activated and you ran `pip install -r requirements.txt`.
- **Presidio errors**: Ensure you downloaded the spaCy model: `python -m spacy download en_core_web_lg`.
- **Port 8000 in use**: Kill the process using port 8000 or change the port: `uvicorn main:app --port 8001`.

### Frontend won't start
- **`npm install` errors**: Delete `node_modules` and `package-lock.json`, then run `npm install` again.
- **Port 8080 in use**: Vite will automatically try the next available port.

### Login fails with "Incorrect email or password"
- Ensure you ran `python seed.py` in the backend directory to create demo users.
- Verify the backend is running and accessible at `http://localhost:8000/api/ping`.

### API requests return 404 or network errors
- Ensure both backend (port 8000) and frontend (port 8080) are running simultaneously.
- The Vite proxy forwards `/api` requests to `http://localhost:8000`. If the backend port changes, update `vite.config.ts`.

### Database reset
To start fresh, delete the SQLite database and re-seed:
```bash
cd backend
del data\securedata.db    # Windows
# rm data/securedata.db   # macOS/Linux
python seed.py
```

---

## License

This project is intended for **educational and research purposes**.
