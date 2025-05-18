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
    const floorProjection = document.querySelector('.floor-projection');
    
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
    let mouseControlActive = false;
    let lastMouseTilt = null;
    let mouseControlTimeout = null;
    let lastMilestoneStep = 0;
    
    // Sample data for quicker testing
    const sampleData = {
        workoutTime: 300000, // 5 minutes in milliseconds
        steps: 500,
        heartRate: 125,
        calories: 75
    };
    
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
            case 'e':
            case 'E':
                if (workoutActive) {
                    endWorkout();
                    showScreen(4); // Show completion screen
                }
                break;
        }
    });
    
    // On-screen controls
    leftBtn.addEventListener('click', () => handleTilt('left'));
    rightBtn.addEventListener('click', () => handleTilt('right'));
    selectBtn.addEventListener('click', () => handleTilt('forward'));
    
    // Mouse control for shoe movement
    floorProjection.addEventListener('mousemove', (e) => {
        if (!mouseControlActive) return;
        
        const rect = floorProjection.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const centerThreshold = width * 0.1; // 10% of width for center area
        
        // Clear any pending timeouts
        if (mouseControlTimeout) {
            clearTimeout(mouseControlTimeout);
        }
        
        if (x < (width / 2) - centerThreshold) {
            // Left side of screen
            if (lastMouseTilt !== 'left') {
                shoeImage.classList.remove('tilt-right', 'tilt-forward');
                shoeImage.classList.add('tilt-left');
                lastMouseTilt = 'left';
                
                // Auto-reset after a delay
                mouseControlTimeout = setTimeout(() => {
                    shoeImage.classList.remove('tilt-left');
                    lastMouseTilt = null;
                }, 1000);
            }
        } else if (x > (width / 2) + centerThreshold) {
            // Right side of screen
            if (lastMouseTilt !== 'right') {
                shoeImage.classList.remove('tilt-left', 'tilt-forward');
                shoeImage.classList.add('tilt-right');
                lastMouseTilt = 'right';
                
                // Auto-reset after a delay
                mouseControlTimeout = setTimeout(() => {
                    shoeImage.classList.remove('tilt-right');
                    lastMouseTilt = null;
                }, 1000);
            }
        } else {
            // Center area
            if (lastMouseTilt !== null) {
                shoeImage.classList.remove('tilt-left', 'tilt-right', 'tilt-forward');
                lastMouseTilt = null;
            }
        }
    });
    
    // Mouse click to perform selected tilt action
    floorProjection.addEventListener('click', () => {
        if (!mouseControlActive) return;
        
        if (lastMouseTilt === 'left') {
            handleTilt('left');
        } else if (lastMouseTilt === 'right') {
            handleTilt('right');
        } else {
            handleTilt('forward');
        }
    });
    
    // Toggle mouse control
    document.addEventListener('keydown', (e) => {
        if (e.key === 'm' || e.key === 'M') {
            mouseControlActive = !mouseControlActive;
            showVoiceFeedback(mouseControlActive ? 'Mouse control activated' : 'Mouse control deactivated');
        }
    });
    
    // Cursor position tracking for shoe tilt
    let cursorTrackingActive = true;  // Enable by default
    let cursorTimeout = null;
    
    document.addEventListener('mousemove', (e) => {
        // Only track cursor when it's in the top portion of the screen
        const topTrackingThreshold = window.innerHeight * 0.3; // Top 30% of the screen
        
        if (e.clientY < topTrackingThreshold && cursorTrackingActive) {
            // Clear any pending cursor timeouts
            if (cursorTimeout) {
                clearTimeout(cursorTimeout);
            }
            
            // Calculate position in a fixed arc
            const screenWidth = window.innerWidth;
            const xPosition = e.clientX;
            
            // Divide screen into three zones: left, center, right
            const leftThreshold = screenWidth * 0.33;
            const rightThreshold = screenWidth * 0.66;
            
            // Remove any existing tilt classes
            shoeImage.classList.remove('tilt-left', 'tilt-right', 'tilt-forward');
            
            if (xPosition < leftThreshold) {
                // Left zone - tilt left
                shoeImage.classList.add('tilt-left');
                lastMouseTilt = 'left';
            } else if (xPosition > rightThreshold) {
                // Right zone - tilt right
                shoeImage.classList.add('tilt-right');
                lastMouseTilt = 'right';
            } else {
                // Center zone - no tilt
                lastMouseTilt = null;
            }
            
            // Auto-reset after a delay when cursor stops moving
            cursorTimeout = setTimeout(() => {
                shoeImage.classList.remove('tilt-left', 'tilt-right');
                lastMouseTilt = null;
            }, 1500);
        } else if (lastMouseTilt !== null && !mouseControlActive) {
            // Reset when leaving tracking area
            shoeImage.classList.remove('tilt-left', 'tilt-right');
            lastMouseTilt = null;
        }
    });
    
    // Toggle cursor tracking with 'T' key
    document.addEventListener('keydown', (e) => {
        if (e.key === 't' || e.key === 'T') {
            cursorTrackingActive = !cursorTrackingActive;
            showVoiceFeedback(cursorTrackingActive ? 'Top cursor tracking activated' : 'Top cursor tracking deactivated');
            
            // Reset shoe position when disabling
            if (!cursorTrackingActive) {
                shoeImage.classList.remove('tilt-left', 'tilt-right');
                lastMouseTilt = null;
            }
        }
    });
    
    // Load sample data button - added to the workout screen
    const loadSampleData = () => {
        if (!workoutActive) return;
        
        // Set workout elapsed time to sample value
        workoutElapsedTime = sampleData.workoutTime;
        
        // Update stats with sample data
        steps = sampleData.steps;
        heartRate = sampleData.heartRate;
        calories = sampleData.calories;
        distance = (steps * 0.0007).toFixed(2);
        
        // Update UI
        updateWorkoutStats();
        showVoiceFeedback('Sample data loaded');
    };
    
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
            
            // Simulate haptic feedback
            simulateHapticFeedback(direction);
            
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
    
    // Simulate haptic feedback for different tilt actions
    function simulateHapticFeedback(direction) {
        // Check if vibration API is supported
        if (navigator.vibrate) {
            switch (direction) {
                case 'left':
                    // Short pulse for left tilt
                    navigator.vibrate(30);
                    break;
                case 'right':
                    // Short pulse for right tilt
                    navigator.vibrate(30);
                    break;
                case 'forward':
                    // Double pulse for selection/confirmation
                    navigator.vibrate([40, 30, 40]);
                    break;
                default:
                    // Default short vibration
                    navigator.vibrate(20);
            }
        }
        
        // Visual haptic feedback (for devices without vibration support)
        const hapticEffect = document.createElement('div');
        hapticEffect.className = `haptic-effect ${direction}-haptic`;
        document.querySelector('.floor-projection').appendChild(hapticEffect);
        
        // Remove after animation
        setTimeout(() => {
            hapticEffect.remove();
        }, 300);
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
                
                // Create load sample data button
                const indicator = document.querySelector('#workout-screen .indicator-text');
                if (indicator) {
                    indicator.innerHTML = `
                        Tilt <span class="forward-indicator">forward ▼</span> to pause workout | 
                        Press <span class="key" style="font-size: 0.8rem; padding: 0.1rem 0.3rem;">E</span> to end workout |
                        Press <span class="key" style="font-size: 0.8rem; padding: 0.1rem 0.3rem;">S</span> to load sample data
                    `;
                }
                
                // Add load sample data key
                document.addEventListener('keydown', (e) => {
                    if ((e.key === 's' || e.key === 'S') && workoutActive) {
                        loadSampleData();
                    }
                });
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
        
        // Remind about ending workout after 30 seconds
        setTimeout(() => {
            if (workoutActive && !workoutPaused) {
                showVoiceFeedback('Press E to end your workout at any time');
            }
        }, 30000);
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
        
        // Update final stats with values from workout or sample data
        const statHeartRate = document.querySelector('.stat-circle.heart .stat-value');
        const statSteps = document.querySelector('.stat-circle.steps .stat-value');
        const finalCalories = document.getElementById('finalCalories');
        
        if (statHeartRate) statHeartRate.textContent = `${heartRate} bpm`;
        if (statSteps) statSteps.textContent = steps;
        if (finalCalories) finalCalories.textContent = calories;
        
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
    
    // Update workout stats - steps, heart rate, distance, etc.
    function updateWorkoutStats() {
        // Calculate distance based on steps (very rough estimation)
        distance = (steps * 0.0007).toFixed(2);
        
        // Update DOM elements with current stats
        heartRateEl.textContent = `${heartRate} bpm`;
        caloriesEl.textContent = `${calories} kcal`;
        stepCountEl.textContent = `${steps} steps`;
        distanceEl.textContent = `${distance} km`;
        
        // Set body temperature based on heart rate (simple simulation)
        const temp = 36.5 + (heartRate - 80) * 0.01;
        tempEl.textContent = `${temp.toFixed(1)}°C`;
        
        // Calculate pace (km/h) - simple calculation for simulation
        const paceElement = document.getElementById('pace');
        const hoursElapsed = workoutElapsedTime / 3600000; // Convert ms to hours
        const pace = hoursElapsed > 0 ? (distance / hoursElapsed).toFixed(1) : '0.0';
        paceElement.textContent = `${pace} km/h`;
        
        // Update workout time displays
        const minutesElapsed = Math.floor(workoutElapsedTime / 60000);
        timeElapsedEl.textContent = `${minutesElapsed} min`;
        
        // Update progress visualization
        const targetSteps = 5000; // Example target
        updateProgressVisualization(steps, targetSteps);

        // Update advanced 3D progress visualization
        updateAdvancedVisualization(steps, targetSteps);
        
        // If heart rate goes above 140, show health alert
        if (heartRate > 140 && !document.getElementById('healthAlert').classList.contains('active')) {
            showHealthAlert('High heart rate detected! Consider slowing down');
        }
        
        // Celebration at milestones (every 1000 steps)
        if (steps > 0 && steps % 1000 === 0 && steps !== lastMilestoneStep) {
            celebrateMilestone(steps);
            lastMilestoneStep = steps;
        }
    }
    
    // Update advanced 3D progress visualization
    function updateAdvancedVisualization(currentSteps, targetSteps) {
        // Calculate progress percentage
        const progressPercent = Math.min((currentSteps / targetSteps) * 100, 100);
        
        // Update user marker position
        const userMarker = document.getElementById('userMarker');
        const pathWidth = 90; // Path is 90% of container width (see CSS)
        userMarker.style.left = `${5 + (pathWidth * progressPercent / 100)}%`;
        
        // Update completion percentage text
        const completionPercent = document.getElementById('completionPercent');
        completionPercent.textContent = `${Math.round(progressPercent)}%`;
        
        // Update calorie progress
        const calorieProgress = document.getElementById('calorieProgress');
        const calorieTarget = 300; // Example target
        calorieProgress.textContent = `${calories}/${calorieTarget}`;
        
        // Clear existing milestones
        const milestoneContainer = document.getElementById('milestoneMarkers');
        milestoneContainer.innerHTML = '';
        
        // Add milestone markers (every 20% of target)
        for (let i = 1; i < 5; i++) {
            const milestone = document.createElement('div');
            milestone.className = 'milestone';
            const milestonePosition = 5 + (pathWidth * (i * 20) / 100);
            milestone.style.left = `${milestonePosition}%`;
            
            // If we've passed this milestone, add a class to style it differently
            if (progressPercent >= i * 20) {
                milestone.classList.add('reached');
            }
            
            milestoneContainer.appendChild(milestone);
        }
        
        // Animation effects based on progress
        const visualizationContainer = document.querySelector('.visualization-container');
        
        // More advanced 3D effect as you progress
        const progressRotation = 15 - (progressPercent / 100) * 5; // Gradually reduce the rotation from 15 to 10 degrees
        visualizationContainer.style.transform = `rotateX(${progressRotation}deg)`;
        
        // Increase glow effect as you approach target
        const glowIntensity = Math.min(5 + (progressPercent / 100) * 15, 20);
        userMarker.style.boxShadow = `0 0 ${glowIntensity}px var(--primary-color)`;
        
        // Add shake effect when reaching exact 50% mark
        if (Math.abs(progressPercent - 50) < 1 && !userMarker.classList.contains('milestone-pulse')) {
            userMarker.classList.add('milestone-pulse');
            setTimeout(() => {
                userMarker.classList.remove('milestone-pulse');
            }, 1000);
            
            // Voice feedback at 50%
            showVoiceFeedback("Halfway there! Keep going!");
        }
        
        // Celebrate when reaching 100%
        if (progressPercent >= 100 && !userMarker.classList.contains('celebration')) {
            userMarker.classList.add('celebration');
            
            // Add celebration effect to path
            const progressPath = document.getElementById('progressPath');
            progressPath.classList.add('path-complete');
            
            // Voice feedback at 100%
            showVoiceFeedback("Target reached! Excellent work!");
        }
    }
    
    // Celebration effect for reaching milestones
    function celebrateMilestone(steps) {
        // Create a celebration ripple
        const ripple = document.createElement('div');
        ripple.className = 'ripple-effect';
        ripple.style.left = `${30 + Math.random() * 40}%`;
        ripple.style.backgroundColor = getRandomColor();
        document.querySelector('.floor-projection').appendChild(ripple);
        
        // Celebrate with visual effects
        celebrateCompletion();
        
        // Show voice feedback
        showVoiceFeedback(`Milestone reached: ${steps} steps`);
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
        const voiceEl = document.getElementById('voiceFeedback');
        const voiceTextEl = document.getElementById('voiceText');
        
        voiceTextEl.textContent = message;
        voiceEl.classList.add('active');
        
        setTimeout(() => {
            voiceEl.classList.remove('active');
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
    
    // Add instructions for mouse and keyboard controls
    showVoiceFeedback('Welcome! Use arrow keys to navigate or press M to activate mouse control');

    // Voice command recognition simulation
    const voiceCommandContainer = document.getElementById('voiceCommandContainer');
    const voiceWaves = document.getElementById('voiceWaves');
    const voiceCommandText = document.getElementById('voiceCommandText');
    const voiceHelpToggle = document.getElementById('voiceHelpToggle');
    
    // Toggle voice recognition with V key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'v' || e.key === 'V') {
            toggleVoiceRecognition();
        }
    });
    
    // Simulate voice command recognition
    function toggleVoiceRecognition() {
        const isActive = voiceCommandContainer.classList.toggle('voice-active');
        
        if (isActive) {
            voiceCommandText.textContent = "Listening...";
            showVoiceFeedback("Voice recognition activated");
            
            // Simulate processing after a short delay
            setTimeout(() => {
                simulateVoiceCommand();
            }, 2000);
        } else {
            voiceCommandText.textContent = "Say a command...";
            showVoiceFeedback("Voice recognition deactivated");
        }
    }
    
    // Simulate voice command processing
    function simulateVoiceCommand() {
        // Only process if still active
        if (!voiceCommandContainer.classList.contains('voice-active')) {
            return;
        }
        
        // Simulate thinking
        voiceCommandText.textContent = "Processing...";
        
        // Random commands to simulate
        const commands = [
            "start workout",
            "pause workout",
            "resume workout",
            "end workout",
            "show stats",
            "how am I doing"
        ];
        
        // Pick a random command
        const randomIndex = Math.floor(Math.random() * commands.length);
        const command = commands[randomIndex];
        
        // Show recognized command
        setTimeout(() => {
            voiceCommandText.textContent = `"${command}"`;
            
            // Process the command
            processVoiceCommand(command);
            
            // Reset after processing
            setTimeout(() => {
                voiceCommandContainer.classList.remove('voice-active');
                voiceCommandText.textContent = "Say a command...";
            }, 2000);
        }, 1000);
    }
    
    // Process voice commands
    function processVoiceCommand(command) {
        switch (command.toLowerCase()) {
            case "start workout":
                if (currentScreenIndex < 3) {
                    showVoiceFeedback("Starting workout...");
                    startCountdown();
                } else {
                    showVoiceFeedback("Workout already in progress");
                }
                break;
                
            case "pause workout":
                if (workoutActive && !workoutPaused) {
                    showVoiceFeedback("Pausing workout");
                    pauseWorkout();
                } else {
                    showVoiceFeedback("No active workout to pause");
                }
                break;
                
            case "resume workout":
                if (workoutActive && workoutPaused) {
                    showVoiceFeedback("Resuming workout");
                    resumeWorkout();
                } else {
                    showVoiceFeedback("No paused workout to resume");
                }
                break;
                
            case "end workout":
                if (workoutActive) {
                    showVoiceFeedback("Ending workout");
                    endWorkout();
                    showScreen(4); // Show completion screen
                } else {
                    showVoiceFeedback("No active workout to end");
                }
                break;
                
            case "show stats":
                if (workoutActive) {
                    const statsSummary = `Current stats: ${steps} steps, ${distance} km, ${heartRate} bpm, ${calories} calories burned`;
                    showVoiceFeedback(statsSummary);
                } else {
                    showVoiceFeedback("No active workout stats to show");
                }
                break;
                
            case "how am I doing":
                if (workoutActive) {
                    const progress = (steps / 5000) * 100; // Assuming 5000 steps target
                    let feedback;
                    
                    if (progress < 25) {
                        feedback = "Just getting started. Keep going!";
                    } else if (progress < 50) {
                        feedback = "You're making good progress!";
                    } else if (progress < 75) {
                        feedback = "Great work! More than halfway there.";
                    } else if (progress < 100) {
                        feedback = "Almost there! Strong finish!";
                    } else {
                        feedback = "Amazing! You've reached your target!";
                    }
                    
                    showVoiceFeedback(feedback);
                } else {
                    showVoiceFeedback("No active workout to evaluate");
                }
                break;
                
            default:
                showVoiceFeedback("Command not recognized");
                break;
        }
    }
});
