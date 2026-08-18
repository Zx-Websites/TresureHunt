import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/firebase/server-auth";
import { TeamProgress, Hunt } from "@/lib/game-engine/types";
import { ICAT_2026_HUNT_DATA } from "@/lib/game-engine/icat-2026-seed-data";

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuthToken(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED: Invalid security token." }, { status: 401 });
    }

    const body = await req.json();
    const { huntId = "icat-2026", teamId, action, reason } = body;

    if (!teamId || !action) {
      return NextResponse.json(
        { success: false, error: "BAD REQUEST: Missing teamId or action." },
        { status: 400 }
      );
    }

    const progressDocId = `${huntId}_${teamId}`;
    const progressRef = adminDb.collection("teamProgress").doc(progressDocId);
    const progressSnap = await progressRef.get();

    let currentProgress: TeamProgress;
    if (progressSnap.exists) {
      currentProgress = progressSnap.data() as TeamProgress;
    } else {
      let hunt: Hunt = ICAT_2026_HUNT_DATA;
      try {
        const huntDoc = await adminDb.collection("hunts").doc(huntId).get();
        if (huntDoc.exists) hunt = huntDoc.data() as Hunt;
      } catch {}

      const startingRoute = hunt.teams[teamId]?.routeId || "P1";
      const startingNodeId = hunt.startingNodeId || "202";
      currentProgress = {
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

    if (action === "DISQUALIFY") {
      await progressRef.set(
        {
          ...currentProgress,
          status: "disqualified",
          loserReason: reason || "Squad disqualified by Event Administrator.",
          disqualifiedAt: Date.now(),
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      return NextResponse.json({
        success: true,
        message: `Squad ${teamId} has been disqualified.`,
      });
    }

    if (action === "REINSTATE") {
      await progressRef.set(
        {
          ...currentProgress,
          status: "active",
          loserReason: null,
          updatedAt: Date.now(),
        },
        { merge: true }
      );

      return NextResponse.json({
        success: true,
        message: `Squad ${teamId} has been reinstated to active status.`,
      });
    }

    if (action === "RESET_TEAM") {
      let hunt: Hunt = ICAT_2026_HUNT_DATA;
      try {
        const huntDoc = await adminDb.collection("hunts").doc(huntId).get();
        if (huntDoc.exists) hunt = huntDoc.data() as Hunt;
      } catch {}

      const startingRoute = hunt.teams[teamId]?.routeId || "P1";
      const startingNodeId = hunt.startingNodeId || "202";

      const freshProgress: TeamProgress = {
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

      await progressRef.set(freshProgress);

      return NextResponse.json({
        success: true,
        message: `Squad ${teamId} progress has been reset to Genesis Station.`,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (error: unknown) {
    console.error("Admin team action error:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
