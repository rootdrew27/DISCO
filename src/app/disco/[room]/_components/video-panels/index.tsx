"use client";

import {
  useTracks,
  useLocalParticipant,
  useRoomContext,
  useConnectionState,
  useRemoteParticipant,
} from "@livekit/components-react";
import { Track, ConnectionState, ParticipantKind } from "livekit-client";
import { useEffect, useRef } from "react";

interface VideoPanelsProps {
  opponentIdentity: string;
}

export function VideoPanels(props: VideoPanelsProps) {
  const room = useRoomContext();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const connectionState = useConnectionState();
  const { localParticipant } = useLocalParticipant();
  const remoteParticipant = useRemoteParticipant({
    kind: ParticipantKind.STANDARD,
    identity: props.opponentIdentity,
  });

  useEffect(() => {
    if (connectionState === ConnectionState.Connecting)
      room.localParticipant
        .createTracks({ audio: true, video: true })
        .then((tracks) => {
          tracks.forEach((track) => {
            room.localParticipant.publishTrack(track);
          });
        });
  }, [room, connectionState]);

  useTracks([Track.Source.Camera, Track.Source.Microphone])
    .filter((track) => track.participant.identity === localParticipant.identity)
    .forEach((track) => {
      if (localVideoRef.current) {
        track.publication.track?.attach(localVideoRef.current);
      }
    });

  useTracks([Track.Source.Camera, Track.Source.Microphone])
    .filter(
      (track) => track.participant.identity === remoteParticipant?.identity
    )
    .forEach((track) => {
      if (remoteVideoRef.current) {
        track.publication.track?.attach(remoteVideoRef.current);
      }
    });

  return (
    <div className="relative h-screen w-full bg-gray-900">
      {/* Remote participant(s) - main view */}
      <div className="h-full w-full">
        {remoteParticipant ? (
          <div>
            <video ref={remoteVideoRef} width="100%" />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white">
            <p className="text-xl">Waiting for other participants...</p>
          </div>
        )}
      </div>

      {/* Local participant - picture-in-picture */}
      <div className="absolute right-4 bottom-4 h-36 w-48 overflow-hidden rounded-lg border-2 border-gray-600 bg-gray-800 shadow-lg">
        <video ref={localVideoRef} width="100%" />
      </div>
    </div>
  );
}
