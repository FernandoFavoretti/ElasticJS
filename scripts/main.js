define(['scripts/d3.v3', 'scripts/elasticsearch'], function (d3, elasticsearch) {
    var client = new elasticsearch.Client();

    client.search({
        index: 'prodam',
        size: 5,

        body: {
            // Begin query.

            query: {
                // Boolean query for matching and excluding items.
                match: {"DESCRICAO": "salada"}
            }
            // Aggregate on the results

            // End query.
        }
    }).then(function (resp) {

        //My Data
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

        //Medias
        var media = 0
        onlyvals.map(function (i) {
            media += parseFloat(i)
        });

        media = Number((media/onlyvals.length).toFixed(2));

        //max
        var max = 0
        onlyvals.map(function (i) {
            if(parseFloat(i) > max ){
                max = parseFloat(i)
            }
        });


        //min
        var min = max
        onlyvals.map(function (i) {
            if(parseFloat(i) < min ){
                min = parseFloat(i)
            }
        });


        var color = d3.scale.linear()
            .domain([min, media, max])
            .range(['#930F16', '#F0F0D0', '#228B22']);

        //Mapeia resutlados do source
        var results = resp['hits']['hits'].map(function (i) {
            return i['_source'];
        });



        data = [
            {label:"Val. Médio", value:media},
            {label:"Val. Máximo", value:max},
            {label:"Val. Mínimo", value:min}
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
                return (d.value+"%");
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
                div.html((d.label)+"<br>"+(d.value)+"%");
            });
        bar
            .on("mouseout", function(d){
                div.style("display", "none");
            });

        svg.insert("g",":first-child")
            .attr("class", "axisHorizontal")
            .attr("transform", "translate(" + (margin + labelWidth) + ","+ (height - axisMargin - margin)+")")
            .call(xAxis);




    });

    /**
     * Created by favoretti on 28/10/16.
     */
});