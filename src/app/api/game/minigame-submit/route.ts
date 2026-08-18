import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/firebase/server-auth";
import { ICAT_2026_HUNT_DATA, ICAT_2026_SECRETS } from "@/lib/game-engine/icat-2026-seed-data";
import { Hunt, HuntSecrets, TeamProgress } from "@/lib/game-engine/types";

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuthToken(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED: Invalid security token." }, { status: 401 });
    }

    const body = await req.json();
    const { huntId, teamId, nodeId, score } = body;

    if (!huntId || !teamId || !nodeId || typeof score !== "number") {
      return NextResponse.json(
        { success: false, error: "BAD REQUEST: Missing required parameters." },
        { status: 400 }
      );
    }

    // 1. Fetch Hunt
    let hunt: Hunt = ICAT_2026_HUNT_DATA;
    try {
      const huntSnap = await adminDb.collection("hunts").doc(huntId).get();
      if (huntSnap.exists) {
        hunt = huntSnap.data() as Hunt;
      }
    } catch {
      hunt = ICAT_2026_HUNT_DATA;
    }

    // 2. Fetch Secrets
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
    if (!targetNode || targetNode.type !== "BOSS") {
      return NextResponse.json({ success: false, error: "SECTOR ERROR: Node is not a boss sector." }, { status: 400 });
    }

    const requiredScore = targetNode.minigame?.minimumScore || 850;
    const isPassed = score >= requiredScore;

    // 3. Fetch or initialize Team Progress
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

    const existingBoss = progress.bossProgress?.[nodeId] || { bestScore: 0, passed: false };
    const newBest = Math.max(existingBoss.bestScore || 0, score);
    const hasPassed = existingBoss.passed || isPassed;

    const updatedBossProgress = {
      ...(progress.bossProgress || {}),
      [nodeId]: {
        bestScore: newBest,
        passed: hasPassed,
        unlockedAt: existingBoss.unlockedAt || Date.now(),
        completedAt: hasPassed ? Date.now() : undefined,
      },
    };

    const updatedProgress: TeamProgress = {
      ...progress,
      bossProgress: updatedBossProgress,
      updatedAt: Date.now(),
    };

    try {
      await progressRef.set(updatedProgress, { merge: true });
    } catch (e) {
      console.warn("Could not save boss progress to Firestore:", e);
    }

    const awardedCode = hasPassed ? secrets.codes[nodeId]?.code : undefined;

    return NextResponse.json({
      success: true,
      passed: hasPassed,
      score,
      requiredScore,
      awardedCode,
      message: hasPassed
        ? "NEURAL MAINFRAME OVERRIDDEN! Clearance cipher decrypted."
        : `NEURAL OVERRIDE INCOMPLETE: Score ${score}/${requiredScore} PTS. Try again!`,
    });
  } catch (error: unknown) {
    console.error("Minigame submit error:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
