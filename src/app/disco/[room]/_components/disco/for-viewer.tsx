"use client";

import { useTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useRef } from "react";

interface ForViewerProps {
  matchData: MatchData;
}

export function ForViewer(props: ForViewerProps) {
  const debater1VideoRef = useRef<HTMLVideoElement>(null);
  const debater2VideoRef = useRef<HTMLVideoElement>(null);
  const [d1Identity, d2Identity] = props.matchData.participantUsernames;

  useTracks([Track.Source.Camera, Track.Source.Microphone])
    .filter((track) => track.participant.identity === d1Identity)
    .forEach((track) => {
      if (debater1VideoRef.current) {
        track.publication.track?.attach(debater1VideoRef.current);
      }
    });
  useTracks([Track.Source.Camera, Track.Source.Microphone])
    .filter((track) => track.participant.identity === d2Identity)
    .forEach((track) => {
      if (debater2VideoRef.current) {
        track.publication.track?.attach(debater2VideoRef.current);
      }
    });

  return (
    <div className="flex h-full w-full">
      <div className="flex-1">
        <video ref={debater1VideoRef} width="100%" />
      </div>
      <div className="flex-1">
        <video ref={debater2VideoRef} width="100%" />
      </div>
    </div>
  );
}
