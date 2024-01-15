// setup controls
var control = {
	decibel: -5,
};

var gui = new dat.GUI();
gui.add(control, "decibel", -40, 0);

class FormantBandPassBank {
	constructor(N) {
		this.N = N;
		this.sampleRate = 48000;

		this.in2  = 0.0;
		this.in1  = 0.0;
		this.out2 = new Float32Array(N);
		this.out1 = new Float32Array(N);

		this.a0 = new Float32Array(N);
		this.a1 = new Float32Array(N);
		this.a2 = new Float32Array(N);

		this.b0 = new Float32Array(N);
		this.b2 = new Float32Array(N);

		this._frequency = new Float32Array(N);
		this.frequency  = new Float32Array(N);

		this._bandwidth = new Float32Array(N);
		this.bandwidth  = new Float32Array(N);

		this._gain = new Float32Array(N);
		this.gain  = new Float32Array(N);
	}

	set(sampleRate, frequency, bandwidth, gain) {
		this.sampleRate = sampleRate;

		this.frequency.set(frequency)
		this.bandwidth.set(bandwidth)
		this.gain.set(gain)
	}

	forceUpdate() {
		this._frequency.set(this.frequency);
		this._bandwidth.set(this.bandwidth);
		this._gain.set(this.gain);
	}

	process(samples) {
		const sampleRate = this.sampleRate;

		for(let k = 0; k < samples.length; k++) {
			let sample = samples[k];

			let output = 0.0;
			for(let i = 0; i < this.N; i++) {
				let F0 = this._frequency[i];
				let BW = this._bandwidth[i] / this._frequency[i];
				let A = decibelsToGain(this._gain[i]);

				let w0 = 2 * Math.PI * F0 / sampleRate;
				let alpha = Math.sin(w0) * Math.sinh( Math.LN2/2 * BW * w0/Math.sin(w0) );

				// H(s) = (s/Q) / (s^2 + s/Q + 1)      (constant 0 dB peak gain)
				// let b0 =  alpha;
				// let b1 =  0;
				// let b2 = -alpha;
				// let a0 =  1 + alpha;
				// let a1 = -2*Math.cos(w0);
				// let a2 =  1 - alpha;

				// H(s) = s / (s^2 + s/Q + 1)  (constant skirt gain, peak gain = Q)
				let b0 =  Math.sin(w0)/2;
				let b1 =  0;
				let b2 = -Math.sin(w0)/2;
				let a0 =  1 + alpha;
				let a1 = -2*Math.cos(w0);
				let a2 =  1 - alpha;

				let out = (
					b0*sample + b1*this.in1 + b2*this.in2
					- a1*this.out1[i] - a2*this.out2[i]
				) / a0;

				this.out2[i] = this.out1[i];
				this.out1[i] = out;

				if(isNaN(out)) {
					out = 0;
					this.out1[i] = 0;
					this.out2[i] = 0;
				}

				output += A * out;
			}

			this.in2 = this.in1;
			this.in1 = sample;

			samples[k] = output;
		}
	}
}

let bank = new FormantBandPassBank(6);


function process(data, event) {
	for (var sample = 0; sample < data.length; sample++) {
		data[sample] = random();
	}

	bank.set(
		SampleRate,
		[800, 1150, 2900, 3900, 4950, 2*3900],
		[80, 90, 120, 130, 140, 150],
		[0, -6, -32, -20, -50, -15],

		// [350,2000,2800,3600,4950],
		// [60,100,120,150,200],
		// [0,-20,-15,-40,-56],
	);
	bank.forceUpdate();
	bank.process(data);

	var gain = decibelsToGain(control.decibel);
	for (var sample = 0; sample < data.length; sample++) {
		data[sample] = gain * clamp(data[sample]);
	}
}

function clamp(v) {
	if(v < -1) { return -1}
	if(v > 1) { return 1}
	return v
}

function draw(context, screenSize, deltaTime) {
	context.font = "30px monospace";
	var gain = decibelsToGain(control.decibel);
	context.fillText("gain " + gain.toFixed(3), 50, 50);
}

defaultsetup(process, draw);