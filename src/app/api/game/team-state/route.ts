import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/firebase/server-auth";
import { ICAT_2026_HUNT_DATA } from "@/lib/game-engine/icat-2026-seed-data";
import { Hunt, TeamProgress } from "@/lib/game-engine/types";

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuthToken(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED: Invalid security token." }, { status: 401 });
    }

    const body = await req.json();
    const { huntId = "icat-2026", teamId } = body;

    if (!teamId) {
      return NextResponse.json({ success: false, error: "Missing teamId." }, { status: 400 });
    }

    let hunt: Hunt = ICAT_2026_HUNT_DATA;
    try {
      const huntSnap = await adminDb.collection("hunts").doc(huntId).get();
      if (huntSnap.exists) {
        hunt = huntSnap.data() as Hunt;
      }
    } catch {}

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
      try {
        await progressRef.set(progress);
      } catch (e) {
        console.warn("Could not create teamProgress doc:", e);
      }
    }

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error: unknown) {
    console.error("Team state init error:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
