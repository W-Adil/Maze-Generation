import React, { useState } from 'react';
import './App.css';
import home from './home.png';
import key from './key.png';

const App = () => {
    const [maze, setMaze] = useState([]);
    const [mazeRows, setMazeRows] = useState(10); 
    const [mazeCols, setMazeCols] = useState(10); 
    const [numMoves, setNumMoves] = useState(null);


    const Cell = ({ cell }) => {
        const classes = `maze-cell 
                         ${cell.walls.top ? 'top-wall' : ''} 
                         ${cell.walls.right ? 'right-wall' : ''} 
                         ${cell.walls.bottom ? 'bottom-wall' : ''} 
                         ${cell.walls.left ? 'left-wall' : ''}
                         ${cell.isPath ? 'path' : ''}
                         ${cell.isVisited ? 'visited' : ''}`;
        return <div className={classes}></div>;
    };

    const generateMaze = (rows, cols) => {
        let initialMaze = [];
        for (let row = 0; row < rows; row++) {
            let mazeRow = [];
            for (let col = 0; col < cols; col++) {
                mazeRow.push({ 
                    row, 
                    col, 
                    walls: { top: true, right: true, bottom: true, left: true }, 
                    visited: false 
                });
            }
            initialMaze.push(mazeRow);
        }

        generateMazeDFS(initialMaze, 0, 0, rows, cols);
        setMaze(initialMaze);
    };

    const generateMazeDFS = (maze, row, col, rows, cols) => {
        const directions = ['top', 'right', 'bottom', 'left'];
        shuffleArray(directions);
    
        const cell = maze[row][col];
        cell.visited = true;
    
        for (const direction of directions) {
            const [nextRow, nextCol] = getNextCell(row, col, direction);
    
            if (nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols && !maze[nextRow][nextCol].visited) {
                removeWalls(cell, maze[nextRow][nextCol], direction);
                generateMazeDFS(maze, nextRow, nextCol, rows, cols);
            }
        }
    };

    const getNextCell = (row, col, direction) => {
        switch (direction) {
            case 'top': return [row - 1, col];
            case 'right': return [row, col + 1];
            case 'bottom': return [row + 1, col];
            case 'left': return [row, col - 1];
            default: return [row, col];
        }
    };

    const removeWalls = (cell1, cell2, direction) => {
        switch (direction) {
            case 'top':
                cell1.walls.top = false;
                cell2.walls.bottom = false;
                break;
            case 'right':
                cell1.walls.right = false;
                cell2.walls.left = false;
                break;
            case 'bottom':
                cell1.walls.bottom = false;
                cell2.walls.top = false;
                break;
            case 'left':
                cell1.walls.left = false;
                cell2.walls.right = false;
                break;
        }
    };

    const shuffleArray = (array) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    };

    const resetAndGenerateMaze = (rows, cols) => {
        setMazeRows(rows);
        setMazeCols(cols);
        generateMaze(rows, cols); 
    };
  
    const visualizeStep = (newMaze, delay) => {
        return new Promise(resolve => {
            setTimeout(() => {
                setMaze([...newMaze]);
                resolve();
            }, delay);
        });
    };


    const solveMazeBFS = async () => {
        const newMaze = maze.map(row => row.map(cell => ({ ...cell, isPath: false, isVisited: false })));
        setMaze(newMaze);

        const start = { row: mazeRows-1, col: 0 };
        const end = { row: 0, col: mazeCols-1 };
        const queue = [start];
        const visited = new Set([`${start.row}-${start.col}`]);
        const prev = new Map();

        while (queue.length > 0) {
            const { row, col } = queue.shift();
            newMaze[row][col].isVisited = true;

            if (row === end.row && col === end.col) {
                await visualizeStep(newMaze, 50); 
                reconstructPath(prev, end, newMaze);
                return;
            }

            getNeighbors(row, col, newMaze).forEach(neighbor => {
                const [nRow, nCol] = neighbor;
                const key = `${nRow}-${nCol}`;
                if (!visited.has(key)) {
                    queue.push({ row: nRow, col: nCol });
                    visited.add(key);
                    prev.set(key, { row, col });
                }
            });

            await visualizeStep(newMaze, 50); 
        }

        return null; 
    };

    const getNeighbors = (row, col) => {
        const neighbors = [];
        if (row > 0 && !maze[row][col].walls.top) neighbors.push([row - 1, col]);
        if (row < mazeRows - 1 && !maze[row][col].walls.bottom) neighbors.push([row + 1, col]);
        if (col > 0 && !maze[row][col].walls.left) neighbors.push([row, col - 1]);
        if (col < mazeCols - 1 && !maze[row][col].walls.right) neighbors.push([row, col + 1]);
        return neighbors;
    };

    const reconstructPath = (prev, end) => {
        const path = [];
        let current = `${end.row}-${end.col}`;
        while (prev.has(current)) {
            const [row, col] = current.split('-').map(Number);
            maze[row][col].isPath = true;
            path.unshift(current);
            current = prev.get(current);
            current = `${current.row}-${current.col}`;
        }
        setMaze([...maze]);

        setNumMoves(path.length); 
        return path;
    };


    const manhattanDistance = (point1, point2) => {
        return Math.abs(point1.row - point2.row) + Math.abs(point1.col - point2.col);
    };

    class PriorityQueue {
        constructor() {
            this.items = [];
        }
    
        enqueue(item, priority) {
            const queueElement = { item, priority }; 
            let added = false;
    
            for (let i = 0; i < this.items.length; i++) {
                if (queueElement.priority < this.items[i].priority) {
                    this.items.splice(i, 0, queueElement);
                    added = true;
                    break;
                }
            }
    
            if (!added) {
                this.items.push(queueElement);
            }
        }
    
        dequeue() {
            return this.items.shift().item;
        }
    
        isEmpty() {
            return this.items.length === 0;
        }
    }

    const solveMazeAStar = async () => {
        const newMaze = maze.map(row => row.map(cell => ({ ...cell, isPath: false, isVisited: false })));
        setMaze(newMaze);

        const start = { row: mazeRows-1, col: 0 };
        const goal = { row: 0, col: mazeCols - 1 };
        const openSet = new PriorityQueue();
        const cameFrom = new Map();
        const gScore = new Map();  
        const fScore = new Map();  
        gScore.set(`${start.row}-${start.col}`, 0);
        fScore.set(`${start.row}-${start.col}`, manhattanDistance(start, goal));
        openSet.enqueue(start, fScore.get(`${start.row}-${start.col}`));
    
        while (!openSet.isEmpty()) {
            const current = openSet.dequeue();
            
            if (newMaze[current.row] && newMaze[current.row][current.col]){
                if (current.row === goal.row && current.col === goal.col) {
                    await reconstructPathAstar(cameFrom, goal,newMaze,start);
                    return;
                }

                newMaze[current.row][current.col].isVisited = true;
                await visualizeStep(newMaze,50);
        
                for (const neighbor of getNeighborsAstar(current.row, current.col, maze)) {
                    const tentativeGScore = gScore.get(`${current.row}-${current.col}`) + 1;
                    const neighborKey = `${neighbor.row}-${neighbor.col}`;
        
                    if (tentativeGScore < (gScore.get(neighborKey) || Infinity)) {
                        cameFrom.set(neighborKey, current);
                        gScore.set(neighborKey, tentativeGScore);
                        fScore.set(neighborKey, tentativeGScore + manhattanDistance(neighbor, goal));
        
                        if (!openSet.items.find(element => element.item.row === neighbor.row && element.item.col === neighbor.col)) {
                            openSet.enqueue(neighbor, fScore.get(neighborKey));
                        }
                    }
                }
            }
        }
    
        return null 
    };

    const reconstructPathAstar = async (cameFrom, end, maze, start) => {
        let current = end;
        let moves=0;
        while (true) {
            maze[current.row][current.col].isPath = true; 
            await visualizeStep(maze);  
            moves++;

            if (current.row === start.row && current.col === start.col) {
                break; 
            }
    
            current = cameFrom.get(`${current.row}-${current.col}`); 
        }
        setNumMoves(moves-1);
    };

    const getNeighborsAstar = (row, col) => {
        const neighbors = [];
        if (row > 0 && !maze[row][col].walls.top) {
            neighbors.push({ row: row - 1, col: col });
        }
    
        if (row < mazeRows - 1 && !maze[row][col].walls.bottom) {
            neighbors.push({ row: row + 1, col: col });
        }

        if (col > 0 && !maze[row][col].walls.left) {
            neighbors.push({ row: row, col: col - 1 });
        }

        if (col < mazeCols - 1 && !maze[row][col].walls.right) {
            neighbors.push({ row: row, col: col + 1 });
        }
    
    
        return neighbors;
    };
    
    const solveMazemode = (mode) => {
        if (mode === 'bfs') {
            solveMazeBFS(); 
        } else if (mode === 'astar') {
            solveMazeAStar(); 
        }
    };


    return (
        <div className='maze_generation'>
            <div className="buttons">
            <button onClick={() => resetAndGenerateMaze(10, 10)}>Easy</button>
            <button onClick={() => resetAndGenerateMaze(10, 15)}>Medium</button>
            <button onClick={() => resetAndGenerateMaze(10, 20)}>Hard</button>
            <button onClick={() => solveMazemode('bfs')}>Solve with BFS</button>
            <button onClick={() => solveMazemode('astar')}>Solve with A*</button>
            </div>
            <div className='maze'>
                <div className='key_image'>
                <img src={key} alt='key'/>
                </div>
                <div id="maze-container" style={{ display: 'grid', gridTemplateColumns: `repeat(${mazeCols}, 20px)` }}>
                {maze.map((row, rowIndex) => row.map((cell, colIndex) => <Cell key={`${rowIndex}-${colIndex}`} cell={cell} />))}
                </div>
                <div className='home_image'>
                <img src={home} alt='home'/>
                </div>
            </div>
            {numMoves !== null && <div className="moves-info">Number of moves to reach the goal: {numMoves}</div>}
        </div>
    );

};

export default App;
