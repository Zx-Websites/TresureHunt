import { ClientHuntNode, Hunt, HuntNode, TeamProgress } from "./types";

/**
 * Calculates the next nodes to unlock when a node is completed by a team.
 * Uses both the team's designated route and the node graph structure.
 */
export function calculateNextUnlockedNodes(
  completedNodeId: string,
  hunt: Hunt,
  progress: TeamProgress
): {
  newUnlockedNodes: string[];
  newCompletedNodes: string[];
  newCurrentNodeId: string;
  isHuntCompleted: boolean;
} {
  const currentCompleted = new Set(progress.completedNodes || []);
  currentCompleted.add(completedNodeId);

  const route = hunt.routes[progress.routeId];
  const completedNode = hunt.nodes[completedNodeId];

  const candidateNext = new Set<string>(progress.unlockedNodes.filter((id) => id !== completedNodeId));

  let nextInRoute: string | null = null;
  let isHuntCompleted = false;

  if (route && route.nodes && route.nodes.length > 0) {
    const routeIndex = route.nodes.indexOf(completedNodeId);
    if (routeIndex !== -1 && routeIndex + 1 < route.nodes.length) {
      nextInRoute = route.nodes[routeIndex + 1];
      candidateNext.add(nextInRoute);
    } else if (routeIndex === route.nodes.length - 1) {
      // Completed the last node in route
      isHuntCompleted = true;
    }
  }

  // Also allow graph-based nextNodes if defined
  if (completedNode && Array.isArray(completedNode.nextNodes)) {
    completedNode.nextNodes.forEach((id) => {
      // If a route is defined, prioritize nodes that belong to this route or are reachable
      if (!route || route.nodes.includes(id)) {
        candidateNext.add(id);
      }
    });
  }

  // Remove any already completed nodes from unlocked list
  const finalUnlocked = Array.from(candidateNext).filter((id) => !currentCompleted.has(id));

  // Determine new currentNodeId
  const newCurrentNodeId = nextInRoute || (finalUnlocked.length > 0 ? finalUnlocked[0] : completedNodeId);

  // Check if final node is completed or all route nodes are completed
  if (completedNode?.type === "FINAL" || isHuntCompleted) {
    isHuntCompleted = true;
  }

  return {
    newUnlockedNodes: finalUnlocked,
    newCompletedNodes: Array.from(currentCompleted),
    newCurrentNodeId,
    isHuntCompleted,
  };
}

/**
 * Generates sanitized ClientHuntNode items for the student UI.
 * Strictly guarantees that locked room names, riddles, and secrets are obscured.
 */
export function sanitizeNodesForClient(
  nodes: Record<string, HuntNode>,
  progress: TeamProgress | null,
  huntStartingNodeId: string
): ClientHuntNode[] {
  const completedSet = new Set(progress?.completedNodes || []);
  const unlockedSet = new Set(progress?.unlockedNodes || [huntStartingNodeId]);
  const bossProgress = progress?.bossProgress || {};

  return Object.values(nodes).map((node) => {
    const isCompleted = completedSet.has(node.id);
    const isUnlocked = unlockedSet.has(node.id) && !isCompleted;
    const isBossPassed = !!bossProgress[node.id]?.passed;

    if (isCompleted) {
      return {
        id: node.id,
        name: node.name,
        floorId: node.floorId,
        type: node.type,
        position: node.position,
        state: "COMPLETED",
        riddle: node.riddle,
        codeSource: node.codeSource,
        nextNodes: node.nextNodes,
        puzzleLocation: node.puzzleLocation,
        minigame: node.minigame,
        isBossPassed: true,
      };
    }

    if (isUnlocked) {
      return {
        id: node.id,
        name: node.name,
        floorId: node.floorId,
        type: node.type,
        position: node.position,
        state: "AVAILABLE",
        riddle: node.riddle,
        codeSource: node.codeSource,
        nextNodes: node.nextNodes,
        minigame: node.minigame,
        isBossPassed,
      };
    }

    // LOCKED: Obscure room name, strip riddle and puzzle details
    return {
      id: node.id,
      name: `??? [SECTOR ${node.id}]`,
      floorId: node.floorId,
      type: node.type,
      position: node.position,
      state: "LOCKED",
      nextNodes: [],
    };
  });
}
