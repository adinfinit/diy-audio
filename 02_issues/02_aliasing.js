// setup controls
var control = {
	decibel: -5,
	frequency: 440,

	scale: 1
};

var gui = new dat.GUI();
gui.add(control, "decibel", -40, 0);
gui.add(control, "frequency", 10, 880).listen();
gui.add(control, "scale", 1, 30).step(1);

var phase = 0;
keyboard(function on(key, freq) {
	if (freq) {
		control.frequency = freq;
	}
}, function off(key, freq) {})

var lastFrequency = 0;

function process(data, event, sampleRate) {
	var secondsPerSample = 1.0 / sampleRate;
	var gain = decibelsToGain(control.decibel);

	for (var sample = 0; sample < data.length; sample++) {
		data[sample] = sin(phase) * gain;
		var frequency = control.frequency * Math.pow(2, control.scale);
		phase += timeToPhase(1.0 / sampleRate, frequency);
	}

	lastFrequency = frequency;
};

function draw(context, screenSize, deltaTime) {
	context.font = "30px monospace";
	var gain = decibelsToGain(control.decibel);
	context.fillText("freq   " + lastFrequency.toFixed(3) + "hz", 50, 50);
	context.fillText("phase  " + phase.toFixed(3), 50, 100);
}

defaultsetup(process, draw);