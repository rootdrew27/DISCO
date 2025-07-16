"use client";

import { Session } from "next-auth";
import {
  useTracks,
  useLocalParticipant,
  useRoomContext,
  useConnectionState,
  useRemoteParticipant,
} from "@livekit/components-react";
import { Track, ConnectionState, ParticipantKind } from "livekit-client";
import { useEffect, useRef } from "react";

interface ForDiscussorProps {
  session: Session | null;
  matchData: MatchData;
}

export function ForDiscussor(props: ForDiscussorProps) {
  const room = useRoomContext();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const connectionState = useConnectionState();
  const { localParticipant } = useLocalParticipant();
  const opponentIdentity = props.matchData.participantUsernames.find(
    (pUsername) => pUsername !== props.session?.username
  );
  const opponent = useRemoteParticipant({
    kind: ParticipantKind.STANDARD,
    identity: opponentIdentity,
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
    .filter((track) => track.participant.identity === opponent?.identity)
    .forEach((track) => {
      if (remoteVideoRef.current) {
        track.publication.track?.attach(remoteVideoRef.current);
      }
    });

  return (
    <div className="relative w-3/4 bg-gray-500 p-4">
      {/* Remote participant(s) - main view */}
      <div className="h-full w-full">
        {opponent ? (
          <div>
            <video ref={remoteVideoRef} width="100%" />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white">
            <p className="text-xl">Waiting for other discussor...</p>
          </div>
        )}
      </div>

      {/* Local participant - picture-in-picture */}
      <div className="absolute right-4 bottom-4 h-24 w-42 overflow-hidden rounded-lg border-2 border-gray-600 bg-gray-800 shadow-lg">
        <video ref={localVideoRef} width="100%" />
      </div>
    </div>
  );
}
