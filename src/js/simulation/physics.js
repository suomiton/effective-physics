function applyGravity(particles) {
    particles.forEach(particle => {
        particle.velocity.y += 0.1; // Gravity effect
    });
}

function updateParticles(particles) {
    particles.forEach(particle => {
        particle.position.x += particle.velocity.x;
        particle.position.y += particle.velocity.y;

        // Check for ground collision
        if (particle.position.y >= 480) {
            particle.position.y = 480;
            particle.velocity.y = 0; // Stop falling
        }
    });
}

function resolveCollisions(particles) {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[j].position.x - particles[i].position.x;
            const dy = particles[j].position.y - particles[i].position.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 2) { // Assuming particles have a radius of 1
                const angle = Math.atan2(dy, dx);
                const targetX = particles[i].position.x + Math.cos(angle) * 2;
                const targetY = particles[i].position.y + Math.sin(angle) * 2;
                const ax = (targetX - particles[j].position.x) * 0.5;
                const ay = (targetY - particles[j].position.y) * 0.5;

                particles[i].velocity.x -= ax;
                particles[i].velocity.y -= ay;
                particles[j].velocity.x += ax;
                particles[j].velocity.y += ay;
            }
        }
    }
}

export { applyGravity, updateParticles, resolveCollisions };