document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startBtn = document.getElementById('startBtn');
    const instructions = document.getElementById('instructions');
    const screens = document.querySelectorAll('.screen');
    const shoeImage = document.getElementById('shoeImage');
    const tiltIndicator = document.getElementById('tiltIndicator');
    const tiltArrow = document.getElementById('tiltArrow');
    const voiceFeedback = document.getElementById('voiceFeedback');
    const voiceText = document.getElementById('voiceText');
    
    // On-screen control buttons
    const leftBtn = document.getElementById('leftBtn');
    const selectBtn = document.getElementById('selectBtn');
    const rightBtn = document.getElementById('rightBtn');
    
    // Workout type selection elements
    const workoutOptions = document.querySelectorAll('.workout-option');
    
    // Goal selection elements
    const goalTabs = document.querySelectorAll('.goal-tab');
    const goalValue = document.getElementById('goalValue');
    const goalUnit = document.getElementById('goalUnit');
    const sliderHandle = document.querySelector('.slider-handle');
    const sliderFill = document.querySelector('.slider-fill');
    const confirmButton = document.querySelector('.confirm-button');
    
    // Workout screen elements
    const heartRateEl = document.getElementById('heartRate');
    const caloriesEl = document.getElementById('caloriesBurned');
    const tempEl = document.getElementById('temp');
    const stepCountEl = document.getElementById('stepCount');
    const distanceEl = document.getElementById('distance');
    const timeElapsedEl = document.getElementById('timeElapsed');
    const timeRemainingEl = document.getElementById('timeRemaining');
    
    // State variables
    let currentScreenIndex = 0;
    let selectedWorkoutOption = 1; // Default to "Walk" (middle option)
    let selectedGoalTab = 0; // Default to "Distance"
    let sliderValue = 60; // Default slider position (0-100)
    let workoutActive = false;
    let workoutPaused = false;
    let workoutStartTime = null;
    let workoutElapsedTime = 0;
    let workoutInterval = null;
    let heartRate = 80;
    let calories = 0;
    let steps = 0;
    let distance = 0;
    
    // Goal settings
    const goalSettings = {
        distance: {
            min: 1,
            max: 10,
            unit: 'km',
            step: 0.5,
            format: (val) => val.toFixed(1)
        },
        calories: {
            min: 100,
            max: 1000,
            unit: 'kcal',
            step: 50,
            format: (val) => val.toString()
        },
        duration: {
            min: 10,
            max: 120,
            unit: 'min',
            step: 5,
            format: (val) => val.toString()
        }
    };
    
    let currentGoalType = 'distance';
    
    // Start button click event
    startBtn.addEventListener('click', () => {
        instructions.style.display = 'none';
        showScreen(0); // Show workout type selection screen
        showVoiceFeedback('Select a workout type');
        
        // Preload assets for smooth UX
        preloadAssets();
    });
    
    // Keyboard controls
    document.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'ArrowLeft':
                handleTilt('left');
                break;
            case 'ArrowRight':
                handleTilt('right');
                break;
            case 'Enter':
                handleTilt('forward');
                break;
            case 'p':
            case 'P':
                if (workoutActive) pauseWorkout();
                break;
            case 'r':
            case 'R':
                if (workoutActive && workoutPaused) resumeWorkout();
                break;
        }
    });
    
    // On-screen controls
    leftBtn.addEventListener('click', () => handleTilt('left'));
    rightBtn.addEventListener('click', () => handleTilt('right'));
    selectBtn.addEventListener('click', () => handleTilt('forward'));
    
    // Timer control buttons
    document.getElementById('pauseBtn')?.addEventListener('click', pauseWorkout);
    document.getElementById('stopBtn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to end this workout?')) {
            endWorkout();
        }
    });
    
    // Handle foot tilt (left, right, forward)
    function handleTilt(direction) {
        // Remove previous classes to ensure new animation plays
        shoeImage.classList.remove('tilt-left', 'tilt-right', 'tilt-forward');
        
        // Force browser to recognize the removal before adding
        setTimeout(() => {
            // Animate shoe
            shoeImage.classList.add(`tilt-${direction}`);
            
            // Create ripple effect on floor (projection simulation)
            createRippleEffect(direction);
            
            // Show tilt indicator
            tiltIndicator.style.opacity = '1';
            
            // Adjust tilt indicator direction
            if (direction === 'left') {
                tiltArrow.style.transform = 'rotate(-90deg)';
            } else if (direction === 'right') {
                tiltArrow.style.transform = 'rotate(90deg)';
            } else { // forward
                tiltArrow.style.transform = 'rotate(0)';
            }
            
            // Process action based on current screen
            processScreenAction(direction);
            
            // Reset shoe position and hide tilt indicator after animation
            setTimeout(() => {
                shoeImage.classList.remove(`tilt-${direction}`);
                tiltIndicator.style.opacity = '0';
            }, 500);
        }, 10); // Very short timeout to ensure class removal is processed
    }
    
    // Create ripple effect to simulate projection interaction
    function createRippleEffect(direction) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple-effect';
        
        // Position based on direction
        if (direction === 'left') {
            ripple.style.left = '30%';
        } else if (direction === 'right') {
            ripple.style.left = '70%';
        } else { // forward
            ripple.style.left = '50%';
        }
        
        // Add to DOM
        document.querySelector('.floor-projection').appendChild(ripple);
        
        // Remove after animation completes
        setTimeout(() => {
            ripple.remove();
        }, 1000);
    }
    
    // Function to show a specific screen
    function showScreen(index) {
        screens.forEach((screen, i) => {
            screen.classList.toggle('active', i === index);
        });
        currentScreenIndex = index;
        
        // Create a small floor ripple to show the transition
        createRippleEffect('forward');
        
        // Special screen initialization
        if (index === 3) { // Workout screen
            if (!workoutActive) {
                startWorkout();
            }
        } else if (index === 4) { // Complete screen
            if (workoutActive) {
                endWorkout();
                celebrateCompletion();
            }
        }
    }
    
    // Process screen-specific actions
    function processScreenAction(direction) {
        switch (currentScreenIndex) {
            case 0: // Workout Type Selection
                if (direction === 'left') {
                    // Navigate left through workout options
                    selectedWorkoutOption = Math.max(0, selectedWorkoutOption - 1);
                    updateSelectedWorkoutOption();
                    showVoiceFeedback(getWorkoutTypeName(selectedWorkoutOption));
                } else if (direction === 'right') {
                    // Navigate right through workout options
                    selectedWorkoutOption = Math.min(workoutOptions.length - 1, selectedWorkoutOption + 1);
                    updateSelectedWorkoutOption();
                    showVoiceFeedback(getWorkoutTypeName(selectedWorkoutOption));
                } else if (direction === 'forward') {
                    // Proceed to goal selection
                    showScreen(1); // Show goal selection screen
                    showVoiceFeedback(`Select your ${currentGoalType} goal`);
                }
                break;
                
            case 1: // Goal Selection
                if (direction === 'left') {
                    // Navigate left through goal types or decrease slider value
                    if (document.activeElement === sliderHandle) {
                        // Decrease value
                        decreaseSliderValue();
                    } else {
                        // Select previous goal type
                        selectedGoalTab = Math.max(0, selectedGoalTab - 1);
                        updateSelectedGoalTab();
                    }
                } else if (direction === 'right') {
                    // Navigate right through goal types or increase slider value
                    if (document.activeElement === sliderHandle) {
                        // Increase value
                        increaseSliderValue();
                    } else {
                        // Select next goal type
                        selectedGoalTab = Math.min(goalTabs.length - 1, selectedGoalTab + 1);
                        updateSelectedGoalTab();
                    }
                } else if (direction === 'forward') {
                    // Select slider or confirm goal
                    if (document.activeElement === sliderHandle) {
                        // Confirm goal
                        showScreen(2); // Show countdown screen
                        startCountdown();
                    } else {
                        // Focus slider
                        sliderHandle.focus();
                        showVoiceFeedback('Adjust goal value with left and right tilts');
                    }
                }
                break;
                
            case 2: // Countdown screen
                // No actions during countdown
                break;
                
            case 3: // Workout Screen
                if (workoutPaused) {
                    if (direction === 'forward') {
                        resumeWorkout();
                    } else if (direction === 'left') {
                        endWorkout();
                        showScreen(4); // Show completion screen
                    }
                } else {
                    if (direction === 'forward') {
                        pauseWorkout();
                    }
                }
                break;
                
            case 4: // Workout Complete
                // Handle mood selection and sync option
                // Only one selection allowed in mood options
                const moodOptions = document.querySelectorAll('.mood-option');
                if (direction === 'left') {
                    // Previous mood option
                    let selectedIndex = Array.from(moodOptions).findIndex(option => option.classList.contains('selected'));
                    if (selectedIndex === -1) selectedIndex = 0;
                    else selectedIndex = Math.max(0, selectedIndex - 1);
                    
                    moodOptions.forEach((option, i) => {
                        option.classList.toggle('selected', i === selectedIndex);
                    });
                    
                    showVoiceFeedback(`Mood: ${moodOptions[selectedIndex].getAttribute('data-mood')}`);
                } else if (direction === 'right') {
                    // Next mood option
                    let selectedIndex = Array.from(moodOptions).findIndex(option => option.classList.contains('selected'));
                    if (selectedIndex === -1) selectedIndex = 0;
                    else selectedIndex = Math.min(moodOptions.length - 1, selectedIndex + 1);
                    
                    moodOptions.forEach((option, i) => {
                        option.classList.toggle('selected', i === selectedIndex);
                    });
                    
                    showVoiceFeedback(`Mood: ${moodOptions[selectedIndex].getAttribute('data-mood')}`);
                } else if (direction === 'forward') {
                    // Sync with Apple Health (simulated)
                    const syncButton = document.querySelector('.sync-button');
                    if (syncButton) {
                        syncButton.style.backgroundColor = '#4fd1ff';
                        syncButton.style.color = '#0a0e1a';
                        syncButton.style.boxShadow = '0 0 18px 4px #4fd1ff88';
                        
                        showVoiceFeedback('Syncing with Apple Health...');
                        
                        setTimeout(() => {
                            showVoiceFeedback('Workout data synchronized successfully');
                            
                            // Reset to start
                            setTimeout(() => {
                                resetWorkout();
                                showScreen(0); // Back to workout type selection
                            }, 3000);
                        }, 2000);
                    }
                }
                break;
        }
    }
    
    // Update selected workout option
    function updateSelectedWorkoutOption() {
        workoutOptions.forEach((option, i) => {
            option.classList.toggle('selected', i === selectedWorkoutOption);
        });
    }
    
    // Get workout type name from index
    function getWorkoutTypeName(index) {
        const types = ['Run', 'Walk', 'HIIT'];
        return types[index] || '';
    }
    
    // Update selected goal tab
    function updateSelectedGoalTab() {
        goalTabs.forEach((tab, i) => {
            tab.classList.toggle('selected', i === selectedGoalTab);
        });
        
        currentGoalType = goalTabs[selectedGoalTab].getAttribute('data-goal-type');
        
        // Update goal value and unit
        const settings = goalSettings[currentGoalType];
        goalUnit.textContent = settings.unit;
        
        // Recalculate value based on slider position
        const value = calculateValueFromSlider(sliderValue, settings);
        goalValue.textContent = settings.format(value);
        
        showVoiceFeedback(`${currentGoalType} goal selected`);
    }
    
    // Update slider
    function updateSlider() {
        sliderFill.style.width = `${sliderValue}%`;
        sliderHandle.style.left = `${sliderValue}%`;
        
        const settings = goalSettings[currentGoalType];
        const value = calculateValueFromSlider(sliderValue, settings);
        goalValue.textContent = settings.format(value);
        
        showVoiceFeedback(`${value} ${settings.unit}`);
    }
    
    // Increase slider value
    function increaseSliderValue() {
        sliderValue = Math.min(100, sliderValue + 5);
        updateSlider();
    }
    
    // Decrease slider value
    function decreaseSliderValue() {
        sliderValue = Math.max(0, sliderValue - 5);
        updateSlider();
    }
    
    // Calculate value from slider position
    function calculateValueFromSlider(percent, settings) {
        return settings.min + (settings.max - settings.min) * (percent / 100);
    }
    
    // Start countdown
    function startCountdown() {
        const countdownEl = document.querySelector('.countdown-number');
        let count = 3;
        
        countdownEl.textContent = count;
        showVoiceFeedback('Get ready');
        
        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownEl.textContent = count;
                showVoiceFeedback(count.toString());
            } else {
                clearInterval(interval);
                showScreen(3); // Show workout screen
                
                // Create a strong ripple effect to indicate workout start
                createWorkoutStartRipple();
            }
        }, 1000);
    }
    
    // Create a strong ripple effect for workout start
    function createWorkoutStartRipple() {
        const ripple = document.createElement('div');
        ripple.className = 'ripple-effect';
        ripple.style.left = '50%';
        ripple.style.transform = 'translate(-50%, -50%) scale(0.5)';
        ripple.style.animation = 'ripple 1.5s ease-out forwards';
        ripple.style.background = 'var(--tertiary-color)';
        
        document.querySelector('.floor-projection').appendChild(ripple);
        
        // Create multiple ripples for dramatic effect
        setTimeout(() => {
            const ripple2 = document.createElement('div');
            ripple2.className = 'ripple-effect';
            ripple2.style.left = '40%';
            document.querySelector('.floor-projection').appendChild(ripple2);
            
            setTimeout(() => {
                const ripple3 = document.createElement('div');
                ripple3.className = 'ripple-effect';
                ripple3.style.left = '60%';
                document.querySelector('.floor-projection').appendChild(ripple3);
            }, 200);
        }, 200);
    }
    
    // Start workout
    function startWorkout() {
        workoutActive = true;
        workoutPaused = false;
        workoutStartTime = new Date();
        
        // Show initial stats
        updateWorkoutStats();
        
        // Set up interval to update stats
        workoutInterval = setInterval(() => {
            if (!workoutPaused) {
                updateWorkoutStats();
            }
        }, 1000);
        
        showVoiceFeedback('Workout started');
        
        // Simulate random health alert after 10-20 seconds
        setTimeout(() => {
            if (workoutActive && !workoutPaused) {
                showHealthAlert('High heart rate detected. Consider slowing down.');
            }
        }, 10000 + Math.random() * 10000);
    }
    
    // Pause workout
    function pauseWorkout() {
        if (!workoutActive || workoutPaused) return;
        
        workoutPaused = true;
        workoutElapsedTime += (new Date() - workoutStartTime);
        
        // Show pause overlay
        document.getElementById('pauseOverlay').classList.add('active');
        
        showVoiceFeedback('Workout paused');
    }
    
    // Resume workout
    function resumeWorkout() {
        if (!workoutActive || !workoutPaused) return;
        
        workoutPaused = false;
        workoutStartTime = new Date();
        
        // Hide pause overlay
        document.getElementById('pauseOverlay').classList.remove('active');
        
        showVoiceFeedback('Workout resumed');
    }
    
    // End workout
    function endWorkout() {
        if (!workoutActive) return;
        
        clearInterval(workoutInterval);
        
        if (!workoutPaused) {
            workoutElapsedTime += (new Date() - workoutStartTime);
        }
        
        workoutActive = false;
        workoutPaused = false;
        
        // Hide pause overlay if visible
        document.getElementById('pauseOverlay').classList.remove('active');
        
        // Update final stats
        document.querySelector('#finalCalories').textContent = calories;
        
        showVoiceFeedback('Workout completed');
    }
    
    // Reset workout
    function resetWorkout() {
        workoutActive = false;
        workoutPaused = false;
        workoutElapsedTime = 0;
        heartRate = 80;
        calories = 0;
        steps = 0;
        distance = 0;
        
        // Reset UI elements
        updateSelectedWorkoutOption();
        updateSelectedGoalTab();
        
        const moodOptions = document.querySelectorAll('.mood-option');
        moodOptions.forEach(option => option.classList.remove('selected'));
        
        const syncButton = document.querySelector('.sync-button');
        if (syncButton) {
            syncButton.style.backgroundColor = '';
            syncButton.style.color = '';
            syncButton.style.boxShadow = '';
        }
    }
    
    // Celebrate workout completion with visual effects
    function celebrateCompletion() {
        // Create multiple celebration ripples
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const ripple = document.createElement('div');
                ripple.className = 'ripple-effect';
                ripple.style.left = `${30 + Math.random() * 40}%`;
                ripple.style.backgroundColor = getRandomColor();
                document.querySelector('.floor-projection').appendChild(ripple);
            }, i * 300);
        }
        
        // Highlight trophy with glow effect
        const trophy = document.querySelector('.trophy');
        if (trophy) {
            trophy.style.animation = 'pulse 1s infinite';
            trophy.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8)';
        }
    }
    
    // Get random celebration color
    function getRandomColor() {
        const colors = [
            'var(--primary-color)',
            'var(--secondary-color)',
            'var(--tertiary-color)',
            '#ffb450',
            '#4fd1ff'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    // Preload assets
    function preloadAssets() {
        const imagesToPreload = [
            'assets/icons/run.svg',
            'assets/icons/walk.svg',
            'assets/icons/hiit.svg',
            'assets/icons/heart.svg',
            'assets/icons/steps.svg',
            'assets/icons/time.svg',
            'assets/icons/laurel.svg'
        ];
        
        imagesToPreload.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }
    
    // Update workout stats with simulated values
    function updateWorkoutStats() {
        if (!workoutActive) return;
        
        // Calculate elapsed time
        let currentElapsedTime = workoutElapsedTime;
        if (!workoutPaused) {
            currentElapsedTime += (new Date() - workoutStartTime);
        }
        
        const elapsedMinutes = Math.floor(currentElapsedTime / 60000);
        
        // Update time display
        timeElapsedEl.textContent = `${elapsedMinutes} min`;
        
        // Get goal and calculate remaining time
        const goalType = currentGoalType;
        const settings = goalSettings[goalType];
        const goalValue = calculateValueFromSlider(sliderValue, settings);
        
        if (goalType === 'duration') {
            const remainingMinutes = Math.max(0, goalValue - elapsedMinutes);
            timeRemainingEl.textContent = `${remainingMinutes} min`;
            
            // End workout if time is up
            if (remainingMinutes <= 0 && workoutActive) {
                showScreen(4); // Show completion screen
            }
        }
        
        // Update steps (simulate steady pace with small random variations)
        const baseStepRate = 100; // steps per minute
        const randomVariation = Math.floor(Math.random() * 10) - 5; // -5 to +5
        const newSteps = Math.floor(elapsedMinutes * baseStepRate) + randomVariation;
        steps = newSteps;
        stepCountEl.textContent = `${steps} steps`;
        
        // Update distance (based on steps)
        distance = (steps * 0.0007).toFixed(2); // Approximate conversion
        distanceEl.textContent = `${distance} km`;
        
        // Update heart rate (start at 80, increase steadily, then plateau with small variations)
        const baseHeartRate = 80 + Math.min(60, elapsedMinutes * 5);
        const heartRateVariation = Math.floor(Math.random() * 6) - 3; // -3 to +3
        heartRate = baseHeartRate + heartRateVariation;
        heartRateEl.textContent = `${heartRate} bpm`;
        
        // Update calories (based on heartrate and time)
        // Simple formula: higher heart rate burns more calories
        calories = Math.floor((heartRate - 70) * 0.1 * elapsedMinutes);
        caloriesEl.textContent = `${calories} kcal`;
        
        // End workout if calorie goal reached
        if (goalType === 'calories' && calories >= goalValue && workoutActive) {
            showScreen(4); // Show completion screen
        }
        
        // Update progress visualization
        updateProgressVisualization(steps, 5000); // Assuming 5000 steps target
    }
    
    // Update progress visualization
    function updateProgressVisualization(currentSteps, targetSteps) {
        const progressFill = document.getElementById('progressFill');
        const currentProgress = document.getElementById('currentProgress');
        const progressStepCount = document.getElementById('progressStepCount');
        
        if (!progressFill || !currentProgress || !progressStepCount) return;
        
        const percentComplete = Math.min(100, (currentSteps / targetSteps) * 100);
        
        // Update progress bar fill
        progressFill.style.width = `${percentComplete}%`;
        
        // Update marker position
        currentProgress.style.left = `${percentComplete}%`;
        
        // Update step count
        progressStepCount.textContent = currentSteps;
        
        // Pulse animation when milestones reached
        if (currentSteps > 0 && currentSteps % 1000 === 0) {
            const marker = currentProgress.querySelector('.progress-marker');
            if (marker) {
                marker.classList.add('pulse');
                setTimeout(() => marker.classList.remove('pulse'), 2000);
            }
            
            // Celebratory ripple
            createRippleEffect('forward');
            
            showVoiceFeedback(`Milestone reached: ${currentSteps} steps`);
        }
    }
    
    // Show voice feedback
    function showVoiceFeedback(message) {
        voiceText.textContent = message;
        voiceFeedback.classList.add('active');
        
        // Remove active class after 3 seconds
        setTimeout(() => {
            voiceFeedback.classList.remove('active');
        }, 3000);
    }
    
    // Show health alert
    function showHealthAlert(message) {
        const alertEl = document.getElementById('healthAlert');
        const alertTextEl = document.getElementById('healthAlertText');
        
        if (!alertEl || !alertTextEl) return;
        
        alertTextEl.textContent = message;
        alertEl.classList.add('active');
        
        // Create a warning ripple
        const ripple = document.createElement('div');
        ripple.className = 'ripple-effect';
        ripple.style.left = '50%';
        ripple.style.backgroundColor = 'var(--secondary-color)';
        document.querySelector('.floor-projection').appendChild(ripple);
        
        // Show warning for 5 seconds
        setTimeout(() => {
            alertEl.classList.remove('active');
        }, 5000);
    }
});
