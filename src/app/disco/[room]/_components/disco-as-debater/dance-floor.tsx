"use client";

import { ConnectionDetails, StagingChoices } from "@/types/livekit";
import { RoomContext } from "@livekit/components-react";
import {
  Room,
  RoomEvent,
  RoomOptions,
  TrackPublishDefaults,
  VideoCaptureOptions,
  VideoCodec,
  VideoPresets,
} from "livekit-client";
import { Session } from "next-auth";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { LocalDebater } from "./local-debator";
import { RemoteDebater } from "./remote-debater";

interface DanceFloorProps {
  connectionDetails: ConnectionDetails | undefined;
  stagingChoices: StagingChoices;
  matchData: MatchData;
  session: Session;
  options: {
    hq: boolean;
    codec: VideoCodec;
  };
}

export function DanceFloor(props: DanceFloorProps) {
  const roomOptions = useMemo((): RoomOptions => {
    let videoCodec: VideoCodec | undefined = props.options.codec
      ? props.options.codec
      : "vp9";
    if (videoCodec === "av1" || videoCodec === "vp9") {
      videoCodec = undefined;
    }
    const videoCaptureDefaults: VideoCaptureOptions = {
      deviceId: props.stagingChoices.videoDeviceId ?? undefined,
      resolution: props.options.hq ? VideoPresets.h2160 : VideoPresets.h720,
    };
    const publishDefaults: TrackPublishDefaults = {
      dtx: false,
      videoSimulcastLayers: props.options.hq
        ? [VideoPresets.h1080, VideoPresets.h720]
        : [VideoPresets.h540, VideoPresets.h216],
      videoCodec,
    };
    return {
      videoCaptureDefaults: videoCaptureDefaults,
      publishDefaults: publishDefaults,
      audioCaptureDefaults: {
        deviceId: props.stagingChoices.audioDeviceId ?? undefined,
      },
      adaptiveStream: true,
      dynacast: true,
    };
  }, [props.stagingChoices, props.options.hq, props.options.codec]);

  const room = useMemo(() => new Room(roomOptions), [roomOptions]);

  const router = useRouter();
  const handleOnLeave = useCallback(() => router.push("/"), [router]);
  const handleError = useCallback((error: Error) => {
    console.error(error);
    alert(
      `Encountered an unexpected error, check the console logs for details: ${error.message}`
    );
  }, []);

  useEffect(() => {
    room.on(RoomEvent.Disconnected, handleOnLeave);
    room.on(RoomEvent.MediaDevicesError, handleError);
    if (props.connectionDetails) {
      room
        .connect(
          props.connectionDetails.serverUrl,
          props.connectionDetails.participantToken
        )
        .catch((error) => {
          handleError(error);
        });

      if (props.stagingChoices.videoEnabled) {
        room.localParticipant.setCameraEnabled(true).catch((error) => {
          handleError(error);
        });
      }
      if (props.stagingChoices.audioEnabled) {
        room.localParticipant.setMicrophoneEnabled(true).catch((error) => {
          handleError(error);
        });
      }
    }

    return () => {
      room.off(RoomEvent.Disconnected, handleOnLeave);
      room.off(RoomEvent.MediaDevicesError, handleError);
    };
  }, [
    room,
    props.connectionDetails,
    props.stagingChoices,
    handleError,
    handleOnLeave,
  ]);

  return (
    <div className="lk-room-container">
      <RoomContext.Provider value={room}>
        <div className="w-full">
          <h1>A debate of {props.matchData.topic}</h1>
        </div>
        <div className="mx-10 flex">
          <LocalDebater />
          <RemoteDebater
            opponentIdentity={getOpponentIdentity(
              props.session.username,
              props.matchData
            )}
          />
        </div>
      </RoomContext.Provider>
    </div>
  );
}

function getOpponentIdentity(selfUsername: string, matchData: MatchData) {
  const oppId = matchData.participantUsernames.find(
    (username) => username !== selfUsername
  );
  if (!oppId) throw new Error("No opponent!");
  return oppId;
}
