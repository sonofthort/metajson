# metajson
metajson is json which evaluates into json.

# examples

One main objective of metajson is reducing duplication. This may not be a visual example of reduced size, but demonstrates the reuse concepts and metajson structure.

~~~JavaScript
metajson.eval({
	// Optional data section.
	// Elements can be referenced anywhere else by their key.
	"data": {
		"pi": 3.14159,
		"tau": 6.28318
	},
	// Optional templates section.
	// Special strings "__1", "__2", "__3", and so on are placeholders and will be replaced
	// with the arguments passed to the template when invoked.
	"templates": {
		"proclaim": {
			"__1": "__2",
			"reason": "__3"
		}
	},
	// Required "result" value. This is what is evaluated to produce the result.
	"result": [
		// Invoke a template by making its name the first and only key
		// of an object whose cooresponding value is an array of arguments
		{"proclaim": ["bad", "pi", "edible"]},
		{"proclaim": ["good", "tau", "non-edible"]}
	]
})
~~~

This will return...

~~~JavaScript
[
	{"bad": 3.14159, "reason": "edible"},
	{"good": 6.28318, "reason": "non-edible"}
]
~~~

As you can see, templates work very much like C macros, simply replacing code where called. metajson.eval can also receive a dictionary, allowing a metajson object to refer to some predefined values. A dictionary can also contain actual functions, which can be invoked using the template invoke syntax. Dictionaries offer a simple way to "extend" metajson.

~~~JavaScript
metajson.eval({
	result: {"mul": [
		{"add": [1, 2]},
		{"sub": [5, 3]}
	]}
}, {
	functions: {
		"mul": function(a, b) {return a * b},
		"add": function(a, b) {return a + b},
		"sub": function(a, b) {return a - b}
	}
})
~~~

Can you guess what this returns? (Scroll to bottom to see result)

# variadic arguments

Argument pack expansions will be detected **if they are elements in an array**. Arguments can only be expanded within an array.

Syntax to expand arguments is
- Optional integer, can be negative. Represents the first index.
- Followed by two dots: ..
- Followed by optional integer, can be negative. Represents the last index.

Index rules:
- If an index is negative, it starts from the end and works down, so -1 will be the index of the last argument.
- If the first index is blank, it means 1, and if the last index is blank, it means -1.
- If the first index is greater than the last index, the arguments are reversed.

~~~JavaScript
metajson.eval({
	templates: {
		make_array: ['..'],
		remove_first: {make_array: ['2..']},
		remove_last: {make_array: ['..-2']},
		remove_first_and_last: {make_array: ['2..-2']},
		reverse: ['-1..1']
	},
	result: [
		{make_array: [1, 2, 3, 4, 5]},
		{remove_first: [1, 2, 3, 4, 5]},
		{remove_last: [1, 2, 3, 4, 5]},
		{remove_first_and_last: [1, 2, 3, 4, 5]},
		{reverse: [1, 2, 3, 4, 5]}
	]
})
~~~

This returns...

~~~JavaScript
[
	[1, 2, 3, 4, 5],
	[2, 3, 4, 5],
	[1, 2, 3, 4],
	[2, 3, 4],
	[5, 4, 3, 2, 1]
]
~~~

Placeholders can also be negative.

~~~JavaScript
metajson.eval({
	templates: {
		a: '__-1',
		b: {a: ['__-2']}
	},
	result: {b: [1, 2]}
})
~~~

This returns 1.

# lambdas
Anonymous functions can be achieved by using a dictionary with some function binding helpers.
~~~JavaScript
metajson.eval({
	templates: {	
		// can use this trick to assign a function to a key
		// anonymous functions are assigned and replaced with a key
		// just as dictionary and templates have keys
		apply: {'__1': '__2'}
	},
	result: [
		// create a lambda which adds 1 to its argument
		// and call it with a value of 2
		{apply: [
			{curry: ['add', 1]},
			[2]
		]},
		// map an array with a lambda which adds 2 then multiplies by 3
		{map: [
			[0, 1, 2],
			{compose: [
				{curry: ['add', 2]},
				{curry: ['mul', 3]}
			]}
		]}
	]
}, {
	functions: {
		// use argument binding functions to create lambdas
		curry: function(func) {
			var args = [].slice.call(arguments, 1)
			return function() {
				return func.apply(null, args.concat([].slice.call(arguments)))
			}
		},
		compose: function() {
			var funcs = [].slice.call(arguments)
			return function() {
				var result = funcs[0].apply(null, [].slice.call(arguments)),
					length = funcs.length
					
				for (var i = 1; i < length; ++i) {
					result = funcs[i](result)
				}
				
				return result
			}
		},
		// need existing library of functions to bind arguments to
		add: function(a, b) {
			return a + b
		},
		mul: function(a, b) {
			return a * b
		},
		// some predefined algos work well with lambdas also
		map: function(arr, func) {
			return arr.map(func)
		}
	}
})
~~~
This returns...
~~~JavaScript
[
	3,
	[6, 9, 12]
]
~~~

# todo
Feature | Notes
------------- | -------------
General testing | I imagine there are some clever recursive scenarios that could make this explode, if not just because of infinite looping.
Don't go too crazy with features | Confirm that sought after feature cannot be implemented easily with a dictionary. Consider creating a "standard" dictionary of useful helpers. The standard dictionary would be included if the metajson object has an "include" array like ["standard"].

# answers
It returns (1 + 2) * (5 - 3), which equals 6
