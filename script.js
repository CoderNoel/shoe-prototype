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
            
            // Highlight the active tech indicator
            highlightTechIndicator(direction);
            
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
                resetTechIndicators();
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
    
    // Highlight the appropriate tech indicator based on tilt direction
    function highlightTechIndicator(direction) {
        const indicators = document.querySelectorAll('.tech-indicator');
        
        indicators.forEach(indicator => {
            indicator.style.animation = 'none';
            indicator.style.opacity = '0.3';
        });
        
        if (direction === 'left') {
            const leftIndicator = document.querySelector('.tech-indicator.left');
            leftIndicator.style.backgroundColor = '#ffffff';
            leftIndicator.style.opacity = '1';
            leftIndicator.style.boxShadow = '0 0 20px #ffffff, 0 0 30px var(--primary-color)';
            leftIndicator.style.transform = 'scale(1.5)';
        } else if (direction === 'right') {
            const rightIndicator = document.querySelector('.tech-indicator.right');
            rightIndicator.style.backgroundColor = '#ffffff';
            rightIndicator.style.opacity = '1';
            rightIndicator.style.boxShadow = '0 0 20px #ffffff, 0 0 30px var(--primary-color)';
            rightIndicator.style.transform = 'scale(1.5)';
        } else { // forward
            const centerIndicator = document.querySelector('.tech-indicator.center');
            centerIndicator.style.backgroundColor = '#ffffff';
            centerIndicator.style.opacity = '1';
            centerIndicator.style.boxShadow = '0 0 20px #ffffff, 0 0 30px var(--primary-color)';
            centerIndicator.style.transform = 'scale(1.5)';
        }
    }
    
    // Reset all tech indicators to their normal state
    function resetTechIndicators() {
        const indicators = document.querySelectorAll('.tech-indicator');
        
        indicators.forEach((indicator, index) => {
            indicator.style.backgroundColor = 'var(--primary-color)';
            indicator.style.opacity = '0.7';
            indicator.style.boxShadow = '0 0 10px var(--primary-color)';
            indicator.style.transform = 'scale(1)';
            
            // Restart the animations with different delays
            setTimeout(() => {
                indicator.style.animation = `pulseLight 2s infinite ${index * 0.6}s`;
            }, 100);
        });
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
                    // Move goal tab left or decrease value
                    if (document.activeElement === sliderHandle || !document.activeElement) {
                        // Decrease slider value
                        sliderValue = Math.max(0, sliderValue - 5);
                        updateSlider();
                    } else {
                        // Move between tabs
                        selectedGoalTab = Math.max(0, selectedGoalTab - 1);
                        updateSelectedGoalTab();
                    }
                } else if (direction === 'right') {
                    // Move goal tab right or increase value
                    if (document.activeElement === sliderHandle || !document.activeElement) {
                        // Increase slider value
                        sliderValue = Math.min(100, sliderValue + 5);
                        updateSlider();
                    } else {
                        // Move between tabs
                        selectedGoalTab = Math.min(goalTabs.length - 1, selectedGoalTab + 1);
                        updateSelectedGoalTab();
                    }
                } else if (direction === 'forward') {
                    // Start countdown
                    showScreen(2); // Show countdown screen
                    startCountdown();
                }
                break;
                
            case 2: // Countdown Screen
                // No actions during countdown - it's automatic
                break;
                
            case 3: // Start Screen (legacy)
                if (direction === 'left') {
                    highlightButton('no-button');
                    showVoiceFeedback('Cancel workout?');
                } else if (direction === 'right') {
                    highlightButton('yes-button');
                    showVoiceFeedback('Start workout?');
                } else if (direction === 'forward') {
                    // Check if yes button is selected
                    if (document.querySelector('.yes-button').classList.contains('selected')) {
                        startWorkout();
                    } else if (document.querySelector('.no-button').classList.contains('selected')) {
                        showVoiceFeedback('Workout canceled');
                        setTimeout(() => {
                            resetWorkout();
                            showScreen(0); // Back to workout type selection
                        }, 1500);
                    } else {
                        showVoiceFeedback('Please select yes or no first');
                    }
                }
                break;
                
            case 4: // Workout screen
                if (direction === 'left' && workoutPaused) {
                    endWorkout();
                } else if (direction === 'forward' && workoutPaused) {
                    resumeWorkout();
                }
                break;
                
            case 5: // Complete screen
                if (direction === 'forward') {
                    resetWorkout();
                    showScreen(0); // Back to workout type selection
                }
                break;
        }
    }
    
    // Helper functions for workout type selection
    function updateSelectedWorkoutOption() {
        workoutOptions.forEach((option, index) => {
            option.classList.toggle('selected', index === selectedWorkoutOption);
        });
    }
    
    function getWorkoutTypeName(index) {
        const types = ['Run', 'Walk', 'HIIT'];
        return types[index];
    }
    
    // Helper functions for goal selection
    function updateSelectedGoalTab() {
        goalTabs.forEach((tab, index) => {
            tab.classList.toggle('selected', index === selectedGoalTab);
        });
        
        // Update goal type and unit
        const goalTypes = ['distance', 'calories', 'duration'];
        currentGoalType = goalTypes[selectedGoalTab];
        goalUnit.textContent = goalSettings[currentGoalType].unit;
        
        // Update slider value based on new goal type
        updateSlider();
    }
    
    function updateSlider() {
        if (!sliderHandle || !sliderFill) return;
        
        // Update slider position
        sliderHandle.style.left = `${sliderValue}%`;
        sliderFill.style.width = `${sliderValue}%`;
        
        // Calculate actual value based on min/max and format it
        const settings = goalSettings[currentGoalType];
        const range = settings.max - settings.min;
        const actualValue = settings.min + (range * sliderValue / 100);
        
        // Update displayed value
        goalValue.textContent = settings.format(actualValue);
    }
    
    // Countdown function
    function startCountdown() {
        const countdownEl = document.querySelector('.countdown-number');
        let count = 3;
        
        countdownEl.textContent = count;
        
        const countInterval = setInterval(() => {
            count--;
            
            if (count > 0) {
                countdownEl.textContent = count;
            } else {
                clearInterval(countInterval);
                showScreen(4); // Go to workout screen directly
                startWorkout();
            }
        }, 1000);
    }
    
    // Highlight selected button
    function highlightButton(buttonClass) {
        document.querySelectorAll('.action-button').forEach(btn => {
            btn.classList.remove('selected');
        });
        document.querySelector(`.${buttonClass}`).classList.add('selected');
    }
    
    // Start workout
    function startWorkout() {
        showScreen(4); // Use correct index for workout screen
        workoutActive = true;
        workoutPaused = false;
        workoutStartTime = Date.now();
        
        showVoiceFeedback('Workout starting now');
        
        // Set up workout interval
        workoutInterval = setInterval(() => {
            if (!workoutPaused) {
                updateWorkoutStats();
            }
        }, 1000);
    }
    
    // Pause workout
    function pauseWorkout() {
        workoutPaused = true;
        workoutElapsedTime += (Date.now() - workoutStartTime);
        
        // Show pause overlay
        document.getElementById('pauseOverlay').classList.add('active');
        
        showVoiceFeedback('Workout paused. Tilt forward to resume or left to end');
    }
    
    // Resume workout
    function resumeWorkout() {
        workoutPaused = false;
        workoutStartTime = Date.now();
        
        // Hide pause overlay
        document.getElementById('pauseOverlay').classList.remove('active');
        
        showVoiceFeedback('Resuming workout');
    }
    
    // End workout
    function endWorkout() {
        clearInterval(workoutInterval);
        workoutActive = false;
        workoutPaused = false;
        
        // Update final stats on completion screen
        document.querySelector('.stat-circle.heart .stat-value').textContent = `${heartRate} bpm`;
        document.querySelector('.stat-circle.steps .stat-value').textContent = steps.toString();
        document.getElementById('finalCalories').textContent = calories.toString();
        
        showScreen(5); // Use correct index for completion screen
        showVoiceFeedback('Workout completed! Great job!');
        
        // Set up mood selection handlers
        setupMoodSelection();
        
        // Add a confetti effect or celebration animation
        celebrateCompletion();
    }
    
    // Setup mood selection functionality
    function setupMoodSelection() {
        const moodOptions = document.querySelectorAll('.mood-option');
        moodOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                // Remove selected class from all options
                moodOptions.forEach(opt => opt.classList.remove('selected'));
                
                // Add selected class to clicked option
                e.currentTarget.classList.add('selected');
                
                const mood = e.currentTarget.getAttribute('data-mood');
                showVoiceFeedback(`You felt ${mood} during this workout`);
            });
        });
        
        // Setup sync button
        const syncButton = document.querySelector('.sync-button');
        syncButton.addEventListener('click', () => {
            syncButton.innerHTML = '<i class="fas fa-check"></i><span>Synced with Apple Health</span>';
            syncButton.style.backgroundColor = 'rgba(0, 168, 107, 0.2)';
            syncButton.style.borderColor = 'rgba(0, 168, 107, 0.5)';
            syncButton.querySelector('i').style.color = '#00a86b';
            
            showVoiceFeedback('Workout data synced with Apple Health');
        });
    }
    
    // Celebration animation
    function celebrateCompletion() {
        // Add a simple celebration animation
        const trophy = document.querySelector('.trophy');
        
        // Enhanced glow effect
        trophy.style.boxShadow = '0 0 30px rgba(255, 215, 0, 0.8), 0 0 50px rgba(255, 255, 255, 0.6)';
        
        // Create a confetti-like effect using emojis
        const confettiEmojis = ['🎉', '🎊', '✨', '🏆', '💪', '🥇'];
        const container = document.getElementById('complete-screen');
        
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const emoji = document.createElement('div');
                emoji.className = 'confetti-emoji';
                emoji.textContent = confettiEmojis[Math.floor(Math.random() * confettiEmojis.length)];
                emoji.style.left = Math.random() * 100 + 'vw';
                emoji.style.animationDuration = (Math.random() * 2 + 3) + 's'; // Between 3-5s
                
                container.appendChild(emoji);
                
                // Remove after animation completes
                setTimeout(() => {
                    emoji.remove();
                }, 5000);
            }, i * 150);
        }
    }
    
    // Preload assets
    function preloadAssets() {
        // Create fake progress for loading experience
        let loadingProgress = 0;
        const loadingInterval = setInterval(() => {
            loadingProgress += 10;
            if (loadingProgress >= 100) {
                clearInterval(loadingInterval);
            }
        }, 200);
    }
    
    // Update workout statistics
    function updateWorkoutStats() {
        // Calculate elapsed time
        const currentTime = Date.now();
        const elapsedSeconds = Math.floor((currentTime - workoutStartTime + workoutElapsedTime) / 1000);
        const elapsedMinutes = Math.floor(elapsedSeconds / 60);
        
        // Update stats based on elapsed time (simulated data)
        heartRate = 80 + Math.floor(Math.random() * 10) + Math.min(40, elapsedMinutes * 2);
        steps = Math.min(5000, Math.floor(elapsedSeconds * (5 + Math.random() * 2)));
        distance = (steps / 1300).toFixed(2); // Approx. conversion
        calories = Math.floor(elapsedMinutes * (8 + Math.random() * 3));
        
        // Update DOM elements
        heartRateEl.textContent = `${heartRate} bpm`;
        caloriesEl.textContent = `${calories}/${calories - 2} ${Math.min(98, calories)}%`;
        stepCountEl.textContent = `${steps} steps`;
        distanceEl.textContent = `${distance} km`;
        timeElapsedEl.textContent = `${elapsedMinutes} min`;
        timeRemainingEl.textContent = `${Math.max(0, 60 - elapsedMinutes)} min`;
        
        // Update progress visualization
        updateProgressVisualization(steps, 5000);
        
        // Check if workout goal is reached
        if (steps >= 5000) {
            endWorkout();
            return;
        }
        
        // Trigger health alerts based on conditions
        if (heartRate > 140 && Math.random() < 0.1 && !document.getElementById('workoutAlert').classList.contains('active')) {
            if (heartRate > 160) {
                // More urgent alert for very high heart rate
                showHealthAlert('Very high heart rate detected!', 'danger');
                
                // After a short delay, show the workout alert that requires action
                setTimeout(() => {
                    showWorkoutAlert('High Heart Rate', 'Your heart rate is very high. You should slow down.', 'heart');
                }, 3000);
            } else {
                // Regular alert for elevated heart rate
                showHealthAlert('High heart rate detected', 'warning');
            }
        } 
        // Random inactivity alert if steps haven't increased significantly
        else if (elapsedSeconds > 30 && elapsedSeconds % 30 === 0 && Math.random() < 0.2 && steps < 100) {
            showHealthAlert('Low activity detected', 'info');
        }
        // Random encouragement
        else if (elapsedSeconds > 30 && elapsedSeconds % 60 === 0 && Math.random() < 0.3) {
            showVoiceFeedback(getRandomEncouragement());
        }
    }
    
    // Update the progress visualization
    function updateProgressVisualization(currentSteps, targetSteps) {
        const progressFill = document.getElementById('progressFill');
        const currentProgress = document.getElementById('currentProgress');
        const progressStepCount = document.getElementById('progressStepCount');
        
        // Calculate percentage
        const percentage = Math.min(100, (currentSteps / targetSteps) * 100);
        
        // Update fill width
        progressFill.style.width = `${percentage}%`;
        
        // Update marker position
        currentProgress.style.transform = `translateX(${percentage}%)`;
        
        // Update step count
        progressStepCount.textContent = currentSteps;
        
        // Add pulse animation near achievement points
        if (percentage >= 25 && percentage < 26 || 
            percentage >= 50 && percentage < 51 || 
            percentage >= 75 && percentage < 76 || 
            percentage >= 99 && percentage <= 100) {
            
            const progressMarker = document.querySelector('.progress-marker');
            progressMarker.style.animation = 'none';
            
            // Force reflow to restart animation
            void progressMarker.offsetWidth;
            
            // Apply celebration pulse
            progressMarker.style.animation = 'pulseLight 0.5s 3';
            
            // Show achievement message
            if (percentage >= 25 && percentage < 26) {
                showVoiceFeedback('25% of your goal completed!');
            } else if (percentage >= 50 && percentage < 51) {
                showVoiceFeedback('Halfway there! Keep going!');
            } else if (percentage >= 75 && percentage < 76) {
                showVoiceFeedback('75% complete! Almost there!');
            } else if (percentage >= 99 && percentage <= 100) {
                showVoiceFeedback('Goal achieved! Great job!');
            }
        }
    }
    
    // Show health alert banner
    function showHealthAlert(message, type = 'warning') {
        const alertEl = document.getElementById('healthAlert');
        const alertText = document.getElementById('healthAlertText');
        const alertIcon = alertEl.querySelector('.alert-icon i');
        
        // Update message
        alertText.textContent = message;
        
        // Update icon based on alert type
        if (type === 'danger') {
            alertIcon.className = 'fas fa-exclamation-triangle';
            alertEl.style.backgroundColor = 'rgba(220, 53, 69, 0.85)';
        } else if (type === 'warning') {
            alertIcon.className = 'fas fa-exclamation-circle';
            alertEl.style.backgroundColor = 'rgba(255, 193, 7, 0.85)';
        } else if (type === 'info') {
            alertIcon.className = 'fas fa-info-circle';
            alertEl.style.backgroundColor = 'rgba(23, 162, 184, 0.85)';
        }
        
        // Show the alert
        alertEl.classList.add('active');
        
        // Announce to screen readers
        showVoiceFeedback(message);
        
        // Hide after a few seconds
        setTimeout(() => {
            alertEl.classList.remove('active');
        }, 5000);
    }
    
    // Preload assets
    function preloadAssets() {
        // Create fake progress for loading experience
        let loadingProgress = 0;
        const loadingInterval = setInterval(() => {
            loadingProgress += 10;
            if (loadingProgress >= 100) {
                clearInterval(loadingInterval);
            }
        }, 200);
    }
    
    // Initialize
    preloadAssets();
});
