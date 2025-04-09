const canvas = document.getElementById('simulationCanvas');
const ctx = canvas.getContext('2d');
const block = { x: 300, y: 400, size: 50, isDragging: false };

canvas.addEventListener('mousedown', (event) => {
    const mousePos = getMousePos(canvas, event);
    if (isInsideBlock(mousePos)) {
        block.isDragging = true;
    }
});

canvas.addEventListener('mouseup', () => {
    block.isDragging = false;
});

canvas.addEventListener('mousemove', (event) => {
    if (block.isDragging) {
        const mousePos = getMousePos(canvas, event);
        block.x = mousePos.x - block.size / 2;
        block.y = mousePos.y - block.size / 2;
    }
});

function getMousePos(canvas, event) {
    const rect = canvas.getBoundingClientRect();
    return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
    };
}

function isInsideBlock(mousePos) {
    return (
        mousePos.x > block.x &&
        mousePos.x < block.x + block.size &&
        mousePos.y > block.y &&
        mousePos.y < block.y + block.size
    );
}