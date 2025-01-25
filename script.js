class SlidingPuzzle {
    constructor() {
        this.board = document.getElementById('board');
        this.tiles = [];
        this.moves = 0;
        this.rows = 3;
        this.cols = 4;
        this.size = this.rows * this.cols;
        this.imageLoaded = false;
        this.imagePath = './puzzle.jpg';
        this.timeLimit = 5 * 60 * 1000; // 5 minutes in milliseconds
        this.startTime = null;
        this.timerInterval = null;
        this.timerDisplay = document.getElementById('timer');
        this.gameStarted = false;
        this.startButton = document.getElementById('startGame');
        this.setupEventListeners(); // Move this after all properties are initialized
        this.loadImage();
    }

    loadImage() {
        const img = new Image();
        img.onload = () => {
            console.log('Image loaded successfully');
            this.imageLoaded = true;
            this.setupInitialBoard(); // Changed from init() to setupInitialBoard()
        };
        img.onerror = (e) => {
            console.error('Error loading image:', e);
            alert(`Error loading image from: ${this.imagePath}`);
            this.init();
        };
        img.src = this.imagePath;
    }

    setupInitialBoard() {
        this.board.innerHTML = '';
        this.tiles = Array.from({length: this.size - 1}, (_, i) => i + 1);
        this.tiles.push(0);
        this.moves = 0;
        this.updateMoves();
        this.timerDisplay.textContent = '5:00';
        this.createBoard();
        this.startButton.style.display = 'block'; // Make sure start button is visible
        this.board.classList.add('complete-state');
        // Position the last tile (empty one) correctly
        const lastTile = this.board.querySelector('.empty');
        if (lastTile) {
            lastTile.style.backgroundPosition = `-300px -200px`;
        }
    }

    init() {
        if (this.gameStarted) return;
        this.gameStarted = true;
        this.moves = 0;
        this.updateMoves();
        this.startButton.style.display = 'none';
        this.board.classList.remove('complete-state');
        this.shuffleBoard();
        this.startTimer();
    }

    createBoard() {
        this.board.innerHTML = '';
        this.tiles.forEach((num, index) => {
            const tile = document.createElement('div');
            tile.className = `tile ${num === 0 ? 'empty' : ''}`;
            tile.dataset.value = num;
            
            if (num !== 0) {
                if (this.imageLoaded) {
                    tile.classList.add('has-image');
                    // Calculate background position
                    const row = Math.floor((num - 1) / this.cols);
                    const col = (num - 1) % this.cols;
                    tile.style.backgroundPosition = 
                        `-${col * 100}px -${row * 100}px`;
                }
                // Remove the text content line that was showing the number
            }
            
            this.board.appendChild(tile);
        });
    }

    shuffle() {
        // Increase shuffles for moderate difficulty (30-35 moves optimal solution)
        const maxShuffles = 35;
        let emptyIndex = this.tiles.indexOf(0);
        let lastMove = null;
        
        for (let i = 0; i < maxShuffles; i++) {
            const possibleMoves = [];
            const emptyPos = this.getPosition(emptyIndex);
            
            // Define possible directions
            const directions = [
                {row: -1, col: 0, opposite: 'down'}, // up
                {row: 1, col: 0, opposite: 'up'},    // down
                {row: 0, col: -1, opposite: 'right'},// left
                {row: 0, col: 1, opposite: 'left'}   // right
            ];
            
            for (const dir of directions) {
                const newRow = emptyPos.row + dir.row;
                const newCol = emptyPos.col + dir.col;
                
                if (newRow >= 0 && newRow < this.rows && 
                    newCol >= 0 && newCol < this.cols) {
                    // Avoid immediate backtracking
                    if (lastMove !== dir.opposite) {
                        possibleMoves.push({
                            index: newRow * this.cols + newCol,
                            direction: dir
                        });
                    }
                }
            }
            
            // Select a move that maintains moderate difficulty
            const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
            if (!move) continue;
            
            // Update last move and perform the swap
            lastMove = move.direction.opposite;
            this.tiles[emptyIndex] = this.tiles[move.index];
            this.tiles[move.index] = 0;
            emptyIndex = move.index;
        }
    }

    shuffleBoard() {
        let attempts = 0;
        const maxAttempts = 10;

        do {
            this.shuffle();
            attempts++;
            if (attempts >= maxAttempts) break;
        } while (!this.isSolvable() || this.isTooDifficult());

        this.createBoard();
    }

    isTooDifficult() {
        let outOfPlaceCount = 0;
        let manhattanDistance = 0;
        
        for (let i = 0; i < this.tiles.length; i++) {
            if (this.tiles[i] !== 0) {
                const currentPos = this.getPosition(i);
                const correctPos = this.getPosition(this.tiles[i] - 1);
                
                manhattanDistance += Math.abs(currentPos.row - correctPos.row) + 
                                   Math.abs(currentPos.col - correctPos.col);
                
                if (this.tiles[i] !== i + 1) {
                    outOfPlaceCount++;
                }
            }
        }
        
        // Moderate difficulty criteria:
        // - Manhattan distance should be between 25-45 moves
        // - 40-60% of tiles should be out of place
        return manhattanDistance < 25 || manhattanDistance > 45 ||
               outOfPlaceCount < (this.size * 0.4) || 
               outOfPlaceCount > (this.size * 0.6);
    }

    getPosition(index) {
        return {
            row: Math.floor(index / this.cols),
            col: index % this.cols
        };
    }

    isAdjacent(index1, index2) {
        const pos1 = this.getPosition(index1);
        const pos2 = this.getPosition(index2);
        return Math.abs(pos1.row - pos2.row) + Math.abs(pos1.col - pos2.col) === 1;
    }

    moveTile(clickedTile) {
        if (!this.gameStarted) return;
        
        try {
            const tileValue = parseInt(clickedTile.dataset.value);
            const tileIndex = this.tiles.indexOf(tileValue);
            const emptyIndex = this.tiles.indexOf(0);

            if (this.isAdjacent(tileIndex, emptyIndex)) {
                // Add transition for smooth movement
                clickedTile.style.transition = 'transform 0.2s ease-in-out';
                
                // Perform the move
                this.tiles[emptyIndex] = tileValue;
                this.tiles[tileIndex] = 0;
                
                // Update the board with animation
                requestAnimationFrame(() => {
                    this.createBoard();
                    this.moves++;
                    this.updateMoves();

                    if (this.isSolved()) {
                        setTimeout(() => {
                            this.handleWin();
                        }, 300);
                    }
                });
            }
        } catch (error) {
            console.error('Error moving tile:', error);
            // Fallback: refresh the board
            this.createBoard();
        }
    }

    setupEventListeners() {
        // Mouse events
        this.board.addEventListener('click', (e) => {
            this.handleInteraction(e);
        });

        // Touch events
        this.board.addEventListener('touchstart', (e) => {
            e.preventDefault(); // Prevent scrolling
            const touch = e.touches[0];
            const element = document.elementFromPoint(touch.clientX, touch.clientY);
            if (element) {
                this.handleInteraction({ target: element });
            }
        }, { passive: false });

        // Handle both touch and mouse events
        this.handleInteraction = (e) => {
            const tile = e.target.closest('.tile');
            if (tile && !tile.classList.contains('empty') && this.gameStarted) {
                // Add visual feedback
                tile.style.opacity = '0.8';
                setTimeout(() => {
                    tile.style.opacity = '1';
                }, 100);
                
                this.moveTile(tile);
            }
        };

        this.startButton.addEventListener('click', () => {
            this.init();
        });

        // Prevent unwanted gestures
        this.board.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });

        // Fix for iOS devices
        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('#board')) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    isSolvable() {
        let inversions = 0;
        for (let i = 0; i < this.tiles.length - 1; i++) {
            for (let j = i + 1; j < this.tiles.length; j++) {
                if (this.tiles[i] && this.tiles[j] && this.tiles[i] > this.tiles[j]) {
                    inversions++;
                }
            }
        }
        return inversions % 2 === 0;
    }

    updateMoves() {
        document.getElementById('moves').textContent = `Moves: ${this.moves}`;
    }

    isSolved() {
        for (let i = 0; i < this.tiles.length - 1; i++) {
            if (this.tiles[i] !== i + 1) return false;
        }
        return true;
    }

    startTimer() {
        this.startTime = Date.now();
        this.updateTimer();
        this.timerInterval = setInterval(() => this.updateTimer(), 10);
    }

    updateTimer() {
        const elapsed = Date.now() - this.startTime;
        const remaining = this.timeLimit - elapsed;

        if (remaining <= 0) {
            this.gameOver(true);
            return;
        }

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        this.timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    async saveTime(timeData) {
        try {
            // Use different endpoints for development and production
            const endpoint = window.location.hostname === 'localhost' 
                ? '/save-time'  // For local development
                : '/api/save-time';  // For Vercel production

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(timeData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to save time');
            }
            
            console.log('Time saved successfully');
        } catch (error) {
            console.error('Error saving time:', error);
        }
    }

    gameOver(timeout = false) {
        clearInterval(this.timerInterval);
        const endTime = Date.now();
        const timeTaken = endTime - this.startTime;
        
        if (timeout) {
            alert('Time\'s up! Try again!');
            this.setupInitialBoard(); // Reset to initial state instead of init()
            this.gameStarted = false;
            return;
        }

        // Show complete image
        this.board.classList.add('complete-state');
        const emptyTile = this.board.querySelector('.empty');
        if (emptyTile) {
            emptyTile.style.backgroundPosition = `-300px -200px`;
        }

        const timeData = {
            moves: this.moves,
            time: {
                minutes: Math.floor(timeTaken / 60000),
                seconds: Math.floor((timeTaken % 60000) / 1000),
                milliseconds: timeTaken % 1000
            },
            date: new Date().toISOString()
        };

        this.saveTime(timeData);
        alert(`Puzzle solved!\nTime: ${timeData.time.minutes}:${timeData.time.seconds.toString().padStart(2, '0')}.${timeData.time.milliseconds.toString().padStart(3, '0')}\nMoves: ${this.moves}`);
        
        this.setupInitialBoard(); // Reset after showing results
        this.gameStarted = false;
    }

    handleWin() {
        this.gameOver(false);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SlidingPuzzle();
});
