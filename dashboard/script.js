fetch("http://localhost:8080/traffic/status")
.then(response => response.json())
.then(data => {

    document.getElementById("cars").innerText =
        data.cars;

    document.getElementById("motorcycles").innerText =
        data.motorcycles;

    document.getElementById("buses").innerText =
        data.buses;

    document.getElementById("trucks").innerText =
        data.trucks;

    const densityElement = document.getElementById("density");

densityElement.innerText = data.density;

densityElement.classList.remove("low", "medium", "high");

if (data.density === "LOW") {
    densityElement.classList.add("low");
}
else if (data.density === "MEDIUM") {
    densityElement.classList.add("medium");
}
else {
    densityElement.classList.add("high");
}

        document.getElementById("recommendation").innerText =
    data.recommendation;

        createChart(data);
});

function createChart(data) {

    const ctx = document.getElementById("trafficChart");

    new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["Cars", "Motorcycles", "Buses", "Trucks"],
            datasets: [{
                label: "Vehicle Count",
                data: [
                    data.cars,
                    data.motorcycles,
                    data.buses,
                    data.trucks
                ]
            }]
        },
        options: {
            responsive: true
        }
    });

}