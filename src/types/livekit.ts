import { LocalUserChoices } from "@livekit/components-react";

export type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantToken: string;
};

export interface StagingChoices extends LocalUserChoices {
  username: string;
}
