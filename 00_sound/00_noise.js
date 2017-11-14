"use strict";

var audioContext = new AudioContext();

var bufferSize = 1024; // 256, 512, 1024, 2048, 4096, 8192, 16384
var channelCount = 1;

var node = audioContext.createScriptProcessor(bufferSize, 0, channelCount);
node.onaudioprocess = function(event) {
	var data = event.outputBuffer.getChannelData(0);
	for (var sample = 0; sample < data.length; sample++) {
		data[sample] = Math.random() * 2.0 - 1.0;
	}
}

node.connect(audioContext.destination);


var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");

// set canvas size to the correct size
var screenWidth = 0;
var screenHeight = 0;
window.onresize = function(e) {
	screenWidth = window.innerWidth;
	screenHeight = window.innerHeight;

	canvas.width = screenWidth;
	canvas.height = screenHeight;
};

// update the variables
window.onresize();

function update(deltaTime) {
	context.clearRect(0, 0, screenWidth, screenHeight);
	context.font = "40px monospace";
	context.fillText(now().toFixed(3), 100, 100);
	context.fillText(deltaTime.toFixed(3), 100, 200);
	context.fillText((1 / deltaTime).toFixed(3), 100, 300);
}

// setup timing loop
var lastTime = 0;

function tick() {
	requestAnimationFrame(tick);

	var currentTime = now();
	update(currentTime - lastTime);
	lastTime = currentTime;
}
tick();