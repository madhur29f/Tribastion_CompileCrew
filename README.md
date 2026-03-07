# SecureData – PII Data Sanitization Platform

SecureData is a **privacy-focused data sanitization platform** designed to detect and protect sensitive information in datasets before sharing or processing them. The system automatically identifies **Personally Identifiable Information (PII)** and applies sanitization techniques like **masking, redaction, and tokenization**.

This platform helps organizations **secure sensitive data and maintain compliance with privacy regulations**.

---

## 🏗 Project Architecture

The project follows a decoupled client-server architecture:

- **Frontend (`/SecureData`)**: A modern, responsive React application built with TypeScript, Vite, Tailwind CSS, and ShadCN UI components. State management and data fetching are efficiently handled using React Query.
- **Backend (`/backend`)**: A fast, robust REST API built in Python with FastAPI. It uses Microsoft Presidio for advanced PII detection, SQLAlchemy for ORM, and Supabase (PostgreSQL) as its primary database. It also handles advanced file parsing (PDFs, DOCX, etc.).

---

## ✨ Key Features

### Role-Based Access Control
- **Admin**: Full access to system features. Manage users, upload/process files, view raw/sanitized data, monitor audit logs, access system settings.
- **Standard User**: Upload files for sanitization, view sanitized results, access a personal dashboard.

### Comprehensive File Upload & Processing
Supports parsing and sanitizing multiple formats: SQL, CSV, JSON, PDF, DOCX, TXT, PNG, JPG (via EasyOCR).

### Intelligent PII Detection & Sanitization
Detects Email Addresses, Phone Numbers, PAN, SSN, Physical Addresses, etc.
- **Masking:** Partially hides sensitive information (e.g., `john.doe@email.com` → `j***@email.com`).
- **Redaction:** Completely removes sensitive data (e.g., `PAN: ABCDE1234F` → `[REDACTED]`).
- **Tokenization:** Replaces with unique tokens (e.g., `SSN: 123-45-6789` → `TOKEN_A7X9K`).

### Advanced Data Viewer & Analytics
- Side-by-side comparison of Raw and Sanitized data in text, table, or JSON formats.
- Comprehensive admin dashboard tracking file uploads, PII metrics, and active users.
- Full audit logging for security compliance.

---

## 🛠 Technology Stack

**Frontend:** React 18, TypeScript, Vite, React Router, React Query, Tailwind CSS, Framer Motion, Shadcn UI
**Backend:** FastAPI, Uvicorn, SQLAlchemy, Supabase, Presidio, PyMuPDF, python-docx, EasyOCR, JWT, bcrypt

---

## 🚀 Running the Project Locally

Follow these steps to get the full application running on your local machine.

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)
- [Python](https://www.python.org/downloads/) (v3.10 or higher)
- A Supabase / PostgreSQL database instance

### 1. Backend Setup (FastAPI Server)

1. Open your terminal and navigate to the backend directory:
   ```bash
   cd d:/nirma/Tribastion_CompileCrew/backend
   ```
2. Create and activate a Python virtual environment (recommended):
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS/Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure your Environment Variables:
   Create a `.env` file in the `/backend` directory matching the required variables configuration (e.g., `SUPABASE_DB_URL`, `JWT_SECRET`).
5. Run the backend development server using Uvicorn:
   ```bash
   uvicorn main:app --reload
   ```
   *The API will be running at `http://localhost:8000` (Visit `http://localhost:8000/docs` to see the interactive API documentation).*

### 2. Frontend Setup (React App)

1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd d:/nirma/Tribastion_CompileCrew/SecureData
   ```
2. Install the necessary Node dependencies using npm (or pnpm/yarn):
   ```bash
   npm install
   ```
   *(Note: The project is configured with `pnpm` under the hood, but `npm install` works natively).*
3. Run the Vite development server:
   ```bash
   npm run dev
   ```
   *The web application will be accessible at `http://localhost:5173`.*

---

## 🔑 Demo Credentials

Once the server is running and database seed is applied (typically via `backend/seed.py`), you can use the following default access accounts:

**Admin:**
- Username: `admin1`
- Password: `secure@123`

**Standard User:**
- Username: `john_doe`
- Password: `secure@123`

---

## 🔮 Future Improvements
- AI-based privacy risk analysis and NLP models for real-time PII detection.
- File encryption for uploaded enterprise datasets.
- More robust integration with cloud-native storage like AWS S3 or Azure Blob.

## 📄 License
This platform is intended for educational, regulatory compliance, and research-focused software purposes.
