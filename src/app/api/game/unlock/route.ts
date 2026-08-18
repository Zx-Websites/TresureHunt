import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/firebase/server-auth";
import { ICAT_2026_HUNT_DATA, ICAT_2026_SECRETS } from "@/lib/game-engine/icat-2026-seed-data";
import { calculateNextUnlockedNodes } from "@/lib/game-engine/route-calculator";
import { Hunt, HuntSecrets, TeamProgress } from "@/lib/game-engine/types";

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuthToken(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED: Invalid security token." }, { status: 401 });
    }

    const body = await req.json();
    const { huntId, teamId, nodeId, enteredCode } = body;

    if (!huntId || !teamId || !nodeId || !enteredCode) {
      return NextResponse.json(
        { success: false, error: "BAD REQUEST: Missing required parameters." },
        { status: 400 }
      );
    }

    // 1. Fetch Hunt configuration from Firestore or fallback to seed data
    let hunt: Hunt = ICAT_2026_HUNT_DATA;
    try {
      const huntSnap = await adminDb.collection("hunts").doc(huntId).get();
      if (huntSnap.exists) {
        hunt = huntSnap.data() as Hunt;
      }
    } catch {
      hunt = ICAT_2026_HUNT_DATA;
    }

    // 2. Fetch Secrets from server-only collection or fallback
    let secrets: HuntSecrets = ICAT_2026_SECRETS;
    try {
      const secretSnap = await adminDb.collection("hunt_secrets").doc(huntId).get();
      if (secretSnap.exists) {
        secrets = secretSnap.data() as HuntSecrets;
      }
    } catch {
      secrets = ICAT_2026_SECRETS;
    }

    const targetNode = hunt.nodes[nodeId];
    if (!targetNode) {
      return NextResponse.json({ success: false, error: "INVALID SECTOR: Node does not exist." }, { status: 404 });
    }

    // 3. Fetch or initialize Team Progress in Firestore
    const progressDocId = `${huntId}_${teamId}`;
    const progressRef = adminDb.collection("teamProgress").doc(progressDocId);

    let progress: TeamProgress;
    const progressSnap = await progressRef.get();

    if (progressSnap.exists) {
      progress = progressSnap.data() as TeamProgress;
    } else {
      const startingRoute = hunt.teams[teamId]?.routeId || "P1";
      const startingNodeId = hunt.startingNodeId || "202";
      progress = {
        huntId,
        teamId,
        routeId: startingRoute,
        currentNodeId: startingNodeId,
        unlockedNodes: [startingNodeId],
        completedNodes: [],
        collectedPieces: [],
        bossProgress: {},
        status: "active",
        startedAt: Date.now(),
        updatedAt: Date.now(),
      };
    }

    // 4. Verify node is unlocked for this team
    if (!progress.unlockedNodes.includes(nodeId)) {
      return NextResponse.json(
        { success: false, error: "SECTOR LOCKED: Node is not currently accessible for your squad." },
        { status: 403 }
      );
    }

    // 5. Verify node is not already completed
    if (progress.completedNodes.includes(nodeId)) {
      return NextResponse.json(
        { success: false, error: "SECTOR CLEARED: Node has already been decrypted by your squad." },
        { status: 400 }
      );
    }

    // 6. Verify code against server secret (checks route-specific code or global room code)
    const routeSecretKey = `${progress.routeId}_${nodeId}`;
    const routeCode = secrets.codes[routeSecretKey]?.code?.trim().toUpperCase();
    const globalCode = secrets.codes[nodeId]?.code?.trim().toUpperCase();
    const providedCode = enteredCode.toString().trim().toUpperCase();

    const clean = (s?: string) => (s ? s.replace(/[^A-Z0-9]/g, "") : "");

    const isMatch =
      (routeCode && (providedCode === routeCode || clean(providedCode) === clean(routeCode))) ||
      (globalCode && (providedCode === globalCode || clean(providedCode) === clean(globalCode)));

    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "ACCESS DENIED: Invalid clearance cipher for this sector." },
        { status: 403 }
      );
    }

    // If BOSS node, record boss challenge as passed upon legitimate cipher entry
    let updatedBossProgress = progress.bossProgress || {};
    if (targetNode.type === "BOSS") {
      updatedBossProgress = {
        ...updatedBossProgress,
        [nodeId]: {
          bestScore: Math.max(updatedBossProgress[nodeId]?.bestScore || 0, targetNode.minigame?.minimumScore || 850),
          passed: true,
          completedAt: Date.now(),
        },
      };
    }

    // 8. Progress calculations
    const { newUnlockedNodes, newCompletedNodes, newCurrentNodeId, isHuntCompleted } =
      calculateNextUnlockedNodes(nodeId, hunt, progress);

    const updatedProgress: TeamProgress = {
      ...progress,
      unlockedNodes: newUnlockedNodes,
      completedNodes: newCompletedNodes,
      currentNodeId: newCurrentNodeId,
      bossProgress: updatedBossProgress,
      status: isHuntCompleted ? "completed" : progress.status,
      ...(isHuntCompleted ? { completedAt: Date.now() } : {}),
      updatedAt: Date.now(),
    };

    // 9. Persist updated progress in Firestore
    try {
      await progressRef.set(updatedProgress, { merge: true });
    } catch (e) {
      console.warn("Could not save teamProgress to Firestore:", e);
    }

    return NextResponse.json({
      success: true,
      message: "ACCESS GRANTED: Sector successfully cleared.",
      puzzleLocation: targetNode.puzzleLocation || null,
      nextNodes: newUnlockedNodes,
      isHuntCompleted,
    });
  } catch (error: unknown) {
    console.error("Unlock API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal security server error." },
      { status: 500 }
    );
  }
}
