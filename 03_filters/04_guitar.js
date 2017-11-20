// https://github.com/mrahtz/javascript-karplus-strong
// karplus strong
// https://stackoverflow.com/questions/13153078/web-audio-karplus-strong-string-synthesis

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
		this.frequency = frequency;
		this.buffer = new Float32Array(0);
		this.head = 0;
		this.sampleRate = sampleRate;
		this.impulse = 0.01;
		this.time = 0;

		this.reset();
	}

	bindKeyboard() {
		var tone = this;
		keyboard(function on(key, freq) {
			if (freq) {
				tone.frequency = freq;
				tone.reset();
			}
		}, function off(key, freq) {})
	}

	createGui(gui) {
		var folder = gui.addFolder("biquad");
		folder.closed = false;

		// coefficients
		folder.add(this, "impulse", 0.01, 1).step(0.001).listen();
		folder.add(this, "frequency", 50, 880).step(0.1).listen();
	}
	reset() {
		this.imp = this.impulse * this.sampleRate;
		var n = Math.ceil(this.sampleRate / this.frequency);
		this.buffer = new Float32Array(n);
		this.head = 0;
	}

	process() {
		var xn = this.imp-- >= 0 ? randomRange(-1, 1) : 0;

		var head = this.head;
		var next = this.head + 1;
		if (next > this.buffer.length) next = 0;

		var sample = xn +
			this.buffer[head] * 0.5 +
			this.buffer[next] * 0.5;

		this.buffer[head] = sample;
		this.head = next;

		this.time += 1 / this.sampleRate;
		return sample;
	}
}

var tone = new Tone(220, 44100);
tone.bindKeyboard();
tone.createGui(gui);

var gain = 0;

function process(data, event, sampleRate) {
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