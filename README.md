# metajson
Referenceable data and C-like macros in JSON. Also can reference/invoke functions.

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
	// Special strings "__1", "__2", "__3", and so on are placeholders and will be replaced
	// with the arguments passed to the template when invoked.
	"templates": {
		"proclaim": {
			"__1": "__2",
			"reason": "__3"
		}
	},
	// Required "result" value. This is what is evaluated to procude the result.
	"result": [
		// Invoke a template by using its name as the first element of an array.
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

# TODO
Feature | Notes
------------- | -------------
General testing | I imagine there are some clever recursive scenarios that could make this explode, if not just because of infinite looping.
General code improvements | Please provide feedback on anything you think could be improved. I do not claim to be a JavaScript expert.
Variadic support | Forward template/function argument packs using a syntax something like ".." (all), "2.." (all from 2nd upto last), "..3" (all from 1st to 3rd) "2..4" (2nd, 3rd, and 4th).
Don't go too crazy with features | Confirm that sought after feature cannot be implemented easily with a dictionary.

# Answers
It returns (1 + 2) * (5 - 3), which equals 6
