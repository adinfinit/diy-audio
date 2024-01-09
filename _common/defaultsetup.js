let SampleRate = 0;
let MainAudioContext = null;

function defaultsetup(process, draw) {
	var audioContext = new AudioContext();
	var node = audioContext.createScriptProcessor(1024, 0, 1);
	SampleRate = audioContext.sampleRate;
	MainAudioContext = audioContext;
	console.log(audioContext.sampleRate);

	var skip = 8;

	node.onaudioprocess = function(event) {
		if (skip > 0) {
			skip--;
			return;
		}
		var data = event.outputBuffer.getChannelData(0);
		process(data, event, audioContext.sampleRate);

		for (var i = 0; i < data.length; i++) {
			var sample = data[i];
			if (!Number.isFinite(sample)) sample = 0;
			if (sample > 1) sample = 1;
			if (sample < -1) sample = -1;
			data[i] = sample;
		}

		record(data);
	};

	// create an analyser for visualizing what is going on
	var analyser = audioContext.createAnalyser();
	analyser.fftSize = 512;

	// connect this to analyser
	node.connect(analyser);
	analyser.connect(audioContext.destination);

	// start visualization
	visualize(analyser, function(context, screenSize, deltaTime) {
		if (draw) {
			draw(context, screenSize, deltaTime);
		}
	});
}