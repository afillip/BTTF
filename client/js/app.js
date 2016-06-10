// ****************************************

// HINT: Just leave this code alone. It's an inlined library for
// managing URL parsing easily.

// parseUri 1.2.2
// (c) Steven Levithan <stevenlevithan.com>
// MIT License
function parseUri(e){var a=parseUri.options,f=a.parser[a.strictMode?"strict":"loose"].exec(e),b={},c=14;while(c--)b[a.key[c]]=f[c]||"";b[a.q.name]={};b[a.key[12]].replace(a.q.parser,function(h,d,g){if(d)b[a.q.name][d]=g});return b}parseUri.options={strictMode:false,key:["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],q:{name:"queryKey",parser:/(?:^|&)([^&=]*)=?([^&]*)/g},parser:{strict:/^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,loose:/^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/}};

// ****************************************
AppModule = (function(){
  var $message;

      // HINT: this `init()` function should probably be put into
      // an `App` module.


    App.init = function() {
      $message = $("#message");
      $username = $("#loginUsername") //grabbing the username input811
      $userpass = $("#loginPassword") //grabbing the password input

      // When properly logged in, the page URL should look like:
      // http://localhost:8005/?sessionID=...

      var urlParts = parseUri(document.location.href.toString());



      // session ID in URL indicating we're logged in?
      if (urlParts.queryKey && urlParts.queryKey.sessionID) {     //validate if sessionID came back alright
            console.log("inside if statement")


        // **********************************
        // HINT: this code is related to the `buildReminderElement(..)`
        // utility further down in this file. Both of them should probably
        // move to a separate module for the reminder list.

        // pull out reminder element as template for new reminders
        var $reminder = $("#reminderList > .reminder:first-child");
        var $reminderTemplate = $reminder.clone();
        $reminder.remove();

        // HINT: Now, to make a new reminder, you can simply do:
        //   var $newReminderElem = $reminderTemplate.clone()
        //
        // ...and then fill in the appropriate data into its elements


        // **********************************

        // TODO: show dashboard

          //$("#loginBox").hide()
          //$("#dashboard").show()
          //$("#reminderList").show()
          //$("#addReminderModel").show()
          //$("#editReminderModel").show()

        // HINT: dashboard code should go into the `Dashboard` module
        // from `dashboard.js`
      }
      else {
        // TODO: show login screen

        $("#loginBtn").click(function(e){e.preventDefault(), ServerModule.login({username: $username.val(), password:$userpass.val()})})
          .then(function(response){

          })
          .catch(function(response){})



        // HINT: login screen code should probably be its own module
        //
        // ...or you could use prototypes/OLOO to organize the login
        // functionality.


        // **********************************

        // HINT: you can change the URL of the page by assigning:
        //    document.location.href = "..";
        //
        // This action will redirect/refresh the page, re-running
        // everything, so there's no need to put any code after it.
      }
    }
})()


// HINT: this makes sure to fire the `init()` function at DOM-ready.

$(document).ready(init);


// ****************************************





// ****************************************


// HINT: These next 3 functions are how you can easily display
// success and error messages.

function showMessage(msg) {
	$message.html(msg).show();
	console.log("showMessage")
}

function showError(err) {
	$message.addClass("error").html(err).show();
	console.log("showError")
}

function resetMessage() {
	$message.removeClass("error").hide();
}


// ****************************************


// HINT: use this utility to validate new or edited
// reminder data before sending to the server

// HINT: this will probably need to move to some other
// module.

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


// ****************************************


// HINT: These next two functions `reminderTimestamp(..)` and
// `formatReminderDateTime(..)` are related to `buildReminderElement(..)`
// below

// HINT: this will probably need to move to another module.

// parse a date/time pair in UTC as JS does, but then force
// it to behave as if it was specified in the local timezone
function reminderTimestamp(date,time) {
	var tz = (new Date()).toString().match(/\((.+)\)$/)[1];
	var utc = new Date(date + "T" + time);
	var str = utc.toUTCString();
	str = str.replace(/GMT$/,tz);
	return (new Date(str)).getTime();
}

// format a date and time in a friendlier way
function formatReminderDateTime(date,time) {
	var ts = new Date(reminderTimestamp(date,time));
	var hours = ts.getHours(), minutes = ts.getMinutes(), ampm;
	ampm = (hours > 11) ? "pm" : "am";
	hours = (hours + 11) % 12 + 1;
	return ts.toLocaleDateString() + " " +
		hours + ":" + (minutes < 10 ? "0" : "") + minutes + ampm;
}


// HINT: use this function to build the reminder DOM element for
// each reminder in the list. IT DOES NOT ADD IT to the DOM, though,
// only return it to you for you to add somewhere.

function buildReminderElement(reminder) {
	var $reminder = $reminderTemplate.clone();

	$reminder.attr("data-reminder-id",reminder.reminderID);
	$reminder.find(".description").text(reminder.description);
	$reminder.find(".datetime").text(
		formatReminderDateTime(reminder.date,reminder.time)
	);
	if (reminder.duration > 0) {
		$reminder.find(".duration > .count").text(reminder.duration);
	}
	else {
		$reminder.find(".duration").hide();
	}
	if (reminder.createdBy != null) {
		$reminder.find(".createdBy > .user").text(reminder.createdBy);
		$reminder.find(".buttons > .edit, .buttons > .delete").hide();
	}
	else {
		$reminder.find(".createdBy").hide();
		$reminder.find(".buttons > .ignore").hide();
	}
	if (reminder.invitees != "") {
		var invitees = reminder.invitees.join(", ");
		$reminder.find(".invitees > .users").text(invitees);
	}
	else {
		$reminder.find(".invitees").hide();
	}

	return $reminder;
}
