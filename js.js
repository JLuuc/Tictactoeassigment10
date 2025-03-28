/*
# This project is based on a public project but has been modified 
# according to the requirements of the DevOps Level 2 course.
# Instructor: Washington Valencia
# Institution: CCTB College
*/

"use strict";

/*

A SIMPLE TIC-TAC-TOE GAME IN JAVASCRIPT

(1) Grid layout

The game grid is represented in the array Grid.cells as follows:

[0] [1] [2]
[3] [4] [5]
[6] [7] [8]

The cells (array elements) hold the following numeric values:
0 if not occupied, 1 for player, 3 for computer.
This allows us to quickly get an overview of the game state:
if the sum of all the cells in a row is 9, the computer wins,
if it is 3 and all the cells are occupied, the human player wins,
etc.

(2) Strategy of makeComputerMove()

The computer first looks for almost completed rows, columns, and
diagonals, where there are two fields occupied either by the human
player or by the computer itself. If the computer can win by
completing a sequence, it does so; if it can block the player from
winning with the next move, it does that. If none of that applies,
it plays the center field if that's free, otherwise it selects a
random free field. This is not a 100 % certain strategy, but the
gameplay experience is fairly decent.

*/

//==================================
// EVENT BINDINGS
//==================================

// Bind Esc key to closing the modal dialog
document.onkeypress = function (evt) {
    evt = evt || window.event;
    var modal = document.getElementsByClassName("modal")[0];
    if (evt.keyCode === 27) {
        modal.style.display = "none";
    }
};

// When the user clicks anywhere outside of the modal dialog, close it
window.onclick = function (evt) {
    var modal = document.getElementsByClassName("modal")[0];
    if (evt.target === modal) {
        modal.style.display = "none";
    }
};

//==================================
// HELPER FUNCTIONS
//==================================
function sumArray(array) {
    var sum = 0;
    for (var i = 0; i < array.length; i++) {
        sum += array[i];
    }
    return sum;
}

function isInArray(element, array) {
    return array.indexOf(element) > -1;
}

function shuffleArray(array) {
    var counter = array.length, temp, index;
    while (counter > 0) {
        index = Math.floor(Math.random() * counter);
        counter--;
        temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }
    return array;
}

function intRandom(min, max) {
    var rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
}

//==================================
// GLOBAL VARIABLES
//==================================
var moves = 0,
    winner = 0,
    // Numeric values for X and O
    x = 1,
    o = 3,
    // Default: player is X, computer is O
    player = x,
    computer = o,
    whoseTurn = x,
    gameOver = false,
    score = {
        ties: 0,
        player: 0,
        computer: 0
    },
    // Use proper HTML for X and O
    xText = "<span class=\"x\">X</span>",  // or &times; if you prefer
    oText = "<span class=\"o\">O</span>",  // or 0 if you prefer
    playerText = xText,
    computerText = oText,
    difficulty = 1,
    myGrid = null;

//==================================
// GRID OBJECT
//==================================

function Grid() {
    this.cells = new Array(9);
}

// Return array of free cell indices
Grid.prototype.getFreeCellIndices = function () {
    var resultArray = [];
    for (var i = 0; i < this.cells.length; i++) {
        if (this.cells[i] === 0) {
            resultArray.push(i);
        }
    }
    return resultArray;
};

Grid.prototype.getRowValues = function (index) {
    if (index < 0 || index > 2) {
        console.error("Wrong arg for getRowValues!");
        return undefined;
    }
    var start = index * 3;
    return this.cells.slice(start, start + 3);
};

Grid.prototype.getRowIndices = function (index) {
    if (index < 0 || index > 2) {
        console.error("Wrong arg for getRowIndices!");
        return undefined;
    }
    var row = [];
    index = index * 3;
    row.push(index, index + 1, index + 2);
    return row;
};

Grid.prototype.getColumnValues = function (index) {
    if (index < 0 || index > 2) {
        console.error("Wrong arg for getColumnValues!");
        return undefined;
    }
    var column = [];
    for (var i = index; i < this.cells.length; i += 3) {
        column.push(this.cells[i]);
    }
    return column;
};

Grid.prototype.getColumnIndices = function (index) {
    if (index < 0 || index > 2) {
        console.error("Wrong arg for getColumnIndices!");
        return undefined;
    }
    var column = [];
    for (var i = index; i < this.cells.length; i += 3) {
        column.push(i);
    }
    return column;
};

// arg 0: top-left diagonal, arg 1: top-right diagonal
Grid.prototype.getDiagValues = function (arg) {
    if (arg !== 0 && arg !== 1) {
        console.error("Wrong arg for getDiagValues!");
        return undefined;
    }
    var cells = [];
    if (arg === 0) {
        cells.push(this.cells[0], this.cells[4], this.cells[8]);
    } else {
        cells.push(this.cells[2], this.cells[4], this.cells[6]);
    }
    return cells;
};

Grid.prototype.getDiagIndices = function (arg) {
    if (arg !== 0 && arg !== 1) {
        console.error("Wrong arg for getDiagIndices!");
        return undefined;
    }
    if (arg === 0) {
        return [0, 4, 8];
    } else {
        return [2, 4, 6];
    }
};

// Checks if agent (player or computer) has 2 in a row somewhere
Grid.prototype.getFirstWithTwoInARow = function (agent) {
    if (agent !== computer && agent !== player) {
        console.error("getFirstWithTwoInARow accepts only player or computer as argument.");
        return undefined;
    }
    var sumNeeded = agent * 2;
    var freeCells = shuffleArray(this.getFreeCellIndices());
    for (var i = 0; i < freeCells.length; i++) {
        // Check rows and columns
        for (var j = 0; j < 3; j++) {
            var rowV = this.getRowValues(j);
            var rowI = this.getRowIndices(j);
            var colV = this.getColumnValues(j);
            var colI = this.getColumnIndices(j);
            if (sumArray(rowV) === sumNeeded && isInArray(freeCells[i], rowI)) {
                return freeCells[i];
            } else if (sumArray(colV) === sumNeeded && isInArray(freeCells[i], colI)) {
                return freeCells[i];
            }
        }
        // Check diagonals
        for (var d = 0; d < 2; d++) {
            var diagV = this.getDiagValues(d);
            var diagI = this.getDiagIndices(d);
            if (sumArray(diagV) === sumNeeded && isInArray(freeCells[i], diagI)) {
                return freeCells[i];
            }
        }
    }
    return false;
};

Grid.prototype.reset = function () {
    for (var i = 0; i < this.cells.length; i++) {
        this.cells[i] = 0;
    }
    return true;
};

//==================================
// MAIN FUNCTIONS
//==================================

/**
 * Called when the page loads (see body onload="initialize()" in index.html).
 * Sets up the board, then shows the "Hi, how would you like to play?" dialog.
 */
function initialize() {
    myGrid = new Grid();
    moves = 0;
    winner = 0;
    gameOver = false;
    whoseTurn = player; // By default X is first, can be changed after user picks O

    // Clear the grid
    for (var i = 0; i < myGrid.cells.length; i++) {
        myGrid.cells[i] = 0;
    }

    // After a short delay, display the options dialog
    setTimeout(showOptions, 500);
}

/**
 * Displays the "optionsDlg" modal so user can choose difficulty and symbol.
 * (Matches IDs from index.html: r0, r1, rx, ro)
 */
function showOptions() {
    // Reflect current difficulty in the radio buttons
    if (difficulty === 0) {
        document.getElementById("r0").checked = true;
        document.getElementById("r1").checked = false;
    } else {
        document.getElementById("r0").checked = false;
        document.getElementById("r1").checked = true;
    }

    // Reflect current symbol in the radio buttons
    if (player === o) {
        document.getElementById("rx").checked = false;
        document.getElementById("ro").checked = true;
    } else {
        document.getElementById("rx").checked = true;
        document.getElementById("ro").checked = false;
    }

    // Show the modal
    document.getElementById("optionsDlg").style.display = "block";
}

/**
 * Reads the user's selections (difficulty, X or O),
 * sets up the player/computer roles accordingly, and hides the dialog.
 * Called by the "Play" button in index.html (id="okBtn").
 */
function getOptions() {
    // Check difficulty
    var diffs = document.getElementsByName("difficulty");
    for (var i = 0; i < diffs.length; i++) {
        if (diffs[i].checked) {
            difficulty = parseInt(diffs[i].value);
            break;
        }
    }

    // Check which symbol was selected
    if (document.getElementById("rx").checked === true) {
        // Player is X, Computer is O
        player = x;
        computer = o;
        whoseTurn = player; // Player goes first
        playerText = xText;
        computerText = oText;
    } else {
        // Player is O, Computer is X
        player = o;
        computer = x;
        whoseTurn = computer; // Computer goes first
        playerText = oText;
        computerText = xText;
        // If computer goes first, we can make the AI move now
        setTimeout(makeComputerMove, 400);
    }

    // Hide the modal
    document.getElementById("optionsDlg").style.display = "none";
}

/**
 * Called when the user clicks a cell (e.g. <div id="cell0" onclick="cellClicked(this.id)">).
 * The last digit in "cell0" is the index in the grid.
 */
function cellClicked(cellId) {
    var index = parseInt(cellId.replace("cell", ""));
    // If it's not the player's turn, or the cell is occupied, or the game is over, do nothing
    if (whoseTurn !== player || myGrid.cells[index] > 0 || gameOver) {
        return;
    }
    moves++;
    // Place the player's symbol (X or O) in the cell
    document.getElementById(cellId).innerHTML = playerText;

    // Randomize orientation for a "hand-drawn" feel
    var rand = Math.random();
    if (rand < 0.3) {
        document.getElementById(cellId).style.transform = "rotate(180deg)";
    } else if (rand > 0.6) {
        document.getElementById(cellId).style.transform = "rotate(90deg)";
    }
    document.getElementById(cellId).style.cursor = "default";

    // Mark the grid
    myGrid.cells[index] = player;

    // Check for a winner if at least 5 moves have been played
    if (moves >= 5) {
        winner = checkWin();
    }
    if (winner === 0) {
        whoseTurn = computer;
        makeComputerMove();
    }
}

/**
 * Resets the game. If "ask" is true, shows the options dialog again.
 */
function restartGame(ask) {
    if (moves > 0) {
        var response = confirm("Are you sure you want to start over?");
        if (!response) {
            return;
        }
    }
    gameOver = false;
    moves = 0;
    winner = 0;
    whoseTurn = x; // default
    myGrid.reset();

    // Clear the board UI
    for (var i = 0; i < 9; i++) {
        var cellId = "cell" + i;
        document.getElementById(cellId).innerHTML = "";
        document.getElementById(cellId).style.cursor = "pointer";
        document.getElementById(cellId).classList.remove("win-color");
        document.getElementById(cellId).style.transform = "none";
    }

    // If we want to ask again, show the options
    if (ask === true) {
        setTimeout(showOptions, 200);
    } else if (whoseTurn === computer) {
        // If the computer goes first, do an AI move
        setTimeout(makeComputerMove, 800);
    }
}

/**
 * The AI logic that decides where the computer plays.
 */
function makeComputerMove() {
    if (gameOver) {
        return;
    }
    var cell = -1;
    var corners = [0, 2, 6, 8];
    var freeCells = myGrid.getFreeCellIndices();

    if (moves >= 3) {
        // 1) Try to win
        cell = myGrid.getFirstWithTwoInARow(computer);
        // 2) Or block the player
        if (cell === false) {
            cell = myGrid.getFirstWithTwoInARow(player);
        }
        // 3) Or pick center, else random
        if (cell === false) {
            if (myGrid.cells[4] === 0 && difficulty === 1) {
                cell = 4;
            } else {
                cell = freeCells[intRandom(0, freeCells.length - 1)];
            }
        }
        // Additional special-case logic can go here...
    } else if (moves === 1 && myGrid.cells[4] === player && difficulty === 1) {
        // If player started in center, pick a corner
        cell = corners[intRandom(0, 3)];
    } else if (moves === 0 && intRandom(1, 10) < 8) {
        // Sometimes pick a corner on first move
        cell = corners[intRandom(0, 3)];
    } else {
        // Default: center if free (on hard mode), else random
        if (myGrid.cells[4] === 0 && difficulty === 1) {
            cell = 4;
        } else {
            cell = freeCells[intRandom(0, freeCells.length - 1)];
        }
    }

    // Place the computer's symbol
    var cellId = "cell" + cell;
    document.getElementById(cellId).innerHTML = computerText;
    document.getElementById(cellId).style.cursor = "default";

    // Random orientation
    var rand = Math.random();
    if (rand < 0.3) {
        document.getElementById(cellId).style.transform = "rotate(180deg)";
    } else if (rand > 0.6) {
        document.getElementById(cellId).style.transform = "rotate(90deg)";
    }

    // Update the grid
    myGrid.cells[cell] = computer;
    moves++;
    if (moves >= 5) {
        winner = checkWin();
    }
    if (winner === 0 && !gameOver) {
        whoseTurn = player;
    }
}

/**
 * Checks if someone won. Returns the winner (player, computer, or 10 for tie).
 */
function checkWin() {
    winner = 0;

    // Check rows
    for (var i = 0; i < 3; i++) {
        var row = myGrid.getRowValues(i);
        if (row[0] > 0 && row[0] === row[1] && row[1] === row[2]) {
            winner = row[0];
            highlightWin(myGrid.getRowIndices(i));
            break;
        }
    }
    // Check columns if no winner
    if (winner === 0) {
        for (i = 0; i < 3; i++) {
            var col = myGrid.getColumnValues(i);
            if (col[0] > 0 && col[0] === col[1] && col[1] === col[2]) {
                winner = col[0];
                highlightWin(myGrid.getColumnIndices(i));
                break;
            }
        }
    }
    // Check diagonals if no winner
    if (winner === 0) {
        for (i = 0; i < 2; i++) {
            var diag = myGrid.getDiagValues(i);
            if (diag[0] > 0 && diag[0] === diag[1] && diag[1] === diag[2]) {
                winner = diag[0];
                highlightWin(myGrid.getDiagIndices(i));
                break;
            }
        }
    }
    // If no winner and no free cells, it's a tie
    if (winner === 0 && myGrid.getFreeCellIndices().length === 0) {
        winner = 10; // tie
    }

    if (winner > 0) {
        setTimeout(endGame, 1000, winner);
    }
    return winner;
}

/**
 * Highlights the winning row/column/diagonal in a different color.
 */
function highlightWin(indices) {
    for (var j = 0; j < indices.length; j++) {
        var str = "cell" + indices[j];
        document.getElementById(str).classList.add("win-color");
    }
}

/**
 * Ends the game, announces the result, updates the scoreboard.
 */
function endGame(who) {
    if (who === player) {
        score.player++;
        announceWinner("Congratulations, you won!");
    } else if (who === computer) {
        score.computer++;
        announceWinner("Computer wins!");
    } else {
        // tie
        score.ties++;
        announceWinner("It's a tie!");
    }
    gameOver = true;
    whoseTurn = 0;
    moves = 0;
    winner = 0;

    // Update scoreboard
    document.getElementById("computer_score").innerHTML = score.computer;
    document.getElementById("tie_score").innerHTML = score.ties;
    document.getElementById("player_score").innerHTML = score.player;

    // Disable board
    for (var i = 0; i < 9; i++) {
        var cellId = "cell" + i;
        document.getElementById(cellId).style.cursor = "default";
    }
    // After a short delay, auto-restart
    setTimeout(restartGame, 800);
}

/**
 * Shows a winner/tie message in the "winAnnounce" modal.
 */
function announceWinner(text) {
    document.getElementById("winText").innerHTML = text;
    document.getElementById("winAnnounce").style.display = "block";
    // Auto-close the modal after 1.4s
    setTimeout(closeModal, 1400, "winAnnounce");
}

/**
 * Closes a modal dialog by ID.
 */
function closeModal(id) {
    document.getElementById(id).style.display = "none";
}

/**
 * Example function for yes/no user feedback (not currently used).
 */
function askUser(text) {
    document.getElementById("questionText").innerHTML = text;
    document.getElementById("userFeedback").style.display = "block";
}
