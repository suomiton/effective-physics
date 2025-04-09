function detectCollision(particle, block) {
    return particle.x < block.x + block.size &&
           particle.x + particle.size > block.x &&
           particle.y < block.y + block.size &&
           particle.y + particle.size > block.y;
}

function handleCollisions(particles, block) {
    for (let i = 0; i < particles.length; i++) {
        if (detectCollision(particles[i], block)) {
            // Simple collision response: stop the particle's downward movement
            particles[i].velocityY = 0;
            particles[i].y = block.y - particles[i].size; // Position it above the block
        }
    }
}

export { detectCollision, handleCollisions };