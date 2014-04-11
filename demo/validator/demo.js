Q.on(window, 'load', function() {
	var specialRe = /[^\w\d]/
		// Took this from http://www.regular-expressions.info/email.html
		emailRe = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
		// This one was the first result on this search: http://regexlib.com/Search.aspx?k=phone&c=-1&m=5&ps=20
		phoneRe = /^(?:\([2-9]\d{2}\)\ ?|[2-9]\d{2}(?:\-?|\ ?))[2-9]\d{2}[- ]?\d{4}$/;
	
	document.forms['register'].onsubmit = function (e) {
		// We would handle form submit with ajax here; in this case we're just stopping the submit action
		return false;
	};
	
	// Just construct the Validator and configure the validators, it does the rest.
	new Q.Validator({
		form: 'register',
		submit: 'submit',
		validators: {
			// Validator for the username field.
			// Requirements: "must contain a lower and upper case letter and at least 1 number. Cannot contain special characters"
			username: function(value) {
				var valid = true;
				if (value.match(/\s/)) {
					valid = 'username cannot contain whitespace';
				} else if (!value.length) {
					valid = 'username is required';
				} else if (value.match(specialRe)) {
					valid = 'username cannot contain special characters';
				}
				return valid;
			},
			
			// Validator for the password field.
			// Requirements: "must contain at least 2 numbers and be 8 to 15 characters in length"
			password: function(value) {
				var valid = true,
					invalidMsg = 'password must contain at least one ';
				if (value.match(/\s/)) {
					valid = 'password cannot contain whitespace';
				} else if (value.length < 8 || value.length > 15) {
					valid = 'password must be between 8 and 15 characters in length';
					if (value.length) {
						valid += ' [' + value.length + ']';
					}
				} else if (!value.match(/[a-z]/)) {
					valid = invalidMsg + 'lowercase character';
				} else if (!value.match(/[A-Z]/)) {
					valid = invalidMsg + 'uppercase character';
				} else if (!value.match(/\d/)) {
					valid = invalidMsg + 'number';
				} else if (!value.match(specialRe)) {
					valid = invalidMsg + 'special character';
				}
				return valid;
			},
			
			// Validator for the email address field.
			email: function(value) {
				if (!value.match(emailRe)) {
					return 'must provide a valid email address';
				}
				return true;
			},
			
			// Validator for the phone number.
			phone: function(value) {
				if (!value.match(phoneRe)) {
					return 'must provide a valid phone number'
				}
				return true;
			}
		}
	});
});