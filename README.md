# WorldScope — AI-Powered Global Intelligence Platform

![WorldScope](https://img.shields.io/badge/WorldScope-v1.0.0-6366f1?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-10b981?style=for-the-badge)
![Node](https://img.shields.io/badge/node-18%2B-339933?style=for-the-badge)

WorldScope is a full-stack AI-powered global information platform that allows users to explore any country and discover its latest news, technology trends, emerging industries, startup activity, and research developments.

## ✨ Features

- **🌍 Country Explorer** — Browse 250+ countries with metadata, flags, and economic indicators
- **📰 News Aggregation** — Real-time global news from GDELT with category filtering
- **💡 Technology Trends** — Track emerging tech via GitHub trending and tech news
- **🚀 Startups & Innovation** — Startup ecosystem activity derived from news sources
- **🔬 Research & Development** — Academic papers from Crossref
- **🤖 AI Summaries** — OpenAI-powered country intelligence summaries
- **⚖️ Country Comparison** — Compare 2-5 countries across economic indicators
- **🔍 Global Search** — Search across countries, news, technologies, and research
- **📊 Visualizations** — Interactive charts (Recharts) for indicators and distributions
- **🌙 Dark Mode** — Full dark/light theme support
- **📱 Responsive** — Works on desktop, tablet, and mobile

## 🏗️ Architecture

```
WorldScope/
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── api/         # Axios API client
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # React Context (theme)
│   │   ├── hooks/       # Custom hooks (useFetch, useDebounce)
│   │   ├── pages/       # Page components (11 pages)
│   │   └── App.jsx      # Root with React Router
│   └── vite.config.js
│
├── server/          # Node.js + Express backend
│   ├── config/      # Database & env configuration
│   ├── controllers/ # Route handlers
│   ├── middleware/   # CORS, rate limiting, validation, error handling
│   ├── models/      # Mongoose schemas (7 models)
│   ├── routes/      # API route definitions
│   ├── services/    # Business logic (7 services)
│   └── server.js    # Express entry point
│
├── .env.example     # Environment variable template
├── .gitignore
├── package.json     # Root workspace scripts
└── README.md
```

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, React Router 6, Recharts, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose (with in-memory fallback) |
| AI | OpenAI GPT-4o-mini |
| Styling | Modular CSS with CSS custom properties |
| Testing | Jest + Vitest |

## 📡 Data Sources

| Source | Data | API Key Required |
|--------|------|:---:|
| [REST Countries](https://restcountries.com/) | Country metadata | ❌ |
| [World Bank](https://data.worldbank.org/) | Economic indicators | ❌ |
| [GDELT Project](https://www.gdeltproject.org/) | Global news | ❌ |
| [GitHub API](https://docs.github.com/rest) | Tech trends | ❌ (optional) |
| [Crossref](https://www.crossref.org/) | Research papers | ❌ |
| [GNews](https://gnews.io/) | News (secondary) | ✅ (free tier) |
| [OpenAI](https://openai.com/) | AI summaries | ✅ |

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **npm** 9+
- **MongoDB** (optional — app uses in-memory DB by default)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd "World Scope"

# Install all dependencies
npm run install:all
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your API keys (all optional)
```

### Running in Development

```bash
# Start both frontend and backend concurrently
npm run dev

# Or start them separately:
npm run dev:server    # Backend on http://localhost:5000
npm run dev:client    # Frontend on http://localhost:5173
```

### Production Build

```bash
npm run build         # Build frontend
npm start             # Start production server
```

## 🔧 Environment Variables

| Variable | Required | Default | Description |
|----------|:--------:|---------|-------------|
| `PORT` | ❌ | `5000` | Server port |
| `MONGODB_URI` | ❌ | In-memory | MongoDB connection string |
| `OPENAI_API_KEY` | ❌ | — | OpenAI API key for AI summaries |
| `GNEWS_API_KEY` | ❌ | — | GNews API key (secondary news source) |
| `GITHUB_TOKEN` | ❌ | — | GitHub token (increases rate limit) |
| `DEMO_MODE` | ❌ | `false` | Force demo data for all sources |

> **Note:** The app works without any API keys. GDELT, REST Countries, World Bank, and Crossref are all free and keyless.

## 📚 API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/countries` | List all countries |
| GET | `/api/countries/:code` | Get country by code |
| GET | `/api/countries/:code/indicators` | World Bank indicators |
| GET | `/api/countries/compare?codes=US,IN,GB` | Compare countries |
| GET | `/api/news` | Global news |
| GET | `/api/news/:code` | Country news |
| GET | `/api/technology` | Global tech trends |
| GET | `/api/technology/:code` | Country tech |
| GET | `/api/startups` | Global startups |
| GET | `/api/research` | Global research |
| GET | `/api/summary/:code` | AI country summary |
| GET | `/api/search?q=query` | Global search |
| GET | `/api/health` | Health check |

## 🧪 Testing

```bash
# Backend tests
cd server && npm test

# Frontend tests  
cd client && npm test
```

## 🎭 Demo Mode

The app runs fully without API keys:
- Country data comes from REST Countries (free)
- News comes from GDELT (free)
- Research comes from Crossref (free)
- Tech trends come from GitHub (free)
- AI summaries use extractive fallback
- Set `DEMO_MODE=true` to force demo data everywhere

## 📄 License

MIT
