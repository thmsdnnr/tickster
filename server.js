const express=require('express');
const bodyParser=require('body-parser');
const path=require('path');
const cookieParser=require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const fetch = require('node-fetch');
const moment = require('moment');
const fs = require('fs');
const Db=require('./stockDb.js');
const app=express();
const server=require('http').Server(app);
const io = require('socket.io')(server);

let tickerToURL={};
let maxNumStocks=7;

io.on('connection', function (socket) {
  let initStocks=['WIKI/AAPL','WIKI/MSFT','WIKI/TSLA']; //initial stocks to display
  initStocks.forEach((s)=>addStock(s));
  console.log('client connected!');
  loadStocks().then(function(jsonData) {
    jsonData.map((s)=>tickerToURL[s.ticker]=s.URL);
    socket.emit('jsonStocks', jsonData); //send jsonData to client for ticker typeahead
  });

  //Client messages:
  //stockAdd: query Quandl API, store data to Db, return data, then project to all clients
  //stockRemove: delete data from Db, send message to clients to remove stock
  socket.on('stockRemove', function(tickerURL){
    socket.broadcast.emit('clientRemove', tickerURL); // BROADCAST: don't tell the client that sent the message b/c you already removed it here
  });
  socket.on('stockAdd', function(tickerURL){ console.log(tickerURL); addStock(tickerURL); }); //TODO add validation here against stock list
});

function addStock(tickerURL) {
  let now = moment();
  let dates=genDayArray(14,'asc',true);
  let dateEnd = dates[1];
  let dateStart = dates[0];
  Db.fetchOneStock({tickerURL:tickerURL},function(data) {
    if (data) { // we already have the data
      let now=new moment();
      let then=new moment(data[0].stockAdded);
      if (Math.round((now-then)/(1000*60*60*24))<1) { //and it's less than one day old
        console.log('emitting');
        io.emit('clientAdd', data[0].data); //so don't query the API again, just display
        return true;
      }
      else {
        //it's more than a day old, so delete
        Db.deleteStock({tickerURL:tickerURL},function(){console.log('Deleted stale data.');});
        console.log('new stock: ');
        console.log(tickerURL);
          let newStock=getFromQuandlByTicker(tickerURL,dateStart,dateEnd);
          newStock.then(function(data){
            if (data.quandl_error) {
              console.log(`${data.quandl_error.code}: ${data.quandl_error.message}`);
              return false;
            }
            else {
              io.emit('clientAdd', data);
              Db.saveStock({tickerURL:tickerURL, data:data}, function(data){console.log(data);});
            }
          });
        }
      }
      else {
        console.log('new stock: ');
        console.log(tickerURL);
          let newStock=getFromQuandlByTicker(tickerURL,dateStart,dateEnd);
          newStock.then(function(data){
            if (data.quandl_error) {
              console.log(`${data.quandl_error.code}: ${data.quandl_error.message}`);
              return false;
            }
            else {
              io.emit('clientAdd', data);
              Db.saveStock({tickerURL:tickerURL, data:data}, function(data){console.log(data);});
            }
          });
        }
      });
    }

app.use(cookieParser());
app.use(session({
  store: new MongoStore({
    url: process.env.PROD_DB||'mongodb://localhost:27017/ndlrn',
    ttl: 14 * 24 * 60 * 60 // = 14 days. Default
  }), //https://github.com/jdesboeufs/connect-mongo
  secret: process.env.SESSION_SECRET || 'DREAMSBEDREAMS',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge:(60*60*1000) } //1 hour max age -> DOESN'T WORK WITH SECURE:TRUE ON NON-HTTPS LOCALHOST
}));
app.use(express.static(path.join(__dirname+'/static')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname+'/views'));

function loadStocks() {
  return new Promise(function(resolve,reject) {
      fs.readFile(path.join(__dirname+'/static/assets/stocks.json'), function(err,file) {
        if (!err) {
          resolve(JSON.parse(file));
        }
        else {
          reject(err);
        }
      });
    });
  }

  function getFromQuandlByTicker(ticker,startDate,endDate) {
    console.log('getfromQuandlByTicker: '+ticker);
    return new Promise(function (resolve,reject) {
      fetch(`https://www.quandl.com/api/v3/datasets/${ticker}.json?api_key=${process.env.API_KEY}&column_index=4&start_date=${startDate}&end_date=${endDate}&collapse=daily&order=asc`)
    .then(function(quandl) { resolve(quandl.json()); })
    .catch(function(err) { reject(err); }); //returns a promise
  });
}

app.get('/', function(req,res) {res.render('ticker',{data:{dRange:genDayArray(14)}}); });
app.get('*', function(req,res) { res.render('ticker',{data:{dRange:genDayArray(14)}}); });

function genDayArray(numDays,direction='asc',endPointsOnly=false) {
  //generate an array of numDays days into the past, omitting weekends and dates in the holidayarray
  //if endpoints is true, just return first and last
    let holiday={"01-02":1,"01-16":1,"02-20":1,"04-14":1,"05-29":1,"07-04":1,"09-04":1,"11-23":1,"12-25":1};
    let dayArr=[];
    let counter=1;
    while (dayArr.length<numDays) {
    let now=moment();
    let d=(now.subtract(counter,"day"));
    let dayNum=d.day()%7;
    if (!(dayNum===0||dayNum===6)&&(!holiday[d.format("MM-DD")])) {
    dayArr.push(d.format("YYYY-MM-DD"));
    }
    counter++;
}
  let l=dayArr.length;
  //we generate it from present-to-past->if we want old to new or asc, we must reverse
  if (!endPointsOnly) { return (direction==='asc') ? dayArr.reverse() : dayArr; }
  else { return (direction==='asc') ? [dayArr.reverse()[0],dayArr[l-1]] : [dayArr[0],dayArr[l-1]]; }
}

server.listen(process.env.PORT||3000);
