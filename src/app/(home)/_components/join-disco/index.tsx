"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useMatchmaking } from "@/hooks/useMatchMaking";

import { MatchFound } from "./match-found";

interface JoinDiscoProps {
  username: string;
}

export function JoinDisco(props: JoinDiscoProps) {
  const [isSearchingForMatch, setIsSearchingForMatch] = useState(false);
  const matchmaking = useMatchmaking();

  const handleStartSearch = async () => {
    setIsSearchingForMatch(true);
    matchmaking.createSocket();
    matchmaking.joinQueue({ format: "casual", topic: "cats" });
    return;
  };

  const handleCancelSearch = () => {
    setIsSearchingForMatch(false);
    matchmaking.leaveQueue();
    matchmaking.destroySocket();
  };

  useEffect(() => {
    if (!matchmaking.socket) {
      setIsSearchingForMatch(false);
    }
  }, [matchmaking.socket]);

  return (
    <>
      {!isSearchingForMatch ? (
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
