import Link from "next/link";

interface ActiveMatchesProps {
  matches: MatchData[];
}

export function ActiveMatches(props: ActiveMatchesProps) {
  const matches = props.matches;

  return (
    <div className="active-matches">
      {matches?.length &&
        matches.map((match: MatchData) => (
          <Link key={match.id} href={"disco/" + match.id}>
            <div className="match-card">
              <h3>
                {match.topic} - {match.format}
              </h3>
              <p>{match.participantUsernames.join(" vs ")}</p>
              <p>{} watching</p>
            </div>
          </Link>
        ))}
    </div>
  );
}
