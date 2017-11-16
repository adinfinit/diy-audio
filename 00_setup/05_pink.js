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

function process(data, event) {
	var b0, b1, b2, b3, b4, b5, b6;
	b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;

	var gain = DecibelsToGain(control.decibel);

	for (var sample = 0; sample < data.length; sample++) {
		var white = random() * 2.0 - 1.0;
		b0 = 0.99886 * b0 + white * 0.0555179;
		b1 = 0.99332 * b1 + white * 0.0750759;
		b2 = 0.96900 * b2 + white * 0.1538520;
		b3 = 0.86650 * b3 + white * 0.3104856;
		b4 = 0.55000 * b4 + white * 0.5329522;
		b5 = -0.7616 * b5 - white * 0.0168980;

		data[sample] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
		b6 = white * 0.115926
		data[sample] *= gain * 0.11; // compensate for function
	}
};

function draw(context, screenSize, deltaTime) {
	context.font = "30px monospace";
	var gain = DecibelsToGain(control.decibel);
	context.fillText("gain " + gain.toFixed(3), 50, 50);
}

defaultsetup(process, draw);