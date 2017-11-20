"use strict";

// setup controls
var control = {
	decibel: -5
};
var gui = new dat.GUI();
gui.add(control, "decibel", -40, 0);

class Note {
	constructor(frequency, sampleRate) {
		this.phase = 0;
		this.frequency = frequency;
		this.sampleRate = sampleRate;
		this.attack = 0.01;
		this.release = 0.5;
		this.time = 0;
	}

	process() {
		var frequency = this.frequency + 2 * sin(this.phase * 0.03);
		this.phase += timeToPhase(1.0 / this.sampleRate, frequency);

		this.time += 1 / this.sampleRate;
		var env = envelope(this.time, this.attack, this.release);
		return sin(this.phase) * env;
	}

	active() {
		return this.time <= this.attack + this.release;
	}
}

var notes = [];

keyboard(function on(key, freq) {
	if (freq) {
		notes.push(new Note(freq, 44100));
	}
}, function off(key, freq) {})

var gain = 0;

function process(data, event, sampleRate) {
	// clear buffer
	for (var sample = 0; sample < data.length; sample++)
		data[sample] = 0;

	// add all notes
	notes.forEach(note => {
		for (var sample = 0; sample < data.length; sample++) {
			data[sample] += note.process();
		}
	});

	// clean up notes not playing
	notes = notes.filter(note => note.active());

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
	context.fillText("notes " + notes.length, 50, 100);
}

defaultsetup(process, draw);