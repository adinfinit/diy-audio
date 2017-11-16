"use strict";

// setup controls
var control = {
	decibel: -5
};
var gui = new dat.GUI();
gui.add(control, "decibel", -40, 0);

function DecibelsToGain(decibel) {
	return pow(2.0, decibel / 6.0);
}

var time = 0;

function process(data, event, sampleRate) {
	var secondsPerSample = 1.0 / sampleRate;

	var gain = DecibelsToGain(control.decibel);
	var multiplier = control.multiplier;

	for (var sample = 0; sample < data.length; sample++) {
		data[sample] = sin(time * 440) * gain;
		time += secondsPerSample;
	}
};

function draw(context, screenSize, deltaTime) {
	context.font = "30px monospace";
	var gain = DecibelsToGain(control.decibel);
	context.fillText("gain " + gain.toFixed(3), 50, 50);
	context.fillText("time " + time.toFixed(3), 50, 100);
}

defaultsetup(process, draw);