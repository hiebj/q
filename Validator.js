// Q.Validator is a generalized JavaScript form validator using Q.
// @author hiebj
Q.Validator = Q.define({
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
	
	// HTML template for error messages
	msgTpl: '<span id="{msgId}" class="{msgCls}">{error}</span>',
	
	constructor: function Validator(config) {
		Q.copy(this, config);
		var form = this.form,
			submit = this.submit;
		this.id = Q.id(this.idPrefix);
		form = this.form = new Q(form);
		submit = this.submit = submit ? new Q(submit) : submit;
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
			handler = function(target, e) {
				this.validate(target);
			};
		for (var fieldName in this.validators) {
			field = this.form.dom[fieldName];
			if (field) {
				// Validate the field on change, keyup and blur. Overkill, but gets maximum coverage.
				Q(field).on({
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
	 * In this case we set an invalid class on the field and add an error message <span> to the parent node.
	 * This could be overridden on a case-by-case basis or rewritten to have a more general implementation.
	 * Tooltips would make an attractive alternative (and could be accomplished using CSS to position the <span> absolutely).
	 */
	setError: function(field, error) {
		var msgId = this.msgId(field),
			msgEl = Q(msgId);
		if (msgEl) {
			msgEl.clear().add(error);
			Q(field).addCls(this.invalidCls);
		} else {
			Q(field).addCls(this.invalidCls).up().add(Q.tpl(this.msgTpl, {
				msgId: msgId,
				msgCls: this.msgCls,
				error: error
			}));
		}
	},
	
	// Generates a unique message element id specific to a given field
	msgId: function(field) {
		return this.id + this.msgIdSuffix + field.name;
	},
	
	/* Clears the visual impact of the error from the view.
	 * In this case we remove the invalid class from the field and the linked error message element.
	 * This could be overridden on a case-by-case basis or rewritten to have a more general implementation.
	 */
	clearError: function(field) {
		var msgEl = Q(this.msgId(field));
		if (msgEl) {
			msgEl.removeSelf();
		}
		Q(field).removeCls(this.invalidCls);
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
		if (this.submit) {
			Q(this.submit).setDisabled(!valid);
		}
	}
});
