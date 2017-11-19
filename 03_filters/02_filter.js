// https://creatingsound.com/2014/02/dsp-audio-programming-series-part-2/

// high-pass filter -- subtract
// low-pass filter -- average
// band-pass filter -- combine

"use strict";

// setup controls
var control = {
	decibel: -5,
	frequency: 440,
	ratio: 0.5,
	delay: 64
};
var gui = new dat.GUI();
gui.add(control, "decibel", -40, 0);
gui.add(control, "frequency", 110, 880 * 2).listen();
gui.add(control, "ratio", 0, 1).step(0.01).listen();
gui.add(control, "delay", 1, 16 << 10).step(1).listen();

class Biquad {
	constructor(maxDelay) {
		this.ratio = 0.4;
		this.head = 0;
		this.delay = maxDelay;
		this.data = new Float32Array(maxDelay);
		for (var i = 0; i < maxDelay; i++) {
			this.data[i] = 0.0;
		}
	}

	process(sample) {
		var previousHead = this.head - this.delay;
		while (previousHead < 0) {
			previousHead += this.data.length;
		}

		this.data[this.head] =
			this.data[previousHead] * this.ratio +
			sample * (1 - this.ratio);
		this.head++;
		if (this.head >= this.data.length)
			this.head = 0;
		return this.data[this.head];
	}
}

var phase = 0;
var delay = new Delay(16 << 10);

keyboard(function on(key, freq) {
	if (freq) {
		control.frequency = freq;
	}
}, function off(key, freq) {})

function process(data, event, sampleRate) {
	delay.ratio = control.ratio;
	delay.delay = control.delay;

	var secondsPerSample = 1.0 / sampleRate;

	var gain = decibelsToGain(control.decibel);
	var frequency = control.frequency;
	var advance = timeToPhase(1.0 / sampleRate, frequency);

	for (var sample = 0; sample < data.length; sample++) {
		data[sample] = sin(phase) * gain;
		data[sample] = delay.process(data[sample]);
		phase += advance;
	}
};

function draw(context, screenSize, deltaTime) {
	context.font = "30px monospace";
	var gain = decibelsToGain(control.decibel);
	context.fillText("gain  " + gain.toFixed(3), 50, 50);
	context.fillText("phase " + phase.toFixed(3), 50, 100);
}

defaultsetup(process, draw);