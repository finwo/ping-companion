const root  = (new Function('return this;'))();
const fetch = root.fetch || require('node-fetch');
const Chart = require('chart.js');
require('chartjs-adapter-moment');

const chart_config = {
  type: 'line',
  options: {
    scales: {
      x: {type:'time',time:{unit:'minute'}}
    },
    plugins: {
      legend: {display:false},
    },
  },
};

const ticks     = [];
const graphdata = {
  rtt: [],
  p95: [],
};

// Initialize charts
const chart_rtt = new Chart(graph_rtt, {
  ...chart_config,
  data: {
    datasets: [{
      tension: 0.25,
      data: graphdata.rtt,
      borderColor: 'rgba(0,85,170,1)',
    }],
  },
});
const chart_p95 = new Chart(graph_p95, {
  ...chart_config,
  data: {
    datasets: [{
      tension: 0.25,
      data: graphdata.p95,
      borderColor: 'rgba(0,85,170,1)',
    }],
  },
});


setInterval(async () => {

  // Do the actual measurement
  const start = Date.now();
  const data  = await fetch('/ping').then(res => res.json());
  const end   = Date.now();
  ticks.push({ start, end, rtt: end - start });

  // Remove old history
  // Keeps the last 5 minutes
  while(ticks.length && (ticks[0].start < (end - (1000 * 60 * 5)))) {
    ticks.shift();
  }

  // Fetch 95th-percentile
  const ordered = ticks.slice().sort((a,b) => a.rtt - b.rtt);
  const p95     = ordered[Math.floor((ordered.length-1) * 0.95)];

  // Add data to graphs
  graphdata.rtt.push({x:start,y:end-start});
  graphdata.p95.push({x:start,y:p95.rtt});

  // Remove old data
  while (graphdata.rtt.length > 100) graphdata.rtt.shift();
  while (graphdata.p95.length > 100) graphdata.p95.shift();

  // Update texts
  val_rtt.innerText = (end-start).toString();
  val_p95.innerText = (p95.rtt).toString();

  chart_rtt.update();
  chart_p95.update();

}, 1000);
