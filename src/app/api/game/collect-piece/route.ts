import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/firebase/server-auth";
import { TeamProgress } from "@/lib/game-engine/types";

export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuthToken(req);
    if (!user) {
      return NextResponse.json({ success: false, error: "UNAUTHORIZED: Invalid security token." }, { status: 401 });
    }

    const body = await req.json();
    const { huntId, teamId, pieceId } = body;

    if (!huntId || !teamId || !pieceId) {
      return NextResponse.json(
        { success: false, error: "BAD REQUEST: Missing required parameters." },
        { status: 400 }
      );
    }

    const progressDocId = `${huntId}_${teamId}`;
    const progressRef = adminDb.collection("teamProgress").doc(progressDocId);

    const progressSnap = await progressRef.get();
    if (!progressSnap.exists) {
      return NextResponse.json({ success: false, error: "TEAM ERROR: Team progress not initialized." }, { status: 404 });
    }

    const progress = progressSnap.data() as TeamProgress;

    // Check if already eliminated
    if (progress.status === "lost" || progress.status === "disqualified") {
      return NextResponse.json(
        { success: false, error: "MISSION FAILED: Your squad has been eliminated from the competition." },
        { status: 403 }
      );
    }

    const pieces = new Set(progress.collectedPieces || []);
    pieces.add(pieceId);

    const updatedPieces = Array.from(pieces);
    await progressRef.set(
      {
        collectedPieces: updatedPieces,
        updatedAt: Date.now(),
      },
      { merge: true }
    );

    // 18 Puzzle Pieces & 3-Team Elimination Check:
    // Once 3 teams reach 6 pieces (18 total pieces claimed), any team with < 6 pieces is eliminated immediately!
    try {
      const allProgressSnaps = await adminDb
        .collection("teamProgress")
        .where("huntId", "==", huntId)
        .get();

      const teamsData: TeamProgress[] = allProgressSnaps.docs.map(
        (d) => d.data() as TeamProgress
      );

      // Overwrite current team with updated pieces
      const currentTeamIdx = teamsData.findIndex((t) => t.teamId === teamId);
      if (currentTeamIdx !== -1) {
        teamsData[currentTeamIdx].collectedPieces = updatedPieces;
      }

      const qualifiedTeams = teamsData.filter(
        (t) => (t.collectedPieces?.length || 0) >= 6 && t.status !== "disqualified"
      );

      if (qualifiedTeams.length >= 3) {
        const batch = adminDb.batch();
        teamsData.forEach((t) => {
          if (
            (t.collectedPieces?.length || 0) < 6 &&
            t.status === "active"
          ) {
            const docRef = adminDb.collection("teamProgress").doc(`${huntId}_${t.teamId}`);
            batch.set(
              docRef,
              {
                status: "lost",
                loserReason:
                  "All 18 physical puzzle pieces have been retrieved by the top 3 squads. Your squad has been eliminated.",
                updatedAt: Date.now(),
              },
              { merge: true }
            );
          }
        });
        await batch.commit();
      }
    } catch (eliminationErr) {
      console.warn("Piece collection elimination check error:", eliminationErr);
    }

    return NextResponse.json({
      success: true,
      message: "Physical artifact registered to squad cache.",
      collectedPieces: updatedPieces,
    });
  } catch (error: unknown) {
    console.error("Collect piece error:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
