"use strict";

function keyboard(on, off) {
	const scale = "awsedftgyhujkolp;']\\"; // c base
	//const scale = "awsdrftghujikol;[']\\";
	window.addEventListener("keydown", function(ev) {
		var index = scale.indexOf(ev.key);
		if (index >= 0) {
			on(ev.key, 220 * Math.pow(2, index / 12), ev);
		} else {
			on(ev.key, false, ev);
		}
	});

	window.addEventListener("keyup", function(ev) {
		var index = scale.indexOf(ev.key);
		if (index >= 0) {
			off(ev.key, 220 * Math.pow(2, index / 12), ev);
		} else {
			off(ev.key, false, ev);
		}
	});
}