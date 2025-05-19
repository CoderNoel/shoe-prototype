document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded - initializing Smart Shoe application");
    
    // DOM Elements
    const startBtn = document.getElementById('startBtn');
    const continueBtn = document.getElementById('continueBtn');
    const projectInfo = document.getElementById('project-info');
    const instructions = document.getElementById('instructions');
    const introScreensContainer = document.querySelector('.intro-screens-container');
    const screens = document.querySelectorAll('.screen');
    const shoeImage = document.getElementById('shoeImage');
    const tiltIndicator = document.getElementById('tiltIndicator');
    const tiltArrow = document.getElementById('tiltArrow');
    const voiceFeedback = document.getElementById('voiceFeedback');
    const voiceText = document.getElementById('voiceText');
    const floorProjection = document.querySelector('.floor-projection');
    const projectionArea = document.querySelector('.projection-area');
    const projectionBeam = document.getElementById('projectionBeam');
    const tryAgainBtn = document.getElementById('tryAgainBtn');
    
    // Verify we can find the sync button
    const syncButton = document.querySelector('.sync-button');
    if (syncButton) {
        console.log("Found sync button:", syncButton);
    } else {
        console.error("Could not find sync button in DOM");
    }
    
    // Log all available screens for debugging
    console.log("Available screens:", screens.length);
    screens.forEach((screen, index) => {
        console.log(`Screen ${index}: id=${screen.id}, classes=${screen.className}`);
    });
    
    const endScreen = document.getElementById('end-screen');
    if (endScreen) {
        console.log("Found end-screen element:", endScreen);
    } else {
        console.error("Could not find end-screen element");
    }
    
    // Add flag to track back button hover state
    let isBackButtonHovered = false;
    
    // On-screen control buttons
    const leftBtn = document.getElementById('leftBtn');
    const selectBtn = document.getElementById('selectBtn');
    const rightBtn = document.getElementById('rightBtn');
    
    // Workout type selection elements
    const workoutOptions = document.querySelectorAll('.workout-option');
    
    // Start workout buttons
    const startWorkoutBtns = document.querySelectorAll('.start-workout-btn');
    
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
    let mouseTiltActive = true; // Set mouse control active by default
    let lastMouseTilt = null;
    let mouseControlTimeout = null;
    let lastMilestoneStep = 0;
    
    // Add demo mode flag and settings
    let demoMode = true; // Always use demo mode for this prototype
    let demoCompletionTime = 20000; // Complete demo in 20 seconds
    let demoProgressPercentage = 0;
    let demoTargetSteps = 5000;
    let demoTargetCalories = 300;
    let demoMaxHeartRate = 145;
    
    // Set cursor tracking as active by default
    let cursorTrackingActive = true;
    
    // Add a flag to control UI interactivity
    let uiActive = false;
    
    // Sample data for quicker testing - no longer needed with demo mode
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
    
    // Smart goal value arrays
    const distanceSteps = [0.5, 1, 2, 5, 10, 20, 30, 50, 100];
    const calorieSteps = [50, 100, 200, 300, 500, 750, 1000, 1500, 2000];
    const durationSteps = [5, 10, 15, 20, 30, 45, 60, 90, 120];
    
    // Helper to get current index in array
    function getCurrentGoalIndex(goalType, value) {
        let arr = [];
        if (goalType === 'distance') arr = distanceSteps;
        else if (goalType === 'calories') arr = calorieSteps;
        else if (goalType === 'duration') arr = durationSteps;
        // Find closest value (in case of floating point imprecision)
        let idx = arr.findIndex(v => Math.abs(v - value) < 0.01);
        if (idx === -1) {
            // If not found, clamp to nearest
            let minDiff = Infinity, minIdx = 0;
            arr.forEach((v, i) => { if (Math.abs(v - value) < minDiff) { minDiff = Math.abs(v - value); minIdx = i; } });
            idx = minIdx;
        }
        return idx;
    }
    
    // Helper to get smart step array for current goal type
    function getCurrentStepArray() {
        if (currentGoalType === 'distance') return distanceSteps;
        if (currentGoalType === 'calories') return calorieSteps;
        if (currentGoalType === 'duration') return durationSteps;
        return [];
    }
    
    // Store the current index in the smart step array
    let currentStepIndex = 0;
    
    // Set default value to first smart step for current goal type
    function setDefaultGoalValue() {
        const arr = getCurrentStepArray();
        currentStepIndex = 0;
        updateSlider();
    }
    
    // On load, set default goal value
    setDefaultGoalValue();
    
    // Initialize intro screens container
    function initIntroScreens() {
        // Show only the project info screen initially
        projectInfo.style.display = 'flex';
        instructions.style.display = 'none'; // Hide instructions initially
        
        // Reset any transform
        introScreensContainer.style.transform = '';
        introScreensContainer.style.opacity = '1';
        
        // Reset container position
        introScreensContainer.style.position = 'fixed';
        introScreensContainer.style.top = '0';
        introScreensContainer.style.left = '0';
        introScreensContainer.style.width = '100%';
        introScreensContainer.style.height = '100%';
        
        console.log("Initialized intro screens - project info visible, instructions hidden");
    }
    
    // Call initialization
    initIntroScreens();
    
    // Continue button click event - completely redesigned for reliability
    continueBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        // Create a ripple effect for feedback
        createRippleEffect('forward', true);
        
        // Simply hide project info and show instructions
        // Skip the sliding animation since it's causing issues
        projectInfo.style.display = 'none';
        instructions.style.display = 'flex';
        
        console.log("Continue button clicked - showing instructions screen");
        
        // Show voice feedback to confirm transition
        showVoiceFeedback('Learn how to use the interface');
    });
    
    // Start button click event - updated to hide entire intro container
    startBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        // Create ripple effect
        createRippleEffect('forward', true);
        
        // Hide the entire intro screens container with a fade out
        introScreensContainer.style.opacity = '0';
        setTimeout(() => {
            introScreensContainer.style.display = 'none';
            showScreen(0); // Show workout type selection
            showVoiceFeedback('Select a workout type');
            preloadAssets();
            uiActive = true; // Enable UI interactivity
            updateBackButton();
        }, 500);
    });
    
    // Keyboard controls
    document.addEventListener('keydown', (event) => {
        if (!uiActive) return;
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
        if (!uiActive || !mouseTiltActive) return;
        
        const rect = floorProjection.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const width = rect.width;
        const centerThreshold = width * 0.1; // 10% of width for center area
        
        // Get projection area dimensions to limit beam width
        const projectionAreaRect = projectionArea.getBoundingClientRect();
        const projectionAreaWidth = projectionAreaRect.width;
        
        // Clear any pending timeouts
        if (mouseControlTimeout) {
            clearTimeout(mouseControlTimeout);
        }
        
        if (x < (width / 2) - centerThreshold) {
            // Left side of screen
            if (lastMouseTilt !== 'left') {
                shoeImage.classList.remove('tilt-right', 'tilt-forward');
                shoeImage.classList.add('tilt-left');
                
                // Synchronize projection area tilt
                projectionArea.classList.remove('tilt-right');
                projectionArea.classList.add('tilt-left');
                
                // Synchronize projection beam tilt
                projectionBeam.classList.remove('tilt-right');
                projectionBeam.classList.add('tilt-left');
                
                lastMouseTilt = 'left';
                
                // Auto-reset after a delay
                mouseControlTimeout = setTimeout(() => {
                    shoeImage.classList.remove('tilt-left');
                    projectionArea.classList.remove('tilt-left');
                    projectionBeam.classList.remove('tilt-left');
                    lastMouseTilt = null;
                }, 1000);
            }
        } else if (x > (width / 2) + centerThreshold) {
            // Right side of screen
            if (lastMouseTilt !== 'right') {
                shoeImage.classList.remove('tilt-left', 'tilt-forward');
                shoeImage.classList.add('tilt-right');
                
                // Synchronize projection area tilt
                projectionArea.classList.remove('tilt-left');
                projectionArea.classList.add('tilt-right');
                
                // Synchronize projection beam tilt
                projectionBeam.classList.remove('tilt-left');
                projectionBeam.classList.add('tilt-right');
                
                lastMouseTilt = 'right';
                
                // Auto-reset after a delay
                mouseControlTimeout = setTimeout(() => {
                    shoeImage.classList.remove('tilt-right');
                    projectionArea.classList.remove('tilt-right');
                    projectionBeam.classList.remove('tilt-right');
                    lastMouseTilt = null;
                }, 1000);
            }
        } else {
            // Center area
            if (lastMouseTilt !== null) {
                shoeImage.classList.remove('tilt-left', 'tilt-right', 'tilt-forward');
                projectionArea.classList.remove('tilt-left', 'tilt-right');
                projectionBeam.classList.remove('tilt-left', 'tilt-right');
                lastMouseTilt = null;
            }
        }
    });
    
    // Mouse click to perform selected tilt action
    floorProjection.addEventListener('click', (e) => {
        if (!uiActive || !mouseTiltActive) return;
        
        // Check if the click originated from value buttons
        const clickedValueButton = e.target.closest('.value-btn');
        if (clickedValueButton) {
            return; // Don't process tilt actions for value button clicks
        }
        
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
            mouseTiltActive = !mouseTiltActive;
            showVoiceFeedback(mouseTiltActive ? 'Mouse control activated' : 'Mouse control deactivated');
        }
    });
    
    // Cursor position tracking for shoe tilt
    let cursorTimeout = null;
    
    // Enhanced Interactive Elements Registry - refreshed on screen changes
    const refreshInteractiveElements = () => {
        console.log("Refreshing interactive elements");
        return {
            workoutOptions: document.querySelectorAll('.workout-option'),
            goalTabs: document.querySelectorAll('.goal-tab'),
            valueControls: document.querySelectorAll('.value-btn'),
            sliderHandle: document.querySelector('.slider-handle'),
            moodOptions: document.querySelectorAll('.mood-option'),
            syncButton: document.querySelector('.sync-button'),
            startWorkoutButtons: document.querySelectorAll('.start-workout-btn'),
            startButton: document.querySelector('.start-button')
        };
    };
    
    // Initialize interactive elements
    let interactiveElements = refreshInteractiveElements();
    
    // Current hovered element
    let currentHoveredElement = null;
    
    // Debug feedback - show what element is being hovered
    const showDebugFeedback = (message) => {
        console.log(message);
    };
    
    // Track interactive elements for hover effects with improved detection
    document.addEventListener('mousemove', (e) => {
        if (!uiActive || !cursorTrackingActive) return;
        
        // Skip mousemove tilt handling if back button is being hovered
        if (isBackButtonHovered) return;
        
        // Calculate screen sections with a narrower center region
        const screenWidth = window.innerWidth;
        const centerWidth = screenWidth * 0.10; // 10% of screen width for center 
        const centerLeft = (screenWidth - centerWidth) / 2;
        const centerRight = centerLeft + centerWidth;
        
        // Get cursor position
        const xPosition = e.clientX;
        
        // Get shoe tip light element and projection beam
        const shoeTipLight = document.getElementById('shoeTipLight');
        const projectionBeam = document.getElementById('projectionBeam');
        
        // Get projection area dimensions to limit beam width
        const projectionAreaRect = projectionArea.getBoundingClientRect();
        const projectionAreaWidth = projectionAreaRect.width;
        
        // Remove any existing tilt classes
        shoeImage.classList.remove('tilt-left', 'tilt-right', 'tilt-forward', 'tilt-left-tap', 'tilt-right-tap');
        projectionArea.classList.remove('tilt-left', 'tilt-right');
        projectionBeam.classList.remove('tilt-left', 'tilt-right');
        shoeTipLight.classList.remove('tilt-left', 'tilt-right');
        
        // Calculate position for the shoe tip light based on cursor position
        if (xPosition < centerLeft) {
            // Left zone - tilt left
            shoeImage.classList.add('tilt-left');
            projectionArea.classList.add('tilt-left');
            projectionBeam.classList.add('tilt-left');
            shoeTipLight.classList.add('tilt-left');
            
            // Calculate more precise positioning for the light based on cursor position
            const leftPercent = Math.max(0, Math.min(1, (centerLeft - xPosition) / centerLeft));
            const leftOffset = 70 + (leftPercent * 10); // 70px base offset + up to 10px more based on cursor
            
            // Apply calculated position to light
            shoeTipLight.style.left = `calc(50% - ${leftOffset}px)`;
            shoeTipLight.style.bottom = `${235 - (leftPercent * 5)}px`;
            
            // Position the projection beam to match the light's position EXACTLY
            projectionBeam.style.left = shoeTipLight.style.left;
            projectionBeam.style.bottom = shoeTipLight.style.bottom;
            
            lastMouseTilt = 'left';
        } else if (xPosition > centerRight) {
            // Right zone - tilt right
            shoeImage.classList.add('tilt-right');
            projectionArea.classList.add('tilt-right');
            projectionBeam.classList.add('tilt-right');
            shoeTipLight.classList.add('tilt-right');
            
            // Calculate more precise positioning for the light based on cursor position
            const rightEdge = screenWidth;
            const rightPercent = Math.max(0, Math.min(1, (xPosition - centerRight) / (rightEdge - centerRight)));
            const rightOffset = 70 + (rightPercent * 10); // 70px base offset + up to 10px more based on cursor
            
            // Apply calculated position to light
            shoeTipLight.style.left = `calc(50% + ${rightOffset}px)`;
            shoeTipLight.style.bottom = `${235 - (rightPercent * 5)}px`;
            
            // Position the projection beam to match the light's position EXACTLY
            projectionBeam.style.left = shoeTipLight.style.left;
            projectionBeam.style.bottom = shoeTipLight.style.bottom;
            
            lastMouseTilt = 'right';
        } else {
            // Center zone - no tilt
            lastMouseTilt = null;
            
            // Reset shoe tip light position for center position
            shoeTipLight.style.left = '50%';
            shoeTipLight.style.bottom = '242px'; // Exact match with CSS value
            shoeTipLight.style.transform = 'translateX(-50%)';
            
            // Reset projection beam position to match light
            projectionBeam.style.left = '50%';
            projectionBeam.style.bottom = '242px'; // Exact match with CSS value
            projectionBeam.style.transform = 'translateX(-50%)';
        }
        
        // Check if cursor is over any interactive elements and apply hover effect
        checkElementHover(e);
    });
    
    // Check if mouse is over any interactive elements and apply hover effect
    function checkElementHover(e) {
        // Remove previous hover effects
        if (currentHoveredElement) {
            currentHoveredElement.classList.remove('hover-effect');
            currentHoveredElement = null;
        }
        
        // Helper function to check if element is under cursor
        function isElementUnderCursor(element) {
            if (!element) return false;
            
            const rect = element.getBoundingClientRect();
            return (
                e.clientX >= rect.left &&
                e.clientX <= rect.right &&
                e.clientY >= rect.top &&
                e.clientY <= rect.bottom
            );
        }
        
        // Check all interactive elements
        // Check goal tabs
        const goalTabs = document.querySelectorAll('.goal-tab');
        if (goalTabs && goalTabs.length) {
            for (const tab of goalTabs) {
                if (isElementUnderCursor(tab)) {
                    tab.classList.add('hover-effect');
                    currentHoveredElement = tab;
                    // Position-based tilt will be applied by the mousemove handler
                    return;
                }
            }
        }
        
        // Check workout options
        const workoutOptions = document.querySelectorAll('.workout-option');
        if (workoutOptions && workoutOptions.length) {
            for (const option of workoutOptions) {
                if (isElementUnderCursor(option)) {
                    option.classList.add('hover-effect');
                    currentHoveredElement = option;
                    // Position-based tilt will be applied by the mousemove handler
                    return;
                }
            }
        }
        
        // Check value buttons
        const valueControls = document.querySelectorAll('.value-btn');
        if (valueControls && valueControls.length) {
            for (const btn of valueControls) {
                if (isElementUnderCursor(btn)) {
                    btn.classList.add('hover-effect');
                    currentHoveredElement = btn;
                    // Position-based tilt will be applied by the mousemove handler
                    return;
                }
            }
        }
        
        // Check mood options
        const moodOptions = document.querySelectorAll('.mood-option');
        if (moodOptions && moodOptions.length) {
            for (const option of moodOptions) {
                if (isElementUnderCursor(option)) {
                    option.classList.add('hover-effect');
                    currentHoveredElement = option;
                    // Position-based tilt will be applied by the mousemove handler
                    return;
                }
            }
        }
        
        // Check other specific UI elements (buttons, etc.)
        const otherElements = [
            document.querySelector('.slider-handle'),
            document.querySelector('.sync-button'),
            ...document.querySelectorAll('.start-workout-btn'),
            document.querySelector('.start-button')
        ];
        
        for (const element of otherElements) {
            if (element && isElementUnderCursor(element)) {
                element.classList.add('hover-effect');
                currentHoveredElement = element;
                // Position-based tilt will be applied by the mousemove handler
                return;
            }
        }
    }
    
    // Track the last screen index to detect changes
    let lastScreenIndex = currentScreenIndex;
    
    // Function to show a specific screen - with interactive elements refresh
    function showScreen(index) {
        console.log(`showScreen called with index: ${index}`);
        
        // Verify the index is valid
        if (index < 0 || index >= screens.length) {
            console.error(`Invalid screen index: ${index}, max: ${screens.length - 1}`);
            return;
        }
        
        // Get the screen element for logging
        const targetScreen = screens[index];
        console.log(`Showing screen: ${targetScreen.id}`);
        
        screens.forEach((screen, i) => {
            const wasActive = screen.classList.contains('active');
            screen.classList.toggle('active', i === index);
            const isActive = screen.classList.contains('active');
            console.log(`Screen ${i} (${screen.id}): was ${wasActive ? 'active' : 'inactive'}, now ${isActive ? 'active' : 'inactive'}`);
        });
        currentScreenIndex = index;
        
        // Refresh interactive elements when screen changes
        interactiveElements = refreshInteractiveElements();
        lastScreenIndex = index;
        
        // Create a small floor ripple to show the transition
        createRippleEffect('forward');
        
        // Special screen initialization
        if (index === 3) { // Workout screen
            if (!workoutActive) {
                startWorkout();
                
                // Show demo mode indicator
                const indicator = document.querySelector('#workout-screen .indicator-text');
                if (indicator) {
                    indicator.innerHTML = `
                        Tilt <span class="forward-indicator">forward ▲</span> to pause workout | 
                        Press <span class="key" style="font-size: 0.8rem; padding: 0.1rem 0.3rem;">E</span> to end workout |
                        Press <span class="key" style="font-size: 0.8rem; padding: 0.1rem 0.3rem;">D</span> to show demo info
                    `;
                }
                
                // Add demo mode info key
                document.addEventListener('keydown', (e) => {
                    if ((e.key === 'd' || e.key === 'D') && workoutActive) {
                        showVoiceFeedback(`Demo mode active: workout will complete in ${demoCompletionTime/1000} seconds`);
                    }
                });
            }
        } else if (index === 4) { // Complete screen
            if (workoutActive) {
                endWorkout();
                celebrateCompletion();
            }
        }
        updateBackButton();
    }
    
    // Handle clicks on interactive elements - simplified for reliability
    document.addEventListener('click', (e) => {
        if (!uiActive) return;
        console.log("Click detected on:", e.target);
        
        // Find the clicked element or its closest interactive parent
        let target = e.target;
        let isInteractive = false;
        
        // Check if this is an interactive element or a child of one
        // Define element types for clarity
        const WORKOUT_OPTION = 'workout-option';
        const GOAL_TAB = 'goal-tab';
        const VALUE_BTN = 'value-btn';
        const SLIDER_HANDLE = 'slider-handle';
        const MOOD_OPTION = 'mood-option';
        const SYNC_BUTTON = 'sync-button';
        const START_WORKOUT_BTN = 'start-workout-btn';
        const START_BUTTON = 'start-button';
        
        // Debugging - log current screen
        console.log("Current screen index:", currentScreenIndex);
        
        // Find the exact interactive element that was clicked
        const workoutOption = target.closest('.' + WORKOUT_OPTION);
        const goalTab = target.closest('.' + GOAL_TAB);
        const valueBtn = target.closest('.' + VALUE_BTN);
        const sliderHandle = target.closest('.' + SLIDER_HANDLE);
        const moodOption = target.closest('.' + MOOD_OPTION);
        const syncButtonEl = target.closest('.' + SYNC_BUTTON);
        const startWorkoutBtn = target.closest('.' + START_WORKOUT_BTN);
        const startButton = target.closest('.' + START_BUTTON);
        
        // Determine which element was clicked (if any)
        if (workoutOption) {
            console.log("Workout option clicked");
            // Update selected workout option
            selectedWorkoutOption = Array.from(document.querySelectorAll('.workout-option')).indexOf(workoutOption);
            updateSelectedWorkoutOption();
            showVoiceFeedback(getWorkoutTypeName(selectedWorkoutOption));
            // If on the workout selection screen, proceed to goal selection
            if (currentScreenIndex === 0) {
                setTimeout(() => {
                    showScreen(1);
                    showVoiceFeedback(`Select your ${currentGoalType} goal`);
                }, 100); // Small delay for animation
            }
            e.stopPropagation();
            return;
        } 
        
        else if (goalTab) {
            console.log("Goal tab clicked");
            // Update selected goal tab - ONLY SELECT, DON'T PROCEED
            selectedGoalTab = Array.from(document.querySelectorAll('.' + GOAL_TAB)).indexOf(goalTab);
            updateSelectedGoalTab();
            // Prevent any other actions
            e.stopPropagation();
            return;
        } 
        
        else if (valueBtn) {
            console.log("Value button clicked");
            // Handle value increase/decrease
            if (valueBtn.classList.contains('decrease')) {
                decreaseSliderValue();
            } else if (valueBtn.classList.contains('increase')) {
                increaseSliderValue();
            }
            
            // Create beam effect
            createShoeBeamEffect();
            
            // Reset lastMouseTilt to prevent unintended navigation
            lastMouseTilt = null;
            
            // Prevent any other actions
            e.stopPropagation();
            e.preventDefault();
            return;
        } 
        
        else if (sliderHandle) {
            console.log("Slider handle clicked");
            // Focus slider handle
            sliderHandle.focus();
            showVoiceFeedback('Adjust goal value with left and right tilts');
            // Prevent any other actions
            e.stopPropagation();
            return;
        } 
        
        else if (moodOption) {
            console.log("Mood option clicked");
            // Update selected mood
            const moodOptions = document.querySelectorAll('.' + MOOD_OPTION);
            moodOptions.forEach(option => option.classList.remove('selected'));
            moodOption.classList.add('selected');
            showVoiceFeedback(`Mood: ${moodOption.getAttribute('data-mood')}`);
            // Prevent any other actions
            e.stopPropagation();
            return;
        } 
        
        else if (target.closest('.sync-button')) {
            console.log("Sync button detected in click handler - handled by dedicated listener");
            e.stopPropagation();
            return;
        } 
        
        else if (startWorkoutBtn) {
            console.log("Start workout button clicked");
            // This is the ONLY element that should trigger workout start or screen changes
            handleTilt('forward'); // Apply animation
            
            // Small delay to allow animation to be visible
            setTimeout(() => {
                if (currentScreenIndex === 0) {
                    // From workout type selection, go to goal selection
                    console.log("Moving to goal selection screen");
                    showScreen(1);
                    showVoiceFeedback(`Select your ${currentGoalType} goal`);
                } else if (currentScreenIndex === 1) {
                    // From goal selection, go to countdown
                    console.log("Moving to countdown screen");
                    showScreen(2);
                    startCountdown();
                }
            }, 100);
            // Prevent any other actions
            e.stopPropagation();
            return;
        } 
        
        else if (startButton) {
            console.log("Start button clicked (welcome screen)");
            // Welcome screen start button
            handleTilt('forward'); // Apply animation
            
                            // Small delay to allow animation to be visible
                setTimeout(() => {
                    // Hide the entire intro screens container properly
                    introScreensContainer.style.opacity = '0';
                    setTimeout(() => {
                        introScreensContainer.style.display = 'none';
                        showScreen(0); // Show workout type selection screen
                        showVoiceFeedback('Select a workout type');
                        
                        // Preload assets for smooth UX
                        preloadAssets();
                        
                        uiActive = true; // Enable UI interactivity
                        updateBackButton();
                    }, 500);
                }, 100);
            // Prevent any other actions
            e.stopPropagation();
            return;
        }
        
        // If we got here, no interactive element was clicked
        console.log("No interactive element clicked");
    });
    
    // Add value button event listeners
    const increaseValueBtn = document.getElementById('increaseValue');
    const decreaseValueBtn = document.getElementById('decreaseValue');
    
    if (increaseValueBtn) {
        increaseValueBtn.addEventListener('mouseover', () => {
            // Clear existing tilt classes
            shoeImage.classList.remove('tilt-left', 'tilt-forward');
            // Apply right tilt
            shoeImage.classList.add('tilt-right');
            lastMouseTilt = 'right';
        });
        
        increaseValueBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling to the floorProjection click handler
            e.preventDefault(); // Prevent default behavior
            
            // First remove animation classes to ensure new animation plays
            shoeImage.classList.remove('tilt-right-tap', 'tilt-left-tap');
            
            // Force a reflow to ensure the browser recognizes the removal
            void shoeImage.offsetWidth;
            
            // Apply right tap animation
            shoeImage.classList.add('tilt-right-tap');
            
            // Value change and effects
            increaseSliderValue();
            createShoeBeamEffect();
            
            // Create ripple effect directly under the shoe
            createRippleEffect('right', true);
            
            // Reset lastMouseTilt to prevent unintended navigation
            setTimeout(() => {
                lastMouseTilt = null;
            }, 10);
        });
    }
    
    if (decreaseValueBtn) {
        decreaseValueBtn.addEventListener('mouseover', () => {
            // Clear existing tilt classes
            shoeImage.classList.remove('tilt-right', 'tilt-forward');
            // Apply left tilt
            shoeImage.classList.add('tilt-left');
            lastMouseTilt = 'left';
        });
        
        decreaseValueBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent event bubbling to the floorProjection click handler
            e.preventDefault(); // Prevent default behavior
            
            // First remove animation classes to ensure new animation plays
            shoeImage.classList.remove('tilt-right-tap', 'tilt-left-tap');
            
            // Force a reflow to ensure the browser recognizes the removal
            void shoeImage.offsetWidth;
            
            // Apply left tap animation
            shoeImage.classList.add('tilt-left-tap');
            
            // Value change and effects
            decreaseSliderValue();
            createShoeBeamEffect();
            
            // Create ripple effect directly under the shoe
            createRippleEffect('left', true);
            
            // Reset lastMouseTilt to prevent unintended navigation
            setTimeout(() => {
                lastMouseTilt = null;
            }, 10);
        });
    }
    
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
        // This function is no longer needed with the new demo mode
        if (!workoutActive) return;
        
        showVoiceFeedback('Using demo mode: workout will complete in 20 seconds');
    };
    
    // Handle foot tilt (left, right, forward)
    function handleTilt(direction) {
        // Store current tilt state before removing classes
        const currentlyTiltedLeft = shoeImage.classList.contains('tilt-left');
        const currentlyTiltedRight = shoeImage.classList.contains('tilt-right');
        
        // Ensure previous states are reset
        shoeImage.classList.remove('tilt-left', 'tilt-right', 'tilt-forward', 'tilt-left-tap', 'tilt-right-tap', 'tilt-back-btn');
        
        // Get projection beam and shoe tip light elements
        const projectionBeam = document.getElementById('projectionBeam');
        const shoeTipLight = document.getElementById('shoeTipLight');
        
        // Remove tilt classes from projection components
        projectionBeam.classList.remove('tilt-left', 'tilt-right');
        shoeTipLight.classList.remove('tilt-left', 'tilt-right');
        projectionArea.classList.remove('tilt-left', 'tilt-right');
        
        // Reset inline styles from mousemove handler
        shoeTipLight.style.left = '';
        shoeTipLight.style.bottom = '';
        shoeTipLight.style.transform = '';
        
        // Reset projection beam styles
        projectionBeam.style.width = '';
        projectionBeam.style.left = '';
        projectionBeam.style.bottom = '';
        projectionBeam.style.height = '';
        projectionBeam.style.transform = '';
        projectionBeam.style.clipPath = '';
        
        // Force browser to recognize the removal before adding
        setTimeout(() => {
            // Create ripple effect on floor (projection simulation) - position under shoe
            createRippleEffect(direction, true);
            
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
            
            // Create beam effect for directional tilts
            if (direction === 'forward') {
                createShoeBeamEffect();
            }
            
            // Apply the appropriate animation class based on direction
            if (direction === 'forward') {
                shoeImage.classList.add('tilt-forward');
                
                // Position shoe tip light for forward tilt
                shoeTipLight.style.transform = 'translateX(-50%) scale(1.2)';
                shoeTipLight.style.filter = 'blur(7px)';
                shoeTipLight.style.boxShadow = '0 0 35px 12px rgba(0, 168, 107, 0.9)';
                
                // Position projection beam for forward tilt - narrower triangle pointing up
                projectionBeam.style.height = '430px';
                projectionBeam.style.transform = 'translateX(-50%) scaleY(1.05)';
                projectionBeam.style.opacity = '1';
                projectionBeam.style.clipPath = 'polygon(50% 100%, 20% 0%, 80% 0%)';
                
                // Delay the screen action to match the visual effect for tap animation
                setTimeout(() => {
                    processScreenAction(direction);
                }, 250);
                
                // For arrow key navigation, reset the tilt after a delay
                setTimeout(() => {
                    shoeImage.classList.remove('tilt-forward');
                    tiltIndicator.style.opacity = '0';
                    
                    // Reset shoe tip light styles
                    shoeTipLight.style.transform = '';
                    shoeTipLight.style.filter = '';
                    shoeTipLight.style.boxShadow = '';
                    
                    // Reset projection beam styles
                    projectionBeam.style.height = '';
                    projectionBeam.style.transform = '';
                    projectionBeam.style.opacity = '';
                    projectionBeam.style.clipPath = '';
                }, 700);
            } else if (direction === 'left') {
                // Apply the tap animation
                shoeImage.classList.add('tilt-left-tap');
                projectionArea.classList.add('tilt-left');
                projectionBeam.classList.add('tilt-left');
                shoeTipLight.classList.add('tilt-left');
                
                // Ensure shoe tip light follows the left tap animation
                shoeTipLight.style.left = 'calc(50% - 70px)';
                shoeTipLight.style.bottom = '225px';
                shoeTipLight.style.transform = 'translateX(-50%) rotate(-15deg)';
                
                // Position projection beam to align with light - match positions exactly
                projectionBeam.style.left = shoeTipLight.style.left;
                projectionBeam.style.bottom = shoeTipLight.style.bottom;
                projectionBeam.style.height = '420px';
                projectionBeam.style.transform = 'translateX(-50%) rotate(-12deg)';
                projectionBeam.style.clipPath = 'polygon(45% 100%, 20% 0%, 80% 0%)';
                
                // Process the action during animation
                setTimeout(() => {
                    processScreenAction(direction);
                }, 250);
                
                // Reset after the full animation + a small delay
                setTimeout(() => {
                    if (!mouseTiltActive) {
                        shoeImage.classList.remove('tilt-left-tap');
                        projectionArea.classList.remove('tilt-left');
                        projectionBeam.classList.remove('tilt-left');
                        shoeTipLight.classList.remove('tilt-left');
                        tiltIndicator.style.opacity = '0';
                        
                        // Reset shoe tip light styles
                        shoeTipLight.style.left = '';
                        shoeTipLight.style.bottom = '';
                        shoeTipLight.style.transform = '';
                        
                        // Reset projection beam styles
                        projectionBeam.style.left = '';
                        projectionBeam.style.bottom = '';
                        projectionBeam.style.transform = '';
                        projectionBeam.style.clipPath = '';
                        projectionBeam.style.width = '';
                        projectionBeam.style.height = '';
                    } else {
                        // If mouse tilt is active, keep the tilt style but remove the tap animation
                        shoeImage.classList.remove('tilt-left-tap');
                        shoeImage.classList.add('tilt-left');
                    }
                }, 700);
            } else if (direction === 'right') {
                // Apply the tap animation
                shoeImage.classList.add('tilt-right-tap');
                projectionArea.classList.add('tilt-right');
                projectionBeam.classList.add('tilt-right');
                shoeTipLight.classList.add('tilt-right');
                
                // Ensure shoe tip light follows the right tap animation
                shoeTipLight.style.left = 'calc(50% + 70px)';
                shoeTipLight.style.bottom = '225px';
                shoeTipLight.style.transform = 'translateX(-50%) rotate(15deg)';
                
                // Position projection beam to align with light - match positions exactly
                projectionBeam.style.left = shoeTipLight.style.left;
                projectionBeam.style.bottom = shoeTipLight.style.bottom;
                projectionBeam.style.height = '420px';
                projectionBeam.style.transform = 'translateX(-50%) rotate(12deg)';
                projectionBeam.style.clipPath = 'polygon(55% 100%, 20% 0%, 80% 0%)';
                
                // Process the action during animation
                setTimeout(() => {
                    processScreenAction(direction);
                }, 250);
                
                // Reset after the full animation + a small delay
                setTimeout(() => {
                    if (!mouseTiltActive) {
                        shoeImage.classList.remove('tilt-right-tap');
                        projectionArea.classList.remove('tilt-right');
                        projectionBeam.classList.remove('tilt-right');
                        shoeTipLight.classList.remove('tilt-right');
                        tiltIndicator.style.opacity = '0';
                        
                        // Reset shoe tip light styles
                        shoeTipLight.style.left = '';
                        shoeTipLight.style.bottom = '';
                        shoeTipLight.style.transform = '';
                        
                        // Reset projection beam styles
                        projectionBeam.style.left = '';
                        projectionBeam.style.bottom = '';
                        projectionBeam.style.transform = '';
                        projectionBeam.style.clipPath = '';
                        projectionBeam.style.width = '';
                        projectionBeam.style.height = '';
                    } else {
                        // If mouse tilt is active, keep the tilt style but remove the tap animation
                        shoeImage.classList.remove('tilt-right-tap');
                        shoeImage.classList.add('tilt-right');
                    }
                }, 700);
            } else if (direction === 'back-btn') {
                // Special case for back button
                shoeImage.classList.add('tilt-back-btn');
                
                // Position light for back button tap
                shoeTipLight.style.left = 'calc(50% - 75px)';
                shoeTipLight.style.bottom = '230px';
                shoeTipLight.style.transform = 'translateX(-50%) rotate(-35deg)';
                
                // Position projection beam for back button
                projectionBeam.style.left = shoeTipLight.style.left;
                projectionBeam.style.bottom = shoeTipLight.style.bottom;
                projectionBeam.style.height = '420px';
                projectionBeam.style.transform = 'translateX(-50%) rotate(-30deg)';
                projectionBeam.style.clipPath = 'polygon(40% 100%, 20% 0%, 80% 0%)';
            }
        }, 10); // Very short timeout to ensure class removal is processed
    }
    
    // Create ripple effect to simulate projection interaction
    function createRippleEffect(direction, underShoe = false) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple-effect';
        
        if (underShoe) {
            // Position based on shoe tilt direction - at the tip where it would contact the floor
            if (direction === 'left') {
                // Appear from left side tip of shoe - adjusted to match the tilted shoe
                ripple.style.left = '40%';
                ripple.style.bottom = '130px'; // Position at the left tip of tilted shoe
                ripple.classList.add('left-tilt'); // Add class for left tilt styling
            } else if (direction === 'right') {
                // Appear from right side tip of shoe - adjusted to match the tilted shoe
                ripple.style.left = '60%';
                ripple.style.bottom = '130px'; // Position at the right tip of tilted shoe
                ripple.classList.add('right-tilt'); // Add class for right tilt styling
            } else { // forward
                // Appear from center front tip of shoe
                ripple.style.left = '50%';
                ripple.style.bottom = '140px'; // Higher position, at the tip of the shoe when pointing forward
            }
            
            // Make ripple appear to come from the shoe impact
            if (direction === 'forward') {
                ripple.style.transform = 'translate(-50%, 0) scale(0.3)';
            }
            ripple.style.animation = 'rippleFromShoe 1s ease-out forwards';
        } else {
            // Regular positioning based on direction
            if (direction === 'left') {
                ripple.style.left = '30%';
            } else if (direction === 'right') {
                ripple.style.left = '70%';
            } else { // forward
                ripple.style.left = '50%';
            }
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
    
    // Create a beam effect at the shoe tip to indicate selection
    function createShoeBeamEffect() {
        // Create a beam effect matching current shoe orientation
        const beam = document.createElement('div');
        beam.className = 'shoe-beam-effect';
        
        // Check current shoe tilt to adjust beam position
        if (shoeImage.classList.contains('tilt-left') || shoeImage.classList.contains('tilt-left-tap')) {
            // Left tilt - shift beam left and adjust height to match tip
            beam.style.transform = 'translate(-70%, 0)';
            beam.style.left = '40%';
            beam.style.bottom = '170px'; // Align with left-tilted shoe tip
        } else if (shoeImage.classList.contains('tilt-right') || shoeImage.classList.contains('tilt-right-tap')) {
            // Right tilt - shift beam right and adjust height to match tip
            beam.style.transform = 'translate(-30%, 0)';
            beam.style.left = '60%';
            beam.style.bottom = '170px'; // Align with right-tilted shoe tip
        } else if (shoeImage.classList.contains('tilt-forward')) {
            // Forward tilt - slightly higher position
            beam.style.bottom = '180px'; // Align with forward-pointing shoe tip
        }
        // Default center position set in CSS
        
        // Add to DOM at the shoe view level
        const shoeView = document.querySelector('.shoe-view');
        if (shoeView) {
            shoeView.appendChild(beam);
            
            // Remove after animation completes
            setTimeout(() => {
                beam.remove();
            }, 800);
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
                            syncButton.innerHTML = '<i class="fas fa-check"></i><span>Synced!</span>';
                            showVoiceFeedback('Workout data synchronized successfully');
                            
                            // Find the end screen element directly
                            const endScreen = document.getElementById('end-screen');
                            if (endScreen) {
                                console.log("Displaying end screen from forward tilt action");
                                
                                // Find end screen index
                                let endScreenIndex = -1;
                                screens.forEach((screen, i) => {
                                    if (screen.id === 'end-screen') {
                                        endScreenIndex = i;
                                    }
                                });
                                
                                if (endScreenIndex >= 0) {
                                    // Show end screen (hide current screen, show end screen)
                                    screens.forEach(s => s.classList.remove('active'));
                                    endScreen.classList.add('active');
                                    currentScreenIndex = endScreenIndex;
                                    updateBackButton();
                                } else {
                                    console.error("End screen index not found - falling back to default behavior");
                                    resetWorkout();
                                    showScreen(0); // Fallback to workout selection
                                }
                            } else {
                                console.error("End screen element not found - falling back to default behavior");
                                resetWorkout();
                                showScreen(0); // Fallback to workout selection
                            }
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
        const types = ['Run', 'Walk', 'Cycling'];
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
        // Set default value for new goal type
        setDefaultGoalValue();
        showVoiceFeedback(`${currentGoalType} goal selected`);
    }
    
    // Update slider based on currentStepIndex
    function updateSlider() {
        const arr = getCurrentStepArray();
        const settings = goalSettings[currentGoalType];
        // Clamp index
        if (currentStepIndex < 0) currentStepIndex = 0;
        if (currentStepIndex > arr.length - 1) currentStepIndex = arr.length - 1;
        const value = arr[currentStepIndex];
        // Calculate percent position based on index
        const percent = (arr.length === 1) ? 0 : (currentStepIndex / (arr.length - 1)) * 100;
        sliderFill.style.width = `${percent}%`;
        sliderHandle.style.left = `${percent}%`;
        goalValue.textContent = settings.format(value);
        showVoiceFeedback(`${value} ${settings.unit}`);
    }
    
    // Plus/Minus button logic: only move to next/previous in smart step array
    function increaseSliderValue() {
        const arr = getCurrentStepArray();
        if (currentStepIndex < arr.length - 1) currentStepIndex++;
        updateSlider();
    }
    
    function decreaseSliderValue() {
        if (currentStepIndex > 0) currentStepIndex--;
        updateSlider();
    }
    
    // Calculate value from slider position (not used for direct mapping anymore)
    function calculateValueFromSlider(percent, settings) {
        // This function is now only used for legacy code, but we always use smart steps
        const arr = getCurrentStepArray();
        if (arr.length === 1) return arr[0];
        // Find the closest index for the given percent
        const idx = Math.round((percent / 100) * (arr.length - 1));
        return arr[idx];
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
        
        // Removed additional random ripples
    }
    
    // Start workout
    function startWorkout() {
        workoutActive = true;
        workoutPaused = false;
        workoutStartTime = new Date();
        demoProgressPercentage = 0;
        
        // Update workout header icon based on selected workout type
        const workoutHeaderIcon = document.querySelector('.workout-header i');
        if (workoutHeaderIcon) {
            // Reset all icon classes
            workoutHeaderIcon.className = '';
            
            // Set appropriate icon based on workout type
            if (selectedWorkoutOption === 0) {
                workoutHeaderIcon.className = 'fas fa-running';
            } else if (selectedWorkoutOption === 1) {
                workoutHeaderIcon.className = 'fas fa-walking';
            } else if (selectedWorkoutOption === 2) {
                workoutHeaderIcon.className = 'fas fa-biking';
            }
        }
        
        // Reset stats for new workout
        heartRate = 80;
        calories = 0;
        steps = 0;
        distance = 0;
        
        // Calculate target values based on selected goal
        if (currentGoalType === 'distance') {
            const targetDistance = calculateValueFromSlider(sliderValue, goalSettings.distance);
            demoTargetSteps = Math.round(targetDistance / 0.0007); // Convert km to steps
        } else if (currentGoalType === 'calories') {
            demoTargetCalories = calculateValueFromSlider(sliderValue, goalSettings.calories);
        }
        
        // Show initial stats
        updateWorkoutStats();
        
        // Set up interval to update stats - faster for demo mode
        workoutInterval = setInterval(() => {
            if (!workoutPaused) {
                // Update demo progress
                demoProgressPercentage = Math.min(100, demoProgressPercentage + (100 / (demoCompletionTime / 200)));
                
                // Calculate workout elapsed time based on demo progress
                if (currentGoalType === 'duration') {
                    const targetDuration = calculateValueFromSlider(sliderValue, goalSettings.duration);
                    workoutElapsedTime = (demoProgressPercentage / 100) * (targetDuration * 60000);
                } else {
                    workoutElapsedTime = (demoProgressPercentage / 100) * demoCompletionTime * 5; // Simulate a longer workout
                }
                
                // Update steps based on progress percentage
                steps = Math.round((demoProgressPercentage / 100) * demoTargetSteps);
                
                // Update calories based on progress percentage
                calories = Math.round((demoProgressPercentage / 100) * demoTargetCalories);
                
                // Update heart rate - starts at 80, peaks at around 75% progress, then slightly decreases
                const progressFactor = demoProgressPercentage < 75 
                    ? demoProgressPercentage / 75 
                    : 1 - ((demoProgressPercentage - 75) / 100);
                heartRate = Math.round(80 + (demoMaxHeartRate - 80) * progressFactor);
                
                updateWorkoutStats();
                
                // Auto-complete workout when demo reaches 100%
                if (demoProgressPercentage >= 100 && workoutActive) {
                    endWorkout();
                    showScreen(4); // Show completion screen
                    createRippleEffect('forward', true);
                    celebrateCompletion();
                }
            }
        }, 200); // Update 5 times per second for smoother progress
        
        showVoiceFeedback('Workout started');
        
        // Simulate random health alert at 60-70% progress
        setTimeout(() => {
            if (workoutActive && !workoutPaused) {
                showHealthAlert('High heart rate detected. Consider slowing down.');
            }
        }, demoCompletionTime * 0.6);
    }
    
    // Pause workout
    function pauseWorkout() {
        if (!workoutActive || workoutPaused) return;
        
        workoutPaused = true;
        workoutElapsedTime += (new Date() - workoutStartTime);
        
        // Show pause overlay
        document.getElementById('pauseOverlay').classList.add('active');
        
        // Update pause screen progress metrics
        const pauseUserMarker = document.getElementById('pauseUserMarker');
        if (pauseUserMarker) {
            // Get the target steps based on demo mode
            const targetSteps = demoTargetSteps;
            const progressPercent = Math.min((steps / targetSteps) * 100, 100);
            pauseUserMarker.style.left = `${5 + progressPercent * 0.9}%`;
            
            // Update pause screen metrics
            const pauseStepMetric = document.getElementById('pauseStepMetric');
            const pauseCalorieMetric = document.getElementById('pauseCalorieMetric');
            
            if (pauseStepMetric) {
                pauseStepMetric.textContent = `${steps} steps`;
            }
            
            if (pauseCalorieMetric) {
                pauseCalorieMetric.textContent = `${calories} kcal`;
            }
        }
        
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
        
        if (statHeartRate) {
            statHeartRate.textContent = `${heartRate} bpm`;
            statHeartRate.setAttribute('data-length', statHeartRate.textContent.length);
        }
        
        if (statSteps) {
            statSteps.textContent = steps;
            statSteps.setAttribute('data-length', steps.toString().length);
        }
        
        if (finalCalories) {
            finalCalories.textContent = calories;
            finalCalories.setAttribute('data-length', calories.toString().length);
        }
        
        showVoiceFeedback('Workout completed');
    }
    
    // Reset workout
    function resetWorkout() {
        // Reset all state variables
        currentScreenIndex = 0;
        selectedWorkoutOption = 1; // Default to "Walk"
        selectedGoalTab = 0; // Default to "Distance"
        sliderValue = 60; // Default slider position
        workoutActive = false;
        workoutPaused = false;
        workoutStartTime = null;
        workoutElapsedTime = 0;
        
        // Clear any ongoing intervals
        if (workoutInterval) {
            clearInterval(workoutInterval);
            workoutInterval = null;
        }
        
        // Reset stats
        heartRate = 80;
        calories = 0;
        steps = 0;
        distance = 0;
        
        // Reset UI elements
        document.getElementById('heartRate').textContent = '80 bpm';
        document.getElementById('caloriesBurned').textContent = '0 kcal';
        document.getElementById('stepCount').textContent = '0 steps';
        document.getElementById('distance').textContent = '0.00 km';
        document.getElementById('progressFill').style.width = '0%';
        document.getElementById('progressStepCount').textContent = '0';
        document.getElementById('currentProgress').style.left = '0%';
        document.getElementById('completionPercent').textContent = '0%';
        document.getElementById('calorieProgress').textContent = '0/0';
        
        // Update selected workout option and goal tabs
        updateSelectedWorkoutOption();
        updateSelectedGoalTab();
        
        // Reset any visual elements that might be in active state
        const pauseOverlay = document.getElementById('pauseOverlay');
        if (pauseOverlay && pauseOverlay.classList.contains('active')) {
            pauseOverlay.classList.remove('active');
        }
        
        const healthAlert = document.getElementById('healthAlert');
        if (healthAlert && healthAlert.classList.contains('active')) {
            healthAlert.classList.remove('active');
        }
        
        // Reset mood selection
        const selectedMood = document.querySelector('.mood-option.selected');
        if (selectedMood) {
            selectedMood.classList.remove('selected');
        }
        
        // Reset sync button
        if (syncButton) {
            syncButton.innerHTML = '<i class="fas fa-sync-alt"></i><span>Sync with Apple Health</span>';
        }
        

        
        console.log('Workout simulation reset completely');
    }
    
    // Celebrate workout completion with visual effects
    function celebrateCompletion() {
        // We're keeping this function but removing the random ripples
        // during active workout sessions
        
        // Highlight trophy with glow effect (only present on completion screen)
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
            'assets/icons/cycling.svg',
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
        
        // Get the target steps based on demo mode
        const targetSteps = demoTargetSteps;
        
        // Update progress visualization
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
        if (userMarker) {
            userMarker.style.left = `${5 + (pathWidth * progressPercent / 100)}%`;
        }
        
        // Update completion percentage text
        const completionPercent = document.getElementById('completionPercent');
        if (completionPercent) {
            completionPercent.textContent = `${Math.round(progressPercent)}%`;
        }
        
        // Update calorie progress
        const calorieProgress = document.getElementById('calorieProgress');
        if (calorieProgress) {
            calorieProgress.textContent = `${calories}/${demoTargetCalories}`;
        }
        
        // Clear existing milestones
        const milestoneContainer = document.getElementById('milestoneMarkers');
        if (milestoneContainer) {
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
        }
        
        // Animation effects based on progress
        const visualizationContainer = document.querySelector('.visualization-container');
        if (visualizationContainer) {
            // More advanced 3D effect as you progress
            const progressRotation = 15 - (progressPercent / 100) * 5; // Gradually reduce the rotation from 15 to 10 degrees
            visualizationContainer.style.transform = `rotateX(${progressRotation}deg)`;
        }
        
        // Increase glow effect as you approach target
        if (userMarker) {
            const glowIntensity = Math.min(5 + (progressPercent / 100) * 15, 20);
            userMarker.style.boxShadow = `0 0 ${glowIntensity}px var(--primary-color)`;
        }
        
        // Add shake effect when reaching exact 50% mark
        if (Math.abs(progressPercent - 50) < 3 && userMarker && !userMarker.classList.contains('milestone-pulse')) {
            userMarker.classList.add('milestone-pulse');
            setTimeout(() => {
                userMarker.classList.remove('milestone-pulse');
            }, 1000);
            
            // Voice feedback at 50%
            showVoiceFeedback("Halfway there! Keep going!");
        }
        
        // Celebrate when reaching 100%
        if (progressPercent >= 99 && userMarker && !userMarker.classList.contains('celebration')) {
            userMarker.classList.add('celebration');
            
            // Add celebration effect to path
            const progressPath = document.getElementById('progressPath');
            if (progressPath) {
                progressPath.classList.add('path-complete');
            }
            
            // Voice feedback at 100%
            showVoiceFeedback("Target reached! Excellent work!");
        }
    }
    
    // Celebration effect for reaching milestones
    function celebrateMilestone(steps) {
        // Removed random ripple effect
        
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
        
        // Removed warning ripple
        
        // Show warning for 5 seconds
        setTimeout(() => {
            alertEl.classList.remove('active');
        }, 5000);
    }
    
    // Add instructions for mouse and keyboard controls
    showVoiceFeedback('Welcome! Use arrow keys to navigate or press M to activate mouse control');

    // Set up keyboard shortcuts panel
    const toggleHelp = document.getElementById('toggleHelp');
    const keyboardShortcuts = document.getElementById('keyboardShortcuts');
    const collapseShortcuts = document.getElementById('collapseShortcuts');
    
    // Toggle keyboard shortcuts panel visibility with '?' key
    document.addEventListener('keydown', (e) => {
        if (e.key === '?' || e.key === '/') {
            toggleKeyboardShortcuts();
        }
    });
    
    // Toggle keyboard shortcuts panel with button
    toggleHelp.addEventListener('click', toggleKeyboardShortcuts);
    
    // Collapse/expand keyboard shortcuts panel
    collapseShortcuts.addEventListener('click', () => {
        keyboardShortcuts.classList.toggle('collapsed');
        // Update icon
        if (keyboardShortcuts.classList.contains('collapsed')) {
            collapseShortcuts.classList.remove('fa-minus-circle');
            collapseShortcuts.classList.add('fa-plus-circle');
        } else {
            collapseShortcuts.classList.remove('fa-plus-circle');
            collapseShortcuts.classList.add('fa-minus-circle');
        }
    });

    function toggleKeyboardShortcuts() {
        const isVisible = keyboardShortcuts.style.display !== 'none';
        keyboardShortcuts.style.display = isVisible ? 'none' : 'block';
    }

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

    // Update initial instructions
    const instructionsContent = document.querySelector('.instructions-content');
    if (instructionsContent) {
        const instructionsList = instructionsContent.querySelector('ul');
        if (instructionsList) {
            // Update instructions to emphasize cursor control
            instructionsList.innerHTML = `
                <li><strong>Primary Control: Move cursor to top of screen to tilt shoe</strong></li>
                <li><strong>Click on interface elements to select them</strong></li>
                <li><span class="key">T</span> Toggle top cursor tracking (enabled by default)</li>
                <li><span class="key">V</span> Toggle voice commands</li>
                <li><span class="key">?</span> Show/hide keyboard shortcuts</li>
                <li class="secondary-controls"><em>Backup Keyboard Controls:</em></li>
                <li><span class="key">←</span> Tilt left foot outward</li>
                <li><span class="key">→</span> Tilt right foot inward</li>
                <li><span class="key">Enter</span> Tilt foot forward</li>
                <li><span class="key">P</span> Pause your workout</li>
                <li><span class="key">R</span> Resume workout</li>
                <li><span class="key">E</span> End workout</li>
                <li><span class="key">S</span> Load sample data</li>
            `;
        }
        
        // Update intro text to emphasize cursor control
        const introParagraph = instructionsContent.querySelector('p');
        if (introParagraph) {
            introParagraph.textContent = 'Experience your Smart Shoe\'s floor-projected fitness interface using cursor movements to control tilt.';
        }
        
        // Update final instructions paragraph
        const finalParagraph = instructionsContent.querySelectorAll('p')[1];
        if (finalParagraph) {
            finalParagraph.innerHTML = '<strong>PRIMARY CONTROL:</strong> Move your cursor to the top of screen to tilt the shoe left/right and click to select. <strong>The shoe will automatically tilt</strong> when hovering over interactive elements.';
        }
    }

    // Add event handlers for workout options
    workoutOptions.forEach((option, index) => {
        option.addEventListener('click', () => {
            // Update selected workout option
            selectedWorkoutOption = index;
            updateSelectedWorkoutOption();
            showVoiceFeedback(getWorkoutTypeName(selectedWorkoutOption));
        });
    });
    
    // Add event handlers for start workout buttons
    startWorkoutBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentScreenIndex === 0) {
                // From workout type selection, go to goal selection
                showScreen(1);
                showVoiceFeedback(`Select your ${currentGoalType} goal`);
            } else if (currentScreenIndex === 1) {
                // From goal selection, go to countdown
                showScreen(2);
                startCountdown();
            }
            // Create a beam effect for selection
            createShoeBeamEffect();
        });
    });

    // Show/hide back button based on current screen
    function updateBackButton() {
        // Get current state of the intro screens container
        const introVisible = introScreensContainer.style.display !== 'none';
        const endScreen = document.getElementById('end-screen');
        const isEndScreen = endScreen && endScreen.classList.contains('active');
        
        if (currentScreenIndex === 0 || currentScreenIndex === 4 || introVisible || isEndScreen) {
            backBtn.style.display = 'none';
        } else {
            backBtn.style.display = 'flex';
        }
    }

    // Back button click handler
    const backBtn = document.getElementById('backBtn');
    backBtn.addEventListener('click', () => {
        // Visual feedback on click
        backBtn.classList.add('clicked');
        setTimeout(() => backBtn.classList.remove('clicked'), 180);
        if (currentScreenIndex === 1) {
            showScreen(0); // Goal selection -> Workout type
        } else if (currentScreenIndex === 2) {
            showScreen(1); // Countdown -> Goal selection
        } else if (currentScreenIndex === 3) {
            showScreen(1); // Workout -> Goal selection
        }
    });

    // Back button hover: tilt shoe further left
    backBtn.addEventListener('mouseenter', () => {
        // Force debugging to console to verify the event is triggered
        console.log("Back button hover detected");
        
        // Set the flag to prevent mousemove from interfering
        isBackButtonHovered = true;
        
        // First, make sure to remove all other tilt classes
        shoeImage.classList.remove('tilt-left', 'tilt-right', 'tilt-forward', 'tilt-left-tap', 'tilt-right-tap');
        
        // Add specific back button tilt
        shoeImage.classList.add('tilt-back-btn');
        
        // Get shoe tip light element and manually position it
        const shoeTipLight = document.getElementById('shoeTipLight');
        if (shoeTipLight) {
            // Apply explicit styles to ensure it moves with the shoe
            shoeTipLight.style.transition = 'all 0.45s cubic-bezier(0.25, 0.1, 0.25, 1)';
            shoeTipLight.style.left = 'calc(50% - 270px)';  // Much further left to match shoe position
            shoeTipLight.style.bottom = '130px';  // Adjusted to match height
            shoeTipLight.style.transform = 'translateX(-50%) rotate(-40deg)';
            shoeTipLight.style.filter = 'blur(5px)';
            shoeTipLight.style.boxShadow = '0 0 20px 8px rgba(0, 168, 107, 0.8)';
        }
        
        // Create a beam effect pointing toward the back button
        const beam = document.createElement('div');
        beam.className = 'shoe-beam-effect';
        beam.id = 'back-btn-beam';
        beam.style.transform = 'translate(-80%, 0) scale(0.8)';
        beam.style.left = '40%'; // Adjusted more to the left
        beam.style.bottom = '70px'; // Match light position
        beam.style.animation = 'none'; // Prevent fadeout animation
        beam.style.opacity = '0.8'; // Keep visible
        document.querySelector('.shoe-view').appendChild(beam);
    });
    
    backBtn.addEventListener('mouseleave', () => {
        console.log("Back button mouseleave detected");
        
        // Reset the flag to allow mousemove handling again
        isBackButtonHovered = false;
        
        // Remove the back button tilt class
        shoeImage.classList.remove('tilt-back-btn');
        
        // Reset shoe tip light styles manually
        const shoeTipLight = document.getElementById('shoeTipLight');
        if (shoeTipLight) {
            shoeTipLight.style.transition = 'all 0.45s cubic-bezier(0.25, 0.1, 0.25, 1)';
            shoeTipLight.style.left = '50%';
            shoeTipLight.style.bottom = '225px';
            shoeTipLight.style.transform = 'translateX(-50%)';
            shoeTipLight.style.filter = 'blur(4px)';
            shoeTipLight.style.boxShadow = '0 0 15px 4px rgba(0, 168, 107, 0.7)';
        }
        
        // Remove beam when no longer hovering
        const beam = document.getElementById('back-btn-beam');
        if (beam) {
            beam.remove();
        }
    });

    // Add demo mode info key
    document.addEventListener('keydown', (e) => {
        if ((e.key === 'd' || e.key === 'D') && workoutActive) {
            showVoiceFeedback(`Demo mode active: workout will complete in ${demoCompletionTime/1000} seconds`);
        }
    });

    // Add window resize handler to update beam dimensions
    window.addEventListener('resize', () => {
        if (projectionBeam && projectionArea) {
            // Get current dimensions of the projection area
            const projAreaRect = projectionArea.getBoundingClientRect();
            
            // Update beam max-width to match projection area width
            projectionBeam.style.maxWidth = `${projAreaRect.width}px`;
        }
    });
    
    // Call once on load to set initial dimensions
    setTimeout(() => {
        if (projectionBeam && projectionArea) {
            const projAreaRect = projectionArea.getBoundingClientRect();
            projectionBeam.style.maxWidth = `${projAreaRect.width}px`;
        }
    }, 100);

    // Create a dedicated sync button handler - completely rewritten
    console.log("Setting up sync button handler");
    
    // Remove any existing listeners to avoid conflicts
    if (syncButton) {
        // Clone the button to remove all event listeners
        const newSyncButton = syncButton.cloneNode(true);
        syncButton.parentNode.replaceChild(newSyncButton, syncButton);
        
        // Add a fresh click event handler
        newSyncButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("*** SYNC BUTTON CLICKED ***");
            
            // Show syncing animation
            this.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i><span>Syncing...</span>';
            
            // First timeout: show synced confirmation
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-check"></i><span>Synced!</span>';
                console.log("Sync animation complete, preparing to show end screen");
                
                // Second timeout: navigate to end screen
                setTimeout(() => {
                    // Find the end screen element directly
                    const endScreen = document.getElementById('end-screen');
                    if (!endScreen) {
                        console.error("End screen element not found in DOM");
                        return;
                    }
                    
                    // Get index directly from screens NodeList
                    let endScreenIndex = -1;
                    screens.forEach((screen, i) => {
                        if (screen.id === 'end-screen') {
                            endScreenIndex = i;
                            console.log(`Found end-screen at index ${i}`);
                        }
                    });
                    
                    if (endScreenIndex >= 0) {
                        console.log(`Navigating to end screen (index ${endScreenIndex})`);
                        
                        // Hide all screens first and manually show end screen
                        screens.forEach(s => s.classList.remove('active'));
                        endScreen.classList.add('active');
                        currentScreenIndex = endScreenIndex;
                        
                        // Update interface and show feedback
                        updateBackButton();
                        showVoiceFeedback('Thank you for completing the workout');
                        console.log("End screen should now be visible");
                    } else {
                        console.error("Could not determine end screen index");
                    }
                }, 1500);
            }, 2000);
        });
        
        console.log("New sync button handler installed");
    }
    
    // Add event listener for Try Again button
    if (tryAgainBtn) {
        tryAgainBtn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Create ripple effect for feedback
            createRippleEffect('forward', true);
            
            // Reset workout data
            resetWorkout();
            
            // Go back to the workout selection screen (first screen)
            showScreen(0);
            showVoiceFeedback('Select a workout type');
        });
    }

});
