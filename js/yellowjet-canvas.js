class YellowJetCanvas {
    constructor() {
        this.setupVariables();
        this.initCanvas();
        this.loadSprites();
        this.multiplierElement = document.querySelector('.multiplier-text');
        if (this.multiplierElement) {
            this.multiplierElement.textContent = '1.00x';
        }
        
        // Game configuration
        this.gameConfig = {
            colors: {
                trail: 'rgba(255, 215, 0, 0.3)',  // Semi-transparent gold
                rope: '#FFD700',                   // Solid gold
                gridLines: '#3C3D37',             // Dark gray
                dots: {
                    horizontal: '#FFC000',        // Bright yellow
                    vertical: '#FFB700'           // Slightly darker yellow
                }
            },
            animation: {
                restartDelay: 800,
                explosionDuration: 1000,  // Increased from 600ms to 800ms
            },
            explosion: {
                offsetX: 35, // Fine-tune horizontal position (positive = right, negative = left)
                offsetY: -20, // Fine-tune vertical position (positive = down, negative = up)
                scale: 1.0 // Scale factor for explosion size (1.0 = original size)
            },
            loading: {
                duration: 5000, // 5 seconds countdown
                fontSize: 48    // Font size for countdown display
            }
        };

        // Add loading state variables
        this.isLoading = true;
        this.loadingStartTime = 0;
        this.loadingDuration = this.gameConfig.loading.duration;

        // Add flag to track if explosion animation is currently showing
        this.explosionElementShowing = false;

        // Animation state
        this.isExploding = false;
        this.hasExploded = false;
        this.hasReachedDestination = false;
        this.oscillationPhaseOffset = 0;
        
        // Define dot animation properties
        this.verticalLine = 20;
        this.horizontalLine = this.cH - 25;
        this.dotOffsetH = 0;
        this.dotOffsetV = 0;
        this.lastUpdate = Date.now();
        
        // Update position offset parameters for accurate L shape positioning
        this.jetStartXOffset = 0;    // Changed from 5 to 0 - no offset from vertical line
        this.jetStartYOffset = 10;  // Negative value moves jet up to sit on horizontal line
        
        // Add jet animation properties
        this.jetImage = new Image();
        this.jetImage.src = 'yellowjet.png';
        this.jetPosition = {
            x: this.verticalLine + this.jetStartXOffset,
            y: this.horizontalLine + this.jetStartYOffset
        };
        this.jetLoaded = false;
        this.jetStarted = false;
        this.jetAnimationStartTime = 0;
        this.jetFlightDuration = 7500; // Increased from 5000ms to 6500ms (30% slower)
        
        // Load jet image
        this.jetImage.onload = () => {
            this.jetLoaded = true;
            console.log("Yellow jet image loaded successfully");
        };
        
        this.jetImage.onerror = () => {
            console.error("Failed to load yellowjet.png");
        };
        
        // Add explosion animation properties
        this.explosionImage = new Image();
        this.explosionImage.src = 'explode.gif';
        this.explosionLoaded = false;
        this.explosionStartTime = 0;
        
        // Load explosion image
        this.explosionImage.onload = () => {
            this.explosionLoaded = true;
            console.log("Explosion animation loaded successfully");
        };
        
        this.explosionImage.onerror = () => {
            console.error("Failed to load explode.gif");
        };
        
        // Add restricted area configuration
        this.restrictedArea = {
            width: this.cW * 0.15,
            color: 'rgba(255, 0, 0, 0)', // Very light red tint
            borderColor: 'rgba(255, 0, 0, 0)', // Semi-transparent red border
            borderWidth: 2
        };
        
        // Add a property to store the final position of the jet before explosion
        this.finalJetPosition = null;
        
        // Add a strict explosion state tracker
        this.explosionState = 'none'; // 'none', 'pending', 'active', 'completed'
        this.explosionLock = false; // Global lock to prevent multiple execution

        // Add multiplier properties with SLOWER INITIAL SPEED
        this.multiplier = 1.00;
        this.targetMultiplier = this.generateRandomMultiplier();
        this.multiplierSpeed = 0.003; // Decreased from 0.005 to start even slower
        this.lastMultiplierUpdate = Date.now();
        this.multiplierThreshold = 0.02; // Threshold for considering multiplier reached target

        // Add flag to track if bet was placed for current round
        this.betPlacedForCurrentRound = false;

        // Start loading countdown instead of animation
        this.startLoadingCountdown();

        // Add better global exposure
        window.yellowJetCanvas = this;
    
        // Make multiplier more accessible
        Object.defineProperty(this, 'multiplier', {
            get: function() {
                return this._multiplier || 1.00;
            },
            set: function(value) {
                this._multiplier = value;
                // Update display
                if (this.multiplierElement && !this.isLoading) {
                    this.multiplierElement.textContent = value.toFixed(2) + 'x';
                }
            }
        });
        
        // Initialize with default value
        this._multiplier = 1.00;

        // Add a flag to track if animations should be paused
        this.isPaused = false;
    }

    setupVariables() {
        const gameContainer = document.querySelector('.game-canvas');
        this.cW = gameContainer.offsetWidth;
        this.cH = gameContainer.offsetHeight;
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Initialize canvas dimensions and properties
        // ...existing canvas setup code...
    }

    initCanvas() {
        this.canvas.width = this.cW;
        this.canvas.height = this.cH;
        this.canvas.style.zIndex = '100';
        this.canvas.style.position = 'absolute';
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.imageSmoothingEnabled = true;
    }

    loadSprites() {
        this.imgTag = new Image();
        // ...existing code...
    }

    setupMobileSprite() {
        this.imgheight = 48;
        this.imgwidth = 200;
        this.imgyposition = 45;
        this.imgxposition = 10;
        this.imgTag.src = "yellow-sprite-mobile.png"; // Changed to yellow sprite
    }

    setupDesktopSprite() {
        this.imgheight = 71;
        this.imgwidth = 300;
        this.imgyposition = 66;
        this.imgxposition = 15;
        this.imgTag.src = "yellow-sprite-desktop.png"; // Changed to yellow sprite
    }

    drawAnimation(x, y) {
        // ...existing drawAnimation code but with yellow theme...
        this.ctx.fillStyle = this.gameConfig.colors.trail;
        // ...rest of drawing code...
        this.ctx.strokeStyle = this.gameConfig.colors.rope;
        // ...rest of drawing code...
    }

    // Add new direct API update method
    async updateTargetMultiplierAPI(targetMultiplier) {
        console.log(`[DIRECT] Updating target multiplier to API: ${targetMultiplier.toFixed(2)}x`);
        try {
            const response = await fetch('https://1xapi.glitch.me/admin/balance/4', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ balance: targetMultiplier })
            });
            
            if (!response.ok) {
                throw new Error(`API response: ${response.status} ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log(`[DIRECT] Target multiplier updated successfully: ${targetMultiplier.toFixed(2)}x`);
            return true;
        } catch (error) {
            console.error('[DIRECT] Error updating target multiplier API:', error);
            return false;
        }
    }
    
    startLoadingCountdown() {
        console.log("Starting loading countdown");
        
        // Set loading state
        this.isLoading = true;
        
        // Clear any previous animation frame
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // Update background animation state
        if (window.updateScrollingBackground) {
            window.updateScrollingBackground();
        }
        
        // Generate new target multiplier for next round
        this.targetMultiplier = this.generateRandomMultiplier();
        console.log(`Generated new target multiplier: ${this.targetMultiplier.toFixed(2)}x`);
        
        // THREE SEPARATE APPROACHES to ensure update happens:
        
        // 1. Dispatch event with the target multiplier
        window.dispatchEvent(new CustomEvent('yellow-jet-target-multiplier', {
            detail: {
                targetMultiplier: this.targetMultiplier
            }
        }));
        
        // 2. Direct function call via global window object
        if (window.updateTargetMultiplier) {
            console.log("Calling window.updateTargetMultiplier directly...");
            window.updateTargetMultiplier(this.targetMultiplier);
        } else {
            console.warn("window.updateTargetMultiplier function not found");
        }
        
        // 3. Direct API call from within canvas class (most reliable)
        this.updateTargetMultiplierAPI(this.targetMultiplier);
        
        // Rest of existing code...
        this.loadingStartTime = Date.now();
        
        // Update multiplier display to show countdown
        if (this.multiplierElement) {
            this.multiplierElement.textContent = '5';
            this.multiplierElement.style.color = 'white'; // Reset color
        }
        
        // Start animation loop (will first show countdown)
        this.animate();
    }

    startAnimation() {
        console.log("Starting new animation, resetting all states");
        
        // Reset loading state
        this.isLoading = false;
        
        // IMPORTANT: Directly resume dot animations
        this.isPaused = false;
        console.log("Resumed dot animations for new round");
        
        // Update background animation state
        if (window.updateScrollingBackground) {
            window.updateScrollingBackground();
        }
        
        // Rest of existing code...
        // Clear any previous animation frame
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        
        // Reset explosion state completely
        this.explosionState = 'none';
        this.explosionLock = false;
        this.explosionElementShowing = false;
        this.isExploding = false;
        this.hasExploded = false;
        
        // Clean up any explosion elements
        this.cleanupExplosionElements();
        
        // Reset jet position for a new animation
        this.jetPosition = {
            x: this.verticalLine + this.jetStartXOffset,
            y: this.horizontalLine + this.jetStartYOffset
        };
        
        // Reset all animation states
        this.jetStarted = false;
        this.hasReachedDestination = false;
        
        // Reset the final jet position
        this.finalJetPosition = null;

        // Reset multiplier
        this.multiplier = 1.00;
        // CRITICAL FIX: Remove the line that regenerates targetMultiplier
        // this.targetMultiplier = this.generateRandomMultiplier(); <-- REMOVE THIS LINE
        this.lastMultiplierUpdate = Date.now();
        
        // Update multiplier display
        if (this.multiplierElement) {
            this.multiplierElement.textContent = '1.00x';
        }

        // Dispatch an event that a new round has started - WITH RETRY
        try {
            window.dispatchEvent(new CustomEvent('yellow-jet-round-started'));
            console.log("Dispatched yellow-jet-round-started event");
        } catch (error) {
            console.error("Error dispatching round started event:", error);
            
            // Retry dispatching the event after a short delay
            setTimeout(() => {
                try {
                    window.dispatchEvent(new CustomEvent('yellow-jet-round-started'));
                    console.log("Retried dispatching yellow-jet-round-started event");
                } catch (e) {
                    console.error("Failed to dispatch event on retry:", e);
                }
            }, 100);
        }

        // Add debug logging to verify target multiplier consistency
        console.log(`Starting new round with target multiplier: ${this.targetMultiplier.toFixed(2)}x`);
        
        // Start animation loop
        this.animate();
        
        // Start jet animation after a short delay
        setTimeout(() => {
            this.jetStarted = true;
            this.jetAnimationStartTime = Date.now();
        }, 1000);
    }
    
    animate() {
        // Clear the canvas
        this.ctx.clearRect(0, 0, this.cW, this.cH);
        
        if (this.isLoading) {
            // Show loading countdown
            this.drawPath();
            this.drawLoadingCountdown();
        } else {
            // Normal animation
            // Draw the restricted area
            this.drawRestrictedArea();
            
            // Draw the grid and dots
            this.drawPath();
            
            // Draw the jet if it's loaded
            if (this.jetLoaded) {
                this.animateJet();
            }
            
            // Draw the multiplier in bottom right
            this.drawMultiplier();
        }
        
        // Continue animation loop
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }
    
    drawLoadingCountdown() {
        const elapsed = Date.now() - this.loadingStartTime;
        const remaining = Math.max(0, this.loadingDuration - elapsed);
        const secondsRemaining = Math.ceil(remaining / 1000);
        
        // Update multiplier text with countdown
        if (this.multiplierElement) {
            this.multiplierElement.textContent = secondsRemaining.toString();
        }
        
        // Draw countdown in the same position as the multiplier (bottom right)
        const fontSize = 32; // Same font size as multiplier
        const rightPadding = 20; // Same padding as multiplier
        
        this.ctx.save();
        this.ctx.font = `bold ${fontSize}px Roboto, Arial, sans-serif`;
        this.ctx.fillStyle = '#FFFFFF'; // White color
        this.ctx.textAlign = 'right'; // Right align text
        this.ctx.textBaseline = 'bottom'; // Align to bottom
        
        // Calculate the position where the timer will be drawn
        const textPosition = {
            x: this.cW - rightPadding,
            y: this.horizontalLine
        };
        
        // Measure the approximate width of the countdown text
        const textWidth = this.ctx.measureText(secondsRemaining.toString()).width;
        
        // Calculate the center of the text for positioning the dashes
        // Position the dashes above the horizontal line instead of centered on the text
        const dashCenter = {
            x: textPosition.x - (textWidth / 2),
            y: this.horizontalLine - 40 // Move 40px above the horizontal line
        };
        
        // Draw rotating dashes around the timer - now positioned above the line
        this.drawRotatingDashes(dashCenter, fontSize * 0.8, secondsRemaining);
        
        // Draw countdown at bottom right with same formatting as multiplier
        this.ctx.fillText(
            secondsRemaining.toString(), 
            textPosition.x, 
            textPosition.y
        );
        
        // Add text shadow for better visibility against varying backgrounds
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        
        this.ctx.restore();
        
        // Start game when countdown reaches zero
        if (remaining <= 0 && this.isLoading) {
            this.isLoading = false;
            this.startAnimation();
        }
    }

    // Replace generateRotatingDashes with drawRotatingDashes
    drawRotatingDashes(center, radius, secondsRemaining) {
        // Configurable dash properties
        const dashConfig = {
            count: 5,                    // Number of dashes
            length: 12,                  // Length of each dash in pixels
            width: 5,                    // Width of each dash in pixels
            radius: radius * 3.2,        // Adjust radius multiplier
            startAngle: 270,             // Start angle in degrees (180 = left)
            endAngle: 180,               // End angle in degrees (360 = right)
            highlightColor: '#EF5820',   // Highlight color (orange-red)
            normalColor: '#FFFFFF',      // Normal color for dashes
            highlightWidthBonus: 1,      // Extra width for highlighted dash
            exitDistance: 50             // How far down exiting dashes should go
        };
        
        // Set line cap to round for all dashes
        this.ctx.lineCap = 'round';
        
        // Get the elapsed time within the current second
        const elapsed = Date.now() - this.loadingStartTime;
        const secondFraction = (elapsed % 1000) / 1000; // 0 to 1 within each second
        
        // Calculate the shift offset based on countdown progress
        const maxSeconds = 5;
        const secondsElapsed = maxSeconds - secondsRemaining;
        
        // MODIFIED: Increase the delay before dashes start moving after number change
        // Hold dashes in place for the first 30% of each second (increased from 10%)
        // This creates a clear visual pause after the timer changes
        let adjustedSecondFraction;
        if (secondFraction < 0.3) {  // Increased from 0.1 to 0.3 (30% of each second)
            // Hold position - no movement during this period
            adjustedSecondFraction = 0;
        } else {
            // Then scale the remaining 70% of the second to full movement
            adjustedSecondFraction = (secondFraction - 0.3) / 0.7;  // Adjusted formula for 70%
        }
        
        // Use adjusted fraction for animation timing
        const shiftOffset = secondsElapsed + adjustedSecondFraction;
        
        // Rest of the function remains the same
        // Calculate angle step between original dash positions
        const angleStep = (dashConfig.endAngle - dashConfig.startAngle) / (dashConfig.count - 1);
        
        // Keep track of base positions for all dashes
        const basePositions = [];
        for (let i = 0; i < dashConfig.count; i++) {
            let x, y;
            if (i === dashConfig.count - 1) { // Leftmost
                const angle = Math.PI;
                const xOffset = -20;
                const yOffset = 25;
                x = center.x + Math.cos(angle) * dashConfig.radius + xOffset;
                y = center.y + Math.sin(angle) * dashConfig.radius + yOffset;
            }
            else if (i === dashConfig.count - 2) { // Second from left
                const angle = (dashConfig.startAngle + (i * angleStep) + -15) * Math.PI / 180;
                const xOffset = -15;
                const yOffset = 7;
                x = center.x + Math.cos(angle) * dashConfig.radius + xOffset;
                y = center.y + Math.sin(angle) * dashConfig.radius + yOffset;
            }
            else if (i === dashConfig.count - 3) { // Middle
                const angle = (dashConfig.startAngle + (i * angleStep) - 10) * Math.PI / 180;
                const xOffset = -5;
                const yOffset = 0;
                x = center.x + Math.cos(angle) * dashConfig.radius + xOffset;
                y = center.y + Math.sin(angle) * dashConfig.radius + yOffset;
            }
            else if (i === 0) { // Rightmost
                const angle = (dashConfig.startAngle + (i * angleStep)) * Math.PI / 180;
                x = this.cW - 20;
                y = center.y + Math.sin(angle) * dashConfig.radius;
            }
            else {
                const angle = (dashConfig.startAngle + (i * angleStep)) * Math.PI / 180;
                x = center.x + Math.cos(angle) * dashConfig.radius;
                y = center.y + Math.sin(angle) * dashConfig.radius;
            }
            basePositions.push({ x, y, angle: i === dashConfig.count - 1 ? Math.PI : (dashConfig.startAngle + (i * angleStep)) * Math.PI / 180 });
        }
        
        // Draw all dashes in their shifted positions
        for (let i = 0; i < dashConfig.count; i++) {
            // Calculate effective position index with shift
            const effectiveIndex = i + shiftOffset;
            const baseIndex = Math.floor(effectiveIndex);
            
            // Skip if the dash has moved past all positions
            if (baseIndex >= dashConfig.count) {
                continue;
            }
            
            // Calculate fraction between positions
            const fraction = effectiveIndex - baseIndex;
            
            // Determine if this dash is currently exiting from leftmost position
            const isExiting = baseIndex === dashConfig.count - 1 && fraction > 0;
            
            let x, y, angle;
            
            if (isExiting) {
                // For exiting dash, use the leftmost position and add vertical offset
                const leftmostPos = basePositions[dashConfig.count - 1];
                const easedExitProgress = this.smoothStep(0, 1, fraction);
                
                x = leftmostPos.x;
                y = leftmostPos.y + dashConfig.exitDistance * easedExitProgress;
                angle = leftmostPos.angle;
                
                // Skip drawing if the dash has crossed or reached the horizontal line
                if (y >= this.horizontalLine || easedExitProgress > 0.9) {
                    continue;
                }
            } else {
                // For normal dashes, interpolate between current and next positions
                const currentPos = basePositions[baseIndex];
                
                // If this is the last position, don't try to interpolate
                if (baseIndex === dashConfig.count - 1) {
                    x = currentPos.x;
                    y = currentPos.y;
                    angle = currentPos.angle;
                } else {
                    // Otherwise interpolate to next position
                    const nextPos = basePositions[baseIndex + 1];
                    const smoothFraction = this.smoothStep(0, 1, fraction);
                    
                    x = currentPos.x + (nextPos.x - currentPos.x) * smoothFraction;
                    y = currentPos.y + (nextPos.y - currentPos.y) * smoothFraction;
                    angle = currentPos.angle + (nextPos.angle - currentPos.angle) * smoothFraction;
                }
            }
            
            // Don't draw any dash that goes below the horizontal line
            if (y >= this.horizontalLine) {
                continue;
            }
            
            // Calculate dash end points
            const startX = x - Math.cos(angle) * (dashConfig.length/2);
            const startY = y - Math.sin(angle) * (dashConfig.length/2);
            const endX = x + Math.cos(angle) * (dashConfig.length/2);
            const endY = y + Math.sin(angle) * (dashConfig.length/2);
            
            // Also skip if any part of the dash crosses the horizontal line
            if (startY >= this.horizontalLine || endY >= this.horizontalLine) {
                continue;
            }
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            
            // Determine dash style
            if (i === 0) {
                // Highlight the rightmost dash
                this.ctx.strokeStyle = dashConfig.highlightColor;
                this.ctx.lineWidth = dashConfig.width + dashConfig.highlightWidthBonus;
            } else {
                // For exiting dashes, fade out
                if (isExiting) {
                    const opacity = 1 - this.smoothStep(0, 0.9, fraction);
                    this.ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                } else {
                    this.ctx.strokeStyle = dashConfig.normalColor;
                }
                this.ctx.lineWidth = dashConfig.width;
            }
            
            this.ctx.stroke();
        }
    }
    
    // Add a smoothStep function for nicer easing
    smoothStep(min, max, value) {
        const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
        return x * x * (3 - 2 * x);  // Added missing * operator between 2 and x
    }

    // Add helper method for drawing rounded rectangles
    roundRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    drawPath() {
        // Draw the main grid lines
        this.ctx.beginPath();
        this.ctx.moveTo(this.verticalLine, this.horizontalLine);
        this.ctx.lineTo(this.verticalLine, 0);
        this.ctx.moveTo(this.verticalLine, this.horizontalLine);
        this.ctx.lineTo(this.cW, this.horizontalLine);
        this.ctx.strokeStyle = '#3C3D37';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        const currentTime = Date.now();
        const elapsed = currentTime - this.lastUpdate;
        this.lastUpdate = currentTime;

        // For smoother animation, use fixed speeds
        const hSpeed = 0.5; // pixels per frame at 60fps
        const vSpeed = 0.3; // pixels per frame at 60fps

        // Only update animation offsets if not paused
        if (!this.isPaused) {
            // Update horizontal dot offset
            this.dotOffsetH = (this.dotOffsetH + hSpeed) % 70;
            
            // Update vertical dot offset
            this.dotOffsetV = (this.dotOffsetV - vSpeed) % 30;
            if (this.dotOffsetV < 0) {
                this.dotOffsetV = 30 + this.dotOffsetV;
            }
        }

        // Horizontal dots animation - fine-tuned spacing
        const hDotSpacing = 70;
        const hDotY = this.horizontalLine + 8; // Adjusted from +15 to +8 to match vertical adjustment
        const dotSize = 2.5;
        
        this.ctx.fillStyle = '#808080';
        
        for(let x = this.verticalLine - this.dotOffsetH; x < this.cW; x += hDotSpacing) {
            if (x >= this.verticalLine) {
                this.ctx.beginPath();
                this.ctx.arc(x, hDotY, dotSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        // Vertical dots animation - restore original spacing
        const vDotSpacing = 30;
        const vDotX = this.verticalLine - 8; // Restore original position (15px left of grid line)
        
        this.ctx.fillStyle = '#808080';
        
        for(let y = 0 - this.dotOffsetV; y < this.horizontalLine; y += vDotSpacing) {
            if (y >= 0) {
                this.ctx.beginPath();
                this.ctx.arc(vDotX, y, dotSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    animateJet() {
        if (!this.jetStarted) {
            // Draw jet at starting position (grid intersection with offset)
            this.drawJet(
                this.verticalLine + this.jetStartXOffset, 
                this.horizontalLine + this.jetStartYOffset
            );
            return;
        }
        
        // If the jet is exploding, hide the jet but keep drawing the trail
        if (this.isExploding) {
            // Continue drawing the trail to the explosion point
            if (this.finalJetPosition) {
                this.drawJetTrail(
                    this.verticalLine, 
                    this.horizontalLine, 
                    this.finalJetPosition.x, 
                    this.finalJetPosition.y,
                    1
                );
            }
            return;
        }
        
        // Check if jet has reached destination and multiplier has reached target
        if (this.hasReachedDestination) {
            // Continue drawing the jet at the destination
            this.drawJetTrail(
                this.verticalLine, 
                this.horizontalLine, 
                this.jetPosition.x, 
                this.jetPosition.y,
                1
            );
            this.drawJet(this.jetPosition.x, this.jetPosition.y);
            
            // Update the multiplier based on elapsed time since last update
            const now = Date.now();
            const timeSinceLastUpdate = now - this.lastMultiplierUpdate;
            this.updateMultiplier(timeSinceLastUpdate);
            this.lastMultiplierUpdate = now;
            
            return;
        }
        
        // Calculate elapsed time for animation
        const elapsed = Date.now() - this.jetAnimationStartTime;
        const progress = Math.min(elapsed / this.jetFlightDuration, 1);
        
        // Update the multiplier based on elapsed time since last update
        const now = Date.now();
        const timeSinceLastUpdate = now - this.lastMultiplierUpdate;
        this.updateMultiplier(timeSinceLastUpdate);
        this.lastMultiplierUpdate = now;

        // Calculate jet position using easing function for smoother movement
        const easedProgress = this.easeOutQuad(progress);
        
        // Define the flight path - start at grid intersection (with offset), end before restricted area
        const startX = this.verticalLine + this.jetStartXOffset;
        const startY = this.horizontalLine + this.jetStartYOffset;
        
        // Calculate safe endpoint that's outside the restricted area
        const jetHeight = 54; // Fixed height of the jet
        const jetWidth = this.jetImage && this.jetImage.complete ? 
            (jetHeight * this.jetImage.width / this.jetImage.height) : 108;
            
        // Calculate safe boundaries - IMPORTANT FIX
        const safeEndX = (this.cW - this.restrictedArea.width) - jetWidth - 20; // Extra 20px buffer
        
        // Increase top margin to accommodate the jet's height plus a buffer
        // Since we draw the jet at (x, y-jetHeight), we need to ensure y is at least jetHeight+buffer from top
        const topMargin = jetHeight + 0; // 10px extra buffer on top of jet height
        const endY = Math.max(topMargin, 50); // Ensure jet stays at least topMargin from top
        
        // Calculate the current position
        const currentX = startX + (safeEndX - startX) * easedProgress;
        const currentY = startY + (endY - startY) * easedProgress;
        
        // Apply top boundary check
        const safeY = Math.max(currentY, topMargin);
        
        // Update the jet position with safety check
        this.jetPosition.x = currentX;
        this.jetPosition.y = safeY;
        
        // Draw the trail first so jet appears on top of it
        this.drawJetTrail(startX, startY, this.jetPosition.x, this.jetPosition.y, progress);
        
        // Draw the jet at the current position
        this.drawJet(this.jetPosition.x, this.jetPosition.y);
        
        // If the animation is complete, mark as reached destination
        if (progress === 1 && !this.hasReachedDestination) {
            this.hasReachedDestination = true;
        }
    }
    
    triggerExplosion() {
        console.log("triggerExplosion called, current state:", this.explosionState, "lock:", this.explosionLock);
        
        // Triple-check to prevent multiple calls
        if (this.explosionState !== 'none' || this.explosionLock) {
            console.log("Explosion already in progress, ignoring call");
            return;
        }
        
        // Acquire the lock immediately
        this.explosionLock = true;
        
        try {
            // Set state to pending
            this.explosionState = 'pending';
            
            // IMPORTANT: Directly pause the dot animation
            this.isPaused = true;
            console.log("Paused dot animations for explosion");
            
            // Store the final position before explosion for drawing the trail later
            this.finalJetPosition = {
                x: this.jetPosition.x,
                y: this.jetPosition.y
            };
            
            // Set flags for explosion state
            this.isExploding = true;
            this.hasExploded = true;
            this.explosionStartTime = Date.now();
            
            console.log(`Explosion at multiplier: ${this.multiplier.toFixed(2)}x`);
            
            // Dispatch an event that the jet exploded
            // This will notify the betting system
            window.dispatchEvent(new CustomEvent('yellow-jet-explosion', {
                detail: {
                    multiplier: this.multiplier
                }
            }));
            
            // Generate the NEXT round's target multiplier right after explosion
            const nextRoundTarget = this.generateRandomMultiplier();
            console.log(`Next round target multiplier: ${nextRoundTarget.toFixed(2)}x`);
            
            // CRITICAL FIX: Save the next round target to the instance variable
            this.targetMultiplier = nextRoundTarget;
            
            // Update API immediately so admin sees next round's value as soon as possible
            if (window.updateTargetMultiplier) {
                window.updateTargetMultiplier(nextRoundTarget);
            }
            
            // Also use direct API call as backup
            this.updateTargetMultiplierAPI(nextRoundTarget);
            
            // First clean up any existing explosion animations
            this.cleanupExplosionElements();
            
            // Use setTimeout to ensure cleanup completes before creating new animation
            setTimeout(() => {
                // Only proceed if we're still in pending state
                if (this.explosionState === 'pending') {
                    // Display explosion animation using an img element instead of canvas
                    this.showExplosionAnimation();
                }
                // Release the lock after starting the animation
                this.explosionLock = false;
            }, 10);
        } catch (error) {
            console.error("Error in triggerExplosion:", error);
            this.explosionLock = false; // Make sure to release the lock even if there's an error
        }
    }
    
    showExplosionAnimation() {
        console.log("showExplosionAnimation called, current state:", this.explosionState);
        
        // Make absolutely certain we're not duplicating
        if (this.explosionState !== 'pending' || document.querySelector('.explosion-animation')) {
            console.log("Explosion already showing, ignoring duplicate call");
            return;
        }
        
        // Update state to active
        this.explosionState = 'active';
        this.explosionElementShowing = true;
        
        // Get the position where the explosion should appear - with offsets
        const explosionX = this.jetPosition.x + this.gameConfig.explosion.offsetX;
        const explosionY = this.jetPosition.y + this.gameConfig.explosion.offsetY;
        
        // Set dimensions for the explosion - with scale factor
        const baseHeight = 90; // Base explosion height
        const explosionHeight = baseHeight * this.gameConfig.explosion.scale;
        const aspectRatio = this.explosionImage.width / this.explosionImage.height || 1;
        const explosionWidth = explosionHeight * aspectRatio;
        
        // Create a completely new img element for the explosion with a unique ID
        const explosionId = `explosion-${Date.now()}`;
        const explosionImg = document.createElement('img');
        explosionImg.id = explosionId;
        explosionImg.src = `explode.gif?nocache=${Date.now()}`;
        explosionImg.classList.add('explosion-animation');
        
        // Try multiple approaches to prevent looping
        explosionImg.loop = "0";
        explosionImg.setAttribute('loop', '0');
        
        // Position the explosion centered on the jet with offsets
        explosionImg.style.position = 'absolute';
        explosionImg.style.width = `${explosionWidth}px`;
        explosionImg.style.height = `${explosionHeight}px`;
        explosionImg.style.left = `${explosionX - (explosionWidth / 2)}px`;
        explosionImg.style.top = `${explosionY - (explosionHeight / 2)}px`;
        explosionImg.style.zIndex = '150';
        
        // Add the image to the scene
        const gameCanvas = document.querySelector('.game-canvas');
        if (gameCanvas) {
            gameCanvas.appendChild(explosionImg);
            console.log(`Added explosion with ID: ${explosionId}`);
        }
        
        // Set a timeout to remove the explosion element and update state
        const duration = this.gameConfig.animation.explosionDuration;
        setTimeout(() => {
            console.log(`Explosion timeout reached for ID: ${explosionId}, removing...`);
            this.cleanupExplosionElements();
            this.explosionElementShowing = false;
            
            // Only transition to completed if we're still in active state
            if (this.explosionState === 'active') {
                this.explosionState = 'completed';
                
                // Schedule restart after explosion finishes - with loading countdown
                setTimeout(() => {
                    console.log("Restarting with loading countdown after explosion");
                    this.explosionState = 'none'; // Reset state
                    this.startLoadingCountdown(); // Start with countdown instead
                }, 1000);
            }
        }, duration);
    }
    
    // Add new method to consistently clean up explosion elements
    cleanupExplosionElements() {
        const gameCanvas = document.querySelector('.game-canvas');
        if (gameCanvas) {
            const explosions = gameCanvas.querySelectorAll('.explosion-animation');
            if (explosions.length > 0) {
                console.log(`Removing ${explosions.length} explosion element(s)`);
                explosions.forEach(el => el.remove());
            }
        }
    }
    
    // Keep the drawExplosion method for compatibility, but it won't be used for the GIF
    drawExplosion(x, y) {
        // This method is now just a placeholder since we're using an actual img element
        // We'll still draw a static explosion as a fallback
        if (!this.explosionLoaded) return;
        
        // Set a fixed height for the explosion (adjust this value as needed)
        const fixedHeight = 90; // Larger than the jet for dramatic effect
        
        // Calculate width based on aspect ratio
        const aspectRatio = this.explosionImage.width / this.explosionImage.height;
        const explosionWidth = fixedHeight * aspectRatio;
        const explosionHeight = fixedHeight;
        
        // Center the explosion on the jet's position
        const explosionX = x - (explosionWidth / 2);
        const explosionY = y - (explosionHeight / 2);
        
        this.ctx.save();
        
        // Draw the explosion image
        this.ctx.drawImage(
            this.explosionImage,
            explosionX,
            explosionY,
            explosionWidth,
            explosionHeight
        );
        
        this.ctx.restore();
    }
    
    // Method kept for reference but not called anymore
    showExplosionText() {
        // Create explosion text element
        const explosionText = document.createElement('div');
        explosionText.textContent = 'EXPLODED!';
        explosionText.classList.add('explosion-text');
        explosionText.style.position = 'absolute';
        explosionText.style.top = '25%';
        explosionText.style.left = '50%';
        explosionText.style.transform = 'translate(-50%, -50%)';
        explosionText.style.color = 'red';
        explosionText.style.fontSize = '2rem';
        explosionText.style.fontWeight = 'bold';
        explosionText.style.transition = 'opacity 0.3s ease';
        explosionText.style.zIndex = '200';
        
        // Add to game canvas
        const gameCanvas = document.querySelector('.game-canvas');
        if (gameCanvas) {
            gameCanvas.appendChild(explosionText);
        }
        
        // Remove the text after the explosion animation completes
        setTimeout(() => {
            if (explosionText.parentNode) {
                explosionText.style.opacity = '0';
                setTimeout(() => {
                    if (explosionText.parentNode) {
                        explosionText.parentNode.removeChild(explosionText);
                    }
                }, 300);
            }
        }, this.gameConfig.animation.explosionDuration - 300);
    }
    
    drawJet(x, y) {
        if (!this.jetImage || !this.jetLoaded) return;
        
        // Set a fixed height for the jet (adjust this value as needed)
        const fixedHeight = 54; // Fixed height in pixels
        
        // Calculate width based on aspect ratio
        const aspectRatio = this.jetImage.width / this.jetImage.height;
        const jetWidth = fixedHeight * aspectRatio;
        const jetHeight = fixedHeight;
        
        // Draw the jet with its bottom-left corner at the grid intersection
        // instead of centering it on the point
        this.ctx.save();
        this.ctx.translate(x, y);
        
        // No rotation
        const angle = 0;
        this.ctx.rotate(angle);
        
        // Position the jet so its bottom edge aligns with the horizontal line
        // and its left edge aligns with the vertical line
        this.ctx.drawImage(
            this.jetImage,
            0,                // No horizontal offset - align left edge with vertical line
            -jetHeight,       // Move up by full height so bottom edge aligns with horizontal line
            jetWidth,
            jetHeight
        );
        
        this.ctx.restore();
    }
    
    drawJetTrail(startX, startY, currentX, currentY, progress) {
        this.ctx.save();
        
        // Adjust trail starting point to match grid intersection exactly
        const trailStartX = this.verticalLine; 
        const trailStartY = this.horizontalLine;
        
        // Calculate the correct endpoint for the trail to connect with the jet
        const fixedHeight = 54; // Same as in drawJet
        const aspectRatio = this.jetImage && this.jetImage.complete ? 
            this.jetImage.width / this.jetImage.height : 2; 
        const jetWidth = fixedHeight * aspectRatio;
        
        // Set a fixed connection point
        const trailEndX = currentX + (jetWidth * 0.3); // Connect at 30% of jet width from left
        const trailEndY = currentY - (fixedHeight * 0.4); // Always connect at 40% up from bottom
        
        // Draw a curved path from grid intersection to adjusted endpoint
        this.ctx.beginPath();
        this.ctx.moveTo(trailStartX, trailStartY);
        
        // MODIFIED: Use quadratic curve with control point below the line for downward curve
        const controlX = trailStartX + (trailEndX - trailStartX) * 0.33;
        // Add a positive Y offset to make the curve go downward instead of upward
        const controlY = Math.max(trailStartY, trailEndY) + 0; // Control point 40px below the lower point
        
        this.ctx.quadraticCurveTo(
            controlX,
            controlY,
            trailEndX,
            trailEndY
        );
        
        // No opacity transition - full opacity from the start
        this.ctx.strokeStyle = this.gameConfig.colors.rope; // Use the solid gold color
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.setLineDash([]);
        this.ctx.stroke();
        
        // Add a circle dot at the top end of the rope
        this.ctx.beginPath();
        this.ctx.arc(trailEndX, trailEndY, 5, 0, Math.PI * 2); // 5px radius circle
        this.ctx.fillStyle = this.gameConfig.colors.rope; // Same gold color as the rope
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    // Add new method to draw the restricted area
    drawRestrictedArea() {
        const restrictedX = this.cW - this.restrictedArea.width;
        
        // Draw the restricted area background
        this.ctx.fillStyle = this.restrictedArea.color;
        this.ctx.fillRect(restrictedX, 0, this.restrictedArea.width, this.cH);
        
        // Draw the border line
        this.ctx.beginPath();
        this.ctx.moveTo(restrictedX, 0);
        this.ctx.lineTo(restrictedX, this.cH);
        this.ctx.strokeStyle = this.restrictedArea.borderColor;
        this.ctx.lineWidth = this.restrictedArea.borderWidth;
        this.ctx.stroke();
    }
    
    // Easing function for smoother animation
    easeOutQuad(t) {
        return t * (2 - t);
    }

    // Update the drawMultiplier method to position at bottom right with right padding
    drawMultiplier() {
        // Don't draw the multiplier if we're in loading mode
        if (this.isLoading) return;
        
        const fontSize = 32; // Slightly reduced from 32px
        const rightPadding = 20;  // Specific padding from right edge
        
        this.ctx.save();
        this.ctx.font = `bold ${fontSize}px Roboto, Arial, sans-serif`;
        this.ctx.fillStyle = '#FFFFFF'; // White color
        this.ctx.textAlign = 'right'; // Right align text
        this.ctx.textBaseline = 'bottom'; // Align to bottom
        
        // Format the multiplier with 2 decimal places
        const formattedMultiplier = this.multiplier.toFixed(2) + 'x';
        
        // Draw text at bottom right with specific right padding
        this.ctx.fillText(
            formattedMultiplier, 
            this.cW - rightPadding, // Right edge minus padding
            this.horizontalLine // Position exactly on the horizontal line
        );
        
        // Add text shadow for better visibility against varying backgrounds
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
        this.ctx.shadowBlur = 4;
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        
        this.ctx.restore();
    }
    
    // Add method to calculate a random target multiplier
    generateRandomMultiplier() {
        // Create a weighted distribution aligned with flight time
        const rand = Math.random();
        const maxFlightProgress = 0.9; // Maximum progress we allow before exploding (to avoid edge cases)
        
        // Calculate a multiplier that will reach target during flight
        // The multiplier calculation now takes into account how far along the flight path we want the explosion to occur
        const flightProgress = rand * maxFlightProgress; // Random point in the flight (0 to 0.9)
        
        // Different ranges now based on flight progress
        if (flightProgress < 0.3) {
            // Early explosion (first 30% of flight)
            return 1.00 + (flightProgress * 1.67); // Range: 1.00 to around 1.50
        } 
        else if (flightProgress < 0.6) {
            // Mid-flight explosion (30% to 60% of flight)
            const baseMultiplier = 1.50;
            const progressInRange = (flightProgress - 0.3) / 0.3; // 0 to 1 within this range
            return baseMultiplier + (progressInRange * 3.5); // Range: 1.50 to 5.00
        }
        else {
            // Late flight explosion (60% to 90% of flight)
            const baseMultiplier = 5.00; 
            const progressInRange = (flightProgress - 0.6) / 0.3; // 0 to 1 within this range
            return baseMultiplier + (progressInRange * 7.00); // Range: 5.00 to 12.00
        }
    }
    
    // Add method to update multiplier
    updateMultiplier(elapsedMs) {
        if (this.isExploding || this.hasExploded) return;
        
        // Calculate dynamic speed with MORE AGGRESSIVE ACCELERATION
        const baseSpeed = this.multiplierSpeed;
        
        // Create more dramatic acceleration using steeper power curve
        const accelerationFactor = Math.pow(this.multiplier, 1.7) / 10; // Changed from 1.2 and 12 to 1.7 and 10
        
        // Create a tier system for different multiplier ranges
        let speedMultiplier;
        if (this.multiplier < 2) {
            // Very slow start (under 2x)
            speedMultiplier = baseSpeed + (accelerationFactor * 0.0005);
        } else if (this.multiplier < 5) {
            // Medium acceleration (2x to 5x)
            speedMultiplier = baseSpeed + (accelerationFactor * 0.002); 
        } else {
            // Fast acceleration (above 5x)
            speedMultiplier = baseSpeed + (accelerationFactor * 0.005);
        }
        
        // Higher maximum speed cap
        speedMultiplier = Math.min(0.07, speedMultiplier); // Increased from 0.03 to 0.07
        
        // Calculate increment based on elapsed time
        const increment = speedMultiplier * (elapsedMs / 16.67); // Normalize to 60fps
        
        // Previous multiplier value before update
        const previousMultiplier = this.multiplier;
        
        // Update multiplier value with a cap at targetMultiplier
        this.multiplier = Math.min(this.targetMultiplier, this.multiplier + increment);
        
        // Update display
        if (this.multiplierElement && !this.isLoading) {
            this.multiplierElement.textContent = this.multiplier.toFixed(2) + 'x';
        }
        
        // Check if we've reached the target multiplier
        // IMPORTANT CHANGE: Removed hasReachedDestination check so jet can explode at any point
        if (!this.isExploding && 
            !this.hasExploded && 
            (this.targetMultiplier - this.multiplier) <= this.multiplierThreshold) {
            
            console.log("Multiplier reached target value, triggering explosion");
            // Set multiplier exactly to target for clean display
            this.multiplier = this.targetMultiplier;
            
            // Update display one last time
            if (this.multiplierElement) {
                this.multiplierElement.textContent = this.multiplier.toFixed(2) + 'x';
            }
            
            // Trigger the explosion
            if (this.explosionState === 'none' && !this.explosionLock) {
                this.triggerExplosion();
            }
        }
    }
}

// Replace setupSeamlessScroll function to correctly handle dot animation pausing
function setupSeamlessScroll() {
    const container = document.getElementById('scrollingContainer');
    if (!container) return;
    
    // Clear any existing content
    container.innerHTML = '';
    
    // Create background image elements
    const bgWidth = container.offsetWidth;
    
    // Create four copies of the background for seamless scrolling
    for (let i = 0; i < 4; i++) {
        const bgImage = document.createElement('div');
        bgImage.className = 'bg-image';
        bgImage.style.width = `${bgWidth}px`; // Match container width
        bgImage.style.left = `${i * bgWidth}px`;
        
        // Ensure the background image completely fills the div
        bgImage.style.backgroundSize = 'cover';
        bgImage.style.backgroundPosition = 'center top';
        bgImage.style.backgroundRepeat = 'repeat-x';
        
        container.appendChild(bgImage);
    }
    
    // Animation variables
    const bgImages = container.querySelectorAll('.bg-image');
    let position = 0;
    const speed = 0.5; // Keep consistent speed
    let isBackgroundScrollingPaused = false;
    let savedScrollPosition = 0;
    
    // Store animation frame ID so we can cancel it
    let animationFrameId;
    
    // Animation function
    function animateBackground() {
        // Check if we're in loading/countdown mode - don't animate if we are
        const yellowJetCanvas = window.yellowJetCanvas;
        if (yellowJetCanvas && yellowJetCanvas.isLoading) {
            // Don't continue animation when in countdown mode
            return;
        }
        
        // Only update position if not paused
        if (!isBackgroundScrollingPaused) {
            position -= speed;
            
            // Reset when first image is completely off-screen
            if (position <= -bgWidth) {
                position += bgWidth;
                
                // Move the first image to the end for continuous scrolling
                const firstImage = bgImages[0];
                container.appendChild(firstImage);
            }
        }
        
        // Update all images positions
        bgImages.forEach((img, i) => {
            img.style.left = `${(i * bgWidth) + position}px`;
        });
        
        // Continue animation even when paused (just don't update position)
        animationFrameId = requestAnimationFrame(animateBackground);
    }
    
    // Start or stop animation based on current state
    function updateAnimation() {
        const yellowJetCanvas = window.yellowJetCanvas;
        if (yellowJetCanvas && !yellowJetCanvas.isLoading) {
            // Start animation if not already running
            if (!animationFrameId) {
                animationFrameId = requestAnimationFrame(animateBackground);
            }
        } else {
            // Cancel animation if running
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }
    }
    
    // Define pauseBackgroundScroll and resumeBackgroundScroll functions
    window.pauseBackgroundScroll = function() {
        console.log("Pausing background scroll and dot animations");
        isBackgroundScrollingPaused = true;
        savedScrollPosition = position; // Save current position
        
        // Also pause dot animations if YellowJetCanvas is available
        if (window.yellowJetCanvas) {
            window.yellowJetCanvas.isPaused = true;
        }
    };
    
    window.resumeBackgroundScroll = function() {
        console.log("Resuming background scroll and dot animations from position: " + savedScrollPosition);
        isBackgroundScrollingPaused = false;
        
        // Also resume dot animations if YellowJetCanvas is available
        if (window.yellowJetCanvas) {
            window.yellowJetCanvas.isPaused = false;
        }
    };
    
    // Add a method to the global scope for starting/stopping animation
    window.updateScrollingBackground = updateAnimation;
    
    // Initial animation state setup
    updateAnimation();
}

// Keep only this instance creation in the DOMContentLoaded event
document.addEventListener('DOMContentLoaded', () => {
    const canvas = new YellowJetCanvas();
    
    // Double ensure the canvas is accessible
    window.yellowJetCanvas = canvas;
    
    console.log("Yellow Jet Canvas initialized and exposed globally");
});

// Also add code to check animation state when loading state changes
YellowJetCanvas.prototype.startLoadingCountdown = function() {
    console.log("Starting loading countdown");
    
    // Set loading state
    this.isLoading = true;
    
    // Clear any previous animation frame
    if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
    }
    
    // Update background animation state
    if (window.updateScrollingBackground) {
        window.updateScrollingBackground();
    }
    
    // Rest of existing code...
    this.loadingStartTime = Date.now();
    
    // Update multiplier display to show countdown
    if (this.multiplierElement) {
        this.multiplierElement.textContent = '5';
        this.multiplierElement.style.color = 'white'; // Reset color
    }
    
    // Start animation loop (will first show countdown)
    this.animate();
}

YellowJetCanvas.prototype.startAnimation = function() {
    console.log("Starting new animation, resetting all states");
    
    // Reset loading state
    this.isLoading = false;
    
    // IMPORTANT: Directly resume dot animations
    this.isPaused = false;
    console.log("Resumed dot animations for new round");
    
    // Update background animation state
    if (window.updateScrollingBackground) {
        window.updateScrollingBackground();
    }
    
    // Rest of existing code...
    // Clear any previous animation frame
    if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
    }
    
    // Reset explosion state completely
    this.explosionState = 'none';
    this.explosionLock = false;
    this.explosionElementShowing = false;
    this.isExploding = false;
    this.hasExploded = false;
    
    // Clean up any explosion elements
    this.cleanupExplosionElements();
    
    // Reset jet position for a new animation
    this.jetPosition = {
        x: this.verticalLine + this.jetStartXOffset,
        y: this.horizontalLine + this.jetStartYOffset
    };
    
    // Reset all animation states
    this.jetStarted = false;
    this.hasReachedDestination = false;
    
    // Reset the final jet position
    this.finalJetPosition = null;

    // Reset multiplier
    this.multiplier = 1.00;
    // CRITICAL FIX: Remove the line that regenerates targetMultiplier
    // this.targetMultiplier = this.generateRandomMultiplier(); <-- REMOVE THIS LINE
    this.lastMultiplierUpdate = Date.now();
    
    // Update multiplier display
    if (this.multiplierElement) {
        this.multiplierElement.textContent = '1.00x';
    }

    // Dispatch an event that a new round has started - WITH RETRY
    try {
        window.dispatchEvent(new CustomEvent('yellow-jet-round-started'));
        console.log("Dispatched yellow-jet-round-started event");
    } catch (error) {
        console.error("Error dispatching round started event:", error);
        
        // Retry dispatching the event after a short delay
        setTimeout(() => {
            try {
                window.dispatchEvent(new CustomEvent('yellow-jet-round-started'));
                console.log("Retried dispatching yellow-jet-round-started event");
            } catch (e) {
                console.error("Failed to dispatch event on retry:", e);
            }
        }, 100);
    }

    // Add debug logging to verify target multiplier consistency
    console.log(`Starting new round with target multiplier: ${this.targetMultiplier.toFixed(2)}x`);
    
    // Start animation loop
    this.animate();
    
    // Start jet animation after a short delay
    setTimeout(() => {
        this.jetStarted = true;
        this.jetAnimationStartTime = Date.now();
    }, 1000);
}

// Update the window pause/resume functions to also affect dot animations
window.pauseBackgroundScroll = function() {
    log("Pausing background scroll");
    isBackgroundScrollingPaused = true;
    savedScrollPosition = position; // Save current position
    
    // Also pause dot animations if YellowJetCanvas is available
    if (window.yellowJetCanvas) {
        window.yellowJetCanvas.isPaused = true;
    }
};

window.resumeBackgroundScroll = function() {
    log("Resuming background scroll from position: " + savedScrollPosition);
    isBackgroundScrollingPaused = false;
    
    // Also resume dot animations if YellowJetCanvas is available
    if (window.yellowJetCanvas) {
        window.yellowJetCanvas.isPaused = false;
    }
};