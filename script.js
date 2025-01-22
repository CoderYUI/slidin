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
    }

    init() {
        if (this.gameStarted) return;
        this.gameStarted = true;
        this.moves = 0;
        this.updateMoves();
        this.startButton.style.display = 'none';
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

    shuffleBoard() {
        do {
            this.shuffle();
        } while (!this.isSolvable());
        this.createBoard();
    }

    shuffle() {
        for (let i = this.tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
        }
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
        const tileValue = parseInt(clickedTile.dataset.value);
        const tileIndex = this.tiles.indexOf(tileValue);
        const emptyIndex = this.tiles.indexOf(0);

        if (this.isAdjacent(tileIndex, emptyIndex)) {
            clickedTile.style.transition = 'transform 0.1s';
            this.tiles[emptyIndex] = tileValue;
            this.tiles[tileIndex] = 0;
            this.createBoard();
            this.moves++;
            this.updateMoves();

            if (this.isSolved()) {
                setTimeout(() => {
                    this.handleWin();
                }, 300);
            }
        }
    }

    setupEventListeners() {
        this.board.addEventListener('click', (e) => {
            const tile = e.target.closest('.tile');
            if (tile && !tile.classList.contains('empty') && this.gameStarted) {
                this.moveTile(tile);
            }
        });

        this.startButton.addEventListener('click', () => {
            this.init();
        });
        
        // Remove the shuffle button event listener since we removed the button
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
            const response = await fetch('/api/save-time', {
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
