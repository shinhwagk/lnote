const f1 =
  "https://raw.githubusercontent.com/shinhwagk/vscode-note/analytics/charts-data/new-clients%4024h.json";
const f2 =
  "https://raw.githubusercontent.com/shinhwagk/vscode-note/analytics/charts-data/active-clients%4024h.json";

const date = new Date();
date.setHours(0, 0, 0, 0);
const dateTimestamp = date.getTime();

const days = Array.from({ length: 30 }, (_v, i) => i)
  .map(offset => dateTimestamp - offset * 24 * 60 * 60 * 1000)
  .reverse()
  .map(d => new Date(d))
  .map(d => `${d.getMonth()}-${d.getDate()}`);

function displayCharts(cc, ac) {
  const data = {
    labels: days,
    datasets: [
      { name: "new clients", values: cc },
      { name: "active clients", values: ac }
    ]
  };
  new frappe.Chart("#chart", {
    data: data,
    type: "line",
    height: 240,
    colors: ["red"]
  });
}

async function main() {
  const cc = await axios.get(f1);
  const ac = await axios.get(f2);
  displayCharts(cc.data, ac.data);
}

main();
