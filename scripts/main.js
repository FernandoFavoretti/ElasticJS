define(['scripts/d3.v3', 'scripts/elasticsearch'], function (d3, elasticsearch) {

    "use strict";
    var client = new elasticsearch.Client();

    client.search({
        index: 'prodam',
        size: 5,

        body: {
            // Begin query.

            query: {
                // Boolean query for matching and excluding items.
                match : {"DESCRICAO": "salada"}
            }
            // Aggregate on the results

            // End query.
        }
    }).then(function (resp) {


        //Mapeia resutlados do source
       var results = resp['hits']['hits'].map(function(i){
            return i['_source'];
            });
        //console.log(results)

        // d3 donut chart


        var width = 600,
            height = 300,
            radius = Math.min(width, height) / 2;


        var color = ['#ff7f0e', '#d62728', '#2ca02c', '#1f77b4'];

        var arc = d3.svg.arc()
            .outerRadius(radius - 60)
            .innerRadius(120);

        //diz que val unit tem os dados de valores
        var pie = d3.layout.pie()
            .sort(null)
            .value(function (d) { return d.VL_UNIT; });

        var svg = d3.select("#donut-chart").append("svg")
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", "translate(" + width/1.4 + "," + height/2 + ")");


        //Diz que "results" tem os dados
        var g = svg.selectAll(".arc")
            .data(pie(results))
            .enter()
            .append("g")
            .attr("class", "arc");



        g.append("path")
            .attr("d", arc)
            .style("fill", function (d, i) { return color[i]; })
            .transition()
            .ease("exp")
            .duration(2000)
            .attrTween("d", tweenPie);

        //Escreve os dados de "DESCRICAO"
        g.append("text")
            .attr("transform", function (d) { return "translate(" + arc.centroid(d) + ")"; })
            .attr("dy", ".35em")
            .style("text-anchor", "middle")
            .style("fill", "black")
            .text(function (d) { return d.data.DESCRICAO; });

    });

    client.search({
        index: 'prodam',
        size: 5,

        body: {
            // Begin query.

            query: {
                // Boolean query for matching and excluding items.
                match : {"DESCRICAO": "salada"}
            },
            sort:[
                {
                    "DATA_EMISSAO": {
                        "order": "asc"
                    }
                }
            ]
            // Aggregate on the results

            // End query.
        }
    }).then(function (resp) {

        console.log(resp);

        var results = resp['hits']['hits'].map(function(i){
            return i['_source'];
        });

        // pega valores unitarios
        //Lavel do grafico
        var vals = ["Valor"]

        //Adiciona valores ao array
        results.map(function (i) {
           vals.push(i.VL_UNIT)
        });

        //Labels
        var labels = ["Descricao"]
        results.map(function (i) {
            labels.push(i.DESCRICAO)
        });

        //Dates
        var dates = ["Data"]
        results.map(function (i) {
            dates.push(i.DATA_EMISSAO)
        });

        var chart = c3.generate({
            data: {
                x: 'Data',
                xFormat: '%d/%m/%Y',    //Como a data é parseada
                columns: [
                    dates,
                    vals
                ],
                type: 'bar'
            },
            axis : {
                x : {
                    type : 'timeseries',
                    tick: {
                        tick: {
                            format: '%d/%m/%Y' //Como a data é mostrada
                        }
                    }
                }
            },
            bar: {
                width: {
                    ratio: 0.5 // this makes bar width 50% of length between ticks
                }
                // or
                //width: 100 // this makes bar width 100px
            }
        });



    });

});
