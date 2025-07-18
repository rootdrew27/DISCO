"use client";

import { Role } from "@/types/matches";
import { RoomContext } from "@livekit/components-react";
import { Room } from "livekit-client";
import { Session } from "next-auth";
import { useEffect, useMemo, useState } from "react";
import { DebaterTile } from "./debater-tile";
import { ConnectionDetails } from "@/types/livekit";

interface DiscoAsViewerProps {
  session: Session | null;
  matchData: MatchData;
  role: Role;
}

const CONN_DETAILS_ENDPOINT = "/api/livekit-connection";

export function DiscoAsViewer(props: DiscoAsViewerProps) {
  const [connectionDetails, setConnectionDetails] = useState<
    ConnectionDetails | undefined
  >();

  const room = useMemo(() => new Room(), []);

  useEffect(() => {
    const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
    url.searchParams.append("roomName", props.matchData.id);
    url.searchParams.append("username", props.session?.username ?? "");
    url.searchParams.append("role", props.role);
    // if (props.region) {
    //   url.searchParams.append("region", props.region);
    // }
    fetch(url.toString()).then((connectionDetailsResp) =>
      connectionDetailsResp
        .json()
        .then((connectionDetailsData) =>
          setConnectionDetails(connectionDetailsData)
        )
    );
  }, [props]);

  useEffect(() => {
    if (connectionDetails) {
      room
        .connect(
          connectionDetails.serverUrl,
          connectionDetails.participantToken
        )
        .catch((error) => {
          console.log(error);
        });
    }

    return () => {};
  }, [room, connectionDetails]);

  return (
    <div>
      <RoomContext.Provider value={room}>
        <div className="flex">
          {props.matchData.participantUsernames.map((uname) => (
            <div key={uname}>
              <DebaterTile debaterIdentity={uname} />
            </div>
          ))}
        </div>
      </RoomContext.Provider>
    </div>
  );
}
