// Q.Validator is a generalized javascript form validator using Q.
// @author hiebj
Q.Validator = Q.extend({
	// The form this validator is responsible for managing
	form: undefined,
	// The submit button for the form, if there is any (in reality this could be any type of element).
	// This button's enabled/disabled state will be bound to the form's validity.
	submit: undefined,
	/* Validation functions, configured by the constructor, each mapped to the 'name' property of the target field.
	 * Each function should return an error message if the passed value is invalid.
	 * If this were a real application, we may prefer to return multiple error messages in an array.
	 * We would also want to create a nice set of basic validators for general reuse.
	 */
	validators: undefined,
	
	// Prefix to use when generating an id (unless one is given
	idPrefix: 'q-validator-',
	// CSS class to mark invalid fields.
	invalidCls: 'q-validator-invalid',
	// CSS class for error message elements.
	msgCls: 'q-validator-msg',
	// id suffix for error message elements.
	msgIdSuffix: '-msg-',
	// Default error message for validators that don't return a special message.
	defaultErrorMsg: 'This field is required',
	
	// Initialization function, called by the constructor
	init: function(config) {
		Q.apply(this, config);
		var form = this.form,
			submit = this.submit;
		this.id = Q.id(this.idPrefix);
		if (!Q.isDom(form)) {
			this.form = Q.get(form) || document.forms[form];
		}
		if (submit && !Q.isDom(submit)) {
			this.submit = Q.get(submit) || this.form[submit];
		}
		// Internal validation map, to keep track of valid fields (see #validate).
		// Used by #validateForm to check overall form validity.
		this.valid = {};
		// Bind event listeners to the configured form
		this.bindEvents();
		// Check initial form validity (this will disable the submit element if the form is not valid)
		this.validateForm();
	},
	
	// Bind listeners to every input with a configured validator.
	bindEvents: function() {
		var field,
			handler = function(e) {
				this.validate(Q.getTarget(e));
			};
		for (var fieldName in this.validators) {
			field = this.form[fieldName];
			if (field) {
				// Validate the field on change, keyup and blur. Overkill, but gets maximum coverage.
				Q.on(field, {
					keyup: handler,
					change: handler,
					blur: handler,
					scope: this
				});
			}
		}
	},
	
	// Dispatch validation function, called for any watched input field when it triggers validation.
	// Executes the appropriate validator for the field (mapped by name) and handles the results.
	validate: function(field) {
		var name = field.name,
			value = field.value,
			valid = this.validators[name](value);
		if (valid === false || typeof valid === 'string') {
			valid = valid || this.defaultErrorMsg;
			// Mark this field as invalid in the validity tracker.
			this.valid[name] = false;
			this.setError(field, valid);
		} else {
			// Mark this field as valid in the validity tracker.
			this.valid[name] = true;
			this.clearError(field);
		}
		// Check the validity of the whole form to determine whether to enable the submit control.
		this.validateForm();
	},
	
	/* Renders the visual impact of the error on the view.
	 * In this case we set an invalid class on the field and add an error message <span> to the parent <li> node.
	 * This could be overridden on a case-by-case basis or rewritten to have a more general implementation.
	 * In production, tooltips would make an attractive alternative.
	 */
	setError: function(field, error) {
		// TODO we need to use safe addCls/removeCls functions
		field.className = this.invalidCls;
		var msgId = this.msgId(field),
			msgEl = Q.get(msgId);
		if (!msgEl) {
			Q.add(field.parentNode, msgEl = Q.dom({
				tag: 'span',
				id: msgId,
				className: this.msgCls,
				items: error
			}));
		} else {
			msgEl.innerHTML = error;
		}
	},
	
	// Generates a message element id specific to a given field
	msgId: function(field) {
		return this.id + this.msgIdSuffix + field.name;
	},
	
	/* Clears the visual impact of the error from the view.
	 * In this case we remove the invalid class from the field and the linked error message element.
	 * This could be overridden on a case-by-case basis or rewritten to have a more general implementation.
	 */
	clearError: function(field) {
		var msgEl = Q.get(this.msgId(field));
		if (msgEl) {
			msgEl.parentNode.removeChild(msgEl);
		}
		field.className = '';
	},
	
	// Post-validation function to check if the overall validity of the form has changed.
	// The submit button will only be enabled when all the fields pass validation.
	validateForm: function() {
		var valid = true;
		for (var fieldName in this.validators) {
			if (!(valid = this.valid[fieldName])) {
				break;
			}
		}
		this.setSubmitEnabled(!!valid);
	},
	
	// Toggles the enabled/disabled status of the submit button.
	setSubmitEnabled: function(enabled) {
		if (this.submit) {
			this.submit.disabled = !enabled;
		}
	}
});