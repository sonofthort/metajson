'use stict';

// Created by Eric Thortsen
// see https://github.com/sonofthort/metajson for liscense and documentation

metajson = {}
metajson.util = {}

metajson.util.assert = function(value, message) {
	if (value) {
		return value
	}
	message = message || 'value is null or undefined'
	throw('assert failed: ' + message + '\nStack:\n' + (new Error()).stack)
}

metajson.util.isString = function(v) {return typeof v === 'string' || v instanceof String}
metajson.util.isArray = function(v) {return Object.prototype.toString.call(v) === '[object Array]'}
metajson.util.isObject = function(v) {return v != null && typeof v === 'object' && !metajson.util.isArray(v)}
metajson.util.isNumber = function(v) {return typeof v === 'number'}
metajson.util.isFunction = function(v) {return typeof v === 'function'}
metajson.util.isConvertableToNumber = function(v) {return !isNaN(parseInt(v))}

metajson.util.def = function(v, func) {func(v);	return v}

metajson.util.kv = function(obj, func) {
	for (var k in obj) {
		if (obj.hasOwnProperty(k)) {
			func(k, obj[k])
		}
	}	
	return obj
}

metajson.util.copyObject = function(obj) {
	return metajson.util.def({}, function(result) {
		metajson.util.kv(obj, function(k, v) {
			result[k] = v
		})
	})	
}

metajson.util.prefixKeys = function(obj, prefix) {
	return metajson.util.def({}, function(result) {
		metajson.util.kv(obj, function(k, v) {
			result[prefix + k] = v
		})
	})
}

metajson.util.merge = function(obj1, obj2) {
	return metajson.util.def(metajson.util.copyObject(obj1), function(result) {
		metajson.util.kv(obj2, function(k, v) {
			result[k] = v
		})
	})
}

metajson.eval = function(obj /*, libraries...*/) {
	var util = metajson.util
	
	util.assert(util.isObject(obj), 'obj must be an Object')
	util.assert(obj.result != null, 'obj must have a result member')
	
	var o = {}
	
	for (var i = 1; i < arguments.length; ++i) {
		util.assert(util.isObject(arguments[i]), 'library ' + i + ' must be an Object')
		o = util.merge(o, arguments[i])
	}
	
	o = util.merge(o, obj)
	
	var data = util.isObject(o.data) ? o.data : {},
		templates = util.isObject(o.templates) ? o.templates : {},
		functions = util.isObject(o.functions) ? o.functions : {},
		replaced = false
		
	// wrap functions
	util.kv(functions, function(k, v) {
		functions[k] = function() {
			return v.apply(null, [].slice.call(arguments).map(function(arg) {
				return util.isString(arg) && functions.hasOwnProperty(arg) ? functions[arg] : arg
			}))
		}
	})
		
	// convert templates to functions
	util.kv(templates, function(k, v) {
		functions[k] = function() {
			return templateReplace(v, [].slice.call(arguments))
		}
	})
		
	var templateReplace = function(value, args) {
		//console.log('templateReplace: ' + JSON.stringify(value))
		//console.log('templateReplace args: ' + JSON.stringify(args))
		if (util.isArray(value)) {
			return util.def([], function(expanded) {
				value.forEach(function(v) {
					if (util.isString(v)) {
						//console.log('v: ' + JSON.stringify(v))
						if ((v.match(/\.\./) || []).length === 1) {
							if (args.length === 0) {
								return
							}
						
							var index = v.indexOf('..'),
								left = v.substring(0, index),
								right = v.substring(index + 2)
								
							//console.log(JSON.stringify({
							//	left: left,
							//	right: right
							//}))
							
							left = left.length === 0 ? 1 : parseInt(left)
							right = right.length === 0 ? args.length : parseInt(right)
							
							var range = [left, right].map(function(index) {
								util.assert(index !== 0, 'argument index cannot be zero')
								return index < 0 ? args.length + index : index - 1
							})
							
							var pack = args.slice(Math.min(range[0], range[1]), Math.max(range[0], range[1]) + 1)
							
							if (range[0] > range[1]) {
								pack.reverse()
							}
							
							pack.forEach(function(w) {expanded.push(w)})
							
							return
						}
					}
					expanded.push(v)
				})
			}).map(function(v) {
				//console.log('calling with ' + v)
				return templateReplace(v, args)
			})
		} else if (util.isObject(value)) {
			return util.def({}, function(result) {
				util.kv(value, function(k, v) {
					var key = replaceFinal(templateReplace(k, args), util.isString, 'template key did not evaluate to a string')
					result[key] = templateReplace(v, args)
				})
			})
		} else if (util.isString(value)) {
			if (value.match(/^__\d+$/)) {
				return args[parseInt(value.substring(2)) - 1]
			} else if (value.match(/^__\-\d+$/)) {
				return args[args.length + parseInt(value.substring(2))]
			}
		}
		
		return value
	}
	
	var replaceFinal = function(value, pred, message) {
		//console.log('replaceFinal: ' + JSON.stringify(value))
		pred = pred || function() {return true}
		message = message || 'final replace does not pass predicate'
	
		var lastReplaced = replaced
		
		do {
			replaced = false
			value = replace(value)
		} while (replaced || !pred(value))
		
		replaced = lastReplaced
		
		util.assert(pred(value), message + ': ' + JSON.stringify(value))
		
		return value
	}
		
	var replace = function(value) {
		//console.log('replace: ' + JSON.stringify(value))
		if (util.isArray(value)) {
			//console.log('replace array: ' + JSON.stringify(value))
			return value.map(function(v) {return replace(v)})
		} else if (util.isObject(value)) {
			var size = 0,
				key
			
			util.kv(value, function(k) {
				key = k
				++size
			})
			
			if (size === 1 && functions.hasOwnProperty(key)) {
				util.assert(util.isArray(value[key]), 'arguments to function ' + key + ' must be an array')
				replaced = true
				return functions[key].apply(null, value[key].map(function(value) {
					return replaceFinal(value)
				}))
			}
		
			return util.def({}, function(result) {
				util.kv(value, function(k, v) {
					var key = replaceFinal(k, util.isString, 'key did not evaluate to a string')
					result[key] = replace(v)
				})
			})
		} else if (util.isString(value)) {
			if (data.hasOwnProperty(value)) {
				replaced = true
				return data[value]
			}/* else if (functions.hasOwnProperty(value)) {
				replaced = true
				return functions[value]
			}*/
		}
		
		return value
	}
	
	return replaceFinal(obj.result)
}

metajson.parse = function(jsonString /*, libraries...*/) {
	return metajson.eval.apply(null, [JSON.parse(jsonString)].concat([].slice.call(arguments, 1)))
}
