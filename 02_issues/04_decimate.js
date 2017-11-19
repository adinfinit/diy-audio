// setup controls
var control = {
	decibel: -5,
	frequency: 440,

	decimate: 8
};

var gui = new dat.GUI();
gui.add(control, "decibel", -40, 0);
gui.add(control, "frequency", 10, 880).listen();
gui.add(control, "decimate", 2, 256).step(1);

var phase = 0;

keyboard(function on(key, freq) {
	if (freq) {
		control.frequency = freq;
	}
}, function off(key, freq) {})

var lastFrequency = 0;
var lastSample = 0;

function process(data, event, sampleRate) {
	var secondsPerSample = 1.0 / sampleRate;
	var gain = decibelsToGain(control.decibel);
	var frequency = control.frequency;
	lastFrequency = frequency;
	var advance = timeToPhase(1.0 / sampleRate, frequency);

	for (var sample = 0; sample < data.length; sample++) {
		var value = sin(phase) * gain;
		var decimatedValue = Math.round(value * control.decimate) / control.decimate;

		data[sample] = decimatedValue;
		phase += advance;
	}

	lastSample = data[0];
};

function draw(context, screenSize, deltaTime) {
	context.font = "30px monospace";
	var gain = decibelsToGain(control.decibel);
	context.fillText("freq   " + lastFrequency.toFixed(3) + "hz", 50, 50);
	context.fillText("phase  " + phase.toFixed(3), 50, 100);
	context.fillText("sample " + lastSample.toFixed(3), 50, 150);
}

defaultsetup(process, draw);