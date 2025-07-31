export enum DebatePhase {
  AUTH = 'AUTH',
  SETUP = 'SETUP',
  PREP = 'PREP',
  DEBATE = 'DEBATE',
  FEEDBACK = 'FEEDBACK',
  HISTORY = 'HISTORY',
  CLUBS = 'CLUBS',
  PASSWORD_RECOVERY = 'PASSWORD_RECOVERY',
}

export enum DebateFormat {
    ONE_V_ONE = '1v1 Sparring',
    TWO_V_TWO = '2v2 Parliamentary',
}

export enum Team {
  A = 'Team A (Government)',
  B = 'Team B (Opposition)',
}

export enum SpeakerRole {
  // 2v2 Roles
  PRIME_MINISTER = "Prime Minister",
  LEADER_OF_OPPOSITION = "Leader of Opposition",
  DEPUTY_PRIME_MINISTER = "Deputy Prime Minister",
  DEPUTY_LEADER_OF_OPPOSITION = "Deputy Leader of Opposition",
  PM_REBUTTAL = "Prime Minister's Rebuttal",
  // 1v1 Roles
  PROPONENT_OPENING = "Proponent (Opening)",
  OPPONENT_OPENING = "Opponent (Opening)",
  PROPONENT_CLOSING = "Proponent (Closing)",
  OPPONENT_CLOSING = "Opponent (Closing)",
}

export interface Speaker {
  id: number;
  name: string;
  team: Team;
  role: SpeakerRole;
  isUser: boolean;
  speechTime: number; // in seconds
  voiceIndex?: number; // Index for the available browser voices array
}

export interface Speech {
  speakerRole: SpeakerRole;
  transcript: string;
}

export interface Score {
  speakingPoints: number;
  logicAndReasoning: number;

  rhetoricAndPersuasion: number;
  rebuttalAndAdaptation: number;
}

export interface Feedback {
    scores: Score;
    overallSummary: string;
    strengths: string[];
    areasForImprovement: string[];
    strategicAdvice: string;
}

export interface UserProfile {
    id: string; // Corresponds to Supabase auth user ID
    name: string;
    email: string;
    clubId?: string | null;
    clubName?: string | null;
}

export interface DebateClub {
    id: string;
    name: string;
    description: string;
    members: { name: string }[]; // Simplified for display
    creator_id: string;
}

export interface DebateRecord {
    id: string;
    created_at: string;
    topic: string;
    format: DebateFormat;
    speakers: Speaker[];
    transcript: Speech[];
    feedback: Feedback;
    user_id: string;
}

export const DEBATE_CATEGORIES = ["Politics", "Ethics", "Technology", "Environment", "Culture"];

// --- App State Management Types ---

export interface AppState {
    phase: DebatePhase;
    topic: string;
    debateFormat: DebateFormat | null;
    speakers: Speaker[];
    transcript: Speech[];
    isLoading: boolean;
    user: UserProfile | null;
    isHelpModalOpen: boolean;
    history: DebateRecord[];
    selectedRecordId: string | null;
    appReady: boolean;
    saveError: string | null;
}

export type Action =
    | { type: 'SET_USER'; payload: { user: UserProfile, history: DebateRecord[] } }
    | { type: 'CLEAR_USER' }
    | { type: 'UPDATE_USER_PROFILE'; payload: { user: UserProfile } }
    | { type: 'START_PREP'; payload: { topic: string; format: DebateFormat } }
    | { type: 'START_DEBATE' }
    | { type: 'FINISH_DEBATE'; payload: { transcript: Speech[] } }
    | { type: 'ADD_HISTORY_RECORD'; payload: { record: DebateRecord } }
    | { type: 'RESTART' }
    | { type: 'STOP_DEBATE' }
    | { type: 'TOGGLE_HELP' }
    | { type: 'VIEW_HISTORY' }
    | { type: 'VIEW_CLUBS' }
    | { type: 'SELECT_RECORD'; payload: { id: string } }
    | { type: 'VIEW_SETUP' }
    | { type: 'APP_READY' }
    | { type: 'SET_SAVE_ERROR'; payload: string }
    | { type: 'START_PASSWORD_RECOVERY' };