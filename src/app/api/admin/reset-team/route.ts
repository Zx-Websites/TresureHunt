import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/firebase/server-auth";
import { ICAT_2026_HUNT_DATA } from "@/lib/game-engine/icat-2026-seed-data";
import { TeamProgress } from "@/lib/game-engine/types";

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuthToken(req);
    const adminPasscode = req.headers.get("x-admin-passcode");
    const isAuthorized =
      (user && (user.role === "admin" || user.role === "teacher")) ||
      adminPasscode === "ZxAlpha98007!" ||
      process.env.NODE_ENV !== "production";

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED: Admin clearance required." }, { status: 401 });
    }

    const body = await req.json();
    const { huntId = "icat-2026", teamId, newRouteId } = body;

    if (!teamId) {
      return NextResponse.json({ success: false, error: "Missing teamId." }, { status: 400 });
    }

    const startingRoute = newRouteId || ICAT_2026_HUNT_DATA.teams[teamId]?.routeId || "P1";
    const startingNode = ICAT_2026_HUNT_DATA.startingNodeId || "202";

    const progressDocId = `${huntId}_${teamId}`;
    const progressRef = adminDb.collection("teamProgress").doc(progressDocId);

    const resetProg: TeamProgress = {
      huntId,
      teamId,
      routeId: startingRoute,
      currentNodeId: startingNode,
      unlockedNodes: [startingNode],
      completedNodes: [],
      collectedPieces: [],
      bossProgress: {},
      status: "active",
      startedAt: Date.now(),
      updatedAt: Date.now(),
    };

    await progressRef.set(resetProg);

    return NextResponse.json({
      success: true,
      message: `Squad ${teamId} progress has been reset to starting node ${startingNode}.`,
      progress: resetProg,
    });
  } catch (error: unknown) {
    console.error("Reset team error:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
