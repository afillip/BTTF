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
    init = function() {
      $message = $("#message");
      $username = $("#loginUsername"); //grabbing the username input811
      $userpass = $("#loginPassword"); //grabbing the password input

      var urlParts = parseUri(document.location.href.toString());

      // session ID in URL indicating we're logged in?
      if (urlParts.queryKey && urlParts.queryKey.sessionID) {     //validate if sessionID came back alright

        			$("#loginBox").hide()
        			$("#dashboard").show()
        			$("header > nav").show()


        ServerModule.reminders({"sessionID": urlParts.queryKey.sessionID})
        	.then(function(response){
        		for(var i =0; i< response.length; i++){
        			var listItem =	ReminderModule.buildReminderElement(response[i])
        			$("#reminderList").append(listItem)
        		}
        	})
        	.catch(function(error){
        		console.log(error)
        	});
        // HINT: dashboard code should go into the `Dashboard` module
        // from `dashboard.js`
      }
      else {
        // TODO: show login screen

        $("#loginBtn").click(function(e){
        	e.preventDefault(),
        	ServerModule.login({username: $username.val(), password:$userpass.val()})
        		.then(function(response){
        			showMessage("logged in")
        			 var sessionID = response
							document.location.href = "?sessionID="+ sessionID
        		})
        		.catch(function(error){
        			showError(error)
        		})
        })
      }

        // HINT: login screen code should probably be its own module
        //
        // ...or you could use prototypes/OLOO to organize the login
        // functionality.
    }
    $(document).ready(init);


	function showMessage(msg) {
		$message.html(msg).show();
	}
	function showError(err) {
		$message.addClass("error").html(err).show();
	}
	function resetMessage() {
		$message.removeClass("error").hide();
	}

})()

ReminderModule = (function(){
			var $reminder = $("#reminderList > .reminder:first-child");
      var $reminderTemplate = $reminder.clone();
      $reminder.remove();

      //clicking the new reminder button
		$("#NewReminder").click(function(e){
			e.preventDefault()
			$("#addReminderModal").show()
			$(".confirm").click(function(e){
				e.preventDefault()
				ServerModule.addReminder({sessionID:"d", reminderID:"h", description:"j", date:"d", time:"f", duration:"d"})
			})
		})

	//edit current reminder
		$(document.body).on("click", ".edit", function(e){
			e.preventDefault(),
			///var clickedEdit = $(this).closest('.reminder')
			console.log($(this).closest('.reminder'))
			$(this).closest('.reminder').css("background-color", "red")
			$("#editReminderModal").show()
			/*ServerModule.updateReminder({sessionID:sessionID})
				.then(function(response){
					$("#updateReminderModal").show()
				})*/
		});
		$(document.body).on("click",".delete",function(e){
			e.preventDefault(),
			console.log("delete?")
			alert("Are you sure you want to delete this reminder?")
		});






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


		function buildReminderElement(reminder,template) {
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

		return{
			buildReminderElement: buildReminderElement
		}
})()


