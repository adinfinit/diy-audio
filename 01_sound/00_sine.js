"use strict";

// setup controls
var control = {
	decibel: -5
};
var gui = new dat.GUI();
gui.add(control, "decibel", -40, 0);

var time = 0;

function process(data, event, sampleRate) {
	var secondsPerSample = 1.0 / sampleRate;

	var gain = decibelsToGain(control.decibel);
	var multiplier = control.multiplier;

	for (var sample = 0; sample < data.length; sample++) {
		data[sample] = sin(time * 440) * gain;
		time += secondsPerSample;
	}
};

function draw(context, screenSize, deltaTime) {
	context.font = "30px monospace";
	var gain = decibelsToGain(control.decibel);
	context.fillText("gain " + gain.toFixed(3), 50, 50);
	context.fillText("time " + time.toFixed(3), 50, 100);
}

defaultsetup(process, draw);