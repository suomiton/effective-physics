const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 640;
canvas.height = 480;
document.body.appendChild(canvas);

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawParticle(particle) {
    ctx.fillStyle = 'rgba(255, 204, 0, 0.8)';
    ctx.fillRect(particle.x, particle.y, 4, 4);
}

function drawBlock(block) {
    ctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
    ctx.fillRect(block.x, block.y, block.size, block.size);
}

function render(particles, block) {
    clearCanvas();
    particles.forEach(drawParticle);
    drawBlock(block);
}

export { canvas, render };