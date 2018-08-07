/*global nv, d3*/
nv.models.dial = function () {
  "use strict";

  //============================================================
  // Public Variables with Default Settings
  //------------------------------------------------------------

  var margin = { top: 0, right: 0, bottom: 0, left: 0 }
    //, bgColor = '#031732'
    , id = function (d) { return d.id }
    , ranges = function (d) { return d.ranges }
    , measures = function (d) { return d.measures }
    //, rangeLabels = function (d) { return d.rangeLabels ? d.rangeLabels : [] }
    //, measureLabels = function (d) { return d.measureLabels ? d.measureLabels : [] }
    , forceX = [0] // List of numbers to Force into the X scale (ie. 0, or a max / min, etc.)
    , width = 380
    , height = 30
    //, container = null
    , tickFormat = null
    , valueFormat = d3.format(',.2f')
    , color = nv.utils.getColor(['#1f77b4'])
    //, defaultRangeLabels = ["Maximum", "Mean", "Minimum"]
    //, legacyRangeClassNames = ["Max", "Avg", "Min"]
    , duration = 1000
    //, needle = {type: 1, length: 0.75, width: 0.05}
    //, tick = {minor: 5, major: 14, mark: 'line', exact: true}
    //, palette = {background: bgColor, scale:'#2EA0FF', rim: ['#031732', '#0279DF'], pivot: '#fff', needle: '#fff'}
    // , scale = { dial: {outer: 1.00,  middle: 0.95, inner: 0.92, dash: 0.61*0 },
    //         text: {position: 0.875, dy: 0.5, color: '#125EA3', family: 'SegoeUI', size: 10, scale: 0.005, weight: '100'},
    //         position: {start: 0.71, end: 0.76 }, rim: 0.14}
    //, x = 810
    //, y = 250
    //, r = 280
    , scale = function (d) { return d.scale }
    //, palette = function (d) { return d.palette }
    , range = function (d) { return d.range }
    , scaleDomain = function (d) { return d.scaleDomain }
    , caption = function (d) { return d.caption }
    , pivot = function (d) { return d.pivot }
    , tick = function (d) { return d.tick }
    , needle = function (d) { return d.needle }
    , dispatch = d3.dispatch('chartClick', 'elementMouseover', 'elementMouseout', 'elementMousemove', 'renderEnd')
    ;

  var renderWatch = nv.utils.renderWatch(dispatch);
  function chart(selection) {
    renderWatch.reset();
    selection.each(function (data) {
      var d = data[0];
      var availableWidth = width - margin.left - margin.right,
        availableHeight = height - margin.top - margin.bottom,
        container = d3.select(this);
      nv.utils.initSVG(container);

      var wm = width - margin.right - margin.left, // m[1] - m[3],
        hm = height - margin.top - margin.bottom, //m[0] - m[2],
        calDomain = [d.scaleDomain[0], d.tick.exact ? d.tick.minor * d.tick.major : d.scaleDomain[1]],
        a = d3.scale.linear().domain(calDomain).range(d.range),
        a0 = d3.scale.linear().domain(d.scaleDomain).range(d.range);
      a.percentageFormat = d.scale.text.format.indexOf('%') > 0;
      a.measurePercentageFormat = d.caption[0].format.indexOf('%') > 0;

      var r = Math.min(wm / 2, hm / 2);
      // Setup containers and skeleton of chart
      container.selectAll('g.nv-wrap.nv-dial').remove();
      var wrap = container.selectAll('g.nv-wrap.nv-dial').data([d]);
      var wrapEnter = wrap.enter().append('g').attr('class', 'nvd3 nv-wrap nv-dial');
      var gEnter = wrapEnter.append('g');

      gEnter.append('g').attr('class', 'nv-dail-nodes')
        //.attr('transform', 'translate(' + (margin.left + r) + ',' + (margin.top + r) + ')');
        .attr('transform', 'translate(' + availableWidth / 2 + ',' + availableHeight / 2 + ')');
      var g = wrap.selectAll('.nv-dail-nodes');

      wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
      container.on('click', function(d,i) {
        dispatch.chartClick({
            data: d,
            index: i,
            pos: d3.event,
            id: id
        });
	  })
	  .on('mouseover', function () {
		dispatch.elementMouseover({
		  value: d.caption[0].text,
		  label: d.caption[1].text,
		  color: d.set == 0 ? d.gradient.face[0].color : d.gradient.rim[1].color
		})
	  })
	  .on('mousemove', function () {
		dispatch.elementMousemove({
		  value: d.caption[0].text,
		  label: d.caption[1].text,
		  color: d.set == 0 ? d.gradient.face[0].color : d.gradient.rim[1].color
		})
	  })
	  .on('mouseout', function () {
		dispatch.elementMouseout({
		  value: d.caption[0].text,
		  label: d.caption[1].text,
		  color: d.set == 0 ? d.gradient.face[0].color : d.gradient.rim[1].color
		})
	  });

      createDefs();
      drawRim();
      drawCaption();
      drawScale();
      drawGlare();
      drawNeedle();

      function drawRim() {
        var endRange = a0(d.caption[0].text);
        g.selectAll('.rim').remove();
        //gRim = g.append('svg:g').attr('class', 'rim');
        var rimNodes = g.selectAll('.rim').data([d]);
        var gRim = rimNodes.enter().append('g').attr("class", "rim");
        if (d.set > 0) {
          //scale gradient arc
          // var arc = d3.svg.arc()
          //     .innerRadius(r* scale.position.end-35)
          //     .outerRadius(r* scale.position.end-1.8)
          //     .startAngle(range[0] * (Math.PI/180)) //converting from degs to radians
          //     .endAngle(endRange * (Math.PI/180)); //just radians
          //
          // g.append("path")
          //     .attr("d", arc)
          //     //.attr("stroke-width", "20")
          //     .attr("fill", "url(#gradient0)")


          // strip rim
          var points = 50;
          var angle = d3.scale.linear()
            .domain([0, points - 1])
            .range([range(d)[0] * (Math.PI / 180), endRange * (Math.PI / 180)]);

          var line = d3.svg.line.radial()
            .interpolate("basis")
            .tension(0)
            .radius(r * d.tick.position.minor.end - 2 - (r * d.scale.rim / 2))
            .angle(function (d, i) { return angle(i); });

          // var svg = d3.select("body").append("svg")
          //     // .attr("width", dimension)
          //     // .attr("height", dimension)
          // .append("g");

          gRim.append("path").datum(d3.range(points))
            //.attr("class", "lineArc")
            .attr("d", line)
            //.attr("transform", "translate(" + (r + padding) + ", " + (r + padding) + ")")
            ;
          var color = d3.interpolate(d.gradient.rim[0].color, d.gradient.rim[1].color);

          var path = gRim.select("path").remove();
          gRim.selectAll("path")
            .data(quads(samples(path.node(), 8)))
            .enter().append("path")
            .style("fill", function (d) { return color(d.t); })
            .style("stroke", function (d) { return color(d.t); })
            .attr("d", function (d0) { return lineJoin(d0[0], d0[1], d0[2], d0[3], (r * d.scale.rim)); })
            //.attr("transform", "translate(" + 810 + ", " + 250 + ")")
            ;
        } else {
          //face
          gRim.append('svg:circle')
            .attr('r', r * d.scale.dial.outer)
            .style('fill', 'url(#outerGradient' + d.id + ')')
            .attr('filter', 'url(#dropShadow' + d.id + ')');

          gRim.append('svg:circle')
            .attr('r', r * d.scale.dial.middle)
            .style('fill', 'url(#innerGradient' + d.id + ')');

          gRim.append('svg:circle')
            .attr('r', r * d.scale.dial.inner)
            .style('fill', 'url(#faceGradient' + d.id + ')');
        }

        // Sample the SVG path uniformly with the specified precision.
        function samples(path, precision) {
          var n = path.getTotalLength(), t = [0], i = 0, dt = precision;
          while ((i += dt) < n) t.push(i);
          t.push(n);
          return t.map(function (t) {
            var p = path.getPointAtLength(t), a = [p.x, p.y];
            a.t = t / n;
            return a;
          });
        }

        // Compute quads of adjacent points [p0, p1, p2, p3].
        function quads(points) {
          return d3.range(points.length - 1).map(function (i) {
            var a = [points[i - 1], points[i], points[i + 1], points[i + 2]];
            a.t = (points[i].t + points[i + 1].t) / 2;
            return a;
          });
        }

        // Compute stroke outline for segment p12.
        function lineJoin(p0, p1, p2, p3, width) {
          var u12 = perp(p1, p2), e,
            r = width / 2,
            a = [p1[0] + u12[0] * r, p1[1] + u12[1] * r],
            b = [p2[0] + u12[0] * r, p2[1] + u12[1] * r],
            c = [p2[0] - u12[0] * r, p2[1] - u12[1] * r],
            d = [p1[0] - u12[0] * r, p1[1] - u12[1] * r];

          if (p0) { // clip ad and dc using average of u01 and u12
            var u01 = perp(p0, p1);
            e = [p1[0] + u01[0] + u12[0], p1[1] + u01[1] + u12[1]];
            a = lineIntersect(p1, e, a, b);
            d = lineIntersect(p1, e, d, c);
          }

          if (p3) { // clip ab and dc using average of u12 and u23
            var u23 = perp(p2, p3);
            e = [p2[0] + u23[0] + u12[0], p2[1] + u23[1] + u12[1]];
            b = lineIntersect(p2, e, a, b);
            c = lineIntersect(p2, e, d, c);
          }

          return "M" + a + "L" + b + " " + c + " " + d + "Z";
        }

        // Compute intersection of two infinite lines ab and cd.
        function lineIntersect(a, b, c, d) {
          var x1 = c[0], x3 = a[0], x21 = d[0] - x1, x43 = b[0] - x3,
            y1 = c[1], y3 = a[1], y21 = d[1] - y1, y43 = b[1] - y3,
            ua = (x43 * (y1 - y3) - y43 * (x1 - x3)) / (y43 * x21 - x43 * y21);
          return [x1 + ua * x21, y1 + ua * y21];
        }

        // Compute unit vector perpendicular to p01.
        function perp(p0, p1) {
          var u01x = p0[1] - p1[1], u01y = p1[0] - p0[0],
            u01d = Math.sqrt(u01x * u01x + u01y * u01y);
          return [u01x / u01d, u01y / u01d];
        }

      }
      function drawScale() {
        g.selectAll('.scale').remove();
        //gScale = g.append('svg:g').attr('class', 'scale');
        var scaleNodes = g.selectAll('.scale').data([d]);
        var gScale = scaleNodes.enter().append('g').attr("class", "scale");

        //if (d.set > 0) {
          //scale arc thin rim
          var arc = d3.svg.arc()
            .innerRadius(r * d.tick.position.arc.start)
            .outerRadius(r * d.tick.position.arc.end)
            .startAngle(range(d)[0] * (Math.PI / 180)) //converting from degs to radians
            .endAngle(range(d)[1] * (Math.PI / 180)); //just radians

          gScale.append("path")
            .attr("d", arc)
			.attr("fill", d.tick.position.arc.color);
        //}

        // var tick0 = 10;
        // var major = a.ticks(tick0);
        // var minor = a.ticks(tick0 * minorTicks).filter(function(d) { return major.indexOf(d) == -1; });
        // var middle = a.ticks(tick0 * minorTicks).filter(function(d) { return major.indexOf(d) != -1; });

        //var tick0 = tick.major===1 ? 10 : tick.major;
		var major = a.ticks(d.tick.major);
		//var major0 = a0.ticks(d.tick.major);
        var minor = a.ticks(d.tick.minor * d.tick.major);//.filter(function(d) { return major.indexOf(d) == -1; });
        var middle = a.ticks(d.tick.minor * d.tick.major).filter(function (d) { return major.indexOf(d) != -1; });
		var majorRange = d.tick.exact ? [major[0], d.scaleDomain[1]] : [major[0], major[major.length - 1]];
		//var major0Range = d.tick.exact ? [major0[0], d.scaleDomain[1]] : [major0[0], major0[major0.length - 1]];
        var scaleDomainUpper = scaleDomain(d)[1];

        //  console.log('major =', major );
    	//  console.log('majorRange=', majorRange);
        //  console.log('major0 =', major0 );
		//  console.log('major0Range=', major0Range);
		 
		var scalMap = d3.scale.linear()
            .domain(calDomain)
			.range(d.scaleDomain);
		if (!d.scale.text.hide.minmax || !d.scale.text.hide.middle) {
        gScale.selectAll('text.label')
          .data(d.scale.text.hide.middle ? majorRange : major)
          .enter().append('svg:text')
          .attr({
            'x': function (d0) { return Math.cos((-90 + a((d.tick.exact && d.scale.text.hide.middle ? d0 / scaleDomainUpper * major[major.length - 1] : d0))) / 180 * Math.PI) * r * d.scale.text.position; },
            'y': function (d0) { return Math.sin((-90 + a((d.tick.exact && d.scale.text.hide.middle ? d0 / scaleDomainUpper * major[major.length - 1] : d0))) / 180 * Math.PI) * r * d.scale.text.position; },
            'dy': function () { return d.scale.text.dy + 'em' },
            'font-family': function () { return d.scale.text.family },
            'font-size': function () { return r * d.scale.text.size * d.scale.text.scale + 'px' },
            'font-weight': function () { return d.scale.text.weight },
            'fill': function () { return d.scale.text.color },
            'alignment-baseline': 'middle',
            'text-anchor': 'middle',
          })
		  .text(function (d0) { 
			   d0 = d.tick.exact ? (d.scale.text.hide.middle ? d0 : scalMap(d0)) : d0;
			   return a.percentageFormat 
			?  d3.format(d.scale.text.format)(d.scale.text.hide.middle ? (d0 > 0 ? 1 : 0): (d0/d.scaleDomain[1])) 
			: (d.scale.text.format == '' ? a.tickFormat()(d0) : d3.format(d.scale.text.format)(d0)); })
          ;
		  }

        if (d.tick.mark == 'circle') {
          gScale.selectAll('circle.label')
            .data(minor)
            .enter().append('svg:circle')
            .attr('class', 'mlabel')
			.attr('fill', d.tick.position.minor.color)
            .attr('cx', function (d0) { return Math.cos((-90 + a(d0)) / 180 * Math.PI) * (r * d.tick.position.minor.start); })
            .attr('cy', function (d0) { return Math.sin((-90 + a(d0)) / 180 * Math.PI) * (r * d.tick.position.minor.start); })
            .attr('r', d.tick.position.minor.end-d.tick.position.minor.start);
        }

        if (d.tick.mark == 'line') {
          //if (d.set > 0) {
            gScale.selectAll('line.label')
              .data(minor)
              .enter().append('svg:line')
              //.attr('class', 'mlabel')
              .attr('stroke', d.tick.position.minor.color)
              .attr('stroke-width', d.tick.position.minor.width)
              .attr('x1', function (d0) { return Math.cos((-90 + a(d0)) / 180 * Math.PI) * (r * (d.tick.position.minor.start)); })
              .attr('y1', function (d0) { return Math.sin((-90 + a(d0)) / 180 * Math.PI) * (r * (d.tick.position.minor.start)); })
              .attr('x2', function (d0) { return Math.cos((-90 + a(d0)) / 180 * Math.PI) * (r * d.tick.position.minor.end); })
              .attr('y2', function (d0) { return Math.sin((-90 + a(d0)) / 180 * Math.PI) * (r * d.tick.position.minor.end); });
            gScale.selectAll('line.label')
              .data(middle)
              .enter().append('svg:line')
              //.attr('class', 'mlabel')
              .attr('stroke', d.tick.position.major.color)
              .attr('stroke-width', d.tick.position.major.width)
              .attr('x1', function (d0) { return Math.cos((-90 + a(d0)) / 180 * Math.PI) * (r * (d.tick.position.major.start)); })
              .attr('y1', function (d0) { return Math.sin((-90 + a(d0)) / 180 * Math.PI) * (r * (d.tick.position.major.start)); })
              .attr('x2', function (d0) { return Math.cos((-90 + a(d0)) / 180 * Math.PI) * (r * d.tick.position.major.end); })
              .attr('y2', function (d0) { return Math.sin((-90 + a(d0)) / 180 * Math.PI) * (r * d.tick.position.major.end); });
        //   } else {
        //     gScale.selectAll('line.label')
        //       .data(minor)
        //       .enter().append('svg:line')
		// 	  .attr('class', 'mlabel')
		// 	  .attr('stroke', d.tick.color)
        //       .attr('x1', function (d0) { return Math.cos((-90 + a(d0)) / 180 * Math.PI) * (r * d.tick.position.start); })
        //       .attr('y1', function (d0) { return Math.sin((-90 + a(d0)) / 180 * Math.PI) * (r * d.tick.position.start); })
        //       .attr('x2', function (d0) { return Math.cos((-90 + a(d0)) / 180 * Math.PI) * (r * d.tick.position.end); })
        //       .attr('y2', function (d0) { return Math.sin((-90 + a(d0)) / 180 * Math.PI) * (r * d.tick.position.end); });
        //   }
        }
      }
      function drawGlare() {
        // gradient on top panel
        g.selectAll('.dial-glare').remove();
        var glareNodes = g.selectAll('.dial-glare').data([d]);

        var rdial3 = r * d.scale.dial.dash;
        //console.log(rdial3);
        glareNodes.enter().append('path')
          .attr('class', 'dial-glare')
          .attr('d', 'M ' + (-rdial3) + ',0 A' + rdial3 + ',' + rdial3 + ' 0 0,1 ' + rdial3 + ',0 A' + (rdial3 * 5) + ',' + (rdial3 * 5) + ' 0 0,0 ' + (-rdial3) + ',0')
          .style('fill', 'url(#glareGradient' + d.id + ')')
          ;
      }
      function createDefs() {
        g.selectAll('defs').remove();
        var defs = g.append('svg:defs')
        var x1 = 0, y1 = 0, x2 = 0.5, y2 = 1;
        // var arc0 = d3.svg.arc()
        //     .innerRadius(r* scale.position.end-50)
        //     .outerRadius(r* scale.position.end-20)
        //     .startAngle(-135 * (Math.PI/180)) //converting from degs to radians
        //     .endAngle(2.36); //just radians

        // g.append("path")
        //     .attr("d", arc0)
        //     .attr("fill", "url(#arcGradient)")

        //defs.remove();
        // Define the gradient
        var newGrad = defs.append("svg:linearGradient")
          .attr("id", "newGrad")
          .attr("spreadMethod", "pad");

        // Define the gradient color stops
        newGrad.append("svg:stop")
          .attr("offset", "0%")
          .attr("stop-color", "#000")
          .attr("stop-opacity", 2);
        newGrad.append("svg:stop")
          .attr("offset", "100%")
          .attr("stop-color", "#007AE1")
          .attr("stop-opacity", 2);

        var red_gradient = defs.append("svg:linearGradient")
          .attr("id", "gradient0")
          .attr("x1", x1)
          .attr("y1", y1)
          .attr("x2", x2)
          .attr("y2", y2)
          .attr("spreadMethod", "pad");

        //first dark red color
        red_gradient.append("svg:stop")
          .attr("offset", "0%")
          .attr("stop-color", "#f00")
          .attr("stop-opacity", 1);
        //second light red color
        red_gradient.append("svg:stop")
          .attr("offset", "100%")
          .attr("stop-color", "#007AE1")
          .attr("stop-opacity", 1);

        var radial_gradient = defs.append("radialGradient")
          .attr("gradientUnits", "userSpaceOnUse")
          .attr("cx", '50%')
          .attr("cy", '50%')
          .attr("r", "50%")
          .attr("fx", '50%')
          .attr("fy", '50%')
          .attr('gradientTransform', "translate(-200,-200)")
          .attr("id", 'gradient2');
        radial_gradient.append("stop").attr("offset", "0%").style("stop-color", "black");
        //radial_gradient.append("stop").attr("offset", "55%").style("stop-color", "white");
        radial_gradient.append("stop").attr("offset", "95%").style("stop-color", "white");


        var gradient = defs.append('svg:linearGradient')
          .attr("y1", 0)
          .attr("y2", 0)
          .attr("x1", "0")
          .attr("x2", "0")
          .attr("id", "gradient")
          .attr("gradientUnits", "userSpaceOnUse")

        gradient
          .append("stop")
          .attr("offset", "0")
          .attr("stop-color", "#ff0")

        gradient
          .append("stop")
          .attr("offset", "0.5")
          .attr("stop-color", "#f00")

        // var arcGradient = defs.append('svg:linearGradient')
        //   .attr('id', 'arcGradient')
        //   .attr('x1', '0%').attr('y1', '0%')
        //   .attr('x2', '0%').attr('y2', '100%')
        //   .attr('spreadMethod', 'pad');

        // arcGradient.selectAll('stop')
        //   .data([{ o: '0%', c: '#ffffff' }, { o: '100%', c: '#d0d0d0' }])
        //   .enter().append('svg:stop')
        //   .attr('offset', function (d) { return d.o; })
        //   .attr('stop-color', '#00f')
        //   .attr('stop-opacity', '1');
        var pivotOuterGradient = defs.append('svg:linearGradient')
          .attr('id', 'pivotOuterGradient' + d.id)
          .attr('x1', '0%').attr('y1', '0%')
          .attr('x2', '0%').attr('y2', '100%')
          .attr('spreadMethod', 'pad');

        pivotOuterGradient.selectAll('stop')
		  .data([{ o: d.gradient.pivot.outer[0].offset, c: d.gradient.pivot.outer[0].color, op: d.gradient.pivot.outer[0].opacity }, { o: d.gradient.pivot.outer[1].offset, c: d.gradient.pivot.outer[1].color, op: d.gradient.pivot.outer[1].opacity }])
          .enter().append('svg:stop')
          .attr('offset', function (d) { return d.o; })
          .attr('stop-color', function (d) { return d.c; })
          .attr('stop-opacity', function (d) { return d.op; });

        var pivotInnerGradient = defs.append('svg:linearGradient')
          .attr('id', 'pivotInnerGradient' + d.id)
          .attr('x1', '0%').attr('y1', '0%')
          .attr('x2', '0%').attr('y2', '100%')
          .attr('spreadMethod', 'pad');

        pivotInnerGradient.selectAll('stop')
		.data([{ o: d.gradient.pivot.inner[0].offset, c: d.gradient.pivot.inner[0].color, op: d.gradient.pivot.inner[0].opacity }, { o: d.gradient.pivot.inner[1].offset, c: d.gradient.pivot.inner[1].color, op: d.gradient.pivot.inner[1].opacity }])
		.enter().append('svg:stop')
          .attr('offset', function (d) { return d.o; })
          .attr('stop-color', function (d) { return d.c; })
          .attr('stop-opacity', function (d) { return d.op; });


        var outerGradient = defs.append('svg:linearGradient')
          .attr('id', 'outerGradient' + d.id)
          .attr('x1', '0%').attr('y1', '0%')
          .attr('x2', '0%').attr('y2', '100%')
          .attr('spreadMethod', 'pad');

        outerGradient.selectAll('stop')
		  .data([{ o: d.gradient.outer[0].offset, c: d.gradient.outer[0].color, op: d.gradient.outer[0].opacity }, { o: d.gradient.outer[1].offset, c: d.gradient.outer[1].color, op: d.gradient.outer[1].opacity }])
          .enter().append('svg:stop')
          .attr('offset', function (d) { return d.o; })
          .attr('stop-color', function (d) { return d.c; })
          .attr('stop-opacity', function (d) { return d.op; });

        var innerGradient = defs.append('svg:linearGradient')
          .attr('id', 'innerGradient' + d.id)
          .attr('x1', '0%').attr('y1', '0%')
          .attr('x2', '0%').attr('y2', '100%')
          .attr('spreadMethod', 'pad');

        innerGradient.selectAll('stop')
		.data([{ o: d.gradient.inner[0].offset, c: d.gradient.inner[0].color, op: d.gradient.inner[0].opacity }, { o: d.gradient.inner[1].offset, c: d.gradient.inner[1].color, op: d.gradient.inner[1].opacity }])
		.enter().append('svg:stop')
          .attr('offset', function (d) { return d.o; })
          .attr('stop-color', function (d) { return d.c; })
          .attr('stop-opacity', function (d) { return d.op; });

        var faceGradient = defs.append('svg:linearGradient')
          .attr('id', 'faceGradient' + d.id)
          .attr('x1', '0%').attr('y1', '0%')
          .attr('x2', '0%').attr('y2', '100%')
          .attr('spreadMethod', 'pad');

        faceGradient.selectAll('stop')
          .data([{ o: d.gradient.face[0].offset, c: d.gradient.face[0].color, op: d.gradient.face[0].opacity }, { o: d.gradient.face[1].offset, c: d.gradient.face[1].color, op: d.gradient.face[1].opacity }])
          .enter().append('svg:stop')
          .attr('offset', function (d) { return d.o; })
          .attr('stop-color', function (d) { return d.c; })
          .attr('stop-opacity', function (d) { return d.op; });

        var glareGradient = defs.append('svg:linearGradient')
          .attr('id', 'glareGradient' + d.id)
          .attr('x1', '0%').attr('y1', '0%')
          .attr('x2', '0%').attr('y2', '100%')
          .attr('spreadMethod', 'pad');

        glareGradient.selectAll('stop')
          .data([{ o: d.gradient.glare[0].offset, c: d.gradient.glare[0].color, op: d.gradient.glare[0].opacity }, { o: d.gradient.glare[1].offset, c: d.gradient.glare[1].color, op: d.gradient.glare[1].opacity }])
          .enter().append('svg:stop')
          .attr('offset', function (d) { return d.o; })
          .attr('stop-color', function (d) { return d.c; })
          .attr('stop-opacity', function (d) { return d.op; });

        var dropShadowFilter = defs.append('svg:filter')
          .attr('id', 'dropShadow' + d.id);
        dropShadowFilter.append('svg:feGaussianBlur')
          .attr('in', 'SourceAlpha')
          .attr('stdDeviation', 3);
        dropShadowFilter.append('svg:feOffset')
          .attr('dx', 2)
          .attr('dy', 2)
          .attr('result', 'offsetblur');
        var feMerge = dropShadowFilter.append('svg:feMerge');
        feMerge.append('svg:feMergeNode');
        feMerge.append('svg:feMergeNode')
          .attr('in', "SourceGraphic");

      }
      function drawNeedle() {
        // needle
        g.selectAll('.needle').remove();
        var needleNodes = g.selectAll('.needle').data([d]);
        var gNeedle = needleNodes.enter().append('g').attr("class", "needle");

        var n = gNeedle
          .attr('filter', 'url(#dropShadow' + d.id + ')')
          .attr('transform', function (d) { return 'rotate(' + a0(d.caption[0].text) + ')'; })
          ;

        if (d.set > 0) {
          if (d.set === 1) {
            n.append('svg:line')
              .attr('class', 'needle')
              .attr('stroke', d.needle.color)
              .attr('stroke-width', (d.needle.width * 40) + 'px')
              .attr('x1', 0)
              .attr('y1', 0)
              .attr('x2', 0)
              .attr('y2', -r * d.needle.length);
          } else {
            n.append('svg:path')
              .attr('d', 'M ' + (-r * d.needle.width) + ',0 L0,' + (-r * d.needle.length) + ' L' + r * d.needle.width + ',0')
              .attr('fill', d.needle.color);
          }

          n.append('svg:circle')
            .attr('r', r * d.pivot[1])
            .style('fill', 'url(#pivotInnerGradient' + d.id + ')')
            ;
        } else {
          n.append('svg:path')
            .attr('d', 'M ' + (-r * d.needle.width) + ',' + (-r * d.needle.start) + ' L0,' + (-r * d.needle.length) + ' L' + r * d.needle.width + ',' + (-r * d.needle.start))
            .attr('fill', d.needle.color);

          n.append('svg:circle')
            .attr('r', r * d.pivot[0])
            .style('fill', 'url(#pivotOuterGradient' + d.id + ')');

          n.append('svg:circle')
            .attr('r', r * d.pivot[1])
            .style('fill', 'url(#pivotInnerGradient' + d.id + ')');
        }

      }
      function drawCaption() {
        g.selectAll('text').remove();
        g.selectAll('text')
          .data(d.caption)
          .enter().append('svg:text')
          .text(function (d0) { return isNumeric(d0.text) ? d3.format(d0.format)(a.measurePercentageFormat ? d0.text / d.scaleDomain[1] : d0.text) : d0.text })
          .attr({
            'dx': function (d) { return d.dx + 'em' },
            'dy': function (d) { return d.dy + 'em' },
            'style': function (d) { return 'font-family: ' + d.family + ';font-size: ' + (r * d.size * d.scale) + 'px;font-weight: ' + d.weight + ';fill: ' + d.color + ';alignment-baseline: middle;text-anchor: middle;' }
          })
          ;
      }
      function isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
      }

    });

	renderWatch.renderEnd('dial immediate');
    return chart;
  }

  //============================================================
  // Expose Public Variables
  //------------------------------------------------------------

  chart.dispatch = dispatch;
  chart.options = nv.utils.optionsFunc.bind(chart);

  chart._options = Object.create({}, {
    // simple options, just get/set the necessary values
    id: { get: function () { return id; }, set: function (_) { id = _; } },
    ranges: { get: function () { return ranges; }, set: function (_) { ranges = _; } }, // ranges (bad, satisfactory, good)
    measures: { get: function () { return measures; }, set: function (_) { measures = _; } }, // measures (actual, forecast)
    forceX: { get: function () { return forceX; }, set: function (_) { forceX = _; } },
    width: { get: function () { return width; }, set: function (_) { width = _; } },
    height: { get: function () { return height; }, set: function (_) { height = _; } },
    tickFormat: { get: function () { return tickFormat; }, set: function (_) { tickFormat = _; } },
    valueFormat:    {get: function(){return valueFormat;}, set: function(_){valueFormat=_;}},
    duration: { get: function () { return duration; }, set: function (_) { duration = _; 
		renderWatch.reset(duration);
	} },

    // x: { get: function () { return x; }, set: function (_) { x = _; } },
    // y: { get: function () { return y; }, set: function (_) { y = _; } },
    // r: { get: function () { return r; }, set: function (_) { r = _; } },
    //domain: { get: function () { return domain; }, set: function (_) { domain = _; } },
    scaleDomain: { get: function () { return scaleDomain; }, set: function (_) { scaleDomain = _; } },
    range: { get: function () { return range; }, set: function (_) { range = _; } },
    pivot: { get: function () { return pivot; }, set: function (_) { pivot = _; } },
    caption: { get: function () { return caption; }, set: function (_) { caption = _; } },

    // options that require extra logic in the setter
    margin: {
      get: function () { return margin; }, set: function (_) {
        margin.top = _.top !== undefined ? _.top : margin.top;
        margin.right = _.right !== undefined ? _.right : margin.right;
        margin.bottom = _.bottom !== undefined ? _.bottom : margin.bottom;
        margin.left = _.left !== undefined ? _.left : margin.left;
      }
    },
    needle: {
      get: function () { return needle; }, set: function (_) {
        needle.color = _.color !== undefined ? _.color : needle.color;
        needle.length = _.length !== undefined ? _.length : needle.length;
        needle.width = _.width !== undefined ? _.width : needle.width;
      }
    },
    color: {
      get: function () { return color; }, set: function (_) {
        color = nv.utils.getColor(_);
      }
    },
    tick: {
      get: function () { return tick; }, set: function (_) {
        tick.minor = _.minor !== undefined ? _.minor : tick.minor;
        tick.major = _.major !== undefined ? _.major : tick.major;
        tick.mark = _.mark !== undefined ? _.mark : tick.mark;
        tick.exact = _.exact !== undefined ? _.exact : tick.exact;
      }
    },
    scale: {
      get: function () { return scale; }, set: function (_) {
        scale.dial = _.dial !== undefined ? _.dial : scale.dial;
        scale.text = _.text !== undefined ? _.text : scale.text;
        scale.rim = _.rim !== undefined ? _.rim : scale.rim;
      }
    },

  });

  nv.utils.initOptions(chart);
  return chart;
};
