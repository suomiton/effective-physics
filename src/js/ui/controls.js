const dropButton = document.getElementById('drop-sand-button');

dropButton.addEventListener('click', () => {
    // Trigger the drop sand action in the simulation
    window.simulation.dropSand();
});