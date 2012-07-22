var through = require('through')
var from    = require('from')
var a       = require('assertions')

exports.createRandomStream = 
  function (funx, max) {
    max = max == null ? Infinity : max
    if('number' == typeof funx) {
      max = funx; funx = Math.random
    }
    return from (function (i, next) {
      if(i < max)
        this.emit('data', funx())
      else
        return this.emit('end')
      return true
    })
  }

exports.createIncStream = 
  function (funx, max) {
    max = max == null ? Infinity : max
    if('number' == typeof funx) {
      max = funx; funx = Math.random
    }
    return from (function (i, next) {
      console.log(i, max)
      if(i > max)
        return this.emit('end')
      this.emit('data', i + 1)
      return true
   })
  }


exports.createPauseStream = 
  function pauseStream (prob, delay) { 
    if(!prob) prob = 0.1
    var pauseIf = (
      'function' == typeof prob 
      ? prob
      : function () {
          return Math.random() < prob
        } 
    )

    var delayer = ( 
        !delay 
      ? process.nextTick
      : 'number' == typeof delay 
      ? function (next) { setTimeout(next, delay) }
      : delay
    )   

    return through(function (data) {    
      if(!this.paused && pauseIf()) {
        console.log('PAUSE STREAM PAUSING')
        this.pause()
        var self = this
        delayer(function () {
          console.log('PAUSE STREAM RESUMING')
          self.resume()
        })
      }
      this.emit('data', data) 
    }, function () {
      this.emit('end')
    })
  }


//unpauseStream ignores pause/resume
//piping through this will mean upstream
//does not respect pause from down stream.
//useful to test buffering, incombination with pauseStream
exports.createUnpauseStream = 
  function () {
    var t = through()
    t.pause = function () { return this }
    t.resume = function () { return this }
    return t 
  }

//check that one point in the pipe is the same as another point
//further down stream. useful for testing new types of io stream.

exports.createConsistentStream = 
  function (test, endTest) {
    test = test || a.deepEqual
    endTest = endTest || function (actual, expected) {
        a.equal(
          expected.length, 
          actual.length, 
          'slave stream expected ' + expected.length + ' writes')
    }
    var stream = through()
    var chunks = 0
    stream.on('data', function () {
      chunks ++
    })

    stream.createSlave = function () {
      var _expected = []
        , expected = []
        , actual = []
        , count = 0
        , ended = false
      stream.listeners('data').unshift(function (data) {
        _expected.push(data)
        expected.push(data)
      })
      var slave = through()
      slave.on('data', function (data) {
        a.greaterThan(expected.length, 0, 'slave stream did not expect write')
        a.equal(ended, false, 'slave expected stream not to have ended') 
        var _data = _expected.shift()
        actual.push(data)
        count ++
        test(data, data)
      })
      //it's okay to pass data to end(data)
      //but never emit('end', data)
      slave.on('end', function () {
        ended = true
        endTest(actual, expected)
      })
      slave.validate = function (message) {
        a.equal(count, chunks, 'slave must recieve same number of chunks as master')
        a.ok(count)
      }
      return slave
    }
    return stream
  }
