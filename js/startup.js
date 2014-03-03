
/*global jQuery $ BipartiteNetwork*/

$(function() {
    var bpn = new BipartiteNetwork($('#networks'), {});
    bpn.resizeTo(window);
    var nodes = [
	{ name : 'sam',
	  position : 'top' },
	{ name : 'kyle',
	  position : 'top' },
	{ name : 'markus',
	  position: 'top' },
	{ name : 'cookies',
	  position: 'bottom' },
	{ name : 'monster',
	  position : 'bottom' }
    ];
    var edges = [
	{ from : 'sam',
	  to : 'monster' },
	{ from: 'sam',
	  to: 'cookies' },
	{ from : 'kyle',
	  to : 'cookies' }
    ];

    nodes = [];
    for (var i = 0; i < 30; i++) {
	nodes.push({
	    name : i,
	    position : i % 3 ? "top" : "bottom",
	    proposal : (~~(1+Math.random() * 100)) / 100
	});
    }
    edges = [];
    for (var i = 0; i < 100; i++) {
	var start = ~~(Math.random() * 10) * 3;
	var end = ~~(Math.random() * 10) * 3 + 1+ ~~(Math.random()*2);
	edges.push({
	    from : start,
	    to : end
	});
    }

    bpn.setNodes(nodes).setEdges(edges).draw();
    // window.setTimeout(function() {
    // 	bpn.updateNodes([ { name : 'sam',
    // 			    proposal : 0.6 },
    // 			  { name : 'kyle',
    // 			    proposal : 0.37 } ])
    // 	    .draw();
    // }, 2000);
    // window.setTimeout(function() {
    // 	bpn.updateNodes([ { name : 'sam',
    // 			    dead : true } ])
    // 	    .draw();
    // }, 4000);
});
