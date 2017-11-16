function defaultsetup(process, draw) {
	var audioContext = new AudioContext();
	var node = audioContext.createScriptProcessor(1024, 0, 1);

	console.log(audioContext.sampleRate);
	node.onaudioprocess = function(event) {
		var data = event.outputBuffer.getChannelData(0);
		process(data, event, audioContext.sampleRate);
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