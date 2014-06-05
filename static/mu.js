(function(definition) {
	/* jshint strict: false */

	if (typeof exports === "object") { // CommonJS
		module.exports = definition();
	} else if (typeof define === "function" && define.amd) { // RequireJS
		define(definition);
	} else { // <script>
		µ = definition();
	}
})(function() {
	"use strict";

	function µ() {};

	µ.one = function(selector) {
		return document.querySelector(selector);
	};

	µ.all = function(selector) {
		return Array.prototype.slice.call(document.querySelectorAll(selector));
	};

	µ.create = function(tag) {
		return document.createElement(tag);
	};

/******************************************************************************/

	function toCamelCase(s) {
		return s.replace(/-(.)/g, function(a, b) {return b.toUpperCase();});
	};

	function isArray(a) {
		return Object.prototype.toString.call(a) === "[object Array]";
	};

	Node.prototype.one = function(selector) {
		return this.querySelector(selector);
	};

	Node.prototype.all = function(selector) {
		return Array.prototype.slice.call(this.querySelectorAll(selector));
	};

	Node.prototype.each = function(func) {
		func.bind(this)(0);

		return this;
	};

	Node.prototype.µAddEventListener = Node.prototype.addEventListener;

	Node.prototype.addEventListener = function() {
		this.µEventCache = this.µEventCache || [];

		this.µEventCache.push(arguments);

		this.µAddEventListener.apply(this, arguments);
	};

	Node.prototype.on = function(evt, func) {
		this.addEventListener(evt, func);

		return this;
	};

	Window.prototype.on = Node.prototype.on;

	Node.prototype.add = function() {
		for (var i = 0; i < arguments.length; i++) {
			if (isArray(arguments[i])) {
				this.add.apply(this, arguments[i]);
			} else {
				this.appendChild(!!arguments[i].nodeType ? arguments[i] : document.createTextNode(arguments[i]));
			}
		}

		return this;
	};

	Node.prototype.css = function(rules) {
		if (typeof rules === "string") {
			return this.style[toCamelCase(rules)];
		}

		for (var rule in rules) {
			this.style[toCamelCase(rule)] = rules[rule];
		}

		return this;
	};

	Node.prototype.attr = function(rules) {
		if (typeof rules === "string") {
			return this[rules];
		}

		for (var rule in rules) {
			this[rule] = rules[rule];
		}

		return this;
	};

	Node.prototype.empty = function() {
		while (this.firstChild) {
		    this.removeChild(this.firstChild);
		}

		return this;
	}

	Node.prototype.text = function(t) {
		return typeof t === "undefined" ? this.textContent : this.attr({textContent: t});
	}

	Node.prototype.copy = function() {
		var clone = this.cloneNode(false);

		if (this.µEventCache) {
			this.µEventCache.each(function() {
				clone.addEventListener.apply(clone, this);
			});
		}

		Array.prototype.slice.call(this.childNodes).each(function() {
			clone.appendChild(this.copy());
		});

		return clone;
	};

/******************************************************************************/

	Array.prototype.each = function(func) {
		this.forEach(function(el, i) {
			func.bind(el)(i);
		});

		return this;
	};

	Array.prototype.one = function(selector) {
		var list = [];

		this.each(function() {
			this.querySelector(selector) && list.push(this.querySelector(selector));
		});

		return list;
	};

	Array.prototype.all = function(selector) {
		var list = [];

		this.each(function() {
			list = list.concat(Array.prototype.slice.call(this.querySelectorAll(selector)));
		});

		return list;
	};

	Array.prototype.add = function() {
		var args = arguments;

		return this.each(function() {
			for (var i = 0; i < args.length; i++) {
				if (isArray(args[i])) {
					this.add.apply(this, args[i].copy());
				} else {
					this.appendChild(!!args[i].nodeType ? args[i].copy() : document.createTextNode(args[i]));
				}
			}
		});
	};

	"on css attr empty text copy".split(" ").each(function() {
		var func = this + "";

		Array.prototype[func] = function() {
			var args = arguments,
				arr = [];

			this.each(function() {
				arr.push(this[func].apply(this, args));
			});

			return arr;
		};
	});

/******************************************************************************/

	var tags = {
		img: ["src", "alt", "title"],
		a: ["href"],
		input: ["type", "name", "value"],
		label: ["for"],
		option: ["value"],
		abbr: ["title"],
		canvas: ["width", "height"]
	},

	nestedTags = {
		ul: "li",
		ol: "li",
		tr: "td",
		table: "tr"
	};

	"section nav article aside header footer address main div span p strong em h1 h2 h3 h4 h5 h6 li td".split(" ").each(function() {
		tags[this] = [];
	});

	for (var tag in tags) {
		µ[tag] = (function(t, attrs) {
			return function() {
				var attributes = {};

				for (var i = 0; i < arguments.length && i < attrs.length; i++) {
					attributes[attrs[i]] = arguments[i];
				}

				var el = µ.create(t).attr(attributes);

				return el.add.apply(el, Array.prototype.slice.call(arguments, i));
			};
		})(tag, tags[tag]);
	}

	for (var tag in nestedTags) {
		µ[tag] = (function(t, child) {
			return function() {
				var el = µ.create(t);

				for (var i = 0; i < arguments.length; i++) {
					el.add(µ[child].apply(null, isArray(arguments[i]) ? arguments[i] : [arguments[i]]));
				}

				return el;
			};
		})(tag, nestedTags[tag]);
	}

/******************************************************************************/

	return µ;
});