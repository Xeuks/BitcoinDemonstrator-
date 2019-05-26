'use strict';

function NetworkVisualizationController($scope, bitcoinNetwork) {

    bitcoinNetwork.addListener(this);

    $scope.idMapping = ["", "a", "b", "c", "d", "e"];



    $scope.$on('$destroy', function() {
        bitcoinNetwork.removeListener(this);
    });

    $scope.lastAnimationInfos = {};
    $scope.animationFinished = true;

    this.onNewBlock = function(block) {
        $('#exampleModalCenter').modal('show');


        $( "#exampleModalCenter" ).on('shown.bs.modal', function(){
            $scope.cy.resize();
            $scope.cy.fit();
            $scope.cy.zoom({
                level: 1.0, // the zoom level
            });
        });

        $scope.lastAnimationInfos = {
            from: block.minedBy,
            isValid: block.isValid(),
            image: "./images/block.jpg"
        };

        $scope.startAnimation($scope.lastAnimationInfos);

    };

    this.onNewTransaction = function(transaction) {
        $('#exampleModalCenter').modal('show');

        $( "#exampleModalCenter" ).on('shown.bs.modal', function(){
            $scope.cy.resize();
            $scope.cy.fit();
            $scope.cy.zoom({
                level: 1.0, // the zoom level
            });
        });

        $scope.lastAnimationInfos = {
            from: transaction.from,
            isValid: true,
            image: "./images/transaction.jpg"
        };

        $scope.startAnimation($scope.lastAnimationInfos);

    };

    $scope.startAnimation = function(animationInfo) {

        var sentToNeighborNode = [];

        $scope.cy.$("node").forEach(function (node) {
            sentToNeighborNode[node.id()] = [];
        });

        var animatePropagation = function(sourceNode) {
            var nodeId ="#" + sourceNode;

            var nextNodes = $scope.cy.$(nodeId).neighborhood("node");


            nextNodes.forEach(function (neighborNode) {


                 var alreadyVisited = sentToNeighborNode[sourceNode].find(function(visitedNode) {
                     return neighborNode.id() === visitedNode;
                 });

                 if(alreadyVisited === undefined){

                    var neighborNodeId = neighborNode.id();
                    var tmpId = "tmp" + neighborNodeId + sourceNode + animationInfo.from;

                    var pos = $scope.cy.$(nodeId).position();
                    $scope.cy.add({ group: 'nodes', data: { id: tmpId  }, position: {x:pos.x, y: pos.y}});

                     $scope.cy.$("#"+tmpId).forEach(function(node) {
                         node.style("background-image", animationInfo.image);
                         node.style("background-fit", "contain");
                         node.style("shape", "rectangle");
                     });

                    $scope.cy.$('#' + tmpId).animate({
                        position: neighborNode.position(),
                    }, {
                        duration: 2750,
                        complete : function() {

                            $scope.cy.$('#' + tmpId).remove();
                            if (animationInfo.isValid) {

                                sentToNeighborNode[neighborNodeId].push(sourceNode);
                                animatePropagation(neighborNodeId);
                            }
                        }
                    });

                    sentToNeighborNode[sourceNode].push(neighborNodeId);
                 }
            });

        };

        animatePropagation($scope.idMapping[animationInfo.from]);
    };

    $scope.cy = cytoscape({
        container: document.getElementById('cy'),

        elements: {
            nodes: [
                { data: { id: 'a' } },
                { data: { id: 'b' } },
                { data: { id: 'c' } },
                { data: { id: 'd' } },
                { data: { id: 'e' } },

            ],

            edges: [
                { data: { id: 'ae', weight: 1, source: 'a', target: 'e' } },
                { data: { id: 'ab', weight: 1, source: 'a', target: 'b' } },
                { data: { id: 'be', weight: 1, source: 'b', target: 'e' } },
                { data: { id: 'bc', weight: 1, source: 'b', target: 'c' } },
                { data: { id: 'ce', weight: 1, source: 'c', target: 'e' } },
                { data: { id: 'cd', weight: 1, source: 'c', target: 'd' } },
                { data: { id: 'de', weight: 1, source: 'd', target: 'e' } }
            ]
        },

        layout: {
            name: 'breadthfirst',
            roots: '#a',
            spacingFactor: 3.5
        },

        userZoomingEnabled: false,
        userPanningEnabled: false,
        boxSelectionEnabled: false,

    });

    $scope.cy.nodes().ungrabify();

    var walletImg = "./images/walletIcon.png";
    var minerImg = "./images/minerIcon.jpg";
    var metaData = {
        "a": {title:"wallet1", img:walletImg},
        "b": {title:"wallet2", img:walletImg},
        "c": {title:"miner1", img:minerImg},
        "d": {title:"miner2", img:minerImg},
        "e": {title:"miner3", img:minerImg}
    };


    $scope.cy.$("node").forEach(function(node) {
        node.style("content", metaData[node.id()].title);
        node.style("background-image", metaData[node.id()].img);
        node.style("background-fit", "contain");
        node.style("shape", "rectangle");
    });

}

angular.module('myApp').component('networkVisualization', {
    templateUrl: 'networkVisualization/view.html',
    controller: NetworkVisualizationController
});