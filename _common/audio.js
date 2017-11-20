"use strict";

function random1() {
	return Math.random() * 2 - 1;
}

function decibelsToGain(decibel) {
	return pow(2.0, decibel / 6.0);
}

function gainToDecibels(gain) {
	return 6 * log2(gain);
}

function timeToPhase(time, hz) {
	return time * hz * 2 * PI;
}

function noteFrequency(tonic, index) {
	return tonic * Math.pow(2, index / 12);
}

function decimate(sample, levels) {
	return Math.round(sample * levels * 0.5) * 2 / levels;
}


// basic envelopes

function impulse(time, k) {
	var h = k * time;
	return h * exp(1.0 - h)
}

function cubicPulse(time, center, width) {
	var time = abs(time - center);
	if (time > width) return 0.0;
	time /= width;
	return 1 - time * time * (3 - 2 * time);
}

function envelope(time, attack, release) {
	if (time < 0)
		return 0;
	if (time < attack)
		return time / attack;
	if (time < attack + release)
		return 1 - (time - attack) / release;
	return 0;
}

// basic oscillators

function sin(phase) {
	return Math.cos(phase);
}

function saw(phase) {
	return 2 * (phase / TAU - ((phase / TAU + 0.5) | 0));
}

function square(phase, A) {
	A = A || 0.5;
	var s = Math.sin(phase);
	return s > A ? 1.0 : s < A ? -1.0 : A;
}

function triangle(phase) {
	return Math.abs(4 * ((phase / TAU - 0.25) % 1) - 2) - 1;
}

function noise(phase) {
	return Math.random() * 2 - 1;
}