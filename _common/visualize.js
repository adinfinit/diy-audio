function visualize(analyser, draw) {
	const HEADER_SIZE = 30;

	var canvas = document.getElementById("canvas");
	var context = canvas.getContext("2d");

	var PAUSED = false;

	var currentTime = analyser.context.currentTime;
	var sampleRate = analyser.context.sampleRate;
	var frequencyData = new Float32Array(analyser.fftSize);
	var sampleData = new Float32Array(analyser.fftSize);

	function updateData() {
		if (PAUSED) return;

		currentTime = analyser.context.currentTime;
		sampleRate = analyser.context.sampleRate;

		analyser.getFloatFrequencyData(frequencyData);
		analyser.getFloatTimeDomainData(sampleData);
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
		var scaleY = (y1 - y0) / 2.0;
		var centerY = y0 + scaleY;

		context.fillStyle = "#eee";
		context.fillRect(x0, y0, x1 - x0, y1 - y0);

		context.beginPath();
		for (var k = -1.0; k <= 1.0; k += 0.1) {
			var y = centerY + scaleY * k;
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

			oscilloscope(context, sampleData, 0, HEADER_SIZE, screen.x, screen.y * 0.5);

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