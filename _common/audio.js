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