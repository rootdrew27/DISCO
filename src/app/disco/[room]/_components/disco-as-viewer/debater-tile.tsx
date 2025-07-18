"use client";

import { useParticipantTracks } from "@livekit/components-react";
import { Track } from "livekit-client";
import { useEffect, useMemo, useRef } from "react";

interface DebaterTileProps {
  debaterIdentity: string;
}

export function DebaterTile(props: DebaterTileProps) {
  const videoRef = useRef(null);

  const debaterTracks = useParticipantTracks(
    [Track.Source.Camera, Track.Source.Microphone],
    props.debaterIdentity
  );

  const videoTrack = useMemo(
    () =>
      debaterTracks?.filter((track) => track.source === Track.Source.Camera)[0],
    [debaterTracks]
  );

  // const audioTrack = useMemo(
  //   () =>
  //     debaterTracks?.filter(
  //       (track) => track.source === Track.Source.Microphone
  //     )[0],
  //   [debaterTracks]
  // );

  useEffect(() => {
    if (videoRef.current && videoTrack) {
      videoTrack.publication.track?.attach(videoRef.current);
    }

    return () => {
      videoTrack?.publication.track?.detach();
    };
  }, [videoTrack]);

  return (
    <div>
      <video ref={videoRef} width="1280" height="720" className="rounded-sm" />
    </div>
  );
}
