"use client";

import React, { useEffect, useState } from "react";
import "@livekit/components-styles/prefabs";
import {
  LocalVideoTrack,
  LocalAudioTrack,
  LocalTrack,
  Mutex,
  createLocalTracks,
  CreateLocalTracksOptions,
  Track,
  facingModeFromLocalTrack,
} from "livekit-client";
import { StagingChoices } from "@/types/livekit";
import {
  ParticipantPlaceholder,
  TrackToggle,
  usePersistentUserChoices,
} from "@livekit/components-react";
import { MediaDeviceMenu } from "@/components/media-device-menu";
import { Button } from "@/components/ui/button";
import { CircularTimer } from "@/components/circular-timer";
import { useCountdownTimer } from "@/hooks/useCountdownTimer";
import { cn } from "@/lib/utils";

export function roomOptionsStringifyReplacer(key: string, val: unknown) {
  if (key === "processor" && val && typeof val === "object" && "name" in val) {
    return val.name;
  }
  if (key === "e2ee" && val) {
    return "e2ee-enabled";
  }
  return val;
}

export function usePreviewTracks(
  options: CreateLocalTracksOptions,
  onError?: (err: Error) => void
) {
  const [tracks, setTracks] = React.useState<LocalTrack[]>();

  const trackLock = React.useMemo(() => new Mutex(), []);

  React.useEffect(() => {
    let needsCleanup = false;
    let localTracks: Array<LocalTrack> = [];
    trackLock.lock().then(async (unlock) => {
      try {
        if (options.audio || options.video) {
          localTracks = await createLocalTracks(options);

          if (needsCleanup) {
            localTracks.forEach((tr) => tr.stop());
          } else {
            setTracks(localTracks);
          }
        }
      } catch (e) {
        if (onError && e instanceof Error) {
          onError(e);
        } else {
          console.error(e);
        }
      } finally {
        unlock();
      }
    });

    return () => {
      needsCleanup = true;
      localTracks.forEach((track) => {
        track.stop();
      });
    };
  }, [
    JSON.stringify(options, roomOptionsStringifyReplacer),
    onError,
    trackLock,
  ]);

  return tracks;
}

interface StagingRoomProps {
  defaults: StagingChoices;
  stagingTime: number; // seconds
  onSubmit: (values: StagingChoices) => void;
  onError: (e: Error) => void;
  matchData: MatchData;
}

export function StagingRoom(props: StagingRoomProps) {
  const {
    userChoices: initialUserChoices,
    saveAudioInputDeviceId,
    saveAudioInputEnabled,
    saveVideoInputDeviceId,
    saveVideoInputEnabled,
  } = usePersistentUserChoices({
    defaults: props.defaults,
    preventSave: false,
    preventLoad: false,
  });

  const [userChoices, setUserChoices] = React.useState(initialUserChoices);

  // Initialize device settings
  const [audioEnabled, setAudioEnabled] = React.useState<boolean>(
    userChoices.audioEnabled
  );
  const [videoEnabled, setVideoEnabled] = React.useState<boolean>(
    userChoices.videoEnabled
  );
  const [audioDeviceId, setAudioDeviceId] = React.useState<string>(
    userChoices.audioDeviceId
  );
  const [videoDeviceId, setVideoDeviceId] = React.useState<string>(
    userChoices.videoDeviceId
  );

  // Save user choices to persistent storage.
  React.useEffect(() => {
    saveAudioInputEnabled(audioEnabled);
  }, [audioEnabled, saveAudioInputEnabled]);
  React.useEffect(() => {
    saveVideoInputEnabled(videoEnabled);
  }, [videoEnabled, saveVideoInputEnabled]);
  React.useEffect(() => {
    saveAudioInputDeviceId(audioDeviceId);
  }, [audioDeviceId, saveAudioInputDeviceId]);
  React.useEffect(() => {
    saveVideoInputDeviceId(videoDeviceId);
  }, [videoDeviceId, saveVideoInputDeviceId]);

  const tracks = usePreviewTracks(
    {
      audio: audioEnabled
        ? { deviceId: initialUserChoices.audioDeviceId }
        : false,
      video: videoEnabled
        ? { deviceId: initialUserChoices.videoDeviceId, processor: undefined } //videoProcessor }
        : false,
    },
    props.onError
  );

  const videoEl = React.useRef(null);

  const videoTrack = React.useMemo(
    () =>
      tracks?.filter(
        (track) => track.kind === Track.Kind.Video
      )[0] as LocalVideoTrack,
    [tracks]
  );

  const facingMode = React.useMemo(() => {
    if (videoTrack) {
      const { facingMode } = facingModeFromLocalTrack(videoTrack);
      return facingMode;
    } else {
      return "undefined";
    }
  }, [videoTrack]);

  const audioTrack = React.useMemo(
    () =>
      tracks?.filter(
        (track) => track.kind === Track.Kind.Audio
      )[0] as LocalAudioTrack,
    [tracks]
  );

  React.useEffect(() => {
    if (videoEl.current && videoTrack) {
      videoTrack.unmute();
      videoTrack.attach(videoEl.current);
    }

    return () => {
      videoTrack?.detach();
    };
  }, [videoTrack]);

  const [isValid, setIsValid] = useState<boolean>();

  const calculateTimeLeft = () => {
    return (
      props.stagingTime -
      Math.floor((Date.now() - props.matchData.startedAt) / 1000)
    );
  };

  console.log(props.stagingTime);

  const { timeLeft, stop: stopTimer } = useCountdownTimer({
    totalTime: props.stagingTime,
    calculateTimeLeft: calculateTimeLeft,
    onComplete: () => {
      const event = new Event("submit");
      handleSubmit(event);
    },
    autoStart: true,
  });

  const handleValidation = () => {
    // TODO: Implement validation
    console.log("Implement validation!");
    return true;
  };

  useEffect(() => {
    const newUserChoices = {
      username: "",
      videoEnabled,
      videoDeviceId,
      audioEnabled,
      audioDeviceId,
    };
    setUserChoices(newUserChoices);
    setIsValid(handleValidation());
  }, [videoEnabled, audioEnabled, audioDeviceId, videoDeviceId]);

  function handleSubmit(event: React.FormEvent | Event) {
    event.preventDefault();
    stopTimer();
    if (handleValidation()) {
      if (typeof props.onSubmit === "function") {
        props.onSubmit(userChoices);
      }
    } else {
      console.warn("Validation failed with: ", userChoices);
    }
  }

  return (
    <div className="flex w-1/2 flex-col items-center">
      <div className="h-[280px] w-[448px]">
        {videoTrack && (
          <video
            ref={videoEl}
            width="1280"
            height="720"
            className={cn("rounded-sm", facingMode === "user" && "flip-video")}
            // data-lk-facing-mode={facingMode}
          />
        )}
        {(!videoTrack || !videoEnabled) && (
          <div className="">
            <ParticipantPlaceholder />
          </div>
        )}
      </div>
      <div className="flex text-sm">
        <div className="flex w-[200px] flex-1 flex-wrap justify-center">
          <Button asChild size="sm" className="rounded-r-none">
            <TrackToggle
              initialState={audioEnabled}
              source={Track.Source.Microphone}
              onChange={(enabled) => setAudioEnabled(enabled)}
            >
              Microphone
            </TrackToggle>
          </Button>
          <MediaDeviceMenu
            initialSelection={audioDeviceId}
            kind="audioinput"
            disabled={false}
            tracks={{ audioinput: audioTrack }}
            onActiveDeviceChange={(_, id) => setAudioDeviceId(id)}
          />
        </div>
        <div className="flex w-[200px] flex-1 flex-wrap justify-center">
          <Button asChild size="sm" className="rounded-r-none">
            <TrackToggle
              initialState={videoEnabled}
              source={Track.Source.Camera}
              onChange={(enabled) => setVideoEnabled(enabled)}
            >
              Camera
            </TrackToggle>
          </Button>
          <MediaDeviceMenu
            initialSelection={videoDeviceId}
            kind="videoinput"
            disabled={false}
            tracks={{ videoinput: videoTrack }}
            onActiveDeviceChange={(_, id) => setVideoDeviceId(id)}
          />
        </div>
      </div>
      <div className="flex items-center gap-x-2">
        <form className="w-full">
          {/* <input
          className="lk-form-control"
          id="username"
          name="username"
          type="text"
          defaultValue={username}
          placeholder=""
          onChange={(inputEl) => setUsername(inputEl.target.value)}
          autoComplete="off"
        /> */}
          <Button
            className=""
            type="submit"
            onClick={handleSubmit}
            disabled={!isValid}
          >
            To the Dance Floor
          </Button>
        </form>
        <CircularTimer
          timeLeft={timeLeft}
          totalTime={props.stagingTime}
          className="mt-0.5 text-sm"
        />
      </div>
    </div>
  );
}
