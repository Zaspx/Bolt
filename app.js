const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const errors = require("./structs/errors");
const { v4: uuidv4 } = require("uuid");
const { ApiException } = errors;
const port = 5595;
const version = "1.0";

//i know global isn't the best practice, but it works good enough
global.exchangeCodes = {},
global.clientTokens = {},
global.accessTokens = {},
global.parties = {},
global.invites = {},
global.pings = {},


(function () {
	"use strict";

	String.prototype.format = function () {
		const args = arguments[0] instanceof Array ? arguments[0] : arguments;
		return this.replace(/{(\d+)}/g, function (match, number) {
			return typeof args[number] != "undefined" ? args[number] : match;
		});
	};

	const app = express();


	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(bodyParser.json());
	app.set("etag", false);

	app.use("/", express.static("public"));

	fs.readdirSync(`${__dirname}/managers`).forEach(route => {
		require(`${__dirname}/managers/${route}`)(app);

	})

	app.use((req, res, next) => {
		next(new ApiException(errors.com.epicgames.common.not_found));
	})

	app.use((err, req, res, next) => {
		let error = null;

		if (err instanceof ApiException) {
			error = err;
		} else {
			const trackingId = req.headers["x-epic-correlation-id"] || uuidv4();
			error = new ApiException(errors.com.epicgames.common.server_error).with(trackingId);
			console.error(trackingId, err);
		}

		error.apply(res);
	});

	app.listen(port, () => {
		console.log(`Bolt v${version} is attached on port ${port}!`);
		console.log(`KEEP OPEN TO RUN DEV!!`);
	});

	module.exports = app;
}());
