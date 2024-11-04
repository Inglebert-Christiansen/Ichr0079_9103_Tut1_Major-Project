// --- Global Variables ---
let circles = [];  // store circle pattern
let beads = [];  //  store the beads
let tinyBeads = [];  // store the bouncing tiny beads
let maxBead = 5000; // set max beads
let maxCircle = 1000; // set max circles
let maxTinyBeads = 200; // set max tiny beads

// --- Setup ---
function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);
  colorMode(HSB); // Set colour mode to HSB
  initialisePatterns(); // call function for the circles and the beads
  initialiseTinyBeads(); // call function for the tiny bouncing beads
}

// --- Initialize big circles and beads from the classes ---

// Learned about while loop from the coding train example
//https://thecodingtrain.com/tracks/code-programming-with-p5-js/code/4-loops/1-while-for

// Learned about circlepacking from happy coding
//https://happycoding.io/tutorials/p5js/creating-classes/circle-packing

//chatgpt was used to help troubleshoot the circle packing formula, since it initially would not run properly

// big circles
function initialisePatterns() {
  let attempts = 0; // starting point for generation
  
  // Use a while loop to keep creating circles until the maximum is reached
  while (attempts < maxCircle) { 
    let size = random(width * 0.05, width * 0.15); // Set random size relative to canvas width
    let x = random(size / 2, width - size / 2); // Random x position
    let y = random(size / 2, height - size / 2); // Random y position

    // Check for circle overlap
    let overlapping = false;
    for (let other of circles) {
      let d = dist(x, y, other.x, other.y); // calculates distance between the circles
      if (d < (size / 2 + other.size / 2)) { // checks for overlap based on combined radius
        overlapping = true;
        break;
      }
    }
    
    // keep adding circles until it overlaps
    if (!overlapping) {
      let baseHue = random(0, 360); // set base color
      circles.push(new CirclePattern(x, y, size, baseHue));
    }
    
    attempts++;
  }

  // Now for the beads!
  // Create small beads that avoid the main circles and each other
  attempts = 0;
  while (attempts < maxBead) { 
    let beadSize = random(width * 0.005, width * 0.02); // random bead size relative to canvas size
    let x = random(beadSize / 2, width - beadSize / 2); // random x position
    let y = random(beadSize / 2, height - beadSize / 2); // random y position

    // Check if the bead overlaps with any main circles or other beads
    let overlapping = false;
    for (let circle of circles) {
      let d = dist(x, y, circle.x, circle.y); // distance between bead and each main circle
      if (d < (beadSize / 2 + circle.size / 2)) {
        overlapping = true;
        break;
      }
    }
    for (let bead of beads) {
      let d = dist(x, y, bead.x, bead.y);
      if (d < (beadSize / 2 + bead.size / 2)) {
        overlapping = true;
        break;
      }
    }

    // Add bead to array if it doesn’t overlap
    if (!overlapping) {
      beads.push(new Bead(x, y, beadSize));
    }

    attempts++;
  }
}

// Initialize tiny bouncing beads
function initialiseTinyBeads() {
  for (let i = 0; i < maxTinyBeads; i++) {
    let size = random(5, 10); // Random size for tiny beads
    let x = random(width);
    let y = random(height);
    tinyBeads.push(new TinyBead(x, y, size));
  }
}

// --- Draw Function ---
function draw() {
  background(230, 100, 20); // Set background to a dark blue colour

  // Draw each tiny bead
  for (let tinyBead of tinyBeads) {
    tinyBead.move();
    tinyBead.display();
  }

  // Draw each bead
  for (let bead of beads) {
    bead.move(); // update bead position
    bead.display(); // display the beads
  }

  // Draw each circle
  for (let circle of circles) {
    circle.display(); // display the circles
  }
}

// --- CirclePattern Class ---
class CirclePattern {
  constructor(x, y, size, baseHue) {
    this.x = x; // x-coordinate
    this.y = y; // y-coordinate
    this.size = size; // Diameter of the main circle
    this.numLayers = int(random(3, 6)); //random number of layers
    this.baseHue = baseHue; // unique base hue for each circle
    this.hueShift = random(0.1, 0.5); // amount by which hue will gradually shift over time
    this.rotationDirection = random([-1, 1]); // Randomly choose -1 (counterclockwise) or 1 (clockwise)
    
    // took inspiration for the logic using behind Array.from with this link from MDN web docs  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from
    this.layerPatterns = Array.from({ length: this.numLayers }, (_, i) => i % 2 === 0); // Alternating pattern for each layer
    this.lastSwitchTime = millis(); // used millis to change the interval into miliseconds
    this.switchInterval = 3000; // Invert patterns every 3 seconds
  }

  //display the circles with alternating layers, inverting every few seconds
  display() {
    // Check if it's time to invert layer patterns
    if (millis() - this.lastSwitchTime > this.switchInterval) {
      this.layerPatterns = this.layerPatterns.map((pattern) => !pattern); // Invert each layer's pattern
      this.lastSwitchTime = millis(); // Reset the switch timer
    }

    push(); // Save transformation
    translate(this.x, this.y); // Move origin to centre of circle
    rotate(frameCount * 0.2 * this.rotationDirection); // Rotate in random direction

    // Gradually shift colour based on frameCount and the circle’s base hue
    let currentHue = (this.baseHue + frameCount * this.hueShift) % 360;

    // Draw each layer from outside to inside
    for (let i = this.numLayers; i > 0; i--) {
      let layerSize = (this.size / this.numLayers) * i;
      let col = color((currentHue + i * 20) % 360, 40, 60); // earthier tones with gradual shift

      // Use the alternating pattern for each layer
      if (this.layerPatterns[i - 1]) {
        this.drawDots(layerSize, col); // Draw dots on this layer
      } else {
        this.drawLines(layerSize, col); // Draw lines on this layer
      }
    }
    
    pop(); // Restore transformation
  }

// Chatgpt was used to calculate the distribution of lines and dots inside each layer using methods

  // method to draw dots around the circumference of each layer
  drawDots(size, col) {
    fill(col); // Set fill colour for base circle
    noStroke();
    ellipse(0, 0, size); // Draw the base circle

    let numDots = int(size / 5); // Number of dots based on layer size
    let dotRadius = size / 20; // Radius of each dot

    fill(255); // Set dot colour to white
    for (let i = 0; i < numDots; i++) {
      let angle = map(i, 0, numDots, 0, 360); // Distribute dots evenly in a circle
      let x = cos(angle) * size / 2.5; // x-coordinate for each dot
      let y = sin(angle) * size / 2.5; // y-coordinate for each dot
      ellipse(x, y, dotRadius); // Draw the dot
    }
  }

  // Method to draw lines from centre of circle
  drawLines(size, col) {
    stroke(col); // Set stroke colour
    strokeWeight(2);
    noFill();
    ellipse(0, 0, size); // Draw the base circle

    let numLines = int(size / 5); // Number of lines based on layer size
    for (let i = 0; i < numLines; i++) {
      let angle = map(i, 0, numLines, 0, 360); // use map to distribute lines evenly
      let x = cos(angle) * size / 2.5; // x coordinate endpoints
      let y = sin(angle) * size / 2.5; // y coordinate endpoints
      line(0, 0, x, y); // Draw line from centre to edge
    }
  }
}

// --- Bead Class ---
class Bead {
  constructor(x, y, size) {
    this.x = x; // x of bead centre
    this.y = y; // y of bead centre
    this.size = size; // diameter
    this.color = color(210, random(50, 100), 100); // set bead colour to blue shades
    this.vy = random(1, 2); // initial vertical velocity
  }

  // Move bead vertically and respawn at a random position if it moves out of canvas
  move() {
    this.y += this.vy;

    // Respawn at a random position within the canvas if the bead moves out of bounds
    if (this.y > height + this.size / 2 || this.y < -this.size / 2) {
      this.x = random(width); // random x position within canvas
      this.y = random(height); // random y position within canvas
    }
    
    // Chatgpt was used to help figure out how to avoid overlapping with circles by adjusting horizontal movement
    for (let circle of circles) {
      let d = dist(this.x, this.y, circle.x, circle.y);
      if (d < (this.size / 2 + circle.size / 2)) {
        // Adjust x position to the left or right to avoid overlap
        this.x += (this.x < circle.x) ? -1 : 1;
      }
    }
  }

 //display the bead
  display() {
    fill(this.color); // Set fill
    noStroke();
    ellipse(this.x, this.y, this.size); // draw the bead
  }
}

// --- TinyBead Class ---
class TinyBead {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color(210, random(50, 100), 100); // random shades of blue
    this.vx = random(-2, 2); // initial horizontal speed
    this.vy = random(-2, 2); // initial vertical speed
  }

  // make the beads bounce around
  move() {
    this.x += this.vx;
    this.y += this.vy;

    // Bounce off edges
    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
  }

  // Display the tiny bead
  display() {
    fill(this.color);
    noStroke();
    ellipse(this.x, this.y, this.size);
  }
}

// make the whole thing resizable and scalable
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  circles = []; // clear circles
  beads = []; // clear beads
  tinyBeads = []; // clear tiny beads
  initialisePatterns(); // regenerate patterns
  initialiseTinyBeads(); // regenerate tiny bouncing beads
}