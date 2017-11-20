// https://creatingsound.com/2014/02/dsp-audio-programming-series-part-2/

// high-pass filter -- subtract
// low-pass filter -- average
// band-pass filter -- combine

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

class Biquad {
	constructor(maxDelay) {
		this.enabled = true;

		// initial values
		this.x1 = 0;
		this.x2 = 0;
		this.y1 = 0;
		this.y2 = 0;

		// coefficients
		this.b0 = 1;
		this.b1 = 0.5;
		this.b2 = 0.25;

		this.a1 = 0.1;
		this.a2 = 0.05;
	}

	bindKeyboard() {
		var biquad = this;
		keyboard(function on(key, freq) {
			if (key == "q") biquad.reset();
			if (key == "2") biquad.enabled = !biquad.enabled;
			if (key == "3") biquad.randomize();
			if (key == "4") {
				biquad.setLowpassParams(randomRange(0, 0.25), randomRange(0, 1));
			}
		}, function off(key, freq) {})
	}
	createGui(gui) {
		var folder = gui.addFolder("biquad");
		folder.closed = false;

		// coefficients
		folder.add(this, "enabled").listen();
		folder.add(this, "b0", -5, 5).step(0.01).listen();
		folder.add(this, "b1", -5, 5).step(0.01).listen();
		folder.add(this, "b2", -5, 5).step(0.01).listen();
		folder.add(this, "a1", -5, 5).step(0.01).listen();
		folder.add(this, "a2", -5, 5).step(0.01).listen();
	}
	reset() {
		this.x1 = 0;
		this.x2 = 0;
		this.y1 = 0;
		this.y2 = 0;
		this.y2 = 0;
	}

	randomize() {
		this.b0 = randomRange(-1, 1);
		this.b1 = randomRange(-1, 1);
		this.b2 = randomRange(-1, 1);

		this.a1 = randomRange(-1, 1);
		this.a2 = randomRange(-1, 1);

		this.reset();
	}

	setNormalizedCoefficients(b0, b1, b2, a0, a1, a2) {
		var a0Inverse = 1 / a0;

		this.b0 = b0 * a0Inverse;
		this.b1 = b1 * a0Inverse;
		this.b2 = b2 * a0Inverse;
		this.a1 = a1 * a0Inverse;
		this.a2 = a2 * a0Inverse;
	}

	// https://github.com/audiojs/audio-biquad/blob/master/index.js#L149
	setLowpassParams(cutoff, resonance) {
		// Limit cutoff to 0 to 1.
		cutoff = Math.max(0.0, Math.min(cutoff, 1.0));

		if (cutoff == 1) {
			// When cutoff is 1, the z-transform is 1.
			this.setNormalizedCoefficients(1, 0, 0,
				1, 0, 0);
		} else if (cutoff > 0) {
			// Compute biquad coefficients for lowpass filter
			resonance = Math.max(0.0, resonance); // can't go negative
			var g = Math.pow(10.0, 0.05 * resonance);
			var d = Math.sqrt((4 - Math.sqrt(16 - 16 / (g * g))) / 2);

			var theta = Math.PI * cutoff;
			var sn = 0.5 * d * Math.sin(theta);
			var beta = 0.5 * (1 - sn) / (1 + sn);
			var gamma = (0.5 + beta) * Math.cos(theta);
			var alpha = 0.25 * (0.5 + beta - gamma);

			var b0 = 2 * alpha;
			var b1 = 2 * 2 * alpha;
			var b2 = 2 * alpha;
			var a1 = 2 * -gamma;
			var a2 = 2 * beta;

			this.setNormalizedCoefficients(b0, b1, b2, 1, a1, a2);
		} else {
			// When cutoff is zero, nothing gets through the filter, so set
			// coefficients up correctly.
			this.setNormalizedCoefficients(0, 0, 0,
				1, 0, 0);
		}
	}

	process(sample) {
		if (!this.enabled) return sample;

		var y = 0 +
			this.b0 * sample +
			this.b1 * this.x1 +
			this.b2 * this.x2 +
			-this.a1 * this.y1 +
			-this.a2 * this.y2;

		if (!Number.isFinite(y)) y = 0;

		this.x2 = this.x1;
		this.x1 = sample;

		this.y2 = this.y1;
		this.y1 = y;


		return y;
	}
}

var tone = new Tone(220, 44100);
gui.add(tone, "noise").listen();
tone.bindKeyboard();

var filter = new Biquad();
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

	var y = 50;
	context.fillText("x1  " + filter.x1.toFixed(3), 50, y += 50);
	context.fillText("x2  " + filter.x2.toFixed(3), 50, y += 50);
	context.fillText("y1  " + filter.y1.toFixed(3), 50, y += 50);
	context.fillText("y1  " + filter.y2.toFixed(3), 50, y += 50);
}

defaultsetup(process, draw);