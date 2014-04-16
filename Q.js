// Q is a very small JavaScript framework.
// @author hiebj
(function() {
	var extending = false;
	function Q() {
		if (!extending) throw 'Thou shalt not instantiate the Q';
	}
	// Property merging function
	function apply(o1, o2) {
		if (o1 && o2) {
			for (var property in o2) {
				o1[property] = o2[property];
			}
		}
		return o1;
	};
	Q.extend = function(definition) {
		var Superclass = this,
			Subclass = function Object() {
				if (!extending && this.init) {
					this.init.apply(this, arguments);
				}
			};
		extending = true;
		Subclass.prototype = new Superclass();
		extending = false;
		apply(Subclass.prototype, definition);
		Subclass.prototype.$super = Superclass.prototype;
		// Because the prototype's constructor is still Superclass.prototype.constructor at this point
		Subclass.prototype.constructor = Subclass;
		Subclass.extend = Superclass.extend;
		return Subclass;
	};
	// TODO Q.constructor.mixin(target)
	// TODO Q.Q() or Q.inherit() that returns an extendable, mixable wrapper around a non-Q javascript object
	// TODO safe addCls and removeCls functions
	Q = Q.extend({
		apply: apply,
		
		extend: function(definition) {
			return Q.$super.constructor.extend(definition);
		},
		
		isQ: function(o) {
			return o instanceof Q.$super.constructor;
		},
		
		intercept: function(target, interceptors) {
			target = typeof target === 'function' ? target.prototype : target;
			for (var intercept in interceptors) {
				// interceptor, intercepted, and our proxy function need to be declared in their own scope to prevent conflict
				(function() {
					var interceptor = interceptors[intercept],
						intercepted = target[intercept];
					target[intercept] = function() {
						this.$proceed = function() {
							return intercepted.apply(this, arguments);
						};
						var returnValue = interceptor.apply(this, arguments);
						delete this.$proceed;
						return returnValue;
					};
				})();
			}
		},
		
		/* Cross-browser event binder.
		 * Can assign multiple listeners at once by passing an object for the 'event' parameter.
		 * The format for a multiple assignment object is as follows: {
		 *		eventname1: handlerFn1,
		 *		eventname2: handlerFn2,
		 *		scope: scope1and2,
		 *		eventname3: {
		 *			fn: handlerFn3,
		 *			scope: scope3
		 *		}
		 * }
		 */
		on: function (element, event, handler, scope) {
			if (typeof event === 'object') {
				// Batch of events passed as a mapping object
				for (var eventName in event) {
					handler = event[eventName].fn || event[eventName];
					if (typeof handler === 'function') {
						scope = event[eventName].scope || event.scope;
						Q.on(element, eventName, handler, scope);
					}
				}
			} else {
				// Single event binding
				// Wrapper handler to execute the passed handler in the given scope
				var scopingHandler = function(e) {
					scope = scope || Q.getTarget(e);
					return handler.apply(scope, arguments);
				};
				if (element.addEventListener) {
					// IE-style events
					element.addEventListener(event, scopingHandler, false);
				} else {
					// Everything else
					element.attachEvent('on' + event, scopingHandler);
				}
			}
		},
		
		// Cross-browser utility to retrieve the target of a fired event.
		getTarget: function (e) {
			e = /* Everything else */ e || /* IE */ window.event;
			return /* Everything else */ e.target || /* IE */ e.srcElement;
		},
		
		get: function(id) {
			return document.getElementById(id);
		},
		
		id: function(prefix) {
			var idSeq = this.idSeq = this.idSeq || {};
			idSeq[prefix] = idSeq[prefix] || 0;
			return prefix + idSeq[prefix]++;
		},
		
		isDom: function(el) {
			return el instanceof HTMLElement;
		},
		
		isEmpty: function(value) {
			return (value === null) || 
					(value === undefined) ||
					(value === '') ||
					(Q.isArray(value) && value.length === 0);
		},
		
		isArray: function(value) {
			if ('isArray' in Array) {
				return Array.isArray(value);
			} else {
				return toString.call(value) === '[object Array]';
			}
        },
		
		each: function(array, fn, scope) {
			var i;
			for (i = 0;i < array.length; i++) {
				if (fn.call(scope, array[i]) === false) {
					return i;
				}
			}
			return true;
		},
		
		/* Convenience builder for creating entire DOM structures from javascript object definitions.
		 * The format for an argument to this function is as follows: {
		 *		tag,		The name of the element to create (e.g. 'div' or 'span')
		 *		...,		Any number of HTML attributes to apply to the created element (e.g. className, id, or a style object)
		 *		items		A collection of children to create or append recursively (either descriptor objects or HTMLElement instances)
		 *	}
		 */
		dom: function(config) {
			var tag = config.tag || config,
				items = config.items,
				listeners = config.listeners,
				el = document.createElement(tag);
			// Clone the config so we don't cause side effects
			config = Q.apply({}, config);
			delete config.tag;
			delete config.items;
			delete config.listeners;
			Q.apply(el, config);
			Q.add(el, items);
			if (listeners) {
				Q.on(el, listeners);
			}
			return el;
		},
		
		/* A utility for adding children to an existing DOM node.
		 * It enhances native JS by allowing a collection of nodes to be appended at once, and also by allowing node *definitions* in addition to actual node instances.
		 * Any passed node definitions will be created into actual HTMLElement instances by invoking the #dom function.
		 * Returns an array containing the added HTMLElements, if any.
		 */
		add: function(parent, items, index) {
			var added = [],
				before;
			if (items) {
				if (!Q.isArray(items)) {
					items = [ items ];
				}
				before = isNaN(index) ? false : parent.childNodes[index];
				Q.each(items, function(item) {
					if (!Q.isDom(item)) {
						if (typeof item === 'string') {
							item = document.createTextNode(item);
						} else if (typeof item ==='object') {
							item = Q.dom(item);
						}
					}
					if (before) {
						parent.insertBefore(item, before);
					} else {
						parent.appendChild(item);
					}
					added.push(item);
				});
			}
			return added;
		},
		
		// Convenience function to clear all children from a given node
		clear: function(parent) {
			while (parent.hasChildNodes()) {
				parent.removeChild(parent.lastChild);
			}
		},
	
		/* Convenience function to make simple AJAX requests slightly less painful.
		 * The format for an argument to this function is as follows: {
		 *		method,		Request method, e.g. GET PUT POST DELETE. Defaults to GET
		 *		url,		Target for the request
		 *		params,		URL parameters (query string parameters) to append to the URL
		 *		body,		Body parameter passed directly to XMLHttpRequest.send()
		 *		json,		Object that will be converted to a JSON string and sent in the message body
		 *		callback,	Callback to be executed when the request is complete (readyState = 4).
		 *					The parameter to the callback will contain the following properties of the XMLHttpRequest: {
		 *						responseText,
		 *						responseXML,
		 *						status,
		 *						statusText
		 *					}
		 *		scope		'this' reference to use in the callback
		 */
		ajax: function(request) {
			var xmlhttp = new XMLHttpRequest(),
				body = request.json ? JSON.stringify(request.json) : request.body,
				url = Q.urlAppend(request.url, request.params);
			xmlhttp.open(request.method || 'GET', url, true);
			xmlhttp.onreadystatechange = function() {
				if (xmlhttp.readyState === 4 && request.callback) {
					request.callback.call(request.scope || this, {
						responseText: xmlhttp.responseText,
						responseXML: xmlhttp.responseXML,
						status: xmlhttp.status,
						statusText: xmlhttp.statusText
					});
				}
			};
			xmlhttp.send(body);
			return xmlhttp;
		},
		
		urlAppend: function(url, params) {
			if (typeof params === 'object') {
				for (var param in params) {
					url = Q.urlAppend(url, param + '=' + params[param]);
				}
			} else if (!Q.isEmpty(params)) {
				url += (url.indexOf('?') !== -1 ? '&' : '?') + params;
            }
            return url;
		},
		
		/* Convenience function to make simple JSONP requests.
		 * The format for an argument to this function is as follows: {
		 *		url,			Target for the request
		 *		params,			URL parameters (query string parameters) to append to the URL
		 *		callbackParam,	JSONP callback parameter name to use when creating the request.
		 *						If this parameter is included, a temporary handler will be generated for the request, which will relay to the passed 'callback'.
		 *						If this parameter is missing, the 'callback' and 'scope' parameters will be ignored, and it is assumed that an appropriate handler is already set up and passed to the request in the 'params' object.
		 *		callback,		Callback to be executed when the request is complete (when the <script> loads).
		 *						The callback will be relayed the same arguments passed to the generated JSONP handler.
		 *		scope			'this' reference to use in the callback
		 */
		jsonp: function(request) {
			var params = Q.apply({}, request.params),
				callbackParam = request.callbackParam,
				handlerId,
				script;
			if (!Q.isEmpty(callbackParam)) {
				handlerId = Q.id('_jsonp');
				Q[handlerId] = function() {
					request.callback.apply(request.scope || this, arguments);
					script.parentNode.removeChild(script);
					delete Q[handlerId];
				};
				params[callbackParam] = 'Q.' + handlerId;
			}
			script = Q.add(document.head, {
				tag: 'script',
				type: 'text/javascript',
				src: Q.urlAppend(request.url, params)
			})[0];
			return script;
		}
	});
	// Mask the Q's constructor
	var proto = Q.prototype;
	Q = this.Q = new Q();
	proto.constructor = proto.$super.constructor;
})();