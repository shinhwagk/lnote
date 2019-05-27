const newUrl =
  "https://raw.githubusercontent.com/shinhwagk/vscode-note/analytics/charts-data/new.json";
const activeUrl =
  "https://raw.githubusercontent.com/shinhwagk/vscode-note/analytics/charts-data/active.json";
const notesUrl =
  "https://raw.githubusercontent.com/shinhwagk/vscode-note/analytics/charts-data/notes.json";
const date = new Date();
date.setHours(0, 0, 0, 0);
const dateTimestamp = date.getTime();

const days = Array.from({ length: 30 }, (_v, i) => i)
  .map(offset => dateTimestamp - offset * 24 * 60 * 60 * 1000)
  .reverse()
  .map(d => new Date(d))
  .map(d => `${d.getMonth()}-${d.getDate()}`);

function displayCharts(cc, ac, nc) {
  const data = {
    labels: days,
    datasets: [
      { name: "new clients", values: cc },
      { name: "active clients", values: ac },
      { name: "create notes", values: nc }
    ]
  };
  new frappe.Chart("#chart", {
    data: data,
    type: "line",
    height: 240,
    colors: ["red"]
  });
}

(async () => {
  const newdata = await axios.get(newUrl);
  const activedata = await axios.get(activeUrl);
  const notesdata = await axios.get(notesUrl);
  displayCharts(newdata.data, activedata.data, notesdata.data);
})();
