// Q is a very small JavaScript framework.
// @author hiebj
(function() {
	// Copies properties from one object into another.
	function copy(to, from) {
		return copyIf(to, from, function() {
			return true;
		});
	}
	
	// Conditionally copies properties from one object into another.
	// The default condition will not override properties that already exist on the target.
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
	
	// Checks if an object is a DOM Node.
	function isDom(o) {
		return o instanceof Node;
	}
	
	// Checks if a value is "empty" (null, undefined, '' or []).
	function isEmpty(value) {
		return (value === null) || 
			(value === undefined) ||
			(value === '') ||
			(isArray(value) && value.length === 0);
	}
	
	// Checks if a value is an array.
	// (Array.isArray is only supported by ECMA5 browsers)
	function isArray(value) {
		if ('isArray' in Array) {
			return Array.isArray(value);
		} else {
			return toString.call(value) === '[object Array]';
		}
	}
	
	// Iterates over an array (or other iterable), executing a given function on each item.
	// Execution can be halted mid-loop by returning false from the function.
	// (Array.forEach is only supported by ECMA5 browsers)
	function each(array, fn, scope) {
		array = toArray(array);
		for (var i = 0; i < array.length; i++) {
			if (fn.call(scope || this, array[i], array) === false) {
				return i;
			}
		}
		return true;
	}
	
	// Removes the given item from the given array. Optionally uses a comparator to determine equality.
	function remove(array, item, comparator, scope) {
		var index = indexOf(array, item, comparator, scope);
		if (index !== -1) {
			array.splice(index, 1);
		}
		return array;
	}
	
	// Returns the index of a given item within the given iterable. Optionally uses a comparator to determine equality.
	function indexOf(array, compare, comparator, scope) {
		var index;
		if (comparator) {
			scope = scope || this;
			index = each(array, function(compareTo) {
				if (comparator.call(scope, compareTo, compare) === true) {
					return false;
				}
			});
			index = index === true ? -1 : index;	
		} else {
			// Use indexOf for speed
			index = array.indexOf(compare);
		}
		return index;
	}
	
	// Converts a value to an Array if it is not one.
	// Single values will be returned as the sole element of an Array, while other iterables (e.g. NodeList) are copied into a new Array.
	// Designed to simplify code which is intended to handle either collections or single arguments.
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
	
	/* Defines a class.
	 * Definition objects include four special properties, as well as any number of functions or properties which will be part of the new class' prototype.
	 * The four special properties are:
	 * 	extend:	Function/Object
	 *		The constructor function for the new class' "superclass", or an instance of such a class, to be used as the new class' prototype.
	 *		Instances are allowed because some constructors will fail if they are called with no arguments; this allows the developer to create an "empty" instance.
	 *		If no superclass is specified, the new class will extend Object.
	 *	mixins:	[]/Function/Object
	 *		A collection of constructors or instances, or a single constructor/instance, which will be "mixed in" to the new class' prototype (see #mixin).
	 *	constructor: Function/String
	 *		The constructor function for the new class, or a String which will be used as the name of a generated default constructor.
	 *		If no constructor or name is specified, a default constructor named 'Object' will be used (see #createConstructor).
	 *	statics: Object
	 *		An object containing static function definitions; these will be copied directly onto the constructor function.
	 *
	 * When a class is defined, a supermethod accessor will be available by the name $super.
	 * This way, a subclass can execute masked (overridden) functions of the parent class.
	 * To invoke a super function, simply execute the $super method with the desired parameters:
	 * this.$super(arg1, arg2)
	 * this.$super.apply(this, arguments)
	 */
	function define(definition) {
		var Superclass = definition.extend || Object,
			Subclass = definition.constructor,
			$proto = proto(Superclass),
			$mixins = definition.mixins,
			$statics = definition.statics;
		// If the passed superclass is an instance, we want to work with its constructor
		Superclass = typeof Superclass === 'function' ? Superclass : Superclass.constructor;
		// If the passed constructor is not a function, we need to generate a constructor
		Subclass = typeof Subclass === 'function' ? Subclass : defineConstructor(Subclass || Superclass);
		// Keep a reference to the superclass as a property on the constructor
		Subclass.$super = Superclass;
		Subclass.$owner = Subclass;
		// Copy the definition into the prototype
		copy($proto, prepareDefinition(Subclass, definition));
		// Assign the prototype to the new class' constructor
		Subclass.prototype = $proto;
		// Set the constructor's 'name' property
		Subclass.name = Subclass.name || getName(Subclass);
		// Apply mixins
		mixin(Subclass, $mixins);
		// Apply statics
		if ($statics) {
			// Never override an existing property on a function (e.g. prototype, name, apply, call)
			// Keep a reference to the original statics on the constructor (mostly for debugging)
			copyIf(Subclass, $statics).$statics = $statics;
		}
		// Return the new class' constructor
		return Subclass;
	}
	
	// Creates a shell or empty instance of an object to use as a prototype.
	function proto(o) {
		return typeof o !== 'function' ? o : Object.create ? Object.create(o.prototype) : new o();
	}
	
	function getName(fn) {
		var results = (/function (.{1,}?)\(/).exec(fn.toString());
		return (results && results.length > 1) ? results[1] : '';
	}
	
	function getClassName(obj) {
		return getName(obj.constructor);
	}
	
	// Generates a default constructor with the given name.
	function defineConstructor(name) {
		name = typeof name === 'function' ? name.name : (typeof name === 'string' ? name : 'Object');
		if (name.match(/[^\w\d\$]/)) throw 'Constructor names cannot contain special characters: ' + name + '()';
		// Using eval to define a properly named function
		eval('var fn = function ' + name + '(){this.$super(arguments);}');
		return fn;
	}
	
	// Accepts a class definition and prepares it to be directly copied into a prototype.
	function prepareDefinition(Class, definition) {
		var name,
			method;
		// Clone the definition so we can manipulate it
		definition = copy({}, definition);
		// Do not copy the special configs
		delete definition.extend;
		delete definition.mixins;
		delete definition.statics;
		// Set the constructor and supermethod accessor
		definition.constructor = Class;
		definition.$super = $super;
		// Set the owning class on all defined methods
		for (name in definition) {
			method = definition[name]
			if (typeof method === 'function') {
				method.$owner = Class;
				method.$name = name;
			}
		}
		return definition;
	}
	
	// Supermethod accessor; invokes the "parent" of the currently executing method
	function $super(args) {
		var $method = this.$super.caller,
			$name = $method.$name,
			$owner = $method.$owner,
			$super = $owner.$super;
		return $super.prototype[$name].apply(this, args);
	}
	
	/* Multiple inheritance function. Applies properties from a superclass or set of superclasses to a given subclass.
	 * If the properties already exist on the subclass, they will *not* be overridden.
	 * To access these masked properties, a special $mixins object on the subclass' prototype will contain a reference to every mixin prototype, mapped by constructor.
	 * Note that the function will be executed in the scope of the mixin's prototype unless it is executed using call or apply:
	 * 	this.$mixins[SomeMixinClass].constructor.apply(this, arguments);
	 *	this.$mixins[SomeOtherMixinClass].someFunction.call(this, arg1, arg2);
	 */
	function mixin(Subclass, mixins) {
		if (mixins) {
			if (!isArray(mixins)) {
				mixins = [ mixins ];
			}
			each(mixins, function(Mixin) {
				var mixin = proto(Mixin);
				mixin.$mixins = {};
				copyIf(Subclass.prototype, mixin).$mixins[getName(Mixin)] = mixin;
			});
		}
	}
	
	// Cross-browser utility to retrieve the target of a fired event.
	function getEventTarget(e) {
		e = /* Everything else */ e || /* IE */ window.event;
		return /* Everything else */ e.target || /* IE */ e.srcElement;
	}
	
	// Utility function to guarantee the existence of namespaces.
	// Example: Q.ns('Q.chess').Chess = Q.define(...);
	function namespace(namespace) {
		var names = namespace.split('.').reverse(),
			space = window,
			name;
		while (names.length) {
			name = names.pop();
			space = space[name] = space[name] || {};
		}
		return space;
	}
	
	// TODO defer/delay/buffer utilities
	
	// A singleton instance of the Q Node wrapper, returned when the Q function is called as a factory (instead of a constructor)
	var flyweight,
	// A reference to a <div> Node, which will be used to parse and render raw HTML strings into Node instances (see Q.dom)
	renderTarget;
	// Q itself is the Node wrapper class. The rest of the Q utilities are exposed as statics on the Q constructor.
	window.Q = define({
		/* The Q constructor can be called as a factory (without 'new'), or as a constructor.
		 * Called as a constructor, it will return a stable instance of Q wrapped around a given Node.
		 * Called as a factory, it will return the flyweight Q instance wrapped around the given Node, or null if no matching Node is found.
		 * Every Q traversal function returns the flyweight wrapped around the target. This improves performance, but also makes the flyweight unstable.
		 * Since the flyweight's target changes every time any traversal is conducted, its DOM reference is unlikely to remain constant past a single line of code.
		 * For these reasons the flyweight should only be used inline, and generally should not be saved as a reference property.
		 * Instead, a stable Q should be constructed whenever an object wants a permanent reference to a wrapped DOM element.
		 * For convenience, the flyweight can also be "anchored" by using #clone; it will return a stable Q instance pointing to the flyweight's current target.
		 */
		constructor: function Q(dom) {
			var q = this instanceof Q ? this : (flyweight || (flyweight = new Q()));
			// Technically the window is not a Node and most of the Q wrapper functions will not work on it.
			// We're allowing the window to be wrapped because Q event binding *does* work.
			if (Q.isDom(dom) || dom === window) {
				q.dom = dom;
			} else if (dom instanceof Q) {
				q.dom = dom.dom;
				// Unless we're creating a new instance, return the passed Q rather than the flyweight
				q = dom;
			} else if (typeof dom === 'string') {
				if (dom.indexOf('<') !== -1) {
					// It's HTML
					// TODO find a better way to determine if it's HTML
					q.dom = dom = Q.dom(dom)[0];
				} else {
					q.dom = dom = document.getElementById(dom);
				}
				// TODO allow single select via CSS selector (a la Y.one())
			}
			if (!dom) {
				// When called as a constructor, this function will always return the new instance.
				// If they are using it to access the flyweight, this function will return null if no matching element is found.
				q = null;
			}
			return q;
		},
		
		// Checks if this Q instance is the flyweight.
		isFly: function() {
			return this === flyweight;
		},
		
		// Returns a new, stable Q instance targeting the same DOM element. Can be used to "anchor" the flyweight.
		clone: function() {
			return new this.constructor(this.dom);
		},
		
		// Queries the DOM using the wrapped DOM element as the root (a la JQuery or Y.all()).
		// TODO stub. Eventually we want to query the dom, collect all matches into an array, and then sort the array by depth.
		query: function(selector) {
			return this.children();
		},
		
		// Returns the child nodes of the wrapped DOM element.
		children: function() {
			return Q.toArray(this.dom.childNodes);
		},
		
		// The following six functions are traversals.
		// Traversals all return the flyweight Q instance wrapped around the matched node, or null if no matching node is found.
		// Currently, the implementation is "dumb" and literally takes one step at a time; once querying is implemented, it will allow traversal using CSS selectors.
		down: function(selector) {
			return Q(this.query(selector)[0]);
		},
		
		child: function(selector) {
			selector = '> ' + (selector || '');
			return this.down(selector);
		},
		
		first: function(selector) {
			return Q(this.dom.firstChild);
		},
		
		last: function(selector) {
			return Q(this.dom.lastChild);
		},
		
		up: function(selector) {
			return Q(this.dom.parentNode);
		},
		
		next: function(selector) {
			return Q(this.dom.nextSibling);
		},
		
		prev: function(selector) {
			return Q(this.dom.previousSibling);
		},
		
		// Returns the index of the wrapped DOM element within its parent.
		index: function() {
			var dom = this.dom,
				q = this,
				i = 0;
			while (q = q.prev()) i++;
			this.dom = dom;
			return i;
		},
		
		// Returns true if the wrapped DOM element is an ancestor of the given element.
		contains: function(el) {
			var dom = this.dom,
				contains = Q(el).within(dom);
			this.dom = dom;
			return contains;
		},
		
		// Returns true if the wrapped DOM element is a descendant of the given element.
		within: function(el) {
			var within = false;
				dom = this.dom;
			el = Q(el);
			while (dom !== el.dom && (el = el.up()));
			if (el && el.dom.isSameNode(dom)) {
				within = true;
			}
			this.dom = dom;
			return within;
		},
		
		// Tests if the wrapped DOM element matches a passed selector (to be used during querying and traversal).
		// TODO stub
		is: function(selector) {
			return true;
		},
		
		// Safely and cleanly adds a *single* CSS class to the wrapped DOM element
		// TODO support arrays or multiple whitespace-separated classes
		addCls: function(cls) {
			var className = this.dom.className || '';
			if (!this.hasCls(cls)) {
				if (className.length) {
					className += ' ';
				}
				className += cls + ' ';
			}
			className = className.replace(/\s{2,}/g, ' ');
			this.dom.className = className;
			return this;
		},
		
		// Returns true if the wrapped DOM element has the given CSS class.
		hasCls: function(cls) {
			return (this.dom.className || '').indexOf(cls) !== -1;
		},
		
		// Safely and cleanly removes a *single* CSS class from the wrapped DOM element
		// TODO support arrays or multiple whitespace-separated classes
		removeCls: function(cls) {
			var className = this.dom.className || '';
			className = className.replace(cls, '');
			className = className.replace(/\s{2,}/g, ' ');
			this.dom.className = className;
			return this;
		},
		
		/* Appends or inserts children to the wrapped DOM element.
		 * elements: []/Q/Node/String (HTML)
		 *	A collection or single argument of type Q, Node or String (containing HTML); these will be appended as children to the wrapped DOM element.
		 * before: Q/Node/Number (index)
		 *	A Q wrapper instance, Node instance or Number index; the added elements will be inserted before this element. By default they are appended to the end.
		 */
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
						// The passed element is a String containing HTML; we have to render it into a Node instance
						// Execute add recursively, because Q.dom returns an array (since HTML can contain multiple nodes at the top level)
						this.add(Q.dom(element), before);
					} else {
						// We have a Node; add or insert.
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
		
		// Removes a given child or set of children from the wrapped DOM element.
		// elements: []/Q/Node
		//	A collection or single argument of type Q or Node; these will be removed from the wrapped DOM element.
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
		
		// Removes the wrapped DOM element from its parent.
		removeSelf: function() {
			var parent = this.dom.parentNode;
			if (parent) {
				parent.removeChild(this.dom);
			}
			return this;
		},
		
		// Removes all children from the wrapped DOM element.
		clear: function() {
			return this.remove(this.dom.childNodes);
		},
		
		/* Observes cross-browser events fired by the wrapped DOM element.
		 * event: String/Object
		 *	The name of the event to observe on the wrapped DOM element (e.g. 'click', 'mouseover', 'keyup').
		 *	This can also be a batch event configuration object, in which case it is used as the sole parameter (see below).
		 * handler: Function
		 *	The function to execute when the observed event is fired from the wrapped DOM element.
		 * 	Handler functions are executed with two parameters:
		 *		target:	The Node target that fired the event
		 *		e:	The browser Event object
		 * scope: Object
		 *	The 'this' reference to use when executing the handler.
		 *
		 * Batch Events:
		 * This function can assign multiple listeners at once by passing a compound object as the only parameter.
		 * The format for a multiple assignment object is as follows: {
		 *	event1: handler1,
		 *	event2: handler2,
		 *	scope: scope1and2,
		 *	// Event3 needs to have its handler executed in a different scope from the others:
		 *	event3: {
		 *		fn: handler3,
		 *		scope: scope3
		 *	}
		 * }
		 *
		 * Example:
		 * Q(someNode).on({
		 *	click: this.onClick,
		 *	keyup: this.onKeyUp,
		 *	scope: this,
		 *	mouseover: {
		 *		fn: this.mouseoverHandler.onMouseOver,
		 *		scope: this.mouseoverHandler
		 *	}
		 * });
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
				var dom = this.dom,
					scopingHandler = function(e) {
						scope = scope || dom;
						return handler.call(scope, dom, e);
					};
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
		
		/* TODO function to unregister events
		un: function() {
			return this;
		},
		*/
		
		// Shows the wrapped DOM element.
		show: function() {
			return this.setVisible(true);
		},
		
		// Hides the wrapped DOM element.
		hide: function() {
			return this.setVisible(false);
		},
		
		// Makes the wrapped DOM element hidden or visible.
		// TODO visibility mode support (display, visibility, offsets)
		setVisible: function(visible) {
			this.dom.hidden = !visible;
			return this;
		},
		
		// Enables the wrapped DOM element.
		enable: function() {
			return this.setDisabled(false);
		},
		
		// Disables the wrapped DOM element.
		disable: function() {
			return this.setDisabled(true);
		},
		
		// Sets the 'disabled' attribute of the wrapped DOM element.
		// TODO support a disabled CSS class instead of using the 'disabled' attribute
		setDisabled: function(disabled) {
			this.dom.disabled = !!disabled;
			return this;
		},
		
		// Focuses the wrapped DOM element.
		focus: function() {
			this.dom.focus();
			return this;
		},
		
		// TODO box management, positioning
		
		statics: {
			copy: copy,
			copyIf: copyIf,
			isDom: isDom,
			isEmpty: isEmpty,
			isArray: isArray,
			each: each,
			remove: remove,
			indexOf: indexOf,
			toArray: toArray,
			define: define,
			getName: getName,
			getClassName: getClassName,
			mixin: mixin,
			getEventTarget: getEventTarget,
			namespace: namespace,
			ns: namespace,
			
			/* Intercepts functions on the given target, allowing developers to implement case-by-case function overrides on either classes or instances.
			 * target: Function/Object
			 *	The Function constructor (or "class") to intercept, or an instance of such a class.
			 * interceptors: Object
			 *	A set of name/Function pairs indicating which functions to intercept, and defining the corresponing interceptors that will wrap them.
			 *	Interceptors will be executed with the same parameters as were passed to the base function.
			 *	Additionally, a temporary $proceed property will be set on the 'this' reference, which acts as a proxy to the base function.
			 *	The $proceed property will only exist while the interceptor is executing, and will be deleted once used.
			 *
			 * Example:
			 * Q.intercept(SomeClass, {
			 *	someFunction: function(arg1, arg2) {
			 *		if (someCondition) {
			 *			return this.$proceed.apply(this, arguments);
			 *		} else if (someOtherCondition) {
			 *			return this.$proceed(arg1, someOtherArg);
			 *		} else {
			 *			// The base function is never invoked
			 *			return null;
			 *		}
			 *	},
			 *
			 *	someOtherFunction...
			 * });
			 */
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
			
			// Static DOM query function; effectively the same as executing Q(root).query(selector).
			query: function(selector, root) {
				return Q(root || document.body).query(selector);
			},
			
			// Generates a unique ID by appending a sequence number to the given String prefix.
			// Optionally applies the generated ID to a given object.
			// If no prefix is specified but an object is passed, one will be generated by using the object's constructor name.
			id: function(prefix, obj) {
				var idSeq = this.idSeq = this.idSeq || {},
					getPrefix = function(proto) {
						var prefix = 'q-';
						if (proto && proto.constructor.$super) {
							if (!proto.hasOwnProperty('idPrefix')) {
								proto.idPrefix = getPrefix(proto.constructor.$super.prototype) +
										Q.getClassName(proto).toLowerCase() + '-';
							}
							prefix = proto.idPrefix;
						}
						return prefix;
					},
					id;
				if (typeof prefix === 'object') {
					obj = prefix;
					prefix = getPrefix(obj.constructor.prototype);
				}
				idSeq[prefix] = idSeq[prefix] || 0;
				if (obj && obj.id) {
					id = obj.id;
				} else {
					id = prefix + idSeq[prefix]++;
					if (obj) {
						obj.id = id;
					}
				}
				return id;
			},
			
			/* Populates HTML templates with variables, resulting in dynamic HTML.
			 * Intended to be used with Q.dom to create Node instances from HTML templates.
			 * tpl: []/String
			 *	The HTML template, either a single String or array of Strings which will be joined.
			 * params: Object
			 *	An object containing name/value pairs that will be mapped into the template.
			 * partial: Boolean
			 *	An optional flag indicating whether to skip template variables that do not have matching params.
			 *	This can be useful when generating nested templates.
			 *
			 * Example:
			 * var tpl = '<div class="{cls}" id="{id}">{content}</div>',
			 * params = {
			 *	cls: 'my-class',
			 *	id: 'my-id',
			 *	content: 'Some Content'	// This could also be the result of another call to Q.tpl
			 * },
			 * html = Q.tpl(tpl, params);
			 * // The value of 'html' is: '<div class="my-class" id="my-id">Some Content</div>'
			 */
			tpl: function(tpl, params, partial) {
				if (Q.isArray(tpl)) {
					tpl = tpl.join('');
				}
				if (tpl && params && typeof tpl === 'string') {
					tpl = tpl.replace(/\{.*?\}/g, function(matched) {
						// Cut off the matched brackets {}
						var param = matched.substring(1, matched.length - 1);
						matched = partial ? matched : '';
						return params[param] || matched;
					});
				}
				return tpl;
			},
			
			/* Creates Node instances from HTML strings.
			 * Note that there is no sanitization going on here, and various versions of IE are known to be extremely picky when using innerHTML.
			 * The basic idea is that the given string is simply crammed into a <div> that is not part of the DOM, and its resulting children are returned.
			 * This also means that the top-level element in the given HTML string must be a valid direct descendant of a <div> (e.g. <li> will not work without a surrounding <ul> or <ol>)
			 * TODO fallback on DOM methods to create nodes that fail with innerHTML
			 */
			dom: function(html) {
				renderTarget = renderTarget || document.createElement('div');
				renderTarget.innerHTML = html;
				return Q.toArray(renderTarget.childNodes);
			},
			
			// Selector-based batch observer.
			// Will select all elements passing the matched selector, then bind the given event or events to it.
			on: function(selector, event, handler, scope) {
				Q.each(Q.query(selector), function(el) {
					el.on(event, handler, scope);
				});
			},
			
			/* Convenience function to make simple AJAX requests.
			 * The following properties are recognized on the passed request object:
			 * method: String
			 *	Request method, e.g. GET PUT POST DELETE. Defaults to GET.
			 * url: String
			 *	Target for the request.
			 * params: Object
			 *	Object containing name/value URL parameters (query string parameters) to append to the URL.
			 * body: String
			 *	Body parameter passed directly to XMLHttpRequest.send(); only used for POST requests.
			 * json: Object
			 *	Object that will be converted to a JSON string and sent in the message body; only used for POST requests.
			 * TODO formdata
			 * headers: Object
			 *	Object containing name/value header parameters to apply to the request.
			 * callback: Function
			 *	Callback to be executed when the request is complete (readyState = 4).
			 *	The callback will be passed the XMLHttpRequest object as the sole parameter.
			 * scope: Object
			 *	'this' reference to use in the callback
			 */
			ajax: function(request) {
				var xmlhttp = new XMLHttpRequest(),
					method = (request.method || 'GET').toUpperCase(),
					body = method === 'POST' ? (request.json ? JSON.stringify(request.json) : request.body) : undefined,
					url = Q.urlAppend(request.url, request.params),
					headers = request.headers || {};
				xmlhttp.open(method, url, true);
				for (var header in headers) {
					xmlhttp.setRequestHeader(header, headers[header]);
				}
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
			 * url: String
			 *	Target for the request
			 * params: Object
			 *	URL parameters (query string parameters) to append to the URL
			 * callbackParam: String
			 *	JSONP callback parameter name to use when creating the request.
			 *	If this parameter is included, a temporary handler will be generated for the request, which will act as a proxy to the passed 'callback'.
			 *	The name of this generated function will be passed as the value for the given 'callbackParam' in the URL's query string.
			 *	If this parameter is missing, the 'callback' and 'scope' parameters will be ignored.
			 *	In that case, it is assumed that an appropriate handler is already set up, and that the callback parameter is defined in the 'params' object.
			 * callback: Function
			 *	Callback to be executed when the request is complete (when the <script> loads).
			 *	The callback will be relayed the same arguments passed to the generated JSONP handler.
			 *	Ignored unless callbackParam is specified.
			 * scope: Object
			 *	'this' reference to use in the callback.
			 *	Ignored unless callbackParam is specified.
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
			
			/* Appends the given parameter or parameters to the given URL's query string.
			 * url: String
			 *	The URL to append parameters to.
			 * params: String/Object
			 *	Either a String describing a single parameter in the format "name=value" or an Object containing multiple name/value pairs.
			 */
			urlAppend: function(url, params) {
				if (typeof params === 'object') {
					for (var param in params) {
						if (!Q.isEmpty(params[param])) {
							url = Q.urlAppend(url, param + '=' + params[param]);
						}
					}
				} else if (!Q.isEmpty(params)) {
					url += (url.indexOf('?') !== -1 ? '&' : '?') + params;
				}
				return url;
			},
			
			// An empty function. Used when defining abstract functions that should be implemented by a subclass.
			emptyFn: function() {}
		}
	});
})();
