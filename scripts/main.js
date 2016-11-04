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
    var keyword = findGetParameter("keyword");
    var quant = findGetParameter("quant");
    var quant1 = findGetParameter("complemento1");
    var complemento = findGetParameter("complemento");


    var matcher1 = {"DESCRICAO": ""+keyword+""}
    var matcher2= {"DESCRICAO": ""+quant+""}
    var matcher3= {"DESCRICAO": ""+quant1+""}
    var matcher4 = {"DESCRICAO": ""+complemento+""}

    client.search({
        index: 'prodam',
        size: 100,



        body: {
            // Begin query.

            query: {
                bool:{
                    // Boolean query for matching and excluding items.
                    must : [
                        {regexp: matcher1},
                        {regexp: matcher2},
                        {regexp: matcher3}
                    ],
                    should: [ { term : matcher4 } ]

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
        // Acc Pie Chart

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
        var data2 = [{label: 'Total', count:Number(total).toFixed(2)}];


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
            div.html("<b>"+(d.data.label)+"</b><br>"+"Quantidade Total <b>"+(d.data.count)+"</b>");
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








        //**********************************************************************
        // End Acc Pie Chart




        //**********************************************************************
        // Start Histogram

        var results = resp['hits']['hits'].map(function(i){
            return i['_source'];
        });

        var data = [];
      for (var h = 0; h < results.length; h++){
            data.push({name: results[h].DESCRICAO, frequency: results[h].VL_UNIT,  ID: h+1})
        }


        data.sort(function(a, b){
            return a.frequency-b.frequency
        })


        var color = d3.scale.category20c()
            .range(["#9BBEF2", "#99BCF0", "#98BAEE", "#97B9ED", "#95B7EB", "#94B6EA", "#93B4E8", "#91B2E6", "#90B1E5", "#8FAFE3", "#8DAEE2", "#8CACE0", "#8BAADE", "#89A9DD", "#88A7DB", "#87A6DA", "#85A4D8", "#84A3D6", "#83A1D5", "#819FD3", "#809ED2", "#7F9CD0", "#7D9BCE", "#7C99CD", "#7B97CB", "#7996CA", "#7894C8", "#7793C6", "#7591C5", "#7490C3", "#738EC2", "#718CC0", "#708BBE", "#6F89BD", "#6E88BB", "#6C86BA", "#6B84B8", "#6A83B6", "#6881B5", "#6780B3", "#667EB2", "#647CB0", "#637BAE", "#6279AD", "#6078AB", "#5F76AA", "#5E75A8", "#5C73A6", "#5B71A5", "#5A70A3", "#586EA2", "#576DA0", "#566B9F", "#54699D", "#53689B", "#52669A", "#506598", "#4F6397", "#4E6295", "#4C6093", "#4B5E92", "#4A5D90", "#485B8F", "#475A8D", "#46588B", "#44568A", "#435588", "#425387", "#415285", "#3F5083", "#3E4E82", "#3D4D80", "#3B4B7F", "#3A4A7D", "#39487B", "#37477A", "#364578", "#354377", "#334275", "#324073", "#313F72", "#2F3D70", "#2E3B6F", "#2D3A6D", "#2B386B", "#2A376A", "#293568", "#273467", "#263265", "#253063", "#232F62", "#222D60", "#212C5F", "#1F2A5D", "#1E285B", "#1D275A", "#1B2558", "#1A2457", "#192255", "#182154"]);



        var margin = {top: 40, right: 10, bottom: 30, left: 10},
            width = parseInt(d3.select('#histChart').style('width'), 10),
        height = parseInt(d3.select('#histChart').style('height'), 10);



        var x = d3.scale.ordinal()
            .rangeRoundBands([0, width], .1);

        var y = d3.scale.linear()
            .range([height, 0]);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom");

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left")





        var svg = d3.select("#chartHist").append("svg")
            .attr("width", width )
            .attr("height", 0.9*height );



        // The following code was contained in the callback function.
        x.domain(data.map(function(d) { return (d.ID + " - "+ d.name); }));
        y.domain([0, d3.max(data, function(d) { return d.frequency; })]);



        var div = d3.select("body").append("div").attr("class", "toolTip");

        console.log(resp)

        svg.append("g")
            .attr("class", "y axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0)
            .attr("dy", ".89em")
            .style("text-anchor", "end");



        var barSize = 0;

        if(data.length <= 10){
            barSize = data.length * 10
        } else if (data.length > 10 & data.length < 30){
            barSize = data.length * 5;

        } else if (data.length > 30 & data.length < 50){
            barSize = data.length/8;
        }  else if (data.length > 50 & data.length <= 100){
            barSize = data.length/8;
        }

        svg.selectAll(".bar2")
            .data(data)
            .enter()
            .append("g")
            .append("rect")
            .attr("class", "bar2")
            .attr("width", 0)
            .attr("height", 0)
             .on("mousemove", function(d){
                div.style("left", d3.event.pageX+10+"px");
                div.style("top", d3.event.pageY-25+"px");
                div.style("display", "inline-block");
                div.html("<b>Nome: "+(d.name)+"</b><br>"+"<b>Valor Unidade: R$ "+(d.frequency)+"</b>");
            })
            .on('mouseout', function(d){
                div.style("display", "none");
            })

            .transition()
            .delay(function (d, i) { return i*20; })
            .attr("y", function(d) {return y(d.frequency); })
            .attr("x", function(d) { return x(d.ID + " - "+ d.name); })
            .attr("width", barSize)
            .attr("fill", function(d, i) {return color(i); })
            .attr("height", function(d) { return height - y(d.frequency); });




    });
});

/**
 * Created by favoretti on 28/10/16.
 */
