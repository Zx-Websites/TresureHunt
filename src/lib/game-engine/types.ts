export type HuntStatus = "draft" | "active" | "paused" | "completed";

export type TeamStatus = "active" | "completed" | "lost" | "disqualified" | "paused";

export type UserRole = "student" | "teacher" | "admin";

export type NodeType = "NORMAL" | "BOSS" | "FINAL";

export type CodeSource = "TEACHER" | "HIDDEN" | "MINIGAME";

export interface TreasureConfig {
  title: string;
  clue: string;
  hint?: string;
  finalMessage?: string;
}

export interface HuntFloor {
  id: string;
  floorNumber: number;
  name: string;
  shortName?: string;
  nodeIds: string[];
}

export interface HuntNode {
  id: string;
  name: string;
  floorId: string;
  type: NodeType;
  position: {
    x: number; // Normalized percentage 0-100
    y: number; // Normalized percentage 0-100
  };
  riddle: {
    title?: string;
    text: string;
    hint?: string;
  };
  routeRiddles?: Record<string, { title?: string; text: string; hint?: string }>;
  codeSource: CodeSource;
  nextNodes: string[];
  puzzleLocation?: {
    clue: string;
    hint?: string;
    pieceId?: string;
  };
  routePuzzleLocations?: Record<string, { clue: string; hint?: string; pieceId?: string }>;
  minigame?: {
    gameId: string;
    minimumScore: number;
    title?: string;
    instructions?: string;
    webGameUrl?: string;
  };
}

export interface ClientHuntNode {
  id: string;
  name: string;
  floorId: string;
  type: NodeType;
  position: {
    x: number;
    y: number;
  };
  state: "LOCKED" | "AVAILABLE" | "COMPLETED";
  riddle?: {
    title?: string;
    text: string;
    hint?: string;
  };
  codeSource?: CodeSource;
  nextNodes: string[];
  puzzleLocation?: {
    clue: string;
    hint?: string;
    pieceId?: string;
  };
  minigame?: {
    gameId: string;
    minimumScore: number;
    title?: string;
    instructions?: string;
    webGameUrl?: string;
  };
  isBossPassed?: boolean;
}

export interface HuntRoute {
  id: string;
  name: string;
  nodes: string[];
}

export interface TeamConfig {
  id: string;
  name: string;
  color: string;
  hex: string;
  routeId: string;
  badge?: string;
}

export interface BossProgressEntry {
  bestScore: number;
  passed: boolean;
  unlockedAt?: number;
  completedAt?: number;
}

export interface TeamProgress {
  huntId: string;
  teamId: string;
  routeId: string;
  currentNodeId: string;
  unlockedNodes: string[];
  completedNodes: string[];
  collectedPieces: string[];
  bossProgress: Record<string, BossProgressEntry>;
  status: TeamStatus;
  loserReason?: string;
  disqualifiedAt?: number;
  startedAt: number;
  completedAt?: number;
  updatedAt: number;
}

export interface Hunt {
  id: string;
  name: string;
  slug: string;
  status: HuntStatus;
  theme: string;
  startingNodeId: string;
  totalFloors: number;
  floors: HuntFloor[];
  teams: Record<string, TeamConfig>;
  routes: Record<string, HuntRoute>;
  nodes: Record<string, HuntNode>;
  treasure: TreasureConfig;
  createdAt: number;
  updatedAt: number;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  teamId?: string;
  huntId?: string;
  role: UserRole;
  createdAt: number;
  updatedAt: number;
}

export interface HuntSecretEntry {
  code: string;
  minigameScoreThreshold?: number;
}

export interface HuntSecrets {
  huntId: string;
  codes: Record<string, HuntSecretEntry>;
  treasureSecret?: string;
  updatedAt: number;
}
