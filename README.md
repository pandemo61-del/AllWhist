# AllWhist

AllWhist is a mobile Whist card game app built with Expo and React Native. It lets players explore multiple Whist variants, learn the rules, play against AI opponents, and track their stats and progress.

## Overview

AllWhist is designed to make Whist more approachable and replayable for both casual players and players who want to improve their game. The app includes:

- Multiple Whist variants and match setup flows
- Local gameplay with AI opponents
- Learn mode with tutorials and game rules
- Statistics tracking and progression
- Settings and personalization
- Daily reward flow and onboarding experience

## Features

### Game modes
- New game flow from the home screen
- Resume an in-progress game
- Multiple Whist variants selected from a dedicated screen
- Match progression with scoring and turn flow

### Learning support
- Rule explanations and learning-focused navigation
- Variants and tutorial discovery
- Beginner-friendly onboarding and guided flow

### Progress and personalization
- Player statistics and historical tracking
- Settings for game difficulty, themes, sound, and preferences
- Daily reward checks and persistent local state

## Tech stack

- React Native / Expo
- TypeScript
- Expo Router
- Zustand for state management
- Firebase integration
- Google Mobile Ads
- Native app configuration with Android/iOS support

## Project structure

```text
.
├── app/                  # Expo Router screens and app entry points
├── src/
│   ├── ai/               # AI-related logic
│   ├── components/       # Reusable UI components
│   ├── constants/        # Theme and app constants
│   ├── data/             # Game data and static content
│   ├── engine/           # Whist game rules and engine logic
│   ├── hooks/            # Custom hooks
│   ├── i18n/             # Localization support
│   ├── services/         # App services
│   ├── store/            # Zustand stores
│   ├── utils/            # Utility functions
│   └── variants/         # Variant definitions and logic
├── assets/               # App images and icons
├── App.tsx               # Root app placeholder / compatibility entry
├── app.json               # Expo app configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript config
├── babel.config.js        # Babel config
├── wrangler.jsonc         # Cloudflare/Wrangler configuration
├── index.html             # Web entry point
├── index.ts              # App bootstrap entry
└── README.md             # Project documentation
```

## Getting started

### Prerequisites

- Node.js 20+
- npm or another package manager supported by the project
- Expo CLI (installed via package scripts or local dependencies)

### Install dependencies

```bash
npm install
```

### Run the app

Start the Expo development server:

```bash
npm start
```

Or run directly for web:

```bash
npm run web
```

For Android:

```bash
npm run android
```

For iOS:

```bash
npm run ios
```

## Useful scripts

```bash
npm run lint
npm run test:ai
```

## Notes

- This project uses Expo Router and app-based navigation.
- The codebase includes game engine logic for Whist play and scoring.
- Some generated or environment-specific files may be present as part of local development workflows.

## Status

This repository is an active mobile game project focused on Whist gameplay, learning, and progression tracking.

## License

No license file is currently included in this repository. If you plan to redistribute or publish this project, add a license before doing so.
