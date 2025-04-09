class Block {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.isDragging = false;
    }

    draw(ctx) {
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.x, this.y, this.size, this.size);
    }

    startDrag(mouseX, mouseY) {
        if (mouseX >= this.x && mouseX <= this.x + this.size &&
            mouseY >= this.y && mouseY <= this.y + this.size) {
            this.isDragging = true;
        }
    }

    drag(mouseX, mouseY) {
        if (this.isDragging) {
            this.x = mouseX - this.size / 2;
            this.y = mouseY - this.size / 2;
        }
    }

    endDrag() {
        this.isDragging = false;
    }
}