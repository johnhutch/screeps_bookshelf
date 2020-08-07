var roleFiller = require('role.filler');

module.exports = {
    run: function(creep) {
        // if creep is trying to repair something but has no energy left
        if (creep.memory.working == true && creep.carry.energy == 0) {
            let target = Game.getObjectById(creep.memory.targetId);
            // switch state
            creep.memory.working = false;
            delete creep.room.memory.roads[target.rdMemval()];
            creep.memory.targetId = null;
        }
        // if creep is harvesting energy but is full
        else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            // switch state
            creep.memory.working = true;
            module.exports.findTarget(creep);
        }

        // if creep is supposed to repair something
        if (creep.memory.working == true) {
            if (creep.room.memory.cowpaths == undefined) {
                creep.room.memory.cowpaths = {};
            }
            if (creep.room.memory.roads == undefined) {
                creep.room.memory.roads = {};
            }

            let target = Game.getObjectById(creep.memory.targetId);
            // if we find a road that has to be repaired
            if (target != null) {
                //console.log(creep.room.name + ": " + target);
                // try to repair it, if not in range
                //console.log(creep.repair(target));
                if (creep.repair(target) == ERR_NOT_IN_RANGE) {
                    // move towards it
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#00ff00'}});
                } 
                if (target.hits == target.hitsMax) {
                    module.exports.findTarget(creep);
                }
            }
            else {
                // if we don't have a target, look for one
                module.exports.findTarget(creep);
            }
        }
        else {
            // creep is not working and should get energy
            creep.getEnergy(true, false);
        }
    },

    findTarget: function(creep) {
        // find all roads in the room
        var roads = creep.room.find(FIND_STRUCTURES, {
            filter: (s) => s.structureType == STRUCTURE_ROAD
                        && creep.room.memory.roads[s.rdMemval()] == true
        });
        if (roads.length > 0) {
            roads = _.sortBy(roads, (r) => { return r.hits  });
            creep.memory.targetId = roads[0].id;
        } else {
            creep.memory.targetId = null;
        }
    }
};
