var URL = require("url");
var PATH = require("path");
var HTTP = require("http");
var node_static = require("node-static");
var server = new HTTP.Server(handleRequest);
var client = new node_static.Server(PATH.join(__dirname,"..","client"));
var host = "localhost";
var port = 8005;
var users = [];
var reminders = [];
var nextReminderID;

// hard-coding data for exercise purposes only
setupDemoData();

server.listen(port,host);

console.log("Started server at: http://" + host + ":" + port);


// *************************

function handleRequest(req,res) {
	if (req.method == "POST") {
		collectRequestData(req,function onComplete(){
			handlePOST(req,res);
		});
	}
	else if (req.method == "GET") {
		handleGET(req,res);
	}
}

function handlePOST(req,res) {
	var userID;

	if (req.url == "/api/login") {
		if (req.data && req.data.username && req.data.password) {
			for (var i=0; i<users.length; i++) {
				if (
					users[i].username == req.data.username &&
					users[i].password == req.data.password
				) {
					return responseSuccess(res,users[i].sessionID);
				}
			}
		}
	}
	else if (req.data && (userID = findUserBySession(req.data.sessionID))) {
		if (req.url == "/api/reminder/add") {
			if (validateReminderData(req.data)) {
				reminders.push({
					reminderID: nextReminderID,
					createdBy: userID,
					description: req.data.description,
					date: req.data.date,
					time: req.data.time,
					duration: req.data.duration,
					invitees: [],
				});
				return responseSuccess(res,String(nextReminderID++));
			}
		}
		if (req.url == "/api/reminder/update") {
			var reminderIdx = findReminderByID(req.data.reminderID);

			// only updating a user's own reminder?
			if (reminderIdx !== false &&
				reminders[reminderIdx].createdBy == userID &&
				validateReminderData(req.data)
			) {
				reminders[reminderIdx].description = req.data.description;
				reminders[reminderIdx].date = req.data.date;
				reminders[reminderIdx].time = req.data.time;
				reminders[reminderIdx].duration = req.data.duration;
				return responseSuccess(res);
			}
		}
		else if (req.url == "/api/reminder/invite") {
			var reminderIdx = findReminderByID(req.data.reminderID);

			// only inviting to a user's own reminder?
			if (reminderIdx !== false &&
				userID == reminders[reminderIdx].createdBy &&
				"invite" in req.data
			) {
				var inviteeUpdateSuccessful = true;
				var invitees = String(req.data.invite)
					.split(/\s*,\s*/)
					.filter(function skipEmpty(invitee){
						return invitee && !(/^[\s]*$/.test(invitee));
					});

				// remove existing invitees, if any
				for (var i=0; i<reminders[reminderIdx].invitees.length; i++) {
					var currentInviteeUsername = findUsernameByID(reminders[reminderIdx].invitees[i]);

					// existing invitee removed from current invitee list?
					if (currentInviteeUsername !== false &&
						!~invitees.indexOf(currentInviteeUsername)
					) {
						// remove current invitee, keep index in same spot
						// for next iteration
						reminders[reminderIdx].invitees.splice(i,1);
						i--;
					}
				}

				// add new invitees
				for (var i=0; i<invitees.length; i++) {
					var inviteeUserID = findUserByUsername(invitees[i]);

					// user not inviting themself, and other user not already invited?
					if (inviteeUserID !== false && inviteeUserID != userID) {
						if (!~reminders[reminderIdx].invitees.indexOf(inviteeUserID)) {
							reminders[reminderIdx].invitees.push(inviteeUserID);
						}
					}
					else {
						inviteeUpdateSuccessful = false;
					}
				}

				var currentInviteeList = reminders[reminderIdx].invitees.map(findUsernameByID).join(",");

				// were all of the invites/de-invites successful?
				if (inviteeUpdateSuccessful) {
					return responseSuccess(res,currentInviteeList || ",");
				}
				else {
					return responseError(res,currentInviteeList || ",");
				}
			}
		}
		else if (req.url == "/api/reminder/delete") {
			var reminderIdx = findReminderByID(req.data.reminderID);

			// only deleting a user's own reminder?
			if (reminderIdx !== false &&
				userID == reminders[reminderIdx].createdBy
			) {
				// remove reminder from list
				reminders.splice(reminderIdx,1);
				return responseSuccess(res);
			}
		}
		else if (req.url == "/api/reminder/ignore") {
			var reminderIdx = findReminderByID(req.data.reminderID);

			if (reminderIdx !== false) {
				var inviteeIdx = reminders[reminderIdx].invitees.indexOf(userID);

				// was user an invitee of this reminder?
				if (inviteeIdx !== -1) {
					// remove user from invitee list
					reminders[reminderIdx].invitees.splice(inviteeIdx,1);
					return responseSuccess(res);
				}
			}
		}
	}

	return responseError(res);
}

function validateReminderData(data) {
	if ("description" in data && "date" in data &&
		"time" in data && "duration" in data
	) {
		if (data.description.length < 1 || data.description.length > 100) return false;
		if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) return false;
		if (!/^\d{2}:\d{2}:\d{2}$/.test(data.time)) return false;
		if (isNaN(Date.parse(data.date + "T" + data.time))) return false;
		if (!/^\d+$/.test(String(data.duration)) ||
			data.duration < 0 || data.duration > 360
		) return false;

		return true;
	}

	return false;
}

function handleGET(req,res) {
	if (/^\/api\/reminders(?:\b|$)/.test(req.url)) {
		req.data = URL.parse(req.url,/*parseQueryString=*/true).query;
		var userID;

		if (req.data && req.data.sessionID &&
			(userID = findUserBySession(req.data.sessionID))
		) {
			var rems = [];
			for (var i=0; i<reminders.length; i++) {
				if (reminders[i].createdBy == userID) {
					var rem = cloneObj(reminders[i]);
					rem.createdBy = null;
					rems.push(rem);
				}
				else if (~reminders[i].invitees.indexOf(userID)) {
					rems.push(cloneObj(reminders[i]));
				}
			}

			for (var i=0; i<rems.length; i++) {
				if (rems[i].createdBy) {
					rems[i].createdBy = findUsernameByID(rems[i].createdBy);
				}
				for (var j=0; j<rems[i].invitees.length; j++) {
					rems[i].invitees[j] = findUsernameByID(rems[i].invitees[j]);
				}
			}

			res.writeHead(200,{
				"Content-Type": "application/json",
				"Cache-Control": "no-cache",
				"Pragma": "no-cache",
				"Expires": 0,
			});
			res.end(JSON.stringify(rems));
		}
		else {
			return responseError(res);
		}
	}
	else {
		client.serve(req,res);
	}
}

function collectRequestData(req,cb) {
	var body = "";

	req.on("data",function onData(data){
		body += data;
	});
	req.on("end",function onEnd(){
		req.data = URL.parse("/foo?" + body,/*parseQueryString=*/true).query;
		cb();
	});
}

function responseError(res,text) {
	res.writeHead(500);
	res.end(text || "");
}

function responseSuccess(res,text) {
	res.writeHead(200,{ "Content-Type": "text/plain" });
	res.end(text || "");
}

function findUserBySession(sessionID) {
	for (var i=0; i<users.length; i++) {
		if (users[i].sessionID == sessionID) {
			return users[i].userID;
		}
	}
	return false;
}

function findUsernameByID(userID) {
	for (var i=0; i<users.length; i++) {
		if (users[i].userID == userID) {
			return users[i].username;
		}
	}
	return false;
}

function findUserByUsername(username) {
	for (var i=0; i<users.length; i++) {
		if (users[i].username == username) {
			return users[i].userID;
		}
	}
	return false;
}

function findReminderByID(reminderID) {
	for (var i=0; i<reminders.length; i++) {
		if (reminders[i].reminderID == reminderID) {
			return i;
		}
	}
	return false;
}

// quick and dirty deep object clone (only for JSON-safe data)
function cloneObj(obj) {
	return JSON.parse(JSON.stringify(obj));
}

function zeroPad(num) {
	return ((num < 10) ? "0" : "") + num;
}

function pickDate(fromToday) {
	var today = new Date();
	today.setDate(today.getDate() + fromToday);
	return today.getFullYear() + "-" + zeroPad(today.getMonth() + 1) + "-" + zeroPad(today.getDate());
}

function setupDemoData() {
	users = [
		{
			userID: 1,
			username: "johnabark",
			password: "fooManchoo13",
			sessionID: "aE5LbmxlcmpOU0lVTig4bjIzcmxrd25lbHJrYTtsZGZrYXNkYyBwNG1mYWk0ZmxrdzRhIDtsazRsdG07YWw0bTQ",
		},
		{
			userID: 2,
			username: "sally-mercer",
			password: "Bloom49",
			sessionID: "dW5pdW5pdTRucHc0bmZraiBuIFVLTlpLVU5BVUtETkZMSi4sd2Ugd2Vmd2tlZm1sa2F3ZmUwNGltb2s0OTAzNDgwMzRuZ2tsZHNmbSBkZg",
		},
		{
			userID: 3,
			username: "brand.pop",
			password: "cee3$$Poh",
			sessionID: "ajRucjM0aXRuMzRvdXRubzNuNXQ7d2xyO2thbXNkbGFrc2RmcGFpbnJmYXdlbWYsd2UuLG1hbHNka2Ztb2lyZm1sYWttZmFzLmQsZiBhc2QuZi4uc2RmYXMuZGtmYWs",
		},
	];

	reminders = [
		{
			reminderID: 1,
			createdBy: 1,
			description: "A simple gathering of friends at my place",
			date: pickDate(3),
			time: "13:45:00",
			duration: 75,
			invitees: [3,2],
		},
		{
			reminderID: 2,
			createdBy: 1,
			description: "Phonecall with boss",
			date: pickDate(3),
			time: "11:30:00",
			duration: 30,
			invitees: [],
		},
		{
			reminderID: 3,
			createdBy: 1,
			description: "Wake-up",
			date: pickDate(6),
			time: "06:50:00",
			duration: 0,
			invitees: [],
		},
		{
			reminderID: 4,
			createdBy: 2,
			description: "Client meeting",
			date: pickDate(5),
			time: "14:00:00",
			duration: 60,
			invitees: [3],
		},
		{
			reminderID: 5,
			createdBy: 2,
			description: "Lunch",
			date: pickDate(4),
			time: "11:45:00",
			duration: 60,
			invitees: [1],
		},
		{
			reminderID: 6,
			createdBy: 2,
			description: "Leave for flight",
			date: pickDate(-2),
			time: "10:30:00",
			duration: 1,
			invitees: [],
		},
	];

	nextReminderID = reminders[reminders.length-1].reminderID + 1;
}
