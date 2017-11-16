"use strict";

// setup controls
var control = {
	decibel: -5,
	frequency: 440
};
var gui = new dat.GUI();
gui.add(control, "decibel", -40, 0);
gui.add(control, "frequency", 110, 880);

function DecibelsToGain(decibel) {
	return pow(2.0, decibel / 6.0);
}

function timeToPhase(time, hz) {
	return time * hz * 2 * PI;
}

function phaseAdvance(sampleRate, hz) {
	return timeToPhase(1.0 / sampleRate, hz);
}

var phase = 0;

function process(data, event, sampleRate) {
	var secondsPerSample = 1.0 / sampleRate;

	var gain = DecibelsToGain(control.decibel);
	var multiplier = control.multiplier;
	var frequency = control.frequency;
	var advance = phaseAdvance(sampleRate, frequency);

	for (var sample = 0; sample < data.length; sample++) {
		data[sample] = sin(phase) * gain;
		phase += advance;
	}
};

function draw(context, screenSize, deltaTime) {
	context.font = "30px monospace";
	var gain = DecibelsToGain(control.decibel);
	context.fillText("gain  " + gain.toFixed(3), 50, 50);
	context.fillText("phase " + phase.toFixed(3), 50, 100);
}

defaultsetup(process, draw);