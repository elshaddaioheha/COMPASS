import type {
  QuickAction,
  CrisisResource,
  LanguageOption,
  LanguageCode,
} from "./types";

// ─── Application ─────────────────────────────────────────────────────────────

export const APP_NAME = "COMPASS";
export const APP_TAGLINE =
  "Cognitive & Mental Processing Advisory Support System";
export const APP_DESCRIPTION =
  "A safe, anonymous space for emotional support and mental wellness guidance.";
export const STORAGE_KEY = "compass-conversations";
export const FEEDBACK_STORAGE_KEY = "compass-feedback";
export const LANGUAGE_STORAGE_KEY = "compass-language";

// ─── Language ────────────────────────────────────────────────────────────────
// Matches the backend's supported languages (en, yo, pcm). "auto" lets the
// backend detect the input language and reply in the same one.

export const DEFAULT_LANGUAGE: LanguageCode = "auto";

export const LANGUAGES: LanguageOption[] = [
  { code: "auto", label: "Auto" },
  { code: "en", label: "English" },
  { code: "yo", label: "Yorùbá" },
  { code: "pcm", label: "Pidgin" },
];

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
// NSPI and MANI match the numbers used in the backend's crisis template
// (services/dialogue_manager.py), so the app is consistent end to end.
// IMPORTANT: verify every number against an official source before going to
// production — hotlines change. SURPIN is marked below as needing verification.

export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    name: "Deji (Project Student)",
    number: "+234 913 707 7242",
    description: "Contact the student developer for direct project assistance or emergency testing.",
    region: "Nigeria",
  },
  {
    name: "Nigeria Suicide Prevention Initiative (NSPI)",
    number: "0800-7842433", // 0800-SUICIDE — matches the backend crisis template
    description:
      "24/7 crisis support for individuals experiencing suicidal thoughts.",
    region: "Nigeria",
  },
  {
    name: "Mentally Aware Nigeria Initiative (MANI)",
    number: "+234 809 111 6264", // matches the backend crisis template
    description:
      "Mental health advocacy and a support line available across Nigeria.",
    region: "Nigeria",
  },
  {
    name: "SURPIN (Suicide Research & Prevention Initiative)",
    number: "+234 908 021 7555", // TODO: verify current SURPIN number before publishing
    description: "Mental health support line based in Lagos, Nigeria.",
    region: "Nigeria",
  },
  {
    name: "Crisis Text Line",
    number: "Text HOME to 741741",
    description: "Free, 24/7 text-based crisis support (US, CA, UK, IE).",
    region: "International",
  },
  {
    name: "International Association for Suicide Prevention",
    number: "iasp.info/resources/Crisis_Centres",
    description:
      "Global directory to find a crisis centre in your country.",
    region: "International",
  },
];
