"use client";
import { useCallback, useEffect, useState } from "react";
import { Session } from "next-auth";
import { Role } from "@/types/matches";
import { ConnectionDetails, StagingChoices } from "@/types/livekit";
import { StagingRoom } from "./staging-room";
import { DanceFloor } from "./dance-floor";

interface DiscoAsDebaterProps {
  session: Session;
  matchData: MatchData;
  role: Role;
  isStaging: boolean;
}

const StagingDefaults: StagingChoices = {
  videoEnabled: true,
  audioEnabled: true,
  videoDeviceId: "default",
  audioDeviceId: "default",
  username: "",
};

const CONN_DETAILS_ENDPOINT = "/api/livekit-connection";
const STAGING_TIME = 15;

export function DiscoAsDebater(props: DiscoAsDebaterProps) {
  const [isStaging, setIsStaging] = useState(props.isStaging);
  const [stagingChoices, setStagingChoices] =
    useState<StagingChoices>(StagingDefaults);
  const [connectionDetails, setConnectionDetails] = useState<
    ConnectionDetails | undefined
  >(undefined);

  console.log(isStaging);

  const handleStagingSubmit = useCallback(async (values: StagingChoices) => {
    setIsStaging(false);
    setStagingChoices(values);
    const url = new URL(CONN_DETAILS_ENDPOINT, window.location.origin);
    url.searchParams.append("roomName", props.matchData.id);
    url.searchParams.append("username", props.session.username);
    url.searchParams.append("role", props.role);
    // if (props.region) {
    //   url.searchParams.append("region", props.region);
    // }
    const connectionDetailsResp = await fetch(url.toString());
    const connectionDetailsData = await connectionDetailsResp.json();
    setConnectionDetails(connectionDetailsData);
  }, []);

  const handlePreJoinError = useCallback((e: Error) => console.error(e), []);

  useEffect(() => {
    if (!isStaging) {
      handleStagingSubmit(StagingDefaults);
    }
  }, []);

  return (
    <div className="h-full w-full">
      {isStaging ? (
        <div style={{ display: "grid", placeItems: "center", height: "100%" }}>
          <StagingRoom
            defaults={StagingDefaults}
            stagingTime={STAGING_TIME}
            onSubmit={handleStagingSubmit}
            onError={handlePreJoinError}
            matchData={props.matchData}
          />
        </div>
      ) : (
        <DanceFloor
          connectionDetails={connectionDetails}
          stagingChoices={stagingChoices ?? StagingDefaults}
          matchData={props.matchData}
          session={props.session}
          options={{ hq: true, codec: "h265" }}
        />
      )}
    </div>
  );
}
