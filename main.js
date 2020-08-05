require('prototype.room');
require('prototype.creep');
require('prototype.spawn');
require('prototype.tower');
require('prototype.road');

var destroyAllRoadConstruction = function(roomName) {
    var roads = Game.rooms[roomName].find(FIND_CONSTRUCTION_SITES, { filter: (structure) => { return (structure.structureType == STRUCTURE_ROAD) } });
    console.log('dstroying road ' + roads)
    for (var i=0; i < roads.length; i++) {
        roads[i].remove();
    }
}

var destroyAllConstruction = function(roomName) {
    var consites = Game.rooms[roomName].find(FIND_CONSTRUCTION_SITES);
    console.log('destroying construction ' + consites)
    for (var i=0; i < consites.length; i++) {
        consites[i].remove();
    }
}

var buildNewRoads = function(roomName) {
    var targets = Game.rooms[roomName].find(FIND_STRUCTURES, {
            filter: (structure) => {
            return (structure.structureType == STRUCTURE_EXTENSION || structure.structureType == STRUCTURE_SPAWN)           
        }
    });
    var sources = Game.rooms[roomName].find(FIND_SOURCES);
    for (var j = 0; j < sources.length; j++)
    {
        var chemin = targets[0].pos.findPathTo(sources[j].pos);
        for (var i = 0; i < chemin.length; i++) 
        {
            for (var k = 0; k < targets.length; k++) {
                 targets[k].room.createConstructionSite(chemin[i].x,chemin[i].y, STRUCTURE_ROAD);
            }
        }
    }
}

module.exports.loop = function () {

    // little one-off functions I can turn on and off
    for(var name in Game.rooms) {
        // console.log('Room "'+name+'" has '+Game.rooms[name].energyAvailable+' energy');
        // buildNewRoads(name);
        // destroyAllRoadConstruction(name);
        // destroyAllConstruction(name);
    }
    
    // clean dead creeps out of memory
    for (let name in Memory.creeps) {
        // and checking if the creep is still alive
        if (Game.creeps[name] == undefined) {
            // if not, delete the memory entry
            delete Memory.creeps[name];
        }
    }

    for (let roomName in Game.rooms) {
        Game.rooms[roomName].checkForContainers();
        Game.rooms[roomName].balanceLinks();
    }

    // spawn some stuff maybe
    for (let spawnName in Game.spawns) {
        Game.spawns[spawnName].spawnCreepsIfNecessary();
    }

    // ferda creeps
    for (let name in Game.creeps) {
        Game.creeps[name].runRole();
        // TODO; include an "if hostiles present, runRole attacker/defender" bit
    }

    // ferda towers
    var towers = _.filter(Game.structures, s => s.structureType == STRUCTURE_TOWER);
    for (let tower of towers) {
        tower.defend();
        tower.make_repairs();
    }
}
