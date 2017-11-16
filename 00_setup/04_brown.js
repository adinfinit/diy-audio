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

var lastOutput = 0;

function process(data, event) {
	var gain = DecibelsToGain(control.decibel);

	for (var sample = 0; sample < data.length; sample++) {
		var white = random() * 2.0 - 1.0;
		var white = random() * 2.0 - 1.0;

		data[sample] = (lastOutput + (0.02 * white)) / 1.02;;
		lastOutput = data[sample];
		data[sample] *= 3.5;

		data[sample] *= gain;
	}
};

function draw(context, screenSize, deltaTime) {
	context.font = "30px monospace";
	var gain = DecibelsToGain(control.decibel);
	context.fillText("gain " + gain.toFixed(3), 50, 50);
}

defaultsetup(process, draw);