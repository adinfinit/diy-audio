"use strict";

// setup controls
var control = {
	decibel: -10
};
var gui = new dat.GUI();
gui.add(control, "decibel", -40, 0);

function noteFrequency(tonic, index) {
	return tonic * Math.pow(2, index / 12);
}

class Tone {
	constructor(frequency, sampleRate, modifier) {
		this.phase = 0;
		this.frequency = frequency;
		this.frequencySlide = 0;

		if (modifier == ".") this.frequencySlide = -0.01;
		if (modifier == "^") this.frequencySlide = +0.01;

		this.sampleRate = sampleRate;
		this.attack = 0.01;
		this.release = 0.5;
		this.time = 0;
	}

	osc(phase) {
		return sin(this.phase);
	}

	process() {
		var frequency = this.frequency + 2 * sin(this.phase * 0.03);
		// this.frequency *= pow(2, 0.0001);
		this.phase += timeToPhase(1.0 / this.sampleRate, frequency);
		this.frequency += this.frequencySlide;

		this.time += 1 / this.sampleRate;
		var env = envelope(this.time, this.attack, this.release);
		return this.osc(this.phase) * env;
	}

	active() {
		return this.time <= this.attack + this.release;
	}
}

class Sin extends Tone {
	osc(phase) {
		return sin(this.phase);
	}
}

class Saw extends Tone {
	osc(phase) {
		return saw(this.phase);
	}
}

class Square extends Tone {
	osc(phase) {
		return square(this.phase);
	}
}

const SCALE = [
	'a', 'a#', 'b', 'c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#',
	'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'
];

class Tracker {
	constructor(song, instruments, sampleRate) {
		this.sampleRate = sampleRate;

		this.bpm = 120;
		this.measureTime = 60 / this.bpm;
		this.time = this.measureTime;

		this.measures = [];
		song.forEach(measure => {
			var tracks = measure.split("|").map(s => s.trim());
			if (tracks) {
				this.measures.push(tracks);
			}
		});

		this.instruments = instruments;
		this.measure = 0;

		this.active = [];
	}

	purge() {
		this.active = this.active.filter(note => note.active());
	}

	process() {
		this.time += 1 / this.sampleRate;
		if (this.time > this.measureTime) {
			this.time = 0;
			var notes = this.measures[this.measure];

			this.measure++;
			if (this.measure >= this.measures.length) this.measure = 0;

			notes.forEach((note, index) => {
				if (note == "") return;

				var tokens = note.split(" ");
				var noteIndex = SCALE.indexOf(tokens[0]);
				var freq = noteFrequency(220, noteIndex);
				var instrument = this.instruments[index];

				this.active.push(new instrument(freq, this.sampleRate, tokens[1]));
			});
		}

		var total = 0;
		this.active.forEach(note => {
			total += note.process();
		});

		return total;
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

	createGui(gui) {
		var folder = gui.addFolder("delay");
		folder.closed = false;
		folder.add(this, "enabled").listen();
		folder.add(this, "ratio", 0, 1).step(0.01).listen();
		folder.add(this, "delay", 1, 16 << 10).step(1).listen();
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

class Flange {
	constructor(sampleRate) {
		this.enabled = true;
		this.gain = 1;

		this.buffer = new Float32Array(1 << 10);
		this.head = 0;

		this.combine = 0.5;
		this.subtract = 0.1;

		this.phase = 0;
		this.frequency = 5;
		this.sampleRate = sampleRate;
	}

	createGui(gui) {
		var folder = gui.addFolder("flange");
		folder.closed = false;

		// coefficients
		folder.add(this, "enabled").listen();
		folder.add(this, "gain", 1, 3).step(0.01).listen();
		folder.add(this, "frequency", 0.01, 10).step(0.01).listen();
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

		this.phase += timeToPhase(1.0 / this.sampleRate, this.frequency);

		var offset = round((sin(this.phase) * 0.5 + 0.5) * this.buffer.length * 0.5);
		var target = this.head - offset;
		while (target < 0)
			target += this.buffer.length;

		var next = this.buffer[target] * this.combine + sample * (1 - this.combine);
		//this.buffer[this.head] = sample;
		this.buffer[this.head] = next;
		this.head++;
		if (this.head >= this.buffer.length) {
			this.head = 0;
		}

		if (!Number.isFinite(next)) next = 0;
		this.smooth = next;

		var result = next * (1 - this.subtract) - sample * this.subtract;
		return result * this.gain;
	}
}


var song = [
	"A  |  C ^ |  F   ",
	"A  |  C#  |      ",
	"g  |      |  F   ",
	"g  |  C#  |      ",
	"e  |  C   |  F ^ ",
	"e  |  C#  |  F . "
];

var instruments = [Sin, Saw, Square]

var tracker = new Tracker(song, instruments, 44100);

var delay = new Delay(8 << 10, 16 << 10);
delay.enabled = false;
delay.createGui(gui);

var flange = new Flange(44100);
flange.enabled = false;
flange.createGui(gui);

var gain = 0;

function process(data, event, sampleRate) {
	// clear buffer
	for (var sample = 0; sample < data.length; sample++)
		data[sample] = 0;

	// generate samples
	for (var sample = 0; sample < data.length; sample++) {
		data[sample] += tracker.process();
	}
	tracker.purge();


	for (var sample = 0; sample < data.length; sample++) {
		data[sample] = delay.process(data[sample]);
		data[sample] = flange.process(data[sample]);
	}

	// apply gain
	var targetGain = decibelsToGain(control.decibel);
	for (var sample = 0; sample < data.length; sample++) {
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