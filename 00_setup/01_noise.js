"use strict";

// setup controls
var control = {
	gain: 0.1
};
var gui = new dat.GUI();
gui.add(control, "gain", 0, 1);

// create a context for wiring up audio nodes
var audioContext = new AudioContext();

// how much audio to generate at a time
var bufferSize = 1024; // 256, 512, 1024, 2048, 4096, 8192, 16384
// how many speakers do we have?
var channelCount = 1;

// create an audio node that fills audio buffers
var node = audioContext.createScriptProcessor(bufferSize, 0, channelCount);

// define the buffer filling function
node.onaudioprocess = function(event) {
	var data = event.outputBuffer.getChannelData(0);
	for (var sample = 0; sample < data.length; sample++) {
		data[sample] = random() * 2.0 - 1.0;
		data[sample] *= control.gain;
	}

	record(data);
};

// connect this to output
node.connect(audioContext.destination);