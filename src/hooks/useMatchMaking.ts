// React hook for matchmaking
import { useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { QueueStatus } from "@/types/matches";

export interface UseMatchmakingReturn {
  createSocket: () => void;
  destroySocket: () => void;
  socket: Socket | null;
  queueStatus: QueueStatus;
  match: MatchData | null;
  joinQueue: (preferences: MatchPreferences) => void;
  leaveQueue: () => void;
  acceptMatch: (matchId: string) => void;
  rejectMatch: (matchId: string) => void;
}

export function useMatchmaking(): UseMatchmakingReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus>(QueueStatus.IDLE);
  const [match, setMatch] = useState<MatchData | null>(null);
  const pendingJoinPrefRef = useRef<MatchPreferences | null>(null);

  const createSocket = () => {
    const newSocket = io(process.env.NEXT_PUBLIC_MATCHMAKING_SERVER_URL, {
      withCredentials: true,
    });

    // Connection events
    newSocket.on("connect", () => {
      console.log("Connected to matchmaking server");
      setSocket(newSocket);

      // If there's a pending join request, execute it now
      if (pendingJoinPrefRef.current) {
        newSocket.emit("join_queue", pendingJoinPrefRef.current);
        pendingJoinPrefRef.current = null;
      }
    });

    // Matchmaking events
    newSocket.on("queued", (data) => {
      setQueueStatus(QueueStatus.QUEUED);
      console.log(`In queue position ${data.position}`);
    });

    newSocket.on("queue_update", (data) => {
      console.log(`Queue update: ${data.queueSize} users waiting`);
    });

    newSocket.on("already_queued", () => {
      toast.error("Error: You're already in the queue.");
      destroySocket();
    });

    newSocket.on("match_found", (matchData) => {
      console.log("Match Found");
      setMatch(matchData);
      setQueueStatus(QueueStatus.MATCH_FOUND);

      // Show match acceptance UI
      // Auto-reject after 15 seconds if no action
      setTimeout(() => {
        if (queueStatus === QueueStatus.MATCH_FOUND) {
          newSocket.emit("reject_match", matchData.id);
        }
      }, 15000);
    });

    newSocket.on("match_ready", (data) => {
      console.log("Match Ready");
      setQueueStatus(QueueStatus.MATCH_READY);

      const params = new URLSearchParams({
        lkToken: data.lkToken,
        opponents: data.opponents,
      });
      // Navigate to LiveKit room
      window.location.href = `/disco/${data.matchId}?${params}`;
    });

    newSocket.on("match_cancelled", (reason) => {
      toast.info("Match declined by other user(s). Rejoining the queue.");
      setMatch(null);
      setQueueStatus(QueueStatus.QUEUED);
      console.log("Match cancelled:", reason);
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
      destroySocket();
    });

    let reconnAttempts = 0;
    newSocket.on("connect_error", (error) => {
      console.log("Connect error");
      if (newSocket.active) {
        if (reconnAttempts >= 3) {
          toast.error("Issue with Matchmaking. Try refreshing the page.");
          destroySocket();
          return;
        }
        console.log("Automatically attempting reconnect.");
        reconnAttempts += 1;
        // temporary failure, the socket will automatically try to reconnect
      } else {
        // the connection was denied by the server
        // in that case, `socket.connect()` must be manually called in order to reconnect
        console.log(error.message);
        if (error.message === "Authentication failed") {
          window.location.href = "/signin";
        } else {
          try {
            if (reconnAttempts >= 3) {
              console.log("Attempting Reconnect");
              newSocket.connect();
              reconnAttempts += 1;
            } else {
              toast.error("Issue with Matchmaking. Try refreshing the page.");
              reconnAttempts = 0;
              destroySocket();
            }
            // attempt reconnection
          } catch (error) {
            console.error(error);
          }
        }
      }
    });

    newSocket.on("error", (error) => {
      toast.error(`Error on socket server: ${error}`);
      destroySocket();
    });

    setSocket(newSocket);
  };

  const destroySocket = () => {
    console.log("Destroying socket");
    socket?.disconnect();
    setSocket(null);
    setQueueStatus(QueueStatus.IDLE);
    setMatch(null);
    pendingJoinPrefRef.current = null;
  };

  const joinQueue = (preferences: MatchPreferences) => {
    console.log("joining queue");
    if (socket && socket.connected) {
      socket.emit("join_queue", preferences);
    } else {
      // Store the preferences to join when socket connects
      pendingJoinPrefRef.current = preferences;
    }
  };

  const leaveQueue = () => {
    console.log("Leaving queue");
    if (socket) {
      socket.emit("leave_queue");
      setQueueStatus(QueueStatus.IDLE);
    }
  };

  const acceptMatch = (matchId: string) => {
    if (socket) {
      socket.emit("accept_match", matchId);
      setQueueStatus(QueueStatus.ACCEPTING);
    }
  };

  const rejectMatch = (matchId: string) => {
    if (socket) {
      socket.emit("reject_match", matchId);
      setMatch(null);
      setQueueStatus(QueueStatus.QUEUED);
    }
  };

  return {
    createSocket,
    destroySocket,
    socket,
    queueStatus,
    match,
    joinQueue,
    leaveQueue,
    acceptMatch,
    rejectMatch,
  };
}
