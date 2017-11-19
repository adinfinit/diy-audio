"use strict";

// setup controls
var control = {
	decibel: -5
};
var gui = new dat.GUI();
gui.add(control, "decibel", -40, 0);

class Tone {
	constructor(frequency, sampleRate) {
		this.noise = false;
		this.phase = 0;
		this.frequency = frequency;
		this.sampleRate = sampleRate;
	}

	bindKeyboard() {
		keyboard(function on(key, freq) {
			if (freq) tone.frequency = freq;
			if (key == "1") tone.noise = !tone.noise;
		}, function off(key, freq) {})
	}

	process(sample) {
		if (this.noise) return noise();
		var frequency = this.frequency +
			2 * sin(this.phase * 0.03);
		this.phase += timeToPhase(1.0 / this.sampleRate, frequency);
		return sin(this.phase);
	}
}

var tone = new Tone(220, 44100);
tone.bindKeyboard();
gui.add(tone, "noise").listen();

var gain = 0;

function process(data, eventa, sampleRate) {
	var targetGain = decibelsToGain(control.decibel);
	for (var sample = 0; sample < data.length; sample++) {
		data[sample] = tone.process();
		data[sample] *= gain;
		// avoid start clicking
		gain = lerp(gain, targetGain, 0.01);
	}
};

function draw(context, screenSize, deltaTime) {
	context.font = "30px monospace";
	var gain = decibelsToGain(control.decibel);
	context.fillText("gain  " + gain.toFixed(3), 50, 50);
}

defaultsetup(process, draw);