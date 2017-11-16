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

function GainToDecibels(gain) {
	return 6 * log2(gain);
}

var phase = 0;

function process(data, event) {
	var gain = DecibelsToGain(control.decibel);
	for (var sample = 0; sample < data.length; sample++) {
		data[sample] = random() * 2 - 1;
		data[sample] *= gain * 0.5;

		// data[sample] += sin(phase += 0.0005) * 0.4;
	}
};

function draw(context, screenSize, deltaTime) {
	context.font = "30px monospace";
	var gain = DecibelsToGain(control.decibel);
	context.fillText("gain " + gain.toFixed(3), 50, 50);
}

defaultsetup(process, draw);