var record = function() {};

function visualize(analyser, draw) {
	const HEADER_SIZE = 30;
	const RECORDING_SECONDS = 4;

	var canvas = document.getElementById("canvas");
	var context = canvas.getContext("2d");

	var PAUSED = false;

	var currentTime = analyser.context.currentTime;
	var sampleRate = analyser.context.sampleRate;

	var frequencyData = new Uint8Array(analyser.frequencyBinCount);
	var sampleData = new Uint8Array(analyser.frequencyBinCount);

	function updateData() {
		if (PAUSED) return;

		currentTime = analyser.context.currentTime;
		sampleRate = analyser.context.sampleRate;

		analyser.getByteFrequencyData(frequencyData);
		analyser.getByteTimeDomainData(sampleData);
	}

	// RECORDER
	var recordingSize = sampleRate * RECORDING_SECONDS;
	var summaryBlockShift = 8;
	var summaryHeadMask = (1 << summaryBlockShift) - 1;
	var recording = new Float32Array(recordingSize);
	var recordingHead = sampleRate / 2;

	var minimum = 0;
	var maximum = 0;

	var previewRecording = 0;

	var summarySize = recordingSize >> summaryBlockShift;
	var summaryMin = new Float32Array(summarySize);
	var summaryMax = new Float32Array(summarySize);

	for (var i = 0; i < summaryMin.length; i++) {
		summaryMin[i] = 0;
		summaryMax[i] = 0;
	}

	record = function(data) {
		if (PAUSED) return;

		for (var i = 0; i < data.length; i++) {
			var value = data[i];

			if (value < minimum) minimum = value;
			if (value > maximum) maximum = value;

			recording[recordingHead] = value;

			if ((recordingHead & summaryHeadMask) == 0) {
				var summaryHead = recordingHead >> summaryBlockShift;
				summaryMin[summaryHead] = minimum;
				summaryMax[summaryHead] = maximum;
				minimum = value;
				maximum = value;
			}

			recordingHead++;
			if (recordingHead >= recordingSize) {
				recordingHead = 0;
			}
		}
	};

	// set canvas size to the correct size
	var screen = V(0, 0);
	window.onresize = function(e) {
		screen.x = window.innerWidth;
		screen.y = window.innerHeight;

		canvas.width = screen.x;
		canvas.height = screen.y;
	};
	// update the variables
	window.onresize();

	var mouse = V(screen.x / 2, screen.y / 2);
	mouse.released = false;
	window.addEventListener("mouseup", function() {
		mouse.released = true;
	});
	window.addEventListener("mousemove", function(e) {
		mouse.x = e.pageX;
		mouse.y = e.pageY;
	});

	function mousePointsAt(x0, y0, x1, y1) {
		return x0 <= mouse.x && mouse.x <= x1 &&
			y0 <= mouse.y && mouse.y <= y1;
	}

	function frame(x0, y0, x1, y1) {
		context.fillStyle = "#eee";
		context.strokeStyle = "#333";
		context.beginPath();
		context.rect(x0, y0, x1 - x0, y1 - y0);
		context.fill();
		context.stroke();
	}

	function draw_recording(context, min, max, x0, y0, x1, y1) {
		frame(x0, y0, x1, y1);

		if (mousePointsAt(x0, y0, x1, y1)) {
			previewRecording = ((mouse.x - x0) * recordingSize / (x1 - x0)) | 0;
		}

		var scaleX = (x1 - x0) / min.length;
		var scaleY = (y1 - y0) / 2.0;
		var centerY = y0 + scaleY;
		context.beginPath();
		context.moveTo(x0, centerY + min[0] * scaleY);
		for (var i = 1; i < min.length; i++) {
			context.lineTo(x0 + scaleX * i, centerY + min[i] * scaleY);
		}
		for (var i = max.length - 1; i >= 0; i--) {
			context.lineTo(x0 + scaleX * i, centerY + max[i] * scaleY);
		}
		context.fillStyle = "#000";
		context.fill();

		{
			context.beginPath();
			var summaryHead = recordingHead >> summaryBlockShift;
			var x = x0 + scaleX * summaryHead;
			context.moveTo(x, y0);
			context.lineTo(x, y1);
			context.strokeStyle = "#f00";
			context.stroke();;

			context.beginPath();
			var previewHead = (previewRecording / recordingSize) * summarySize;
			var x = x0 + scaleX * previewHead;
			context.moveTo(x, y0);
			context.lineTo(x, y1);
			context.strokeStyle = "#00f";
			context.stroke();;
		}
	}

	function draw_preview(context, x0, y0, x1, y1) {
		frame(x0, y0, x1, y1);

		var previewWidth = 1 << summaryBlockShift;

		var scaleX = (x1 - x0) / previewWidth;
		var scaleY = (y1 - y0) / 2.0;
		var centerY = y0 + scaleY;

		var previewHead = previewRecording - previewWidth / 2;
		if (previewHead < 0) {
			previewHead += recordingSize;
		}

		context.beginPath();
		context.moveTo(x0, centerY + scaleY * recording[previewHead]);
		for (var i = 1; i < previewWidth; i++) {
			previewHead++;
			if (previewHead >= recordingSize) previewHead = 0;
			context.lineTo(x0 + i * scaleX, centerY + scaleY * recording[previewHead]);
		}

		context.strokeStyle = "#000";
		context.stroke();
	}

	function draw_oscilloscope(context, data, x0, y0, x1, y1) {
		frame(x0, y0, x1, y1);

		var scaleX = (x1 - x0) / data.length;
		var scaleY = (y1 - y0) / 255.0;

		context.beginPath();
		for (var k = 16; k <= 255 - 16; k += 16) {
			var y = y0 + scaleY * k;
			context.moveTo(x0, y);
			context.lineTo(x1, y);
		}
		context.strokeStyle = "#ccc";
		context.stroke();

		context.beginPath();
		context.moveTo(x0, y0 + data[0] * scaleY);
		for (var i = 1; i < data.length; i++) {
			var x = x0 + scaleX * i;
			var y = y0 + scaleY * data[i];
			context.lineTo(x, y);
		}
		context.strokeStyle = "#000";
		context.stroke();
	}

	function draw_frequency(context, data, x0, y0, x1, y1) {
		frame(x0, y0, x1, y1);

		var scaleX = (x1 - x0) / data.length;
		var scaleY = (y1 - y0) / 256.0;

		context.beginPath();
		var last = x0;
		for (var i = 0; i < data.length; i++) {
			var height = data[i] * scaleY;
			var x = (x0 + i * scaleX) | 0;
			context.fillStyle = rgb(data[i], 50, 50);
			context.fillRect(last, y1 - height, x - last, height);
			last = x;
		}
		context.strokeStyle = "#000";
		context.stroke();

		context.beginPath();
		var hz = 110;
		var y = y0 + 55;
		for (var k = 0; k < 13; k++) {
			var bin = 2 * hz * data.length / sampleRate;
			var x = x0 + bin * scaleX;

			context.moveTo(x | 0, y0);
			context.lineTo(x | 0, y1);

			context.fillStyle = "#000";

			var hzt = hz | 0;
			if (hzt > 1000) {
				hzt = ((hzt / 1000) | 0) + "k"
			}

			context.fillText(hzt, x + 2, y);
			if (k < 4) {
				y -= 10;
			}

			hz = hz * 2;
		}
		context.strokeStyle = "#333";
		context.stroke();
	}

	function draw_logfrequency(context, data, x0, y0, x1, y1) {
		var minimumFrequency = 110 / 8;
		var maximumFrequency = 0.5 * sampleRate;
		var divider = log2(maximumFrequency / minimumFrequency);

		function position(hz) {
			var p = log2(hz / minimumFrequency) / divider;
			return p <= 0 ? 0 : p;
		}

		function binToHz(bin) {
			return bin * 0.5 * sampleRate / data.length;
		}

		var scaleX = (x1 - x0) / data.length;
		var scaleY = (y1 - y0) / 256.0;

		context.fillStyle = "#eee";
		context.strokeStyle = "#333";
		context.beginPath();
		context.rect(x0, y0, x1 - x0, y1 - y0);
		context.fill();
		context.stroke();

		context.beginPath();
		var last = x0;
		for (var i = 0; i < data.length; i++) {
			var height = data[i] * scaleY;
			var p = position(binToHz(i));

			var x = (x0 + p * (x1 - x0)) | 0;
			context.fillStyle = rgb(data[i], 50, 50);
			context.fillRect(last, y1 - height, x - last, height);
			last = x;
		}
		context.strokeStyle = "#000";
		context.stroke();

		context.beginPath();
		var hz = minimumFrequency;
		for (var k = 0; k < 13; k++) {
			var bin = 2 * hz * data.length / sampleRate;
			var p = position(hz);

			var x = x0 + p * (x1 - x0);
			context.moveTo(x | 0, y0);
			context.lineTo(x | 0, y1);

			context.fillStyle = "#000";

			var hzt = hz | 0;
			if (hzt > 1000) {
				hzt = ((hzt / 1000) | 0) + "k"
			}
			context.fillText(hzt, x + 2, y0 + 15);

			hz = hz * 2;
		}
		context.strokeStyle = "#333";
		context.stroke();
	}

	function button(text, x0, y0, x1, y1) {
		context.beginPath();
		context.rect(x0, y0, x1 - x0, y1 - y0);
		var clicked = false;
		if (mousePointsAt(x0, y0, x1, y1)) {
			context.strokeStyle = "#333";
			context.fillStyle = "#eee";
			context.fill();
			context.stroke();
			clicked = mouse.released;
		} else {
			context.strokeStyle = "#888";
			context.stroke();
		}

		context.fillStyle = "#000";
		context.fillText(text, x0 + 4, y1 - 6);

		return clicked;
	}

	function update(deltaTime) {
		context.clearRect(0, 0, screen.x, screen.y);
		if (analyser) {
			context.save();

			updateData();

			context.font = "16px monospace";
			context.lineWidth = "1px";
			context.fillStyle = "#000";

			var x = 10;
			if (button(PAUSED ? "resume" : "pause", 10, 4, x += 80, HEADER_SIZE - 4)) {
				PAUSED = !PAUSED;
			}
			context.fillText("Time: " + currentTime.toFixed(3), x += 10, HEADER_SIZE - 10);
			context.fillText("SampleRate: " + sampleRate, x += 200, HEADER_SIZE - 10);

			var y0 = screen.y * 0.5;
			context.font = "10px monospace";
			draw_recording(context, summaryMin, summaryMax, 0, screen.y * 0.4, screen.x, screen.y * 0.5);
			draw_preview(context, 0, screen.y * 0.5, screen.x * 0.5, screen.y * 0.75)
			draw_oscilloscope(context, sampleData, 0, screen.y * 0.75, screen.x * 0.5, screen.y);
			draw_logfrequency(context, frequencyData, screen.x * 0.5, screen.y * 0.5, screen.x, screen.y * 0.75);
			draw_frequency(context, frequencyData, screen.x * 0.5, screen.y * 0.75, screen.x, screen.y);

			context.restore();
		}
		mouse.released = false;

		if (draw) {
			context.save();
			try {
				context.translate(0, HEADER_SIZE);
				var size = screen.clone();
				size.y -= HEADER_SIZE - screen.y * 0.5;
				draw(context, size, deltaTime);
			} finally {
				context.restore();
			}
		}
	}

	// setup timing loop
	var lastTime = 0;

	function tick() {
		requestAnimationFrame(tick);

		var currentTime = now();
		update(currentTime - lastTime);
		lastTime = currentTime;
	}
	tick();
}