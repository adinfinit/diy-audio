// setup controls
var control = {
	decibel: -5,
	frequency: 440,

	count: 1
};

var osc = sin;

var gui = new dat.GUI();
gui.add(control, "decibel", -40, 0);
gui.add(control, "frequency", 10, 880).listen();
gui.add(control, "count", 0, 1000).step(1);

var phase = 0;
keyboard(function on(key, freq) {
	if (freq) {
		control.frequency = freq;
	}
}, function off(key, freq) {})

var processMs = 0;
var bufferLengthMs = 0;

function process(data, event, sampleRate) {
	bufferLengthMs = data.length * 1000 / sampleRate;
	var start = performance.now();

	var secondsPerSample = 1.0 / sampleRate;

	var gain = decibelsToGain(control.decibel) * 0.9;
	var advance = timeToPhase(1.0 / sampleRate, control.frequency);
	var n = control.count;

	for (var sample = 0; sample < data.length; sample++) {
		data[sample] = osc(phase) * gain;
		var t = gain * 0.5;
		for (var i = 1; i < n; i++) {
			t *= 0.9;
			data[sample] +=
				osc(phase * (i % 16) + TAU / 7) * t +
				osc(phase * (i % 16) + TAU / 5) * t * t;
		}

		phase += timeToPhase(1.0 / sampleRate, control.frequency);
	}

	var stop = performance.now();
	processMs = stop - start;
};

function draw(context, screenSize, deltaTime) {
	context.font = "30px monospace";
	var gain = decibelsToGain(control.decibel);
	context.fillText("buffer   " + bufferLengthMs.toFixed(3) + "ms", 50, 50);
	context.fillText("process  " + processMs.toFixed(3) + "ms", 50, 100);
}

defaultsetup(process, draw);