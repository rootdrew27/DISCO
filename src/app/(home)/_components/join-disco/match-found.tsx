"use client";

import { useEffect, useState } from "react";
import { UseMatchmakingReturn } from "@/hooks/useMatchMaking";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { QueueStatus } from "@/types/matches";
import { toast } from "sonner";

interface MatchFoundProps {
  onCancel: () => void;
  matchmaking: UseMatchmakingReturn;
  username: string;
}

export function MatchFound({
  onCancel,
  matchmaking,
  username,
}: MatchFoundProps) {
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (matchmaking?.queueStatus === QueueStatus.MATCH_FOUND) {
      setCountdown(15);
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            toast.info("Match Expired! You have been removed from the queue.");
            onCancel();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [matchmaking?.queueStatus, onCancel]);

  return (
    <>
      {matchmaking.queueStatus === QueueStatus.QUEUED && (
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <div className="text-sm text-gray-500">Searching for match...</div>
          </div>
          <Button onClick={onCancel} className="bg-red-600 hover:bg-red-700">
            Cancel
          </Button>
        </div>
      )}
      <Dialog open={matchmaking?.queueStatus === QueueStatus.MATCH_FOUND}>
        <DialogContent className="sm:max-w-md" onClickClose={onCancel}>
          <DialogHeader>
            <DialogTitle>Match Found!</DialogTitle>
            <DialogDescription>
              Ready to discuss <strong>{matchmaking?.match?.topic}</strong> in a{" "}
              <strong>{matchmaking?.match?.format}</strong> format with{" "}
              <strong>{getOpponentNames(matchmaking.match, username)}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex gap-3">
            <Button
              onClick={() => matchmaking?.acceptMatch(matchmaking.match!.id)}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              Accept
            </Button>
            <Button
              onClick={() => matchmaking?.rejectMatch(matchmaking.match!.id)}
              className="flex-1 bg-red-600 hover:bg-red-700"
            >
              Reject
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Auto-rejects in:</span>
              <span className="font-medium">{countdown}s</span>
            </div>
            <Progress value={((15 - countdown) / 15) * 100} className="h-2" />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function getOpponentNames(match: MatchData | null, username: string) {
  if (!match) {
    return "";
  }
  const opponents = match.participantUsernames.filter(
    (participantUsername) => participantUsername !== username
  );
  if (opponents.length > 1) {
    return (
      opponents.slice(0, -1).join(", ") +
      ", and " +
      opponents.at(-1)?.toString()
    );
  } else {
    return opponents.at(0)?.toString();
  }
}
