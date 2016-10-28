define(['scripts/d3.v3', 'scripts/elasticsearch'], function (d3, elasticsearch) {

    var client = new elasticsearch.Client();

    var matcher = {"DESCRICAO": "benegrip"}
    client.search({
        index: 'prodam',
        size: 10,

        body: {
            // Begin query.

            query: {
                // Boolean query for matching and excluding items.
                match : matcher
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
        console.log("HI")
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

        var max = 0
        onlyvals.map(function (i) {
            if(parseFloat(i) > max ){
                max = parseFloat(i)
            }
        });


        var min = max
        onlyvals.map(function (i) {
            if(parseFloat(i) < min ){
                min = parseFloat(i)
            }
        });


        var blankData=[
            ['Máximo',0],
            ['Mínimo',0],
            ['Média',0]
        ]

        var  chartData= [
            ['Máximo', max],
            ['Mínimo', min],
            ['Média', media]]

        var meanChart = c3.generate({
            size: {
                height: 200,
                width: 480
            },
            bindto: '#meanChart',
            data: {
                columns: chartData,
                type: 'bar'
            },
            axis: {
                rotated: true,
                x:{
                    show: false

                }

            },
            bar: {
                width: {
                    ratio: 0.5 // this makes bar width 50% of length between ticks
                }
                // or
                //width: 100 // this makes bar width 100px
            },
            color: {
                pattern: ['darkblue', 'blue', 'lightblue']
            },


        });


        /*     //Animacao graficos medias
         setTimeout(function () {
         meanChart.load ({columns: chartData});
         }, 500)

         */




    });

});
