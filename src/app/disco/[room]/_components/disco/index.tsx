"use client";
import { RoomContext } from "@livekit/components-react";
import { ConnectionState, Room } from "livekit-client";
import { useEffect, useState } from "react";
import { Session } from "next-auth";
import { Role } from "@/types/matches";
import { ForDiscussor } from "./for-discussor";
import { ForViewer } from "./for-viewer";

interface DiscoProps {
  session: Session | null;
  role: Role;
  lkToken: string;
  matchData: MatchData;
}

export function Disco(props: DiscoProps) {
  const lkToken = props.lkToken;
  const [room] = useState(() => new Room({}));

  console.log(lkToken);

  useEffect(() => {
    if (lkToken) {
      room.connect(process.env.NEXT_PUBLIC_LIVEKIT_API_URL!, lkToken);
      return () => {
        if (room.state === ConnectionState.Connected) {
          room.disconnect();
        }
      };
    }
  }, [room, lkToken]);

  return (
    <div className="h-full w-full">
      <RoomContext.Provider value={room}>
        {props.role === Role.DISCUSSOR ? (
          <ForDiscussor session={props.session} matchData={props.matchData} />
        ) : (
          <ForViewer matchData={props.matchData} />
        )}
      </RoomContext.Provider>
    </div>
  );
}
