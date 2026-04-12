# PixConvert API Documentation

This document provides technical details for interacting with the PixConvert backend API using automation tools (Curl, Postman, Python, etc.).

> **Note on Processing**: PixConvert is designed as a "Privacy First" application. Most heavy file processing (PDF merging, Image conversion, OCR) occurs **client-side** in the browser using Web Workers. The server primarily handles transient file storage and analytics.

---

## 🔐 Base URL & Headers

- **Base URL**: `http://localhost:4000` (Local) or your production domain.
- **Content-Type**: `application/json` (unless uploading files)

---

## 📁 File Management API

### 1. Upload Files
Upload one or more files to the server's temporary storage.

- **Endpoint**: `POST /api/upload`
- **Body**: `multipart/form-data`
- **Field Name**: `files`

**Example (Curl):**
```bash
curl -X POST -F "files=@/path/to/your/document.pdf" http://localhost:4000/api/upload
```

**Response:**
```json
{
  "ok": true,
  "files": [
    {
      "id": "1712966400000_document.pdf",
      "url": "/uploads/1712966400000_document.pdf",
      "name": "document.pdf",
      "size": 45231
    }
  ]
}
```

### 2. List Uploaded Files (Admin)
Retrieve a list of all files currently in the temporary storage.

- **Endpoint**: `GET /api/files`
- **Headers**: 
  - `x-admin-key`: Your secret admin key (defined in `.env`)

**Example (Curl):**
```bash
curl -H "x-admin-key: your_secret_key" http://localhost:4000/api/files
```

### 3. Delete a File (Admin)
Remove a specific file from the server.

- **Endpoint**: `DELETE /api/files/:id`
- **Headers**: 
  - `x-admin-key`: Your secret admin key

**Example (Curl):**
```bash
curl -X DELETE -H "x-admin-key: your_secret_key" http://localhost:4000/api/files/1712966400000_document.pdf
```

---

## 📊 Analytics API

### 1. Track Tool Usage
Record the processing of files for a specific tool.

- **Endpoint**: `POST /api/metrics/track`
- **Body**:
```json
{
  "tool": "merge-pdf",
  "count": 5
}
```

**Example (Curl):**
```bash
curl -X POST -H "Content-Type: application/json" \
     -d '{"tool": "merge-pdf", "count": 1}' \
     http://localhost:4000/api/metrics/track
```

### 2. Get Real-time Stats
Retrieve aggregated usage statistics.

- **Endpoint**: `GET /api/metrics/stats`
- **Query Params**:
  - `period`: `daily` | `weekly` | `monthly` | `yearly` (default: `monthly`)

**Example (Curl):**
```bash
curl http://localhost:4000/api/metrics/stats?period=weekly
```

---

## ✉️ Contact API

### Send Contact Message
Programmatically send a message to the site administrator.

- **Endpoint**: `POST /api/contact`
- **Body**:
```json
{
  "name": "Automation Tool",
  "email": "bot@example.com",
  "subject": "System Alert",
  "message": "Files processed successfully."
}
```

---

## 🛡️ Rate Limits
- **General API**: 100 requests per 15 minutes.
- **Uploads**: 20 requests per 15 minutes.
- **Contact**: 5 requests per hour.
