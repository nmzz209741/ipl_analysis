import * as d3 from "d3";
import _ from 'lodash'
let margin = {
    top: 10,
    right: 30,
    bottom: 50,
    left: 70
  },
  width = 1300 - margin.left - margin.right,
  height = 900 - margin.top - margin.bottom

let svg = d3.select('.svg__boxplot')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)

svg = svg.append('g')
  .attr('transform', `translate(${margin.left}, ${margin.top})`)

d3.json('./final.json').then(function (data) {
  const allData = _.flatten(data)
  const sortedPoints = d => d.map(g => g.points).sort(d3.ascending)
  const quantileData = d3.nest()
    .key(d => d.title)
    .rollup(d => {
      const q1 = d3.quantile(sortedPoints(d), .25)
      const median = d3.quantile(sortedPoints(d), .5)
      const q3 = d3.quantile(sortedPoints(d), .75)
      const IQR = q3 - q1
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
  console.info(quantileData)

  const columns = d => [...new Set(d.map(g => g.title))]
  const rows = d => d.map(d => d.points)

  const maxData = d3.max(rows(allData)) + 0.5
  const minData = d3.min(rows(allData)) - 0.5

  console.info(minData)
  console.info(maxData)


  const xScale = d3.scaleBand()
    .range([0, width])
    .domain(columns(allData))
    .padding(.5)
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xScale).tickSize(0))
    .select(".domain").remove()

  const yScale = d3.scaleLinear()
    .domain([minData, maxData])
    .range([height, -height])

  svg.append('g')
    .call(d3.axisLeft(yScale).ticks(5))
    .select('.domain').remove

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

  const mouseOver = d => {
    tooltip
      .transition()
      .duration(200)
      .style('opacity', 1)
    tooltip
      .html("<span style='color:grey'>Points: </span>" + d.points + "<br><span style='color:grey'>" + d.year + "</span>")
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