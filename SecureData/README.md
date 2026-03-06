# SecureData – PII Data Sanitization Platform

SecureData is a **privacy-focused data sanitization platform** designed to detect and protect sensitive information in datasets before sharing or processing them. The system automatically identifies **Personally Identifiable Information (PII)** and applies sanitization techniques like **masking, redaction, and tokenization**.

This platform helps organizations **secure sensitive data and maintain compliance with privacy regulations**.

---

# Project Overview

SecureData allows administrators and users to securely upload datasets and automatically detect sensitive information such as:

- Email addresses
- Phone numbers
- PAN numbers
- Social security numbers
- Addresses
- Other personal identifiers

The platform then sanitizes the data to ensure it can be safely shared or analyzed.

---

# Key Features

## Role-Based Access Control

Two user roles are supported:

### Admin

- Full access to system features
- Manage users
- Upload and process files
- View raw and sanitized data
- Monitor audit logs
- Access system settings

### Standard User

- Upload files for sanitization
- View sanitized results
- Access personal dashboard

---

# File Upload & Processing

Users can upload datasets in multiple formats.

Supported formats include:

- SQL
- CSV
- JSON
- PDF
- DOCX
- TXT
- PNG
- JPG

The system automatically scans uploaded files for sensitive data.

---

# PII Detection

SecureData uses intelligent pattern detection techniques to identify:

- Email addresses
- Phone numbers
- PAN numbers
- SSN numbers
- Addresses

Detected information is highlighted and prepared for sanitization.

---

# Data Sanitization Methods

The platform supports multiple sanitization techniques:

## Masking

Partially hides sensitive information.

Example:
john.doe@email.com
 → j***@email.com

## Redaction

Completely removes sensitive data.

Example:

PAN: ABCDE1234F → [REDACTED]

## Tokenization

Replaces sensitive data with unique tokens.

Example:

SSN: 123-45-6789 → TOKEN_A7X9K

---

# Data Viewer

The system provides a **side-by-side comparison** of:

- Raw data
- Sanitized data

View modes include:

- Text view
- Table view
- JSON view

This allows administrators to easily verify sanitization results.

---

# Dashboard & Analytics

The admin dashboard provides insights such as:

- Total uploaded files
- PII detected
- Active users
- Sanitized downloads

Recent activity and processing pipeline status are also displayed.

---

# Audit Logging

All important actions are tracked in the system, including:

- User logins
- File uploads
- File downloads
- PII detection events

This helps maintain **security transparency and compliance**.

---

# Technology Stack

## Frontend Framework

- React.js
- TypeScript

## UI & Styling

- Tailwind CSS
- Lucide Icons
- ShadCN UI Components

## Routing

- React Router

## State Management

- React Context API

## Data Fetching

- React Query

## Development Tools

- Vite

---

# Authentication

The system uses **role-based authentication**.

## Demo Credentials

### Admin

Username: admin1
Password: secure@123

### User

Username: john_doe
Password: secure@123

---

# Installation & Setup

Install dependencies:
npm install

Run the development server:
npm run dev

---

# Future Improvements

Possible enhancements include:

- AI-based privacy risk analysis
- Real-time PII detection using NLP models
- File encryption for uploaded datasets
- Advanced analytics and reporting
- Integration with cloud storage services
- Support for additional file formats

---

# Use Cases

SecureData can be used in various industries including:

- Healthcare data anonymization
- Financial record sanitization
- Research dataset sharing
- Compliance with privacy regulations
- Data preprocessing for machine learning

---

# License

This project is intended for **educational and research purposes**.
