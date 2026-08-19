import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { ICAT_2026_HUNT_DATA, ICAT_2026_SECRETS } from "@/lib/game-engine/icat-2026-seed-data";
import { TeamProgress } from "@/lib/game-engine/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { huntId = "icat-2026", resetTeams = false } = body;

    // 1. Write public hunt document (clean replace to ensure only 20 official rooms)
    await adminDb.collection("hunts").doc(huntId).set(ICAT_2026_HUNT_DATA);

    // 2. Write server-only secrets document
    await adminDb.collection("hunt_secrets").doc(huntId).set(ICAT_2026_SECRETS);

    // 3. Initialize or Reset Team Progress for standard teams
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

    // 4. When entire game is reset, unlock user profile team selections
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
      message: `Hunt '${huntId}' and server secrets successfully seeded into Firestore.`,
      huntId,
      teamsSeeded: teams,
    });
  } catch (error: unknown) {
    console.error("Seed API error:", error);
    return NextResponse.json({ success: false, error: "Failed to seed Firestore data." }, { status: 500 });
  }
}
