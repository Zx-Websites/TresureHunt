import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/firebase/server-auth";
import { Hunt, HuntSecrets, TeamProgress } from "@/lib/game-engine/types";
import { ICAT_2026_HUNT_DATA, ICAT_2026_SECRETS } from "@/lib/game-engine/icat-2026-seed-data";
import { calculateNextUnlockedNodes } from "@/lib/game-engine/route-calculator";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user request
    const user = await verifyAuthToken(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED: Valid credentials required." },
        { status: 401 }
      );
    }

    // 2. Parse request payload
    const body = await req.json();
    const { huntId, teamId, nodeId, enteredCode } = body;

    if (!huntId || !teamId || !nodeId || enteredCode === undefined) {
      return NextResponse.json(
        { success: false, error: "BAD REQUEST: Missing required parameters." },
        { status: 400 }
      );
    }

    // 3. Fetch hunt configuration & secrets from Firestore
    let hunt: Hunt = ICAT_2026_HUNT_DATA;
    let secrets: HuntSecrets = ICAT_2026_SECRETS;

    try {
      const huntDoc = await adminDb.collection("hunts").doc(huntId).get();
      if (huntDoc.exists) {
        hunt = huntDoc.data() as Hunt;
      }
      const secretsDoc = await adminDb.collection("hunt_secrets").doc(huntId).get();
      if (secretsDoc.exists) {
        secrets = secretsDoc.data() as HuntSecrets;
      }
    } catch (e) {
      console.warn("Firestore fetch fallback to seed data:", e);
    }

    const targetNode = hunt.nodes[nodeId];
    if (!targetNode) {
      return NextResponse.json(
        { success: false, error: "NOT FOUND: Sector does not exist." },
        { status: 404 }
      );
    }

    // Fetch team progress
    const progressDocId = `${huntId}_${teamId}`;
    const progressRef = adminDb.collection("teamProgress").doc(progressDocId);
    const progressSnap = await progressRef.get();

    let progress: TeamProgress;
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

    // Check if team is eliminated or disqualified
    if (progress.status === "lost" || progress.status === "disqualified") {
      return NextResponse.json(
        {
          success: false,
          error:
            progress.loserReason ||
            "MISSION FAILED: Your squad has been eliminated from the competition.",
        },
        { status: 403 }
      );
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
          bestScore: Math.max(updatedBossProgress[nodeId]?.bestScore || 0, targetNode.minigame?.minimumScore || 400),
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

    // 10. WINNER TAKES ALL ELIMINATION RULE:
    // When one team reaches final and completes it, all other remaining teams immediately lose!
    if (isHuntCompleted) {
      try {
        const allTeamsSnap = await adminDb
          .collection("teamProgress")
          .where("huntId", "==", huntId)
          .get();

        const batch = adminDb.batch();
        allTeamsSnap.docs.forEach((docSnap) => {
          const t = docSnap.data() as TeamProgress;
          if (t.teamId !== teamId && t.status !== "completed") {
            batch.set(
              docSnap.ref,
              {
                status: "lost",
                loserReason: `Squad ${teamId} has breached the Grand Vault in the Auditorium and claimed the Treasure! Game Over.`,
                updatedAt: Date.now(),
              },
              { merge: true }
            );
          }
        });
        await batch.commit();
      } catch (batchErr) {
        console.warn("Error marking other teams lost upon victory:", batchErr);
      }
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
      { success: false, error: "Internal server error during node decryption." },
      { status: 500 }
    );
  }
}
