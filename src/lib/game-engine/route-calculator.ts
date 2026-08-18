import { ClientHuntNode, Hunt, HuntNode, TeamProgress } from "./types";

/**
 * Calculates the next nodes to unlock when a node is completed by a team.
 * Guarantees strict single-node sequential progression along the team's assigned route.
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
  let nextInRoute: string | null = null;
  let isHuntCompleted = false;

  if (route && Array.isArray(route.nodes) && route.nodes.length > 0) {
    const routeIndex = route.nodes.indexOf(completedNodeId);
    if (routeIndex !== -1 && routeIndex + 1 < route.nodes.length) {
      // Strictly unlock only the single next sequential stage
      nextInRoute = route.nodes[routeIndex + 1];
    } else if (routeIndex === route.nodes.length - 1) {
      // Completed the final stage in route
      isHuntCompleted = true;
    }
  }

  const completedNode = hunt.nodes[completedNodeId];
  if (completedNode?.type === "FINAL" || isHuntCompleted) {
    isHuntCompleted = true;
  }

  const finalUnlocked = nextInRoute ? [nextInRoute] : [];
  const newCurrentNodeId = nextInRoute || completedNodeId;

  return {
    newUnlockedNodes: finalUnlocked,
    newCompletedNodes: Array.from(currentCompleted),
    newCurrentNodeId,
    isHuntCompleted,
  };
}

/**
 * Generates sanitized ClientHuntNode items for the student UI.
 * Strictly guarantees that future room names and secrets are obscured,
 * and only the single active node presents its riddle.
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
        name: node.type === "BOSS" ? "Sector 401A [BOSS ENCOUNTER]" : "Mystery Objective",
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
      name: "Classified Objective",
      floorId: node.floorId,
      type: node.type,
      position: node.position,
      state: "LOCKED",
      nextNodes: [],
    };
  });
}
