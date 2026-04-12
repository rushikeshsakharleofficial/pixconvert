# PixConvert - Project Overview & Instructions

PixConvert is a free, privacy-focused, and open-source file conversion and PDF manipulation tool. It is designed to be highly portable, scalable, and secure, leveraging a multi-tier architecture with a React frontend and an Express backend.

## 🏗️ Architecture

- **Frontend (SPA)**: Built with **React 19** and **Vite**. Most file processing and conversions (especially PDF and OCR) are performed **client-side** to ensure user privacy and reduce server load.
- **Backend (API)**: A **Node.js/Express** server that handles:
  - Temporary file uploads for multi-file operations.
  - Contact form processing via SMTP.
  - Automated cleanup of uploaded files (7-day retention).
  - Serving the production frontend build.
- **Infrastructure**:
  - **Docker**: Multi-stage `Dockerfile` for optimized production images.
  - **Scaling**: `docker-compose` setup with **Nginx** as a reverse proxy.
  - **Autoscaler**: A custom Node.js script (`scripts/docker-autoscale.mjs`) monitors CPU/RAM and scales the `app` service replicas dynamically.

## 🛠️ Key Technologies

### Frontend
- **Framework**: React 19, React Router 7.
- **Styling**: Tailwind CSS, Framer Motion, Lucide Icons.
- **PDF Core**: `pdf-lib`, `pdfjs-dist`.
- **OCR**: `tesseract.js`.
- **Media**: `heic2any`, `gif.js`, `html2canvas`.
- **Office/Docs**: `xlsx`, `docx`, `mammoth`, `pptxgenjs`.

### Backend
- **Server**: Express 5.
- **Uploads**: Multer (disk storage in `./uploads`).
- **Email**: Nodemailer.
- **Headless Browser**: Playwright (used for HTML to PDF conversion).
- **Security**: `express-rate-limit`, CORS origin white-listing, and path traversal protection.

## 🚀 Building and Running

### Development
- **Frontend**: `npm run dev` (starts Vite on port 5173).
- **Backend**: `npm run server` (starts Express on port 4000).
- **Full Stack**: You typically need both running for features like uploads and contact forms.

### Production (Docker)
1. Copy `.env.example` to `.env`.
2. Start the stack: `docker compose up --build -d`.
3. (Optional) Start autoscaler: `npm run autoscale:docker`.

### Linting
- `npm run lint`: Runs ESLint across the project.

## 📂 Project Structure

- `src/components/`: Core UI components for various tools (PDF merging, splitting, OCR, etc.).
- `src/utils/`: Shared logic for file handling, PDF manipulation, and format conversions.
- `src/data/toolsData.js`: Central configuration for all tools displayed in the UI.
- `server.js`: The entry point for the Express backend.
- `scripts/`: Infrastructure-related scripts like the Docker autoscaler.
- `docs/superpowers/`: Project-specific plans and specifications.

## 📏 Development Conventions

- **Privacy First**: Prefer client-side processing using `pdf-lib` or `tesseract.js` whenever possible.
- **Surgical Tooling**: Most conversion logic is encapsulated within specific components in `src/components/`.
- **Styling**: Adhere to the established **Tailwind CSS** patterns. Use components from `src/components/ui/` (shadcn-inspired) for consistency.
- **File Retention**: Uploaded files in the `uploads/` directory are transient and purged after 7 days by the backend's cleanup task.
