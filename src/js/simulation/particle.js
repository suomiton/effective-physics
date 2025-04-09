class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 4; // Size of the sand particle
        this.velocityY = 0; // Vertical velocity
        this.gravity = 0.1; // Gravity effect
    }

    update() {
        this.velocityY += this.gravity; // Apply gravity
        this.y += this.velocityY; // Update position

        // Check for ground collision
        if (this.y + this.size > 480) {
            this.y = 480 - this.size; // Reset position to ground level
            this.velocityY *= -0.5; // Bounce effect
        }
    }

    render(ctx) {
        ctx.fillStyle = 'sandybrown'; // Color of the sand particle
        ctx.fillRect(this.x, this.y, this.size, this.size); // Draw the particle
    }
}