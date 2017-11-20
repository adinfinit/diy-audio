"use strict";

function keyboard(on, off) {
	const scale = "awsedftgyhujkolp;']\\"; // c base
	//const scale = "awsdrftghujikol;[']\\";
	window.addEventListener("keydown", function(ev) {
		var key = ev.key;
		if (key) key = key.toLowerCase();

		var index = scale.indexOf(ev.key);
		if (index >= 0) {
			on(key, 220 * Math.pow(2, index / 12), ev);
		} else {
			on(key, false, ev);
		}
	});

	window.addEventListener("keyup", function(ev) {
		var key = ev.key;
		if (key) key = key.toLowerCase();

		var index = scale.indexOf(ev.key);
		if (index >= 0) {
			off(key, 220 * Math.pow(2, index / 12), ev);
		} else {
			off(key, false, ev);
		}
	});
}