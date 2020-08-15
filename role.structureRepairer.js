var roleBuilder = require('role.builder');

module.exports = {
    run: function(creep) {
        // if creep is trying to repair something but has no energy left
        if (creep.memory.working == true && creep.store[RESOURCE_ENERGY] == 0) {
            // look and see if we maybe picked up some minerals by accident and unload them
            if (_.sum(creep.store) > 0 ) {
                creep.unload();
            } else {
                creep.memory.working = false;
            }
        }
        // if creep is harvesting energy but is full
        else if (creep.memory.working == false && _.sum(creep.store) == creep.store.getCapacity() ) {
            creep.memory.working = true;
        }

        // if creep is supposed to repair something
        if (creep.memory.working == true) {
            let target = undefined;

            // find all ramparts in the room
            let structures = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => (s.structureType != STRUCTURE_RAMPART
                             && s.structureType != STRUCTURE_WALL
                             && s.structureType != STRUCTURE_ROAD
                             && s.hits < s.hitsMax / 1.2)
            });
            if (structures) {
                structures = _.sortBy(structures, (s) => { return s.hits  });
            }
            target = structures[0];

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
            if (creep.memory.targetRoom != undefined 
             || !creep.room.memory.hasContainers
             || (!creep.room.storage && !creep.room.terminal)
             || creep.room.isBuildingSourceContainers()) {
                creep.getEnergy(true, true);
            } else {
                creep.getEnergy(true, false);
            }
        }
    }
}
