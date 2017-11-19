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
		return sin(this.phase);
	}
}

class Delay {
	constructor(delay, maxDelay) {
		this.enabled = true;
		this.ratio = 0.4;
		this.head = 0;
		this.delay = delay;
		this.data = new Float32Array(maxDelay);
		for (var i = 0; i < maxDelay; i++) {
			this.data[i] = 0.0;
		}
	}

	bindKeyboard() {
		var delay = this;
		keyboard(function on(key, freq) {
			if (key == "2") delay.enabled = !delay.enabled;
		}, function off(key, freq) {})
	}

	process(sample) {
		if (!this.enabled) return sample;

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

var tone = new Tone(220, 44100);
gui.add(tone, "noise").listen();
tone.bindKeyboard();

var delay = new Delay(8 << 10, 16 << 10);
delay.bindKeyboard();

var delayFolder = gui.addFolder("delay");
delayFolder.closed = false;
delayFolder.add(delay, "enabled").listen();
delayFolder.add(delay, "ratio", 0, 1).step(0.01).listen();
delayFolder.add(delay, "delay", 1, 16 << 10).step(1).listen();

var gain = 0;

function process(data, event, sampleRate) {
	var targetGain = decibelsToGain(control.decibel);
	for (var sample = 0; sample < data.length; sample++) {
		data[sample] = tone.process();
		data[sample] = delay.process(data[sample]);
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