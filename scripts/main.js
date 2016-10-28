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
        size: 10,

        body: {
            // Begin query.

            query: {
                // Boolean query for matching and excluding items.
                match : {"DESCRICAO": "benegrip"}
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



        var results = resp['hits']['hits'].map(function(i){
            return i['_source'];
        });

        // pega valores unitarios
        //Lavel do grafico
        var onlyvals = []
        var vals = ["Valor"]

        //Adiciona valores ao array
        results.map(function (i) {
           vals.push(i.VL_UNIT)
            onlyvals.push(i.VL_UNIT)
        });


        //Labels
        var labels = ["Descricao"]
        results.map(function (i) {
            labels.push(i.DESCRICAO)
        });

        //Dates
        var dates = ["Data"]
        results.map(function (i) {
            var date = i.DATA_EMISSAO
            var year =  date.substr(6, 8)
            var withoutYear = date.substr(0, 5)
            withoutYear += "/20"+year
            dates.push(withoutYear)
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
                        format: '%d/%m/%Y' // how the date is displayed
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


        var media = 0
        onlyvals.map(function (i) {
            media += parseFloat(i)
        });

        media = Number((media/onlyvals.length).toFixed(2));





        var meanChart = c3.generate({
            size: {
                height: 100,
                width: 480
           },
            bindto: '#meanChart',
            data: {
                columns: [
                    ['media', media]
                ],
                type: 'bar'
            },
            axis: {
            rotated: true,
                x:{
                    tick: {
                        values: ['']
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

        var max = 0
        onlyvals.map(function (i) {
            if(parseFloat(i) > max ){
                max = parseFloat(i)
            }
        });


        var maxChart = c3.generate({
            size: {
                height: 100,
                width: 480
            },
            bindto: '#maxChart',
            data: {
                columns: [
                    ['Max', max]
                ],
                type: 'bar'
            },
            axis: {
                rotated: true,
                x:{
                    tick: {
                        values: ['']
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
