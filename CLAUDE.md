# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Disco is a live video discussion platform that facilitates both casual conversations and formal debates with AI-assisted features. The platform supports multiple discussion formats including traditional debates, dynamic debates, Oxford-style debates, panel discussions, and town halls.

### Key Features
- Real-time video discussions with dynamic layouts
- AI agents for fact-checking, facilitation, and summarization
- Interactive viewer engagement through chat, polls, and voting
- Multiple discussion formats from casual to formal debates
- Profile system with reputation scoring and expertise tracking
- Resource management and knowledge base integration

## Technology Stack

- **Frontend**: Next.js 15 with React 19, TypeScript, Tailwind CSS 4
- **Backend**: Node.js (planned: GraphQL, PostgreSQL, MongoDB, DynamoDB)
- **AI/ML**: Python and/or Node.js (planned)
- **Real-time Video**: LiveKit (planned)
- **Authentication**: Auth.js (next-auth)

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
docs/
├── Specs.md            # Complete product specifications
├── TechnicalSpecs.md   # Technical implementation details
└── Tasks.md            # Development tasks and progress
```

## Configuration

- **TypeScript**: Configured with strict mode and path aliases (`@/*` → `./src/*`)
- **ESLint**: Next.js core-web-vitals + TypeScript + Prettier integration
- **Next.js**: Turbopack enabled for dev, custom dev origins allowed
- **Tailwind CSS**: Version 4 with PostCSS integration

## Key Architectural Concepts

### Discussion Types
The platform supports 6 main discussion formats:
1. **Casual Discussions**: Free-flowing conversations
2. **Traditional Debate**: Classic two-sided format with structured timing
3. **Dynamic Debate**: Adaptive format based on polls and AI suggestions
4. **Oxford-Style Debate**: Motion-based with formal propositions
5. **Panel Discussion**: Multi-perspective exploration
6. **Town Hall**: Community-driven discussions

### AI Agent System
Three primary AI agents assist discussions:
- **Facilitator Agent**: Topic suggestions and guidance
- **Fact-Checker Agent**: Real-time claim verification
- **Summarizer Agent**: Key point extraction and reporting

### Scoring System
- Point-based evaluation for formal debates
- Categories: Argument Quality, Evidence Usage, Rebuttal Effectiveness, Presentation
- Deductions for logical fallacies, unsubstantiated claims, personal attacks

## Development Guidelines

- Use existing components and patterns from the codebase
- Follow the established TypeScript configuration with strict mode
- Maintain consistency with ESLint and Prettier configurations
- The project uses Next.js App Router - place components in appropriate directories
- Always run `npm run lint` and `npm run format` before committing changes

## Planned Features

- Multi-database architecture (MongoDB + DynamoDB)
- Real-time video streaming with LiveKit
- WebRTC for peer-to-peer communication
- Advanced AI integration for content moderation and assistance
- Comprehensive user profiles and reputation systems
- Monetization features including ticketed events and subscriptions