var http = require('http');
var express = require("express");
const app = express();

app.use(express.static('bin'));

const server = http.createServer(app);


server.listen(3000, () => {
  console.log("Server running on port " + 3000);
});

const readline = require('readline');
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', function (str, key) {
  if (key && key.name == 'q') process.exit();
});

console.log("Press 'q' to exit");