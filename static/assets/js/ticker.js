window.onload = function() {
  let save=document.querySelector('button#saveImg');
  save.addEventListener('click',function(){window.open(myChart.toBase64Image());});
  let rgbaC = ['rgba(255,0,0,1.0)','rgba(255,153,0,1.0)','rgba(255,255,0,1.0)','rgba(0,255,0,1.0)','rgba(0,0,255,1.0)','rgba(75,0,130,1.0)','rgba(238,130,238,1.0)'];

  let maxStocks=7;

  let tickerBox=document.querySelector('input#tickerSymbol');
  let awesome = new Awesomplete(tickerBox);

  let dates=[...window.INITIAL_STATE.dRange];
  let chartData = {};
  chartData.labels=dates;
  chartData.datasets=[];
  let chartCtx;
  let tickerList = {};
  let myChart;
  let typeAhead;
  let socket = io();
  let minPrices=[];
  let maxPrices=[];
  socket.on('clientAdd', function(data) { addStock(data); });
  socket.on('clientRemove', function(ticker) { removeStock(ticker); });

  //receive JSON typeahead stock data from server
  //propagate autocomplete box with options
  socket.on('jsonStocks', function(data) {
    typeAhead=data;
    let sweetB=typeAhead.map(function(m){
      return {label:`${m.ticker}: ${m.name}`,value:`${m.URL}`};
    });
    awesome.list=sweetB;
  });
  socket.on('currentStocks', function(data) {
    data.forEach((d)=>{addStock(d.data);});
  });

  let stockBox=document.querySelector('div#stockList');
  tickerBox.addEventListener('awesomplete-selectcomplete',submitStock);
  tickerBox.focus();

  function submitStock(e){
    e.preventDefault();
    if(chartData.datasets.length>=maxStocks) {
        window.alert(`Sorry, but you'll have to remove a stock before adding any more!`);
        return false;
      }
    else {
      socket.emit('stockAdd',e.text.value);
      tickerBox.value='';
      }
    }

  function addStockToDataset(stock,params) {
    let dates=window.INITIAL_STATE.dRange;
    tickerList[`${stock.dataset.database_code}/${stock.dataset.dataset_code}`]=1;
    let prices={}; // e.g., AAPL: [array of prices]
    let sData={};
    stock.dataset.data.forEach((day)=>sData[day[0]]=day[1]); //dictionary of dates -> prices
    let pArr=[];
      for (var i=0;i<dates.length;i++) {
        if (sData[dates[i]]) { pArr.push(sData[dates[i]]); }
        else { pArr.push(null); }
      }
    minPrices.push(Math.min(...pArr));
    maxPrices.push(Math.max(...pArr));
    let rObj={label:stock.dataset.dataset_code,data:pArr,URL:`${stock.dataset.database_code}/${stock.dataset.dataset_code}`};
    Object.keys(params).forEach((key)=>{ rObj[key]=params[key]; }); //add styling parameters
    return rObj;
    }

  //set min and max chart axes to display all prices in range
  let minPrice=Math.min(...minPrices);
  let maxPrice=Math.max(...maxPrices);

  function updateMinMaxPrice(nMin,nMax) { //this works for adding but we also want to be able to remove
      (nMin<minPrice) ? minPrice=nMin : null;
      (nMax>maxPrice) ? maxPrice=nMax : null;
  }

  let golden_ratio=0.618033988749895;
  let randomHue=(Math.floor(Math.random()*150)+12);
  let lastHue=randomHue;

  function getRandColor(brightness){
      // Six levels of brightness from 0 to 5, 0 being the darkest
      var rgb = [Math.random() * 256, Math.random() * 256, Math.random() * 256];
      var mix = [brightness*51, brightness*51, brightness*51]; //51 => 255/5
      var mixedrgb = [rgb[0] + mix[0], rgb[1] + mix[1], rgb[2] + mix[2]].map(function(x){ return Math.round(x/2.0)})
      return "rgba(" + mixedrgb.join(",") + ",1.0)";
  }

  function addStock(data) {
    let rH=rgbaC[Object.keys(tickerList).length];
    //getRandColor(1);
    let tickerURL=`${data.dataset.database_code}/${data.dataset.dataset_code}`;
    if (tickerList[tickerURL]) { return false; }; //duplication check: don't add if already there.
    //let randomRGB=hsvToRGB(rH, 0.8, 0.75);
    let params={
     fill: false,
     lineTension: 0.1,
     backgroundColor: rH,
     borderColor: rH,
     borderCapStyle: 'butt',
     borderDash: [],
     borderDashOffset: 0.0,
     borderJoinStyle: 'miter',
     borderWidth: 2,
     pointBorderColor: rH,
     pointBackgroundColor: "#000",
     pointBorderWidth: 1,
     pointHoverRadius: 6,
     pointHoverBackgroundColor: "rgba(75,192,192,1)",
     pointHoverBorderColor: "rgba(220,220,220,1)",
     pointHoverBorderWidth: 1,
     pointRadius: 5,
     pointHitRadius: 10,
    };
    chartData.datasets.push(addStockToDataset(data,params));
    if (myChart) { myChart.destroy(); }
    drawChart(chartData);
    updateStockBoxLabels(chartData);
  }

  function removeStock(tickerURL) {
    delete tickerList[tickerURL];
    chartData.datasets=chartData.datasets.filter((data)=>data.URL!==tickerURL);
    myChart.destroy();
    drawChart(chartData);
    updateStockBoxLabels(chartData);
  }

  function drawChart(cData) {
    var ctx = document.getElementById("stockGraph");
    myChart = new Chart(ctx, {
    type: 'line',
    data: cData,
    options: {
      title: {
          fontSize: 16,
          fontFamily: "'Helvetica Neue', 'Helvetica', 'sans-serif'",
          display: true,
          padding: 2,
          text: `Closing Prices from ${cData.labels[0]} to ${cData.labels[cData.labels.length-1]}`
      },
        scales: {
            yAxes: [{
              ticks: {
                beginAtZero:false,
                scale: 2
              }
                }]
              }
            }
          });
      chartCtx=ctx;
      console.dir(myChart);
      }

      function updateStockBoxLabels(cData) {
        stockBox.innerHTML=null;
        let labels=cData.datasets.map((d)=>[d.label, d.URL]);
        labels.forEach((l)=>{
            let s=document.createElement('span');
            s.id=l[1];
            s.innerHTML=`${l[0]} <a href="#" id="${l[1]}" class="removeStock">remove</a><br />`;
            stockBox.appendChild(s);
        });

        let spanLinks=document.querySelectorAll('div#stockList span');
        let prevBorderColor;
        let prevWidth;
        let urlToDatasetIndex={};
        spanLinks.forEach((s)=>s.addEventListener('mouseover',function(e){
          urlToDatasetIndex={}; //dictionary of URL->dataset index
          for (var i=0;i<chartData.datasets.length;i++){ //map URL in dataset to the dataset index
            urlToDatasetIndex[chartData.datasets[i].URL]=i;
          }
          prevBorderColor=chartData.datasets[urlToDatasetIndex[e.target.id]].borderColor;
          chartData.datasets[urlToDatasetIndex[e.target.id]].borderColor='rgba(255,0,0,1.0)';
          chartData.datasets[urlToDatasetIndex[e.target.id]].borderColor='rgba(255,0,0,1.0)';
          prevWidth=chartData.datasets[urlToDatasetIndex[e.target.id]].borderWidth;
          chartData.datasets[urlToDatasetIndex[e.target.id]].borderWidth=5;
          myChart.update();
        }));

        spanLinks.forEach((s)=>s.addEventListener('mouseout',function(e){
          chartData.datasets[urlToDatasetIndex[e.target.id]].borderColor=prevBorderColor;
          chartData.datasets[urlToDatasetIndex[e.target.id]].borderWidth=prevWidth;
          myChart.update();
        }));

        let removeLinks=document.querySelectorAll('a.removeStock');
        removeLinks.forEach((link)=>link.addEventListener('click',handleRemoveStock));
        function handleRemoveStock(e) {
          removeStock(e.target.id);
          socket.emit('stockRemove',e.target.id); //tell the others
        }
      }
}
