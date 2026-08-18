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
