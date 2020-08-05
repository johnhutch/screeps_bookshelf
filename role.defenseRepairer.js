var roleBuilder = require('role.builder');

// role defenseRepairer
module.exports = {
    // a function to run the logic for this role
    /** @param {Creep} creep */
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

            // find all ramparts and walls in the room
            var targets = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => s.structureType == STRUCTURE_RAMPART 
                          || s.structureType == STRUCTURE_WALL
            });
            if (targets) {
                targets = _.sortBy(targets, (r) => { return r.hits  });
                target = targets[0];
            }

            // if we find a rampart or wall that has to be repaired
            if (target != undefined) {
                // try to repair it, if not in range
                if (creep.repair(target) == ERR_NOT_IN_RANGE) {
                    // move towards it
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#00ff00'}});
                }
            }
            else {
                // if we can't fine one look for construction sites
                roleBuilder.run(creep);
            }
        }
        // if creep is supposed to get energy
        else {
            creep.getEnergy(true, false);
        }
    }
};
