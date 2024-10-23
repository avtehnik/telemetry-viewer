let CHART = {
    charts: {},
    getChart: function (chartName, chartData) {
        if (CHART.charts.hasOwnProperty(chartName)) {
            return CHART.charts[chartName];
        }
        const canvas = document.createElement("canvas");
        canvas.id = chartName;
        const linksArea = document.getElementById("linksArea");
        const currentDiv = document.getElementById("chartsArea");
        const newContent = document.createTextNode(chartName);
        currentDiv.appendChild(newContent);
        const anchor = document.createElement('a');
        anchor.href = '#' + chartName;
        anchor.innerText = chartName;
        anchor.classList.add('chartLink');
        linksArea.appendChild(anchor);
        currentDiv.appendChild(canvas);

        var chart = new Chart(canvas, {
            type: 'line',
            animations: {
                tension: {
                    duration: 0,
                    easing: 'linear',
                    from: 1,
                    to: 10,
                    loop: true
                }
            },
            data: {datasets: []},
            options: {}
        });

        let lineNames = Object.keys(chartData.lines);
        lineNames.forEach((name) => {
            chart.data.datasets.push({
                animation: false,
                label: name,
                backgroundColor: chartData.lines[name],
                borderColor: chartData.lines[name],
                data: [],
            })
        });
        CHART.charts[chartName] = chart;
        chart.update();
        return chart;
    },
    makeChart: function (name, data) {
        CHART.getChart(name, data);
    },
    addData: function (name, data, index) {
        let chart = CHART.charts[name];
        let reverse = data.reverse();
        chart.data.datasets.forEach((dataset) => {
            let val = reverse.pop();
            dataset.data.unshift({x: index + 's', y: val});
            if (dataset.data.length > 300) {
                dataset.data.pop();
            }
        });
        chart.update();
    },
    clear: function () {
        Object.keys(CHART.charts).forEach((chartName) => {
            CHART.charts[chartName].data.datasets.forEach((dataset) => {
                dataset.data = []
            });
            CHART.charts[chartName].update();
        });

    }
}
