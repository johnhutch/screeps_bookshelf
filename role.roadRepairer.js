var roleFiller = require('role.filler');

module.exports = {
    run: function(creep) {
        // if creep is trying to repair something but has no energy left
        if (creep.memory.working == true && creep.carry.energy == 0) {
            // switch state
            creep.memory.working = false;
        }
        // if creep is harvesting energy but is full
        else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            // switch state
            creep.memory.working = true;
        }

        // if creep is supposed to repair something
        if (creep.memory.working == true) {
            var target = undefined;

            if (creep.room.memory.cowpaths == undefined) {
                creep.room.memory.cowpaths = {};
            }
            if (creep.room.memory.roads == undefined) {
                creep.room.memory.roads = {};
            }

            // find all roads in the room
            var roads = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType == STRUCTURE_ROAD
                            && creep.room.memory.roads[s.rdMemval()] == true
            });
            if (roads) {
                roads = _.sortBy(roads, (r) => { return r.hits  });
                target = roads[0];
            }

            // if we find a road that has to be repaired
            if (target != undefined) {
                // try to repair it, if not in range
                if (creep.repair(target) == ERR_NOT_IN_RANGE) {
                    // move towards it
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#00ff00'}});
                } else {
                    creep.room.memory.roads[target.rdMemval()] = false;
                }
            }
            else {
                // if we can't fine one look for construction sites
                roleFiller.run(creep);
            }
        }
        // if creep is supposed to get energy
        else {
            creep.getEnergy(true, false);
        }
    }
};
