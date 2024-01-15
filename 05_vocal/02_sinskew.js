"use strict";

// setup controls
var control = {
	decibel: -5,
	frequency: 220,

	vibrato: 5,
	vibratoDepth: 4,

	skew: 0.6,
	close: 0.5,
	noise: 0.01,
};
var gui = new dat.GUI();
gui.add(control, "decibel", -40, 0);
gui.add(control, "frequency", 50, 3*440);

gui.add(control, "vibrato", 0, 10);
gui.add(control, "vibratoDepth", 0, 10);

gui.add(control, "skew", 0, 0.8);
gui.add(control, "close", 0, 0.8);
gui.add(control, "noise", 0, 0.2);

let vibratoPhase = 0.0;

let phase = 0.0;
let skew = 0;
let close = 0;

function sinskew(x, skew) {
	return sin(x + sin(x + sin(x + sin(x)*skew*skew*skew)*skew*skew)*skew);
}

function approach(before, target, maxStep) {
	if(before < target){
		return min(before + maxStep, target);
	} else {
		return max(before - maxStep, target);
	}
}

function process(data, event) {
	var gain = decibelsToGain(control.decibel);
	for (let sample = 0; sample < data.length; sample++) {
		// smoothly adjust skew and close, to avoid clicks
		skew = approach(skew, control.skew, 1000/SampleRate);
		close = approach(close, control.close, 800/SampleRate);

		// update vibrato phase
		vibratoPhase += control.vibrato * 2 * PI / SampleRate;
		// add random noise into vibrato stability
		vibratoPhase += (random() - 0.5) * 0.05 * control.frequency/880;

		// update the base tone phase
		phase += (control.frequency + control.vibratoDepth * sin(vibratoPhase)) *2*PI/SampleRate;
		// add random noise into frequency stability
		phase += (random() - 0.5) * 0.005 * control.frequency/880;

		// calculate close quotient phase adjustment
		let closeq = sin(-phase - (19.0/32.0)*PI) * close;
		// calculate the voice
		let voice = -sinskew(-phase + closeq, skew);
		let noise = control.noise*random()*random();

		let sum = voice + noise;
		data[sample] = gain * sum;
	}
};

function draw(context, screenSize, deltaTime) {
	context.font = "30px monospace";
	var gain = decibelsToGain(control.decibel);
	context.fillText("gain " + gain.toFixed(3), 50, 50);
}


defaultsetup(process, draw);