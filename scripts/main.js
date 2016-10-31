function findGetParameter(parameterName) {
    var result = null,
        tmp = [];
    location.search
        .substr(1)
        .split("&")
        .forEach(function (item) {
            tmp = item.split("=");
            if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
        });
    return result;
}


define(['scripts/d3.v3', 'scripts/elasticsearch'], function (d3, elasticsearch) {
    var client = new elasticsearch.Client();

    client.search({
        index: 'prodam',
        size: 5,

        body: {
            // Begin query.

            query: {
                bool:{
                    // Boolean query for matching and excluding items.
                    must : [
                        {term: {"DESCRICAO": "coca"}},
                        {term: {"DESCRICAO": "250"}}
                    ],
                    should: [
                        {fuzzy: {"DESCRICAO": "pet"}}
                    ]

                }
            },

            aggs:{
                avg_grade: {avg:{ "field" : "VL_UNIT" } },
                max_price: {max : { "field" : "VL_UNIT" } },
                min_price: {min : { "field" : "VL_UNIT" } },
                intraday_return: {sum : { "field" : "VL_UNIT" } },
                year: {
                    date_histogram: {
                        "field":     "DATA_EMISSAO",
                        "interval":  "week",
                        "format": "yyyy-MM-dd"
                    }
                }

            }


        }

    }).then(function (resp) {



        //***********************************************************
        //Distribuições


        var color = d3.scale.linear()
            .domain([min, media, max])
            .range(['#930F16', '#F0F0D0', '#228B22']);


        var media = resp.aggregations.avg_grade.value;
        var max = resp.aggregations.max_price.value;
        var min = resp.aggregations.min_price.value;


        data = [
            {label:"Val. Médio", value: Number(media).toFixed(2)},
            {label:"Val. Máximo", value: Number(max).toFixed(2)},
            {label:"Val. Mínimo", value: Number(min).toFixed(2)}
        ];


        var div = d3.select("body").append("div").attr("class", "toolTip");

        var axisMargin = 20,
            margin = 40,
            valueMargin = 4,
            width = parseInt(d3.select('#dashMean').style('width'), 10),
            height = parseInt(d3.select('#dashMean').style('height'), 10),
            barHeight = (height-axisMargin-margin*2)* 0.4/data.length,
            barPadding = (height-axisMargin-margin*2)*0.6/data.length,
            data, bar, svg, scale, xAxis, labelWidth = 0;

        max = d3.max(data, function(d) { return d.value; });

        svg = d3.select('#chart3')
            .append("svg")
            .attr("width", width)
            .attr("height", height);


        bar = svg.selectAll("g")
            .data(data)
            .enter()
            .append("g");

        bar.attr("class", "bar")
            .attr("cx",0)
            .attr("transform", function(d, i) {
                return "translate(" + margin + "," + (i * (barHeight + barPadding) + barPadding) + ")";
            });

        bar.append("text")
            .attr("class", "label")
            .attr("y", barHeight / 2)
            .attr("dy", ".35em") //vertical align middle
            .text(function(d){
                return d.label;
            }).each(function() {
            labelWidth = Math.ceil(Math.max(labelWidth, this.getBBox().width));
        });

        scale = d3.scale.linear()
            .domain([0, max])
            .range([0, width - margin*2 - labelWidth]);

        xAxis = d3.svg.axis()
            .scale(scale)
            .tickSize(-height + 2*margin + axisMargin)
            .orient("bottom");

        bar.append("rect")
            .attr("transform", "translate("+labelWidth+", 0)")
            .attr("height", barHeight)
            .attr("width", 0)
            .transition()
            .duration(1500)
            .delay(function(d,i){ return i*250})
            .attr("width", function(d){
                return scale(d.value);
            });

        bar.append("text")
            .attr("class", "value")
            .attr("y", barHeight / 2)
            .attr("dx", -valueMargin + labelWidth) //margin right
            .attr("dy", ".35em") //vertical align middle
            .attr("text-anchor", "end")
            .text(function(d){
                return ("R$ "+d.value);
            })
            .attr("x", function(d){
                var width = this.getBBox().width;
                return Math.max(width + valueMargin, scale(d.value));
            });

        bar
            .on("mousemove", function(d){
                div.style("left", d3.event.pageX+10+"px");
                div.style("top", d3.event.pageY-25+"px");
                div.style("display", "inline-block");
                div.html((d.label)+"<br>"+"R$ "+(d.value));
            });
        bar
            .on("mouseout", function(d){
                div.style("display", "none");
            });


        //*******************************************************************
        // -> End Distribuições





        //**********************************************************************
        // Acc Chart

        var color = d3.scale.linear()
            .domain([min, media, max])
            .range(['#930F16', '#F0F0D0', '#228B22']);


        var acc = resp.aggregations.intraday_return.value;
        var count = resp.hits.total;


        dataAcc = [
            {label:Number(acc).toFixed(2), value: count}
        ];


        var div = d3.select("body").append("div").attr("class", "toolTip");

        var axisMarginAcc = 20,
            marginAcc = 40,
            valueMarginAcc = 4,
            widthAcc = parseInt(d3.select('#accChart').style('width'), 10),
            heightAcc = parseInt(d3.select('#accChart').style('height'), 10),
            barHeightAcc = (heightAcc-axisMarginAcc-marginAcc*2)* 0.4/dataAcc.length,
            barPaddingAcc = (heightAcc-axisMarginAcc-marginAcc*2)*0.6/dataAcc.length,
            dataAcc, barAcc, svgAcc, scaleAcc, xAxisAcc, labelWidthAcc = 0;


        svgAcc = d3.select('#chartAcc')
            .append("svg")
            .attr("width", widthAcc)
            .attr("height", heightAcc);


        scaleAcc = d3.scale.linear()
            .domain([0, count])
            .range([0, widthAcc - marginAcc*2 - labelWidthAcc]);

        var xAxisAcc = d3.svg.axis()
            .scale((acc))
            .orient("bottom")

        var yAxisAcc = d3.svg.axis()
            .scale(count)
            .orient("left")
            .ticks(10);


        barAcc = svgAcc.selectAll("g")
            .data(dataAcc)
            .enter()
            .append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        barAcc.attr("class", "bar")
            .attr("cx",0)
            .attr("transform", function(d, i) {
                return "translate(" + marginAcc + "," + (i * (barHeightAcc + barPaddingAcc) + barPaddingAcc) + ")";
            });

        barAcc.append("text")
            .attr("class", "label")
            .attr("y", barHeightAcc / 2)
            .attr("dy", ".35em") //vertical align middle
            .text(function(d){
                return d.label;
            }).each(function() {
            labelWidthAcc = Math.ceil(Math.max(labelWidthAcc, this.getBBox().width));
        });


        barAcc.append("rect")
            .attr("transform", "translate("+labelWidthAcc+", 0)")
            .attr("height", barHeightAcc)
            .attr("width", 0)
            .transition()
            .duration(1500)
            .delay(function(d,i){ return i*250})
            .attr("width", function(d){
                return scale(d.value);
            });

        barAcc.append("text")
            .attr("class", "value")
            .attr("y", barHeightAcc / 2)
            .attr("dx", -valueMarginAcc + labelWidthAcc) //margin right
            .attr("dy", ".35em") //vertical align middle
            .attr("text-anchor", "end")
            .text(function(d){
                return ("R$ "+d.value);
            })
            .attr("x", function(d){
                var width = this.getBBox().width;
                return Math.max(widthAcc + valueMarginAcc, scale(d.value));
            });

        barAcc
            .on("mousemove", function(d){
                div.style("left", d3.event.pageX+10+"px");
                div.style("top", d3.event.pageY-25+"px");
                div.style("display", "inline-block");
                div.html((d.label)+"<br>"+"R$ "+(d.value));
            });
        barAcc
            .on("mouseout", function(d){
                div.style("display", "none");
            });

        svgAcc.insert("g",":first-child")
            .attr("class", "axisHorizontal")
            .attr("transform", "translate(" + (marginAcc + labelWidthAcc) + ","+ (heightAcc - axisMarginAcc - marginAcc)+")")
            .call(xAxisAcc);



    });
});

/**
 * Created by favoretti on 28/10/16.
 */
