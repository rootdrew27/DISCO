# DISCO - Online Discussion Platform

A live video discussion platform that facilitates both casual conversations and formal debates with real-time matchmaking and video streaming capabilities.

## Tech Stack

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS 4
- **Matchmaking Server**: Express.js with Socket.io, Redis for state management
- **LiveKit Token Server**: Express.js with LiveKit Server SDK for livekit token generation
- **Video Streaming**: LiveKit for real-time video/audio communication and (eventually) agents
- **Authentication**: Auth.js (next-auth) with JWT strategy
- **Database**: Redis for real-time data. MongoDB for user profiles. Plan to replace MongoDB with Postgres and DynamoDB

## Architecture

### Matchmaking Server (`match-making-server/`)
A dedicated Express server handling user matchmaking with the following features:
- **Socket.io Integration**: Real-time bidirectional communication
- **Redis Queue Management**: Persistent user queues and match state
- **Preference-based Matching**: Users matched by topic and discussion format (mock implementation)
- **Match Lifecycle**: Pending → Accepted/Rejected → Active/Cancelled workflow
- **LiveKit Integration**: Automatic token generation upon match finalization (via request to livekit-token-server)
- **Webhook Handling**: LiveKit room events for cleanup and state management

Key components:
- `MatchmakingService`: Core matching logic and socket event handling
- Authentication middleware using next-auth JWT validation
- Redis-based persistence for queue and match state

### LiveKit Token Server (`livekit-token-server/`)
A secure token generation service for LiveKit video sessions:
- **JWT Token Generation**: Creates secure access tokens for video rooms
- **Batch Token Creation**: Generates tokens for multiple participants simultaneously
- **Room-based Permissions**: Configures publish/subscribe permissions per user

Token features:
- Camera and microphone publishing rights
- Room join permissions with configurable TTL
- Data publishing capabilities for chat/metadata
- Username-based identity management

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Format code
npm run format
```

### Running the Servers

```bash
# Start LiveKit server
livekit-server --config <your_config>

# Start nextjs app
npm run dev

# Start matchmaking server (development)
cd match-making-server
npm run build && npm start

# Start LiveKit token server
cd livekit-token-server
npm run build && npm start
```

## Interesting Implementation Details

### Real-time Matchmaking Flow
1. **User Queue Entry**: Users join queue with preferences (topic, format)
2. **Compatibility Matching**: Algorithm pairs users with identical preferences (for now)
3. **Pending Match Creation**: Both users receive match notification
4. **Acceptance Phase**: Both users must accept within timeout period
5. **Token Generation**: LiveKit tokens created for video room access
6. **Match Finalization**: Users redirected to video discussion room

### Redis Data Architecture
- **`queue`**: Hash storing queued users with preferences and metadata
- **`pendingMatches`**: Hash of matches awaiting user acceptance
- **`activeMatches`**: Hash of confirmed matches currently in progress
- Automatic cleanup via LiveKit webhooks when rooms finish

## Development Notes

This project uses Next.js App Router with TypeScript in strict mode. The matchmaking and token servers are standalone Node.js applications that communicate with the main Next.js app.

### Key development guidelines:
- Formatting and Linting are done via pre-commit hook
- Tests are preformed via a pre-push hook

### Future

- Upgrade match recommendation/filtering system with one or more of the following:
    - Relational DB 
    - Serverless function or MicroService
    - Redis Stack
    - Vector DB

- 