# PixConvert — Every tool you need for PDFs & Images

PixConvert is a free, privacy-focused, and open-source file conversion ecosystem. It enables users to convert, merge, protect, and edit files entirely in the browser, ensuring no data ever leaves the local environment.

## ✨ Latest Features

### 1. Interactive "How It Works" Timeline
A custom-built, drag-based timeline that guides users through the simple 3-step process. Features fluid animations and real-time step previews.

**Visualizing the Process:**
![Timeline Sequence](./docs/screenshots/timeline-step-1.png)
*(Interactive drag-to-explore interface)*

| Dark Mode | Light Mode |
| :---: | :---: |
| ![Home Timeline Dark](./docs/screenshots/home-timeline-dark.png) | ![Home Timeline Light](./docs/screenshots/home-timeline-light.png) |

### 2. Real-time Analytics Dashboard
Powered by Server-Sent Events (SSE), the dashboard provides live metrics on file processing trends. Features high-performance **Glowing Line Charts** and **Animated Donut Charts**.

![Analytics Final](./docs/screenshots/analytics-final-dark.png)
*(Full analytics suite with live SSE updates)*

### 3. Animated "Ghost" 404 Page
A high-quality, animated 404 error page featuring a floating ghost mascot and an interactive **FlowButton** for quick redirection back to shelter.

![404 Page](./docs/screenshots/404-dark.png)

### 4. Collapsible Smart Dropdown
A compact, organized navigation system that categorizes 40+ tools into collapsible sections, making it effortless to find the exact tool you need.

![Tools Dropdown](./docs/screenshots/dropdown-dark.png)

---

## 🎨 Dual-Theme Interface
The entire application is built with a responsive, high-performance UI that supports seamless switching between professional Dark mode and clean Light mode.

### Home Page
![Home Page Dark](./docs/screenshots/home-dark.png)
*Professional dark theme with vibrant accent colors.*

![Home Page Light](./docs/screenshots/home-light.png)
*Clean, high-contrast light theme for optimal readability.*

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TailwindCSS, Framer Motion (for high-end animations).
- **Charts**: Recharts with custom SVG filters.
- **Backend**: Node.js, Express 5.
- **Real-time**: Server-Sent Events (SSE) for live metric streaming.
- **Persistence**: Atomic JSON-based local storage with automatic 2-year data purging.
- **DevOps**: Docker, Nginx (Load Balancing), and custom Auto-scaling scripts.

---

## 🚀 Docker & Infrastructure

The repo includes a portable production container setup:

- `Dockerfile`: Multi-stage build for frontend and Express server.
- `docker-compose.yml`: Full stack with Nginx edge and persistent volumes for metrics.
- `nginx.scaling.conf`: Reverse proxy configured for SSE support and load balancing.

### Quick Start (Local)

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Start development server**:
   ```bash
   npm run dev
   ```
3. **Start backend**:
   ```bash
   npm run server
   ```

---

## 🔒 Privacy First
- **Local Processing**: Heavy file operations (PDF merging, Image conversion) happen in-browser via Web Workers.
- **Zero Tracking**: No user-identifiable data is collected. Analytics only track tool usage counts and timestamps.
- **Open Source**: Audit the code yourself.
