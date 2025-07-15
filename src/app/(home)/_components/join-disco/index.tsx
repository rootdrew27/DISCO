"use client";
import { Button } from "@/components/ui/button";
import { useMatchmaking } from "@/hooks/useMatchMaking";

import { MatchFound } from "./match-found";
import { QueueStatus } from "@/types/matches";

interface JoinDiscoProps {
  username: string;
}

export function JoinDisco(props: JoinDiscoProps) {
  const matchmaking = useMatchmaking();

  const handleStartSearch = async () => {
    matchmaking.createSocket();
    matchmaking.joinQueue({ format: "casual", topic: "cats" });
    return;
  };

  const handleCancelSearch = () => {
    matchmaking.leaveQueue();
    matchmaking.destroySocket();
  };

  return (
    <>
      {matchmaking.queueStatus === QueueStatus.IDLE ? (
        <Button
          onClick={handleStartSearch}
          className="h-24 w-24 rounded-full bg-black"
        >
          DISCO
        </Button>
      ) : (
        <MatchFound
          onCancel={handleCancelSearch}
          matchmaking={matchmaking}
          username={props.username}
        />
      )}
    </>
  );
}
