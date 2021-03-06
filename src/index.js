import * as d3 from "d3";
import _ from 'lodash'
let margin = {
    top: 10,
    right: 70,
    bottom: 50,
    left: 70
  },
  width = 1200 - margin.left - margin.right,
  height = 800 - margin.top - margin.bottom

let svg = d3.select('.svg__boxplot')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)

svg = svg.append('g')
  .attr('transform', `translate(${margin.left}, ${margin.top})`)

d3.json('./final.json').then(function (data) {
  const allData = _.flatten(data)
  const sortedPoints = d => d.map(g => g.points).sort((a, b) => a - b)
  const quantileData = d3.nest()
    .key(d => d.title)
    .rollup(d => {
      const q1 = d3.quantile(sortedPoints(d), .25)
      const median = d3.quantile(sortedPoints(d), .5)
      const q3 = d3.quantile(sortedPoints(d), .75)
      const IQR = Math.abs(q3 - q1)
      const min = q1 - 1.5 * IQR
      const max = q3 + 1.5 * IQR
      return {
        q1,
        median,
        q3,
        IQR,
        min,
        max
      }
    })
    .entries(allData)

  const quantileMaximum = Math.max(...quantileData.map(d => d.value.max))
  const quantileMinimum = Math.min(...quantileData.map(d => d.value.min))

  const columns = d => [...new Set(d.map(g => g.title))]
  const rows = d => d.map(d => parseInt(d.points))

  const maxValueData = Math.max(...rows(allData))
  const minValueData = Math.min(...rows(allData))

  const maxData = maxValueData >= quantileMaximum ? maxValueData : quantileMaximum
  const minData = minValueData <= quantileMinimum ? minValueData : quantileMinimum

  const xScale = d3.scaleBand()
    .range([0, width])
    .domain(columns(allData))
    .padding(.5)
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xScale).tickSize(0))
    .select(".domain").remove()
  svg.append('text')
    .attr('transform', `translate(${width/2}, ${height + margin.top + 30})`)
    .style("text-anchor", "middle")
    .style('font-size', '20px')
    .style('font-weight', 'bold')
    .text("TEAMS");

  let yScale = d3.scaleLinear()
    .domain([0, maxData])
    .range([0, height]);

  yScale = d3.scaleLinear()
    .domain([minData, maxData])
    .range([height, 0]);

  svg.append('g')
    .call(d3.axisLeft(yScale).ticks(5))
    .select('.domain').remove
  svg.append('text')
    .attr('y', 0 - 30)
    .attr('x', 0 - (height / 2 + margin.top))
    .attr('transform', `rotate(-90)`)

    .style("text-anchor", "middle")
    .style('font-size', '20px')
    .style('font-weight', 'bold')
    .text("POINTS");

  const colorSpectrum = d3.scaleSequential()
    .interpolator(d3.interpolateInferno)
    .domain([minData, maxData])

  svg.selectAll('verticalLines')
    .data(quantileData)
    .enter()
    .append('line')
    .attr('x1', d => xScale(d.key) + xScale.bandwidth() / 2)
    .attr('x2', d => xScale(d.key) + xScale.bandwidth() / 2)
    .attr('y1', d => yScale(d.value.max))
    .attr('y2', d => yScale(d.value.min))
    .attr('stroke', 'black')
    .style('width', 40)

  svg.selectAll('boxes')
    .data(quantileData)
    .enter()
    .append('rect')
    .attr('x', d => xScale(d.key))
    .attr('y', d => yScale(d.value.q3))
    .attr('width', xScale.bandwidth())
    .attr('height', d => (yScale(d.value.q1) - yScale(d.value.q3)))
    .attr("stroke", "black")
    .style("fill", "#69b3a2")
    .style("opacity", 0.3)

  svg.selectAll('medianLines')
    .data(quantileData)
    .enter()
    .append('line')
    .attr('x1', d => xScale(d.key))
    .attr('x2', d => xScale(d.key) + xScale.bandwidth())
    .attr('y1', d => yScale(d.value.median))
    .attr('y2', d => yScale(d.value.median))
    .attr('stroke', 'grey')
    .style('width', 80)
    .attr('class', 'median-line')

  svg.selectAll('median-line')
    .data(quantileData)
    .enter()
    .append('text')
    .text(d => d.value.median)
    .attr('x', d => (xScale(d.key) - xScale.bandwidth() / 2))
    .attr('y', d => yScale(d.value.median))
    .style('font-size', '10px')

  svg.selectAll('maxLines')
    .data(quantileData)
    .enter()
    .append('line')
    .attr('x1', d => xScale(d.key))
    .attr('x2', d => xScale(d.key) + xScale.bandwidth())
    .attr('y1', d => yScale(d.value.max))
    .attr('y2', d => yScale(d.value.max))
    .attr('stroke', 'black')
    .style('height', 100)

  svg.selectAll('minLines')
    .data(quantileData)
    .enter()
    .append('line')
    .attr('x1', d => xScale(d.key))
    .attr('x2', d => xScale(d.key) + xScale.bandwidth())
    .attr('y1', d => yScale(d.value.min))
    .attr('y2', d => yScale(d.value.min))
    .attr('stroke', 'black')
    .style('height', 100)

  const tooltip = d3.select('.svg__boxplot')
    .append('div')
    .style('opacity', 0)
    .attr('class', 'tooltip')
    .style('font-size', '16px')
    .style('background-color', '#aaa')
    .style('padding', '0.5em')
    .style('border-radius', '15%')

  const mouseOver = d => {
    tooltip
      .transition()
      .duration(200)
      .style('opacity', 1)
    tooltip
      .html(`<div class='teamInfo' style="color: white; font-size: 12px;"><span>${d.teamName} - ${d.title}<br>Points : ${d.points}<br>Year: ${d.year}</span></div>`)
      .style('left', `${d3.event.pageX + 30}px`)
      .style('top', `${d3.event.pageY + 30}px`)
  }
  const mousemove = function (d) {
    tooltip
      .style("left", `${d3.event.pageX + 30}px`)
      .style("top", `${d3.event.pageY + 30}px`)
  }
  const mouseleave = d => {
    tooltip
      .transition()
      .duration(200)
      .style("opacity", 0)
  }
  svg.selectAll('indPoints')
    .data(allData)
    .enter()
    .append('circle')
    .attr('r', 4)
    .attr('cx', d => xScale(d.title) + xScale.bandwidth() / 2)
    .attr('cy', d => yScale(d.points))
    .style('fill', d => colorSpectrum(+d.points))
    .attr('stroke', 'black')
    .on('mouseover', mouseOver)
    .on("mousemove", mousemove)
    .on('mouseleave', mouseleave)
})

let svg2 = d3.select('.svg__trendline')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)

svg2 = svg2.append('g')
  .attr('transform', `translate(${margin.left}, ${margin.top})`)

d3.json('./final.json').then(function (data) {
  const allData = _.flatten(data)

  const columns = d => [...new Set(d.map(g => g.year))]
  const rows = d => d.map(d => d.won)

  const maxValueData = Math.max(...rows(allData))
  const minValueData = Math.min(...rows(allData))
  const maxData = maxValueData
  const minData = minValueData

  const xScale = d3.scaleBand()
    .range([0, width])
    .domain(columns(allData))
    .padding(.5)
  svg2.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xScale).tickSize(0))
    .select(".domain").remove()
  svg2.append('text')
    .attr('transform', `translate(${width/2}, ${height + margin.top + 30})`)
    .style("text-anchor", "middle")
    .style('font-size', '20px')
    .style('font-weight', 'bold')
    .text("YEARS");

  let yScale = d3.scaleLinear()
    .domain([0, maxData])
    .range([0, height]);

  yScale = d3.scaleLinear()
    .domain([minData, maxData])
    .range([height, 0]);

  svg2.append('g')
    .call(d3.axisLeft(yScale).ticks(5))
    .select('.domain').remove
  svg2.append('text')
    .attr('y', 0 - 30)
    .attr('x', 0 - (height / 2 + margin.top))
    .attr('transform', `rotate(-90)`)
    .style("text-anchor", "middle")
    .style('font-size', '20px')
    .style('font-weight', 'bold')
    .text("WINS");

  const teamWise = _.groupBy(allData, 'title')
  const teamsList = Object.keys(teamWise)
  const line = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.won))

  const colorSpectrum = d3.scaleOrdinal().domain(teamsList)
    .range(d3.schemeCategory10)

  const tooltip = d3.select('.svg__trendline')
    .append('div')
    .style('opacity', 0)
    .attr('class', 'tooltip')
    .style('font-size', '16px')
    .style('background-color', '#aaa')
    .style('padding', '0.5em')
    .style('border-radius', '15%')
  const mousemove = function (d) {
    tooltip
      .style("left", `${d3.event.pageX + 30}px`)
      .style("top", `${d3.event.pageY + 30}px`)
  }
  _.each(teamWise, (teamData, teamname) => {
    const linesAndDots = svg2.append('g')
      .attr('class', 'line-and-dots')
      .attr('transform', `translate(${xScale.bandwidth()/2}, 0)`)

    linesAndDots.append('path')
      .datum(teamData)
      .attr('class', 'data-line')
      .attr('id', `data-line-${_.findIndex(teamsList, (v,k)=> v === teamData[0].title)}`)
      .attr('d', line)
      .style('stroke', colorSpectrum(teamData[0].title))
      .on("mouseover", function (d) {
        if (d3.select(this).style("opacity") !== 1) {
          d3.select(this).transition()
            .duration(200)
            .style("opacity", 1)
            .style('stroke', '10px')
        }
        tooltip
          .transition()
          .duration(200)
          .style('opacity', 1)
        tooltip
          .html(`<div class='teamInfo' style="color: white; font-size: 12px;"><span>${teamData[0].teamName} - ${teamData[0].title}</span></div>`)
          .style('left', `${d3.event.pageX + 30}px`)
          .style('top', `${d3.event.pageY + 30}px`)
      })
      .on('mouseleave', function () {
        d3.select(this).transition().duration(200)
          .style("opacity", 0.1)
          .style('stroke', '2px');
        tooltip
          .transition()
          .duration(200)
          .style("opacity", 0)
      })
      .on("mousemove", mousemove)

    linesAndDots.selectAll("line-circle")
      .data(teamData)
      .enter()
      .append("circle")
      .attr("class", "data-circle")
      .attr("r", 5)
      .attr("cx", d => xScale(d.year))
      .attr("cy", d => yScale(d.won))
      .attr('fill', d => colorSpectrum(d.title))

    const legend = svg2.append('g')
      .attr('class', 'legend item')
      .attr('transform', `translate(${width - xScale.bandwidth(), margin.top})`)

    legend.append('rect')
      .datum(teamData)
      .attr('class', 'legend-item-box')
      .attr('x', width - xScale.bandwidth() - margin.left)
      .attr('width', "16px")
      .attr('y', margin.top + (20 * (_.findIndex(teamsList, (v, k) => v === teamData[0].title))))
      .attr('height', "16px")
      .attr('fill', colorSpectrum(teamData[0].title))
      .attr('rx', 4)
      .on('mouseover', function (d) {
        const id = `#data-line-${_.findIndex(teamsList, v => v === d[0].title)}`
        if (d3.select(id).style("opacity") !== 1) {
          d3.select(id).transition()
            .duration(200)
            .style("opacity", 1)
            .style('stroke', '10px')
        }
      })
      .on('mouseleave', function (d) {
        const id = `#data-line-${_.findIndex(teamsList, v => v === d[0].title)}`
        d3.select(id).transition().duration(200)
          .style("opacity", 0.1)
          .style('stroke', '2px');
      })

    legend.append('text')
      .datum(teamData)
      .text(d => d[0].title)
      .attr('x', width - xScale.bandwidth() - margin.left + 20)
      .attr('y', 13 + margin.top + (20 * (_.findIndex(teamsList, (v, k) => v === teamData[0].title))))
      .style('font-size', '14px')
  })
})