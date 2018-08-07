/*global nv, d3*/
nv.models.dialChart = function() {
    "use strict";

    //============================================================
    // Public Variables with Default Settings
    //------------------------------------------------------------

    var dial = nv.models.dial();
    var tooltip = nv.models.tooltip();

    var margin = {top: 5, right: 40, bottom: 20, left: 120}
	, id = function(d) { return d.id }
	, ranges = function(d) { return d.ranges }
        , measures = function(d) { return d.measures }
        , link = {url: '', target: '', tooltip: ''}
        , width = null
        , height = null
        , tickFormat = null
		, ticks = null
		, duration = 1000
        , noData = null
        , needle = {type: 1, length: 0.75, width: 0.05}
        , pivot =  function(d) { return d.pivot }
		, caption =  function(d) { return d.caption }
        , dispatch = d3.dispatch('stateChange', 'changeState','renderEnd')
        ;

    tooltip
        .duration(0)
        .headerEnabled(false)
        .valueFormatter(function(d, i) {
            return dial.valueFormat()(d, i);
        });

		var renderWatch = nv.utils.renderWatch(dispatch);

	function chart(selection) {
		//console.log('p0Height=', height);
        //console.log('selection=', selection);
        renderWatch.reset();
        renderWatch.models(dial);

		selection.each(function(d) {
            var container = d3.select(this);
            nv.utils.initSVG(container);
            //console.log('0width=', width);
            //console.log('0height=', height);
			// console.log('0margin', margin);
			
			if (d.length===0) {
				nv.utils.noData(chart, container);
				return chart;
			}else {
                container.selectAll('.nv-noData').remove();
            }
		

            var availableWidth = nv.utils.availableWidth(width, container, margin),
                availableHeight = nv.utils.availableHeight(height, container, margin); //height - margin.top - margin.bottom,
            //    that = this;
            //console.log('0availableWidth=', availableWidth);
            //console.log('0availableWidth=', availableHeight);

            //chart.update = function() { chart(selection) };
            chart.update = function() { container.transition().call(chart); };
            chart.container = this;

            // var rangez = ranges.call(this, d, i).slice().sort(d3.descending),
            //     measurez = measures.call(this, d, i).slice().sort(d3.descending);

            // Setup containers and skeleton of chart
            var wrap = container.selectAll('g.nv-wrap.nv-dialChart').data([d]);
            var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-dialChart');
            var gEnter = wrapEnter.append('g');
            var g = wrap.select('g');

            gEnter.append('g').attr('class', 'nv-dialWrap');
            //gEnter.append('g').attr('class', 'nv-titles');

            wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

            // Compute the new x-scale.
            // var x1 = d3.scale.linear()
            //     .domain([0, Math.max(rangez[0], measurez[0])])  // TODO: need to allow forceX and forceY, and xDomain, yDomain
            //     .range([0, availableWidth]);

            // Retrieve the old x-scale, if this is an update.
            // var x0 = this.__chart__ || d3.scale.linear()
            //     .domain([0, Infinity])
            //     .range(x1.range());

            // Stash the new scale.
            //this.__chart__ = x1;

            // var w0 = function(d) { return Math.abs(x0(d) - x0(0)) }, // TODO: could optimize by precalculating x0(0) and x1(0)
            //     w1 = function(d) { return Math.abs(x1(d) - x1(0)) };
            //
            // var title = gEnter.select('.nv-titles').append('g')
            //     .attr('text-anchor', 'end')
            //     .attr('transform', 'translate(-6,' + (height - margin.top - margin.bottom) / 2 + ')');
            // title.append('text')
            //     .attr('class', 'nv-title')
            //     .text(function(d) { return d.title; });
            //
            // title.append('text')
            //     .attr('class', 'nv-subtitle')
            //     .attr('dy', '1em')
            //     .text(function(d) { return d.subtitle; });
			//console.log(availableWidth);
			//console.log(availableHeight);
            dial
                .width(availableWidth)
                .height(availableHeight);

            var dialWrap = g.select('.nv-dialWrap');
            d3.transition(dialWrap).call(dial);

        });

        d3.timer.flush();
        renderWatch.renderEnd('dialChart immediate');
        return chart;
    }

    //============================================================
    // Event Handling/Dispatching (out of chart's scope)
    //------------------------------------------------------------

    dial.dispatch.on('elementMouseover.tooltip', function(evt) {
        evt['series'] = {
            key: evt.label,
            value: evt.value,
            color: evt.color
        };
		if (link.url!="" && link.tooltip!=""){
			evt.footer = link.tooltip;
		}
        tooltip.data(evt).hidden(false);
    });

    dial.dispatch.on('elementMouseout.tooltip', function() {
        tooltip.hidden(true);
    });

    dial.dispatch.on('elementMousemove.tooltip', function() {
        tooltip();
    });
    
    //============================================================
    // Expose Public Variables
    //------------------------------------------------------------

//console.log('chart=', chart);
//console.log('dispatch=', dispatch);
//console.log('dial=', dial);
	chart.dispatch = dispatch;
    chart.dial = dial;
    chart.tooltip = tooltip;
	//console.log('chart1=', chart);

    chart.options = nv.utils.optionsFunc.bind(chart);
	//console.log('chart2=', chart);

    chart._options = Object.create({}, {
        // simple options, just get/set the necessary values
        id:      {get: function(){return id;}, set: function(_){id=_;}}, // ranges (bad, satisfactory, good)
        ranges:      {get: function(){return ranges;}, set: function(_){ranges=_;}}, // ranges (bad, satisfactory, good)
        measures: {get: function(){return measures;}, set: function(_){measures=_;}}, // measures (actual, forecast)
        width:    {get: function(){return width;}, set: function(_){width=_;}},
        height:    {get: function(){return height;}, set: function(_){height=_;}},
        tickFormat:    {get: function(){return tickFormat;}, set: function(_){tickFormat=_;}},
        ticks:    {get: function(){return ticks;}, set: function(_){ticks=_;}},
        noData:    {get: function(){return noData;}, set: function(_){noData=_;}},

        // x:    {get: function(){return x;}, set: function(_){x=_;}},
        // y:    {get: function(){return y;}, set: function(_){y=_;}},
        // r:    {get: function(){return r;}, set: function(_){r=_;}},
        // domain:    {get: function(){return domain;}, set: function(_){domain=_;}},
        // scaleDomain:    {get: function(){return scaleDomain;}, set: function(_){scaleDomain=_;}},
        //range:    {get: function(){return range;}, set: function(_){range=_;}},
        pivot:    {get: function(){return pivot;}, set: function(_){pivot=_;}},
        caption: {get: function(){return caption;}, set: function(_){caption=_;}},

        // options that require extra logic in the setter
        duration: {get: function(){return duration;}, set: function(_){
            duration = _;
            renderWatch.reset(duration);
            dial.duration(duration);
        }},
        link: {get: function(){return link;}, set: function(_){
            link.url = _.url;
            link.target = _.target;
            link.tooltip = _.tooltip;
        }},
        margin: {get: function(){return margin;}, set: function(_){
            margin.top    = _.top    !== undefined ? _.top    : margin.top;
            margin.right  = _.right  !== undefined ? _.right  : margin.right;
            margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
            margin.left   = _.left   !== undefined ? _.left   : margin.left;
        }},
        needle:    {get: function(){return needle;}, set: function(_){
          needle.color    = _.type    !== undefined ? _.type    : needle.color;
          needle.length    = _.length    !== undefined ? _.length    : needle.length;
          needle.width    = _.width    !== undefined ? _.width    : needle.width;
        }},
        // tick:    {get: function(){return tick;}, set: function(_){
        //   tick.minor    = _.minor    !== undefined ? _.minor    : tick.minor;
        //   tick.major    = _.major    !== undefined ? _.major    : tick.major;
        //   tick.mark    = _.mark    !== undefined ? _.mark    : tick.mark;
        //   tick.exact    = _.exact    !== undefined ? _.exact    : tick.exact;
        // }},
        // scale:    {get: function(){return scale;}, set: function(_){
        //   scale.dial    = _.dial    !== undefined ? _.dial    : scale.dial;
        //   scale.text    = _.text    !== undefined ? _.text    : scale.text;
        //   scale.rim    = _.rim    !== undefined ? _.rim    : scale.rim;
        // }}
    });
	//console.log('dial=', dial);
    nv.utils.inheritOptions(chart, dial);
    nv.utils.initOptions(chart);

    return chart;
};
