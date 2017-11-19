"use strict";

// setup controls
var control = {
	decibel: -5,
	frequency: 440
};
var gui = new dat.GUI();
gui.add(control, "decibel", -40, 0);
gui.add(control, "frequency", 10, 880).listen();

var phase = 0;

function process(data, event, sampleRate) {
	var secondsPerSample = 1.0 / sampleRate;

	var gain = decibelsToGain(control.decibel);
	var multiplier = control.multiplier;
	var frequency = control.frequency;
	var advance = timeToPhase(1.0 / sampleRate, frequency);

	for (var sample = 0; sample < data.length; sample++) {
		data[sample] = sin(phase) * gain;
		phase += advance;
	}
};

keyboard(function on(key, freq) {
	if (freq) {
		control.frequency = freq;
	}
}, function off(key, freq) {})

function draw(context, screenSize, deltaTime) {
	context.font = "30px monospace";
	var gain = decibelsToGain(control.decibel);
	context.fillText("gain  " + gain.toFixed(3), 50, 50);
	context.fillText("phase " + phase.toFixed(3), 50, 100);
}

defaultsetup(process, draw);