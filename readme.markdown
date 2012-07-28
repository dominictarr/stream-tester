#Streams to assist testing Streams

writing streams can be difficult, one of the most difficult aspects can be testing them througherly.

that is where stream-tester comes in. 
stream-tester can be used to generate data to exercise your streams.
combine it with [stream-spec](https://github.com/dominictarr/stream-spec)
which will validate your stream's behaviour and you've got a pretty easy test suite.

## createRandomStream (generator, max)

create a stream of random chunks. `generator` defaults to `Math.random`.
emit `'end'` after `max` chunks. `max` defaults to `Infinity`

## createIncStream (max)

create a stream of increasing numbers, up to `max`

## createPauseStream (prob, delay)

create a through stream that randomly pauses
(returns false from `write`). `prob` is the probability
of a pause. `delay` is the time to wait before emitting `'drain'`. defaults are `prob=0.1`, and `delay` is next tick.
