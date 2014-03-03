
/*global $ jQuery*/

var BipartiteNetwork = (function BipartiteNetworkClosure() {

    function BipartiteNetwork(el, kwargs) {
	this.$el = $(el);
	this.$dialog = $('#accept_proposal');
	this.el = this.$el[0];
	this.ctx = this.el.getContext('2d');
	this.width = this.$el.attr('width');
	this.height = this.$el.attr('height');
	this.nodes = [];
	this.edges = [];
	this.nodeMap = {};
	this.bindClick(this.displayAcceptDialog);
	this.bindHover(this.highlightNode);
    }

    var PADDING = 0.05, // Padding on either side of node, as % of diameter.
	TOP_BOTTOM_MARGINS = 0.03, // Padding on top / bottom of nodes.
	MAX_NODE_RADIUS = 0.05;

    var HIGHLIGHTED_COLOR = "#fc6",
	LINE_WEIGHT = 3;

    BipartiteNetwork.prototype = {
	resizeTo : function(el) {
	    var self = this;
	    function resizeHandler() {
		console.log("res");
		self.width = $(el).width();
		self.height = $(el).height();
		self.$el.attr('width', self.width);
		self.$el.attr('height', self.height);
		self.calculateNodePositions().draw();
	    }
	    $(el).on("resize", resizeHandler);
	    window.setTimeout(resizeHandler, 0);
	    return this;
	},
	setEdges : function(edges) {
	    this.edges = edges;
	    return this;
	},
	setNodes : function(nodes) {
	    this.nodes = nodes;
	    this.calculateNodePositions();
	    this.nodeMap = {};
	    for (var i = 0; i < this.nodes.length; ++i) {
		this.nodeMap[this.nodes[i].name] = this.nodes[i];
	    }
	    return this;
	},
	updateNodes : function(nodes) {
	    for (var i = 0; i < nodes.length; ++i) {
		var old_node;
		if (!this.nodeMap.hasOwnProperty(nodes[i].name)) {
		    old_node = nodes[i];
		    this.nodes.push(nodes[i]);
		} else {
		    old_node = this.nodeMap[nodes[i].name];
		}
		for (var key in nodes[i]) {
		    if (nodes[i].hasOwnProperty(key)) {
			old_node[key] = nodes[i][key];
		    }
		}
	    }
	    this.calculateNodePositions();
	    return this;
	},
	calculateNodePositions : function() {

	    // Calculate number of nodes on each side of bipartite
	    // graph.
	    var num_top_nodes = 0,
		num_bottom_nodes = 0;
	    for (var i = 0; i < this.nodes.length; ++i) {
		if (this.nodes[i].position === 'top') {
		    ++num_top_nodes;
		} else {
		    ++num_bottom_nodes;
		}
	    }

	    // Calculate positions with spacing.
	    var top_width_pct = 1.0 / num_top_nodes,
		bottom_width_pct = 1.0 / num_bottom_nodes,
		min_padding_pct = MAX_NODE_RADIUS;
	    // var top_width_pct = (1.0 / (num_top_nodes * (1 + 2*PADDING))),
	    // 	bottom_width_pct = (1.0 / (num_bottom_nodes * (1 + 2*PADDING))),
	    // 	min_padding_pct = MAX_NODE_RADIUS + 2 * PADDING;

	    // Take minimum node width.
	    var node_width = [top_width_pct, bottom_width_pct].reduce(function(m, v) { return m < v ? m : v; }, min_padding_pct),
		padding = node_width * PADDING,
		radius = (node_width - 2*padding) / 2.0;
		    //radius = (node_width - 2 * PADDING) * this.width;

	    // Evenly distribute additional padding to each node.
	    var top_padding = (1.0 - (num_top_nodes * node_width)) / (num_top_nodes),
		bottom_padding = (1.0 - (num_bottom_nodes * node_width)) / (num_bottom_nodes);

	    // Assign to each node a position.
	    var top_x_pos = 0,
		bottom_x_pos = 0;
	    for (var i = 0; i < this.nodes.length; ++i) {
		this.nodes[i].radius = radius * this.width;
		if (this.nodes[i].position === 'top') {
		    top_x_pos += (node_width + top_padding) / 2.0;
		    this.nodes[i].x = top_x_pos * this.width;
		    this.nodes[i].y = (node_width - 2 * padding) * this.width  + TOP_BOTTOM_MARGINS * this.height;
		    top_x_pos += (node_width + top_padding) / 2.0;
		} else {
		    bottom_x_pos += (node_width + bottom_padding) / 2.0;
		    this.nodes[i].x = bottom_x_pos * this.width;
		    this.nodes[i].y = this.height - (node_width - 2 * padding) * this.width - TOP_BOTTOM_MARGINS * this.height;
		    bottom_x_pos += (node_width + bottom_padding) / 2.0;
		}
	    }
	    return this;
	},
	drawNodes : function(highlightedNames) {
	    function nodeBackground(node) {
		if (node.dead) {
		    return '#aaa';
		} else if (node.proposal) {
		    return '#cfc';
		} else {
		    return '#fff';
		}
	    }

	    this.ctx.save();
	    this.ctx.textAlign = 'center';
	    this.ctx.textBaseline = 'middle';
	    this.ctx.font = '12px sans-serif';
	    this.ctx.lineWidth = LINE_WEIGHT;
	    for (var i = 0; i < this.nodes.length; ++i) {
		if (highlightedNames.hasOwnProperty(this.nodes[i].name)) {
		    this.ctx.strokeStyle = HIGHLIGHTED_COLOR;
		} else {
		    this.ctx.strokeStyle = '#000';
		}
		this.ctx.fillStyle = nodeBackground(this.nodes[i]);
		this.ctx.beginPath();
		try {
		    this.ctx.arc(this.nodes[i].x, this.nodes[i].y, this.nodes[i].radius, 0, 2 * Math.PI);
		} catch (e) {
		    console.log(this.nodes[i]);
		    throw e;
		}
		this.ctx.closePath();
		this.ctx.fill();
		this.ctx.stroke();
		this.ctx.fillStyle = '#000';
		var display_text = this.nodes[i].name;
		if (this.nodes[i].proposal && !this.nodes[i].dead) {
		    display_text += ' (' + this.nodes[i].proposal.toFixed(2) + ')';
		}
		this.ctx.save();
		this.ctx.strokeStyle = nodeBackground(this.nodes[i]);
		this.ctx.lineWidth = LINE_WEIGHT;
		this.ctx.strokeText(display_text, this.nodes[i].x, this.nodes[i].y);
		this.ctx.restore();
		this.ctx.fillText(display_text, this.nodes[i].x, this.nodes[i].y );
	    }
	    this.ctx.restore();
	    return this;
	},
	drawEdges : function(highlightedNames) {
	    var edgesToHighlight = [];
	    this.ctx.save();
	    this.ctx.lineWidth = LINE_WEIGHT;
	    for (var i = 0; i < this.edges.length; ++i) {
		var from_node = this.nodeMap[this.edges[i].from],
		    to_node = this.nodeMap[this.edges[i].to];

		if (from_node === undefined || to_node === undefined) {
		    throw new Error('Unable to draw edge: count not find node. ' + JSON.stringify(this.edges[i]));
		} else if (from_node.position === to_node.position) {
		    throw new Error('Unable to draw edge from ' + from_node.position + ' to ' + to_node.position);
		}

		if (highlightedNames.hasOwnProperty(from_node.name) ||
		    highlightedNames.hasOwnProperty(to_node.name)) {
		    edgesToHighlight.push([from_node, to_node]);
		    continue;
		}


		this.ctx.beginPath();
		this.ctx.moveTo(from_node.x, from_node.y);
		this.ctx.lineTo(to_node.x, to_node.y);
		this.ctx.closePath();
		this.ctx.stroke();
	    }
	    this.ctx.strokeStyle = HIGHLIGHTED_COLOR;
	    for (var i = 0; i < edgesToHighlight.length; ++i ) {
		var from_node = edgesToHighlight[i][0],
		    to_node = edgesToHighlight[i][1];
		this.ctx.beginPath();
		this.ctx.moveTo(from_node.x, from_node.y);
		this.ctx.lineTo(to_node.x, to_node.y);
		this.ctx.closePath();
		this.ctx.stroke();
	    }
	    this.ctx.restore();
	    return this;
	},
	clear : function() {
	    this.ctx.clearRect(0, 0, this.width, this.height);
	    return this;
	},
	draw : function(highlightedNodes) {
	    highlightedNodes = highlightedNodes || [];
	    var highlightedNames = {};
	    for (var i = 0; i < highlightedNodes.length; ++i) {
		highlightedNames[highlightedNodes[i].name] = true;
	    }
	    return this.clear().drawEdges(highlightedNames).drawNodes(highlightedNames);
	},
	getNodeByLocation : function(x,y) {
	    var TOLERANCE = LINE_WEIGHT; // n pixels.
	    for (var i = 0; i < this.nodes.length; ++i) {
		if (Math.sqrt(Math.pow(this.nodes[i].x - x, 2) + 
			      Math.pow(this.nodes[i].y - y, 2)) < (this.nodes[i].radius + TOLERANCE)) {
		    return this.nodes[i];
		}
	    }
	    return null;
	},
	bindClick : function(action) {
	    var self = this;
	    this.$el.click(function(e) {
		e.preventDefault();
		var offset = $(this).offset(),
		    clicked_node = self.getNodeByLocation(e.pageX - offset.left,
							  e.pageY - offset.top);

		if (clicked_node !== null) {
		    e.stopPropagation();
		    action.call(self, clicked_node);
		}
	    });
	},
	displayAcceptDialog : function(node) {
	    if (!node.proposal || node.dead) {
		return;
	    }

	    var submit = this.$dialog.find('button[type="submit"]:first'),
		self = this;
	    this.$dialog.find('[data-field="player"]:first').text(node.name);
	    this.$dialog.find('[data-field="amount"]:first').text(node.proposal);
	    this.$dialog.find('input[name="proposer"]').val(node.name);
	    this.$dialog.show();
	    $(window).on('click.proposal_modal', function(e) {

		for (var curr_el = e.target; curr_el; curr_el = curr_el.parentElement) {
		    if (curr_el === self.$dialog[0]) {
			return;
		    }
		}

	    	e.preventDefault();
	    	self.$dialog.hide();
	    	$(window).off('.proposal_modal');
	    });
	    submit.on('click', function(e) {
		e.preventDefault();
		self.$dialog.hide();
		submit.off('click');
	    });
	},
	bindHover : function(action) {
	    var self = this;
	    this.$el.on('mousemove', function(e) {
		e.preventDefault();
		var offset = $(this).offset(),
		    moused_node = self.getNodeByLocation(e.pageX - offset.left,
							 e.pageY - offset.top);

		action.call(self, moused_node);
	    });
	},
	highlightNode : function(maybeNode) {
	    var nodes = [];
	    if (maybeNode) {
		nodes.push(maybeNode);
	    }
	    this.draw(nodes);
	}
    };

    return BipartiteNetwork;

})();
