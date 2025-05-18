

# Smart Shoe – Health & Fitness Interface Simulation

## 👟 Project Overview

This project is a **web-based simulation prototype** of the Health & Fitness feature of a Smart Shoe product. The real product is a wearable shoe that **projects a UI onto the floor** and allows **interaction using foot tilts** (left/right/forward). This prototype simulates those interactions for testing purposes on a desktop browser, using keyboard or click inputs.

## 🌟 Vision

To create a **hands-free workout experience** that:
- Helps users **track workouts and vitals** in real time
- Reduces dependency on smartphones during physical activity
- Uses **natural foot gestures** (tilt left/right/forward) as input
- Projects feedback into the user’s natural line of sight (floor level)
- Supports accessibility, safety, and motivational design

## 🎯 Primary User Flow (Simulated)

### 1. Select Workout Type
- Display: Circular menu with options (Run, Walk, HIIT)
- Interaction: Tilt left/right to rotate, forward to select

### 2. Choose Workout Goal
- Options:
  - Distance (e.g. 2 km)
  - Calories (e.g. 300 kcal)
  - Duration (e.g. 20 min)
- Interaction: Tilt left/right to adjust value, forward to confirm

### 3. Begin Workout
- Display: Time elapsed, distance, steps, heart rate, etc.
- Controls:
  - Pause / Resume via tilt
  - Voice feedback simulated with subtitles
  - Warnings/alerts based on vitals

### 4. Mid-Workout Alert
- Trigger: High heart rate or inactivity
- Choice: “Slow down” or “Ignore”
- Interaction: Tilt to choose

### 5. Pause State
- Message: “Paused. Tilt forward to resume or left to end early”

### 6. Workout Complete
- Trophy animation + stats summary
- Prompt: “How did you feel?” (Good, Okay, Tired)
- Share: “Sync with Apple Health” (mocked)

## 🕹️ Controls (Keyboard Simulation)

| Real Foot Tilt | Simulated Key | Description |
|----------------|---------------|-------------|
| Tilt Left      | `←` Arrow     | Scroll left, choose “No” |
| Tilt Right     | `→` Arrow     | Scroll right, choose “Yes” |
| Tilt Forward   | `Enter`       | Confirm / Select |
| Pause          | `P` key       | Pause workout |
| Resume         | `R` key       | Resume workout |

## 🎨 UI/UX Design Guidance

- 👁️‍🗨️ Interface elements should **appear as projections** on the floor (angle/shadow blur to imply projection)
- 👟 Visual of **shoes in bottom-center** of screen for reference
- 💬 Subtitles simulate voice feedback (e.g., “Workout starting now”)
- ⚠️ Pop-ups appear **low and center** like floor projections, not traditional modals
- 🔄 Foot tilt indicators appear briefly when actions are taken (left/right/forward)
- 📱 Avoid any touch buttons — this is **not** a smartphone app

## 🧑‍🔬 Target Users

- Young adults and middle-aged users who regularly run, walk, or do HIIT
- People who use Apple Health or fitness tracking apps
- Users who dislike carrying phones during workouts
- Users with minor accessibility challenges (glasses, limited hand mobility)

## 🧠 Design Principles Used

- **Natural Mapping**: Feet tilt → interface reacts on ground
- **Immediate Feedback**: Real-time updates on stats
- **Motivational Design**: Celebratory visuals and encouragement
- **Accessibility**: Reduced cognitive load, no hand interaction needed

## 🧪 Testing Mode

This prototype is used in user testing where:
- Participants sit in front of a screen
- Are instructed to **imagine this is a floor projection**
- Interact using arrow keys or on-screen tilt simulation buttons
- Think aloud during testing
- Reflect on ease of use, clarity of projection, and comfort of control

## 📦 Assets

- Shoe image overlay (PNG/transparent)
- Icons: Run, Walk, HIIT, Trophy, Heart, Pause, Sync
- Optional: Blurred floor texture as projection base

## 🔧 Copilot Usage

If using GitHub Copilot or ChatGPT, focus on generating:
- Simple HTML/CSS structure simulating projection
- JavaScript to handle:
  - Arrow key events and transitions
  - Alert simulation triggers
  - Tilt animation feedback
- Optional: CSS transitions or GSAP/Framer Motion animation for subtle floor-like effects

## 📁 Project Structure (Recommended)

```
smart-shoe-sim/
├── index.html
├── style.css
├── script.js
├── assets/
│   ├── shoes.png
│   ├── icons/
│   └── bg-projection.png
└── README.md
```

## 📝 Final Notes

This simulation is NOT a full app, but a **proof-of-concept for usability testing**. Its purpose is to let users experience the interaction concept of our Smart Shoe’s Health & Fitness feature without needing the physical device.

Please design interactions that reflect **real-world cognitive flow**, and simulate projected UI elements as realistically as possible.