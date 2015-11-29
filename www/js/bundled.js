(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (global){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

var base64 = require('base64-js')
var ieee754 = require('ieee754')
var isArray = require('is-array')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192 // not used by this implementation

var rootParent = {}

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * Due to various browser bugs, sometimes the Object implementation will be used even
 * when the browser supports typed arrays.
 *
 * Note:
 *
 *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
 *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
 *
 *   - Safari 5-7 lacks support for changing the `Object.prototype.constructor` property
 *     on objects.
 *
 *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
 *
 *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
 *     incorrect length in some situations.

 * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
 * get the Object implementation, which is slower but behaves correctly.
 */
Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
  ? global.TYPED_ARRAY_SUPPORT
  : typedArraySupport()

function typedArraySupport () {
  function Bar () {}
  try {
    var arr = new Uint8Array(1)
    arr.foo = function () { return 42 }
    arr.constructor = Bar
    return arr.foo() === 42 && // typed array instances can be augmented
        arr.constructor === Bar && // constructor can be set
        typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
        arr.subarray(1, 1).byteLength === 0 // ie10 has broken `subarray`
  } catch (e) {
    return false
  }
}

function kMaxLength () {
  return Buffer.TYPED_ARRAY_SUPPORT
    ? 0x7fffffff
    : 0x3fffffff
}

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (arg) {
  if (!(this instanceof Buffer)) {
    // Avoid going through an ArgumentsAdaptorTrampoline in the common case.
    if (arguments.length > 1) return new Buffer(arg, arguments[1])
    return new Buffer(arg)
  }

  this.length = 0
  this.parent = undefined

  // Common case.
  if (typeof arg === 'number') {
    return fromNumber(this, arg)
  }

  // Slightly less common case.
  if (typeof arg === 'string') {
    return fromString(this, arg, arguments.length > 1 ? arguments[1] : 'utf8')
  }

  // Unusual.
  return fromObject(this, arg)
}

function fromNumber (that, length) {
  that = allocate(that, length < 0 ? 0 : checked(length) | 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) {
    for (var i = 0; i < length; i++) {
      that[i] = 0
    }
  }
  return that
}

function fromString (that, string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') encoding = 'utf8'

  // Assumption: byteLength() return value is always < kMaxLength.
  var length = byteLength(string, encoding) | 0
  that = allocate(that, length)

  that.write(string, encoding)
  return that
}

function fromObject (that, object) {
  if (Buffer.isBuffer(object)) return fromBuffer(that, object)

  if (isArray(object)) return fromArray(that, object)

  if (object == null) {
    throw new TypeError('must start with number, buffer, array or string')
  }

  if (typeof ArrayBuffer !== 'undefined') {
    if (object.buffer instanceof ArrayBuffer) {
      return fromTypedArray(that, object)
    }
    if (object instanceof ArrayBuffer) {
      return fromArrayBuffer(that, object)
    }
  }

  if (object.length) return fromArrayLike(that, object)

  return fromJsonObject(that, object)
}

function fromBuffer (that, buffer) {
  var length = checked(buffer.length) | 0
  that = allocate(that, length)
  buffer.copy(that, 0, 0, length)
  return that
}

function fromArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Duplicate of fromArray() to keep fromArray() monomorphic.
function fromTypedArray (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  // Truncating the elements is probably not what people expect from typed
  // arrays with BYTES_PER_ELEMENT > 1 but it's compatible with the behavior
  // of the old Buffer constructor.
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

function fromArrayBuffer (that, array) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    array.byteLength
    that = Buffer._augment(new Uint8Array(array))
  } else {
    // Fallback: Return an object instance of the Buffer class
    that = fromTypedArray(that, new Uint8Array(array))
  }
  return that
}

function fromArrayLike (that, array) {
  var length = checked(array.length) | 0
  that = allocate(that, length)
  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

// Deserialize { type: 'Buffer', data: [1,2,3,...] } into a Buffer object.
// Returns a zero-length buffer for inputs that don't conform to the spec.
function fromJsonObject (that, object) {
  var array
  var length = 0

  if (object.type === 'Buffer' && isArray(object.data)) {
    array = object.data
    length = checked(array.length) | 0
  }
  that = allocate(that, length)

  for (var i = 0; i < length; i += 1) {
    that[i] = array[i] & 255
  }
  return that
}

if (Buffer.TYPED_ARRAY_SUPPORT) {
  Buffer.prototype.__proto__ = Uint8Array.prototype
  Buffer.__proto__ = Uint8Array
}

function allocate (that, length) {
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    // Return an augmented `Uint8Array` instance, for best performance
    that = Buffer._augment(new Uint8Array(length))
    that.__proto__ = Buffer.prototype
  } else {
    // Fallback: Return an object instance of the Buffer class
    that.length = length
    that._isBuffer = true
  }

  var fromPool = length !== 0 && length <= Buffer.poolSize >>> 1
  if (fromPool) that.parent = rootParent

  return that
}

function checked (length) {
  // Note: cannot use `length < kMaxLength` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= kMaxLength()) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + kMaxLength().toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (subject, encoding) {
  if (!(this instanceof SlowBuffer)) return new SlowBuffer(subject, encoding)

  var buf = new Buffer(subject, encoding)
  delete buf.parent
  return buf
}

Buffer.isBuffer = function isBuffer (b) {
  return !!(b != null && b._isBuffer)
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  var i = 0
  var len = Math.min(x, y)
  while (i < len) {
    if (a[i] !== b[i]) break

    ++i
  }

  if (i !== len) {
    x = a[i]
    y = b[i]
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!isArray(list)) throw new TypeError('list argument must be an Array of Buffers.')

  if (list.length === 0) {
    return new Buffer(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; i++) {
      length += list[i].length
    }
  }

  var buf = new Buffer(length)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

function byteLength (string, encoding) {
  if (typeof string !== 'string') string = '' + string

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'binary':
      // Deprecated
      case 'raw':
      case 'raws':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

// pre-set for values that may exist in the future
Buffer.prototype.length = undefined
Buffer.prototype.parent = undefined

function slowToString (encoding, start, end) {
  var loweredCase = false

  start = start | 0
  end = end === undefined || end === Infinity ? this.length : end | 0

  if (!encoding) encoding = 'utf8'
  if (start < 0) start = 0
  if (end > this.length) end = this.length
  if (end <= start) return ''

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'binary':
        return binarySlice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toString = function toString () {
  var length = this.length | 0
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return 0
  return Buffer.compare(this, b)
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset) {
  if (byteOffset > 0x7fffffff) byteOffset = 0x7fffffff
  else if (byteOffset < -0x80000000) byteOffset = -0x80000000
  byteOffset >>= 0

  if (this.length === 0) return -1
  if (byteOffset >= this.length) return -1

  // Negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = Math.max(this.length + byteOffset, 0)

  if (typeof val === 'string') {
    if (val.length === 0) return -1 // special case: looking for empty string always fails
    return String.prototype.indexOf.call(this, val, byteOffset)
  }
  if (Buffer.isBuffer(val)) {
    return arrayIndexOf(this, val, byteOffset)
  }
  if (typeof val === 'number') {
    if (Buffer.TYPED_ARRAY_SUPPORT && Uint8Array.prototype.indexOf === 'function') {
      return Uint8Array.prototype.indexOf.call(this, val, byteOffset)
    }
    return arrayIndexOf(this, [ val ], byteOffset)
  }

  function arrayIndexOf (arr, val, byteOffset) {
    var foundIndex = -1
    for (var i = 0; byteOffset + i < arr.length; i++) {
      if (arr[byteOffset + i] === val[foundIndex === -1 ? 0 : i - foundIndex]) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === val.length) return byteOffset + foundIndex
      } else {
        foundIndex = -1
      }
    }
    return -1
  }

  throw new TypeError('val must be string, number or Buffer')
}

// `get` is deprecated
Buffer.prototype.get = function get (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` is deprecated
Buffer.prototype.set = function set (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  if (strLen % 2 !== 0) throw new Error('Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (isNaN(parsed)) throw new Error('Invalid hex string')
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function binaryWrite (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset | 0
    if (isFinite(length)) {
      length = length | 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  // legacy write(string, encoding, offset, length) - remove in v0.13
  } else {
    var swap = encoding
    encoding = offset
    offset = length | 0
    length = swap
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'binary':
        return binaryWrite(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function binarySlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256)
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    newBuf = Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    newBuf = new Buffer(sliceLen, undefined)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
  }

  if (newBuf.length) newBuf.parent = this.parent || this

  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('buffer must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  byteLength = byteLength | 0
  if (!noAssert) checkInt(this, value, offset, byteLength, Math.pow(2, 8 * byteLength), 0)

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  this[offset] = (value & 0xff)
  return offset + 1
}

function objectWriteUInt16 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; i++) {
    buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
      (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

function objectWriteUInt32 (buf, value, offset, littleEndian) {
  if (value < 0) value = 0xffffffff + value + 1
  for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; i++) {
    buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset + 3] = (value >>> 24)
    this[offset + 2] = (value >>> 16)
    this[offset + 1] = (value >>> 8)
    this[offset] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) {
    var limit = Math.pow(2, 8 * byteLength - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = value < 0 ? 1 : 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
  } else {
    objectWriteUInt16(this, value, offset, true)
  }
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 8)
    this[offset + 1] = (value & 0xff)
  } else {
    objectWriteUInt16(this, value, offset, false)
  }
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value & 0xff)
    this[offset + 1] = (value >>> 8)
    this[offset + 2] = (value >>> 16)
    this[offset + 3] = (value >>> 24)
  } else {
    objectWriteUInt32(this, value, offset, true)
  }
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset | 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  if (Buffer.TYPED_ARRAY_SUPPORT) {
    this[offset] = (value >>> 24)
    this[offset + 1] = (value >>> 16)
    this[offset + 2] = (value >>> 8)
    this[offset + 3] = (value & 0xff)
  } else {
    objectWriteUInt32(this, value, offset, false)
  }
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (value > max || value < min) throw new RangeError('value is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('index out of range')
  if (offset < 0) throw new RangeError('index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start
  var i

  if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (i = len - 1; i >= 0; i--) {
      target[i + targetStart] = this[i + start]
    }
  } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
    // ascending copy from start
    for (i = 0; i < len; i++) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    target._set(this.subarray(start, start + len), targetStart)
  }

  return len
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function fill (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (end < start) throw new RangeError('end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  if (start < 0 || start >= this.length) throw new RangeError('start out of bounds')
  if (end < 0 || end > this.length) throw new RangeError('end out of bounds')

  var i
  if (typeof value === 'number') {
    for (i = start; i < end; i++) {
      this[i] = value
    }
  } else {
    var bytes = utf8ToBytes(value.toString())
    var len = bytes.length
    for (i = start; i < end; i++) {
      this[i] = bytes[i % len]
    }
  }

  return this
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function toArrayBuffer () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1) {
        buf[i] = this[i]
      }
      return buf.buffer
    }
  } else {
    throw new TypeError('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function _augment (arr) {
  arr.constructor = Buffer
  arr._isBuffer = true

  // save reference to original Uint8Array set method before overwriting
  arr._set = arr.set

  // deprecated
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.equals = BP.equals
  arr.compare = BP.compare
  arr.indexOf = BP.indexOf
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUIntLE = BP.readUIntLE
  arr.readUIntBE = BP.readUIntBE
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readIntLE = BP.readIntLE
  arr.readIntBE = BP.readIntBE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUIntLE = BP.writeUIntLE
  arr.writeUIntBE = BP.writeUIntBE
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeIntLE = BP.writeIntLE
  arr.writeIntBE = BP.writeIntBE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = stringtrim(str).replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; i++) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"base64-js":3,"ieee754":4,"is-array":5}],3:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],4:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = nBytes * 8 - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = (value * c - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],5:[function(require,module,exports){

/**
 * isArray
 */

var isArray = Array.isArray;

/**
 * toString
 */

var str = Object.prototype.toString;

/**
 * Whether or not the given `val`
 * is an array.
 *
 * example:
 *
 *        isArray([]);
 *        // > true
 *        isArray(arguments);
 *        // > false
 *        isArray('');
 *        // > false
 *
 * @param {mixed} val
 * @return {bool}
 */

module.exports = isArray || function (val) {
  return !! val && '[object Array]' == str.call(val);
};

},{}],6:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":7}],7:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],8:[function(require,module,exports){
/*
 * EJS Embedded JavaScript templates
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

'use strict';

/**
 * @file Embedded JavaScript templating engine.
 * @author Matthew Eernisse <mde@fleegix.org>
 * @author Tiancheng "Timothy" Gu <timothygu99@gmail.com>
 * @project EJS
 * @license {@link http://www.apache.org/licenses/LICENSE-2.0 Apache License, Version 2.0}
 */

/**
 * EJS internal functions.
 *
 * Technically this "module" lies in the same file as {@link module:ejs}, for
 * the sake of organization all the private functions re grouped into this
 * module.
 *
 * @module ejs-internal
 * @private
 */

/**
 * Embedded JavaScript templating engine.
 *
 * @module ejs
 * @public
 */

var fs = require('fs')
  , utils = require('./utils')
  , scopeOptionWarned = false
  , _VERSION_STRING = require('../package.json').version
  , _DEFAULT_DELIMITER = '%'
  , _DEFAULT_LOCALS_NAME = 'locals'
  , _REGEX_STRING = '(<%%|<%=|<%-|<%_|<%#|<%|%>|-%>|_%>)'
  , _OPTS = [ 'cache', 'filename', 'delimiter', 'scope', 'context'
            , 'debug', 'compileDebug', 'client', '_with', 'rmWhitespace'
            ]
  , _TRAILING_SEMCOL = /;\s*$/
  , _BOM = /^\uFEFF/;

/**
 * EJS template function cache. This can be a LRU object from lru-cache NPM
 * module. By default, it is {@link module:utils.cache}, a simple in-process
 * cache that grows continuously.
 *
 * @type {Cache}
 */

exports.cache = utils.cache;

/**
 * Name of the object containing the locals.
 *
 * This variable is overriden by {@link Options}`.localsName` if it is not
 * `undefined`.
 *
 * @type {String}
 * @public
 */

exports.localsName = _DEFAULT_LOCALS_NAME;

/**
 * Get the path to the included file from the parent file path and the
 * specified path.
 *
 * @param {String} name     specified path
 * @param {String} filename parent file path
 * @return {String}
 */

exports.resolveInclude = function(name, filename) {
  var path = require('path')
    , dirname = path.dirname
    , extname = path.extname
    , resolve = path.resolve
    , includePath = resolve(dirname(filename), name)
    , ext = extname(name);
  if (!ext) {
    includePath += '.ejs';
  }
  return includePath;
};

/**
 * Get the template from a string or a file, either compiled on-the-fly or
 * read from cache (if enabled), and cache the template if needed.
 *
 * If `template` is not set, the file specified in `options.filename` will be
 * read.
 *
 * If `options.cache` is true, this function reads the file from
 * `options.filename` so it must be set prior to calling this function.
 *
 * @memberof module:ejs-internal
 * @param {Options} options   compilation options
 * @param {String} [template] template source
 * @return {(TemplateFunction|ClientFunction)}
 * Depending on the value of `options.client`, either type might be returned.
 * @static
 */

function handleCache(options, template) {
  var fn
    , path = options.filename
    , hasTemplate = arguments.length > 1;

  if (options.cache) {
    if (!path) {
      throw new Error('cache option requires a filename');
    }
    fn = exports.cache.get(path);
    if (fn) {
      return fn;
    }
    if (!hasTemplate) {
      template = fs.readFileSync(path).toString().replace(_BOM, '');
    }
  }
  else if (!hasTemplate) {
    // istanbul ignore if: should not happen at all
    if (!path) {
      throw new Error('Internal EJS error: no file name or template '
                    + 'provided');
    }
    template = fs.readFileSync(path).toString().replace(_BOM, '');
  }
  fn = exports.compile(template, options);
  if (options.cache) {
    exports.cache.set(path, fn);
  }
  return fn;
}

/**
 * Get the template function.
 *
 * If `options.cache` is `true`, then the template is cached.
 *
 * @memberof module:ejs-internal
 * @param {String}  path    path for the specified file
 * @param {Options} options compilation options
 * @return {(TemplateFunction|ClientFunction)}
 * Depending on the value of `options.client`, either type might be returned
 * @static
 */

function includeFile(path, options) {
  var opts = utils.shallowCopy({}, options);
  if (!opts.filename) {
    throw new Error('`include` requires the \'filename\' option.');
  }
  opts.filename = exports.resolveInclude(path, opts.filename);
  return handleCache(opts);
}

/**
 * Get the JavaScript source of an included file.
 *
 * @memberof module:ejs-internal
 * @param {String}  path    path for the specified file
 * @param {Options} options compilation options
 * @return {String}
 * @static
 */

function includeSource(path, options) {
  var opts = utils.shallowCopy({}, options)
    , includePath
    , template;
  if (!opts.filename) {
    throw new Error('`include` requires the \'filename\' option.');
  }
  includePath = exports.resolveInclude(path, opts.filename);
  template = fs.readFileSync(includePath).toString().replace(_BOM, '');

  opts.filename = includePath;
  var templ = new Template(template, opts);
  templ.generateSource();
  return templ.source;
}

/**
 * Re-throw the given `err` in context to the `str` of ejs, `filename`, and
 * `lineno`.
 *
 * @implements RethrowCallback
 * @memberof module:ejs-internal
 * @param {Error}  err      Error object
 * @param {String} str      EJS source
 * @param {String} filename file name of the EJS file
 * @param {String} lineno   line number of the error
 * @static
 */

function rethrow(err, str, filename, lineno){
  var lines = str.split('\n')
    , start = Math.max(lineno - 3, 0)
    , end = Math.min(lines.length, lineno + 3);

  // Error context
  var context = lines.slice(start, end).map(function (line, i){
    var curr = i + start + 1;
    return (curr == lineno ? ' >> ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'ejs') + ':'
    + lineno + '\n'
    + context + '\n\n'
    + err.message;

  throw err;
}

/**
 * Copy properties in data object that are recognized as options to an
 * options object.
 *
 * This is used for compatibility with earlier versions of EJS and Express.js.
 *
 * @memberof module:ejs-internal
 * @param {Object}  data data object
 * @param {Options} opts options object
 * @static
 */

function cpOptsInData(data, opts) {
  _OPTS.forEach(function (p) {
    if (typeof data[p] != 'undefined') {
      opts[p] = data[p];
    }
  });
}

/**
 * Compile the given `str` of ejs into a template function.
 *
 * @param {String}  template EJS template
 *
 * @param {Options} opts     compilation options
 *
 * @return {(TemplateFunction|ClientFunction)}
 * Depending on the value of `opts.client`, either type might be returned.
 * @public
 */

exports.compile = function compile(template, opts) {
  var templ;

  // v1 compat
  // 'scope' is 'context'
  // FIXME: Remove this in a future version
  if (opts && opts.scope) {
    if (!scopeOptionWarned){
      console.warn('`scope` option is deprecated and will be removed in EJS 3');
      scopeOptionWarned = true;
    }
    if (!opts.context) {
      opts.context = opts.scope;
    }
    delete opts.scope;
  }
  templ = new Template(template, opts);
  return templ.compile();
};

/**
 * Render the given `template` of ejs.
 *
 * If you would like to include options but not data, you need to explicitly
 * call this function with `data` being an empty object or `null`.
 *
 * @param {String}   template EJS template
 * @param {Object}  [data={}] template data
 * @param {Options} [opts={}] compilation and rendering options
 * @return {String}
 * @public
 */

exports.render = function (template, data, opts) {
  data = data || {};
  opts = opts || {};
  var fn;

  // No options object -- if there are optiony names
  // in the data, copy them to options
  if (arguments.length == 2) {
    cpOptsInData(data, opts);
  }

  return handleCache(opts, template)(data);
};

/**
 * Render an EJS file at the given `path` and callback `cb(err, str)`.
 *
 * If you would like to include options but not data, you need to explicitly
 * call this function with `data` being an empty object or `null`.
 *
 * @param {String}             path     path to the EJS file
 * @param {Object}            [data={}] template data
 * @param {Options}           [opts={}] compilation and rendering options
 * @param {RenderFileCallback} cb callback
 * @public
 */

exports.renderFile = function () {
  var args = Array.prototype.slice.call(arguments)
    , path = args.shift()
    , cb = args.pop()
    , data = args.shift() || {}
    , opts = args.pop() || {}
    , result;

  // Don't pollute passed in opts obj with new vals
  opts = utils.shallowCopy({}, opts);

  // No options object -- if there are optiony names
  // in the data, copy them to options
  if (arguments.length == 3) {
    cpOptsInData(data, opts);
  }
  opts.filename = path;

  try {
    result = handleCache(opts)(data);
  }
  catch(err) {
    return cb(err);
  }
  return cb(null, result);
};

/**
 * Clear intermediate JavaScript cache. Calls {@link Cache#reset}.
 * @public
 */

exports.clearCache = function () {
  exports.cache.reset();
};

function Template(text, opts) {
  opts = opts || {};
  var options = {};
  this.templateText = text;
  this.mode = null;
  this.truncate = false;
  this.currentLine = 1;
  this.source = '';
  this.dependencies = [];
  options.client = opts.client || false;
  options.escapeFunction = opts.escape || utils.escapeXML;
  options.compileDebug = opts.compileDebug !== false;
  options.debug = !!opts.debug;
  options.filename = opts.filename;
  options.delimiter = opts.delimiter || exports.delimiter || _DEFAULT_DELIMITER;
  options._with = typeof opts._with != 'undefined' ? opts._with : true;
  options.context = opts.context;
  options.cache = opts.cache || false;
  options.rmWhitespace = opts.rmWhitespace;
  this.opts = options;

  this.regex = this.createRegex();
}

Template.modes = {
  EVAL: 'eval'
, ESCAPED: 'escaped'
, RAW: 'raw'
, COMMENT: 'comment'
, LITERAL: 'literal'
};

Template.prototype = {
  createRegex: function () {
    var str = _REGEX_STRING
      , delim = utils.escapeRegExpChars(this.opts.delimiter);
    str = str.replace(/%/g, delim);
    return new RegExp(str);
  }

, compile: function () {
    var src
      , fn
      , opts = this.opts
      , prepended = ''
      , appended = ''
      , escape = opts.escapeFunction;

    if (opts.rmWhitespace) {
      // Have to use two separate replace here as `^` and `$` operators don't
      // work well with `\r`.
      this.templateText =
        this.templateText.replace(/\r/g, '').replace(/^\s+|\s+$/gm, '');
    }

    // Slurp spaces and tabs before <%_ and after _%>
    this.templateText =
      this.templateText.replace(/[ \t]*<%_/gm, '<%_').replace(/_%>[ \t]*/gm, '_%>');

    if (!this.source) {
      this.generateSource();
      prepended += '  var __output = [], __append = __output.push.bind(__output);' + '\n';
      if (opts._with !== false) {
        prepended +=  '  with (' + exports.localsName + ' || {}) {' + '\n';
        appended += '  }' + '\n';
      }
      appended += '  return __output.join("");' + '\n';
      this.source = prepended + this.source + appended;
    }

    if (opts.compileDebug) {
      src = 'var __line = 1' + '\n'
          + '  , __lines = ' + JSON.stringify(this.templateText) + '\n'
          + '  , __filename = ' + (opts.filename ?
                JSON.stringify(opts.filename) : 'undefined') + ';' + '\n'
          + 'try {' + '\n'
          + this.source
          + '} catch (e) {' + '\n'
          + '  rethrow(e, __lines, __filename, __line);' + '\n'
          + '}' + '\n';
    }
    else {
      src = this.source;
    }

    if (opts.debug) {
      console.log(src);
    }

    if (opts.client) {
      src = 'escape = escape || ' + escape.toString() + ';' + '\n' + src;
      if (opts.compileDebug) {
        src = 'rethrow = rethrow || ' + rethrow.toString() + ';' + '\n' + src;
      }
    }

    try {
      fn = new Function(exports.localsName + ', escape, include, rethrow', src);
    }
    catch(e) {
      // istanbul ignore else
      if (e instanceof SyntaxError) {
        if (opts.filename) {
          e.message += ' in ' + opts.filename;
        }
        e.message += ' while compiling ejs';
      }
      throw e;
    }

    if (opts.client) {
      fn.dependencies = this.dependencies;
      return fn;
    }

    // Return a callable function which will execute the function
    // created by the source-code, with the passed data as locals
    // Adds a local `include` function which allows full recursive include
    var returnedFn = function (data) {
      var include = function (path, includeData) {
        var d = utils.shallowCopy({}, data);
        if (includeData) {
          d = utils.shallowCopy(d, includeData);
        }
        return includeFile(path, opts)(d);
      };
      return fn.apply(opts.context, [data || {}, escape, include, rethrow]);
    };
    returnedFn.dependencies = this.dependencies;
    return returnedFn;
  }

, generateSource: function () {
    var self = this
      , matches = this.parseTemplateText()
      , d = this.opts.delimiter;

    if (matches && matches.length) {
      matches.forEach(function (line, index) {
        var opening
          , closing
          , include
          , includeOpts
          , includeSrc;
        // If this is an opening tag, check for closing tags
        // FIXME: May end up with some false positives here
        // Better to store modes as k/v with '<' + delimiter as key
        // Then this can simply check against the map
        if ( line.indexOf('<' + d) === 0        // If it is a tag
          && line.indexOf('<' + d + d) !== 0) { // and is not escaped
          closing = matches[index + 2];
          if (!(closing == d + '>' || closing == '-' + d + '>' || closing == '_' + d + '>')) {
            throw new Error('Could not find matching close tag for "' + line + '".');
          }
        }
        // HACK: backward-compat `include` preprocessor directives
        if ((include = line.match(/^\s*include\s+(\S+)/))) {
          opening = matches[index - 1];
          // Must be in EVAL or RAW mode
          if (opening && (opening == '<' + d || opening == '<' + d + '-' || opening == '<' + d + '_')) {
            includeOpts = utils.shallowCopy({}, self.opts);
            includeSrc = includeSource(include[1], includeOpts);
            includeSrc = '    ; (function(){' + '\n' + includeSrc +
                '    ; })()' + '\n';
            self.source += includeSrc;
            self.dependencies.push(exports.resolveInclude(include[1],
                includeOpts.filename));
            return;
          }
        }
        self.scanLine(line);
      });
    }

  }

, parseTemplateText: function () {
    var str = this.templateText
      , pat = this.regex
      , result = pat.exec(str)
      , arr = []
      , firstPos
      , lastPos;

    while (result) {
      firstPos = result.index;
      lastPos = pat.lastIndex;

      if (firstPos !== 0) {
        arr.push(str.substring(0, firstPos));
        str = str.slice(firstPos);
      }

      arr.push(result[0]);
      str = str.slice(result[0].length);
      result = pat.exec(str);
    }

    if (str) {
      arr.push(str);
    }

    return arr;
  }

, scanLine: function (line) {
    var self = this
      , d = this.opts.delimiter
      , newLineCount = 0;

    function _addOutput() {
      if (self.truncate) {
        line = line.replace('\n', '');
        self.truncate = false;
      }
      else if (self.opts.rmWhitespace) {
        // Gotta me more careful here.
        // .replace(/^(\s*)\n/, '$1') might be more appropriate here but as
        // rmWhitespace already removes trailing spaces anyway so meh.
        line = line.replace(/^\n/, '');
      }
      if (!line) {
        return;
      }

      // Preserve literal slashes
      line = line.replace(/\\/g, '\\\\');

      // Convert linebreaks
      line = line.replace(/\n/g, '\\n');
      line = line.replace(/\r/g, '\\r');

      // Escape double-quotes
      // - this will be the delimiter during execution
      line = line.replace(/"/g, '\\"');
      self.source += '    ; __append("' + line + '")' + '\n';
    }

    newLineCount = (line.split('\n').length - 1);

    switch (line) {
      case '<' + d:
      case '<' + d + '_':
        this.mode = Template.modes.EVAL;
        break;
      case '<' + d + '=':
        this.mode = Template.modes.ESCAPED;
        break;
      case '<' + d + '-':
        this.mode = Template.modes.RAW;
        break;
      case '<' + d + '#':
        this.mode = Template.modes.COMMENT;
        break;
      case '<' + d + d:
        this.mode = Template.modes.LITERAL;
        this.source += '    ; __append("' + line.replace('<' + d + d, '<' + d) + '")' + '\n';
        break;
      case d + '>':
      case '-' + d + '>':
      case '_' + d + '>':
        if (this.mode == Template.modes.LITERAL) {
          _addOutput();
        }

        this.mode = null;
        this.truncate = line.indexOf('-') === 0 || line.indexOf('_') === 0;
        break;
      default:
        // In script mode, depends on type of tag
        if (this.mode) {
          // If '//' is found without a line break, add a line break.
          switch (this.mode) {
            case Template.modes.EVAL:
            case Template.modes.ESCAPED:
            case Template.modes.RAW:
              if (line.lastIndexOf('//') > line.lastIndexOf('\n')) {
                line += '\n';
              }
          }
          switch (this.mode) {
            // Just executing code
            case Template.modes.EVAL:
              this.source += '    ; ' + line + '\n';
              break;
            // Exec, esc, and output
            case Template.modes.ESCAPED:
              this.source += '    ; __append(escape(' +
                line.replace(_TRAILING_SEMCOL, '').trim() + '))' + '\n';
              break;
            // Exec and output
            case Template.modes.RAW:
              this.source += '    ; __append(' +
                line.replace(_TRAILING_SEMCOL, '').trim() + ')' + '\n';
              break;
            case Template.modes.COMMENT:
              // Do nothing
              break;
            // Literal <%% mode, append as raw output
            case Template.modes.LITERAL:
              _addOutput();
              break;
          }
        }
        // In string mode, just add the output
        else {
          _addOutput();
        }
    }

    if (self.opts.compileDebug && newLineCount) {
      this.currentLine += newLineCount;
      this.source += '    ; __line = ' + this.currentLine + '\n';
    }
  }
};

/**
 * Express.js support.
 *
 * This is an alias for {@link module:ejs.renderFile}, in order to support
 * Express.js out-of-the-box.
 *
 * @func
 */

exports.__express = exports.renderFile;

// Add require support
/* istanbul ignore else */
if (require.extensions) {
  require.extensions['.ejs'] = function (module, filename) {
    filename = filename || /* istanbul ignore next */ module.filename;
    var options = {
          filename: filename
        , client: true
        }
      , template = fs.readFileSync(filename).toString()
      , fn = exports.compile(template, options);
    module._compile('module.exports = ' + fn.toString() + ';', filename);
  };
}

/**
 * Version of EJS.
 *
 * @readonly
 * @type {String}
 * @public
 */

exports.VERSION = _VERSION_STRING;

/* istanbul ignore if */
if (typeof window != 'undefined') {
  window.ejs = exports;
}

},{"../package.json":10,"./utils":9,"fs":1,"path":6}],9:[function(require,module,exports){
/*
 * EJS Embedded JavaScript templates
 * Copyright 2112 Matthew Eernisse (mde@fleegix.org)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
*/

/**
 * Private utility functions
 * @module utils
 * @private
 */

'use strict';

var regExpChars = /[|\\{}()[\]^$+*?.]/g;

/**
 * Escape characters reserved in regular expressions.
 *
 * If `string` is `undefined` or `null`, the empty string is returned.
 *
 * @param {String} string Input string
 * @return {String} Escaped string
 * @static
 * @private
 */
exports.escapeRegExpChars = function (string) {
  // istanbul ignore if
  if (!string) {
    return '';
  }
  return String(string).replace(regExpChars, '\\$&');
};

var _ENCODE_HTML_RULES = {
      '&': '&amp;'
    , '<': '&lt;'
    , '>': '&gt;'
    , '"': '&#34;'
    , "'": '&#39;'
    }
  , _MATCH_HTML = /[&<>\'"]/g;

function encode_char(c) {
  return _ENCODE_HTML_RULES[c] || c;
};

/**
 * Stringified version of constants used by {@link module:utils.escapeXML}.
 *
 * It is used in the process of generating {@link ClientFunction}s.
 *
 * @readonly
 * @type {String}
 */

var escapeFuncStr =
  'var _ENCODE_HTML_RULES = {\n'
+ '      "&": "&amp;"\n'
+ '    , "<": "&lt;"\n'
+ '    , ">": "&gt;"\n'
+ '    , \'"\': "&#34;"\n'
+ '    , "\'": "&#39;"\n'
+ '    }\n'
+ '  , _MATCH_HTML = /[&<>\'"]/g;\n'
+ 'function encode_char(c) {\n'
+ '  return _ENCODE_HTML_RULES[c] || c;\n'
+ '};\n';

/**
 * Escape characters reserved in XML.
 *
 * If `markup` is `undefined` or `null`, the empty string is returned.
 *
 * @implements {EscapeCallback}
 * @param {String} markup Input string
 * @return {String} Escaped string
 * @static
 * @private
 */

exports.escapeXML = function (markup) {
  return markup == undefined
    ? ''
    : String(markup)
        .replace(_MATCH_HTML, encode_char);
};
exports.escapeXML.toString = function () {
  return Function.prototype.toString.call(this) + ';\n' + escapeFuncStr
};

/**
 * Copy all properties from one object to another, in a shallow fashion.
 *
 * @param  {Object} to   Destination object
 * @param  {Object} from Source object
 * @return {Object}      Destination object
 * @static
 * @private
 */
exports.shallowCopy = function (to, from) {
  from = from || {};
  for (var p in from) {
    to[p] = from[p];
  }
  return to;
};

/**
 * Simple in-process cache implementation. Does not implement limits of any
 * sort.
 *
 * @implements Cache
 * @static
 * @private
 */
exports.cache = {
  _data: {},
  set: function (key, val) {
    this._data[key] = val;
  },
  get: function (key) {
    return this._data[key];
  },
  reset: function () {
    this._data = {};
  }
};


},{}],10:[function(require,module,exports){
module.exports={
  "name": "ejs",
  "description": "Embedded JavaScript templates",
  "keywords": [
    "template",
    "engine",
    "ejs"
  ],
  "version": "2.3.4",
  "author": {
    "name": "Matthew Eernisse",
    "email": "mde@fleegix.org",
    "url": "http://fleegix.org"
  },
  "contributors": [
    {
      "name": "Timothy Gu",
      "email": "timothygu99@gmail.com",
      "url": "https://timothygu.github.io"
    }
  ],
  "license": "Apache-2.0",
  "main": "./lib/ejs.js",
  "repository": {
    "type": "git",
    "url": "git://github.com/mde/ejs.git"
  },
  "bugs": {
    "url": "https://github.com/mde/ejs/issues"
  },
  "homepage": "https://github.com/mde/ejs",
  "dependencies": {},
  "devDependencies": {
    "browserify": "^8.0.3",
    "istanbul": "~0.3.5",
    "jake": "^8.0.0",
    "jsdoc": "^3.3.0-beta1",
    "lru-cache": "^2.5.0",
    "mocha": "^2.1.0",
    "rimraf": "^2.2.8",
    "uglify-js": "^2.4.16"
  },
  "engines": {
    "node": ">=0.10.0"
  },
  "scripts": {
    "test": "mocha",
    "coverage": "istanbul cover node_modules/mocha/bin/_mocha",
    "doc": "rimraf out && jsdoc -c jsdoc.json lib/* docs/jsdoc/*",
    "devdoc": "rimraf out && jsdoc -p -c jsdoc.json lib/* docs/jsdoc/*"
  },
  "_id": "ejs@2.3.4",
  "_shasum": "3c76caa09664b3583b0037af9dc136e79ec68b98",
  "_resolved": "http://registry.npmjs.org/ejs/-/ejs-2.3.4.tgz",
  "_from": "ejs@2.3.4",
  "_npmVersion": "2.10.1",
  "_nodeVersion": "0.12.4",
  "_npmUser": {
    "name": "mde",
    "email": "mde@fleegix.org"
  },
  "maintainers": [
    {
      "name": "tjholowaychuk",
      "email": "tj@vision-media.ca"
    },
    {
      "name": "mde",
      "email": "mde@fleegix.org"
    }
  ],
  "dist": {
    "shasum": "3c76caa09664b3583b0037af9dc136e79ec68b98",
    "tarball": "http://registry.npmjs.org/ejs/-/ejs-2.3.4.tgz"
  },
  "directories": {}
}

},{}],11:[function(require,module,exports){
"use strict";

var _createClass = (function () {
	function defineProperties(target, props) {
		for (var i = 0; i < props.length; i++) {
			var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
		}
	}return function (Constructor, protoProps, staticProps) {
		if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
	};
})();

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _ejs = require("ejs");

var _ejs2 = _interopRequireDefault(_ejs);

var _Utilities = require("../helper/Utilities.js");

function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
	if (!(instance instanceof Constructor)) {
		throw new TypeError("Cannot call a class as a function");
	}
}

var Template = "<div class=\"overlay\" id=\"popup-overlay\" style=\"visibility: hidden; display: flex;\">\r\n    <div class=\"modal\" id=\"popup-modal\" style=\"display: flex;\">\r\n        <div class=\"mdl-card mdl-shadow--2dp\">\r\n            <div class=\"carat-card__title gray-title\">\r\n                <div class=\"mdl-card__title-text gray-title\"><!-- Title --></div>\r\n                <div class=\"mdl-layout-spacer\"></div>\r\n                <button class=\"mdl-button mdl-js-button mdl-button--icon close\" data-upgraded=\",MaterialButton\">\r\n                    <i class=\"material-icons\"></i>\r\n                </button>\r\n            </div>\r\n            <div class=\"mdl-card__supporting-text dialog-text\"><!-- Text --></div>\r\n            <div class=\"mdl-card__actions dialog-buttons\">\r\n                <button class=\"mdl-button mdl-js-button mdl-js-ripple-effec close\">OK</button>\r\n            </div>\r\n        </div>\r\n    </div>\r\n</div>";

/**
 * Dynamic popup dialog displayed over the application.
 */

var InformationDialog = (function () {
	function InformationDialog() {
		var _this = this;

		_classCallCheck(this, InformationDialog);

		// Render component
		var html = _ejs2.default.render(Template);
		this.node = _Utilities.Utilities.makeDomNode(html);

		// Get functional component elements
		this.title = this.node.querySelector(".mdl-card__title-text");
		this.text = this.node.querySelector(".mdl-card__supporting-text");

		// Bind close buttons to hide
		var closeButtons = this.node.querySelectorAll(".close");
		for (var i = 0; i < closeButtons.length; i++) {
			closeButtons[i].addEventListener("click", function () {
				return _this.hide();
			});
		}

		document.body.insertBefore(this.node, document.body.firstChild);
	}

	/**
  * Shows a dialog window
  * @param  {object(title, text)} content dialog title and text
  */

	_createClass(InformationDialog, [{
		key: "show",
		value: function show(content) {
			var _this2 = this;

			window.location.hash = "#dialog"; // Used for back button
			this.title.innerHTML = content.title;
			this.text.innerHTML = content.text;
			carat.changeStatusbarColor("#794800", function (status) {
				_this2.node.style.visibility = "visible";
				_this2.node.style.display = "flex";
			});
		}

		/**
   * Hides a dialog window
   */

	}, {
		key: "hide",
		value: function hide() {
			var _this3 = this;

			window.location.hash = ""; // Used for back button
			carat.changeStatusbarColor("#F1840C", function (status) {
				_this3.node.style.visibility = "hidden";
				_this3.node.style.display = "none";
			});
		}
	}]);

	return InformationDialog;
})();

exports.default = InformationDialog;

},{"../helper/Utilities.js":14,"ejs":8}],12:[function(require,module,exports){
"use strict";

var _createClass = (function () {
	function defineProperties(target, props) {
		for (var i = 0; i < props.length; i++) {
			var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
		}
	}return function (Constructor, protoProps, staticProps) {
		if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
	};
})();

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _ejs = require("ejs");

var _ejs2 = _interopRequireDefault(_ejs);

var _Utilities = require("../helper/Utilities.js");

function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
	if (!(instance instanceof Constructor)) {
		throw new TypeError("Cannot call a class as a function");
	}
}

var Template = "<div class=\"mdl-card mdl-shadow--2dp sleeker smaller-time-text system\">\r\n    <div class=\"carat-card__title\">\r\n        <div class=\"mdl-card__icon\"><i class=\"material-icons\">&#xE1DA;</i></div>\r\n        <div class=\"mdl-card__title-text\"><%= label %></div>\r\n        <div class=\"carat-card-time\"><%= benefit %></div>\r\n    </div>\r\n    <div class=\"mdl-card__supporting-text\">\r\n        <div class=\"suggested-action\">Change to\r\n            <% if(changeTo.hasOwnProperty(\"min\")){ %>\r\n                range <%= changeTo.min %> - <%= changeTo.max %>\r\n            <% } else { %>\r\n                <%= changeTo %>\r\n            <% } %>\r\n        </div>Place for additional infotext. Current setting \"<%= current %>\" consumes more energy. In order to save energy change this setting.\r\n        <div class=\"collapse\"></div>\r\n    </div>\r\n    <div class=\"mdl-card__actions mdl-card--border\">\r\n        <button class=\"action-button\">Change</button>\r\n    </div>\r\n</div>";

/**
* @class SettingCard
* @summary Setting suggestion card.
*/

var SettingCard = (function () {
	function SettingCard(data) {
		var _this = this;

		_classCallCheck(this, SettingCard);

		// Prepare and reformat data
		data.label = data.label.split(/(?=[A-Z])/).join(" "); // Temporary split
		data.label = data.label.toLowerCase();
		data.label = _Utilities.Utilities.capitalize(data.label);

		// Create initial node
		this.data = data;
		var html = _ejs2.default.render(Template, data);
		this.node = _Utilities.Utilities.makeDomNode(html);

		// Bind button responsbile for changing the setting
		var button = this.node.querySelector(".action-button");
		button.addEventListener("click", function () {
			_this.openSetting();
		});

		// Make card swipeable
		makeElemPanSwipable(this.node);
	}

	/**
  * Returns a rendered setting card
  * @return {node} Card node
  */

	_createClass(SettingCard, [{
		key: "render",
		value: function render() {
			return this.node;
		}

		/**
   * Opens a setting related to the card
   */

	}, {
		key: "openSetting",
		value: function openSetting() {
			carat.showToast("Open " + this.data.label + " settings");
		}
	}]);

	return SettingCard;
})();

exports.default = SettingCard;

},{"../helper/Utilities.js":14,"ejs":8}],13:[function(require,module,exports){
"use strict";

var _createClass = (function () {
	function defineProperties(target, props) {
		for (var i = 0; i < props.length; i++) {
			var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
		}
	}return function (Constructor, protoProps, staticProps) {
		if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
	};
})();

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _ejs = require("ejs");

var _ejs2 = _interopRequireDefault(_ejs);

var _SettingCard = require("../components/SettingCard.js");

var _SettingCard2 = _interopRequireDefault(_SettingCard);

var _Utilities = require("../helper/Utilities.js");

function _interopRequireDefault(obj) {
	return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
	if (!(instance instanceof Constructor)) {
		throw new TypeError("Cannot call a class as a function");
	}
}

var Template = "<div class=\"carat-module\">\r\n\t    <div class=\"carat-module-title\">\r\n\t    \tSettings: <span id=\"system-card-count\">0</span>\r\n\t    \t<div id=\"system-card-refresh\">\r\n\t    \t\t<i class=\"material-icons\">&#xE5D5;</i>\r\n\t    \t</div>\r\n\t    </div>\r\n\t    <div class=\"carat-module-content\" id=\"system-cards\"></div>\r\n</div>";

/**
* @class SettingList
* @summary Listview of system setting suggestions.
*/

var SettingList = (function () {
	function SettingList() {
		var _this = this;

		_classCallCheck(this, SettingList);

		var html = _ejs2.default.render(Template);
		this.node = _Utilities.Utilities.makeDomNode(html);

		this.clear = this.clear.bind(this);
		this.cardCount = this.node.querySelector("#system-card-count");
		this.cardContainer = this.node.querySelector("#system-cards");

		this.reload();

		var refreshButton = this.node.querySelector("#system-card-refresh");
		refreshButton.addEventListener("click", function () {
			carat.showToast("Reloading settings..");
			_this.reload();
		});
	}

	/**
  * Clears the list for rerendering
  */

	_createClass(SettingList, [{
		key: "clear",
		value: function clear() {
			this.cardContainer.innerHTML = "";
		}

		/**
   * Reloads and appends setting cards
   */

	}, {
		key: "reload",
		value: function reload() {
			var _this2 = this;

			carat.getSettings(function (suggestions) {
				_this2.cardCount.innerHTML = suggestions.length;
				_this2.clear();
				if (suggestions.length >= 1) {
					_this2.cardContainer = _this2.node.querySelector("#system-cards");
					suggestions.forEach(function (suggestion) {
						var card = new _SettingCard2.default(suggestion);
						_this2.cardContainer.appendChild(card.render());
					});
				}
			});
		}

		/**
   * Returns a rendered setting list
   * @return {node} List node
   */

	}, {
		key: "render",
		value: function render() {
			return this.node;
		}
	}]);

	return SettingList;
})();

exports.default = SettingList;

},{"../components/SettingCard.js":12,"../helper/Utilities.js":14,"ejs":8}],14:[function(require,module,exports){
"use strict"

/**
 * @namespace Utilities
 */
;
module.exports.Utilities = (function () {

    /**
     * @function
     * @static
     * @param {String} id
     * @param {String} additional
     * @returns {String} An is that is formed from the given data.
     * @memberOf Utilities
     */
    var makeIdFromOtherId = function makeIdFromOtherId(id, additional) {

        return id + "-" + additional;
    };

    /**
     * @function
     * @static
     * @param {String} appName
     * @param {String} hogOrBug
     * @param {String} additional
     * @returns {String} An id that is formed from the given data.
     * @memberOf Utilities
     */
    var makeIdFromAppName = function makeIdFromAppName(appName, hogOrBug, additional) {

        var idPrefix = appName.replace(/-/g, "--").replace(/\./g, "-");

        var standardPart = idPrefix + "-" + hogOrBug;

        if (!additional) {
            return standardPart;
        }

        return makeIdFromOtherId(standardPart, additional);
    };

    /**
     * @function
     * @static
     * @param {DOM-element} elem A DOM element that should contain
     an element with the matching id as a sub-element.
     * @param {String} id Id of the element one is searching for.
     * @returns {DOM-element} Element which is a child of the given
     element and has the corresponding id given as a parameter.
     * @memberOf Utilities
     */
    var findById = function findById(elem, id) {
        if (!elem.querySelector) {
            return null;
        } else {
            return elem.querySelector("#" + id);
        }
    };

    var appendOrReplace = function appendOrReplace(appendLocation, updateId, elem) {
        var oldElem = findById(appendLocation, updateId);

        if (!oldElem) {
            appendLocation.appendChild(elem);
        } else {
            oldElem.parentNode.replaceChild(elem, oldElem);
        }
    };

    /**
     * @function
     * @static
     * @param {DOM-element} elem The to-be parent of the appendees.
     * @param {Array} appendees Array of DOM nodes that are to
     be appended as children of the given element.
     * @memberOf Utilities
     */
    var appendChildAll = function appendChildAll(elem, appendees) {
        for (var key in appendees) {
            if (elem && elem.appendChild) {
                elem.appendChild(appendees[key]);
            }
        }
    };

    /**
     * @function
     * @static
     * @param {String} timeDrainString String that represents
     the time benefit of getting rid of the app.
     * @returns {Object} The string split into two parts containing
     the expected benefit of getting rid of the app and the error
     part associated with the expected benefit.
     * @memberOf Utilities
     */
    var splitTimeDrainString = function splitTimeDrainString(timeDrainString) {
        var timeDrainSplit = timeDrainString.split("±", 2);

        var timeDrainPart;
        var timeDrainErrorPart;

        if (timeDrainSplit.length === 2) {
            timeDrainPart = timeDrainSplit[0];
            timeDrainErrorPart = "±" + timeDrainSplit[1];
        } else {
            timeDrainPart = timeDrainString;
            timeDrainErrorPart = "";
        }

        return { timeDrainPart: timeDrainPart,
            timeDrainErrorPart: timeDrainErrorPart };
    };

    /**
     * @function
     * @static
     * @param {Number} count The amount of "the thing".
     * @param {String} singular The singular form of the word
     for "the thing" at hand.
     * @returns {String} End-user readable form of the given
     word associated with the given number.
     * @memberOf Utilities
     */
    var pluralize = function pluralize(count, singular) {

        var form;

        if (count === 1) {
            form = singular;
        } else {
            form = singular + 's';
        }

        if (count === 0) {
            return "No " + form;
        } else {
            return count + " " + form;
        }
    };

    /**
     * @function
     * @static
     * @param {String} htmlString A string that should be valid
     HTML.
     * @returns {DOM-element} Corresponding DOM element that is
     created from the given HTML string.
     * @memberOf Utilities
     */
    var makeDomNode = function makeDomNode(htmlString) {

        var dummyNode = document.createElement("div");
        dummyNode.innerHTML = htmlString;
        return dummyNode.firstChild;
    };

    var cutLabel = function cutLabel(label, length) {
        // Charcode 8230 is ellipsis
        var ellipsis = String.fromCharCode(8230);
        return label.length > length ? label.slice(0, length - 3) + ellipsis : label;
    };

    var capitalize = function capitalize(string) {
        return string[0].toUpperCase() + string.slice(1);
    };

    return {
        cutLabel: cutLabel,
        makeIdFromAppName: makeIdFromAppName,
        splitTimeDrainString: splitTimeDrainString,
        pluralize: pluralize,
        makeDomNode: makeDomNode,
        makeIdFromOtherId: makeIdFromOtherId,
        appendChildAll: appendChildAll,
        findById: findById,
        capitalize: capitalize,
        appendOrReplace: appendOrReplace
    };
})();

},{}],15:[function(require,module,exports){
"use strict";

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ejs = require("ejs");

var _ejs2 = _interopRequireDefault(_ejs);

var _Utilities = require("../helper/Utilities.js");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

// Template
var Template = "<div class=\"mdl-card mdl-shadow--2dp\"\r\n     id=\"statistics-jscore\"\r\n     style=\"-webkit-user-select: none;\r\n            -webkit-user-drag: none;\r\n            -webkit-tap-highlight-color: rgba(0, 0, 0, 0);\">\r\n    <div class=\"mdl-card__supporting-text in_large\">\r\n        <div class=\"list-item\">OS version: <%= osVersion %></div>\r\n        <div class-\"list-item\">Device model: <%= deviceModel %></div>\r\n        <div class=\"list-item\" style=\"display: inline-block;\">\r\n            CPU usage:&nbsp;\r\n            <div id=\"cpuProgressBar\" class=\"progressBar\">\r\n                <span>?</span>\r\n                <div></div>\r\n            </div>\r\n        </div>\r\n        <div class=\"list-item\">Memory total: <%= totalMemory %> MiB</div>\r\n        <div class=\"list-item\" style=\"display: inline-block;\">\r\n            Memory usage:&nbsp;\r\n            <div id=\"memProgressBar\" class=\"progressBar\">\r\n                <span>?</span>\r\n                <div></div>\r\n            </div>\r\n        </div>\r\n        <div class=\"list-item\">Carat id: <%= uuid %></div>\r\n    </div>\r\n</div>\r\n";

var DeviceStats = (function () {
    function DeviceStats(data) {
        _classCallCheck(this, DeviceStats);

        data.jScore = Math.round(data.jScore * 100);
        data.deviceModel = data.modelName;

        this.data = data;

        var html = _ejs2.default.render(Template, data);
        this.node = this.createNode(html);
    }

    // create node and bind functions

    _createClass(DeviceStats, [{
        key: "createNode",
        value: function createNode(html) {
            var node = _Utilities.Utilities.makeDomNode(html);

            var cpuText = node.querySelector("#cpuProgressBar span");
            var cpuLoad = node.querySelector("#cpuProgressBar div");

            var memoryText = node.querySelector("#memProgressBar span");
            var memoryLoad = node.querySelector("#memProgressBar div");

            carat.startCpuPolling(function (usage) {
                cpuText.style.color = usage > 65 ? "#fff" : "#000";
                usage = usage + "%";
                cpuText.innerHTML = usage;
                cpuLoad.style.width = usage;
            }, 4000);

            carat.startMemoryPolling(function (usage) {
                memoryText.style.color = usage > 65 ? "#fff" : "#000";
                usage = usage + "%";
                memoryText.innerHTML = usage;
                memoryLoad.style.width = usage;
            }, 4000);

            return node;
        }
    }, {
        key: "render",
        value: function render() {
            return this.node;
        }
    }, {
        key: "getFields",
        value: function getFields() {
            return this.data;
        }
    }]);

    return DeviceStats;
})();

exports.default = DeviceStats;

},{"../helper/Utilities.js":14,"ejs":8}],16:[function(require,module,exports){
"use strict";

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ejs = require("ejs");

var _ejs2 = _interopRequireDefault(_ejs);

var _Utilities = require("../helper/Utilities.js");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Template = "<div class=\"mdl-card sleeker smaller-time-text mdl-shadow--2dp\"\r\n     id=\"<%= id %>\">\r\n    <div class=\"carat-card__title\">\r\n        <div class=\"mdl-card__icon\"><img src=\"<%= icon %>\"></div>\r\n        <div class=\"mdl-card__title-text\">\r\n            <%= label %>\r\n            <div class=\"expand\">\r\n                <button class=\"expand-button\">\r\n                    <i class=\"material-icons\r\n                              md-light\r\n                              normal-icon\">\r\n                        &#xE5CF;\r\n                    </i>\r\n                </button>\r\n            </div>\r\n        </div>\r\n        <div class=\"carat-card-time\">\r\n            <%= benefit %>\r\n            <span class=\"benefit-error\">\r\n                <%= benefitError %>\r\n            </span>\r\n        </div>\r\n    </div>\r\n    <div class=\"mdl-card__supporting-text\">\r\n        <div class=\"collapse\" id=\"card-<%= id %>-textpand\">\r\n            <div><%= \"Version: \" + version %></div>\r\n            <div><%= \"Samples: \" + samples %></div>\r\n            <div><%= \"Found in \" + popularity + \"% of devices.\" %></div>\r\n        </div>\r\n    </div>\r\n    <div class=\"mdl-card__actions mdl-card--border\">\r\n        <span>\r\n            <button class=\"action-button\"\r\n               id=\"<%= closeId %>\"\r\n               <% if(!killable) { %>\r\n               disabled\r\n               <% } %>>\r\n                Close app\r\n            </button>\r\n        </span>\r\n        <span>\r\n            <button class=\"action-button\"\r\n               id=\"<%= uninstallId %>\"\r\n               <% if(!uninstallable) { %>\r\n               disabled\r\n               <% } %>>\r\n                Uninstall\r\n            </button>\r\n        </span>\r\n    </div>\r\n</div>\r\n";

/**
* @class HogBug
* @summary Hog/bug cards with actions.
*/

var HogBug = (function () {
    function HogBug(data) {
        _classCallCheck(this, HogBug);

        // Prepare and reformat data
        data.label = _Utilities.Utilities.cutLabel(data.label, 20);
        data.benefitSubstrings = _Utilities.Utilities.splitTimeDrainString(data.benefit);
        data.benefit = data.benefitSubstrings.timeDrainPart;
        data.benefitError = data.benefitSubstrings.timeDrainErrorPart;
        data.killable = data.running && data.killable;
        data.uninstallable = data.removable;
        data.id = _Utilities.Utilities.makeIdFromAppName(data.name, data.type);
        data.uninstallId = _Utilities.Utilities.makeIdFromAppName(data.name, data.type, "uninstall");
        data.closeId = _Utilities.Utilities.makeIdFromAppName(data.name, data.type, "close");

        this.data = data;

        console.log(data, Template);
        // render template
        var html = _ejs2.default.render(Template, data);
        this.node = this.createNode(html);
    }

    /**
     * @function
     * @instance
     * @returns {String} Id for the HTML-element id field.
     * @memberOf HogBug
     */

    _createClass(HogBug, [{
        key: "getId",
        value: function getId() {
            return this.data.id;
        }
    }, {
        key: "getCloseId",

        /**
         * @function
         * @instance
         * @returns {String} Id for the close button
         HTML-element id field.
         * @memberOf HogBug
         */
        value: function getCloseId() {
            return this.data.closeId;
        }
    }, {
        key: "getUninstallId",

        /**
         * @function
         * @instance
         * @returns {String} Id for the uninstall button
         HTML-element id field.
         * @memberOf HogBug
         */
        value: function getUninstallId() {
            return this.data.uninstallId;
        }
    }, {
        key: "getRunning",

        /**
         * @function
         * @instance
         * @returns {Boolean} Whether or not this app is
         currently running.
         * @memberOf HogBug
         */
        value: function getRunning() {
            return this.data.running;
        }
    }, {
        key: "getPackageName",

        /**
         * @function
         * @instance
         * @returns {String} The package name of this app
         for native plugin use.
         * @memberOf HogBug
         */
        value: function getPackageName() {
            return this.data.packageName;
        }

        /**
         * @function
         * @instance
         * @returns {String} The name of the app that is
         displayed for the end user.
         * @memberOf HogBug
         */

    }, {
        key: "getLabel",
        value: function getLabel() {
            return this.data.label;
        }
    }, {
        key: "getUninstallable",

        /**
         * @function
         * @instance
         * @returns {Boolean} Whether or not you can uninstall this app.
         * @memberOf HogBug
         */
        value: function getUninstallable() {
            return this.data.uninstallable;
        }
    }, {
        key: "createNode",
        value: function createNode(html) {
            var node = _Utilities.Utilities.makeDomNode(html);
            var closeButton = _Utilities.Utilities.findById(node, this.data.closeId);
            var uninstallButton = _Utilities.Utilities.findById(node, this.data.uninstallId);

            var _this = this;
            closeButton.addEventListener("click", function () {
                carat.killApp(_this.data.name, function (state) {
                    closeButton.disabled = true;
                    if (state == "Success") {
                        carat.showToast(_this.data.label + " closed");
                    } else {
                        carat.showToast(_this.data.label + " couldn't be closed!");
                    }
                });
            });

            uninstallButton.addEventListener("click", function () {
                carat.uninstallApp(_this.data.name, function (state) {
                    console.log("Uninstalling app: " + state);
                });
            });

            if (window.localStorage.getItem(this.data.id) === "dismissed") {
                node.style.display = "none";
            } else {
                makeElemPanSwipable(node);
            }

            return node;
        }

        /**
         * @function
         * @instance
         * @returns {DOM-element} Rendered DOM element
         representing a hog or a bug.
         * @memberOf HogBug
         */

    }, {
        key: "render",
        value: function render() {
            return this.node;
        }
    }]);

    return HogBug;
})();

exports.default = HogBug;

},{"../helper/Utilities.js":14,"ejs":8}],17:[function(require,module,exports){
(function (Buffer){
"use strict";

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ejs = require("ejs");

var _ejs2 = _interopRequireDefault(_ejs);

var _Utilities = require("../helper/Utilities.js");

var _SummaryEntry = require("./SummaryEntry.js");

var _SummaryEntry2 = _interopRequireDefault(_SummaryEntry);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Template = "<div class=\"mdl-card mdl-shadow--2dp\" id=\"summary-0\">\r\n    <div class=\"carat-card__title\" id=\"summary\">\r\n        <div class=\"mdl-card__title-text carat_summaryCard_title_text\">\r\n            Summary\r\n        </div>\r\n    </div>\r\n    <div class=\"mdl-card__supporting-text carat-card__supporting-text\">\r\n        <div class=\"ScoreAndBattery\">\r\n            <div class=\"carat-Jscore-text\"></div>\r\n            <div class=\"carat-battery-text\"></div>\r\n            <div class=\"circleContainer\">\r\n                <div class=\"outerCircle\">\r\n                    <div class=\"innerCircle\">\r\n                        <div class=\"numberCircle\">\r\n                            <button class=\"info\"></button>\r\n                        </div>\r\n                    </div>\r\n                </div>\r\n            </div>\r\n        </div>\r\n        <div class=\"carat_summaryCard_group_title\" id=\"bugTitleAndCount\">\r\n            <%= bugsCount %>\r\n        </div>\r\n        <div id=\"bugSummaryGrid\" class=\"carat_hide\">\r\n            <div class=\"carat_summary_grid\" id=\"bugsGrid\">\r\n            </div>\r\n        </div>\r\n        <div class=\"carat_summaryCard_group_title\" id=\"hogTitleAndCount\">\r\n             <%= hogsCount %>\r\n        </div>\r\n        <div id=\"hogSummaryGrid\" class=\"carat_show\">\r\n            <div class=\"carat_summary_grid\" id=\"hogsGrid\">\r\n            </div>\r\n        </div>\r\n        <div class=\"carat_summaryCard_group_title\">\r\n             0 System notifications\r\n        </div>\r\n    </div>\r\n    <div class=\"mdl-card__actions carat-card__actions\">\r\n        <a class=\"mdl-card__more\" id=\"summary-button\" role=\"button\" onclick=\"showOrHideActions()\" href=\"#\">\r\n           More\r\n        </a>\r\n    </div>\r\n</div>\r\n";

/**
* @class SummaryContainer
* @summary Summary card
*/

var SummaryContainer = (function () {
    function SummaryContainer(bugs, hogs) {
        _classCallCheck(this, SummaryContainer);

        if (!bugs) {
            this.bugEntries = [];
        } else {
            this.bugEntries = this.makeModels(bugs);
        }

        if (!hogs) {
            this.hogEntries = [];
        } else {
            this.hogEntries = this.makeModels(hogs);
        }

        this.node = this.createNode();
        this.id = "summary-0";

        var jscoreButton = this.node.querySelector(".info");
        jscoreButton.addEventListener("click", function () {
            app.showDialog({
                title: "What is a J-Score?",
                text: Buffer("PGRpdj5UaGUgSi1TY29yZSByZXByZXNlbnRzIHRoZSBwZXJjZW50aWxlIGJhdHRlcnkgbGlmZSB5b3Ugc2VlIHJlbGF0aXZlIHRvIGFsbCBvdGhlciBkZXZpY2VzDQpiZWluZyBtZWFzdXJlZCBieSBDYXJhdC48L2Rpdj4NCg0KPGRpdj5TbywgaWYgeW91IGhhdmUgYSBKLVNjb3JlIG9mIDUwLCB0aGF0IG1lYW5zIHlvdXIgZXhwZWN0ZWQgYmF0dGVyeSBsaWZlIGlzIGJldHRlciB0aGFuDQpoYWxmIG9mIG91ciB1c2VyczsgYSBzY29yZSBvZiA5OSBtZWFucyB5b3UgaGF2ZSBiZXR0ZXIgYmF0dGVyeSBsaWZlIHRoYW4gOTklIG9mIG91ciB1c2Vycy48L2Rpdj4NCg0KPGltZyBzcmM9ImltZy9qc2NvcmVfcGxvdC5wbmciIC8+DQoNCjxkaXY+IE9mIGNvdXJzZSwgYSBzaW5nbGUgbnVtYmVyIGRvZXMgbm90IHByb3ZpZGUgYSBjb21wbGV0ZSBkZXNjcmlwdGlvbiBvZiB5b3VyIGJhdHRlcnkgbGlmZS4NCkEgbG93IEotU2NvcmUgY291bGQgbWVhbiB0aGF0IHlvdXIgZGV2aWNlIGlzIHVzaW5nIGEgYmlnIGJhdHRlcnkgaW5lZmZpY2llbnRseSBvciBhIHNtYWxsDQpiYXR0ZXJ5IHdpdGggYXZlcmFnZSBlZmZpY2llbmN5LjwvZGl2Pg0KDQo8ZGl2PlNpbWlsYXJseSwgYSBoaWdoIEotU2NvcmUgY291bGQgc2ltcGx5IG1lYW4gdGhhdCB5b3UgZG9uJ3QgdXNlIHlvdXIgZGV2aWNlIGhlYXZpbHkuPC9kaXY+DQoNCjxkaXY+Q2FyYXQgY29tcHV0ZXMgYSBodWdlIHZhcmlldHkgb2Ygc3RhdGlzdGljcywgYW5kIHRoZSBKLVNjb3JlIGlzIGp1c3Qgb25lIG9mIHRoZW0uIDwvZGl2Pg==", "base64")
            });
        });
    }

    /**
     * @function
     * @instance
     * @returns {Array} All the bug entries listed
     in the summary.
     * @memberOf SummaryContainer
     */

    _createClass(SummaryContainer, [{
        key: "getBugs",
        value: function getBugs() {
            return this.bugEntries;
        }
    }, {
        key: "getHogs",

        /**
         * @function
         * @instance
         * @returns {Array} All the hog entries listed
         in the summary.
         * @memberOf SummaryContainer
         */
        value: function getHogs() {
            return this.hogEntries;
        }
    }, {
        key: "makeModels",

        // Create summary entry cards
        value: function makeModels(data) {
            var result = [];
            for (var key in data) {
                result.push(new _SummaryEntry2.default(data[key]));
            }
            return result;
        }
    }, {
        key: "getRendered",
        value: function getRendered() {
            var renderedBugs = this.bugEntries.map(function (bug) {
                return bug.render();
            });

            var renderedHogs = this.hogEntries.map(function (hog) {
                return hog.render();
            });

            var bugsCount = _Utilities.Utilities.pluralize(renderedBugs.length, "bug");
            var hogsCount = _Utilities.Utilities.pluralize(renderedHogs.length, "hog");

            return {
                hogs: renderedHogs,
                bugs: renderedBugs,
                bugsCount: bugsCount,
                hogsCount: hogsCount
            };
        }
    }, {
        key: "createNode",
        value: function createNode() {

            var rendered = this.getRendered();
            var html = _ejs2.default.render(Template, rendered);
            var node = _Utilities.Utilities.makeDomNode(html);

            var hogsLoc = _Utilities.Utilities.findById(node, "hogsGrid");
            var bugsLoc = _Utilities.Utilities.findById(node, "bugsGrid");

            _Utilities.Utilities.appendChildAll(hogsLoc, rendered.hogs);
            _Utilities.Utilities.appendChildAll(bugsLoc, rendered.bugs);

            return node;
        }

        /**
         * @function
         * @instance
         * @returns {DOM-element} Rendered DOM element
         representing the summary.
         * @memberOf SummaryContainer
         */

    }, {
        key: "render",
        value: function render() {
            return this.node;
        }
    }, {
        key: "refreshModel",
        value: function refreshModel(bugs, hogs) {
            this.bugEntries = this.makeModels(bugs);
            this.hogEntries = this.makeModels(hogs);

            this.node = this.createNode();
        }
    }]);

    return SummaryContainer;
})();

exports.default = SummaryContainer;

}).call(this,require("buffer").Buffer)
},{"../helper/Utilities.js":14,"./SummaryEntry.js":18,"buffer":2,"ejs":8}],18:[function(require,module,exports){
"use strict";

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ejs = require("ejs");

var _ejs2 = _interopRequireDefault(_ejs);

var _Utilities = require("../helper/Utilities.js");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Template = "<div class=\"mdl-cell mdl-cell--2-col mdl-cell--1-col-phone carat_summary_item\" id=\"<%= id %>\">\r\n    <div class=\"carat_summaryCard_app_icon\">\r\n        <div class=\"mdl-card__icon\">\r\n            <img src=\"<%= icon %>\">\r\n        </div>\r\n        <i class=\"material-icons\"></i>\r\n    </div>\r\n    <div class=\"carat_summaryCard_app_name\"><%= label %></div>\r\n    <div class=\"carat_summaryCard_app_time\"><%= benefit %></div>\r\n</div>\r\n";

/**
 * @class SummaryEntry
 * @param {} data Raw data from the server.
 */

var SummaryEntry = (function () {
    function SummaryEntry(data) {
        _classCallCheck(this, SummaryEntry);

        // Prepare and reformat data
        data.label = _Utilities.Utilities.cutLabel(data.label, 6);
        data.benefit = _Utilities.Utilities.splitTimeDrainString(data.benefit).timeDrainPart;
        data.id = _Utilities.Utilities.makeIdFromAppName(data.name, data.type, "entry");
        data.targetId = _Utilities.Utilities.makeIdFromAppName(data.name, data.type);

        this.data = data;

        // Render template
        var html = _ejs2.default.render(Template, data);
        this.node = this.createNode(html);
    }

    /**
     * @function
     * @instance
     * @returns {String} The id for the HTML-element
     id field.
     * @memberOf SummaryEntry
     */

    _createClass(SummaryEntry, [{
        key: "getId",
        value: function getId() {
            return this.data.id;
        }
    }, {
        key: "getTargetId",

        /**
         * @function
         * @instance
         * @returns {String} The id of the item that clicking
         this entry links to.
         * @memberOf SummaryEntry
         */
        value: function getTargetId() {
            return this.data.targetId;
        }
    }, {
        key: "getType",

        /**
         * @function
         * @instance
         * @returns {String} What kind of entry this is,
         hog or a bug.
         * @memberOf SummaryEntry
         */
        value: function getType() {
            return this.data.type;
        }
    }, {
        key: "createNode",
        value: function createNode(html) {
            var node = _Utilities.Utilities.makeDomNode(html);

            var tab;
            if (this.data.type != "HOG" && this.data.type != "BUG") return node;
            var tabId = this.data.type.toLowerCase() + "s-tab";

            var _this = this;
            node.addEventListener("click", function () {
                document.getElementById(tabId).click();
                window.location.hash = _this.data.targetId;
                var expandId = "card-" + _this.data.targetId + "-textpand";
                var expand = $("#" + expandId);
                if (!expand.hasClass("in")) {
                    expand.addClass("in");
                }
            });

            return node;
        }

        /**
         * @function
         * @instance
         * @returns {DOM-element} Rendered DOM element
         representing an app featured in the summary.
         * @memberOf SummaryEntry
         */

    }, {
        key: "render",
        value: function render() {
            return this.node;
        }
    }]);

    return SummaryEntry;
})();

exports.default = SummaryEntry;

},{"../helper/Utilities.js":14,"ejs":8}],19:[function(require,module,exports){
"use strict";

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ejs = require("ejs");

var _ejs2 = _interopRequireDefault(_ejs);

var _Utilities = require("../helper/Utilities.js");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Template = "<header class=\"mdl-layout__header mdl-color--blue-grey-500\"\r\n        id=\"header-bar\">\r\n    <img class=\"mdl-layout-icon\" src=\"img/icon.png\"></img>\r\n    <div class=\"mdl-layout__header-row mdl-layout-title\"\r\n         style=\"float:left; left:0px; top:2px;\">\r\n        <!-- Title -->\r\n        <span>Carat 2.0</span>\r\n        <span id=\"progress\"></span>\r\n        <span id=\"state\"></span>\r\n\r\n        <div class=\"mdl-layout-spacer\"></div>\r\n        <button class=\"mdl-button mdl-js-button mdl-button--icon\"\r\n                id=\"menu\" onclick=\"listenMenu();\">\r\n            <i class=\"material-icons\">more_vert</i>\r\n        </button>\r\n        <ul class=\"mdl-menu mdl-js-menu mdl-menu--bottom-right\"\r\n            for=\"menu\">\r\n            <li class=\"mdl-menu__item\" id=\"showHiddenBugCards\"\r\n                disabled=\"true\">Show hidden bugs</li>\r\n            <li class=\"mdl-menu__item\" id=\"showHiddenHogCards\"\r\n                disabled=\"true\">Show hidden hogs</li>\r\n            <li class=\"mdl-menu__item\" id=\"sendFeedback\">\r\n                Send Feedback\r\n            </li>\r\n            <li class=\"mdl-menu__item\" id=\"changeUuid\">Change UUID</li>\r\n            <li class=\"mdl-menu__item\" id=\"appSettings\">Settings</li>\r\n        </ul>\r\n\r\n    </div>\r\n\r\n    <!-- Tabs -->\r\n    <div class=\"mdl-layout__tab-bar mdl-color--blue-grey-500\">\r\n        <a href=\"#home\" class=\"mdl-layout__tab is-active\" id=\"home-tab\">\r\n            Home\r\n        </a>\r\n        <a href=\"#bugs\" class=\"mdl-layout__tab\" id=\"bugs-tab\">Bugs</a>\r\n        <a href=\"#hogs\" class=\"mdl-layout__tab\" id=\"hogs-tab\">Hogs</a>\r\n        <a href=\"#system\" class=\"mdl-layout__tab\" id=\"system-tab\">\r\n            Stats\r\n        </a>\r\n    </div>\r\n</header>\r\n";

/**
* @class Headerbar
* @summary Navigation bar.
*/

var Headerbar = (function () {
    function Headerbar() {
        _classCallCheck(this, Headerbar);

        this.elemId = "header-bar";
        this.parentId = "main-screen";
    }

    _createClass(Headerbar, [{
        key: "renderTemplate",
        value: function renderTemplate() {
            return _ejs2.default.render(Template);
        }
    }, {
        key: "hide",
        value: function hide() {
            var elem = document.getElementById(elemId);

            if (elem) {
                elem.style["display"] = "none";
            }
        }
    }, {
        key: "show",
        value: function show() {
            var elem = document.getElementById(elemId);

            if (elem) {
                elem.style["display"] = "inherit";
            }
        }
    }, {
        key: "renderInsert",
        value: function renderInsert() {
            var node = _Utilities.Utilities.makeDomNode(renderTemplate());
            document.getElementById(parentId).appendChild(node);
        }
    }]);

    return Headerbar;
})();

exports.default = Headerbar;

},{"../helper/Utilities.js":14,"ejs":8}],20:[function(require,module,exports){
"use strict";

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ejs = require("ejs");

var _ejs2 = _interopRequireDefault(_ejs);

var _HogBug = require("../model/HogBug.js");

var _HogBug2 = _interopRequireDefault(_HogBug);

var _Utilities = require("../helper/Utilities.js");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Template = "<div class=\"page-content\">\r\n    <% if(hogBugsArray && hogBugsArray.running && hogBugsArray.running.length >= 1) { %>\r\n        <div class=\"carat-module\">\r\n            <div class=\"carat-module-title\">\r\n                Running:&nbsp; <%= hogBugsArray.running.length %>\r\n            </div>\r\n            <div class=\"carat-module-content\" id=\"<%= cardLocIds.runningId %>\"></div>\r\n        </div>\r\n    <% } %>\r\n    <% if(hogBugsArray && hogBugsArray.inactive && hogBugsArray.inactive.length >= 1) { %>\r\n        <div class=\"carat-module\">\r\n            <div class=\"carat-module-title\">\r\n                Inactive:&nbsp; <%= hogBugsArray.inactive.length %>\r\n            </div>\r\n            <div class=\"carat-module-content\" id=\"<%= cardLocIds.inactiveId %>\"></div>\r\n        </div>\r\n    <% } %>\r\n    <% if(hogBugsArray && hogBugsArray.system && hogBugsArray.system.length >= 1) { %>\r\n        <div class=\"carat-module\">\r\n            <div class=\"carat-module-title\">\r\n                System:&nbsp;<%= hogBugsArray.system.length %>\r\n            </div>\r\n            <div class=\"carat-module-content\" id=\"<%= cardLocIds.systemId %>\"></div>\r\n        </div>\r\n    <% } %>\r\n</div>\r\n";

/**
* @class HogBugCards
* @summary List view for hog/bug cards.
*/

var HogBugCards = (function () {
    function HogBugCards(dataSource, outputElemId) {
        _classCallCheck(this, HogBugCards);

        this.dataSource = dataSource;
        this.outputElemId = outputElemId;
        this.docLocation = document.getElementById(outputElemId);
        this.renderAsync = this.renderAsyncSource(dataSource);
        this.cardLocIds = {
            runningId: this.cardLocIdMaker("running"),
            inactiveId: this.cardLocIdMaker("inactive"),
            systemId: this.cardLocIdMaker("system")
        };
    }

    _createClass(HogBugCards, [{
        key: "cardLocIdMaker",
        value: function cardLocIdMaker(locName) {
            return _Utilities.Utilities.makeIdFromOtherId(this.outputElemId, locName);
        }
    }, {
        key: "renderTemplate",
        value: function renderTemplate(hogBugsArray) {

            var templateData = {
                cardLocIds: this.cardLocIds,
                hogBugsArray: hogBugsArray
            };
            var html = _ejs2.default.render(Template, templateData);
            var rendered = _Utilities.Utilities.makeDomNode(html);

            var runningLoc = _Utilities.Utilities.findById(rendered, this.cardLocIds.runningId);
            var inactiveLoc = _Utilities.Utilities.findById(rendered, this.cardLocIds.inactiveId);
            var systemLoc = _Utilities.Utilities.findById(rendered, this.cardLocIds.systemId);

            _Utilities.Utilities.appendChildAll(runningLoc, hogBugsArray.running);
            _Utilities.Utilities.appendChildAll(inactiveLoc, hogBugsArray.inactive);
            _Utilities.Utilities.appendChildAll(systemLoc, hogBugsArray.system);

            return rendered;
        }
    }, {
        key: "makeModels",
        value: function makeModels(rawData) {

            var result = {
                running: [],
                inactive: [],
                system: []
            };

            for (var key in rawData) {
                var model = new _HogBug2.default(rawData[key]);

                if (model.getRunning()) {
                    result.running.push(model);
                } else if (!model.getUninstallable()) {
                    result.system.push(model);
                } else {
                    result.inactive.push(model);
                }
            }

            return result;
        }
    }, {
        key: "renderModels",
        value: function renderModels(categories) {

            var morphToHTML = function morphToHTML(model) {
                return model.render();
            };

            return {
                running: categories.running.map(morphToHTML),
                inactive: categories.inactive.map(morphToHTML),
                system: categories.system.map(morphToHTML)
            };
        }
    }, {
        key: "renderAsyncSource",
        value: function renderAsyncSource(sourceCallback) {
            var _this = this;
            return function (onResultCallback) {
                sourceCallback(function (data) {
                    var models = _this.makeModels(data);
                    var result = _this.renderTemplate(_this.renderModels(models));
                    if (onResultCallback) {
                        onResultCallback(result);
                    }
                });
            };
        }
    }, {
        key: "setDataSource",

        /**
         * @function
         * @instance
         * @param {} freshDataSource A callback which is used for
         acquiring data from the server.
         * @memberOf HogBugCards
         */
        value: function setDataSource(freshDataSource) {
            this.dataSource = freshDataSource;
            this.renderAsync = this.renderAsyncSource(freshDataSource);
        }
    }, {
        key: "renderInsert",

        /**
         * @function
         * @instance
         * @memberOf HogBugCards
         * @summary Insert these cards as a part of the document.
         */
        value: function renderInsert() {
            var _this = this;
            this.renderAsync(function (renderedTemplate) {
                _this.docLocation.appendChild(renderedTemplate);
            });
        }
    }]);

    return HogBugCards;
})();

exports.default = HogBugCards;

},{"../helper/Utilities.js":14,"../model/HogBug.js":16,"ejs":8}],21:[function(require,module,exports){
"use strict";

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ejs = require("ejs");

var _ejs2 = _interopRequireDefault(_ejs);

var _SummaryContainer = require("../model/SummaryContainer.js");

var _SummaryContainer2 = _interopRequireDefault(_SummaryContainer);

var _Utilities = require("../helper/Utilities.js");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

/**
 * @class HomeCards
 */

var HomeCards = (function () {
    function HomeCards() {
        _classCallCheck(this, HomeCards);

        this.docLocation = document.querySelector("#home .page-content");
        this.dataSource = this.defaultDataSource;
        this.summaryContainer = new _SummaryContainer2.default();

        var _this = this;
        this.renderAsync = (function (source) {
            return _this.renderAsyncSource(source);
        })(this.dataSource);
    }

    _createClass(HomeCards, [{
        key: "defaultDataSource",
        value: function defaultDataSource(callback) {
            window.carat.getBugs(function (bugs) {
                window.carat.getHogs(function (hogs) {
                    callback({
                        bugs: bugs,
                        hogs: hogs
                    });
                });
            });
        }
    }, {
        key: "renderAsyncSource",
        value: function renderAsyncSource(sourceCallback) {
            var _this = this;
            return function (onResultCallback) {
                sourceCallback(function (data) {

                    if (!_this.summaryContainer) {
                        _this.summaryContainer = new _SummaryContainer2.default(data.bugs, data.hogs);
                    } else {
                        _this.summaryContainer.refreshModel(data.bugs, data.hogs);
                    }
                    var rendered = _this.summaryContainer.render();

                    if (onResultCallback) {
                        onResultCallback(rendered);
                    }
                });
            };
        }
    }, {
        key: "setDataSource",

        /**
         * @function
         * @instance
         * @param {} freshDataSource A callback which is used for
         acquiring data from the server.
         * @memberOf HomeCards
         */
        value: function setDataSource(freshDataSource) {
            this.dataSource = freshDataSource;
            this.renderAsync = this.renderAsyncSource(freshDataSource);
        }
    }, {
        key: "refreshSummaryCard",
        value: function refreshSummaryCard() {
            _Utilities.Utilities.appendOrReplace(this.docLocation, this.summaryContainer.id, this.summaryContainer.render());
        }

        /**
         * @function
         * @instance
         * @memberOf HomeCards
         * @summary Insert these cards as a part of the document.
         */

    }, {
        key: "renderInsert",
        value: function renderInsert() {
            var _this = this;
            this.renderAsync(function (renderedTemplate) {
                var node = renderedTemplate;
                _this.refreshSummaryCard();
                showOrHideActions();
            });
        }
    }]);

    return HomeCards;
})();

exports.default = HomeCards;

},{"../helper/Utilities.js":14,"../model/SummaryContainer.js":17,"ejs":8}],22:[function(require,module,exports){
"use strict";

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ejs = require("ejs");

var _ejs2 = _interopRequireDefault(_ejs);

var _Utilities = require("../helper/Utilities.js");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Template = "<main class=\"mdl-layout__content\">\r\n    <!-- Home view -->\r\n    <section class=\"mdl-layout__tab-panel is-active\" id=\"home\">\r\n\r\n        <!-- Pie card -->\r\n        <div class=\"page-content\">\r\n            <div class=\"mdl-card mdl-shadow--2dp\">\r\n                <div class=\"carat-caratCard__title\">\r\n                    <div class=\"mdl-card__title-text\r\n                                carat_caratCard_title_text\">\r\n                        Global Statistics\r\n                    </div>\r\n                </div>\r\n                <div class=\"carat-card__supporting-text\">\r\n                    <div class=\"canvas-container\">\r\n                        <canvas width=\"350\" height=\"250\"\r\n                                id=\"chart\"></canvas>\r\n                    </div>\r\n                    <ul id=\"chart-legend\"></ul>\r\n                </div>\r\n            </div>\r\n        </div>\r\n\r\n    </section>\r\n\r\n    <!-- Bugs tabs view -->\r\n    <section class=\"mdl-layout__tab-panel\" id=\"bugs\">\r\n    </section>\r\n\r\n    <!-- Hogs tab view -->\r\n    <section class=\"mdl-layout__tab-panel\" id=\"hogs\">\r\n    </section>\r\n\r\n    <!-- System tab view -->\r\n    <section class=\"mdl-layout__tab-panel\" id=\"system\">\r\n    </section>\r\n</main>\r\n";

/**
* @class MainContent
* @summary Content view
*/

var MainContent = (function () {
    function MainContent() {
        _classCallCheck(this, MainContent);

        this.parentId = "main-screen";
    }

    _createClass(MainContent, [{
        key: "renderTemplate",
        value: function renderTemplate() {
            return _ejs2.default.render(Template);
        }
    }, {
        key: "renderInsert",
        value: function renderInsert() {
            var node = _Utilities.Utilities.makeDomNode(renderTemplate());
            document.getElementById(parentId).appendChild(node);
        }
    }]);

    return MainContent;
})();

exports.default = MainContent;

},{"../helper/Utilities.js":14,"ejs":8}],23:[function(require,module,exports){
"use strict";

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _ejs = require("ejs");

var _ejs2 = _interopRequireDefault(_ejs);

var _DeviceStats = require("../model/DeviceStats.js");

var _DeviceStats2 = _interopRequireDefault(_DeviceStats);

var _SettingList = require("../components/SettingList.js");

var _SettingList2 = _interopRequireDefault(_SettingList);

var _Utilities = require("../helper/Utilities.js");

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

var Template = "<div class=\"page-content\">\r\n    <div class=\"carat-module\">\r\n        <div class=\"carat-module-title\">\r\n            System information:\r\n        </div>\r\n    <div class=\"carat-module-content\" id=\"system-info\"></div>\r\n    </div>\r\n    <div class=\"carat-module\" id=\"system-card-list\"></div>\r\n</div>";

/**
* @class StatsCards
* @summary Handles device information.
*/

var StatsCards = (function () {
    function StatsCards() {
        _classCallCheck(this, StatsCards);

        this.dataSource = this.defaultDataSource;
        var html = _ejs2.default.render(Template);
        this.node = _Utilities.Utilities.makeDomNode(html);

        // Get mutable elements
        this.info = this.node.querySelector("#system-info");
        this.cardList = this.node.querySelector("#system-card-list");

        // Start loading system information and suggestions
        // Rendering can take place before these finish
        this.loadInfo();
        this.loadSuggestions();
    }

    _createClass(StatsCards, [{
        key: "loadInfo",
        value: function loadInfo() {
            var _this = this;

            carat.getMainReports(function (main) {
                carat.getMemoryInfo(function (memInfo) {
                    carat.getUuid(function (uuid) {
                        var systemCard = new _DeviceStats2.default({
                            modelName: window.device.model,
                            osVersion: window.device.version,
                            jScore: main.jscore,
                            uuid: uuid,
                            usedMemory: memInfo.total - memInfo.available,
                            totalMemory: memInfo.total / 1000,
                            percentage: memInfo.available / memInfo.total,
                            batteryLife: main.batteryLife
                        });
                        _this.info.appendChild(systemCard.render());
                    });
                });
            });
        }
    }, {
        key: "loadSuggestions",
        value: function loadSuggestions() {
            var settingsList = new _SettingList2.default(suggestions);
            this.cardList.appendChild(settingsList.render());
        }
    }, {
        key: "render",
        value: function render() {
            return this.node;
        }
    }]);

    return StatsCards;
})();

exports.default = StatsCards;

},{"../components/SettingList.js":13,"../helper/Utilities.js":14,"../model/DeviceStats.js":15,"ejs":8}],24:[function(require,module,exports){
"use strict";

var _createClass = (function () {
    function defineProperties(target, props) {
        for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];descriptor.enumerable = descriptor.enumerable || false;descriptor.configurable = true;if ("value" in descriptor) descriptor.writable = true;Object.defineProperty(target, descriptor.key, descriptor);
        }
    }return function (Constructor, protoProps, staticProps) {
        if (protoProps) defineProperties(Constructor.prototype, protoProps);if (staticProps) defineProperties(Constructor, staticProps);return Constructor;
    };
})();

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _HomeCards = require("./HomeCards.js");

var _HomeCards2 = _interopRequireDefault(_HomeCards);

var _HogBugCards = require("./HogBugCards.js");

var _HogBugCards2 = _interopRequireDefault(_HogBugCards);

var _StatsCards = require("./StatsCards.js");

var _StatsCards2 = _interopRequireDefault(_StatsCards);

var _Headerbar = require("./Headerbar.js");

var _Headerbar2 = _interopRequireDefault(_Headerbar);

var _MainContent = require("./MainContent.js");

var _MainContent2 = _interopRequireDefault(_MainContent);

var _InformationDialog = require("../components/InformationDialog.js");

var _InformationDialog2 = _interopRequireDefault(_InformationDialog);

function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
}

function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

/**
* @class MasterView
* @summary Class that wraps up all other views.
*/

var MasterView = (function () {
    function MasterView() {
        _classCallCheck(this, MasterView);

        this.bugsRawData = [];
        this.hogsRawData = [];
        this.mainReportsRawData = [];
        this.deviceInfoRawData = [];
        this.memoryRawData = [];
        this.savedUuid = "";

        this.headerView = new _Headerbar2.default();
        this.mainView = new _MainContent2.default();
        this.homeView = new _HomeCards2.default();
        this.systemTab = new _StatsCards2.default();
        this.bugsView = new _HogBugCards2.default(carat.getHogs, "bugs");
        this.hogsView = new _HogBugCards2.default(carat.getBugs, "hogs");

        // Make dialog globally accessible via app namespace
        var dialog = new _InformationDialog2.default();
        app.showDialog = dialog.show.bind(dialog);
        app.closeDialog = dialog.hide.bind(dialog);

        this.bugsFetcherAsync = this.bugsFetcherAsync.bind(this);
        this.hogsFetcherAsync = this.hogsFetcherAsync.bind(this);
        this.hogsAndBugsFetcherAsync = this.hogsAndBugsFetcherAsync.bind(this);
        this.myDeviceFetcherAsync = this.myDeviceFetcherAsync.bind(this);
        this.memoryStatsFetcherAsync = this.memoryStatsFetcherAsync.bind(this);

        this.bugsView.setDataSource(this.bugsFetcherAsync);
        this.hogsView.setDataSource(this.hogsFetcherAsync);
        this.homeView.setDataSource(this.hogsAndBugsFetcherAsync);
    }

    _createClass(MasterView, [{
        key: "savedInfoFetcherAsync",
        value: function savedInfoFetcherAsync(savedInfo, dataSource, callback) {
            if (!savedInfo || savedInfo.length === 0) {

                dataSource(function (data) {

                    savedInfo = data;
                    callback(data);
                });
            } else {
                callback(savedInfo);
            }
        }
    }, {
        key: "uuidFetcherAsync",
        value: function uuidFetcherAsync(callback) {

            var uuidGetter = function uuidGetter(action) {
                carat.getUuid(function (uuid) {
                    if (!uuid) {
                        action("Default");
                    }

                    action(uuid);
                });
            };

            this.savedInfoFetcherAsync(this.savedUuid, uuidGetter, callback);
        }
    }, {
        key: "memoryStatsFetcherAsync",
        value: function memoryStatsFetcherAsync(callback) {

            var getMemory = function getMemory(action) {
                carat.getMemoryInfo(function (memInfo) {
                    var usedMemory = Math.round((memInfo.total - memInfo.available) / 1000);
                    var totalMemory = Math.round(memInfo.total / 1000);
                    var percentage = Math.floor(usedMemory / totalMemory * 100);

                    var result = {
                        usedMemory: usedMemory,
                        totalMemory: totalMemory,
                        percentage: percentage
                    };

                    action(result);
                });
            };

            this.savedInfoFetcherAsync(this.memoryRawData, getMemory, callback);
        }
    }, {
        key: "mainReportsFetcherAsync",
        value: function mainReportsFetcherAsync(callback) {

            this.savedInfoFetcherAsync(this.mainReportsRawData, carat.getMainReports, callback);
        }
    }, {
        key: "deviceInfoFetcherAsync",
        value: function deviceInfoFetcherAsync(callback) {

            var getDeviceInfo = function getDeviceInfo(action) {
                var device = {
                    modelName: window.device.model,
                    osVersion: window.device.platform + " " + window.device.version
                };
                action(device);
            };

            this.savedInfoFetcherAsync(this.deviceInfoRawData, getDeviceInfo, callback);
        }
    }, {
        key: "myDeviceFetcherAsync",
        value: function myDeviceFetcherAsync(callback) {

            var _this = this;
            _this.deviceInfoFetcherAsync(function (deviceInfo) {
                _this.memoryStatsFetcherAsync(function (memInfo) {
                    _this.mainReportsFetcherAsync(function (mainData) {
                        _this.uuidFetcherAsync(function (uuid) {
                            callback({
                                modelName: deviceInfo.modelName,
                                osVersion: deviceInfo.osVersion,
                                jScore: mainData.jscore,
                                uuid: uuid,
                                usedMemory: memInfo.usedMemory,
                                totalMemory: memInfo.totalMemory,
                                memoryPercentage: memInfo.percentage,
                                batteryLife: mainData.batteryLife
                            });
                        });
                    });
                });
            });
        }
    }, {
        key: "bugsFetcherAsync",
        value: function bugsFetcherAsync(callback) {
            this.savedInfoFetcherAsync(this.bugsRawData, carat.getBugs, callback);
        }
    }, {
        key: "hogsFetcherAsync",
        value: function hogsFetcherAsync(callback) {

            this.savedInfoFetcherAsync(this.hogsRawData, carat.getHogs, callback);
        }
    }, {
        key: "hogsAndBugsFetcherAsync",
        value: function hogsAndBugsFetcherAsync(callback) {

            var _this = this;
            _this.bugsFetcherAsync(function (bugs) {
                _this.hogsFetcherAsync(function (hogs) {
                    callback({
                        bugs: bugs,
                        hogs: hogs
                    });
                });
            });
        }
    }, {
        key: "render",
        value: function render() {
            this.bugsView.renderInsert();
            this.hogsView.renderInsert();
            this.homeView.renderInsert();

            // Experimental rendering
            var container = document.querySelector("#system");
            container.appendChild(this.systemTab.render());
        }
    }, {
        key: "renderBase",
        value: function renderBase() {
            this.headerView.renderInsert();
            this.mainView.renderInsert();
        }
    }]);

    return MasterView;
})();

window.MasterView = MasterView;
exports.default = MasterView;

},{"../components/InformationDialog.js":11,"./Headerbar.js":19,"./HogBugCards.js":20,"./HomeCards.js":21,"./MainContent.js":22,"./StatsCards.js":23}]},{},[24]);
