"use strict";

// setup controls
var control = {
	decibel: -5,
	bandpass: {
		frequency: 880,
		bandwidth: 1,
	}
};
var gui = new dat.GUI();
gui.add(control, "decibel", -40, 0);

var folder = gui.addFolder("bandpass");
gui.add(control.bandpass, "frequency", 50, 4*440);
gui.add(control.bandpass, "bandwidth", 0.01, 16);

class BandPass {
	constructor(sampleRate, frequency, bandwidth) {
		this.in2 = 0.0;
		this.in1 = 0.0;
		this.out2 = 0.0;
		this.out1 = 0.0;
		this.setBandwidth(sampleRate, frequency, bandwidth);
	}

	setQ(sampleRate, frequency, q) {
		const w0 = 2 * Math.PI * frequency / sampleRate;
		const alpha = Math.sin(w0) / (2 * q) 

		this._set(w0, alpha);
	}

	// bandwidth is in octaves
	setBandwidth(sampleRate, frequency, bandwidth) {
		const w0 = 2 * Math.PI * frequency / sampleRate;
		const sinw0 = Math.sin(w0)
		const alpha = sinw0 * Math.sinh(0.5 * Math.LN2 * bandwidth * w0 / sinw0);

		this._set(w0, alpha);
	}

	_set(w0, alpha) {
		const filter = this;

		filter.a0 = 1.0 + alpha;
		filter.a1 = -2.0 * Math.cos(w0);
		filter.a2 = 1.0 - alpha;
		filter.b0 = alpha;
		// filter.b1 = 0.0;
		filter.b2 = -alpha;

		// filter.a0 /= filter.a0;
		filter.a1 /= filter.a0;
		filter.a2 /= filter.a0;
		filter.b0 /= filter.a0;
		// filter.b1 /= filter.a0;
		filter.b2 /= filter.a0;
	}

	apply(sample) {
		const filter = this;
		let output =
			filter.b0 * sample +
			// filter.b1 * filter.in1 +
			filter.b2 * filter.in2 +
			-filter.a1 * filter.out1 +
			-filter.a2 * filter.out2;

		filter.in2 = filter.in1;
		filter.in1 = sample;

		filter.out2 = filter.out1;
		filter.out1 = output;

		if(isNaN(sample) || isNaN(output)) {
			filter.in2 = 0;
			filter.in1 = 0;
			filter.out2 = 0;
			filter.out1 = 0;
			output = 0;
		}

		return output;
	}
}

var bandpass = new BandPass(44100, control.bandpass.frequency, control.bandpass.q);

function process(data, event) {
	var gain = decibelsToGain(control.decibel);
	bandpass.setBandwidth(SampleRate,
		control.bandpass.frequency,
		control.bandpass.bandwidth);

	for (var sample = 0; sample < data.length; sample++) {
		let s = random();
		data[sample] = bandpass.apply(gain * s);
	}
};



function draw(context, screenSize, deltaTime) {
	context.font = "30px monospace";
	var gain = decibelsToGain(control.decibel);
	context.fillText("gain " + gain.toFixed(3), 50, 50);
}


defaultsetup(process, draw);