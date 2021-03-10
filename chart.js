var ctx = document.getElementById('temps');
var config = {
    type: 'line',
    data: {
        datasets: [{
            label: 'Tool 0',
            borderColor: 'rgb(255, 99, 132)',
            fill: false,
            backgroundColor: 'rgb(255, 99, 132)',
            lineTension: 0
        }, {
            label: 'Bed',
            borderColor: 'rgb(54, 162, 235)',
            fill: false,
            backgroundColor: 'rgb(54, 162, 235)',
            lineTension: 0
        }, {
            label: 'Tool 0 Target',
            borderColor: 'rgba(255, 99, 132, 50%)',
            fill: false,
            backgroundColor: 'rgba(255, 99, 132, 50%)',
            lineTension: 0
        }, {
            label: 'Bed Target',
            borderColor: 'rgba(54, 162, 235, 50%)',
            fill: false,
            backgroundColor: 'rgba(54, 162, 235, 50%)',
            lineTension: 0
        }]
    },
    options: {
        elements: {
            point: {
                radius: 0
            }
        },
        scales: {
            xAxes: [{
                type: 'realtime',
                realtime: {
                    duration: 200000,
                    delay: 2000,
                }
            }]
        }
    }
};
var temp_chart = new Chart(ctx, config);