"use strict"

const BACKGROUND_COLOR = "rgb(70, 70, 70)"
let playerTurn = Math.floor(Math.random() * 5001) % 2 == 0 ? 2 : 1;


window.onload = () => {
    drawGameBoard();
    const playerPieces = initPieces();
    drawAllPieces(playerPieces);
    document.getElementById('turn-label').innerHTML = `Player ${playerTurn}'s turn!`
    activePlayerEvents(playerPieces, playerTurn);
};

const drawGameBoard = () => {
    const gameBoard = document.getElementById('game-board');
    
    for (let row = 1; row <= 8; row++) {
        let newRow = document.createElement("div");
        newRow.setAttribute("id", `row${row}`);
        newRow.style.height = "12.5%";
        newRow.style.width = "100%";

        for (let col = 1; col <= 8; col++) {
            let newCol = document.createElement("div");
            newCol.setAttribute("id", `r${row}-c${col}`);
            newCol.setAttribute("class", "play-space")
            newCol.style.width = "12.5%";
            newCol.style.height = "100%";
            newCol.style.display = "inline-block";
            newCol.style.position = "relative";

            if (row % 2 == 0) {
                if (col % 2 !== 0) {
                    newCol.style.backgroundColor = BACKGROUND_COLOR;
                }
            } else {
                if (col % 2 == 0) {
                    newCol.style.backgroundColor = BACKGROUND_COLOR;
                }
            }
            newRow.appendChild(newCol);
        }
        gameBoard.appendChild(newRow);
    }
};

const eraseGameBoard = () => {
    const gameBoard = document.getElementById('game-board');
    while (gameBoard.firstChild) {
        gameBoard.removeChild(gameBoard.firstChild);
    }
}

//initialize the pieces for both teams and return a list of objects that represent the pieces
const initPieces = () => {
    const spaces = document.getElementsByClassName("play-space");
    let playerPieces = [];
    let piece1Count = 1;
    let piece2Count = 1;

    for (let i of spaces) {
        if (i.style.backgroundColor == BACKGROUND_COLOR && i.getAttribute("id").charAt(1) <= 3) {
            playerPieces.push({
                "player": 1, 
                "space": i.getAttribute("id"), 
                "number": piece1Count, 
                "promote": false, 
                "selected": false,
                "visible": true,
                "actions": []
            });
            piece1Count++;
        } else if (i.style.backgroundColor == BACKGROUND_COLOR && i.getAttribute("id").charAt(1) >= 6) {
            playerPieces.push({
                "player": 2,
                "space": i.getAttribute("id"),
                "number": piece2Count, 
                "promote": false,
                "selected": false,
                "visible": true,
                "actions": []
            });
            piece2Count++;
        }
    }
    return playerPieces;
}

// draw all pieces on board based on information from the pieces objects
const drawAllPieces = (pieces) => {
    pieces.forEach(item => {
        if (item.visible == true) {
            const space = document.getElementById(item.space);
            if (pieces.indexOf(item) < 12) {
                displayPieceOnSpace(space, 1, pieces);
            } else {
                displayPieceOnSpace(space, 2, pieces);
            }
        }
    })
};

const removeAllPieces = (pieces) => {
    pieces.forEach(item => {
        removePieceFromSpace(item.space);
    })
};

const displayPieceOnSpace = (space, player, pieces) => {
    const newPiece = document.createElement("div");
    newPiece.setAttribute("class", `player${player}-piece`);
    const newPieceRim = document.createElement("div");
    newPieceRim.setAttribute("class", `player${player}-piece-rim`);
    const newPieceBase = document.createElement("div");
    newPieceBase.setAttribute("class", `player${player}-piece-base`);
    const newPieceCenter = document.createElement("div");
    newPieceCenter.setAttribute("class", `player${player}-piece-center`);

    newPiece.appendChild(newPieceRim);
    newPiece.appendChild(newPieceBase);
    newPiece.appendChild(newPieceCenter);

    if (getPieceObjectFromCoords(space.getAttribute("id"), pieces).promote == true) {
        const newPieceKing = document.createElement("div");
        newPieceKing.setAttribute("class", `player-piece-king`);
        newPieceKing.innerText = "K";
        newPiece.appendChild(newPieceKing);
    }


    space.appendChild(newPiece);
}

const activePlayerEvents = (pieces, player) => {
    updateActionsOnPieces(pieces, player);

    document.querySelectorAll(`.player${player}-piece`).forEach(item => {
        item.addEventListener('click', () => {
            const pieceCoords = item.parentElement.getAttribute('id');
            deselectAllPieces(pieces);
            refreshBoard(pieces);
            applySelectedShadow(pieceCoords);
            selectPiece(pieces, pieceCoords);
            activePlayerEvents(pieces, player);

            getSelectedPiece(pieces).actions.forEach(action => {
                const actionSpace = document.getElementById(action.coords);
                actionSpace.addEventListener('click', () => {
                    if (action.kill != "") {
                        updatePiece(pieces, getSelectedPiece(pieces).space, action.coords);
                        killPiece(pieces, action.kill);
                        refreshBoard(pieces);
                        continueJump(pieces, player);
                    } else {
                        updatePiece(pieces, getSelectedPiece(pieces).space, action.coords);
                        refreshBoard(pieces);
                        switchPlayer(pieces, player);
                    }
                })
            })
        });
    })
};

const continueJump = (pieces, player) => {
    applySelectedShadow(getSelectedPiece(pieces).space);
    getSelectedPiece(pieces).actions = getPossibleActions(getSelectedPiece(pieces).space, pieces, player).filter(action => action.kill != "");
    if (getSelectedPiece(pieces).actions.length > 0) {
        getSelectedPiece(pieces).actions.forEach(action => {
            const actionSpace = document.getElementById(action.coords);
            actionSpace.addEventListener('click', () => {
                updatePiece(pieces, getSelectedPiece(pieces).space, action.coords);
                killPiece(pieces, action.kill);
                clearAllActions(pieces);
                refreshBoard(pieces);
                continueJump(pieces, player);
            })
        })
    } else {
        refreshBoard(pieces);
        switchPlayer(pieces, player);
    }
};

const areJumpsAvailable = (pieces) => {
    let jumpCount = 0;
    for (const item of pieces) {
        for (const action of item.actions) {
            if (action.kill != "") {
                jumpCount++;
            }
        }
    }
    return jumpCount > 0 ? true : false;
};

const filterOnlyJumps = (pieces) => {
    pieces.forEach(item => {
        item.actions = item.actions.filter(action => action.kill != "");
    })
}

const updateActionsOnPieces = (pieces, player) => {
    pieces.forEach(item => {
        item.actions = getPossibleActions(item.space, pieces, player)
    })
    if (areJumpsAvailable(pieces)) {
        filterOnlyJumps(pieces);
    }
}

const clearAllActions = (pieces) => {
    pieces.forEach(item => {
        item.actions = [];
    })
}

const refreshBoard = (pieces) => {
    eraseGameBoard();
    drawGameBoard();
    drawAllPieces(pieces);
    clearAllActions(pieces);
}

const removePieceFromSpace = (coords) => {
    const space = document.getElementById(coords);
    while (space.firstChild) {
        space.removeChild(space.firstChild);
    }
};

const killPiece = (pieces, pieceToKill) => {
    pieces.forEach(item => {
        if (item.space == pieceToKill) {
            item.space = "dead";
            item.visible = false;
        }
    })
};

const deselectAllPieces = (pieces) => {
    for (const i of pieces) {
        i.selected = false;
        if (i.space != "dead") {
            resetShadow(i.space);
        }
    }
};

const resetShadow = (space) => {
    const playerPiece = document.getElementById(space).firstChild;
    playerPiece.style.boxShadow = "rgba(0, 0, 0, 0.8) 8px 8px 12px";
};

const applySelectedShadow = (space) => {
    const playerPiece = document.getElementById(space).firstChild;
    playerPiece.style.boxShadow = "rgba(255, 255, 255, 0.8) 0px 0px 10px 5px";
};

const selectPiece = (pieces, playerSpace) => {
    pieces.forEach(item => {
        if (item.space == playerSpace) {
            item.selected = true;
        }
    })
};

const getSelectedPieceCoords = (pieces) => {
    for (const item of pieces) {
        if (item.selected == true) {
            return item.space;
        }
    }
};

const getSelectedPiece = (pieces) => {
    for (const p of pieces) {
        if (p.selected) {
            return p;
        }
    }
}

// need to be updated to be able to parse through every piece on the board
const getPossibleActions = (currentPieceCoords, pieces, player) => {
    const currentPiece = getPieceObjectFromCoords(currentPieceCoords, pieces);
    let actionArray = [];

    // look through possible move coords to see if there are any pieces in those spaces
    const getMoves = () => {
        const coordsToCheck = getAdjacentCoordsToCheck(currentPieceCoords, player, currentPiece.promote);
        let moveArray = [];
        coordsToCheck.forEach(coords => {
            if (!getAllPieceCoords(pieces).includes(coords)) {
                moveArray.push(coords);
            }
        })
        return moveArray;
    };

    // get list of possible jumps
    const getJumps = () => {
        const coordsToCheck = getAdjacentCoordsToCheck(currentPieceCoords, player, currentPiece.promote);
        let jumpArray = [];
        coordsToCheck.forEach(coords => {
            const pieceObject = getPieceObjectFromCoords(coords, pieces);
            const checkJumpRow = (getRCNumbers(coords).row * 2) - getRCNumbers(currentPieceCoords).row;
            const checkJumpCol = (getRCNumbers(coords).col * 2) - getRCNumbers(currentPieceCoords).col;
            const checkJumpCoords = combineRCNumbers(checkJumpRow, checkJumpCol);
            if (getAllPieceCoords(pieces).includes(coords) && pieceObject.player != player) {
                if (!getAllPieceCoords(pieces).includes(checkJumpCoords) &&
                checkJumpRow > 0 && checkJumpCol > 0 && checkJumpCol < 9 && checkJumpRow < 9) {
                    jumpArray.push({"coords": checkJumpCoords, "kill": coords});
                }
            }
        })
        return jumpArray;
    };

    if (currentPiece.player == player) {
        getMoves().forEach(move => {
            actionArray.push({"coords": move, "kill": ""});
        })
        getJumps().forEach(jump => {
            actionArray.push({"coords": jump.coords, "kill": jump.kill});
        })
    }
    
    return actionArray;
};

const getAllPieceCoords = (pieces) => {
    let pieceCoords = [];
    pieces.forEach(item => pieceCoords.push(item.space));
    return pieceCoords;
}

const getRCNumbers = (coords) => {
    const row = Number(coords.charAt(1));
    const col = Number(coords.charAt(4));
    return {"row": row, "col": col};
};

const combineRCNumbers = (row, col) => {
    return `r${row}-c${col}`;
};

const getAdjacentCoordsToCheck = (currentCoords, player, isKing) => {
    let row = Number(currentCoords.charAt(1));
    let col = Number(currentCoords.charAt(4));
    let coordsToCheck = [];
    if (player == 1 || isKing) {
        if (col < 8 && row < 8) {
            coordsToCheck.push(`r${row + 1}-c${col + 1}`);
        }
        if (col > 1 && row < 8) {
            coordsToCheck.push(`r${row + 1}-c${col - 1}`);
        }
    } 
    if (player == 2 || isKing) {
        if (col < 8 && row > 1) {
            coordsToCheck.push(`r${row - 1}-c${col + 1}`);
        }
        if (col > 1 && row > 1) {
            coordsToCheck.push(`r${row - 1}-c${col - 1}`);
        }
    }
    return coordsToCheck;
}

const updatePiece = (pieces, originalLocation, updatedLocation) => {
    for (const p of pieces) {
        if (p.space == originalLocation) {
            p.space = updatedLocation;

            if (getRCNumbers(updatedLocation).row == 8 && p.player == 1) {
                p.promote = true;
            } else if (getRCNumbers(updatedLocation).row == 1 && p.player == 2) {
                p.promote = true;
            }
        }
    }
};

const getPieceFromCoords = (coords) => {
    return document.getElementById(coords);
};

const getPieceObjectFromCoords = (coords, pieces) => {
    for (const p of pieces) {
        if (p.space == coords) {
            return p;
        }
    }
    return 0;
};

const switchPlayer = (pieces, currentPlayer) => {
    if (currentPlayer % 2 == 0) {
        activePlayerEvents(pieces, 1);
        document.getElementById('turn-label').innerHTML = `Player 1's turn!`
    } else {
        activePlayerEvents(pieces, 2);
        document.getElementById('turn-label').innerHTML = `Player 2's turn!`
    }
};
