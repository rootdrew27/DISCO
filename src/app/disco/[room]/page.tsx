import { auth } from "@/auth";
import { Disco } from "./_components/disco";
import { Role } from "@/types/matches";

type Params = Promise<{ matchId: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function DiscoPage(props: {
  params: Params;
  searchParams: SearchParams;
}) {
  const params = await props.params;
  const roomName = params.matchId;

  const searchParams = await props.searchParams;
  const lkToken = searchParams.lkToken as string;
  const opponents = (searchParams.opponents as string).split(",");

  const session = await auth();
  let role;
  if (session) {
    role = await getRole(roomName, session.username);
  } else {
    role = Role.VIEWER;
  }

  return (
    <Disco
      session={session}
      role={role}
      lkToken={lkToken}
      opponents={opponents}
    />
  );
}

async function getRole(roomName: string, username: string): Promise<Role> {
  const searchParams = new URLSearchParams({
    roomName: roomName,
    username: username,
  });

  const url = new URL(
    `/role?${searchParams}`,
    process.env.NEXT_PUBLIC_MATCHMAKING_SERVER_URL
  );

  const res = await fetch(url);
  const data = await res.json();
  return data.role;
}
