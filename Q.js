// Q is a very small JavaScript framework.
// @author hiebj
(function() {
	function copy(to, from) {
		return copyIf(to, from, function() {
			return true;
		});
	}
	
	function copyIf(to, from, condition, scope) {
		if (to && from) {
			condition = condition || function(property, to, from) {
				return to[property] === undefined;
			};
			for (var property in from) {
				if (condition.call(scope || this, property, to, from)) {
					to[property] = from[property];
				}
			}
		}
		return to;
	}
	
	function isDom(o) {
		return o instanceof Node || o === window;
	}
	
	function isEmpty(value) {
		return (value === null) || 
				(value === undefined) ||
				(value === '') ||
				(isArray(value) && value.length === 0);
	}
	
	function isArray(value) {
		if ('isArray' in Array) {
			return Array.isArray(value);
		} else {
			return toString.call(value) === '[object Array]';
		}
	}
	
	function each(array, fn, scope) {
		array = toArray(array);
		for (var i = 0; i < array.length; i++) {
			if (fn.call(scope || this, array[i], array) === false) {
				return i;
			}
		}
		return true;
	}
	
	function toArray(value) {
		if (!isArray(value)) {
			// TODO copy any iterable into a new array, not just NodeList
			if (value instanceof NodeList) {
				var copy = [];
				for (var i = 0; i < value.length; i++) {
					copy[i] = value[i];
				}
				value = copy;
			} else {
				value = [ value ];
			}
		}
		return value;
	}
	
	function define(definition) {
		var Superclass = definition.extend || Object,
			Subclass = definition.constructor,
			$proto = create(Superclass),
			$mixins = definition.mixins,
			$statics = definition.statics;
		Superclass = typeof Superclass === 'function' ? Superclass : Superclass.constructor;
		Subclass = typeof Subclass === 'function' ? Subclass : createConstructor(Subclass);
		// Clone the definition so we can manipulate it
		definition = copyIf({
			// Keep a reference to the original definition in the prototype
			$def: definition,
			$super: Superclass.prototype,
			constructor: Subclass,
		}, definition);
		delete definition.mixins;
		delete definition.statics;
		copy($proto, definition);
		Subclass.prototype = $proto;
		mixin(Subclass, $mixins);
		if ($statics) {
			// Never override an existing property on a function (e.g. prototype, name, apply, call)
			copyIf(Subclass, $statics).$statics = $statics;
		}
		return Subclass;
	}
	
	function create(o) {
		return typeof o !== 'function' ? o : Object.create ? Object.create(o.prototype) : new o();
	}
	
	function createConstructor(name) {
		name = typeof name === 'string' ? name : 'Object';
		if (name.match(/[^\w\d\$]/)) throw 'Constructor names cannot contain special characters: ' + name + '()';
		// Using eval to define a properly named function
		return eval('function ' + name + '(){defaultConstructor.apply(this,arguments);}');
	}
	
	function defaultConstructor() {
		if (this.$super) {
			this.$super.constructor.apply(this, arguments);
		}
	}
	
	function mixin(Subclass, mixins) {
		if (mixins) {
			if (!isArray(mixins)) {
				mixins = [ mixins ];
			}
			each(mixins, function(Mixin) {
				var mixin = create(Mixin);
				mixin.$mixins = {};
				copyIf(Subclass.prototype, mixin).$mixins[Mixin] = mixin;
			});
		}
	}
	
	// Cross-browser utility to retrieve the target of a fired event.
	function getEventTarget(e) {
		e = /* Everything else */ e || /* IE */ window.event;
		return /* Everything else */ e.target || /* IE */ e.srcElement;
	}
	
	// TODO defer/delay
	
	var flyweight,
		renderTarget;
	window.Q = define({
		constructor: function Q(dom) {
			var q = this instanceof Q ? this : (flyweight || (flyweight = new Q()));
			if (Q.isDom(dom)) {
				q.dom = dom;
			} else if (dom instanceof Q) {
				q.dom = dom.dom;
			} else {
				q.dom = document.getElementById(dom);
			}
			// TODO allow single select via selector
			if (!q.dom) {
				// When called as a constructor, this function will always return the new instance.
				// If they are using it to access the flyweight, this function will return null if no matching element is found.
				q = null;
			}
			return q;
		},
		
		isFly: function() {
			return this === flyweight;
		},
		
		// returns new Q(this.dom)
		clone: function() {
			return new this.constructor(this.dom);
		},
		
		// returns [HTMLElement]
		query: function(selector) {
			return this.dom.childNodes;
		},
		
		// Traversals all return the flyweight element wrapped around the target
		down: function(selector) {
			return this.first();
		},
		
		first: function() {
			var dom = this.dom.firstChild;
			return dom ? Q(dom) : dom;
		},
		
		last: function() {
			var dom = this.dom.lastChild;
			return dom ? Q(dom) : dom;
		},
		
		up: function(selector) {
			return Q(this.dom.parentNode);
		},
		
		next: function(selector) {
			var dom = this.dom.nextSibling;
			return dom ? Q(dom) : dom;
		},
		
		prev: function(selector) {
			var dom = this.dom.previousSibling;
			return dom ? Q(dom) : dom;
		},
		
		// elements: []/Q/HTMLElement/String (HTML)
		// before: Q/HTMLElement/Number (index)
		add: function(elements, before) {
			var dom = this.dom;
			if (elements) {
				before = before instanceof Q ? before.dom : before;
				before = Q.isDom(before) ? before : (isNaN(before) ? false : dom.childNodes[before]);
				Q.each(elements, function(element) {
					if (element instanceof Q) {
						element = element.dom;
					}
					if (!Q.isDom(element)) {
						// Execute add recursively because Q.dom() returns an array
						this.add(Q.dom(element), before);
					} else {
						if (before) {
							dom.insertBefore(element, before);
						} else {
							dom.appendChild(element);
						}
					}
				}, this);
			}
			return this;
		},
		
		// elements: []/Q/HTMLElement
		remove: function(elements) {
			var dom = this.dom;
			if (elements) {
				Q.each(elements, function(element) {
					if (element instanceof Q) {
						element = Q.dom;
					}
					dom.removeChild(element);
				});
			}
			return this;
		},
		
		removeSelf: function() {
			this.dom.parentNode.removeChild(this.dom);
			return this;
		},
		
		clear: function() {
			return this.remove(this.dom.childNodes);
		},
		
		/* Cross-browser event binder.
		 * Handler functions are executed with two parameters:
		 *		target,		The HTMLElement target of the event
		 *		e,			The browser Event object
		 *
		 * This function can assign multiple listeners at once by passing a compound object as the only parameter.
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
		on: function (event, handler, scope) {
			if (typeof event === 'object') {
				// Batch of events passed as a mapping object
				for (var eventName in event) {
					handler = event[eventName].fn || event[eventName];
					if (typeof handler === 'function') {
						scope = event[eventName].scope || event.scope;
						this.on(eventName, handler, scope);
					}
				}
			} else {
				// Single event binding
				// Wrapper handler to execute the passed handler in the given scope
				var scopingHandler = function(e) {
						var target = getEventTarget(e);
						scope = scope || target;
						return handler.call(scope, target, e);
					},
					dom = this.dom;
				if (dom.addEventListener) {
					// IE-style events
					dom.addEventListener(event, scopingHandler, false);
				} else {
					// Everything else
					dom.attachEvent('on' + event, scopingHandler);
				}
			}
			return this;
		},
		
		/* TODO un
		un: function() {
			return this;
		},
		*/
		
		addCls: function(cls) {
			var className = this.dom.className || '';
			if (className.indexOf(cls) === -1) {
				if (className.length) {
					className += ' ';
				}
				className += cls + ' ';
			}
			className = className.replace(/\s{2,}/g, ' ');
			this.dom.className = className;
			return this;
		},
		
		removeCls: function(cls) {
			var className = this.dom.className || '';
			className = className.replace(cls, '');
			className = className.replace(/\s{2,}/g, ' ');
			this.dom.className = className;
			return this;
		},
		
		is: function(selector) {
			return true;
		},
		
		show: function() {
			return this.setVisible(true);
		},
		
		hide: function() {
			return this.setVisible(false);
		},
		
		// TODO visibility mode support (display, visibility, offsets)
		setVisible: function(visible) {
			this.dom.hidden = !visible;
			return this;
		},
		
		enable: function() {
			return this.setDisabled(false);
		},
		
		disable: function() {
			return this.setDisabled(true);
		},
		
		setDisabled: function(disabled) {
			this.dom.disabled = !!disabled;
			return this;
		},
		
		focus: function() {
			this.dom.focus();
			return this;
		},
		
		// TODO box management
		
		statics: {
			copy: copy,
			copyIf: copyIf,
			isDom: isDom,
			isEmpty: isEmpty,
			isArray: isArray,
			each: each,
			toArray: toArray,
			define: define,
			mixin: mixin,
			
			intercept: function(target, interceptors) {
				target = typeof target === 'function' ? target.prototype : target;
				for (var intercept in interceptors) {
					// interceptor, intercepted, and our proxy function need to be declared in their own scope to prevent conflict
					(function() {
						var interceptor = interceptors[intercept],
							$intercepted = target[intercept];
						target[intercept] = function() {
							this.$proceed = function() {
								delete this.$proceed;
								return $intercepted.apply(this, arguments);
							};
							var returnValue = interceptor.apply(this, arguments);
							delete this.$proceed;
							return returnValue;
						};
						target[intercept].$intercepted = $intercepted;
					})();
				}
			},
			
			query: function(selector, root) {
				return Q(root || document.body).query(selector);
			},
			
			id: function(prefix) {
				var idSeq = this.idSeq = this.idSeq || {};
				idSeq[prefix] = idSeq[prefix] || 0;
				return prefix + idSeq[prefix]++;
			},
			
			tpl: function(tpl, params) {
				if (Q.isArray(tpl)) {
					tpl = tpl.join('');
				}
				if (tpl && params && typeof tpl === 'string') {
					tpl = tpl.replace(/\{.*?\}/g, function(matched) {
						// Cut off the matched brackets {}
						matched = matched.substring(1, matched.length - 1);
						return params[matched];
					});
				}
				return tpl;
			},
			
			dom: function(html) {
				renderTarget = renderTarget || document.createElement('div');
				renderTarget.innerHTML = html;
				return renderTarget.childNodes;
			},
			
			on: function(selector, event, handler, scope) {
				console.log('global on', arguments.callee.caller);
				Q.each(Q.query(selector), function(el) {
					el.on(event, handler, scope);
				});
			},
			
			/* Convenience function to make simple AJAX requests.
			 * The following properties are recognized on the passed request object:
			 *		method,		Request method, e.g. GET PUT POST DELETE. Defaults to GET
			 *		url,		Target for the request
			 *		params,		URL parameters (query string parameters) to append to the URL
			 *		body,		Body parameter passed directly to XMLHttpRequest.send()
			 *		json,		Object that will be converted to a JSON string and sent in the message body
			 *		callback,	Callback to be executed when the request is complete (readyState = 4). The callback will be passed the XMLHttpRequest object as the only parameter.
			 *		scope		'this' reference to use in the callback
			 */
			ajax: function(request) {
				var xmlhttp = new XMLHttpRequest(),
					body = request.json ? JSON.stringify(request.json) : request.body,
					url = Q.urlAppend(request.url, request.params);
				xmlhttp.open(request.method || 'GET', url, true);
				xmlhttp.onreadystatechange = function() {
					if (xmlhttp.readyState === 4 && request.callback) {
						request.callback.call(request.scope || this, xmlhttp);
					}
				};
				xmlhttp.send(body);
				return xmlhttp;
			},
			
			/* Convenience function to make simple JSONP requests.
			 * The following properties are recognized on the passed request object:
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
				var params = Q.copy({}, request.params),
					callbackParam = request.callbackParam,
					handlerId,
					script;
				if (!Q.isEmpty(callbackParam)) {
					handlerId = Q.id('_jsonp');
					Q.jsonp[handlerId] = function() {
						request.callback.apply(request.scope || this, arguments);
						script.parentNode.removeChild(script);
						delete Q.jsonp[handlerId];
					};
					params[callbackParam] = 'Q.jsonp.' + handlerId;
				}
				script = document.createElement('script');
				script.type = 'text/javascript';
				script.src = Q.urlAppend(request.url, params);
				document.head.appendChild(script);
				return script;
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
			
			emptyFn: function() {}
		}
	});
})();