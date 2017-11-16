"use strict";

// setup controls
var control = {
	gain: 0.5
};
var gui = new dat.GUI();
gui.add(control, "gain", 0, 1);

function process(data, event) {
	var gain = control.gain;
	for (var sample = 0; sample < data.length; sample++) {
		data[sample] = random() * 2 - 1;
		data[sample] *= gain;
	}
};

function draw(context, screenSize, deltaTime) {
	context.font = "30px monospace";
	var gain = control.gain;
	context.fillText("gain " + gain.toFixed(3), 50, 50);
}

defaultsetup(process, draw);