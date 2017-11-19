// http://iquilezles.org/www/articles/functions/functions.htm

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

// setup controls
var control = {
	decibel: -5,
	frequency: 440,

	k: 10,
	attack: 1,
	release: 1
};

var gui = new dat.GUI();
gui.add(control, "decibel", -40, 0);
gui.add(control, "frequency", 10, 880).listen().onFinishChange(reset);

gui.add(control, "k", 0, 10).step(0.01).onFinishChange(reset)
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
	}
}, function off(key, freq) {})

function process(data, event, sampleRate) {
	var secondsPerSample = 1.0 / sampleRate;

	var gain = decibelsToGain(control.decibel);
	var advance = timeToPhase(1.0 / sampleRate, control.frequency);

	for (var sample = 0; sample < data.length; sample++) {
		var shape = impulse(time, control.k);
		// var shape = cubicPulse(time, control.attack, control.release);
		// var shape = envelope(time, control.attack, control.release);
		data[sample] = sin(phase) * gain * shape;
		phase += advance;
		time += secondsPerSample; // !!
	}
};

function draw(context, screenSize, deltaTime) {
	context.font = "30px monospace";
	var gain = decibelsToGain(control.decibel);
	context.fillText("gain  " + gain.toFixed(3), 50, 50);
	context.fillText("phase " + phase.toFixed(3), 50, 100);
}

defaultsetup(process, draw);