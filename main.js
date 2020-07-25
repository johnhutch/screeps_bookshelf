require('prototype.creep');
require('prototype.spawn');

var roleHarvester = require('role.harvester');
var roleBuilder = require('role.builder');
var roleUpgrader = require('role.upgrader');
var roleMiner = require('role.miner');
var roleFixer = require('role.fixer');
var roleHauler = require('role.hauler');

var destroyAllRoadConstruction = function(roomName) {
    var roads = Game.rooms[roomName].find(FIND_CONSTRUCTION_SITES, { filter: (structure) => { return (structure.structureType == STRUCTURE_ROAD) } });
    console.log('dstroying road ' + roads)
    for (var i=0; i < roads.length; i++) {
        roads[i].remove();
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

var spawnNew = function(role, this_room) {
    let creepsInRoom = this_room.find(FIND_MY_CREEPS);

    // clear out old creep names from memory
    for(var name in Memory.creeps) {
        if(!Game.creeps[name]) {
            delete Memory.creeps[name];
            console.log('Clearing non-existing creep memory:', name);
        }
    }
    
    // create a big or lil creep with the given params 
    var newName = role + Game.time;
    
    switch(role) {
        case "miner":
            // check if all sources have miners
            let sources = this_room.find(FIND_SOURCES);
            // iterate over all sources
            for (let source of sources) {
                // if the source has no miner
                if (!_.some(creepsInRoom, c => c.memory.role == 'miner' && c.memory.sourceId == source.id)) {
                    // check whether or not the source has a container
                    /** @type {Array.StructureContainer} */
                    let containers = source.pos.findInRange(FIND_STRUCTURES, 1, {
                        filter: s => s.structureType == STRUCTURE_CONTAINER
                    });
                    // if there is a container next to the source
                    if (containers.length > 0) {
                        // spawn a miner
                        //console.log('Spawning new miner,' + newName + ', with ' + this_room.energyAvailable + ' energy');
                        if (this_room.energyAvailable >= 550) {
                            this_room.find(FIND_MY_SPAWNS)[0].spawnCreep([WORK, WORK, WORK, WORK, WORK, MOVE], newName,
                                {memory: {role: role, sourceId: source.id}});
                        } else {
                            if (this_room.energyAvailable >= 450) {
                                this_room.find(FIND_MY_SPAWNS)[0].spawnCreep([WORK, WORK, WORK, WORK, MOVE], newName,
                                    {memory: {role: role, sourceId: source.id}});
                            } else {
                                this_room.find(FIND_MY_SPAWNS)[0].spawnCreep([WORK, WORK, MOVE], newName,
                                    {memory: {role: role, sourceId: source.id}});
                            }
                        }
                    }
                }
            }
            break;

        case "hauler":
            //console.log('Spawning new hauler:' + newName + ', with ' + this_room.energyAvailable + ' energy');
            this_room.find(FIND_MY_SPAWNS)[0].spawnCreep([MOVE, MOVE, CARRY, CARRY], newName,
                {memory: {role: role}});
            break;
        case "upgrader":
            //console.log('Spawning new hauler:' + newName + ', with ' + this_room.energyAvailable + ' energy');
            this_room.find(FIND_MY_SPAWNS)[0].spawnCreep([MOVE, CARRY, WORK, WORK, WORK, WORK], newName,
                {memory: {role: role}});
            break;
        default:
            if (this_room.energyAvailable >= 550) {
                console.log('Spawning new Big ' + role + ": " + newName);
                this_room.find(FIND_MY_SPAWNS)[0].spawnCreep([WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE], "Big" + newName,
                    {memory: {role: role}});
            } else {
                console.log('Spawning new Lil ' + role + ": " + newName);
                this_room.find(FIND_MY_SPAWNS)[0].spawnCreep([WORK, CARRY, MOVE], "Lil" + newName,
                    {memory: {role: role}});
            }
    }
    
    // display the spawning icon and status next to the spawn
    if(Game.spawns['Spawn_Flynn'].spawning) {
    var spawningCreep = Game.creeps[Game.spawns['Spawn_Flynn'].spawning.name];
    Game.spawns['Spawn_Flynn'].room.visual.text(
        '🛠️' + spawningCreep.memory.role,
        Game.spawns['Spawn_Flynn'].pos.x + 1,
        Game.spawns['Spawn_Flynn'].pos.y,
        {align: 'left', opacity: 0.8});
    }
}
 
var utilizeTowers = function(roomName) {
    var towers = Game.rooms[roomName].find(
        FIND_MY_STRUCTURES, {filter: {structureType: STRUCTURE_TOWER}});
    
    towers.forEach(function (tower) {
        var closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (structure) => structure.hits < structure.hitsMax / 1.5
        });
        if(closestDamagedStructure) {
            tower.repair(closestDamagedStructure);
        }

        var closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
        if(closestHostile) {
            var username = hostiles[0].owner.username;
            Game.notify(`User ${username} spotted in room ${roomName}`);
            tower.attack(closestHostile);
        }
    });
}

module.exports.loop = function () {
    // check for memory entries of died creeps by iterating over Memory.creeps
    for (let name in Memory.creeps) {
        // and checking if the creep is still alive
        if (Game.creeps[name] == undefined) {
            // if not, delete the memory entry
            delete Memory.creeps[name];
        }
    }

    // for each spawn
    for (let spawnName in Game.spawns) {
        // run spawn logic
        Game.spawns[spawnName].spawnCreepsIfNecessary();
    }

    for(var name in Game.rooms) {
        //   console.log('Room "'+name+'" has '+Game.rooms[name].energyAvailable+' energy');
        utilizeTowers(name);
        // buildNewRoads(name);
        //destroyAllRoadConstruction(name);
    }

    // for each creeps
    for (let name in Game.creeps) {
        // run creep logic
        Game.creeps[name].runRole();
    }
}
