function visualize(analyser, draw) {
	const HEADER_SIZE = 30;

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
	window.onmouseup = function() {
		mouse.released = true;
	};
	window.onmousemove = function(e) {
		mouse.x = e.pageX;
		mouse.y = e.pageY;
	};

	function mousePointsAt(x0, y0, x1, y1) {
		return x0 <= mouse.x && mouse.x <= x1 &&
			y0 <= mouse.y && mouse.y <= y1;
	}

	function oscilloscope(context, data, x0, y0, x1, y1) {
		var scaleX = (x1 - x0) / data.length;
		var scaleY = (y1 - y0) / 255.0;
		var centerY = y0 + scaleY;

		context.fillStyle = "#eee";
		context.strokeStyle = "#333";
		context.beginPath();
		context.rect(x0, y0, x1 - x0, y1 - y0);
		context.fill();
		context.stroke();

		context.beginPath();
		for (var k = 16; k <= 255 - 16; k += 16) {
			var y = y0 + scaleY * k;
			context.moveTo(x0, y);
			context.lineTo(x1, y);
		}
		context.strokeStyle = "#ccc";
		context.stroke();

		context.beginPath();
		context.moveTo(x0, data[0] * scaleY + centerY);
		for (var i = 1; i < data.length; i++) {
			var x = x0 + scaleX * i;
			var y = centerY + scaleY * data[i];
			context.lineTo(x, y);
		}
		context.strokeStyle = "#000";
		context.stroke();
	}

	function frequency(context, data, x0, y0, x1, y1) {
		var scaleX = (x1 - x0) / data.length;
		var scaleY = (y1 - y0) / 256.0;

		context.fillStyle = "#eee";
		context.strokeStyle = "#333";
		context.beginPath();
		context.rect(x0, y0, x1 - x0, y1 - y0);
		context.fill();
		context.stroke();

		// hz = bin index * 1/2 * sampleRate / totalBins ;
		// index = 2 * hz * totalBins / sampleRate

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

	function logfrequency(context, data, x0, y0, x1, y1) {
		var minimumFrequency = 110 / 8;
		var maximumFrequency = 0.5 * sampleRate;

		function position(hz) {
			var p = log2(hz / minimumFrequency) / log2(maximumFrequency / minimumFrequency);
			return p <= 0 ? 0 : p;
			//return minimumFrequency * pow(maximumFrequency / minimumFrequency, exponent);
			//return log2(hz / maximumFrequency) / log2(maximumFrequency);
			//return minimumFrequency * Math.pow(maximumFrequency / minimumFrequency, exponent);
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

		// hz = bin index * 1/2 * sampleRate / totalBins ;
		// index = 2 * hz * totalBins / sampleRate

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
			oscilloscope(context, sampleData, 0, screen.y * 0.5, screen.x * 0.5, screen.y);
			logfrequency(context, frequencyData, screen.x * 0.5, screen.y * 0.5, screen.x, screen.y * 0.75);
			frequency(context, frequencyData, screen.x * 0.5, screen.y * 0.75, screen.x, screen.y);

			context.restore();
		}

		if (draw) {
			draw(context, screen, deltaTime);
		}

		mouse.released = false;
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