var roleUpgrader = require('role.upgrader');
// role hauler
module.exports = {
    run: function(creep) {

        creep.buildRoad();

        // if creep is bringing energy to a structure but has no energy left
        if (creep.memory.working == true && _.sum(creep.store) == 0) {
            // switch state
            creep.memory.working = false;
        }
        // if creep is harvesting energy but is full
        else if (creep.memory.working == false && _.sum(creep.store) == creep.store.getCapacity() ) {
            // switch state
            creep.memory.working = true;
        }

        // if creep is supposed to transfer energy to a structure
        if (creep.memory.working == true) {
            creep.unload();
        }
        // if creep is supposed to get energy
        else {
            // look for dropped resources from dead creeps
            let dropped_resource = creep.pos.findClosestByPath(FIND_DROPPED_RESOURCES);
            if (dropped_resource == undefined) {
                // find closest container
                container = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                    filter: s => (s.structureType == STRUCTURE_CONTAINER)
                              && s.store.getFreeCapacity() < s.store.getCapacity()
                });

                // if we didn't find a container with resources to be picked up
                if (container == undefined) {
                    // and if we have a terminal
                    if (creep.room.terminal) {
                        // grab some energy from storage
                        container = creep.room.terminal
                    } else {
                        // otherwise, grab it from storage
                        container = creep.room.storage;
                    }
                }

                // if one was found
                if (container != undefined) {
                    // try to withdraw energy, if the container is not in range
                    if (creep.withdraw(container, _.findKey(container.store)) == ERR_NOT_IN_RANGE) {
                        // move towards it
                        creep.moveTo(container, {visualizePathStyle: {stroke: '#ff0000'}});
                    }
                } 
            } else {
                if (creep.pickup(dropped_resource) == ERR_NOT_IN_RANGE) {
                    // move towards it
                    creep.moveTo(dropped_resource, {visualizePathStyle: {stroke: '#ff0000'}});
                }
            }

        }
    }
};
