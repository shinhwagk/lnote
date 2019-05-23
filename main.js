const f1 =
  "https://raw.githubusercontent.com/shinhwagk/vscode-note/analytics/charts-data/new-clients%4024h.json";

const date = new Date();
date.setHours(0, 0, 0, 0);
const dateTimestamp = date.getTime();

const days = Array.from({ length: 30 }, (_v, i) => i)
  .map(offset => dateTimestamp - offset * 24 * 60 * 60 * 1000)
  .reverse()
  .map(d => new Date(d))
  .map(d => `${d.getMonth()}-${d.getDate()}`);

function displayCharts(chartData) {
  const data = {
    labels: days,
    datasets: [
      { name: "new clients", values: chartData },
      { name: "active clients", values: chartData }
    ]
  };
  new frappe.Chart("#chart", {
    data: data,
    type: "line",
    height: 240,
    colors: ["red"]
  });
}
axios.get(f1).then(response => displayCharts(response.data));
