const margin = {top: 20, right:40, bottom:50, left:60};
const width = 1000 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;


const svgElem = d3.select("#visualization") // select the svg element in the html file
        .attr("width",width + margin.left + margin.right)
        .attr("height",height + margin.top + margin.bottom)
        .html(""); // clear any existing content in the svg element

d3.csv("Quality-reports-dataset.csv").then(function(data){ // load the csv file then run the funtion
    console.log(data);
    const cleanData = data.map(d=>{ // map through the data to create a new array of objects 
        return {
            year: parseInt(d.year),
            month: parseInt(d.month),
            quality_report: d.quality === "" ? null : parseInt(d.quality),
            date: new Date(parseInt(d.year),+d.month-1,1) // create a date for plotting the data in the first day of each month
        };
    }).filter(d=> d.quality_report !== null); // use the new key to filter null values in the new object (cleanData)
    console.log(cleanData);
    
    const svg = svgElem.append("g") // add a group element that allows us to group other elements toghether and apply transformations or give attributes to them
        .attr("transform",`translate(${margin.left},${margin.top})`); // translate function takes two arguments (x,y) +ve x is right, +ve y is down

    const xScale = d3.scaleTime() // create the xScale to map the data to the width of the svg. Use scaleTime for dates
        .domain(d3.extent(cleanData,d=>d.date)) // extent returns the min and max values of the data.date (that is the domain of the xScale(values to be mapped))
        .range([0,width]); // each value in the domain is mapped to a value in the range (based on the width of the svg)

    const yScale = d3.scaleLinear()
        .domain([90,100])
        .range([height,0]);

    const xAxis = d3.axisBottom(xScale).tickFormat(d3.timeFormat("%b %Y")); // place the ticks at the bottom and format the ticks to show month and year
    const yAxis = d3.axisLeft(yScale);

    svg.append("g")
        .attr("class","x-axis") // add a new group for the x-axis
        .attr("transform",`translate(0,${height})`) // move the x-axis to the bottom by translating it with +ve y (height of the svg)
        .call(xAxis) // call the xAxis function to create the axis and add it to the group
        .style("color","#999")
        .style("font-size","13px")
        .style("font-family","monospace");

    svg.append("g")
        .attr("class","y-axis") // add a new group for the y-axis
        .call(yAxis)
        .style("color","#999")
        .style("font-size","13px")
        .style("font-family","monospace"); 

    const line = d3.line() 
        .x(d =>xScale(d.date)) // x and y are functions that return the scaled values for each data point (date and quality_report)
        .y(d=> yScale(d.quality_report))
        .curve(d3.curveMonotoneX); // apply a curve to the line

    svg.append("path") 
        .datum(cleanData)
        .attr("class","pulse-line")
        .attr("d",line);
    

    svg.selectAll("line.horizontalGrid")
        .data(yScale.ticks(8)) // Use the same ticks as your axis
        .enter()
        .append("line")
        .attr("class", "horizontalGrid")
        .attr("x1", 20)
        .attr("x2", width - 20)
        .attr("y1", d => yScale(d))
        .attr("y2", d => yScale(d))
        .attr("stroke", "lightgray")
        .attr("stroke-width", 1)
        .style("stroke-opacity",0.2)
        

    const dataPoints = svg.selectAll(".data-point")
        .data(cleanData)
        .enter().append("g")
        .attr("class", "data-point") // This adds class="data-point" to the <g> element
        .attr("transform", d => `translate(${xScale(d.date)}, ${yScale(d.quality_report)})`);

    // Add circles - these will inherit styles from .data-point circle
    dataPoints.append("circle")
        .attr("r", 4);
        // .style("cursor", "pointer");;
        // No need to style here - CSS will handle it

    // Add value labels
    dataPoints.append("text")
        .attr("class", "value-label") // This adds class="value-label" to the <text> element
        .attr("y", d => d.quality_report <= 98 ? 15 : -15)
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .text(d => `${d.quality_report}`);

    
    const tooltip = d3.select("#tooltip");
    svg.selectAll(".data-point circle")
    .on("mouseover", function(event, d) {
            tooltip
                .style("opacity", 1)
                .html(`<strong>${d3.timeFormat("%b %Y")(d.date)}</strong><br>${d.quality_report}%</strong>`)
                .style("left", (event.pageX + 30) + "px")
                .style("top", (event.pageY +20) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0);
        });
}).catch(function(error) {
    // This function runs if there is an error loading the file
    console.error("Error loading the CSV file:", error);
    d3.select("#loading").text("Error loading data. Please check the console.");
});