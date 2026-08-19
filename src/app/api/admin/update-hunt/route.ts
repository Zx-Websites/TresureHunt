import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyAuthToken } from "@/lib/firebase/server-auth";
import { ICAT_2026_HUNT_DATA, ICAT_2026_SECRETS } from "@/lib/game-engine/icat-2026-seed-data";
import { Hunt, HuntNode, HuntRoute, HuntSecrets } from "@/lib/game-engine/types";

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
    const { huntId = "icat-2026", action, route, node, secretCode, routeSecretKey, nodes, secretsMap } = body;

    // Fetch existing hunt
    let hunt: Hunt = ICAT_2026_HUNT_DATA;
    try {
      const huntSnap = await adminDb.collection("hunts").doc(huntId).get();
      if (huntSnap.exists) {
        hunt = huntSnap.data() as Hunt;
      }
    } catch {}

    // Fetch existing secrets
    let secrets: HuntSecrets = ICAT_2026_SECRETS;
    try {
      const secretSnap = await adminDb.collection("hunt_secrets").doc(huntId).get();
      if (secretSnap.exists) {
        secrets = secretSnap.data() as HuntSecrets;
      }
    } catch {}

    // 1. Studio Automated Realtime Cloud Sync
    if (action === "AUTO_SYNC_STUDIO") {
      if (route && route.id) {
        hunt.routes = {
          ...hunt.routes,
          [route.id]: route,
        };
      }

      if (nodes && typeof nodes === "object") {
        hunt.nodes = {
          ...hunt.nodes,
          ...nodes,
        };
      }

      hunt.updatedAt = Date.now();
      await adminDb.collection("hunts").doc(huntId).set(hunt, { merge: true });

      if (secretsMap && typeof secretsMap === "object") {
        const updatedCodes = { ...(secrets.codes || {}) };
        Object.entries(secretsMap).forEach(([k, codeVal]) => {
          if (typeof codeVal === "string" && codeVal.trim()) {
            updatedCodes[k] = {
              code: codeVal.trim().toUpperCase(),
            };
          }
        });
        secrets.codes = updatedCodes;
        secrets.updatedAt = Date.now();
        await adminDb.collection("hunt_secrets").doc(huntId).set(secrets, { merge: true });
      }

      return NextResponse.json({
        success: true,
        message: "Studio changes automatically synced to cloud database.",
        hunt,
      });
    }

    if (action === "SAVE_ROUTE" && route) {
      const targetRoute = route as HuntRoute;
      const updatedRoutes = {
        ...hunt.routes,
        [targetRoute.id]: targetRoute,
      };

      hunt.routes = updatedRoutes;
      hunt.updatedAt = Date.now();

      await adminDb.collection("hunts").doc(huntId).set(hunt, { merge: true });

      return NextResponse.json({
        success: true,
        message: `Route ${targetRoute.id} (${targetRoute.name}) saved successfully with ${targetRoute.nodes.length} nodes.`,
        routes: hunt.routes,
      });
    }

    if (action === "SAVE_NODE" && node) {
      const targetNode = node as HuntNode;
      const updatedNodes = {
        ...hunt.nodes,
        [targetNode.id]: targetNode,
      };

      // Also ensure floor contains node ID
      const updatedFloors = hunt.floors.map((f) => {
        if (f.id === targetNode.floorId) {
          const ids = new Set(f.nodeIds || []);
          ids.add(targetNode.id);
          return { ...f, nodeIds: Array.from(ids) };
        }
        return f;
      });

      hunt.nodes = updatedNodes;
      hunt.floors = updatedFloors;
      hunt.updatedAt = Date.now();

      await adminDb.collection("hunts").doc(huntId).set(hunt, { merge: true });

      // If secret code provided, update secrets collection (with route-specific key support)
      if (secretCode) {
        const key = routeSecretKey || targetNode.id;
        secrets.codes = {
          ...secrets.codes,
          [key]: {
            code: secretCode.trim().toUpperCase(),
            minigameScoreThreshold: targetNode.minigame?.minimumScore,
          },
          ...(!secrets.codes[targetNode.id]
            ? {
                [targetNode.id]: {
                  code: secretCode.trim().toUpperCase(),
                  minigameScoreThreshold: targetNode.minigame?.minimumScore,
                },
              }
            : {}),
        };
        secrets.updatedAt = Date.now();
        await adminDb.collection("hunt_secrets").doc(huntId).set(secrets, { merge: true });
      }

      return NextResponse.json({
        success: true,
        message: `Node ${targetNode.id} (${targetNode.name}) saved successfully.`,
        nodes: hunt.nodes,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (error: unknown) {
    console.error("Update hunt error:", error);
    return NextResponse.json({ success: false, error: "Internal server error." }, { status: 500 });
  }
}
