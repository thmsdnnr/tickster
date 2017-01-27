[ ] Save global state and currently queried data in a DB and delete-overtime to reduce the # of API calls
[ ] Make color display prettier etc
[X] Default route for users w/decent # of stocks to view
[ ] Z-index for ticker box text input so you can click on the part that covers the canvas without ilk
[ ] Make colors more centralized and update on-color change
[ ] Resizing (check Chart.js docu)

[X] Maybe bug with selector: when there's just one item, can't keydown to select it.
[X] Max number of stocks
[X] Wrap initialization up into a function of some sort
[X] padding
[X] Global state
[X] validation
[X] Rescale chart size on window close
[X] Hover over chart ticker names at bottom making some kind of highlight of the dataset so you can "preview" what you're about to remove
[X] Prevent double-adding the same stock symbol to the chart (don't double-query)
[X] Chart title: CLOSING PRICES for <DATE RANGE>
[X] Cache results/memoify call locally for faster lookup and delete after some period

##V. helpful socket.io info!
(http://stackoverflow.com/questions/10058226/send-response-to-all-clients-except-sender-socket-io)[http://stackoverflow.com/questions/10058226/send-response-to-all-clients-except-sender-socket-io]
// sending to sender-client only
socket.emit('message', "this is a test");

// sending to all clients, include sender
io.emit('message', "this is a test");

// sending to all clients except sender
socket.broadcast.emit('message', "this is a test");

// sending to all clients in 'game' room(channel) except sender
socket.broadcast.to('game').emit('message', 'nice game');

// sending to all clients in 'game' room(channel), include sender
io.in('game').emit('message', 'cool game');

// sending to sender client, only if they are in 'game' room(channel)
socket.to('game').emit('message', 'enjoy the game');

// sending to all clients in namespace 'myNamespace', include sender
io.of('myNamespace').emit('message', 'gg');

// sending to individual socketid
socket.broadcast.to(socketid).emit('message', 'for your eyes only');

#LONG-TERM:
[ ] stock trading app/"my portfolio" chart and etc.
[ ] "Play portfolios" -> assemble a portfolio of stocks & buy dates, determine how it would have performed over Time
[ ] Save portfolios and share with yr friendz
