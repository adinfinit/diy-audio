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

function custom(phase) {
	return triangle(phase) +
		sin(phase * 2) * 0.3 +
		square(phase * 3) * 0.1;
}

var oscillator = {
	"sin": sin,
	"saw": saw,
	"square": square,
	"triangle": triangle,
	"noise": noise,
	"custom": custom
};
var oscillators = ["sin", "saw", "square", "triangle", "noise", "custom"];

// setup controls
var control = {
	decibel: -5,
	frequency: 440,

	oscillator: "sin",

	attack: 0.02,
	release: 1.00
};

var gui = new dat.GUI();
gui.add(control, "decibel", -40, 0);
gui.add(control, "frequency", 10, 880).listen().onFinishChange(reset);
gui.add(control, "oscillator", oscillators).listen();
gui.add(control, "attack", 0, 2).step(0.01).onFinishChange(reset);
gui.add(control, "release", 0, 2).step(0.01).onFinishChange(reset);

var phase = 0;
var time = 0;

function reset() {
	phase = 0;
	time = 0;
}

keyboard(function on(key, freq) {
	if (freq) {
		reset();
		control.frequency = freq;
	} else {
		const numeric = "1234567890";
		var index = numeric.indexOf(key);
		if ((index >= 0) && (index < oscillators.length)) {
			reset();
			control.oscillator = oscillators[index];
		}
	}
}, function off(key, freq) {})

function process(data, event, sampleRate) {
	var secondsPerSample = 1.0 / sampleRate;

	var gain = decibelsToGain(control.decibel);
	var advance = timeToPhase(1.0 / sampleRate, control.frequency);
	var attack = control.attack;
	var release = control.release;

	var osc = oscillator[control.oscillator];

	for (var sample = 0; sample < data.length; sample++) {
		var shape = envelope(time, attack, release);
		data[sample] = osc(phase) * gain * shape;
		phase += advance;
		time += secondsPerSample;
	}
};

function draw(context, screenSize, deltaTime) {
	context.font = "30px monospace";
	var gain = decibelsToGain(control.decibel);
	context.fillText("gain  " + gain.toFixed(3), 50, 50);
	context.fillText("phase " + phase.toFixed(3), 50, 100);
}

defaultsetup(process, draw);