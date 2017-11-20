"use strict";

// setup controls
var control = {
	decibel: -5
};
var gui = new dat.GUI();
gui.add(control, "decibel", -40, 0);


function noteFrequency(tonic, index) {
	return tonic * Math.pow(2, index / 12);
}

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

// 0  1  2  3  4  5  6  7  8  9  10 11
// 12 13 14 15 16 17 18 19 20 21 22 23
// A  A# B  C  C# D  D# E  F  F# G  G#
var Cmaj = [3, 5, 7, 8, 10, 12, 14, 15];

class Music {
	constructor(tonic, sampleRate) {
		this.sampleRate = sampleRate;
		this.tonic = tonic;
		this.interval = 0.2;
		this.time = this.interval;

		this.notes = [3, 5, 7, 8, 10, 12, 14, 15];
		this.note = 0;

		this.active = [];
	}

	bindKeyboard() {
		var music = this;
		keyboard(function on(key, freq) {
			if (freq) music.tonic = freq;
		}, function off(key, freq) {})
	}

	purge() {
		this.active = this.active.filter(note => note.active());
	}

	process() {
		this.time += 1 / this.sampleRate;
		if (this.time > this.interval) {

			this.note++;
			if (this.note >= this.notes.length) this.note = 0;
			var freq = noteFrequency(this.tonic, this.notes[this.note]);

			this.active.push(new Note(freq, this.sampleRate));
			this.time = 0;
		}

		var total = 0;
		this.active.forEach(note => {
			total += note.process();
		});

		return total;
	}
}

var music = new Music(220, 44100);
music.bindKeyboard();

var gain = 0;

function process(data, event, sampleRate) {
	// clear buffer
	for (var sample = 0; sample < data.length; sample++)
		data[sample] = 0;

	// generate samples
	for (var sample = 0; sample < data.length; sample++) {
		data[sample] += music.process();
	}

	music.purge();

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
	context.fillText("notes " + music.active.length, 50, 100);
	context.fillText("time  " + music.time.toFixed(3), 50, 150);
}

defaultsetup(process, draw);