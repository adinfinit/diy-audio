// setup controls
var control = {
	decibel: -5,
	frequency: 440,

	scale: 1
};

var osc = sin;

var gui = new dat.GUI();
gui.add(control, "decibel", -40, 0);
gui.add(control, "frequency", 10, 880).listen();
gui.add(control, "scale", 1, 30).step(0.01);

var phase = 0;
keyboard(function on(key, freq) {
	if (freq) {
		control.frequency = freq;
	}
}, function off(key, freq) {})

function process(data, event, sampleRate) {
	var secondsPerSample = 1.0 / sampleRate;
	var gain = decibelsToGain(control.decibel) * control.scale;
	var advance = timeToPhase(1.0 / sampleRate, control.frequency);

	for (var sample = 0; sample < data.length; sample++) {
		data[sample] = osc(phase) * gain;
		phase += advance;
	}
};

function draw(context, screenSize, deltaTime) {
	context.font = "30px monospace";
	var gain = decibelsToGain(control.decibel) * control.frequency;
	context.fillText("gain   " + gain.toFixed(3), 50, 50);
	context.fillText("phase  " + phase.toFixed(3), 50, 50);
}

defaultsetup(process, draw);