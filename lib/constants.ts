import type { QuickAction, CrisisResource } from "./types";

// ─── Application ─────────────────────────────────────────────────────────────

export const APP_NAME = "COMPASS";
export const APP_TAGLINE =
  "Cognitive & Mental Processing Advisory Support System";
export const APP_DESCRIPTION =
  "A safe, anonymous space for emotional support and mental wellness guidance.";
export const STORAGE_KEY = "compass-conversations";
export const FEEDBACK_STORAGE_KEY = "compass-feedback";

// ─── System Response ─────────────────────────────────────────────────────────

export const PENDING_RESPONSE_TITLE = "Implementation In Progress";
export const PENDING_RESPONSE_BODY =
  "Thank you for sharing. Our AI-powered therapeutic engine is currently under development. Once integrated, COMPASS will provide personalised CBT exercises, sentiment-aware dialogue, and culturally relevant mental health resources.\n\nIn the meantime, please explore the quick actions or reach out to the crisis resources if you need immediate support.";

// ─── Quick Actions ───────────────────────────────────────────────────────────

export const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Breathing Exercise",
    description: "Try a guided breathing technique to help you calm down",
    prompt: "I'd like to try a breathing exercise to help me calm down.",
    icon: "wind",
  },
  {
    label: "Journaling Prompt",
    description: "Get a thought-provoking prompt to process your thoughts",
    prompt:
      "Can you give me a journaling prompt to help me process my thoughts?",
    icon: "pencil",
  },
  {
    label: "I'm Feeling Anxious",
    description: "Get support and coping strategies for anxiety",
    prompt:
      "I've been feeling really anxious lately and I don't know what to do.",
    icon: "heart",
  },
  {
    label: "I Need to Talk",
    description: "Express what's on your mind in a safe space",
    prompt:
      "I just need someone to talk to right now. I'm going through a tough time.",
    icon: "message-circle",
  },
  {
    label: "Mood Check-in",
    description: "Reflect on and log how you're feeling right now",
    prompt:
      "I'd like to do a mood check-in and reflect on how I'm feeling right now.",
    icon: "activity",
  },
  {
    label: "CBT Technique",
    description: "Learn a Cognitive Behavioral Therapy strategy",
    prompt:
      "Can you walk me through a Cognitive Behavioral Therapy technique to challenge my negative thoughts?",
    icon: "brain",
  },
];

// ─── Crisis Resources ────────────────────────────────────────────────────────

export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    name: "Nigeria Suicide Prevention Initiative (NSPI)",
    number: "****",
    description:
      "24/7 crisis support for individuals experiencing suicidal thoughts.",
    region: "Nigeria",
  },
  {
    name: "SURPIN (Suicide Research & Prevention Initiative)",
    number: "****",
    description: "Mental health support line based in Lagos, Nigeria.",
    region: "Nigeria",
  },
  {
    name: "Mentally Aware Nigeria Initiative (MANI)",
    number: "****",
    description:
      "Organization providing mental health advocacy and support across Nigeria.",
    region: "Nigeria",
  },
  {
    name: "International Association for Suicide Prevention",
    number: "****",
    description:
      "Global directory of crisis centres for international support.",
    region: "International",
  },
  {
    name: "Crisis Text Line",
    number: "****",
    description: "Free, 24/7 text-based crisis support.",
    region: "International",
  },
];
