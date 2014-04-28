Q is a very small JavaScript framework.

The major features include:
- An inheritance/class system complete with extensions, mixins, statics, and interceptors at the class or instance level (Q.define, Q.mixin, Q.intercept)
- Node wrapper interface with DOM traversal, interrogation, modification and observation APIs (via the Q() constructor/factory)
- HTML template population and static node creation from HTML (Q.tpl, Q.dom)
- AJAX API, including XMLHttpRequest simplification, JSONP support and a URL parameter utility (Q.ajax, Q.jsonp, Q.urlAppend)
- JavaScript utilities (Q.copy, Q.each, Q.isEmpty, etc)

API for DOM querying is in place, but it is not fully implemented (this is the next major feature in development). Documentation is also scant right now as I am regularly making significant changes to the API, but once things have solidified the documentation will be improved.

Fiddle for the Chess demo: http://jsfiddle.net/hiebj/tqLT7/

Fiddle for the ImageFeed demo: http://jsfiddle.net/hiebj/HuLA5/

Fiddle for the Validator demo: http://jsfiddle.net/hiebj/4tSE5/
