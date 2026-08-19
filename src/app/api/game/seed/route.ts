import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { ICAT_2026_HUNT_DATA, ICAT_2026_SECRETS } from "@/lib/game-engine/icat-2026-seed-data";
import { TeamProgress, Hunt, HuntSecrets } from "@/lib/game-engine/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { huntId = "icat-2026", resetTeams = false, hardResetAllRooms = false } = body;

    if (hardResetAllRooms) {
      // Complete factory reset - overwrites all custom rooms with baseline blueprints
      await adminDb.collection("hunts").doc(huntId).set(ICAT_2026_HUNT_DATA);
      await adminDb.collection("hunt_secrets").doc(huntId).set(ICAT_2026_SECRETS);
    } else {
      // Safe merge: Preserve all user custom rooms, routes, and custom riddles
      const huntSnap = await adminDb.collection("hunts").doc(huntId).get();
      if (!huntSnap.exists) {
        await adminDb.collection("hunts").doc(huntId).set(ICAT_2026_HUNT_DATA);
      } else {
        const existingData = huntSnap.data() as Hunt;
        const mergedHunt: Hunt = {
          ...ICAT_2026_HUNT_DATA,
          ...existingData,
          nodes: {
            ...ICAT_2026_HUNT_DATA.nodes,
            ...(existingData.nodes || {}),
          },
          routes: {
            ...ICAT_2026_HUNT_DATA.routes,
            ...(existingData.routes || {}),
          },
          updatedAt: Date.now(),
        };
        await adminDb.collection("hunts").doc(huntId).set(mergedHunt, { merge: true });
      }

      // Safe merge secrets
      const secretSnap = await adminDb.collection("hunt_secrets").doc(huntId).get();
      if (!secretSnap.exists) {
        await adminDb.collection("hunt_secrets").doc(huntId).set(ICAT_2026_SECRETS);
      } else {
        const existingSecrets = secretSnap.data() as HuntSecrets;
        const mergedSecrets: HuntSecrets = {
          ...ICAT_2026_SECRETS,
          codes: {
            ...ICAT_2026_SECRETS.codes,
            ...(existingSecrets.codes || {}),
          },
          updatedAt: Date.now(),
        };
        await adminDb.collection("hunt_secrets").doc(huntId).set(mergedSecrets, { merge: true });
      }
    }

    // Initialize or Reset Team Progress for standard teams
    const teams = ["RED", "WHITE", "BLACK", "CYAN", "BLUE"];
    const seededProgress: Record<string, TeamProgress> = {};

    for (const teamId of teams) {
      const progressDocId = `${huntId}_${teamId}`;
      const progressRef = adminDb.collection("teamProgress").doc(progressDocId);
      const existing = await progressRef.get();

      if (!existing.exists || resetTeams) {
        const teamRoute = ICAT_2026_HUNT_DATA.teams[teamId]?.routeId || "P1";
        const startingNode = ICAT_2026_HUNT_DATA.startingNodeId || "202";
        const newProg: TeamProgress = {
          huntId,
          teamId,
          routeId: teamRoute,
          currentNodeId: startingNode,
          unlockedNodes: [startingNode],
          completedNodes: [],
          collectedPieces: [],
          bossProgress: {},
          status: "active",
          startedAt: Date.now(),
          updatedAt: Date.now(),
        };
        await progressRef.set(newProg);
        seededProgress[teamId] = newProg;
      }
    }

    // When resetTeams is true, unlock user profile team selections
    if (resetTeams) {
      try {
        const usersSnap = await adminDb.collection("users").get();
        const batch = adminDb.batch();
        usersSnap.docs.forEach((docSnap) => {
          batch.set(docSnap.ref, { teamId: null, updatedAt: Date.now() }, { merge: true });
        });
        await batch.commit();
      } catch (userResetErr) {
        console.warn("Could not reset user profiles:", userResetErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: resetTeams
        ? "All squad progressions and team selections have been reset. Custom rooms and riddles preserved."
        : "Database verified and synchronized. Custom rooms and riddles preserved.",
      seededProgress,
    });
  } catch (error: unknown) {
    console.error("Database seed error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize Firestore collections.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
