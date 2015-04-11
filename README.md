# metajson
Referenceable data and variadic templates in JSON.

# Languages
Currently only a JavaScript implementation.

# Examples

One main objective of metajson is reducing duplication. This may not be a visual example of reduced size, but demonstrates the reuse concepts and metajson structure.

~~~
metajson.eval({
	// Optional data section.
	// Elements can be referenced anywhere else by their key.
	"data": {
		"pi": 3.14159,
		"tau": 6.28318
	},
	// Optional templates section.
	// Special strings "__1", "__2", "__3", and so on are placeholders and will
	// be replaced with the arguments passed to the template when invoked.
	"templates": {
		"proclaim": {
			"__1": "__2",
			"reason": "__3"
		}
	},
	// Required "result" value. This is what is evaluated to procude the result.
	"result": [
		// Invoke a template by making its name the first element of an array.
		// The remaining elements are the arguments to the template.
		["proclaim", "bad", "pi", "edible"],
		["proclaim", "good", "tau", "non-edible"]
	]
})
~~~

This will return...

~~~
[
	{"bad": 3.14159, "reason": "edible"},
	{"good": 6.28318, "reason": "non-edible"}
]
~~~

As you can see, templates work very much like C macros, simply replacing code where called. metajson.eval can also receive a dictionary, allowing a metajson object to refer to some predefined values. A dictionary can also contain actual functions, which can be invoked using the template invoke syntax. Dictionaries offer a simple way to "extend" metajson.

~~~
metajson.eval({
	result: ["mul",
		["add", 1, 2],
		["sub", 5, 3]
	]
}, {
	"mul": function(a, b) {return a * b},
	"add": function(a, b) {return a + b},
	"sub": function(a, b) {return a - b}
})
~~~

Can you guess what this returns? (Scroll to bottom to see result)

# Variadic arguments

Syntax to expand arguments is
- Optional integer, can be negative. Represents the first index.
- Followed by two dots: ..
- Followed by optional integer, can be negative. Represents the last index.

If an index is negative, it starts from the end and works down, so -1 will be the index of the last argument.

If the first index is blank, it means 1, and if the last index is blank, it means -1.

If the first index is greater than the last index, the arguments are reversed.

~~~
metajson.eval({
	templates: {
		make_array: ['..'],
		remove_first: ['make_array', '2..'],
		remove_last: ['make_array', '..-1'],
		remove_first_and_last: ['make_array', '2..-1'],
		reverse: ['-1..1']
	},
	result: [
		['make_array', 1, 2, 3, 4, 5],
		['remove_first', 1, 2, 3, 4, 5],
		['remove_last', 1, 2, 3, 4, 5],
		['remove_first_and_last', 1, 2, 3, 4, 5],
		['reverse', 1, 2, 3, 4, 5]
	]
}
~~~

This returns...

~~~
[
	[1, 2, 3, 4, 5],
	[2, 3, 4, 5],
	[1, 2, 3, 4],
	[2, 3, 4],
	[5, 4, 3, 2, 1]
]
~~~

# TODO
Feature | Notes
------------- | -------------
General testing | I imagine there are some clever recursive scenarios that could make this explode, if not just because of infinite looping.
General code improvements | Please provide feedback on anything you think could be improved. I do not claim to be a JavaScript expert.
Don't go too crazy with features | Confirm that sought after feature cannot be implemented easily with a dictionary.

# Answers
It returns (1 + 2) * (5 - 3), which equals 6
