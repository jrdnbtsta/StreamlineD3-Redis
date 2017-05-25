class Streamline {
	constructor(sendFiles, port) {
		this.port = process.env.PORT || port;
		this.connections = [];
		this.sendFiles = sendFiles;
	}

	connect(func) {

		const express = require('express');
		const cluster = require('cluster');
		const net = require('net');
		const sio = require('socket.io');
		const sio_redis = require('socket.io-redis');

		const path = require('path');

		const num_processes = require('os').cpus().length;

		if (cluster.isMaster) {
			// This stores our workers. We need to keep them to be able to reference
			// them based on source IP address. It's also useful for auto-restart,
			// for example.
			let workers = [];

			// Helper function for spawning worker at index 'i'.
			let spawn = function (i) {
				workers[i] = cluster.fork();

				// Optional: Restart worker on exit
				workers[i].on('exit', function (code, signal) {
					console.log('respawning worker', i);
					spawn(i);
				});
			};

			// Spawn workers.
			for (let i = 0; i < num_processes; i++) {
				spawn(i);
			}

			// Helper function for getting a worker index based on IP address.
			// This is a hot path so it should be really fast. The way it works
			// is by converting the IP address to a number by removing non numeric
			// characters, then compressing it to the number of slots we have.
			//
			// Compared against "real" hashing (from the sticky-session code) and
			// "real" IP number conversion, this function is on par in terms of
			// worker index distribution only much faster.
			let worker_index = function (ip, len) {
				let s = '';
				for (let i = 0, _len = ip.length; i < _len; i++) {
					if (!isNaN(ip[i])) {
						s += ip[i];
					}
				}

				return Number(s) % len;
			};

			// Create the outside facing server listening on our port.
			let server = net.createServer({ pauseOnConnect: true }, function (connection) {
				// We received a connection and need to pass it to the appropriate
				// worker. Get the worker for this connection's source IP and pass
				// it the connection.
				let worker = workers[worker_index(connection.remoteAddress, num_processes)];
				worker.send('sticky-session:connection', connection);
			}).listen(this.port);
		} else {
			// Note we don't use a port here because the master listens on it for us.
			let app = new express();

			// Here you use middleware, attach routes, etc.

			this.sendFiles(app);

			let server = app.listen(0, 'localhost');
			let io = sio(server);

			// Tell Socket.IO to use the redis adapter. By default, the redis
			// server is assumed to be on localhost:6379. You don't have to
			// specify them explicitly unless you want to change them.
			io.adapter(sio_redis({ host: 'localhost', port: 6379 }));

			// Listen to messages sent from the master. Ignore everything else.
			process.on('message', function (message, connection) {
				if (message !== 'sticky-session:connection') {
					return;
				}

				// Emulate a connection event on the server by emitting the
				// event with the connection the master sent us.
				server.emit('connection', connection);

				connection.resume();
			});

			io.sockets.on('connection', (socket) => {
				let newSocket = socket;
				this.connections.push(socket);
				console.log('CONNECTED: %s SOCKETS CONNECTED', this.connections.length)

				socket.on('disconnect', (data) => {
					this.connections.splice(this.connections.indexOf(socket), 1);
					console.log('CONNECTED: %s SOCKETS CONNECTED', this.connections.length);
				});
				return func(socket);
			});
		}
	}

	line(socket, data, config) {

		let emitData = [];
		let emitConfig = {};
		let refConfig = {
			setWidth: 700,
			setHeight: 500,
			shiftXAxis: true,
			xDomainUpper: 20,
			xDomainLower: 0,
			yDomainUpper: 40,
			yDomainLower: 0,
			xTicks: 10,
			yTicks: 10,
			xScale: '',
			yScale: '',
			xLabel_text: '',
			yLabel_text: ''
		};

		for (let key in config) {
			refConfig[key] = config[key];
		}

		setInterval(() => {
			for (let i = 0; i < data.length; i += 1) {
				emitConfig = Object.assign({}, refConfig);

				emitConfig.xScale = data[i][emitConfig.xScale];
				emitConfig.yScale = data[i][emitConfig.yScale];

				emitData.push(emitConfig);
			}
			if (emitData.length >= emitConfig.xDomainUpper) {
				emitData = emitData.slice(-(emitConfig.xDomainUpper));
			}

			socket.emit('sendLineData', emitData);
			emitData = [];
		}, 1000);
	}

	pie(socket, data, config) {

		let emitData = [];
		let emitConfig = {};

		let refConfig = {

			setWidth: '',
			setHeight: '',
			category: '',
			count: ''
		};

		for (let key in config) {
			refConfig[key] = config[key];
		}

		setInterval(() => {
			for (let i = 0; i < data.length; i += 1) {

				emitConfig = Object.assign({}, refConfig);

				emitConfig.category = data[i][emitConfig.category];
				emitConfig.count = data[i][emitConfig.count];
				emitData.push(emitConfig);
			}

			socket.emit('sendPieData', emitData);
			emitData = [];
		}, 1000);
	}

	map(socket, data, config) {

		let emitData = [];
		let emitConfig = {};

		let refConfig = {
			setWidth: 700,
			setHeight: 700,
			latitude: '',
			longitude: '',
			propOne: '',
			propTwo: '',
			color: ''
		};

		for (let key in config) {
			refConfig[key] = config[key];
		}

		setInterval(() => {
			for (let i = 0; i < data.length; i += 1) {

				emitConfig = Object.assign({}, refConfig);
				emitConfig.latitude = data[i][emitConfig.latitude];
				emitConfig.longitude = data[i][emitConfig.longitude];
				emitConfig.propOne = data[i][emitConfig.propOne];
				emitConfig.propTwo = data[i][emitConfig.propTwo];
				emitData.push(emitConfig);
			}
			socket.emit('sendMapData', emitData);
			emitData = [];
		}, 1000);
	}

	scatter(socket, data, config) {
		let emitData = [];
		let emitConfig = {};

		let refConfig = {
			setWidth: 960,
			setHeight: 500,
			xDomainUpper: 20,
			xDomainLower: 0,
			yDomainUpper: 40,
			yDomainLower: 0,
			xTicks: 10,
			yTicks: 10,
			xScale: '',
			yScale: '',
			xLabel_text: '',
			yLabel_text: '',
			circle_text: '',
			id: '',
		};

		for (let key in config) {
			refConfig[key] = config[key];
		}

		setInterval(() => {
			for (let i = 0; i < data.length; i += 1) {
				emitConfig = Object.assign({}, refConfig);
				emitConfig.xScale = data[i][emitConfig.xScale];
				emitConfig.yScale = data[i][emitConfig.yScale];
				emitConfig.volume = data[i][emitConfig.volume];
				emitConfig.circle_text = data[i][emitConfig.circle_text];
				emitConfig.id = data[i][emitConfig.id];
				emitData.push(emitConfig);
			}
			socket.emit('sendScatterData', emitData);
			emitData = [];
		}, 1000);
	}

	wordCloud(socket, config) {

		let refConfig = {
			colors: '',
			colorDomain: '',
			font: '',
			fontSize: '',
			padding: '',
			rotate: '',
			height: '',
			width: '',
		};

		for (let key in config) {
			refConfig[key] = config[key];
		}

		let emitConfig = Object.assign({}, refConfig);

		socket.emit('send custom', emitConfig);

		socket.on('send audioText', (data) => {
			socket.emit('send audioData', data);
		});
	}

	bubbleGraph(socket, data, config) {

		let emitConfig = {};
		let emitData = [];

		let refConfig = {
			setWidth: 700,
			setHeight: 500,
			counter: '',
			text: '',
			volume: '',
			color: '',
		};

		for (let key in config) {
			refConfig[key] = config[key];
		}

		setInterval(() => {
			for (let i = 0; i < data.length; i += 1) {
				emitConfig = Object.assign({}, refConfig);

				emitConfig.text = data[i][emitConfig.text];
				emitConfig.volume = data[i][emitConfig.volume];
				emitData.push(emitConfig);
			}

			socket.emit('sendBubbleData', emitData);
			emitData = [];
		}, 1000);
	}

	bar(socket, data, config) {
		let emitConfig = {};
		let emitData = [];

		let refConfig = {
			setWidth: '',
			setHeight: '',
			shiftYAxis: true,
			xDomainUpper: 20,
			xDomainLower: 0,
			yDomainUpper: 100,
			yDomainLower: 0,
			xTicks: 10,
			yTicks: 50,
			xScale: '',
			volume: '',
			yLabel_text: '',
			label_text_size: 20,
			transition_speed: 1000,
			color: ['black']
		};

		for (let key in config) {
			refConfig[key] = config[key];
		}

		setInterval(() => {
			for (let i = 0; i < data.length; i += 1) {
				emitConfig = Object.assign({}, refConfig);

				emitConfig.xScale = data[i][emitConfig.xScale];
				emitConfig.volume = data[i][emitConfig.volume];
				emitConfig.id = 'rectangle-' + i;
				emitData.push(emitConfig);
			}
			socket.emit('sendBarData', emitData);
			emitData = [];
		}, 2000);
	}
}

module.exports = Streamline;