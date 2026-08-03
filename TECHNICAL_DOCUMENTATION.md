# 🌿 The Garden – Technical Documentation

**Version:** 1.0  
**Project:** The Garden  
**Author:** Preeti Dhotmal

---

# Table of Contents

1. Project Overview
2. System Architecture
3. Technology Stack
4. Folder Structure
5. Frontend Architecture
6. Backend Architecture
7. Character System
8. Puzzle System
9. Environment System
10. Audio System
11. Camera System
12. Gameplay Flow
13. Future Scope
14. Installation Guide

---

# 1. Project Overview

The Garden is a browser-based cooperative 3D puzzle adventure inspired by biblical relationship virtues.

The goal of the project is to help players grow stronger relationships through teamwork, communication, trust, and faith-inspired cooperative gameplay.

The current prototype includes:

- Garden Hub
- Character Selection
- Communication Chapter
- Trust Chapter
- Third Person Camera
- Character Animation
- Nature Environment
- Background Music
- Puzzle Framework

---

# 2. Overall System Architecture

```text
                        User
                          │
                          ▼
                 React Frontend (UI)
                          │
      ┌───────────────────┴───────────────────┐
      │                                       │
      ▼                                       ▼
React Three Fiber                     React Components
      │                                       │
      ▼                                       ▼
 Three.js Engine                    Menus / HUD / Settings
      │
      ▼
Character Controller
      │
      ▼
Puzzle Manager
      │
      ▼
Environment Manager
      │
      ▼
Rendering Pipeline
      │
      ▼
WebGL
```

---

# Scripture Integration Architecture

One of the primary design goals of The Garden is to integrate Scripture into gameplay in a natural and meaningful way.

Rather than interrupting the player with unrelated content, Scripture is introduced immediately after cooperative challenges, reinforcing the lesson that players have just experienced together.

## Planned Architecture

```text
Player

↓

Complete Puzzle

↓

Level Complete

↓

Reflection Prompt

↓

Gloo AI Studio API

↓

Personalized Faith Reflection

↓

YouVersion Platform API

↓

Relevant Scripture

↓

Next Chapter
```

---

## API Responsibilities

### YouVersion Platform API

Responsibilities include:

- Retrieve relevant Scripture passages
- Support multiple Bible translations
- Provide reading plans
- Display Verse of the Day
- Future community engagement features

---

### Gloo AI Studio API

Responsibilities include:

- Faith-centered reflection
- Personalized encouragement
- Scripture recommendations
- Safe conversational responses
- Context-aware guidance

---

## Chapter Mapping

| Chapter | Virtue | Scripture |
|----------|--------|-----------|
| Communication | Speaking with Love | Ephesians 4:29 |
| Trust | Trusting God | Proverbs 3:5–6 |
| Patience | Endurance | James 1:2–4 |
| Forgiveness | Grace | Colossians 3:13 |
| Sacrifice | Selfless Love | John 15:13 |
| Unity | Living Together | Psalm 133 |
| Stewardship | Faithfulness | Matthew 25 |
| Conflict Resolution | Reconciliation | Matthew 18 |
| Serving One Another | Humility | Mark 10 |
| The Restored Garden | New Creation | Revelation 21 |

---

## Design Philosophy

The Garden does not present Scripture as a separate destination. Instead, biblical teaching becomes part of the player's journey through cooperative gameplay, reflection, and storytelling.

This approach supports the hackathon vision of making Scripture available where people already are—in this case, within immersive gaming experiences.

---

# 3. Technology Stack

## Frontend

- React
- TypeScript
- Vite
- React Three Fiber
- Three.js

## Backend

- Java
- Spring Boot

## Assets

- GLTF / GLB
- PNG
- MP3

---

# 4. Project Structure

```text
The-Garden
│
├── frontend
│   ├── src
│   │
│   ├── components
│   │
│   ├── pages
│   │
│   ├── hooks
│   │
│   ├── systems
│   │
│   └── public
│         ├── models
│         ├── audio
│         └── environment
│
├── backend
│
├── packages
│
├── assets
│
├── README.md
│
└── TECHNICAL_DOCUMENTATION.md
```

---

# 5. Frontend Architecture

The frontend is responsible for:

- Character rendering
- Camera movement
- Environment rendering
- Puzzle interactions
- Audio
- User Interface

Architecture:

```text
React

↓

React Three Fiber

↓

Three.js

↓

WebGL Renderer

↓

Browser
```

---

# 6. Backend Architecture

Spring Boot backend provides:

- Game APIs
- Future Authentication
- Save Data
- Future Multiplayer Support

Architecture:

```text
React

↓

REST API

↓

Spring Boot

↓

Future Database
```

---

# 7. Character System

Current Features

- Character Selection
- Third Person Controller
- Walking Animation
- Idle Animation
- Camera Follow

Characters

- Boy
- Girl

Both are imported using GLB models with skeletal animations.

---

# 8. Puzzle System

Current Puzzle Flow

```text
Player

↓

Interact

↓

Puzzle Trigger

↓

Puzzle Logic

↓

Puzzle Complete

↓

Unlock Next Area
```

Current Chapters

- Communication
- Trust

Future chapters will reuse the same architecture.

---

# 9. Environment System

The environment contains

- Trees
- Bushes
- Flowers
- Grass
- Rocks
- Terrain
- Sky
- Lighting
- Background Music

Environment Pipeline

```text
Environment Assets

↓

Asset Manifest

↓

Environment Loader

↓

Three.js Scene

↓

Render
```

---

# 10. Audio System

Current Audio

- Ambient Music

Future Audio

- Character Voice
- Puzzle Sounds
- Dynamic Music
- Nature Effects

---

# 11. Camera System

Features

- Third Person Camera
- Smooth Follow
- Dynamic Rotation
- Adjustable Distance

Camera Flow

```text
Player Movement

↓

Camera Controller

↓

Smooth Follow

↓

Scene Rendering
```

---

# 12. Gameplay Flow

```text
Start

↓

Main Menu

↓

Character Selection

↓

Garden Hub

↓

Communication Chapter

↓

Trust Chapter

↓

Future Chapters

↓

Restored Garden
```

---

# 13. Future Roadmap

The complete vision contains ten chapters.

1. Communication
2. Trust
3. Patience
4. Forgiveness
5. Sacrifice
6. Unity
7. Stewardship
8. Conflict Resolution
9. Serving One Another
10. The Restored Garden

### API Roadmap

Future development will expand Scripture integration through:

- Personalized Scripture recommendations
- Verse-of-the-Day experiences
- Daily devotional challenges
- Multiplayer faith reflection sessions
- Reading plan synchronization
- AI-generated encouragement after completing chapters
- Progress tracking based on biblical virtues

---

# Future Scope

The Garden is envisioned as the beginning of a larger collection of interactive, faith-inspired life journey experiences.

## 💍 Marriage Journey

Interactive cooperative experiences focused on strengthening communication, trust, forgiveness, conflict resolution, and lifelong partnership.

---

## 🏡 Building a Home Together

Players build a home, manage responsibilities, solve family challenges, and grow together through teamwork and stewardship.

---

## 👨‍👩‍👧 Parent–Child Journey

Gameplay designed around strengthening communication, patience, understanding, guidance, and mutual respect between parents and children.

---

## 👴 Aging with Grace

A reflective experience centered on compassion, caregiving, wisdom, gratitude, and meaningful family relationships during later stages of life.

---

The long-term goal is to create a collection of games that teach biblical relationship values across every important stage of life.

---

# 14. Installation Guide

Clone Repository

```bash
git clone https://github.com/PreetiDhotmal/The-Garden.git
```

Install

```bash
npm install
```

Run

```bash
npm run dev
```

Open

```
http://localhost:5173
```

---

# Conclusion

The Garden demonstrates how React, Three.js, and modern web technologies can be used to build immersive educational experiences that combine storytelling, cooperative gameplay, and faith-inspired values.

The architecture has been designed to support future chapters, additional gameplay systems, and new life-journey experiences while maintaining a scalable and modular codebase.