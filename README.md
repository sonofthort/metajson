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
		"d1": "x",
		"d2": 3.14159
	},
	// Optional templates section.
	// Special strings "__1", "__2", "__3", and so on are placeholders and will be replaced
	// with the arguments passed to the template when invoked.
	"templates": {
		"t1": {
			"__1": "__2",
			// "d1" and "d2" are found in the "data" section, and are replaced with the cooresponding values.
			"d1": "d2"	
		}
	},
	// Required "result" value. This is what is evaluated to procude the result.
	"result": {
		// Invoke a template by making its name the first element of an array.
		// The remaining elements are the arguments to the template.
		"foo": ["t1",
			"hello", "world"
		],
		"bar": ["t1",
			"goodbye", "cruel world"
		]
	}
})

~~~

This will return...

~~~
{
	"foo": {
		"hello": "world",
		"x": 3.14159
	},
	"bar": {
		"goodbye": "cruel world",
		"x": 3.14159
	}
}
~~~

metajson.eval can also receive a dictionary, allowing a metajson object to refer to some predefined values. A dictionary can also contain actual functions, which can be invoked the same way as templates.

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
General testing | I have tried a very limited number of cases and there is not a unit test yet. I imagine there are some clever recursive scenarios that could make this explode, if not just because of infinite looping.
General code improvements | Please provide feedback on anything you think could be improved! I do not claim to be a JavaScript expert.
Argument pack expansion | forward template/function argument packs using a syntax something like "..", "..1", "..2" (the numbered versions forward beginning at Nth argument)

# Answers
It returns (1 + 2) * (5 - 3), which equals 6
