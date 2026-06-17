# COMPASS — AI Assistant Reference

**COMPASS** (Cognitive & Mental Processing Advisory Support System) is a full-stack mental health chatbot with emotion detection, CBT exercises, and empathetic responses. This document is the primary reference for AI assistants working in this codebase.

---

## Repository Structure

```
/
├── app/                      # Next.js App Router
│   ├── layout.tsx            # Root layout (ThemeProvider, metadata)
│   ├── page.tsx              # Main chat page
│   └── globals.css           # Tailwind + CSS custom properties
├── components/
│   ├── chat/                 # Chat feature components (barrel: index.ts)
│   │   ├── chat-interface.tsx
│   │   ├── chat-area.tsx
│   │   ├── chat-message.tsx
│   │   ├── chat-input.tsx
│   │   ├── chat-header.tsx
│   │   ├── chat-welcome.tsx
│   │   ├── conversation-sidebar.tsx
│   │   └── crisis-resources-dialog.tsx
│   └── ui/                   # shadcn/ui primitives (~54 components)
├── hooks/
│   ├── use-chat.ts           # Central state management (all chat logic lives here)
│   ├── use-local-storage.ts  # SSR-safe localStorage wrapper
│   └── use-mobile.ts         # Responsive breakpoint hook
├── lib/
│   ├── types.ts              # TypeScript interfaces (Message, Conversation, etc.)
│   ├── constants.ts          # CRISIS_RESOURCES, LANGUAGES, QUICK_ACTIONS
│   └── utils.ts              # Utility functions (cn helper, etc.)
├── public/                   # Static assets
├── backend/                  # Flask NLP service (independent Python project)
│   ├── app.py                # Entry point: 4 routes + startup
│   ├── config/settings.py    # All config from env vars (dataclass)
│   ├── middleware/
│   │   ├── input_validator.py  # Sanitization, length checks
│   │   └── rate_limiter.py     # Redis sliding-window rate limit
│   ├── models/
│   │   └── emotion_classifier.py  # DistilBERT wrapper (ONNX + PyTorch)
│   ├── services/
│   │   ├── nlp_pipeline.py       # Main orchestrator
│   │   ├── dialogue_manager.py   # Session state + CBT flows + crisis detection
│   │   ├── llm_service.py        # Groq LLM integration (llama-3.1-8b)
│   │   └── preprocessor.py       # Text normalization (stateless)
│   ├── utils/
│   │   ├── logger.py             # Structured JSON logging to stdout
│   │   └── redis_pool.py         # Shared connection pool singleton
│   ├── tests/                    # unittest with heavy mocking
│   ├── train.py                  # DistilBERT fine-tuning script
│   ├── convert_to_onnx.py        # ONNX export/quantization
│   ├── requirements.txt          # Python dependencies
│   └── render.yaml               # Render.io deployment config
├── .github/workflows/
│   └── keep-warm.yml             # Pings backend every 10min (prevents Render sleep)
├── vercel.json                   # Vercel deployment config
├── package.json                  # Frontend dependencies + scripts
└── .env.example                  # Frontend env template
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript 5 |
| Styling | Tailwind CSS v4, shadcn/ui (Radix Lyra), Lucide icons |
| Theming | next-themes (light/dark/system) |
| Backend | Flask 3, Gunicorn (2 workers), Flask-CORS |
| Emotion ML | DistilBERT fine-tuned, ONNX Runtime (primary), PyTorch CPU (fallback) |
| NLP | spaCy (`en_core_web_sm`) for entity extraction |
| LLM | Groq API (`llama-3.1-8b-instant`), with template fallback |
| Session/Cache | Redis (sessions, prediction cache, rate limiting) |
| Persistence | MongoDB (optional conversation logs) |
| Deployment | Vercel (frontend), Render.io starter plan (backend) |

---

## Development Commands

### Frontend

```bash
npm run dev      # Dev server → localhost:3000
npm run build    # Production build → .next/
npm run start    # Production server (rarely needed locally)
npm run lint     # ESLint 9 flat config
```

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m spacy download en_core_web_sm

# Development
python app.py                          # localhost:5000

# Production (same as Render)
gunicorn -w 2 -b 0.0.0.0:$PORT --timeout 120 app:app
```

### Tests

```bash
cd backend
python -m pytest tests/ -v
# or
python -m unittest tests/test_nlp_pipeline.py -v
```

No frontend tests exist. ESLint is the only frontend quality gate.

---

## Environment Variables

### Frontend (`.env.local`)

| Variable | Default | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Flask backend URL |

### Backend (`backend/.env`)

| Variable | Default | Required |
|----------|---------|----------|
| `SECRET_KEY` | — | Yes — Flask session signing |
| `GROQ_API_KEY` | — | No — enables LLM replies (fallback: templates) |
| `MONGO_URI` | `mongodb://localhost:27017` | No — enables conversation logging |
| `MONGO_DB_NAME` | `mental_health_chatbot` | No |
| `REDIS_URL` | `redis://localhost:6379/0` | Recommended — enables distributed sessions/cache |
| `MODEL_DIR` | `./distilbert_finetuned` | Yes — path to fine-tuned DistilBERT |
| `ONNX_MODEL_PATH` | `./onnx_model/model_quantized.onnx` | No — preferred inference path |
| `USE_ONNX` | `true` | No — set false to force PyTorch |
| `LABELS_PATH` | `./label_classes.json` | Yes — emotion index→label mapping |
| `CONFIDENCE_THRESHOLD` | `0.55` | No |
| `MAX_RAW_CHARS` | `1000` | No |
| `RATE_LIMIT_REQUESTS` | `30` | No |
| `RATE_LIMIT_WINDOW_SECONDS` | `60` | No |
| `GROQ_MODEL` | `llama-3.1-8b-instant` | No |
| `SESSION_TTL_SECONDS` | `1800` | No |

See `backend/.env.example` for the full annotated list.

---

## Architecture Patterns

### Backend Request Flow

Every `/send` request goes through this exact chain:

```
POST /send
  → InputValidator.validate_input()     # sanitize, length check
  → RateLimiter.check_rate_limit()      # Redis counter, fail-open
  → Preprocessor.preprocess()           # URL removal, char normalization
  → EmotionClassifier.predict()         # DistilBERT, Redis+LRU cache
  → DialogueManager.update_state()      # Redis session, CBT flow
  → LLMService.generate_reply()         # Groq or template
  → MongoDB.insert_one() (async)        # optional logging
  → {reply, emotion, confidence}
```

### Graceful Degradation

Every external dependency has a fallback — nothing is a hard failure:

| Dependency | Fallback |
|-----------|---------|
| Redis | In-process LRU cache (single-worker only) |
| MongoDB | Skip logging; request still served |
| Groq API | Template-based replies from `dialogue_manager.py` |
| ONNX Runtime | PyTorch CPU inference |
| spaCy | Returns empty entity list |

### Frontend State

All chat state lives in a single `useChat` hook (`hooks/use-chat.ts`). There is no Redux or Zustand. The hook manages:
- `conversations` — persisted to `localStorage` key `compass-conversations`
- `activeConversationId` — current conversation
- `isTyping` — backend response pending
- `language` — persisted to `localStorage` key `compass-language`
- Feedback ratings — persisted to `localStorage` key `compass-feedback`

The hook also handles cold-start retry logic (exponential backoff when Render idles).

### Session State (Redis)

Each session is keyed as `session:{user_id}` (TTL: 30 min). Schema:

```json
{
  "last_emotion": "anxiety",
  "last_confidence": 0.87,
  "last_message": "I can't stop worrying",
  "cbt_active": false,
  "cbt_flow": null,
  "cbt_step": 0,
  "cbt_offered": false,
  "crisis_flag": false,
  "turn_count": 4
}
```

`cbt_flow` values: `"breathing"`, `"journaling"`, `"grounding"`.

---

## API Endpoints

| Method | Route | Request | Response |
|--------|-------|---------|----------|
| `POST` | `/send` | `{message, session_id, language?}` | `{reply, emotion, confidence}` |
| `GET` | `/health` | — | `{status, redis, model_loaded, mongo}` |
| `POST` | `/webhook` | Dialogflow JSON | `{fulfillmentText}` |
| `GET` | `/` | — | HTML fallback (unused in Next.js setup) |

CORS is configured in `backend/app.py` to allow `localhost:3000` and the Vercel production domain.

---

## Key Conventions

### Frontend

- **Path alias**: Always use `@/` (maps to repo root). Example: `import { useChat } from "@/hooks/use-chat"`.
- **Chat components**: Import from barrel `@/components/chat`, not individual files. Add new components to `components/chat/index.ts`.
- **UI primitives**: Use existing shadcn/ui components from `components/ui/`. Do not hand-roll replacements.
- **Types**: Define shared types in `lib/types.ts`. Don't scatter inline interfaces.
- **Constants**: App-wide config (languages, crisis resources, quick actions) belongs in `lib/constants.ts`.

### Backend

- **Layered imports**: Routes → services → models/utils → config. No circular or upward imports.
- **Configuration**: All config goes through `config/settings.py` dataclass. Never hardcode values.
- **Logging**: Use `utils/logger.py` structured events (`prediction`, `error`, `crisis_detected`, `session`, `http_request`). Plain `print()` is discouraged.
- **Session IDs**: Always server-generated. Client passes `session_id` from its own storage but the backend treats it as an opaque key, not a trusted identity.
- **Crisis detection**: Two-stage in `dialogue_manager.py` (model confidence + keyword list). Never suppress or bypass — always route to crisis resources.
- **Test mocking**: Mock ALL heavy imports (`torch`, `onnxruntime`, `redis`, `pymongo`, `spacy`) in `setUpModule()` before the module under test is imported, to prevent loading ML libraries in CI.

---

## Common Tasks

| Task | Files to Change |
|------|----------------|
| Add emotion type | `backend/label_classes.json`, `dialogue_manager.py` (template responses) |
| Add CBT flow | `dialogue_manager.py` (flow steps logic) |
| Add quick-action suggestion | `lib/constants.ts` → `QUICK_ACTIONS` |
| Add supported language | `lib/constants.ts` → `LANGUAGES`, `backend/services/preprocessor.py` |
| Add crisis resource | `lib/constants.ts` → `CRISIS_RESOURCES` |
| Adjust rate limits | `backend/config/settings.py` |
| Add new UI component | shadcn/ui CLI pattern → `components/ui/` |
| Add new chat component | `components/chat/`, export in `components/chat/index.ts` |
| Change LLM system prompt | `backend/services/llm_service.py` |
| Adjust confidence gate | `CONFIDENCE_THRESHOLD` env var or `backend/config/settings.py` |

---

## Deployment

### Frontend → Vercel

Auto-deploys on push to `main`. Set `NEXT_PUBLIC_API_URL` in the Vercel project dashboard (Settings → Environment Variables).

### Backend → Render.io

- **Plan**: Starter tier minimum (free tier 512MB RAM is insufficient for PyTorch).
- **Build command**: `pip install -r requirements.txt && python -m spacy download en_core_web_sm`
- **Start command**: `gunicorn -w 2 -b 0.0.0.0:$PORT --timeout 120 app:app`
- Set all backend env vars in the Render dashboard (not committed).
- **Keep-warm**: `.github/workflows/keep-warm.yml` pings `/health` every 10 minutes to prevent Render free-tier idle shutdowns. Set the `BACKEND_URL` repository variable in GitHub → Settings → Secrets and variables → Actions → Variables.

### Architecture Diagram

```
Browser
  ↓
Vercel (Next.js)  ←→  Render.io (Flask)
                            ↓           ↓           ↓
                       MongoDB Atlas  Redis Cloud  DistilBERT
```

---

## Safety Notes

This application handles mental health conversations. When modifying:

1. **Crisis detection** (`dialogue_manager.py`): Any change to crisis keyword lists or routing logic requires careful review. The two-stage check (model + keywords) exists for redundancy — do not remove either stage.
2. **LLM system prompt** (`llm_service.py`): The 100+ line prompt encodes safety guidelines and CBT-grounded tone. Changes should preserve the therapeutic framing.
3. **Rate limiting** (`middleware/rate_limiter.py`): The fail-open design is intentional — blocking users during a Redis outage is worse than allowing excess traffic.
4. **Input validation** (`middleware/input_validator.py`): HTML stripping and Unicode normalization run before any ML inference. Do not bypass for "performance."
