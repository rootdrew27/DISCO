# Project Specifications

## Overview
A live video discussion platform that facilitates both casual conversations and formal debates, with Agentic assistance, ample opportunites for live interaction, and community engagement features.

## Aesthetics

- Reflective?
- Chromatic Textures?

### Light Mode
- Light Blue (e.g. baby blue or sky blue)
- Whites
- Silver
- Minimal

### Dark Mode
- Silver
- Blacks
- Minimal light blue


## Profile System
User or Organization profile page

**Components**
- Name, Bio, Interests, Expertise Areas
- Discussion History & Statistics
  - Win/Loss record (formal debates)
  - Topic expertise badges
- Pinned discussion snippets
- Reputation score
- Links to other socials/contact info

## Discussion Room

### Casual Discussions
Open-ended, free-flowing conversations with minimal structure.

**Features:**
- No strict time limits
- Topic can evolve naturally
- Real-time viewer chat always visible
- Informal polls and quick reactions
- No winners/losers - focus on exchange of ideas

### Formal Discussions
Structured conversations with defined rules, time limits, and outcomes.

#### 1. Traditional Debate
Classic two-sided argumentative format.

**Structure:**
0. *Optional* Prep Period (3-5 min)
  - Participants independently work with Agents to define their claims/positions and to find resources.
  - Viewers (if present) are surveyed about their predispositions regarding the topic.
1. Opening Statements (3-5 min each side)
  - Participants state their positions and work together to define the relevant terms.
2. First Rebuttals (2-3 min each)
3. Cross-examination periods
4. Second Rebuttals (2 min each)
5. Closing Arguments (2-3 min each)
6. Audience Q&A (optional)
7. Final Voting

**Participants:** 2-4 debaters (1-2 per side)

#### 2. Dynamic Debate
Debate that adjusts based on polls and agent suggestion.

**Structure**

1. Introductions (2-3 min each)
2. Subtopic Selection
  - Participants are presented with recommended subtopics and they may choose 3 of 5.
  - The overlapping subtopics will be discussed.
3. Free form discussion on the first subtopic (~ 5-10 min)
  - Viewer polls are created.
  - Agents will find resources regarding the subtopic and submit them to the participants
4. Intermission (1-2 min)
  - Viewer polls are submitted
  - Participants can see and interact with chat
5. Repeat 3-4 until all topics are explored
6. Closing Statements
7. Post-Debate Survey

#### 3. Oxford-Style Debate
Motion-based debate with formal propositions.

**Structure:**
1. Pre-debate audience poll on the motion
2. Opening statements (6 min per side)
3. First rebuttals (4 min per side)
4. Moderated discussion period
5. Closing statements (2 min per side)
6. Post-debate audience poll
7. Winner determined by opinion shift

**Participants:** 4-6 debaters (2-3 per side)

#### 4. Panel Discussion
Multi-perspective exploration of complex topics.

**Structure:**
1. Moderator introduction and framing
2. Initial position statements (1-2 min each)
3. Moderated discussion rounds by subtopic
4. Audience Q&A segments (via upvoted questions or ai summaries of all questions)
5. Responses to Q&A
5. Repeat 3-4 as needed
6. Final Thoughts (1-2 min each)

**Participants:** 3-6 panelists + 1 moderator

#### 5. Town Hall
Community-driven discussion format.

**Structure:**
1. Topic presentation by host
2. Open floor for community questions 
3. Rotating speaker slots (2-3 min each)
4. Straw polls throughout
5. Action item compilation
6. Community consensus building

**Participants:** 1-2 hosts/moderators + unlimited community members.

### Core Components

#### Live Video System
- Dynamic layout adjustment based on:
  - Current speaker (formal discussions)
  - Speaking queue (town hall)
  - Discussion format requirements
- Screen sharing capabilities
- Recording and clip generation

#### Staging Area
- Mandatory staging area of debators
- For checking Video and Audio status

#### Viewer Engagement

**Chat System:**
- Always visible in casual discussions
- Time-gated visibility (for debators) in formal debates
- Threaded conversations (maybe)
- Moderator/Agent highlighting
- Sentiment analysis indicators (in some capacity)

**Voting & Polls:**
- Pre/post opinion polls
- Real-time reaction voting
- Fact-check requests
- Topic suggestion polls
- Point-based scoring for formal debates

#### Resource Management

**Knowledge Base:**
A section dedicated to storing relevant info during debates including:
- Auto-generated topic summaries
- Term definitions (crowd-sourced & AI-suggested)
- Sources and their credibility ratings
- Linked discussions and debate history
- Key moment timestamps
- Poll results archive

*Note:* may be edited by moderators.

#### Real-time Assistance
- Toast notifications for new resources
- Fact-checking alerts
- Suggested rebuttals (private to debaters)
- Time management warnings
- Topic drift indicators

## Entity Roles

### Participants

**Debaters/Speakers:**
- Primary discussion participants
- Video/audio broadcasting rights
- Access to private AI assistance
- Resource submission privileges
- May initiate POIs (limited)

**Viewers:**
- Watch-only by default
- Chat participation
- Voting rights
- Can request speaking slots (town hall)
- Can submit and rate resources
- Rates speaker's points

**Moderators:**
- Human or AI-powered
- Time management
- Topic guidance
- Resource curation
- Rule enforcement

### AI Agents

**Facilitator Agent:**
- Topic/subtopic suggestions

**Fact-Checker Agent:**
- Real-time claim verification
- Source credibility assessment
- Context provision
- Bias detection (?)

**Summarizer Agent:**
- Key point extraction
- Post-discussion reports
- Poll creation and timing

## Scoring & Evaluation

### Debate Scoring
- Dependent on Discussion/Debate Type
- It should not feel like grading in school!
- The goal is to judge the points (not the person)

- Possible metrics for scoring debates:

**Point Categories:**
- Argument Quality 
- Evidence Usage 
- Rebuttal Effectiveness 
- Presentation & Clarity 

**Deduction Triggers:**
- Logical fallacies 
- Unsubstantiated claims
- Personal attacks 
- Time violations

### Casual Discussion Metrics (?)
- Engagement rate
- Topic diversity
- Participant satisfaction
- Knowledge sharing index
- Community building score

## Discussion Path Architecture

### Topic Taxonomy
```
Root Topic
├── Subtopic A
│   ├── Perspective 1
│   ├── Perspective 2
│   └── Resources
|       ├── Data
|       ├── Academic Study
|       └── News Article
├── Subtopic B
│   ├── Perspective 1
│   ├── Perspective 2
|   ├── Perspective 3
│   └── Resources
└── Related Discussions
```

### Path Features
- Visual topic maps
- Prerequisite discussions
- Suggested viewing orders
- Complexity ratings
- Time investment estimates

## Content Moderation

### Principles
- Maximum free speech within discussion relevance
- Context-appropriate content standards
- Community-driven moderation options

### Formal Discussion Rules
- All content must be topic-relevant
- No personal attacks or ad hominem
- Time limits strictly enforced

### Casual Discussion Guidelines
- Organic topic evolution allowed
- Respectful disagreement encouraged
- Off-topic tangents permitted
- Community self-moderation tools
- Escalation path for violations

### Enforcement Levels
1. AI-generated warnings
2. Temporary muting
3. Point deductions (formal only)
4. Session removal
5. Platform restrictions

## Monetization Framework

### Creator Revenue Streams
- Ticketed premium debates
- Sponsored discussion series
- Educational workshop hosting
- Subscription supporter tiers
- Performance-based rewards

### Platform Revenue
- Premium membership tiers
- Enterprise/educational licenses
- API access for researchers
- Screen sharing with OBS (advanced screen sharing)
- Advertising (contextual only, if at all)
- Virtual goods/badges

### Viewer Benefits
- Ad-free viewing options
- Priority question submission
- Exclusive discussion access
- Custom AI agent features

## Technical Considerations

### Technology Stack
- **Frontend:** Next.js, TypeScript, WebRTC
- **Backend:** Node.js, GraphQL, PostgreSQL, MongoDB, DynamoDB
- **AI/ML:** Python and/or Node.js
- **Data:** Python services
- **Real-time Video:** LiveKit
- **Screen-Sharing:** Via browser API or OBS 

### Scalability Requirements
- Support 10,000+ concurrent viewers per discussion
- Pipelines for saving recordings and transcriptions
- CDN distribution for global access

## Success Metrics

### Platform KPIs
- Daily active discussions
- Average viewer retention
- Discussion completion rates
- User-generated content quality

### Community Health
- Diversity of topics and perspectives
- Constructive interaction ratio
- Knowledge dissemination rate
- New user onboarding success
- Long-term user retention