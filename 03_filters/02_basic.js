// https://creatingsound.com/2014/02/dsp-audio-programming-series-part-2/

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
		var tone = this;
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
		return saw(this.phase);
	}
}

class Basic {
	constructor(sampleRate) {
		this.enabled = true;
		this.combine = 0;
		this.subtract = 0;
		this.smooth = 0;
		this.gain = 1;
		this.time = 0;
		this.sampleRate = sampleRate;
	}

	bindKeyboard() {
		var filter = this;
		keyboard(function on(key, freq) {
			if (key == "q") filter.reset();
			if (key == "2") filter.enabled = !filter.enabled;
			if (key == "3") filter.randomize();
		}, function off(key, freq) {})
	}

	createGui(gui) {
		var folder = gui.addFolder("biquad");
		folder.closed = false;

		// coefficients
		folder.add(this, "enabled").listen();
		folder.add(this, "gain", 1, 3).step(0.01).listen();
		folder.add(this, "combine", -1, 1).step(0.01).listen();
		folder.add(this, "subtract", -1, 1).step(0.01).listen();
	}
	reset() {
		this.smooth = 0;
	}

	randomize() {
		this.reset();
		this.combine = randomRange(-1, 1);
		this.subtract = randomRange(-1, 1);
	}

	process(sample) {
		if (!this.enabled) return sample;

		var next = this.smooth * this.combine +
			sample * (1 - this.combine);

		if (!Number.isFinite(next)) next = 0;
		this.smooth = next;

		this.time += 1 / this.sampleRate;
		var result = next * (1 - this.subtract) - sample * this.subtract;
		return result * this.gain;
	}
}

var tone = new Tone(220, 44100);
gui.add(tone, "noise").listen();
tone.bindKeyboard();

var filter = new Basic(44100);
filter.bindKeyboard();
filter.createGui(gui);

var gain = 0;

function process(data, event, sampleRate) {
	var targetGain = decibelsToGain(control.decibel);
	for (var sample = 0; sample < data.length; sample++) {
		data[sample] = tone.process();
		data[sample] = filter.process(data[sample]);
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