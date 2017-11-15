"use strict";

// http://workshop.chromeexperiments.com/examples/gui/

var someRandomValue = 10;

var control = {
	volume: 0.3,
	release: 1.0,
	filtered: false,
	synth: "saw",
	randomize: function() {
		someRandomValue = Math.random();
	}
};

var gui = new dat.GUI();
gui.add(control, "volume", 0, 1);
gui.add(control, "release", 0, 5);
gui.add(control, "synth", ["sin", "saw", "noise"]);
gui.add(control, "filtered");
gui.add(control, "randomize");

var folder = gui.addFolder("folder");
folder.add(control, "volume", 0, 1);
folder.add(control, "release", 0, 5);

visualize(null, function(context, screenSize, deltaTime) {
	context.font = "40px monospace";
	var y = 50,
		h = 50;
	context.fillText(control.volume, 50, y += h);
	context.fillText(control.release, 50, y += h);
	context.fillText(control.filtered, 50, y += h);
	context.fillText(control.synth, 50, y += h);
	context.fillText(someRandomValue, 50, y += h);
});