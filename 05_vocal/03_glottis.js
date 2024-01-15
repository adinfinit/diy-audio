"use strict";

// setup controls
var control = {
	decibel: -5,
};

function approach(before, target, maxStep, epsilon) {
	let delta = target - before;
	let adelta = abs(delta)
	if(adelta < epsilon) {
		return before;
	}
	if(adelta > maxStep) {
		return before + Math.sign(delta) * maxStep;
	}
	if(adelta > maxStep * 0.1) {
		return before + Math.sign(delta) * maxStep * 0.1;
	}
	return target;
}

function cosSkew(x, skew) {
	return Math.cos(x + Math.cos(x + Math.cos(x + Math.cos(x)*skew*skew*skew)*skew*skew)*skew);
}

class Glottis {
	constructor(sampleRate){
		this.sampleRate = sampleRate;

		this._phase = 0.0;
		this._vibratoPhase = 0.0;

		this._frequency = 440.0;
		this._skew  = 0.5;
		this._close = 0.5;

		this.frequency = this._frequency;
		this.skew      = this._skew;
		this.close     = this._close;
		this.breath     = 0.01;

		this.vibratoFrequency = 5.0; // in Hz
		this.vibratoDepth = 4.0; // range in Hz
	}

	updateSampleRate(sampleRate) {
		this.sampleRate = sampleRate;
	}

	bind(gui){
		let folder = gui.addFolder("glottis");
		folder.add(this, "frequency", 50, 3 * 440);
		folder.add(this, "skew", 0, 0.8);
		folder.add(this, "close", 0, 0.8);
		folder.add(this, "breath", 0, 0.2);

		folder.add(this, "vibratoFrequency", 0, 10);
		folder.add(this, "vibratoDepth", 0, 10);

		folder.open();
	}

	process(samples) {
		let phase     = this._phase;
		let vibratoPhase = this._vibratoPhase;

		let frequency = this._frequency;
		let skew      = this._skew;
		let close     = this._close;

		let targetFrequency = this.frequency;
		let targetSkew = this.skew;
		let targetClose = this.close;

		let breath = this.breath;
		let vibratoFrequency = this.vibratoFrequency;
		let vibratoDepth = this.vibratoDepth;

		let sampleRate = this.sampleRate;
		let sampleAdvance = 2 * PI / sampleRate;

		const SKEW_ADJUST_SPEED = 1000; // in hz
		const CLOSE_ADJUST_SPEED = 800; // in hz
		const FREQUENCY_ADJUST_SPEED = 100*100;

		for(let i = 0; i < samples.length; i++) {
			// smoothly adjust skew, close and frequency to avoid clicks
			frequency = approach(frequency, targetFrequency, FREQUENCY_ADJUST_SPEED/sampleRate);
			skew = approach(skew, targetSkew, SKEW_ADJUST_SPEED/sampleRate);
			close = approach(close, targetClose, CLOSE_ADJUST_SPEED/sampleRate);

			// update vibrato phase
			vibratoPhase += vibratoFrequency * 2*PI/sampleRate;
			// add variation to vibrato stability
			vibratoPhase += (Math.random() - 0.5) * 0.05 * frequency/880;

			// update the fundamental tone phase
			phase += (frequency + vibratoDepth * Math.cos(vibratoPhase)) * 2*PI/sampleRate;
			// add random noise into fundamental tone
			phase += (Math.random() - 0.5) * 0.005 * frequency/880;

			// calculate close quotient phase adjustment
			let closeQuotient = Math.cos(-phase - (19.0/32.0)*PI) * close;

			// calculate the voice
			let voice = -cosSkew(-phase + closeQuotient, skew);
			// caculate breathiness
			let breathiness = breath * Math.random() * Math.random();

			// final voice
			samples[i] = voice + breathiness;
		}

		this._phase = phase;
		this._vibratoPhase = vibratoPhase;

		this._frequency = frequency;
		this._skew = skew;
		this._close = close;
	}
}

var gui = new dat.GUI();
gui.add(control, "decibel", -40, 0);

let glottis = new Glottis(48000);
glottis.bind(gui);

function process(data, event) {
	glottis.updateSampleRate(SampleRate);
	glottis.process(data);

	var gain = decibelsToGain(control.decibel);
	for(let i = 0; i < data.length; i++) {
		data[i] *= gain;
	}
};

function draw(context, screenSize, deltaTime) {
	context.font = "30px monospace";
	var gain = decibelsToGain(control.decibel);
	context.fillText("gain " + gain.toFixed(3), 50, 50);
}

defaultsetup(process, draw);