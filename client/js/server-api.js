/* HINT: All these functions should probably be organized
   as public methods on a `ServerAPI` module.
*/
window.ServerModule = function(){
	var ServerAPI = {};
};

// login( { username: .., password: .. } )
ServerAPI.login = function(data) {
	// HINT: you are only passing `data` into this function right now.
	// How will you know when the `success(..)` or `error(..)` signals,
	// commented out in the `$.ajax(..)` call below, are done and have
	// information you need? Will you need callbacks? Promises?
console.log("inside login!")

	return new Promise(function(resolve,reject){
			$.ajax("/api/login",{
				method: "POST",
				data: data,
				dataType: "text",
				cache: false,
				 success: function onSuccess(newSessionID){
				 		showMessage("successfull login")
				 	var sessionID = newSessionID;
				 				console.log(sessionID)
				 	resolve(sessionID)
				 },
				 error: function onError(jq,statusText,errText){
				 		reject(statusText) jq.responseText || errText },
			});
	})

}

// reminders( { sessionID: .. } )
function reminders(data) {
	$.ajax("/api/reminders",{
		method: "GET",
		data: data,
		dataType: "json",
		cache: false,
		// success: function onSuccess(resp){},
		// error: function onError(jq,statusText,errText){ jq.responseText || errText },
	});
}

// ignoreReminder( { sessionID: .., reminderID: .. } )
function ignoreReminder(data) {
	$.ajax("/api/reminder/ignore",{
		method: "POST",
		data: data,
		dataType: "text",
		cache: false,
		// success: function onSuccess(resp){},
		// error: function onError(jq,statusText,errText){ jq.responseText || errText },
	});
}

// deleteReminder( { sessionID: .., reminderID: .. } )
function deleteReminder(data) {
	$.ajax("/api/reminder/delete",{
		method: "POST",
		data: data,
		dataType: "text",
		cache: false,
		// success: function onSuccess(resp){},
		// error: function onError(jq,statusText,errText){ jq.responseText || errText },
	});
}

// addReminder( {
//    sessionID: ..,
//    description: ..,
//    date: ..,
//    time: ..,
//    duration: ..
// } )
function addReminder(data) {
	$.ajax("/api/reminder/add",{
		method: "POST",
		data: data,
		dataType: "text",
		cache: false,
		// success: function onSuccess(resp){},
		// error: function onError(jq,statusText,errText){ jq.responseText || errText },
	});
}

// addReminder( {
//    sessionID: ..,
//    reminderID: ..,
//    description: ..,
//    date: ..,
//    time: ..,
//    duration: ..
// } )
function updateReminder(data) {
	$.ajax("/api/reminder/update",{
		method: "POST",
		data: data,
		dataType: "text",
		cache: false,
		// success: function onSuccess(resp){},
		// error: function onError(jq,statusText,errText){ jq.responseText || errText },
	});
}

// inviteToReminder( { sessionID: .., reminderID: .., invite: .. } )
function inviteToReminder(data) {
	$.ajax("/api/reminder/invite",{
		method: "POST",
		data: data,
		dataType: "text",
		cache: false,
		// success: function onSuccess(resp){},
		// error: function onError(jq,statusText,errText){ jq.responseText || errText },
	});
}
