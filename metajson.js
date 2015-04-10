'use stict';

// Created by Eric Thortsen
// see https://github.com/sonofthort/metajson for liscense and documentation

metajson = {}
metajson.util = {}

metajson.util.assert = function(value, message) {
	if (value != null) {
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

metajson.eval = function(obj, dictionary /*optional*/) {
	var util = metajson.util

	util.assert(util.isObject(obj), 'obj must be an Object')
	util.assert(obj.result != null, 'obj.result is null or undefined')
	util.assert(util.isObject(obj.data) || obj.data == null, 'obj.data must be null or an Object')
	util.assert(util.isObject(obj.templates) || obj.templates == null, 'obj.templates must be null or an Object')
	
	dictionary = dictionary || {}
	
	var data = obj.data ? util.copyObject(obj.data) : {},
		templates = obj.templates ? util.copyObject(obj.templates) : {},
		replaced = false
		
	var templateReplace = function(value, args) {
		//console.log('templateReplace: ' + JSON.stringify(value))
		//console.log('templateReplace args: ' + JSON.stringify(args))
		if (util.isArray(value)) {
			return value.map(function(v) {return templateReplace(v, args)})
		} else if (util.isObject(value)) {
			return util.def({}, function(result) {
				util.kv(value, function(k, v) {
					var key = replaceFinal(templateReplace(k, args), util.isString, 'template key did not evaluate to a string')
					result[key] = templateReplace(v, args)
				})
			})
		} else if (util.isString(value)) {
			if (value.length > 2 && value.substring(0, 2) === '__') {
				var num = parseInt(value.substring(2))
				return isNaN(num)? value : args[num - 1]
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
			var first = value[0]
			if (util.isString(first)) {
				if (templates[first] != null) {
					replaced = true
					return replace(templateReplace(templates[first], value.slice(1)))
				} else if (data[first] != null) {
					// do nothing here, we want to honor data over dictionary (will be handled below)
				} else if (util.isFunction(dictionary[first])) {
					//console.log('invoking function: ' + first)
					replaced = true
					var args = replaceFinal(value.slice(1), util.isArray, 'invalid arguments to function')
					return dictionary[first].apply(dictionary[first], args.map(function(v) {return replace(v)}))
				}
			}
			return value.map(function(v) {return replace(v)})
		} else if (util.isObject(value)) {
			return util.def({}, function(result) {
				util.kv(value, function(k, v) {
					var key = replaceFinal(k, util.isString, 'key did not evaluate to a string')
					result[key] = replace(v)
				})
			})
		} else if (util.isString(value)) {
			if (data[value]) {
				replaced = true
				return data[value]
			} else if (dictionary[value]) {
				replaced = true
				return dictionary[value]
			}
		}
		
		return value
	}
	
	return replaceFinal(obj.result)
}

metajson.parse = function(jsonString, dictionary /*optional*/) {
	return metajson.eval(JSON.parse(jsonString), dictionary)
}
