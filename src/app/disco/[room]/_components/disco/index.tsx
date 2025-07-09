"use client";
import { RoomContext } from "@livekit/components-react";
import { Room } from "livekit-client";
import { useEffect, useState } from "react";
import { VideoPanels } from "../video-panels";
import { Session } from "next-auth";
import { Role } from "@/types/matches";

interface DiscoProps {
  session: Session | null;
  role: Role;
  lkToken: string;
  opponents: string[];
}

export function Disco(props: DiscoProps) {
  const [room] = useState(() => new Room({}));

  const lkToken = props.lkToken;

  useEffect(() => {
    if (lkToken) {
      room.connect(process.env.NEXT_PUBLIC_LIVEKIT_API_URL!, lkToken);
      return () => {
        room.disconnect();
      };
    }
  }, [room, lkToken]);

  return (
    <div className="h-screen w-full overflow-hidden">
      <RoomContext.Provider value={room}>
        <VideoPanels opponentIdentity={props.opponents.at(0)!} />
      </RoomContext.Provider>
    </div>
  );
}
