metajson.test = function(description, value) {
	metajson.util.assert(value, 'metajson test case failed! ' + description)
	console.log('metajson test case passed! ' + description)
}

metajson.test.deepEqual = function(a, b) {
	if (a === b) {
		return true
	}
	
	if (metajson.util.isArray(a) && metajson.util.isArray(b)) {
		if (a.length !== b.length) {
			return false
		}
		
		var length = a.length
		
		for (var i = 0; i < length; ++i) {
			if (!metajson.test.deepEqual(a[i], b[i])) {
				return false
			}
		}
		
		return true
	} else if (metajson.util.isObject(a) && metajson.util.isObject(b)) {
		var misses = 0
		
		// too lazy to short circuit on miss
		;[[a, b], [b, a]].forEach(function(pair) {
			metajson.util.kv(pair[0], function(k, v) {
				if (!metajson.test.deepEqual(v, pair[1][k])) {
					++misses
				}
			})
		})
		
		return misses === 0
	}
	
	return false
}

metajson.test("deepEqual", !metajson.test.deepEqual(
	{a: [1, 2, {b: 3, c: 4}]},
	{a: [1, 2, {b: 3, c: 5}]}
))

metajson.test.equal = function(name, a, b) {
	metajson.test(name, metajson.test.deepEqual(a, b))
}


metajson.test.equal('basic_example', metajson.eval({
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
		// Invoke a template by making its name the first element of an array.
		// The remaining elements are the arguments to the template.
		["proclaim", "bad", "pi", "edible"],
		["proclaim", "good", "tau", "non-edible"]
	]
}), [
	{"bad": 3.14159, "reason": "edible"},
	{"good": 6.28318, "reason": "non-edible"}
])

metajson.test.equal('dictionary_example', metajson.eval({
	result: ["mul",
		["add", 1, 2],
		["sub", 5, 3]
	]
}, {
	"mul": function(a, b) {return a * b},
	"add": function(a, b) {return a + b},
	"sub": function(a, b) {return a - b}
}), 6)