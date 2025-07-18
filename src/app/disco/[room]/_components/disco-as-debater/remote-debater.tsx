import { cn } from "@/lib/utils";
import { useRemoteParticipant, useTracks } from "@livekit/components-react";
import {
  facingModeFromLocalTrack,
  ParticipantKind,
  Track,
} from "livekit-client";
import { useEffect, useMemo, useRef } from "react";

interface RemoteDebaterProps {
  opponentIdentity: string;
}

export function RemoteDebater(props: RemoteDebaterProps) {
  const opponent = useRemoteParticipant({
    identity: props.opponentIdentity,
    kind: ParticipantKind.STANDARD,
  });
  const videoRef = useRef<HTMLVideoElement>(null);

  const localTracks = useTracks([
    Track.Source.Camera,
    Track.Source.Microphone,
  ]).filter((track) => track.participant.identity === opponent?.identity);

  const videoTrack = useMemo(
    () =>
      localTracks?.filter((track) => track.source === Track.Source.Camera)[0],
    [localTracks]
  );

  const facingMode = useMemo(() => {
    if (videoTrack?.publication.track?.mediaStreamTrack) {
      const { facingMode } = facingModeFromLocalTrack(
        videoTrack.publication.track?.mediaStreamTrack
      );
      return facingMode;
    } else {
      return "undefined";
    }
  }, [videoTrack?.publication.track?.mediaStreamTrack]);

  useEffect(() => {
    if (videoTrack && videoRef.current) {
      videoTrack.publication.track?.attach(videoRef.current);
    }
  }, [videoTrack]);

  return (
    <div className="bg-gray-500 p-5">
      <video
        ref={videoRef}
        className={cn("rounded-sm", facingMode === "user" && "flip-video")}
      />
    </div>
  );
}
