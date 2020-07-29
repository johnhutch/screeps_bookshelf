var roleBuilder = require('role.builder');

module.exports = {
    run: function(creep) {
        // if creep is trying to repair something but has no energy left
        if (creep.memory.working == true && creep.carry.energy == 0) {
            creep.memory.working = false;
        }
        // if creep is harvesting energy but is full
        else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {
            creep.memory.working = true;
        }

        // if creep is supposed to repair something
        if (creep.memory.working == true) {
            let target = undefined;

            // find all ramparts in the room
            let structures = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => (s.structureType != STRUCTURE_RAMPART
                             && s.structureType != STRUCTURE_WALL)
            });
            if (structures) {
                structures = _.sortBy(structures, (s) => { return s.hits  });
            }

            // loop through to find a target to repair
            for (s in structures) {
                // if it's a road, check to see if we've walked over it recently before repairing it
                if (s.structureType == STRUCTURE_ROAD) {
                    let memval = s.rdMemval();
                    if (creep.room.memory.roads[memval]) {
                        target = s;
                        delete creep.room.memory.roads[memval];
                        break;
                    }
                } else {
                    // it's not a road, just fix it
                    target = s;
                    break;
                }

                // if there is one
                if (target != undefined) {
                    // break the loop
                    break;
                }
            }

            // if we find a structure that has to be repaired
            if (target != undefined) {
                // try to repair it, if not in range
                if (creep.repair(target) == ERR_NOT_IN_RANGE) {
                    // move towards it
                    creep.moveTo(target, {visualizePathStyle: {stroke: '#00ff00'}});
                }
            }
            // if we can't fine one
            else {
                // look for construction sites
                roleBuilder.run(creep);
            }
        }
            // if creep is supposed to get energy
        else {
            creep.getEnergy(true, false);
        }
    }
}
