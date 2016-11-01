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
        size: 0,

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

        console.log(resp)

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

        results = resp.aggregations.year.buckets;

        //Counts
        var counts = []

        counts.push(results.map(function (i) {
            return i['doc_count'];
        }));

        //Semanas
        var dataset = [];

        dataset.push(results.map(function (i) {
            return ({label: i['key_as_string'], count: i['doc_count']});
        }));


        var total = (resp.aggregations.intraday_return.value);

        //Data Total
        var data2 = [{label: 'Total', count:total}];


        width = parseInt(d3.select('#accChart').style('width'), 10);
        height = parseInt(d3.select('#accChart').style('height'), 10);
        var donutWidth = 50;

        var radius = Math.min(width, height) / 2.6;


        var color = d3.scale.category20c()
            .range(["#4682B4", "#386890", "#2a4e6c", "#23415a", "#6a9bc3", "#90b4d2", "#1C3448"]);




        var svg = d3.select('#chartAcc')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', 'translate(' + (width/2) +
                ',' + (height / 2.4) + ')');


        var pie = d3.layout.pie()
            .value(function(d) { return d.count; })
            .sort(null);

        var arc = d3.svg.arc()
            .outerRadius(radius - donutWidth)
            .innerRadius(radius);

        var arc2 = d3.svg.arc()
            .outerRadius((radius/3) + (10)  )
            .innerRadius(radius/3);


        var g1 = svg
            .append("g")


        var g2 = svg
            .append("g")


        var div = d3.select("body").append("div").attr("class", "toolTip");


        var path2 = g1.selectAll('path')
            .data(pie(data2))
            .enter()
            .append('path')
            .attr('d', arc2)
        .on("mousemove", function(d){
            div.style("left", d3.event.pageX+10+"px");
            div.style("top", d3.event.pageY-25+"px");
            div.style("display", "inline-block");
            div.html("<b>"+(d.data.label)+"</b><br>"+"Total das vendas <b>"+(d.data.count)+"</b>");
        })
            .on('mouseout', function(d){
                div.style("display", "none");
            })
            .transition()
            .duration(1500)
            .delay(function(d,i){ return i*250})
            .attr("fill", function(d, i) {return color(i); });


        var path = g2.selectAll('path')
            .data(pie(dataset[0]))
            .enter()
            .append('path')
            .attr('d', arc)
            .on("mousemove", function(d){
                div.style("left", d3.event.pageX+10+"px");
                div.style("top", d3.event.pageY-25+"px");
                div.style("display", "inline-block");
                div.html("<b>"+(d.data.label)+"</b><br>"+"Qtd. de Produtos: <b>"+(d.data.count)+"</b>");
            })
            .on('mouseout', function(d){
            div.style("display", "none");
            })
            .transition()
            .duration(1500)
            .delay(function(d,i){ return i*250})
            .attr("fill", function(d, i) {return color(i); });




    });
});

/**
 * Created by favoretti on 28/10/16.
 */
