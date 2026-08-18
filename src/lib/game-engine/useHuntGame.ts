"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/client";
import {
  Hunt,
  TeamProgress,
  ClientHuntNode,
} from "./types";
import { ICAT_2026_HUNT_DATA, ICAT_2026_HUNT_ID } from "./icat-2026-seed-data";
import { sanitizeNodesForClient } from "./route-calculator";
import { soundFx } from "./sound-effects";

export function useHuntGame(
  huntId: string = ICAT_2026_HUNT_ID,
  teamId?: string,
  idToken?: string | null
) {
  const [hunt, setHunt] = useState<Hunt>(ICAT_2026_HUNT_DATA);
  const [progress, setProgress] = useState<TeamProgress | null>(null);
  const [currentFloorId, setCurrentFloorId] = useState<string>("floor-2");
  const [selectedNode, setSelectedNode] = useState<ClientHuntNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [isSubmittingMinigame, setIsSubmittingMinigame] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 1. Subscribe to Hunt configuration
  useEffect(() => {
    if (!huntId) return;

    const huntDocRef = doc(db, "hunts", huntId);
    const unsubHunt = onSnapshot(
      huntDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setHunt(snapshot.data() as Hunt);
        } else {
          // Use default seed data
          setHunt(ICAT_2026_HUNT_DATA);
        }
      },
      (err) => {
        console.warn("Firestore hunt listener fallback to seed data:", err);
        setHunt(ICAT_2026_HUNT_DATA);
      }
    );

    return () => unsubHunt();
  }, [huntId]);

  // 2. Subscribe to Team Progress
  useEffect(() => {
    if (!huntId || !teamId) {
      setProgress(null);
      setLoading(false);
      return;
    }

    const progressDocId = `${huntId}_${teamId}`;
    const progressDocRef = doc(db, "teamProgress", progressDocId);

    const unsubProgress = onSnapshot(
      progressDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as TeamProgress;
          setProgress(data);
        } else {
          // If document does not exist yet, initialize default in-memory starting progress
          const startingRoute = hunt.teams[teamId]?.routeId || "P1";
          const startingNodeId = hunt.startingNodeId || "202";
          const initialProg: TeamProgress = {
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
          setProgress(initialProg);
        }
        setLoading(false);
      },
      (err) => {
        console.warn("Firestore teamProgress listener fallback:", err);
        const startingRoute = hunt.teams[teamId]?.routeId || "P1";
        const startingNodeId = hunt.startingNodeId || "202";
        setProgress({
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
        });
        setLoading(false);
      }
    );

    return () => unsubProgress();
  }, [huntId, teamId, hunt]);

  // 3. Compute Sanitized Client Nodes
  const clientNodes = useMemo(() => {
    return sanitizeNodesForClient(hunt.nodes, progress, hunt.startingNodeId || "202");
  }, [hunt.nodes, progress, hunt.startingNodeId]);

  // 4. Nodes for current floor
  const floorNodes = useMemo(() => {
    return clientNodes.filter((node) => node.floorId === currentFloorId);
  }, [clientNodes, currentFloorId]);

  // 5. Update selected node when clientNodes update
  useEffect(() => {
    if (selectedNode) {
      const updated = clientNodes.find((n) => n.id === selectedNode.id);
      if (updated) {
        setSelectedNode(updated);
      }
    }
  }, [clientNodes]);

  // 6. Submit Code via Server API
  const submitCode = useCallback(
    async (
      nodeId: string,
      enteredCode: string
    ): Promise<{
      success: boolean;
      message: string;
      puzzleLocation?: { clue: string; hint?: string; pieceId?: string } | null;
    }> => {
      if (!teamId || !nodeId || !enteredCode.trim()) {
        soundFx.playAccessDenied();
        return { success: false, message: "Enter a valid clearance code." };
      }

      setIsSubmittingCode(true);
      setActionMessage(null);

      try {
        const res = await fetch("/api/game/unlock", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken || ""}`,
          },
          body: JSON.stringify({
            huntId,
            teamId,
            nodeId,
            enteredCode: enteredCode.trim().toUpperCase(),
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          soundFx.playAccessGranted();
          setActionMessage({ type: "success", text: "ACCESS GRANTED: Sector Cleared!" });
          // Optimistically update local progress if realtime is delayed
          if (progress) {
            const completed = new Set(progress.completedNodes || []);
            completed.add(nodeId);
            const unlocked = (data.nextNodes || []).concat(
              progress.unlockedNodes.filter((id) => id !== nodeId)
            );
            setProgress({
              ...progress,
              completedNodes: Array.from(completed),
              unlockedNodes: Array.from(new Set(unlocked)),
              currentNodeId: data.nextNodes?.[0] || progress.currentNodeId,
              status: data.isHuntCompleted ? "completed" : progress.status,
              updatedAt: Date.now(),
            });
          }
          return {
            success: true,
            message: "Decryption cipher accepted! Sector cleared.",
            puzzleLocation: data.puzzleLocation,
          };
        } else {
          soundFx.playAccessDenied();
          const errMsg = data.error || "ACCESS DENIED: Invalid clearance cipher.";
          setActionMessage({ type: "error", text: errMsg });
          return { success: false, message: errMsg };
        }
      } catch (err: unknown) {
        soundFx.playAccessDenied();
        const errMsg = "Connection failure: could not reach security server.";
        setActionMessage({ type: "error", text: errMsg });
        return { success: false, message: errMsg };
      } finally {
        setIsSubmittingCode(false);
      }
    },
    [huntId, teamId, idToken, progress]
  );

  // 7. Submit Minigame Score via Server API
  const submitMinigameScore = useCallback(
    async (nodeId: string, score: number): Promise<{ success: boolean; passed: boolean; code?: string; message: string }> => {
      if (!teamId || !nodeId) {
        return { success: false, passed: false, message: "Invalid parameters." };
      }

      setIsSubmittingMinigame(true);
      try {
        const res = await fetch("/api/game/minigame-submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken || ""}`,
          },
          body: JSON.stringify({
            huntId,
            teamId,
            nodeId,
            score,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          if (data.passed) {
            soundFx.playAccessGranted();
          }
          return {
            success: true,
            passed: data.passed,
            code: data.awardedCode,
            message: data.message,
          };
        } else {
          return {
            success: false,
            passed: false,
            message: data.error || "Failed to verify neural override score.",
          };
        }
      } catch (err: unknown) {
        return {
          success: false,
          passed: false,
          message: "Network error submitting minigame score.",
        };
      } finally {
        setIsSubmittingMinigame(false);
      }
    },
    [huntId, teamId, idToken]
  );

  // 8. Collect Physical Puzzle Piece via Server API
  const collectPhysicalPiece = useCallback(
    async (pieceId: string): Promise<boolean> => {
      if (!teamId || !pieceId) return false;

      soundFx.playClick();
      try {
        const res = await fetch("/api/game/collect-piece", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken || ""}`,
          },
          body: JSON.stringify({
            huntId,
            teamId,
            pieceId,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          soundFx.playAccessGranted();
          if (progress) {
            const pieces = new Set(progress.collectedPieces || []);
            pieces.add(pieceId);
            setProgress({
              ...progress,
              collectedPieces: Array.from(pieces),
              updatedAt: Date.now(),
            });
          }
          return true;
        }
        return false;
      } catch {
        return false;
      }
    },
    [huntId, teamId, idToken, progress]
  );

  return {
    hunt,
    progress,
    clientNodes,
    floorNodes,
    currentFloorId,
    setCurrentFloorId,
    selectedNode,
    setSelectedNode,
    loading,
    isSubmittingCode,
    isSubmittingMinigame,
    actionMessage,
    setActionMessage,
    submitCode,
    submitMinigameScore,
    collectPhysicalPiece,
  };
}
