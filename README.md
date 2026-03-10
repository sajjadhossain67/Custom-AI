# NEXUS AI

A frontend-only AI-powered study and learning platform built with React and TypeScript. NEXUS AI connects directly to multiple AI providers using your own API keys — no backend, no proxy, no data leaves your browser except to the AI provider of your choice.

## Features

### AI Chat Hub

Multi-model chat with real-time streaming responses, AI memory across sessions, and swappable AI personas (Professor, Hacker, and more). Supports markdown and syntax-highlighted code blocks inline.

### Code Tutor

A live in-browser IDE with Socratic AI guidance and code review. Supports JavaScript, TypeScript, Python, Rust, Go, C++, SQL, Java, and Bash. Includes a curated challenge library (Beginner → Advanced) with hints and pair-programming mode.

### Exam Prep

Adaptive practice sessions for IELTS, GRE, GMAT, TOEFL, SAT, and LSAT. Includes a GRE vocabulary builder with spaced-repetition-style flashcards and AI-generated practice questions.

### Explore

Daily knowledge challenges, deep-dive topics, and a personal study streak tracker.

### Settings

Manage API keys for all providers, configure your default model and persona, and export or import all local data as JSON.

## Supported AI Models

| Provider  | Models                             |
| --------- | ---------------------------------- |
| OpenAI    | GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo |
| Anthropic | Claude 3.5 Sonnet, Claude 3 Haiku  |
| Google    | Gemini 1.5 Pro, Gemini 1.5 Flash   |
| Mistral   | Mixtral Large                      |

## Tech Stack

- **React 18** + **TypeScript**
- **React Router v6** — client-side routing
- **MUI (Material UI) v5** — component library
- **Emotion** — CSS-in-JS styling
- **Axios** — HTTP client
- **uuid** — unique ID generation
- All data (chat history, settings, API keys, exam progress) is persisted in **localStorage**

## Getting Started

### Prerequisites

- Node.js v16 or higher
- npm
- API key(s) from at least one supported AI provider

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/sajjadhossain67/Custom-AI.git
   cd Custom-AI
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm start
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

5. Navigate to **Settings** and enter your API key(s) for the provider(s) you want to use.

### Build for Production

```bash
npm run build
```

The optimized output will be in the `build/` directory.

## Project Structure

```
src/
├── components/
│   ├── NexusLayout/      # App shell — sidebar nav + layout wrapper
│   └── ProtectedRoute.tsx
├── pages/
│   ├── NexusDashboard.tsx   # Home — module cards, study streak, recent activity
│   ├── NexusChat.tsx        # AI Chat Hub
│   ├── NexusCodingTutor.tsx # Code Tutor IDE
│   ├── NexusExamPrep.tsx    # Exam Prep
│   ├── NexusExplore.tsx     # Explore / daily challenges
│   └── NexusSettings.tsx    # API keys, model & persona config, data management
├── utils/
│   ├── nexusAI.ts       # Multi-provider streaming AI utilities
│   └── nexusStorage.ts  # localStorage read/write helpers
└── shared/
    └── routes.tsx       # Route constants
```

## Development Workflow

### Creating a New Branch

```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

### Committing and Pushing

```bash
git add .
git commit -m "Short description of your change"
git push origin feature/your-feature-name
```

### Opening a Pull Request

1. Go to the repository on GitHub.
2. Click **Pull Requests** → **New Pull Request**.
3. Set base to `main` and compare to your feature branch.
4. Add a descriptive title and summary, then click **Create Pull Request**.
