# Smart Shoe – Health & Fitness Interface Simulation

## 👟 Project Overview

This project is a **web-based simulation prototype** of a Smart Shoe with health and fitness tracking capabilities. The concept represents a wearable shoe that **projects a UI onto the floor** and allows **hands-free interaction using foot tilts** (left/right/forward). The simulation demonstrates the user experience in a desktop browser using **cursor tracking and mouse clicks** as the primary interaction method, with keyboard controls as a backup option.

## 🌟 Key Features

- **Hands-free Workout Experience**: Track workouts and health metrics without touching a screen
- **Natural Interaction**: Use cursor movements to simulate foot tilt gestures
- **Projected Interface**: UI appears as if projected onto the floor from the shoe
- **Real-time Metrics**: Monitor steps, heart rate, calories, and more during workouts
- **Workout Completion**: View achievements and sync with Apple Health
- **Voice Feedback**: Simulated voice assistive technology with on-screen text
- **Multiple Control Options**: Mouse, keyboard shortcuts, or on-screen buttons

## 💻 Primary Interaction Method

This simulation uses **cursor position tracking** as the primary interaction method:

- **Cursor at top of screen**: Activates tilt controls (moves shoe left/right)
- **Hovering over UI elements**: Automatically tilts the shoe in that direction
- **Clicking**: Represents a forward tilt to select/confirm

This approach creates an intuitive way to simulate how users would interact with the projected interface using natural foot movements.

## 🎯 User Flow

### 1. Start Experience
- View project information and instructions
- Learn about the interaction methods
- Begin the simulation

### 2. Select Workout Type
- Choose between Walk, Run, or Cycling
- Tilt left/right by moving cursor, click to select

### 3. Choose Workout Goal
- Select goal type: Distance, Calories, or Duration
- Adjust the value using controls or slider
- Confirm workout settings

### 4. Active Workout Experience
- View real-time stats and progress visualization
- Interact with workout controls
- Receive alerts based on workout metrics
- Pause/resume as needed

### 5. Workout Completion
- View achievement summary with workout statistics
- Rate your experience (Good, Okay, Tired)
- Sync with Apple Health

### 6. End Screen
- View completion message
- Option to try the simulation again

## 🕹️ Controls

### Primary Controls (Mouse/Cursor)
- **Move cursor to top of screen**: Activates tilt controls
- **Move cursor left/right**: Tilts shoe in that direction
- **Hover over UI element**: Automatically focuses that element
- **Click**: Selects the currently focused element

### Backup Keyboard Controls

| Action           | Key           | Description                        |
|------------------|---------------|------------------------------------|
| Tilt Left        | `←` Arrow     | Move selection left                |
| Tilt Right       | `→` Arrow     | Move selection right               |
| Tilt Forward     | `Enter`       | Confirm / Select current option    |
| Pause Workout    | `P` key       | Pause current workout              |
| Resume Workout   | `R` key       | Resume paused workout              |
| End Workout      | `E` key       | End current workout early          |
| Sample Data      | `S` key       | Load sample workout data           |
| Toggle Tracking  | `T` key       | Toggle cursor position tracking    |
| Voice Commands   | `V` key       | Toggle voice command simulation    |
| Help Panel       | `?` key       | Toggle keyboard shortcuts panel    |

## 🎨 Design Elements

- **Projected Interface**: UI elements appear with perspective, shadows, and glow effects
- **Shoe Visualization**: Virtual shoe shows tilt animations to represent foot movements
- **Projection Light**: Green light at shoe tip shows where the interface projects from
- **Circular Menus**: Intuitive circular interface for easy navigation with foot tilts
- **Progress Visualization**: 3D path representation of workout progress
- **Adaptive Feedback**: Visual cues for interactions and achievements

## 📱 Device Compatibility

- **Desktop**: Full experience with all features (recommended)
- **Tablet**: Compatible with touch-based controls
- **Mobile**: Not supported - displays compatibility message explaining desktop requirement

## 🧠 Design Principles

- **Natural Mapping**: Interface movement matches physical foot movements
- **Glanceable Information**: Important metrics visible at a glance for safety during workouts
- **Progressive Disclosure**: Information revealed as needed to prevent overwhelm
- **Immediate Feedback**: Visual responses to all user actions
- **Motivational Design**: Encouraging feedback and achievement celebration

## 📁 Project Structure

```
smart-shoe-sim/
├── index.html         # Main HTML structure
├── style.css          # All styling and animations
├── script.js          # Interaction logic and simulation
├── assets/
│   ├── icons/         # UI icons (SVG format)
│   ├── Shoe.png       # Main shoe visualization
│   └── logo.png       # Project logo
└── README.md          # Project documentation
```

## 🧪 Testing Recommendations

For the optimal experience when testing this prototype:

1. Use a **desktop browser** (Chrome or Firefox recommended)
2. Position screen at a **comfortable viewing angle**
3. Try all interaction methods (mouse tracking, keyboard, buttons)
4. Complete the full workout simulation flow
5. Test various workout types and goals
6. Observe the end-to-end experience from start to finish

## 🔧 Technical Implementation

This prototype is built with:
- **HTML5** for structure
- **CSS3** for styling, animations, and visual effects
- **JavaScript** for interactions and simulation logic
- **No external JS libraries** for maximum compatibility

All interactions are handled through event listeners that translate mouse/keyboard input into simulated foot movement represented visually in the interface.

## 📝 Final Notes

This simulation represents a **proof-of-concept for usability testing** rather than a production application. It demonstrates the interaction model and UI approach for projected interfaces controlled by foot gestures, enabling evaluation of this novel interaction paradigm without requiring specialized hardware.

---

**DECO2500 – Human-Computer Interaction**  
The University of Queensland  
Created by Noel